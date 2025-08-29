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
    mysqlRamSize
    } = req.body;

  // Validate input parameters
  if (!drive || !clientName || !tomcatPath || !jdkPath || !mysqlPath) {
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
    mysqlRamSize: ${mysqlRamSize}
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
    [string]$MySQLRamSize = "${mysqlRamSize}"
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
$MigrationFolder = "${drive}` + `:\\${clientName}-ServerMigration-$DateString"
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

    # Download RAR from S3 using AWS SDK for JavaScript
    Log-Message "Downloading RAR file from S3..."
    $downloadScript = @"
    const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
    const fs = require("fs");
    const path = require("path");

    async function downloadFromS3() {
      const params = {
          Bucket: "$BucketName",
          Key: "$FolderName/$ArchiveName",
      };

      const s3Client = new S3Client({
        region: "$env:AWS_REGION",
        credentials: {
          accessKeyId: "$env:AWS_ACCESS_KEY_ID",
          secretAccessKey: "$env:AWS_SECRET_ACCESS_KEY"
        }
      });

      try {
        const data = await s3Client.send(new GetObjectCommand(params));
        const fileStream = fs.createWriteStream("$($ArchivePath.Replace('\\', '\\\\'))");
        return new Promise((resolve, reject) => {
            data.Body.pipe(fileStream);
            data.Body.on("error", reject);
            fileStream.on("finish", resolve);
        });
      } catch (err) {
        throw new Error("S3 download failed: " + err.message);
      }
    }

    downloadFromS3()
      .then(() => console.log("Download completed"))
      .catch(error => {
        console.error(error.message);
        process.exit(1);
      });
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
    Log-Message "Downloading archive from S3..."
    $nodeProcess = Start-Process -FilePath "node" -ArgumentList "\`"$downloadScriptPath\`"" -Wait -NoNewWindow -PassThru
        
    if ($nodeProcess.ExitCode -ne 0) {
        $errorDetails = "S3 download failed with exit code $($nodeProcess.ExitCode)"
        Log-Message $errorDetails
        throw $errorDetails
    }
    
    if (-not (Test-Path $ArchivePath)) {
        throw "Downloaded archive not found at $ArchivePath"
    }
    $sizeMB = [math]::Round((Get-Item $ArchivePath).Length / 1MB, 2)
    Log-Message "Archive downloaded ($sizeMB MB). Path: $ArchivePath"

    # Extract RAR file
    Log-Message "Extracting archive to drive root..."
    $extractProcess = Start-Process -FilePath $WinRARPath -ArgumentList "x", "-ibck", "-y", "\`"$ArchivePath\`"", "\`"${drive}:\\\`"" -Wait -NoNewWindow -PassThru
        
    if ($extractProcess.ExitCode -ne 0) {
        $errorDetails = "Extraction failed with exit code $($extractProcess.ExitCode)"
        Log-Message $errorDetails
        throw $errorDetails
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
                    $normalizedMySQLPath = $MySQLPath.TrimEnd('\')

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

        } catch {
        Log-Message "An error occurred during Tomcat service installation."
        }   
    }

    if ($CopyFonts) {
        # Placeholder for font copying functionality
        # TODO: Implement font copying in the future
        Log-Message "Font copying feature will be implemented in a future version"
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

  res.status(200).json({ script });
}