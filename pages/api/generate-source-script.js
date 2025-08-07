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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { drive, clientName, excludePaths = [] } = req.body;

    // Validate input parameters
    if (!drive || !clientName) {
        return res.status(400).json({ error: 'Drive and client name are required' });
    }

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

    const allExclusions = [
        ...defaultExclusions,
        ...excludePaths,
    ];

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
    [string[]]$ExcludePaths = @(
        ${allExclusions.map(e => `"${e.replace(/"/g, '""')}"`).join(",\n        ")}
    )
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
            } catch {
                Log-Message "WARNING: Failed to delete $file - $($_.Exception.Message)"
            }
        }
    }
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
    Log-Message "  Exclusions: $($ExcludePaths -join ', ')"

    # Verify WinRAR installation
    if (-not (Test-Path $WinRARPath)) {
        $msg = "WinRAR not found at '$WinRARPath'. Please install from: https://www.rarlab.com/download.htm"
        Log-Message $msg
        throw $msg
    }

    # Build proper exclusion arguments
    $exclusionArgs = New-Object System.Collections.Generic.List[string]
    foreach ($ex in $ExcludePaths) {
        $exclusionArgs.Add("-x$ex")
    }

    # Delete existing archive if present
    if (Test-Path $ArchivePath) {
        Remove-Item -Path $ArchivePath -Force
        Log-Message "Deleted existing archive: $ArchivePath"
    }

    # Archive drive using WinRAR
    Log-Message "Starting archive process for drive ${drive} with WinRAR..."
    
    $rarCommand = @(
        "a",           # Add to archive
        "-r",          # Recurse subdirectories
        "-ep1",        # Exclude base folder from names
        "-y",          # Assume Yes to all queries
        "-idq",        # Quiet mode (suppress progress)
        "$ArchivePath",
        "${drive}:\\*"
    ) + $exclusionArgs


    Log-Message "Executing: $WinRARPath $($rarCommand -join ' ')"
    
    $process = Start-Process -FilePath $WinRARPath -ArgumentList $rarCommand -Wait -NoNewWindow -PassThru
    
    if ($process.ExitCode -eq 1) {
        # Exit code 1 can occur when some files are skipped but the archive is still created
        if (Test-Path $ArchivePath) {
            Log-Message "Archive created successfully despite exit code 1"
        } else {
            $errorDetails = "WinRAR archive creation failed with exit code $($process.ExitCode)"
            Log-Message $errorDetails
            throw $errorDetails
        }
    } elseif ($process.ExitCode -ne 0) {
        $errorDetails = "WinRAR archive creation failed with exit code $($process.ExitCode)"
        Log-Message $errorDetails
        throw $errorDetails
    }

$sizeGB = [math]::Round((Get-Item $ArchivePath).Length / 1GB, 2)
    Log-Message "Archive created at $ArchivePath (Size: $sizeGB GB)"

    # Upload to S3 using AWS SDK for JavaScript
    Log-Message "Uploading to S3 bucket $BucketName..."

    $uploadScript = @"
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    const fs = require("fs");
    const path = require("path");

    async function uploadToS3() {
      const filePath = "$($ArchivePath.Replace('\\', '\\\\'))";
      const fileContent = fs.readFileSync(filePath);

      const params = {
          Bucket: "$BucketName",
          Key: "$FolderName/$ArchiveName",
          Body: fileContent,
      };

      const s3Client = new S3Client({
        region: "$env:AWS_REGION",
        credentials: {
          accessKeyId: "$env:AWS_ACCESS_KEY_ID",
          secretAccessKey: "$env:AWS_SECRET_ACCESS_KEY"
        }
      });

      try {
        await s3Client.send(new PutObjectCommand(params));
        return "Uploaded $ArchiveName to S3 successfully";
      } catch (err) {
        throw new Error("S3 upload failed: \${err.message}");
      }
    }

    uploadToS3()
      .then(result => console.log(result))
      .catch(error => {
        console.error(error.message);
        process.exit(1);
      });
"@

    # Save the upload script to a temporary file
    $uploadScriptPath = "$MigrationFolder\\upload-to-s3.js"
    $uploadScript | Out-File -FilePath $uploadScriptPath -Encoding UTF8
    Log-Message "Created upload script: $uploadScriptPath"

    # Install required npm package
    Log-Message "Installing AWS SDK for S3..."
    Set-Location -Path $MigrationFolder
    npm init -y --quiet
    npm install @aws-sdk/client-s3

    # Execute the upload script
    \$nodeProcess = Start-Process -FilePath "node" -ArgumentList "\`\"\$uploadScriptPath\`\"" -Wait -NoNewWindow -PassThru
        
    if ($nodeProcess.ExitCode -ne 0) {
        $errorDetails = "S3 upload failed with exit code $($nodeProcess.ExitCode)"
        Log-Message $errorDetails
        throw $errorDetails
    }
        
    Log-Message "Upload completed successfully"
    Log-Message "Migration completed successfully"

    } catch {
        $errorMsg = $_.Exception.Message
        Log-Message "CRITICAL ERROR: $errorMsg"
        Log-Message "===== MIGRATION FAILED ====="
        exit 1
    } finally {
        # Clean up temporary files immediately
        Remove-TemporaryFiles -FolderPath $MigrationFolder

        Log-Message "Log file maintained at: $LogPath"
        Log-Message "Archive maintained at: $ArchivePath"
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