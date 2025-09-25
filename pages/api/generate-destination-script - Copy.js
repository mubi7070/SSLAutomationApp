import { v4 as uuidv4 } from 'uuid';
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

  const { 
    drive, 
    clientName, 
    tomcatPath, 
    jdkPath, 
    mysqlPath, 
    installMySQL,
    installTomcat,
    copyFonts,
    ramAllocation,
    mysqlServiceName,
    tomcatDependency,
    tomcatInitialMemory,
    tomcatMaxMemory,
    tomcatServiceName,
    enablePerformanceOptions,
    performanceOptions,
    mysqlRamAllocation,
    mysqlRamSize,
    unarchiveOption,
    unarchivePath
    } = req.body;

  // Validate input parameters
  if (!drive || !clientName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  console.log(`
    drive: ${drive},
    clientName: ${clientName} , 
    tomcatPath: ${tomcatPath}, 
    jdkPath: ${jdkPath}, 
    mysqlPath: ${mysqlPath}, 
    installMySQL: ${installMySQL},
    installTomcat: ${installTomcat},
    copyFonts: ${copyFonts},
    ramAllocation: ${ramAllocation},
    mysqlServiceName: ${mysqlServiceName},
    tomcatDependency: ${tomcatDependency},
    tomcatInitialMemory: ${tomcatInitialMemory},
    tomcatMaxMemory: ${tomcatMaxMemory},
    tomcatServiceName: ${tomcatServiceName},
    enablePerformanceOptions: ${enablePerformanceOptions},
    performanceOptions: ${performanceOptions},
    mysqlRamAllocation: ${mysqlRamAllocation},
    mysqlRamSize: ${mysqlRamSize},
    unarchiveOption: ${unarchiveOption},
    unarchivePath: ${unarchivePath}
    `);
  
  
  // Generate formatted date (MMDDYY)
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
  const s3Folder = `${clientName} - ${formattedDate}`;
  
  
  // Create PowerShell script
  const script = `
# Server Migration Destination Script
# Must be run as administrator
# Generated: ${new Date().toISOString()}
# Client: ${clientName}

param(
    [string]$DriveLetter = "${drive}",
    [string]$ClientName = "${clientName}",
    [string]$TomcatPath = "${tomcatPath}",
    [string]$JavaHome = "${jdkPath}",
    [string]$JRE_HOME = "${jdkPath}\\jre",
    [string]$MySQLPath = "${mysqlPath}",
    [bool]$InstallMySQLService = $${installMySQL},
    [bool]$InstallTomcatService = $${installTomcat},
    [bool]$CopyFonts = $${copyFonts},
    [bool]$RamAllocation = $${ramAllocation},
    [string]$MySQLServiceName = "${mysqlServiceName}",
    [string]$TomcatServiceName = "${tomcatServiceName || 'Tomcat9'}",
    [bool]$TomcatDependency = $${tomcatDependency},
    [string]$TomcatInitialMemory = "${tomcatInitialMemory}",
    [string]$TomcatMaxMemory = "${tomcatMaxMemory}",
    [bool]$EnablePerformanceOptions = $${enablePerformanceOptions},
    [string]$PerformanceOptions = "${performanceOptions}",
    [bool]$MySQLRamAllocation = $${mysqlRamAllocation},
    [string]$MySQLRamSize = "${mysqlRamSize}",
    [string]$UnarchiveOption = "${unarchiveOption}",
    [string]$UnarchivePath = "${unarchivePath}"
    
)

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host ""
    Write-Host "Script is not running as Administrator. Kindly re-run the script as Administrator." -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    [void][System.Console]::ReadKey($true)
    exit 1
}

# AWS Configuration
$env:AWS_ACCESS_KEY_ID = "${process.env.AWS_ACCESS_KEY_ID}"
$env:AWS_SECRET_ACCESS_KEY = "${process.env.AWS_SECRET_ACCESS_KEY}"
$env:AWS_REGION = "${process.env.AWS_REGION}"

# Parameters
$DateString = "${formattedDate}"
$BucketName = "${process.env.S3_MIGRATION_BUCKET_NAME}"
$FolderName = "${clientName} - $DateString"
$ArchiveName = "${clientName}-$DateString.rar"
$MigrationFolder = "${drive}:\\${clientName}-ServerMigration-$DateString"
$ArchivePath = Join-Path -Path $MigrationFolder -ChildPath $ArchiveName
$WinRARPath = "C:\\Program Files\\WinRAR\\WinRAR.exe"
$LogPath = Join-Path -Path $MigrationFolder -ChildPath "migration-destination.log"

# FUNCTIONS
function Log-Message {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Write-Host $logEntry
    $logEntry | Out-File -FilePath $LogPath -Append -Encoding utf8
}

function Remove-TemporaryFiles {
    param(
        [string]$FolderPath
    )
    $filesToDelete = @(
        (Join-Path -Path $FolderPath -ChildPath "download-from-s3.js"),
        (Join-Path -Path $FolderPath -ChildPath "node_modules"),
        (Join-Path -Path $FolderPath -ChildPath "package.json"),
        (Join-Path -Path $FolderPath -ChildPath "package-lock.json")
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

function Get-ArchiveFiles {
    param([string]$MigrationFolder, [string]$ArchiveName)
    
    # Check for multi-volume archives first
    $volumeFiles = Get-ChildItem -Path $MigrationFolder -Filter "$ArchiveName.part*.rar" | Sort-Object Name
    if ($volumeFiles.Count -gt 0) {
        Log-Message "Found $($volumeFiles.Count) volume files for extraction"
        return $volumeFiles
    }
    
    # Check for single archive
    $singleFile = Get-Item -Path (Join-Path -Path $MigrationFolder -ChildPath $ArchiveName) -ErrorAction SilentlyContinue
    if ($singleFile) {
        Log-Message "Found single archive file: $($singleFile.Name)"
        return @($singleFile)
    }
    
    throw "No archive files found for extraction"
}

function Get-S3FolderSize {
    param([string]$BucketName, [string]$FolderName)
    
    try {
        # Use AWS CLI to get the total size of the folder
        $awsCommand = "aws s3 ls s3://$BucketName/$FolderName/ --recursive --human-readable --summarize"
        $result = Invoke-Expression $awsCommand 2>$null
        
        if ($result -match "Total Size: (.+)") {
            $sizeString = $matches[1].Trim()
            Log-Message "Total S3 folder size: $sizeString"
            
            # Convert to bytes for accurate calculation
            if ($sizeString -match "([0-9.]+) Bytes") {
                return [double]$matches[1]
            } elseif ($sizeString -match "([0-9.]+) KiB") {
                return [double]$matches[1] * 1024
            } elseif ($sizeString -match "([0-9.]+) MiB") {
                return [double]$matches[1] * 1024 * 1024
            } elseif ($sizeString -match "([0-9.]+) GiB") {
                return [double]$matches[1] * 1024 * 1024 * 1024
            } elseif ($sizeString -match "([0-9.]+) TiB") {
                return [double]$matches[1] * 1024 * 1024 * 1024 * 1024
            }
        }
        
        # Fallback: if AWS CLI fails, try to estimate from file list
        Log-Message "AWS CLI not available or failed, using file list estimation"
        return $null
    } catch {
        Log-Message "WARNING: Could not determine S3 folder size: $($_.Exception.Message)"
        return $null
    }
}



# MAIN EXECUTION
try {
    # Create migration folder
    New-Item -ItemType Directory -Path $MigrationFolder -Force | Out-Null
    "=======================================================" | Out-File -FilePath $LogPath -Encoding utf8
    Log-Message "Starting migration for client ${clientName} on drive ${drive}"

    # Verify WinRAR installation
    if (-not (Test-Path $WinRARPath)) {
        $msg = "WinRAR not found at '$WinRARPath'. Please install from: https://www.rarlab.com/download.htm"
        Log-Message $msg
        throw $msg
    }

    # Get expected download size from S3
    $expectedTotalSize = Get-S3FolderSize -BucketName $BucketName -FolderName $FolderName
    if ($expectedTotalSize) {
        $expectedSizeMB = [math]::Round($expectedTotalSize / 1MB, 2)
        $expectedSizeGB = [math]::Round($expectedTotalSize / 1GB, 2)
        Log-Message "Expected download size: $expectedSizeMB MB ($expectedSizeGB GB)"
    } else {
        Log-Message "Note: Could not determine expected download size. Showing progress without percentage."
    }

    # Download RAR from S3 using AWS SDK for JavaScript
    Log-Message "Downloading archive files from S3..."
    $downloadScript = @"
    const { S3Client, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
    const fs = require("fs");
    const path = require("path");

    async function downloadAllArchiveFiles() {
      const bucketName = "${process.env.S3_MIGRATION_BUCKET_NAME}";
      const folderName = "${s3Folder}";
      const archiveName = "${clientName}-${formattedDate}.rar";
      const migrationFolder = "$($MigrationFolder.Replace('\\', '\\\\'))";

      const s3Client = new S3Client({
        region: "${process.env.AWS_REGION}",
        credentials: {
          accessKeyId: "${process.env.AWS_ACCESS_KEY_ID}",
          secretAccessKey: "${process.env.AWS_SECRET_ACCESS_KEY}"
        }
      });

      try {
        // List objects to find all archive files (single or multi-volume)
        const listParams = {
          Bucket: bucketName,
          Prefix: folderName + '/' + archiveName
        };

        const data = await s3Client.send(new ListObjectsV2Command(listParams));
        
        if (!data.Contents || data.Contents.length === 0) {
          throw new Error("No archive files found in S3 folder: " + folderName);
        }

        // Download each file
        for (const item of data.Contents) {
          const fileName = path.basename(item.Key);
          const localPath = path.join(migrationFolder, fileName);

          console.log("Downloading: " + fileName);

          const getParams = {
            Bucket: bucketName,
            Key: item.Key
          };

          const fileData = await s3Client.send(new GetObjectCommand(getParams));
          const fileStream = fs.createWriteStream(localPath);
          
          await new Promise((resolve, reject) => {
            fileData.Body.pipe(fileStream);
            fileData.Body.on("error", reject);
            fileStream.on("finish", resolve);
          });
          
          console.log("Download completed: " + fileName);
        }

        console.log("All downloads completed successfully.");
        process.exit(0);
      } catch (err) {
        console.error("Download failed: " + err.message);
        process.exit(1);
      }
    }

    downloadAllArchiveFiles();
"@

    # Save the download script
    $downloadScriptPath = Join-Path -Path $MigrationFolder -ChildPath "download-from-s3.js"
    $downloadScript | Out-File -FilePath $downloadScriptPath -Encoding UTF8
    Log-Message "Created download script: $downloadScriptPath"

    # Install required npm package
    Log-Message "Installing AWS SDK for S3..."
    Set-Location -Path $MigrationFolder
    npm init -y --quiet
    npm install @aws-sdk/client-s3

    # Execute the download script
    Log-Message "Downloading archive files from S3..."

    # Start the download process
    $nodeProcess = Start-Process -FilePath "node" -ArgumentList "\`"$downloadScriptPath\`"" -PassThru -NoNewWindow

    # Monitor download progress with percentage
    $startTime = Get-Date
    $lastTotalSize = 0
    $stallCount = 0
    $maxStallCount = 24 # 6 minutes of stalling (24 checks * 15 seconds)

    do {
        Start-Sleep -Seconds 15
        
        $currentFiles = Get-ChildItem -Path $MigrationFolder -Filter "*.rar" -ErrorAction SilentlyContinue
        if ($currentFiles.Count -gt 0) {
            $currentTotalSize = ($currentFiles | Measure-Object -Property Length -Sum).Sum
            
            if ($currentTotalSize -gt $lastTotalSize) {
                # Download is progressing
                $sizeMB = [math]::Round($currentTotalSize / 1MB, 2)
                $fileCount = $currentFiles.Count
                $stallCount = 0 # Reset stall counter
                
                if ($expectedTotalSize -and $expectedTotalSize -gt 0) {
                    $percentComplete = [math]::Round(($currentTotalSize / $expectedTotalSize) * 100, 1)
                    if ($percentComplete -gt 100) { $percentComplete = 100 }
                    Log-Message "Download progress: $percentComplete% complete ($fileCount file(s), $sizeMB MB downloaded)"
                } else {
                    Log-Message "Download progress: $fileCount file(s), $sizeMB MB downloaded"
                }

                $lastTotalSize = $currentTotalSize
            } else {
                # File size hasn't changed - might be stalled
                $stallCount++
                if ($currentTotalSize -gt 0) {
                    $sizeMB = [math]::Round($currentTotalSize / 1MB, 2)
                    Write-Host "Download seems to have stalled at $sizeMB MB (stall count: $stallCount/$maxStallCount)"
                    if ($stallCount -ge $maxStallCount) {
                        $nodeProcess.Kill()
                        throw "Download stalled for 6 minutes. Please check your network connection."
                    }
                }
            }
        } else {
            # No files yet
            Write-Host "Download starting..."
        }
        
        # Check if process has exited
        if ($nodeProcess.HasExited) {
            break
        }
        
        # Timeout after 3 hours (720 checks * 15 seconds)
        if ((Get-Date) - $startTime -gt [TimeSpan]::FromHours(3)) {
            $nodeProcess.Kill()
            throw "Download timed out after 3 hours"
        }
    } while ($true)

    # Wait for process to fully exit
    Start-Sleep -Seconds 2

    # Verify downloaded files
    $archiveFiles = Get-ArchiveFiles -MigrationFolder $MigrationFolder -ArchiveName $ArchiveName
    if ($archiveFiles.Count -eq 0) {
        throw "No archive files found after download completion"
    }

    $totalSizeMB = [math]::Round(($archiveFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Log-Message "All archive files downloaded successfully ($($archiveFiles.Count) files, $totalSizeMB MB)"

    # Extract RAR file(s)
    Log-Message "Extracting archive..."

    # Determine extraction path based on user selection
    if ($UnarchiveOption -eq 'specificPath' -and $UnarchivePath) {
        Log-Message "Extraction path: $UnarchivePath"
        # Create the directory if it doesn't exist
        if (-not (Test-Path $UnarchivePath)) {
            New-Item -ItemType Directory -Path $UnarchivePath -Force | Out-Null
            Log-Message "Created directory: $UnarchivePath"
        }
        $extractPath = $UnarchivePath
    } else {
        $extractPath = "${drive}:\\"
        Log-Message "Extraction path: $extractPath"
    }

    # Use first volume for multi-volume or single file for extraction
    $extractSource = $archiveFiles[0].FullName
    
    # Enhanced extraction with robust parameters
    $extractArgs = @(
        "x",           # Extract with full paths
        "-ibck",       # Run in background
        "-y",          # Assume Yes to all
        "-mt4",        # Use multi-threading
        "\`"$extractSource\`"",
        "\`"$extractPath\`""
    )

    Log-Message "Extracting from: $(Split-Path $extractSource -Leaf)"
    $extractProcess = Start-Process -FilePath $WinRARPath -ArgumentList $extractArgs -Wait -NoNewWindow -PassThru

    if ($extractProcess.ExitCode -ne 0 -and $extractProcess.ExitCode -ne 1) {
        $errorDetails = "Extraction failed with exit code $($extractProcess.ExitCode)"
        Log-Message $errorDetails
        
        # Try alternative extraction method for large files
        if ($extractProcess.ExitCode -eq 6 -or $extractProcess.ExitCode -eq 8) {
            Log-Message "Attempting alternative extraction method for large files..."
            $extractArgs = @(
                "x",           # Extract with full paths
                "-ibck",       # Run in background
                "-y",          # Assume Yes to all
                "-mt2",        # Use fewer threads
                "-o+",         # Overwrite all
                "\`"$extractSource\`"",
                "\`"$extractPath\`""
            )
            
            $extractProcess = Start-Process -FilePath $WinRARPath -ArgumentList $extractArgs -Wait -NoNewWindow -PassThru
            if ($extractProcess.ExitCode -ne 0 -and $extractProcess.ExitCode -ne 1) {
                throw "Alternative extraction also failed with exit code $($extractProcess.ExitCode)"
            }
        } else {
            throw $errorDetails
        }
    }
  
    Log-Message "Extraction completed successfully"


    # Capture script path for self-deletion
    $scriptPath = $MyInvocation.MyCommand.Path

    # Service installation and configuration
    if ($InstallMySQLService) {
        $myIniPath = Join-Path -Path $MySQLPath -ChildPath "my.ini"

            try {
                if (Test-Path $myIniPath) {
                    # Read the content of my.ini line by line
                    $lines = Get-Content $myIniPath
                    
                    # Normalize MySQL path (remove trailing backslash if present)
                    $normalizedMySQLPath = $MySQLPath.TrimEnd('\\')

                    # Process each line
                    $updatedLines = @()
                    foreach ($line in $lines) {
                    $updatedLine = $line

                    # Update basedir
                    if ($line -match '^\\s*basedir\\s*=\\s*".*"') {
                        $updatedLine = "basedir=\`"$normalizedMySQLPath\\\`""
                        Log-Message "Updated basedir to: $updatedLine"
                    }

                    # Update datadir
                    elseif ($line -match '^\\s*datadir\\s*=\\s*".*"') {
                        $updatedLine = "datadir=\`"$normalizedMySQLPath\\Data\`""
                        Log-Message "Updated datadir to: $updatedLine"
                    }

                    # Update innodb_buffer_pool_size if RAM allocation is enabled
                    elseif ($MySQLRamAllocation -and $MySQLRamSize -and $line -match '^\\s*innodb_buffer_pool_size\\s*=\\s*\\d+[MmKk]?') {
                        $updatedLine = "innodb_buffer_pool_size=${mysqlRamSize}M"
                        Log-Message "Updated innodb_buffer_pool_size to: $updatedLine"
                    }

                    $updatedLines += $updatedLine

                }

                # Write the updated content back to my.ini
                Set-Content -Path $myIniPath -Value $updatedLines
                Log-Message "Updated my.ini with new settings"
                
                # Wait to ensure the my.ini is configured
                Write-Host "Waiting for my.ini configuration..."
                Start-Sleep -Seconds 3
            } else {
                Log-Message "WARNING: my.ini not found at $myIniPath"
            }

        Log-Message "Installing MySQL service: $MySQLServiceName"

        # Check if MySQL bin directory exists
        $MySQLBinPath = Join-Path -Path $MySQLPath -ChildPath "bin"
        if (-not (Test-Path $MySQLBinPath)) {
            throw "MySQL bin directory not found: $MySQLBinPath"
        }

        Push-Location "$MySQLPath\\bin"
        
        Log-Message "MySQL Bin Location: $MySQLPath\\bin"
        Log-Message "Current working directory: $(Get-Location)"

        $mysqldExe = ".\\mysqld.exe"
        if (-not (Test-Path $mysqldExe)) {
            Log-Message "CRITICAL ERROR: mysqld.exe not found at $(Get-Location)"
            throw "mysqld.exe not found at $(Get-Location)"
        } else {
            # Install MySQL service
            & $mysqldExe "-install" $MySQLServiceName
        }

        if ($LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Failed to install MySQL service. Exit code: $LASTEXITCODE"
            throw "MySQL service installation failed with exit code: $LASTEXITCODE"
        } else {
            Log-Message "MySQL service installed successfully"
            # Set service to auto-start
            sc.exe config $MySQLServiceName start= auto | Out-Null
            Log-Message "Configured MySQL service to start automatically"
        }
        
        Pop-Location
    } catch {
            Log-Message "ERROR: Failed during MySQL service installation - $($_.Exception.Message)"
        }
    }

    if ($InstallTomcatService) {
    try {
        $TomcatBinPath = Join-Path -Path $TomcatPath -ChildPath "bin"
        $serviceBatPath = Join-Path -Path $TomcatBinPath -ChildPath "service.bat"
        $serviceBatBackup = $null
        $ramUpdated = $false
        $performanceOptionsUpdated = $false

        # Validate paths
        if (-Not (Test-Path $TomcatBinPath)) {
            throw "Tomcat bin path not found: $TomcatBinPath"
        }
        if (-Not (Test-Path $serviceBatPath)) {
            throw "service.bat not found in: $TomcatBinPath"
        }
        if (-Not (Test-Path $JavaHome)) {
            throw "Java Home not found: $JavaHome"
        }

        # Backup original service.bat content
        $serviceBatBackup = Get-Content $serviceBatPath -Raw

        
        if ($RamAllocation) {
            try {
                # Update service.bat with memory settings

                if (Test-Path $serviceBatPath) {
                    $content = Get-Content $serviceBatPath -Raw
                    
                    # Update JVM memory settings
                    $content = $content -replace '(?i)--JvmMs\\s+"%JvmMs%"', "--JvmMs \`"${tomcatInitialMemory}\`""
                    $content = $content -replace '(?i)--JvmMx\\s+"%JvmMx%"', "--JvmMx \`"${tomcatMaxMemory}\`""
                    
                    Set-Content -Path $serviceBatPath -Value $content
                    $ramUpdated = $true
                    Log-Message "Updated service.bat with memory settings: Initial=${tomcatInitialMemory}MB, Max=${tomcatMaxMemory}MB"
                } else {
                    Log-Message "WARNING: service.bat not found at $serviceBatPath"
                }
            } catch {
                Log-Message "ERROR: Failed to update service.bat with memory settings - $($_.Exception.Message)"
            }
        }

        if ($EnablePerformanceOptions -and $PerformanceOptions) {
            try {
                $content = Get-Content $serviceBatPath -Raw
                
                # Replace %JvmArgs% with performance options
                $content = $content -replace '%JvmArgs%', "${performanceOptions}"
                
                Set-Content -Path $serviceBatPath -Value $content
                $performanceOptionsUpdated = $true
                Log-Message "Added performance options to service.bat"
            } catch {
                Log-Message "ERROR: Failed to add performance options to service.bat - $($_.Exception.Message)"
            }
        }

        # Wait to ensure the service.bat is configured.
        Write-Host "Waiting..."
        Start-Sleep -Seconds 5

        Log-Message "Setting up environment variables and installing the service."
        
        # Set environment variables required for service installation
        $env:CATALINA_HOME = $TomcatPath
        $env:JAVA_HOME = $JavaHome
        $env:JRE_HOME = "$JRE_HOME"

        Log-Message "Installing Tomcat service: ${tomcatServiceName}"

        Push-Location $TomcatBinPath

        # Install service
        & cmd.exe /c "service.bat install ${tomcatServiceName}"
        Pop-Location

        # Wait to ensure the service is installed
        Start-Sleep -Seconds 5

        # Verify the service installation
        $service = Get-Service -Name ${tomcatServiceName} -ErrorAction SilentlyContinue
        if ($service) {
            Log-Message "Tomcat service '${tomcatServiceName}' installed successfully."
        } else {
            throw "Tomcat service '${tomcatServiceName}' could not be found after installation."
        }
        
            
            
            # Configure service recovery options
            sc.exe failure ${tomcatServiceName} reset= 86400 actions= restart/60000/restart/60000// | Out-Null
            Log-Message "Configured Tomcat service recovery options"

            # Set Log On to 'Local System account'
            $ServiceManagerPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\${tomcatServiceName}"
            Set-ItemProperty -Path $ServiceManagerPath -Name "ObjectName" -Value "LocalSystem"
            Log-Message "Configured 'Local System account' for service '${tomcatServiceName}'"
            
            # Disable 'Enable actions for stops with errors'
            sc.exe failureflag $ServiceName 0 | Out-Null
            Log-Message "Disabled 'Enable actions for stops with errors' for service '${tomcatServiceName}'."

            # Set dependency if enabled
            if ($TomcatDependency) {
                Log-Message "Setting Tomcat dependency on MySQL service"
                sc.exe config ${tomcatServiceName} depend= $MySQLServiceName
                if ($LASTEXITCODE -ne 0) {
                    Log-Message "WARNING: Failed to set Tomcat dependency on MySQL"
                } else {
                    Log-Message "Tomcat service configured to depend on MySQL"
                }
            }
            
            # Set service to auto-start
            sc.exe config ${tomcatServiceName} start= auto | Out-Null
            Log-Message "Configured Tomcat service to start automatically"

            # Revert changes to service.bat if they were made
            if ($ramUpdated -or $performanceOptionsUpdated) {
                Set-Content -Path $serviceBatPath -Value $serviceBatBackup
                Log-Message "Reverted service.bat to original state"
            }






            if ($CopyFonts) {
                Log-Message "Installing fonts from Tomcat installation..."
                $fontExtensions = @('.fon', '.ttf', '.TTF', '.otf')
                $fontDirectories = @(
                    "webapps\\northstar\\stencils\\fonts",
                    "webapps\\northstar\\stencils\\fonts\\appfontfamily", 
                    "webapps\\northstar\\stencils\\fonts\\pdftemplates"
                )
                
                $fontsInstalled = 0
                $fontsFailed = 0

                foreach ($fontDir in $fontDirectories) {
                    $fullFontPath = Join-Path -Path $TomcatPath -ChildPath $fontDir
                    
                    if (Test-Path $fullFontPath) {
                        Log-Message "Searching for font files in: $fullFontPath"
                        
                        # Get all font files with the specified extensions
                        $fontFiles = Get-ChildItem -Path $fullFontPath -Recurse | Where-Object {
                            $fontExtensions -contains $_.Extension
                        }
                        
                        foreach ($fontFile in $fontFiles) {
                            try {
                                $fontName = $fontFile.Name
                                $destinationPath = Join-Path -Path $env:windir -ChildPath "Fonts\\$fontName"
                                
                                # Check if font already exists
                                if (Test-Path $destinationPath) {
                                    Log-Message "Font already exists: $fontName"
                                    continue
                                }
                                
                                # Use proper font installation method
                                $shell = New-Object -ComObject Shell.Application
                                $fontsFolder = $shell.Namespace(0x14)  # 0x14 is the Fonts folder
                                
                                # Copy font to Fonts directory using Shell API
                                $fontsFolder.CopyHere($fontFile.FullName, 0x14)  # 0x14 = Yes to All
                                
                                # Verify installation
                                Start-Sleep -Seconds 2  # Wait for font to be installed
                                
                                if (Test-Path $destinationPath) {
                                    $fontsInstalled++
                                    Log-Message "Successfully installed font: $fontName"
                                } else {
                                    $fontsFailed++
                                    Log-Message "WARNING: Font may not have installed correctly: $fontName"
                                }
                            } catch {
                                $fontsFailed++
                                Log-Message "ERROR: Failed to install font $($fontFile.Name) - $($_.Exception.Message)"
                            }
                        }
                    } else {
                        Log-Message "Font directory not found: $fullFontPath"
                    }
                }
                
                # Provide accurate summary
                if ($fontsInstalled -gt 0) {
                    Log-Message "Successfully installed $fontsInstalled font(s)"
                }
                if ($fontsFailed -gt 0) {
                    Log-Message "Failed to install $fontsFailed font(s)"
                }
                if ($fontsInstalled -eq 0 -and $fontsFailed -eq 0) {
                    Log-Message "No font files were found or installed"
                }
            }










        } catch {
        Log-Message "An error occurred during Tomcat service installation."
        }   
    }




    

    Log-Message "===== MIGRATION COMPLETED SUCCESSFULLY ====="
    Log-Message "All data restored to drive ${drive}:\\"

} catch {
    $errorMsg = $_.Exception.Message
    Log-Message "CRITICAL ERROR: $errorMsg"
    Log-Message "===== MIGRATION FAILED ====="
    # Clean up temporary files even on error
    if ($MigrationFolder -and (Test-Path $MigrationFolder)) {
        Log-Message "Cleaning up temporary files after error..."
        Remove-TemporaryFiles -FolderPath $MigrationFolder
    }
    # Keep window open to see error
    Write-Host "Press Enter to exit..."
    $null = Read-Host
    exit 1
} finally {
    # Self-deletion process
    Log-Message "Starting self-deletion process"
    try {
        # Delete temporary files
        Remove-TemporaryFiles -FolderPath $MigrationFolder
        
        # Delete the script itself
        if (Test-Path -LiteralPath $scriptPath) {
            Log-Message "Deleting script: $scriptPath"
            Remove-Item -LiteralPath $scriptPath -Force -ErrorAction Stop
        }
    } catch {
        Log-Message "WARNING: Failed to delete script - $($_.Exception.Message)"
    }
}
`;

// Generate strong password for RAR download
  const rarPassword = generatePassword();
  const tempDir = path.join(os.tmpdir(), 'migration-scripts');
  fs.mkdirSync(tempDir, { recursive: true });

  const uniqueId = uuidv4();
  const scriptName = `migration-destination-${clientName}.ps1`;
  const scriptPath = path.join(tempDir, `${scriptName}`);
  const rarFilePath = path.join(tempDir, `migration-destination-${clientName}-${uniqueId}.rar`);

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
    res.setHeader('Content-Disposition', `attachment; filename=migration-destination-${clientName}.rar`);

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