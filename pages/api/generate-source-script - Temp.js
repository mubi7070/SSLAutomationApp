import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

// Generate strong 12-character password (alphanumeric + special characters)
function generatePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Function to properly escape paths for PowerShell
function escapePowerShellPath(p) {
  if (!p) return '';
  // Convert forward slashes to backslashes
  let fixed = p.replace(/\//g, '\\');

  // Remove duplicate backslashes (e.g. E:\\\ -> E:\)
  fixed = fixed.replace(/\\\\+/g, '\\');

  // Escape only quotes for PowerShell
  fixed = fixed.replace(/"/g, '`"');

  return fixed;
}

// Function to process exclude paths for include mode (robust, returns ABSOLUTE excludes)
function processExcludePathsForIncludeMode(includePaths, excludePaths) {
  const processedExclusions = [];
  const seen = new Set();

  function normalize(p) {
    if (!p) return '';
    // Trim and convert forward to backslashes, remove trailing slashes
    return p.trim().replace(/\//g, '\\').replace(/[\\]+$/, '');
  }

  function looksLikeFile(lastSegment) {
    // Heuristic: has an extension (dot followed by chars) OR starts with '.' (e.g. .env)
    return /\.[^\\\/]+$/.test(lastSegment) || /^\.[^\\\/]+$/.test(lastSegment);
  }

  console.log('Processing exclusions for include mode (producing absolute excludes):');
  console.log('Include paths:', includePaths);
  console.log('Exclude paths:', excludePaths);

  // Normalize includes to compare (no filesystem calls)
  const normalizedIncludes = includePaths.map(inc => normalize(inc));

  for (const rawExclude of excludePaths) {
    const exclude = normalize(rawExclude);
    let matched = false;

    for (const inc of normalizedIncludes) {
      // Case-insensitive comparison
      if (exclude.toLowerCase().startsWith(inc.toLowerCase())) {
        matched = true;

        // If exclude equals include (user asked to exclude the include root)
        if (exclude.toLowerCase() === inc.toLowerCase()) {
          // Exclude all contents of that include root (absolute)
          const pattern = `${inc}\\*`;
          if (!seen.has(pattern)) { seen.add(pattern); processedExclusions.push(pattern); }
          console.log(`✓ Excluding all contents under include root: '${pattern}'`);
          break;
        }

        // Exclude is inside include: decide file vs directory by heuristic on last segment
        const rel = exclude.substring(inc.length).replace(/^\\+/, ''); // relative path inside include
        const lastSegment = rel.split('\\').pop() || '';

        if (looksLikeFile(lastSegment)) {
          // Treat as file -> exclude exact absolute file
          const pattern = exclude; // absolute file path
          if (!seen.has(pattern)) { seen.add(pattern); processedExclusions.push(pattern); }
          console.log(`✓ Excluding file: '${pattern}'`);
        } else {
          // Treat as directory -> exclude contents only (absolute dir\*)
          const pattern = exclude;
          if (!seen.has(pattern)) { seen.add(pattern); processedExclusions.push(pattern); }
          console.log(`✓ Excluding entire folder: '${pattern}'`);
        }
        break; // stop checking other includes
      }
    }

    if (!matched) {
      // Exclude not under any include => ignore (you already handle absolute exclude mode separately)
      console.log(`Info: Exclusion '${rawExclude}' is not inside any include path - ignoring`);
    }
  }

  console.log('Final processed exclusions (absolute patterns):', processedExclusions);
  return processedExclusions;
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

     const {
        drive,
        clientName,
        excludePaths = [],
        includePaths = [],
        mode = 'exclude',
        stopDisableServices = false,
        stopTomcat = false,
        stopMySQL = false,
        sourceTomcatServiceName = 'Tomcat9',
        sourceMySQLServiceName = 'MySQL8'
    } = req.body;



    // Validate input parameters
    if (!drive || !clientName) {
        return res.status(400).json({ error: 'Drive and client name are required' });
    }

    console.log(`
    drive: ${drive},
    clientName: ${clientName},
    excludePaths: ${JSON.stringify(excludePaths)},
    includePaths: ${JSON.stringify(includePaths)},
    mode: ${mode},
    stopDisableServices: ${stopDisableServices},
    stopTomcat: ${stopTomcat},
    stopMySQL: ${stopMySQL},
    sourceTomcatServiceName: ${sourceTomcatServiceName},
    sourceMySQLServiceName: ${sourceMySQLServiceName}
    `);
    
    // Generate formatted date (MMDDYY)
    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
    const s3Folder = `${clientName} - ${formattedDate}`;
    const archiveName = `${clientName}-${formattedDate}.rar`;

    // Add migration artifacts to default exclusions
    const migrationFolder = `${clientName}-ServerMigration-${formattedDate}`;
    const migrationScript = `migration-source-${clientName}.ps1`;

    // Create S3 folder from the backend
    try {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        });
        
        const folderCommand = new PutObjectCommand({
            Bucket: process.env.S3_MIGRATION_BUCKET_NAME,
            Key: `${s3Folder}/`,  // Trailing slash makes it a folder
        });
        
        await s3Client.send(folderCommand);
    } catch (error) {
        console.error('Error creating S3 folder:', error);
        return res.status(500).json({ 
            error: 'Failed to create S3 folder. Check AWS credentials and bucket permissions.' 
        });
    }

    // Default exclusions
    const defaultExclusions = [
    'pagefile.sys',
    'System Volume Information',
    '$Recycle.Bin',
    'hiberfil.sys',
    'swapfile.sys',
    'Windows',
    'Recovery',
    'PerfLogs',
    `${migrationFolder}\\`,
    `${migrationFolder}\\${archiveName}`,
    `${drive}:\\${clientName}-ServerMigration-${formattedDate}.ps1`
    ];

    // Process exclusions based on mode
    let allExclusions;
    if (mode === 'include') {
        // For include mode, process exclusions to be relative to include paths
        allExclusions = [
            ...defaultExclusions,
            ...processExcludePathsForIncludeMode(includePaths, excludePaths)
        ];
    } else {
        // For exclude mode, use all exclusions as-is
        allExclusions = [
            ...defaultExclusions,
            ...excludePaths
        ];
    }

    // Format paths for PowerShell - wrap each path in quotes and escape
    const includePathsFormatted = includePaths.map(path => `'${escapePowerShellPath(path)}'`);
    const excludePathsFormatted = allExclusions.map(path => `"${escapePowerShellPath(path)}"`);
    

    // Create PowerShell script
    const script = `
# Server Migration Source Script
# Requires WinRAR installed (https://www.rarlab.com/)
# Generated: ${new Date().toISOString()}
# Client: ${clientName}
# Drive: ${drive}

param(
    [string]$DriveLetter = "${drive}",
    [string]$ClientName = "${clientName}",
    [string]$Mode = "${mode}",
    [string[]]$IncludePaths = @(
        ${includePathsFormatted.join(",\n        ")}
    ),
    [string[]]$ExcludePaths = @(
        ${excludePathsFormatted.join(",\n        ")}
    ),
    [bool]$StopDisableServices = $${stopDisableServices},
    [bool]$StopTomcat = $${stopTomcat},
    [bool]$StopMySQL = $${stopMySQL},
    [string]$TomcatServiceName = "${sourceTomcatServiceName}",
    [string]$MySQLServiceName = "${sourceMySQLServiceName}"
)

# AWS Configuration
$env:AWS_ACCESS_KEY_ID = "${process.env.AWS_ACCESS_KEY_ID}"
$env:AWS_SECRET_ACCESS_KEY = "${process.env.AWS_SECRET_ACCESS_KEY}"
$env:AWS_REGION = "${process.env.AWS_REGION}"

# Parameters
$WinRARPath = "C:\\Program Files\\WinRAR\\WinRAR.exe"
$DateString = "${formattedDate}"
$MigrationFolder = "${drive}:\\${clientName}-ServerMigration-${formattedDate}"
$ArchiveName = "${clientName}-${formattedDate}.rar"
$ArchivePath = "$MigrationFolder\\$ArchiveName"
$LogPath = "$MigrationFolder\\${clientName}-${formattedDate}.log"
$BucketName = "${process.env.S3_MIGRATION_BUCKET_NAME}"
$FolderName = "${s3Folder}"

# FUNCTIONS
function Log-Message {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Write-Host $logEntry
    $logEntry | Out-File -FilePath $LogPath -Append -Encoding utf8
}

function Test-CommandExists {
    param([string]$command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try { if(Get-Command $command){ return $true } }
    catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

function Remove-TemporaryFiles {
    param(
        [string]$FolderPath
    )
    $filesToDelete = @(
        "$FolderPath\\upload-to-s3.js",
        "$FolderPath\\node_modules",
        "$FolderPath\\package.json",
        "$FolderPath\\package-lock.json"
    )
    
    foreach ($file in $filesToDelete) {
        if (Test-Path -LiteralPath $file) {
            try {
                if (Test-Path -LiteralPath $file -PathType Container) {
                    Remove-Item -LiteralPath $file -Recurse -Force -ErrorAction Stop
                } else {
                    Remove-Item -LiteralPath $file -Force -ErrorAction Stop
                }
                Log-Message "Deleted temporary file: $file"
            } 
            catch {
                Log-Message "WARNING: Failed to delete $file - $($_.Exception.Message)"
            }
        }
    }
}

# NEW: Function to stop and disable services
function Stop-AndDisableService {
    param(
        [string]$ServiceName,
        [string]$ServiceType
    )
    
    try {
        Log-Message "Checking if $ServiceType service '$ServiceName' exists..."
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        
        if ($service) {
            Log-Message "$ServiceType service '$ServiceName' found. Current status: $($service.Status)"
            
            # Stop the service if it's running
            if ($service.Status -eq 'Running') {
                Log-Message "Stopping $ServiceType service: $ServiceName"
                Stop-Service -Name $ServiceName -Force -ErrorAction Stop
                # Wait for service to stop
                do {
                    Start-Sleep -Seconds 2
                    $service = Get-Service -Name $ServiceName
                } while ($service.Status -eq 'StopPending' -or $service.Status -eq 'Running')
                Log-Message "$ServiceType service stopped successfully"
            } else {
                Log-Message "$ServiceType service is already stopped"
            }
            
            # Disable the service
            Log-Message "Disabling $ServiceType service: $ServiceName"
            Set-Service -Name $ServiceName -StartupType Disabled -ErrorAction Stop
            Log-Message "$ServiceType service disabled successfully"
            
        } else {
            Log-Message "WARNING: $ServiceType service '$ServiceName' not found. Skipping..."
        }
    }
    catch {
        Log-Message "ERROR: Failed to stop/disable $ServiceType service '$ServiceName' - $($_.Exception.Message)"
        throw "Failed to stop/disable $ServiceType service"
    }
}

function Invoke-RobustWinRAR {
    param(
        [string]$WinRARPath,
        [array]$RarCommand,
        [string]$ArchivePath,
        [int]$MaxRetries = 2
    )
    
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            Log-Message "WinRAR attempt $attempt of $MaxRetries"
            
            # Only adjust memory and threads on retry, keep volume splitting as set
            if ($attempt -gt 1) {
                Log-Message "Optimizing parameters for retry attempt..."
                # Remove memory and thread parameters only (keep volume splitting)
                $RarCommand = $RarCommand | Where-Object { 
                    $_ -notlike "-md*" -and $_ -notlike "-mt*" 
                }
                
                # Add optimized parameters
                $RarCommand += "-md1024m"  # Increase dictionary size
                $RarCommand += "-mt4"      # Use 4 threads
                Log-Message "Increased dictionary size and threads for retry"
            }
            
            Log-Message "Executing: $WinRARPath $($RarCommand -join ' ')"
            
            $process = Start-Process -FilePath $WinRARPath -ArgumentList $RarCommand -Wait -NoNewWindow -PassThru
            
            # Handle WinRAR exit codes
            switch ($process.ExitCode) {
                0 { 
                    Log-Message "WinRAR completed successfully"
                    return $true 
                }
                1 { 
                    # Check for volume files first (multi-volume archive)
                    $volumeFiles = Get-ChildItem -Path (Split-Path $ArchivePath) -Filter "$(Split-Path $ArchivePath -Leaf).part*.rar" -ErrorAction SilentlyContinue
                    if ($volumeFiles.Count -gt 0) {
                        $totalSizeGB = [math]::Round(($volumeFiles | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
                        Log-Message "Multi-volume archive created with warnings. Total size: $totalSizeGB GB, Parts: $($volumeFiles.Count)"
                        return $true
                    }
                    # Fall back to single file check
                    if (Test-Path $ArchivePath) {
                        $sizeGB = [math]::Round((Get-Item $ArchivePath).Length / 1GB, 2)
                        Log-Message "Single archive created with warnings (exit code 1). Size: $sizeGB GB"
                        return $true
                    }
                    throw "WinRAR completed with warnings but no archive was created"
                }

                2 { throw "Fatal error in WinRAR" }
                3 { throw "CRC error in WinRAR" }
                4 { throw "Attempt to modify locked archive" }
                5 { throw "Write error in WinRAR" }
                6 { 
                    if ($attempt -eq $MaxRetries) {
                        throw "WinRAR archive creation failed - insufficient memory for large files (exit code 6)"
                    } else {
                        Log-Message "WinRAR exit code 6 (memory issue) - retrying with optimized settings"
                        Start-Sleep -Seconds 10
                        continue
                    }
                }
                7 { throw "User break in WinRAR" }
                8 { 
                    if ($attempt -eq $MaxRetries) {
                        throw "WinRAR archive creation failed - not enough memory (exit code 8)"
                    } else {
                        Log-Message "WinRAR exit code 8 (memory issue) - retrying with optimized settings"
                        Start-Sleep -Seconds 10
                        continue
                    }
                }
                9 { 
                    if ($attempt -eq $MaxRetries) {
                        throw "WinRAR archive creation failed - create file error (exit code 9)"
                    } else {
                        Log-Message "WinRAR exit code 9 (file creation issue) - retrying with optimized settings"
                        Start-Sleep -Seconds 10
                        continue
                    }
                }

                10 { throw "Wrong password for WinRAR" }
                255 { throw "User break or WinRAR process killed" }
                default { 
                    if ($process.ExitCode -ne 0) {
                        throw "WinRAR failed with exit code $($process.ExitCode)"
                    }
                }
            }
        }
        catch {
            if ($attempt -eq $MaxRetries) {
                throw "All WinRAR attempts failed: $($_.Exception.Message)"
            }
            Log-Message "Attempt $attempt failed: $($_.Exception.Message). Retrying..."
            Start-Sleep -Seconds (10 * $attempt)
        }
    }
    return $false
}


# INITIAL SETUP
try {
    # Create migration folder first to ensure logging works
    New-Item -ItemType Directory -Path $MigrationFolder -Force -ErrorAction Stop | Out-Null

    # Start logging with UTF-8 encoding
    "=======================================================" | Out-File -FilePath $LogPath -Encoding utf8
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting migration for client ${clientName}" | Out-File -FilePath $LogPath -Append -Encoding utf8
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Created migration folder: $MigrationFolder" | Out-File -FilePath $LogPath -Append -Encoding utf8
    
    Log-Message "Created migration folder: $MigrationFolder"
    Log-Message "Starting migration for client ${clientName} on drive ${drive}"
}
catch {
    Write-Host "CRITICAL ERROR: Failed to create migration folder [$MigrationFolder]"
    Write-Host $_.Exception.Message
    exit 1
}

# MAIN EXECUTION

try {
    Log-Message "===== MIGRATION STARTED ====="
    Log-Message "Parameters:"
    Log-Message "  Drive: ${drive}"
    Log-Message "  Client: ${clientName}"
    Log-Message "  Mode: $Mode"
    if ($Mode -eq 'include') {
        Log-Message "  Include Paths: $($IncludePaths -join ', ')"
    }
    Log-Message "  Exclude Paths: $($ExcludePaths -join ', ')"

    # NEW: Check NodeJS installation
    Log-Message "Checking NodeJS installation..."
    if (-not (Test-CommandExists "npm")) {
        $msg = "NodeJS (npm) not found. Please install NodeJS from: https://nodejs.org/en/download"
        Log-Message $msg
        throw $msg
    }
    $nodeVersion = npm -v
    Log-Message "NodeJS version: $nodeVersion"

    Log-Message "Checking Winrar installation..."
    # Verify WinRAR installation
    if (-not (Test-Path $WinRARPath)) {
        $msg = "WinRAR not found at '$WinRARPath'. Please install from: https://www.rarlab.com/download.htm"
        Log-Message $msg
        throw $msg
    }

    # Check available disk space (need at least 50GB free for operations)
    $driveInfo = Get-PSDrive -Name $DriveLetter
    $freeSpaceGB = [math]::Round($driveInfo.Free / 1GB, 2)
    if ($freeSpaceGB -lt 50) {
        Log-Message "WARNING: Low disk space on $DriveLetter. Available: $freeSpaceGB GB, Recommended: 50GB+"
    } else {
        Log-Message "Disk space check: $freeSpaceGB GB available on $DriveLetter"
    }

        # NEW: Stop and disable services if requested
    if ($StopDisableServices) {
        Log-Message "===== STOPPING AND DISABLING SERVICES ====="
        
        if ($StopTomcat) {
            Log-Message "Processing Tomcat service: $TomcatServiceName"
            Stop-AndDisableService -ServiceName $TomcatServiceName -ServiceType "Tomcat"
        } else {
            Log-Message "Tomcat service stop/disable skipped (not selected)"
        }
        
        if ($StopMySQL) {
            Log-Message "Processing MySQL service: $MySQLServiceName"
            Stop-AndDisableService -ServiceName $MySQLServiceName -ServiceType "MySQL"
        } else {
            Log-Message "MySQL service stop/disable skipped (not selected)"
        }
        
        Log-Message "===== SERVICE STOP/DISABLE COMPLETED ====="
    } else {
        Log-Message "Service stop/disable skipped (not enabled)"
    }
    
    # Build proper exclusion arguments - SIMPLIFIED VERSION
    $exclusionArgs = New-Object System.Collections.Generic.List[string]
    foreach ($ex in $ExcludePaths) {
        $safeEx = $ex -replace '\`', '\`\`' -replace '"', '\`"'
        $exclusionArgs.Add("-x\`"$safeEx\`"")
        Log-Message "Added exclusion: $ex"
    }

    # Delete existing archive if present
    if (Test-Path $ArchivePath) {
        Remove-Item -Path $ArchivePath -Force
        Log-Message "Deleted existing archive: $ArchivePath"
    }

    # Also delete any existing volume files
    $volumePattern = "$ArchiveName.part*.rar"
    Get-ChildItem -Path (Split-Path $ArchivePath) -Filter $volumePattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -Path $_.FullName -Force
        Log-Message "Deleted existing volume: $($_.Name)"
    }

    # Archive based on mode
    if ($Mode -eq 'include') {
    Log-Message "Starting archive process for included paths with WinRAR (3GB volumes)..."
    
    $cores   = [Environment]::ProcessorCount
    $threads = $cores                               # use ALL cores now
    $mtSwitch = "-mt$threads"                       # build the -mt string

    Log-Message "MT VALUE: $mtSwitch"

    $rarCommand = @(
        "a",            # Add to archive
        "-r",           # Recurse subdirectories
        "-ep1",         # Exclude base folder from names - KEEP THIS
        "-y",           # Assume Yes to all queries
        "-idq",         # Quiet mode (suppress progress)
        "-v3g",         # Split into 3GB volumes
        "-m1",          # Normal compression (fast + decent ratio)
        "-md32m",       # 32 MB dictionary (better ratio, fastest)
        $mtSwitch,      # Use all threads
        "\`"$ArchivePath\`""
    )
    
    # Add each included path - CRITICAL FIX: Use proper quoting for paths with spaces
    foreach ($inc in $IncludePaths) {
        $rarCommand += "\`"$inc\`""
    }
    
    # Add exclusions - IMPORTANT: With -ep1, exclusions are relative to the included paths
    $rarCommand += $exclusionArgs
    
    Log-Message "Include mode command built with $($IncludePaths.Count) include paths and $($exclusionArgs.Count) exclusion patterns"
    Log-Message "Full WinRAR command: $WinRARPath $($rarCommand -join ' ')"
    }

    else {    
    Log-Message "Starting archive process for drive ${drive} with WinRAR (3GB volumes)..."
    $cores   = [Environment]::ProcessorCount
    $threads = $cores                               # use ALL cores now
    $mtSwitch = "-mt$threads"                       # build the -mt string

    Log-Message "MT VALUE: $mtSwitch"

    $rarCommand = @(
        "a",           # Add to archive
        "-r",          # Recurse subdirectories
        "-ep1",        # Exclude base folder from names
        "-y",          # Assume Yes to all queries
        "-idq",        # Quiet mode (suppress progress)
        "-v3g",        # Split into 3GB volumes - ALWAYS ENABLED
        "-m1",         # Normal compression (fast + decent ratio)
        "-md32m",      # 32 MB dictionary (better ratio, fastest)
        $mtSwitch,     # Use all threads
        "$ArchivePath",
        "${drive}:\\*"
    ) + $exclusionArgs

    }

    # Use robust WinRAR function with retry logic
    $success = Invoke-RobustWinRAR -WinRARPath $WinRARPath -RarCommand $rarCommand -ArchivePath $ArchivePath

    if (-not $success) {
        throw "WinRAR archive creation failed after all retry attempts"
    }

    # Check if we have volume files or single archive
    $archiveFiles = @()

    # First check for multi-volume archives (WinRAR creates .part01.rar, .part02.rar, etc.)
    $volumeBaseName = [System.IO.Path]::GetFileNameWithoutExtension($ArchiveName)
    $volumePattern = "$volumeBaseName.part*.rar"
    $volumeFiles = Get-ChildItem -Path (Split-Path $ArchivePath) -Filter $volumePattern | Sort-Object Name

    if ($volumeFiles.Count -gt 0) {
        $totalSizeGB = [math]::Round(($volumeFiles | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        Log-Message "Multi-volume archive created with $($volumeFiles.Count) parts. Total size: $totalSizeGB GB"
        $archiveFiles = $volumeFiles

        # Log each volume file found
        foreach ($volume in $volumeFiles) {
            $sizeGB = [math]::Round($volume.Length / 1GB, 2)
            Log-Message "Volume: $($volume.Name) ($sizeGB GB)"
        }
    } 

    # Check for single archive file
    elseif (Test-Path $ArchivePath) {
        $sizeGB = [math]::Round((Get-Item $ArchivePath).Length / 1GB, 2)
        Log-Message "Single archive created at $ArchivePath (Size: $sizeGB GB)"
        $archiveFiles += (Get-Item $ArchivePath)
    } 

    else {
        # Final attempt: check for any .rar files in the migration folder
        $allRarFiles = Get-ChildItem -Path $MigrationFolder -Filter "*.rar" | Sort-Object Name
        if ($allRarFiles.Count -gt 0) {
            $totalSizeGB = [math]::Round(($allRarFiles | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
            Log-Message "Found $($allRarFiles.Count) RAR files using fallback search. Total size: $totalSizeGB GB"
            $archiveFiles = $allRarFiles
        } else {
            throw "No archive files found after successful WinRAR operation. Checked for: $volumePattern and $ArchiveName"
        }
    }

    # Upload to S3 using AWS SDK for JavaScript
    Log-Message "Uploading to S3 bucket $BucketName..."

    $uploadScript = @"
    const { S3Client } = require("@aws-sdk/client-s3");
    const { Upload } = require("@aws-sdk/lib-storage");
    const fs = require("fs");
    const path = require("path");

    async function uploadToS3() {
      const filePath = path.resolve(process.argv[2]);
      const bucketName = "${process.env.S3_MIGRATION_BUCKET_NAME}";
      const key = process.argv[3];

      try {
        const s3Client = new S3Client({
          region: "$env:AWS_REGION",
          credentials: {
            accessKeyId: "$env:AWS_ACCESS_KEY_ID",
            secretAccessKey: "$env:AWS_SECRET_ACCESS_KEY"
          }
        });
      
        const parallelUploads3 = new Upload({
          client: s3Client,
          params: {
            Bucket: bucketName,
            Key: key,
            Body: fs.createReadStream(filePath)
          },
          leavePartsOnError: false,
          queueSize: 8,        // Optional: concurrent parts
          partSize: 1024 * 1024 * 500 // 500MB
        });

        parallelUploads3.on("httpUploadProgress", (progress) => {
            const loadedMB = (progress.loaded / (1024 * 1024)).toFixed(2);
            const totalMB = progress.total ? (progress.total / (1024 * 1024)).toFixed(2) : 'Unknown';

            console.log("Uploaded:", loadedMB, "MB of", totalMB, "MB");
        });

        await parallelUploads3.done();
        console.log("Upload completed successfully.");
        process.exit(0);
      } catch (err) {
        console.error("S3 upload failed:", err);
        process.exit(1);
      } finally {
        console.log("Finally finished.");
      }
    }

    uploadToS3();
"@

    # Save the upload script to a temporary file
    $uploadScriptPath = "$MigrationFolder\\upload-to-s3.js"
    $uploadScript | Out-File -FilePath $uploadScriptPath -Encoding UTF8
    Log-Message "Created upload script: $uploadScriptPath"

    # Install required npm package
    Log-Message "Installing AWS SDK for S3..."
    Set-Location -Path $MigrationFolder
    npm init -y --quiet 2>&1 | Out-Null
    npm install @aws-sdk/client-s3 @aws-sdk/lib-storage 2>&1 | Out-Null

    # Upload all archive files (single or multi-volume)
    foreach ($archiveFile in $archiveFiles) {
        Log-Message "Uploading: $($archiveFile.Name)..."

    $nodeArgs = @(
        "\`"$uploadScriptPath\`"",
        "\`"$($archiveFile.FullName)\`"",
        "\`"$FolderName/$($archiveFile.Name)\`""
    )

    $nodeProcess = Start-Process -FilePath "node" -ArgumentList $nodeArgs -Wait -NoNewWindow -PassThru

    if ($nodeProcess.ExitCode -ne 0) {
        throw "S3 upload failed for $($archiveFile.Name) with exit code $($nodeProcess.ExitCode)."
    }

    Log-Message "Upload completed for: $($archiveFile.Name)"
    }
        
    Log-Message "All uploads completed successfully"
    Log-Message "===== MIGRATION COMPLETED SUCCESSFULLY ====="

    } catch {
        $errorMsg = $_.Exception.Message
        Log-Message "CRITICAL ERROR: $errorMsg"
        Log-Message "===== MIGRATION FAILED ====="
        exit 1
    } finally {
        # Clean up temporary files immediately
        Remove-TemporaryFiles -FolderPath $MigrationFolder

        Log-Message "Log file maintained at: $LogPath"
        if (Test-Path $ArchivePath) {
            Log-Message "Archive maintained at: $ArchivePath"
        } else {
            $volumeFiles = Get-ChildItem -Path (Split-Path $ArchivePath) -Filter "$(Split-Path $ArchivePath -Leaf).part*.rar" -ErrorAction SilentlyContinue
            if ($volumeFiles.Count -gt 0) {
                Log-Message "Archive volumes maintained at: $(Split-Path $ArchivePath)"
            }
        }
        Log-Message "Script completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        
        # Schedule self-deletion of this script
        $scriptPath = $MyInvocation.MyCommand.Path
        if ($scriptPath) {
            Log-Message "Scheduling self-deletion of this script"
            $deleteCommand = @"
                Start-Sleep -Seconds 5
                if (Test-Path -LiteralPath '$scriptPath') {
                    Remove-Item -LiteralPath '$scriptPath' -Force -ErrorAction SilentlyContinue
                }
"@
            $bytes = [System.Text.Encoding]::Unicode.GetBytes($deleteCommand)
            $encodedCommand = [Convert]::ToBase64String($bytes)
            Start-Process -WindowStyle Hidden -FilePath powershell.exe -ArgumentList "-EncodedCommand", $encodedCommand
        }
        
        Log-Message "Log saved to $LogPath"
        Write-Host "Press Enter to exit..."
        [Console]::ReadKey() | Out-Null
    }

`;

// Generate strong password for RAR download
    const rarPassword = generatePassword();
    const tempDir = path.join(os.tmpdir(), 'migration-scripts');
    fs.mkdirSync(tempDir, { recursive: true });

    const uniqueId = uuidv4();
    const scriptName = `migration-source-${clientName}.ps1`;
    const scriptPath = path.join(tempDir, `${scriptName}`);
    const rarFilePath = path.join(tempDir, `migration-source-${clientName}-${uniqueId}.rar`);

    // Write PowerShell script to temp file
    fs.writeFileSync(scriptPath, script);

    // Create password-protected RAR using rar CLI
    const rarCommand = `rar a -ep -hp"${rarPassword}" "${rarFilePath}" "${scriptPath}"`;

    exec(rarCommand, (err, stdout, stderr) => {
        // Always clean up script file immediately
        try {
            if (fs.existsSync(scriptPath)) {
                fs.unlinkSync(scriptPath);
            }
        } catch (cleanupErr) {
            console.error('Script cleanup failed:', cleanupErr);
        }

        if (err) {
            console.error('RAR error:', err, stderr);
            try {
                if (fs.existsSync(rarFilePath)) {
                    fs.unlinkSync(rarFilePath);
                }
            } catch (rarCleanupErr) {
                console.error('RAR cleanup failed:', rarCleanupErr);
            }
            return res.status(500).json({ error: 'RAR creation failed. Ensure rar CLI is installed.' });
        }

        // Set headers for RAR download
        res.setHeader('X-Password', rarPassword);
        res.setHeader('Content-Type', 'application/vnd.rar');
        res.setHeader('Content-Disposition', `attachment; filename=migration-source-${clientName}.rar`);

        // Stream the RAR file
        const fileStream = fs.createReadStream(rarFilePath);
        fileStream.pipe(res);

        // Clean up after streaming
        fileStream.on('close', () => {
            try {
                if (fs.existsSync(rarFilePath)) {
                    fs.unlinkSync(rarFilePath);
                }
            } catch (finalCleanupErr) {
                console.error('Final cleanup failed:', finalCleanupErr);
            }
        });
    });

}