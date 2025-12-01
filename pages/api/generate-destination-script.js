import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { getConfig } from '../lib/config';

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


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    drive, 
    clientName, 
    destinationDate,
    tomcatPath, 
    jdkPath, 
    mysqlPath, 
    installMySQL,
    installTomcat,
    installNorthstarDesktop,
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
    unarchivePath,
    setEnvironmentVariables,
    addFirewallRule,
    firewallPorts,
    updateInternalIP,
    internalIP,
    updateTomcatPath,
    controlCenterSetup
    } = req.body;

  // Validate input parameters
  if (!drive || !clientName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

    // Get config from database
    const config = await getConfig();
    const AWS_ACCESS_KEY_ID = config.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = config.AWS_SECRET_ACCESS_KEY;
    const AWS_REGION = config.AWS_REGION;
    const S3_MIGRATION_BUCKET_NAME = config.S3_MIGRATION_BUCKET_NAME;

    // Clean and validate firewall ports
    let cleanFirewallPorts = '';
    if (addFirewallRule && firewallPorts) {
        // Remove all non-digit characters except commas, then clean up multiple commas
        cleanFirewallPorts = firewallPorts
            .replace(/[^\d,]/g, '') // Remove everything except digits and commas
            .replace(/,+/g, ',')    // Replace multiple commas with single comma
            .replace(/^,|,$/g, '')  // Remove leading/trailing commas
            .split(',')             // Split into array
            .filter(port => {
                const portNum = parseInt(port.trim());
                return port.trim() !== '' && portNum >= 1 && portNum <= 65535;
            })
            .join(',');             // Join back to string
        
        console.log(`Original ports: "${firewallPorts}" -> Cleaned ports: "${cleanFirewallPorts}"`);
        
        // Set to empty string if no valid ports found
        if (cleanFirewallPorts === '') {
            console.log('WARNING: No valid ports found for firewall rule');
        }
    }

  console.log(`
    drive: ${drive},
    clientName: ${clientName} , 
    destinationDate: ${destinationDate},
    tomcatPath: ${tomcatPath}, 
    jdkPath: ${jdkPath}, 
    mysqlPath: ${mysqlPath}, 
    installMySQL: ${installMySQL},
    installTomcat: ${installTomcat},
    installNorthstarDesktop: ${installNorthstarDesktop},
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
    unarchivePath: ${unarchivePath},
    setEnvironmentVariables: ${setEnvironmentVariables},
    addFirewallRule: ${addFirewallRule},
    firewallPorts: ${firewallPorts},
    cleanFirewallPorts: ${cleanFirewallPorts},
    updateInternalIP: ${updateInternalIP},
    internalIP: ${internalIP},
    updateTomcatPath: ${updateTomcatPath},
    controlCenterSetup: ${controlCenterSetup}
    `);
    
  
  // Generate formatted date (MMDDYY)
  const targetDate = destinationDate ? new Date(destinationDate) : new Date();
  const formattedDate = `${String(targetDate.getMonth() + 1).padStart(2, '0')}${String(targetDate.getDate()).padStart(2, '0')}${String(targetDate.getFullYear()).slice(-2)}`;
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
    [string]$TomcatPath = "${escapePowerShellPath(tomcatPath)}",
    [string]$JavaHome = "${escapePowerShellPath(jdkPath)}",
    [string]$JRE_HOME = "${escapePowerShellPath(jdkPath)}\\jre",
    [string]$MySQLPath = "${escapePowerShellPath(mysqlPath)}",
    [bool]$InstallMySQLService = $${installMySQL},
    [bool]$InstallTomcatService = $${installTomcat},
    [bool]$InstallNorthstarDesktop = $${installNorthstarDesktop},
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
    [string]$UnarchivePath = "${escapePowerShellPath(unarchivePath)}",
    [bool]$SetEnvironmentVariables = $${setEnvironmentVariables},
    [bool]$AddFirewallRule = $${addFirewallRule},
    [string]$FirewallPorts = "${cleanFirewallPorts}",
    [bool]$UpdateInternalIP = $${updateInternalIP},
    [string]$InternalIP = "${internalIP}",
    [bool]$UpdateTomcatPath = $${updateTomcatPath},
    [bool]$ControlCenterSetup = $${controlCenterSetup}
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
$env:AWS_ACCESS_KEY_ID = "${AWS_ACCESS_KEY_ID}"
$env:AWS_SECRET_ACCESS_KEY = "${AWS_SECRET_ACCESS_KEY}"
$env:AWS_REGION = "${AWS_REGION}"

# Parameters
$DateString = "${formattedDate}"
$BucketName = "${S3_MIGRATION_BUCKET_NAME}"
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
        (Join-Path -Path $FolderPath -ChildPath "download-from-s3.js"),
        (Join-Path -Path $FolderPath -ChildPath "download-controlcenter.js"),
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

function Setup-ControlCenter {
    Log-Message "Setting up Control Center..."
    
    try {
        $ControlCenterArchiveName = "${clientName}-ControlCenter-${formattedDate}.rar"
        $ControlCenterLocalPath = Join-Path -Path $MigrationFolder -ChildPath $ControlCenterArchiveName
        $ExtractPath = "C:\\Program Files (x86)"
        
        # Download Control Center archive from S3 using the same method as main archive
        Log-Message "Downloading Control Center archive from S3: $ControlCenterArchiveName"
        
        # Create download script for Control Center
        $controlCenterDownloadScript = @"
    const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
    const fs = require("fs");
    const path = require("path");

    async function downloadControlCenter() {
      const bucketName = "${S3_MIGRATION_BUCKET_NAME}";
      const folderName = "${s3Folder}";
      const fileName = "${clientName}-ControlCenter-${formattedDate}.rar";
      const localPath = "$($ControlCenterLocalPath.Replace('\\', '\\\\'))";

      const s3Client = new S3Client({
        region: "$env:AWS_REGION",
        credentials: {
          accessKeyId: "$env:AWS_ACCESS_KEY_ID",
          secretAccessKey: "$env:AWS_SECRET_ACCESS_KEY"
        }
      });

      try {
        console.log("Starting Control Center download: " + fileName);
        
        const getParams = {
          Bucket: bucketName,
          Key: folderName + '/' + fileName
        };

        const fileData = await s3Client.send(new GetObjectCommand(getParams));
        const fileStream = fs.createWriteStream(localPath);
        
        await new Promise((resolve, reject) => {
          fileData.Body.pipe(fileStream);
          fileData.Body.on("error", reject);
          fileStream.on("error", reject);
          fileStream.on("finish", resolve);
        });
        
        const stats = fs.statSync(localPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log("SUCCESS: Control Center archive downloaded: " + fileSizeMB + " MB");
      } catch (err) {
        console.error("ERROR: Failed to download Control Center archive: " + err.message);
        throw err;
      }
    }

    downloadControlCenter();
"@

        # Save the Control Center download script
        $controlCenterDownloadScriptPath = Join-Path -Path $MigrationFolder -ChildPath "download-controlcenter.js"
        $controlCenterDownloadScript | Out-File -FilePath $controlCenterDownloadScriptPath -Encoding UTF8
        Log-Message "Created Control Center download script"

        # Execute the download script
        Log-Message "Downloading Control Center archive..."
        $nodeProcess = Start-Process -FilePath "node" -ArgumentList "\`"$controlCenterDownloadScriptPath\`"" -PassThru -NoNewWindow -Wait

        if ($nodeProcess.ExitCode -ne 0) {
            Log-Message "WARNING: Control Center download process failed with exit code $($nodeProcess.ExitCode)"
            Log-Message "Control Center setup will be skipped"
            return
        }

        # Wait for file system to settle
        Start-Sleep -Seconds 2

        # Verify Control Center archive was downloaded
        if (-not (Test-Path $ControlCenterLocalPath)) {
            Log-Message "WARNING: Control Center archive download failed - file not found at $ControlCenterLocalPath"
            Log-Message "Control Center setup will be skipped"
            return
        }

        $fileSize = (Get-Item $ControlCenterLocalPath).Length / 1MB
        Log-Message "Control Center archive downloaded successfully ($([math]::Round($fileSize, 2)) MB)"

        # Extract Control Center archive
        Log-Message "Extracting Control Center archive to $ExtractPath..."
        $extractArgs = @(
            "x",           # Extract with full paths
            "-y",          # Assume Yes to all
            "-o+",         # Overwrite all files
            "-idq",        # Quiet mode
            "\`"$ControlCenterLocalPath\`"",
            "\`"$ExtractPath\`""
        )
        
        $extractProcess = Start-Process -FilePath $WinRARPath -ArgumentList $extractArgs -Wait -NoNewWindow -PassThru
        
        if ($extractProcess.ExitCode -ne 0) {
            Log-Message "WARNING: Control Center extraction completed with exit code $($extractProcess.ExitCode)"
        } else {
            Log-Message "Control Center extraction completed successfully"
        }

        # Verify extraction by checking if Sibisoft folder exists
        $sibisoftPath = Join-Path -Path $ExtractPath -ChildPath "Sibisoft"
        if (Test-Path $sibisoftPath) {
            Log-Message "SUCCESS: Control Center extracted to $sibisoftPath"
            
            # Check if ControlCenter.exe exists in the expected location
            $controlCenterExePath = Join-Path -Path $sibisoftPath -ChildPath "ControlCenter\\ControlCenter.exe"
            if (Test-Path $controlCenterExePath) {
                Log-Message "SUCCESS: ControlCenter.exe found at $controlCenterExePath"
            } else {
                Log-Message "WARNING: ControlCenter.exe not found at expected location: $controlCenterExePath"
                # Try to find it anywhere in the Sibisoft folder
                $foundExe = Get-ChildItem -Path $sibisoftPath -Filter "ControlCenter.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($foundExe) {
                    Log-Message "Found ControlCenter.exe at: $($foundExe.FullName)"
                    $controlCenterExePath = $foundExe.FullName
                }
            }
        } else {
            Log-Message "WARNING: Sibisoft folder not found after extraction at: $sibisoftPath"
            # Try to find Sibisoft folder anywhere in the extraction path
            $foundSibisoft = Get-ChildItem -Path $ExtractPath -Filter "Sibisoft" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($foundSibisoft) {
                $sibisoftPath = $foundSibisoft.FullName
                Log-Message "Found Sibisoft folder at: $sibisoftPath"
            } else {
                Log-Message "ERROR: Could not find Sibisoft folder after extraction"
                return
            }
        }

        # NEW CODE: Verify and update paths in info.json before starting service
        Log-Message "Verifying and updating paths in info.json..."
        $infoJsonPath = "C:\\Program Files (x86)\\Sibisoft\\info.json"

        if (Test-Path $infoJsonPath) {
            try {
                # Read and parse the JSON file
                $infoJsonContent = Get-Content $infoJsonPath -Raw | ConvertFrom-Json
                Log-Message "Current info.json configuration:"
                Log-Message "  - Name: $($infoJsonContent.name)"
                Log-Message "  - DB Backup Path: $($infoJsonContent.dbBackUp)"
                Log-Message "  - Northstar Path: $($infoJsonContent.northstar)"
                
                # Check if paths need to be updated to match the selected drive
                $currentDbBackupPath = $infoJsonContent.dbBackUp
                $currentNorthstarPath = $infoJsonContent.northstar
                
                # Extract drive letters from current paths
                $currentDbDrive = $currentDbBackupPath -replace ':.*$', ''
                $currentNorthstarDrive = $currentNorthstarPath -replace ':.*$', ''
                
                # Update paths if drive letters don't match the selected drive
                $pathsUpdated = $false
                
                if ($currentDbDrive -ne $DriveLetter) {
                    $newDbBackupPath = $currentDbBackupPath -replace "^$currentDbDrive", $DriveLetter
                    Log-Message "Updating DB Backup path from '$currentDbBackupPath' to '$newDbBackupPath'"
                    $infoJsonContent.dbBackUp = $newDbBackupPath
                    $pathsUpdated = $true
                }
                
                if ($currentNorthstarDrive -ne $DriveLetter) {
                    $newNorthstarPath = $currentNorthstarPath -replace "^$currentNorthstarDrive", $DriveLetter
                    Log-Message "Updating Northstar path from '$currentNorthstarPath' to '$newNorthstarPath'"
                    $infoJsonContent.northstar = $newNorthstarPath
                    $pathsUpdated = $true
                }
                
                if ($pathsUpdated) {
                    # Save the updated JSON back to file
                    $infoJsonContent | ConvertTo-Json | Set-Content $infoJsonPath
                    Log-Message "SUCCESS: info.json updated with new paths"
                } else {
                    Log-Message "No path updates needed - drive letters already match selected drive"
                }
                
                # Verify and create paths if they don't exist
                $finalDbBackupPath = $infoJsonContent.dbBackUp -replace '/', '\\'
                $finalNorthstarPath = $infoJsonContent.northstar -replace '/', '\\'
                
                Log-Message "Verifying required paths exist..."
                
                # Check and create DB Backup path
                if (-not (Test-Path $finalDbBackupPath)) {
                    Log-Message "DB Backup path does not exist: $finalDbBackupPath"
                    try {
                        New-Item -ItemType Directory -Path $finalDbBackupPath -Force | Out-Null
                        if (Test-Path $finalDbBackupPath) {
                            Log-Message "SUCCESS: Created DB Backup path: $finalDbBackupPath"
                        } else {
                            Log-Message "WARNING: Failed to create DB Backup path: $finalDbBackupPath"
                        }
                    } catch {
                        Log-Message "WARNING: Could not create DB Backup path - $($_.Exception.Message)"
                    }
                } else {
                    Log-Message "DB Backup path already exists: $finalDbBackupPath"
                }
                
                # Check and create Northstar path
                if (-not (Test-Path $finalNorthstarPath)) {
                    Log-Message "Northstar path does not exist: $finalNorthstarPath"
                    try {
                        New-Item -ItemType Directory -Path $finalNorthstarPath -Force | Out-Null
                        if (Test-Path $finalNorthstarPath) {
                            Log-Message "SUCCESS: Created Northstar path: $finalNorthstarPath"
                        } else {
                            Log-Message "WARNING: Failed to create Northstar path: $finalNorthstarPath"
                        }
                    } catch {
                        Log-Message "WARNING: Could not create Northstar path - $($_.Exception.Message)"
                    }
                } else {
                    Log-Message "Northstar path already exists: $finalNorthstarPath"
                }
                
            } catch {
                Log-Message "WARNING: Could not process info.json file - $($_.Exception.Message)"
                Log-Message "Continuing with service setup despite info.json issues..."
            }
        } else {
            Log-Message "WARNING: info.json file not found at: $infoJsonPath"
            Log-Message "Path verification skipped - service will use default paths"
        }



        # Configure Control Center Service
        Log-Message "Configuring Control Center Service..."
        
        $serviceName = "ServerMonitor"
        
        # Determine the correct binPath
        if ($controlCenterExePath -and (Test-Path $controlCenterExePath)) {
            $binPath = "\`"$controlCenterExePath\`" --service"
        } else {
            # Fallback to default path
            $binPath = "C:\\Program Files (x86)\\Sibisoft\\ControlCenter\\ControlCenter.exe --service"
            Log-Message "Using default binPath: $binPath"
        }
        
        # Check if service already exists
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            Log-Message "Service $serviceName already exists. Stopping and reconfiguring..."
            try {
                Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 3
                sc.exe delete $serviceName | Out-Null
                Start-Sleep -Seconds 2
                Log-Message "Existing service removed"
            } catch {
                Log-Message "WARNING: Could not remove existing service - $($_.Exception.Message)"
            }
        }
        
        # Create the service
        Log-Message "Creating Control Center service: $serviceName"
        Log-Message "Service binPath: $binPath"

        $createResult = sc.exe create $serviceName DisplayName= "Control Center" binPath= "C:\\Program Files (x86)\\Sibisoft\\ControlCenter\\ControlCenter.exe --service"


        if ($LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Failed to create Control Center service. Exit code: $LASTEXITCODE"
            Log-Message "SC Output: $createResult"
            return
        }
        
        Log-Message "Control Center service created successfully"
        
        # Configure service to auto-start
        sc.exe config $serviceName start= auto | Out-Null
        Log-Message "Configured Control Center service to start automatically"
        
        # Start the service
        Log-Message "Starting Control Center service..."
        try {
            Start-Service -Name $serviceName -ErrorAction Stop
            Log-Message "Control Center service started successfully"
        } catch {
            Log-Message "WARNING: Could not start Control Center service - $($_.Exception.Message)"
            Log-Message "Trying alternative start method..."
            sc.exe start $serviceName | Out-Null
            Start-Sleep -Seconds 3
        }
        
        # Verify service is installed and running
        Start-Sleep -Seconds 3
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        
        if ($service) {
            if ($service.Status -eq 'Running') {
                Log-Message "SUCCESS: Control Center service is installed and running"
            } else {
                Log-Message "WARNING: Control Center service is installed but not running. Current status: $($service.Status)"
                # Try to start it again
                try {
                    Start-Service -Name $serviceName -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 2
                    $service = Get-Service -Name $serviceName
                    if ($service.Status -eq 'Running') {
                        Log-Message "SUCCESS: Control Center service started successfully on second attempt"
                    } else {
                        Log-Message "WARNING: Control Center service still not running after second attempt. Status: $($service.Status)"
                    }
                } catch {
                    Log-Message "WARNING: Could not start Control Center service on second attempt"
                }
            }
        } else {
            Log-Message "ERROR: Control Center service was not found after installation"
        }
        
        # Clean up Control Center archive and download script
        try {
            if (Test-Path $ControlCenterLocalPath) {
                Remove-Item -Path $ControlCenterLocalPath -Force -ErrorAction SilentlyContinue
                Log-Message "Cleaned up Control Center archive"
            }
            if (Test-Path $controlCenterDownloadScriptPath) {
                Remove-Item -Path $controlCenterDownloadScriptPath -Force -ErrorAction SilentlyContinue
                Log-Message "Cleaned up Control Center download script"
            }
        } catch {
            Log-Message "WARNING: Failed to clean up Control Center temporary files - $($_.Exception.Message)"
        }
        
    } catch {
        Log-Message "ERROR: Control Center setup failed - $($_.Exception.Message)"
    }
}

function Set-WindowsEnvironmentVariables {
    param(
        [string]$TomcatPath,
        [string]$JavaHome,
        [string]$JRE_HOME
    )
    
    Log-Message "Setting Windows System Environment Variables..."
    
    try {
        # Set CATALINA_HOME
        Log-Message "Setting CATALINA_HOME to: $TomcatPath"
        [Environment]::SetEnvironmentVariable("CATALINA_HOME", $TomcatPath, "Machine")
        
        # Set JAVA_HOME  
        Log-Message "Setting JAVA_HOME to: $JavaHome"
        [Environment]::SetEnvironmentVariable("JAVA_HOME", $JavaHome, "Machine")
        
        # Set JRE_HOME
        Log-Message "Setting JRE_HOME to: $JRE_HOME"
        [Environment]::SetEnvironmentVariable("JRE_HOME", $JRE_HOME, "Machine")
        
        # Verify the variables were set
        $catalinaHome = [Environment]::GetEnvironmentVariable("CATALINA_HOME", "Machine")
        $javaHome = [Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
        $jreHome = [Environment]::GetEnvironmentVariable("JRE_HOME", "Machine")
        
        if ($catalinaHome -eq $TomcatPath -and $javaHome -eq $JavaHome -and $jreHome -eq $JRE_HOME) {
            Log-Message "SUCCESS: All environment variables set successfully"
            Log-Message "  - CATALINA_HOME: $catalinaHome"
            Log-Message "  - JAVA_HOME: $javaHome"
            Log-Message "  - JRE_HOME: $jreHome"
            
            # Also set them in the current session for immediate use
            $env:CATALINA_HOME = $TomcatPath
            $env:JAVA_HOME = $JavaHome
            $env:JRE_HOME = $JRE_HOME
            Log-Message "Environment variables also set in current session"
        } else {
            Log-Message "WARNING: Environment variables may not have been set correctly"
        }
        
    } catch {
        Log-Message "ERROR: Failed to set environment variables - $($_.Exception.Message)"
    }
}

function Add-FirewallRules {
    param(
        [string]$Ports,
        [string]$ClientName
    )
    
    Log-Message "Setting up Windows Firewall Rules..."
    
    try {
        if (-not $Ports) {
            Log-Message "WARNING: No valid ports provided for firewall rule"
            return
        }
        
        $ruleName = "NS Secure Ports - $ClientName"
        $portArray = $Ports -split ','
        
        Log-Message "Creating firewall rule: $ruleName for ports: $($portArray -join ', ')"
        
        # Check if rule already exists
        $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if ($existingRule) {
            Log-Message "Removing existing firewall rule: $ruleName"
            Remove-NetFirewallRule -DisplayName $ruleName -Confirm:$false
        }
        
        # Create firewall rule with port array
        $firewallRule = New-NetFirewallRule -DisplayName $ruleName -Description "Northstar Application Ports for $ClientName" -Direction Inbound -Protocol TCP -LocalPort $portArray -Action Allow -Enabled True -Profile Domain,Private,Public -ErrorAction Stop
        
        if ($firewallRule) {
            Log-Message "SUCCESS: Firewall rule created - $ruleName for ports: $($portArray -join ', ')"
            
            # Verify the rule was created
            $verifyRule = Get-NetFirewallRule -DisplayName $ruleName
            if ($verifyRule) {
                Log-Message "VERIFIED: Firewall rule exists and is enabled"
            }
        } else {
            Log-Message "WARNING: Failed to create firewall rule for ports: $($portArray -join ', ')"
        }
        
    } catch {
        Log-Message "ERROR: Failed to create firewall rule - $($_.Exception.Message)"
    }
}

function Update-NorthstarINI {
    param(
        [string]$TomcatPath,
        [string]$InternalIP
    )
    
    Log-Message "Updating northstar.ini file with new internal IP: $InternalIP"
    
    try {

        # Define both northstar.ini file paths
        $northstarINIPaths = @(
            "webapps\\northstar\\WEB-INF\\classes\\northstar.ini",
            "webapps\\northstar-training\\WEB-INF\\classes\\northstar.ini"
        )

        foreach ($relativePath in $northstarINIPaths) {
            $northstarINIPath = Join-Path -Path $TomcatPath -ChildPath $relativePath
            
            if (-not (Test-Path -LiteralPath $northstarINIPath)) {
                Log-Message "WARNING: northstar.ini file not found at: $northstarINIPath"
                continue
            }
            
            # Read the content of northstar.ini line by line (same as MySQL approach)
            $lines = Get-Content $northstarINIPath
            
            # Process each line
            $updatedLines = @()
            $internalURLUpdated = $false
            $productionIPUpdated = $false
            
            foreach ($line in $lines) {
                $updatedLine = $line

                # Update internal.url (Location 1) - using simple string matching like MySQL code
                if ($line -like "*internal.url=http://*:8080/northstar*") {
                    $updatedLine = "internal.url=http://${internalIP}:8080/northstar"
                    Log-Message "Updated internal.url to: $updatedLine"
                    $internalURLUpdated = $true
                }
                # Update production.system.ip (Location 2) - using simple string matching like MySQL code
                elseif ($line -like "*production.system.ip=*") {
                    $updatedLine = "production.system.ip=${internalIP}"
                    Log-Message "Updated production.system.ip to: $updatedLine"
                    $productionIPUpdated = $true
                }

                $updatedLines += $updatedLine
            }

            # Write the updated content back to northstar.ini
            Set-Content -Path $northstarINIPath -Value $updatedLines
            
            
            # Log warnings if patterns weren't found
            if (-not $internalURLUpdated) {
                Log-Message "WARNING: internal.url pattern not found in northstar.ini"
            }
            if (-not $productionIPUpdated) {
                Log-Message "WARNING: production.system.ip pattern not found in northstar.ini"
            }

        }

        Log-Message "SUCCESS: northstar.ini files updated successfully with new IP: $InternalIP"
        
    } catch {
        Log-Message "ERROR: Failed to update northstar.ini - $($_.Exception.Message)"
    }
}


function Update-TomcatPathInFiles {
    param(
        [string]$TomcatPath
    )
    
    Log-Message "Starting Tomcat Path Update in configuration files..."
    
    try {
        # First, get the old Tomcat path from northstar.ini
        $northstarINIPath = Join-Path -Path $TomcatPath -ChildPath "webapps\\northstar\\WEB-INF\\classes\\northstar.ini"
        
        if (-not (Test-Path -LiteralPath $northstarINIPath)) {
            Log-Message "ERROR: Cannot find northstar.ini file at: $northstarINIPath"
            return $false
        }
        
        # Read the northstar.ini file to extract the old path
        $oldTomcatPath = $null
        $content = Get-Content $northstarINIPath -Raw
        
        if ($content -match 'path=([^\\r\\n]+)/webapps/northstar') {
            $oldTomcatPath = $matches[1]
            Log-Message "Found old Tomcat path in northstar.ini: $oldTomcatPath"
        }
        
        if (-not $oldTomcatPath) {
            Log-Message "ERROR: Could not extract old Tomcat path from northstar.ini"
            Log-Message "Looking for pattern: 'path=.../webapps/northstar'"
            return $false
        }
        
        # Define the 4 files that need to be updated
        $filesToUpdate = @(
            @{
                Name = "northstar.ini"
                Path = "webapps\\northstar\\WEB-INF\\classes\\northstar.ini"
            },
            @{
                Name = "log4j.PROPERTIES" 
                Path = "webapps\\northstar\\WEB-INF\\classes\\log4j.PROPERTIES"
            },
            @{
                Name = "velocity.properties"
                Path = "webapps\\northstar\\stencils\\velocity.properties"
            },
            @{
                Name = "velocityletters.properties"
                Path = "webapps\\northstar\\stencils\\velocityletters.properties"
            }
        )
        
        $successCount = 0
        $failureCount = 0
        
        foreach ($file in $filesToUpdate) {
            $filePath = Join-Path -Path $TomcatPath -ChildPath $file.Path
            
            if (-not (Test-Path -LiteralPath $filePath)) {
                Log-Message "WARNING: File not found, skipping: $($file.Name) at $filePath"
                $failureCount++
                continue
            }
            
            try {
                # Backup the file
                $backupPath = "$filePath.backup"
                if (Test-Path $filePath) {
                    Copy-Item -Path $filePath -Destination $backupPath -Force
                    Log-Message "Created backup: $backupPath"
                }

                # Read the entire file content
                $content = Get-Content $filePath -Raw
                $originalContent = $content
                
                # Count occurrences before replacement
                $occurrencesBefore = 0
                
                # Create escaped versions for regex
                $oldTomcatPathEscaped = [regex]::Escape($oldTomcatPath)
                
                # Count forward slash occurrences
                $oldForward = $oldTomcatPath -replace '\\\\', '/'
                $oldForwardEscaped = [regex]::Escape($oldForward)
                $occurrencesBefore += [regex]::Matches($content, $oldForwardEscaped).Count
                
                # Count backward slash occurrences  
                $oldBackward = $oldTomcatPath -replace '/', '\\\\'
                $oldBackwardEscaped = [regex]::Escape($oldBackward)
                $occurrencesBefore += [regex]::Matches($content, $oldBackwardEscaped).Count
                
                if ($occurrencesBefore -eq 0) {
                    Log-Message "INFO: No old Tomcat path found in $($file.Name)"
                    # Remove backup since no changes were made
                    if (Test-Path $backupPath) {
                        Remove-Item -Path $backupPath -Force -ErrorAction SilentlyContinue
                    }
                    $successCount++
                    continue
                }
                
                # Perform the replacements
                $newForward = $TomcatPath -replace '\\\\', '/'
                $newBackward = $TomcatPath
                
                # Replace forward slashes
                $content = $content -replace $oldForwardEscaped, $newForward
                
                # Replace backward slashes
                $content = $content -replace $oldBackwardEscaped, $newBackward
                
                # Write the entire content back to file
                $content | Set-Content -Path $filePath -NoNewline
                
                # Verify the file still has content and structure
                $verifyContent = Get-Content $filePath -Raw
                if ($verifyContent -eq $originalContent) {
                    Log-Message "WARNING: No changes detected in $($file.Name) after update"
                }
                
                # Count occurrences after replacement
                $occurrencesAfter = 0
                $occurrencesAfter += [regex]::Matches($verifyContent, [regex]::Escape($newForward)).Count
                $occurrencesAfter += [regex]::Matches($verifyContent, [regex]::Escape($newBackward)).Count
                
                # Verify file structure is preserved by checking line count
                $originalLines = ($originalContent -split "\`r\`n" -split "\`n").Count
                $updatedLines = ($verifyContent -split "\`r\`n" -split "\`n").Count
                
                if ($originalLines -eq $updatedLines) {
                    Log-Message "SUCCESS: Updated $($file.Name) - replaced $occurrencesBefore occurrences, file structure preserved ($originalLines lines)"
                } else {
                    Log-Message "WARNING: Updated $($file.Name) but line count changed from $originalLines to $updatedLines"
                }


                # --- Delete backup if update succeeded ---
                if (Test-Path $backupPath) {
                    Remove-Item -Path $backupPath -Force -ErrorAction SilentlyContinue
                }
                
                $successCount++
                
            } catch {
                Log-Message "ERROR: Failed to update $($file.Name) - $($_.Exception.Message)"
                # Restore from backup on error
                if (Test-Path $backupPath) {
                    Copy-Item -Path $backupPath -Destination $filePath -Force
                    Remove-Item -Path $backupPath -Force
                    Log-Message "Restored from backup: $filePath"
                }
                $failureCount++
            }
        }
        
        Log-Message "Tomcat Path Update Summary:"
        Log-Message "  - Successfully updated: $successCount files"
        Log-Message "  - Failed to update: $failureCount files"
        Log-Message "  - Old Tomcat Path: $oldTomcatPath"
        Log-Message "  - New Tomcat Path: $TomcatPath"
        
        if ($failureCount -eq 0) {
            Log-Message "SUCCESS: Tomcat path updated in all files successfully"
            return $true
        } else {
            Log-Message "WARNING: Some files could not be updated. Check logs for details."
            return $false
        }
        
    } catch {
        Log-Message "ERROR: Tomcat path update process failed - $($_.Exception.Message)"
        return $false
    }
}

function Install-NorthstarDesktopService {
    param(
        [string]$TomcatPath
    )
    
    Log-Message "Starting Northstar Desktop Service installation..."
    
    try {
        # Define the NS_Devices path
        $nsDevicesPath = Join-Path -Path $TomcatPath -ChildPath "webapps\\northstar\\Common\\NS_Devices"
        
        if (-not (Test-Path -LiteralPath $nsDevicesPath)) {
            Log-Message "ERROR: NS_Devices folder not found at: $nsDevicesPath"
            return $false
        }
        
        # Find all NorthstarServices zip files
        $northstarServiceFiles = Get-ChildItem -Path $nsDevicesPath -Filter "NorthstarServices-*.zip" | Sort-Object Name -Descending
        
        if ($northstarServiceFiles.Count -eq 0) {
            Log-Message "ERROR: No NorthstarServices zip files found in: $nsDevicesPath"
            return $false
        }
        
        # Select the latest version (first in descending order)
        $latestServiceFile = $northstarServiceFiles[0]
        Log-Message "Found Northstar Services files: $($northstarServiceFiles.Name -join ', ')"
        Log-Message "Selected latest version: $($latestServiceFile.Name)"
        
        # Create temporary extraction directory
        $tempExtractPath = Join-Path -Path $env:TEMP -ChildPath "NorthstarDesktopService"
        if (Test-Path -LiteralPath $tempExtractPath) {
            Remove-Item -Path $tempExtractPath -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Path $tempExtractPath -Force | Out-Null
        
        # Extract the zip file
        Log-Message "Extracting Northstar Desktop Service..."
        try {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            [System.IO.Compression.ZipFile]::ExtractToDirectory($latestServiceFile.FullName, $tempExtractPath)
        } catch {
            Log-Message "WARNING: System.IO.Compression extraction failed, trying fallback method: $($_.Exception.Message)"
            # Fallback: Use Expand-Archive
            try {
                Expand-Archive -Path $latestServiceFile.FullName -DestinationPath $tempExtractPath -Force
            } catch {
                Log-Message "ERROR: Both extraction methods failed: $($_.Exception.Message)"
                return $false
            }
        }
        
        # Find the extracted folder (should have the same name as the zip without extension)
        $folderName = [System.IO.Path]::GetFileNameWithoutExtension($latestServiceFile.Name)
        $extractedFolder = Join-Path -Path $tempExtractPath -ChildPath $folderName
        
        if (-not (Test-Path -LiteralPath $extractedFolder)) {
            # Try to find any folder in the temp path
            $subFolders = Get-ChildItem -Path $tempExtractPath -Directory
            if ($subFolders.Count -gt 0) {
                $extractedFolder = $subFolders[0].FullName
                Log-Message "Using extracted folder: $(Split-Path $extractedFolder -Leaf)"
            } else {
                Log-Message "ERROR: No extracted folder found in: $tempExtractPath"
                return $false
            }
        }
        
        # Find NSToolSetup.msi
        $msiPath = Join-Path -Path $extractedFolder -ChildPath "NSToolSetup.msi"
        if (-not (Test-Path -LiteralPath $msiPath)) {
            # Search recursively for the MSI file
            $msiFiles = Get-ChildItem -Path $extractedFolder -Filter "NSToolSetup.msi" -Recurse
            if ($msiFiles.Count -eq 0) {
                Log-Message "ERROR: NSToolSetup.msi not found in extracted files"
                return $false
            }
            $msiPath = $msiFiles[0].FullName
        }
        
        Log-Message "Found NSToolSetup.msi at: $msiPath"
        
        # Install the MSI silently
        Log-Message "Installing Northstar Desktop Service (this may take a moment)..."
        $installProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", "\`"$msiPath\`"", "/qn", "/norestart" -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Log-Message "SUCCESS: Northstar Desktop Service installed successfully"
            
            # Wait a moment for the service to be registered
            Start-Sleep -Seconds 5
            
            # Check if the service was created and start it
            $serviceName = "NorthstarDesktopServices"
            $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            
            if ($service) {
                Log-Message "Found Northstar Desktop Service: $serviceName"
                
                # Start the service if it's not running
                if ($service.Status -ne 'Running') {
                    Log-Message "Starting Northstar Desktop Service..."
                    Start-Service -Name $serviceName -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 3
                    
                    $service = Get-Service -Name $serviceName
                    if ($service.Status -eq 'Running') {
                        Log-Message "SUCCESS: Northstar Desktop Service started successfully"
                    } else {
                        Log-Message "WARNING: Northstar Desktop Service installed but could not be started automatically"
                    }
                } else {
                    Log-Message "Northstar Desktop Service is already running"
                }
            } else {
                Log-Message "WARNING: Northstar Desktop Service installed but service not found. It may start automatically on reboot."
            }
            
            # Clean up temporary files
            Remove-Item -Path $tempExtractPath -Recurse -Force -ErrorAction SilentlyContinue
            
            return $true
        } else {
            Log-Message "ERROR: MSI installation failed with exit code: $($installProcess.ExitCode)"
            # Clean up temporary files even on failure
            Remove-Item -Path $tempExtractPath -Recurse -Force -ErrorAction SilentlyContinue
            return $false
        }
        
    } catch {
        Log-Message "ERROR: Failed to install Northstar Desktop Service - $($_.Exception.Message)"
        return $false
    }
}

function Copy-RequiredDLLs {
    Log-Message "Checking for required DLL files for MySQL service installation..."
    
    $requiredDLLs = @(
        "vcruntime140.dll",
        "msvcp140.dll", 
        "vcruntime140_1.dll"
    )
    
    # Get the script directory dynamically - AUTO DETECT SCRIPT LOCATION
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $scriptPath = $PSCommandPath
    }
    $scriptDirectory = Split-Path -Path $scriptPath -Parent
    $dllSourceFolder = Join-Path -Path $scriptDirectory -ChildPath "dlls"
    $system32Path = "C:\\Windows\\System32"
    
    $dllsCopied = 0
    $dllsSkipped = 0
    $dllsFailed = 0
    
    # Check if DLL source folder exists
    if (-not (Test-Path -LiteralPath $dllSourceFolder)) {
        Log-Message "WARNING: DLL source folder not found: $dllSourceFolder"
        Log-Message "Skipping DLL installation - MySQL service might fail if required DLLs are missing"
        return
    }
    
    foreach ($dll in $requiredDLLs) {
        $sourcePath = Join-Path -Path $dllSourceFolder -ChildPath $dll
        $destinationPath = Join-Path -Path $system32Path -ChildPath $dll
        
        # Check if DLL already exists in System32
        if (Test-Path -LiteralPath $destinationPath) {
            Log-Message "DLL already exists in System32: $dll"
            $dllsSkipped++
            continue
        }
        
        # Check if source DLL exists in our dlls folder
        if (-not (Test-Path -LiteralPath $sourcePath)) {
            Log-Message "WARNING: Source DLL not found: $sourcePath"
            $dllsFailed++
            continue
        }
        
        try {
            Log-Message "Copying DLL to System32: $dll"
            Copy-Item -Path $sourcePath -Destination $destinationPath -Force -ErrorAction Stop
            
            # Verify the copy was successful
            if (Test-Path -LiteralPath $destinationPath) {
                Log-Message "SUCCESS: Copied DLL to System32: $dll"
                $dllsCopied++
            } else {
                Log-Message "WARNING: DLL copy verification failed: $dll"
                $dllsFailed++
            }
        } catch {
            Log-Message "ERROR: Failed to copy DLL $dll - $($_.Exception.Message)"
            $dllsFailed++
        }
    }
    
    # Provide summary
    Log-Message "DLL installation summary:"
    Log-Message "  - Successfully copied: $dllsCopied DLL(s)"
    Log-Message "  - Already existed (skipped): $dllsSkipped DLL(s)"
    Log-Message "  - Failed to copy: $dllsFailed DLL(s)"
    
    if ($dllsFailed -gt 0) {
        Log-Message "WARNING: Some DLL files failed to copy. MySQL service installation might fail."
    } else {
        Log-Message "SUCCESS: All required DLL files are available in System32"
    }
}

function Get-ArchiveFiles {
    param([string]$MigrationFolder, [string]$ArchiveName)
    
    # Get base name without extension for volume pattern matching
    $volumeBaseName = [System.IO.Path]::GetFileNameWithoutExtension($ArchiveName)
    
    # Check for multi-volume archives (WinRAR creates .part1.rar, .part2.rar, etc.)
    $volumePattern = "$volumeBaseName.part*.rar"
    $volumeFiles = Get-ChildItem -Path $MigrationFolder -Filter $volumePattern | Sort-Object @{

    Expression = {
        if ($_.Name -match 'part(\\d+)\\.rar$') {
            [int]$matches[1]
        } else {
            0
        }
        }
    }

    if ($volumeFiles.Count -gt 0) {
        Log-Message "Found $($volumeFiles.Count) volume files for extraction"
        
        # Log each volume found
        foreach ($volume in $volumeFiles) {
            $sizeGB = [math]::Round($volume.Length / 1GB, 2)
            Log-Message "Volume: $($volume.Name) ($sizeGB GB)"

        }

        return $volumeFiles
    }
    
    # Check for single archive
    $singleFile = Get-Item -Path (Join-Path -Path $MigrationFolder -ChildPath $ArchiveName) -ErrorAction SilentlyContinue
    if ($singleFile) {
        $sizeGB = [math]::Round($singleFile.Length / 1GB, 2)
        Log-Message "Found single archive file: $($singleFile.Name) ($sizeGB GB)"
        return @($singleFile)
    }
    
    # Final fallback: check for any RAR files starting with the base name
    $allRarFiles = Get-ChildItem -Path $MigrationFolder -Filter "$volumeBaseName*.rar" | Sort-Object Name
    if ($allRarFiles.Count -gt 0) {
        $totalSizeGB = [math]::Round(($allRarFiles | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        Log-Message "Found $($allRarFiles.Count) RAR files using fallback search. Total size: $totalSizeGB GB"
        return $allRarFiles
    }
    
    throw "No archive files found for extraction. Checked for: $volumePattern and $ArchiveName"
}

function Test-ExtractionSuccess {
    param(
        [string]$ExtractPath,
        [string]$ArchiveBaseName
    )
    
    try {
        Log-Message "Verifying extraction success..."
        
        # Check if extraction path exists and has content
        if (-not (Test-Path $ExtractPath)) {
            Log-Message "WARNING: Extraction path does not exist: $ExtractPath"
            return $false
        }
        
        # Get all items in extraction path
        $extractedItems = Get-ChildItem -Path $ExtractPath -Recurse -ErrorAction SilentlyContinue
        $itemCount = ($extractedItems | Measure-Object).Count
        
        if ($itemCount -gt 0) {
            Log-Message "SUCCESS: Found $itemCount files/directories in extraction path"
            
            # Check for some common expected directories to confirm proper extraction
            $commonDirs = @("Northstar", "Program Files", "Windows", "Users", "ProgramData")
            $foundDirs = $extractedItems | Where-Object { $_.PSIsContainer -and $commonDirs -contains $_.Name }
            
            if ($foundDirs.Count -gt 0) {
                Log-Message "SUCCESS: Found expected directories: $($foundDirs.Name -join ', ')"
            }
            
            return $true
        } else {
            Log-Message "WARNING: Extraction path exists but is empty"
            return $false
        }
    }
    catch {
        Log-Message "WARNING: Extraction verification failed: $($_.Exception.Message)"
        return $false
    }
}


function Invoke-RobustExtraction {
    param(
        [string]$WinRARPath,
        [string]$ExtractSource,
        [string]$ExtractPath
    )

    $archiveBaseName = [System.IO.Path]::GetFileNameWithoutExtension($ExtractSource)
    
    try {
        Log-Message "Starting archive extraction..."
        
        # Enhanced extraction parameters - SIMPLIFIED for reliability
        $extractArgs = @(
            "x",           # Extract with full paths
            "-y",          # Assume Yes to all
            "-o+",         # Overwrite all files
            "-idq",        # Quiet mode (suppress progress)
            "-r",          # Recurse subdirectories
            "\`"$ExtractSource\`"",
            "\`"$ExtractPath\`""
        )
        Log-Message "Executing: $WinRARPath $($extractArgs -join ' ')"
        
        $extractProcess = Start-Process -FilePath $WinRARPath -ArgumentList $extractArgs -Wait -NoNewWindow -PassThru
        
        # Handle WinRAR exit codes more intelligently
        switch ($extractProcess.ExitCode) {
            0 {
                # Success - verify extraction
                if (Test-ExtractionSuccess -ExtractPath $ExtractPath -ArchiveBaseName $archiveBaseName) {
                Log-Message "Extraction completed successfully (exit code 0)"
                return $true
                } else {
                    Log-Message "WARNING: Exit code 0 but extraction verification failed"
                    return $true
                }
            }
            1 {
                # Success with warnings - verify extraction
                if (Test-ExtractionSuccess -ExtractPath $ExtractPath -ArchiveBaseName $archiveBaseName) {
                Log-Message "Extraction completed with warnings (exit code 1)"
                return $true
                } else {
                    Log-Message "WARNING: Exit code 1 but extraction verification failed"
                    return $true
                }
            }
            2 {
                throw "Fatal error in WinRAR extraction (exit code 2)"
            }
            3 {
                Log-Message "WARNING: CRC error in WinRAR extraction (exit code 3) - some files may be corrupted, but continuing process"
                return $false
            }
            6 {
                throw "WinRAR extraction failed - insufficient memory (exit code 6)"
            }
            8 {
                throw "WinRAR extraction failed - not enough memory (exit code 8)"
            }
            9 {
                # Create file error - BUT often extraction still works
                Log-Message "WinRAR exit code 9 (file creation issue) - checking if extraction succeeded anyway..."
                
                if (Test-ExtractionSuccess -ExtractPath $ExtractPath -ArchiveBaseName $archiveBaseName) {
                    Log-Message "SUCCESS: Extraction completed despite exit code 9"
                    return $true
                } else {
                    Log-Message "WARNING: Extraction failed with exit code 9 and verification also failed"
                    return $false
                }
                
            }
            10 {
                throw "Wrong password for WinRAR extraction (exit code 10)"
            }
            255 {
                throw "User break or WinRAR process killed (exit code 255)"
            }
            default { 
                if ($extractProcess.ExitCode -ne 0) {
                    # Check if extraction succeeded despite non-zero exit code
                    if (Test-ExtractionSuccess -ExtractPath $ExtractPath -ArchiveBaseName $archiveBaseName) {
                        Log-Message "SUCCESS: Extraction completed despite exit code $($extractProcess.ExitCode)"
                        return $true
                    } else {
                        Log-Message "WARNING: WinRAR extraction completed with non-zero exit code $($extractProcess.ExitCode) - but continuing process"
                        return $false
                    }
                } else {
                    Log-Message "Extraction completed successfully (exit code 0)"
                    return $true
                }
            }
        }
    }
    catch {
        Log-Message "ERROR: Extraction process failed - $($_.Exception.Message) - but continuing with verification"
        return $false
    }
}

# MAIN EXECUTION
try {
    # Create migration folder
    New-Item -ItemType Directory -Path $MigrationFolder -Force | Out-Null
    "=======================================================" | Out-File -FilePath $LogPath -Encoding utf8
    Log-Message "Starting migration for client ${clientName} on drive ${drive}"

    # NEW: Check NodeJS installation
    Log-Message "Checking NodeJS installation..."
    if (-not (Test-CommandExists "npm")) {
        $msg = "NodeJS (npm) not found. Please install NodeJS from: https://nodejs.org/en/download"
        Log-Message $msg
        throw $msg
    }
    $nodeVersion = npm -v
    Log-Message "NodeJS version: $nodeVersion"

    # Verify WinRAR installation
    if (-not (Test-Path $WinRARPath)) {
        $msg = "WinRAR not found at '$WinRARPath'. Please install from: https://www.rarlab.com/download.htm"
        Log-Message $msg
        throw $msg
    }

    # Download RAR from S3 using AWS SDK for JavaScript - PARALLEL DOWNLOAD
    Log-Message "Downloading archive files from S3 with parallel downloads..."
    $downloadScript = @"
    const { S3Client, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
    const fs = require("fs");
    const path = require("path");

    async function downloadFile(s3Client, bucketName, key, localPath) {
      try {
        console.log("Starting download: " + path.basename(key));
        
        const getParams = {
          Bucket: bucketName,
          Key: key
        };

        const fileData = await s3Client.send(new GetObjectCommand(getParams));
        const fileStream = fs.createWriteStream(localPath);
        
        await new Promise((resolve, reject) => {
          fileData.Body.pipe(fileStream);
          fileData.Body.on("error", reject);
          fileStream.on("error", reject);
          fileStream.on("finish", resolve);
        });
        
        const stats = fs.statSync(localPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log("SUCCESS:" + path.basename(key) + ":" + fileSizeMB + " MB");
      } catch (err) {
        console.error("ERROR:" + path.basename(key) + ":" + err.message);
        throw err;
      }
    }

    async function downloadAllFiles() {
      const bucketName = "${S3_MIGRATION_BUCKET_NAME}";
      const folderName = "${s3Folder}";
      const archiveBaseName = "${clientName}-${formattedDate}";
      const migrationFolder = "$($MigrationFolder.Replace('\\', '\\\\'))";

      const s3Client = new S3Client({
        region: "$env:AWS_REGION",
        credentials: {
          accessKeyId: "$env:AWS_ACCESS_KEY_ID",
          secretAccessKey: "$env:AWS_SECRET_ACCESS_KEY"
        }
      });

      try {
        // List all objects in the S3 folder
        const listParams = {
          Bucket: bucketName,
          Prefix: folderName + '/'
        };

        const data = await s3Client.send(new ListObjectsV2Command(listParams));
        
        if (!data.Contents || data.Contents.length === 0) {
          throw new Error("No files found in S3 folder: " + folderName);
        }

        // Filter for RAR files that match our pattern (both single and multi-volume)
        const archiveFiles = data.Contents.filter(item => {
            const fileName = path.basename(item.Key);
            return fileName.startsWith(archiveBaseName) && fileName.endsWith('.rar');
        });
        
        if (archiveFiles.length === 0) {
          throw new Error("No archive files found in S3 folder: " + folderName);
        }
        
        console.log("Found " + archiveFiles.length + " archive files in S3");

        // Download files in batches of 5
        const batchSize = 5;
        for (let i = 0; i < archiveFiles.length; i += batchSize) {
          const batch = archiveFiles.slice(i, i + batchSize);
          const batchNumber = Math.floor(i/batchSize) + 1;
          const batchFileNames = batch.map(item => path.basename(item.Key)).join(', ');

          console.log("Downloading batch " + batchNumber + ": " + batchFileNames);
          
          const downloadPromises = batch.map(item => {
            const fileName = path.basename(item.Key);
            const localPath = path.join(migrationFolder, fileName);
            return downloadFile(s3Client, bucketName, item.Key, localPath);
          });

          await Promise.all(downloadPromises);
          console.log("Batch " + batchNumber + " completed successfully");
        }

        console.log("ALL_DOWNLOADS_COMPLETED");
      } catch (err) {
        console.error("ALL_DOWNLOADS_FAILED:" + err.message);
        process.exit(1);
      }
    }

    downloadAllFiles();
"@

    # Save the download script
    $downloadScriptPath = Join-Path -Path $MigrationFolder -ChildPath "download-from-s3.js"
    $downloadScript | Out-File -FilePath $downloadScriptPath -Encoding UTF8
    Log-Message "Created parallel download script: $downloadScriptPath"

    # Install required npm package
    Log-Message "Installing AWS SDK for S3..."
    Set-Location -Path $MigrationFolder
    npm init -y --quiet 2>&1 | Out-Null
    npm install @aws-sdk/client-s3 2>&1 | Out-Null

    # Execute the download script
    Log-Message "Starting parallel download process..."

    # Start the download process
    $nodeProcess = Start-Process -FilePath "node" -ArgumentList "\`"$downloadScriptPath\`"" -PassThru -NoNewWindow -Wait
    

    # Check exit code directly
    if ($nodeProcess.ExitCode -ne 0) {
        throw "Download process failed with exit code $($nodeProcess.ExitCode)"
    }

    # Wait a moment for file system to settle
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

    # Always use the FIRST volume (part1) for multi-volume extraction
    # WinRAR automatically finds and uses all subsequent volumes when extracting from part1
    $extractSource = $archiveFiles[0].FullName
    
    Log-Message "Extracting from first volume: $(Split-Path $extractSource -Leaf)"
    Log-Message "WinRAR will automatically use all $($archiveFiles.Count) volume files"

    # Use robust extraction function
    $extractionSuccess = Invoke-RobustExtraction -WinRARPath $WinRARPath -ExtractSource $extractSource -ExtractPath $extractPath

    if ($extractionSuccess) {
        Log-Message "Extraction completed successfully"
    } else {
        Log-Message "WARNING: Extraction completed with errors, but continuing with verification process"
    }
  
    Log-Message "Proceeding to extraction verification..."


    # Capture script path for self-deletion - FIXED: Use proper method to get script path
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $scriptPath = $PSCommandPath
    }

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

        $mysqlPathValidated = $false
        while (-not $mysqlPathValidated -and $InstallMySQLService) {
            if (-not (Test-Path $MySQLPath)) {
                Log-Message "ERROR: MySQL path not found: $MySQLPath"
                Write-Host "The MySQL path is incorrect. Please enter the correct MySQL path (without quotes) or type 'skip' to skip MySQL service installation:" -ForegroundColor Yellow
                
                $userInput = Read-Host

                if ($userInput -eq 'skip') {
                    $InstallMySQLService = $false
                    Log-Message "User chose to skip MySQL service installation."
                    break
                } else {
                    $MySQLPath = $userInput.Trim()
                    # Remove any trailing backslash for consistency
                    $MySQLPath = $MySQLPath.TrimEnd('\')
                    $MySQLBinPath = Join-Path -Path $MySQLPath -ChildPath "bin"
                    continue
                }
            }
        
            if (-not (Test-Path $MySQLBinPath)) {
                Log-Message "ERROR: MySQL bin directory not found: $MySQLBinPath"
                Write-Host "The MySQL bin directory is incorrect. Please enter the correct MySQL path (without quotes) or type 'skip' to skip MySQL service installation:" -ForegroundColor Yellow

                $userInput = Read-Host

                if ($userInput -eq 'skip') {
                    $InstallMySQLService = $false
                    Log-Message "User chose to skip MySQL service installation."
                    break
                } else {
                    $MySQLPath = $userInput.Trim()
                    $MySQLPath = $MySQLPath.TrimEnd('\')
                    $MySQLBinPath = Join-Path -Path $MySQLPath -ChildPath "bin"
                    continue
                }
            }

        Push-Location "$MySQLPath\\bin"
        
        Log-Message "MySQL Bin Location: $MySQLPath\\bin"
        Log-Message "Current working directory: $(Get-Location)"

        $mysqldExe = ".\\mysqld.exe"
        if (-not (Test-Path $mysqldExe)) {
            Log-Message "ERROR: mysqld.exe not found at $(Get-Location)"
            Write-Host "mysqld.exe not found in the MySQL bin directory. Please enter the correct MySQL path (without quotes) or type 'skip' to skip MySQL service installation:" -ForegroundColor Yellow
            $userInput = Read-Host

            if ($userInput -eq 'skip') {
                $InstallMySQLService = $false
                Log-Message "User chose to skip MySQL service installation."
                Pop-Location
                break
            } else {
                $MySQLPath = $userInput.Trim()
                $MySQLPath = $MySQLPath.TrimEnd('\')
                $MySQLBinPath = Join-Path -Path $MySQLPath -ChildPath "bin"
                Pop-Location
                continue
            }

        } else {
            $mysqlPathValidated = $true

            # Copy required DLL files for MySQL service installation
            Copy-RequiredDLLs

            # Wait to ensure the DLL files are copied.
            Write-Host "Waiting For the DLL files..."
            Start-Sleep -Seconds 4
            
            # Install MySQL service
            & $mysqldExe "-install" $MySQLServiceName
            Pop-Location
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
        }
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


        # Validate Tomcat path first
        $tomcatPathValidated = $false
        while (-not $tomcatPathValidated -and $InstallTomcatService) {
            if (-Not (Test-Path $TomcatBinPath)) {
                Log-Message "ERROR: Tomcat bin path not found: $TomcatBinPath"
                Write-Host "The Tomcat path is incorrect. Please enter the correct Tomcat path (without quotes) or type 'skip' to skip Tomcat service installation:" -ForegroundColor Yellow
                $userInputTomcat = Read-Host
                
                if ($userInputTomcat -eq 'skip') {
                    $InstallTomcatService = $false
                    Log-Message "User chose to skip Tomcat service installation."
                    break
                } else {
                    $TomcatPath = $userInputTomcat.Trim()
                    $TomcatPath = $TomcatPath.TrimEnd('\')
                    $TomcatBinPath = Join-Path -Path $TomcatPath -ChildPath "bin"
                    $serviceBatPath = Join-Path -Path $TomcatBinPath -ChildPath "service.bat"
                    continue
                }
            }
            
            # Check service.bat after Tomcat path is validated
            if (-Not (Test-Path $serviceBatPath)) {
                Log-Message "ERROR: service.bat not found in: $TomcatBinPath"
                Write-Host "service.bat not found in the Tomcat bin directory. Please enter the correct Tomcat path (without quotes) or type 'skip' to skip Tomcat service installation:" -ForegroundColor Yellow
                $userInputTomcat = Read-Host
                
                if ($userInputTomcat -eq 'skip') {
                    $InstallTomcatService = $false
                    Log-Message "User chose to skip Tomcat service installation."
                    break
                } else {
                    $TomcatPath = $userInputTomcat.Trim()
                    $TomcatPath = $TomcatPath.TrimEnd('\')
                    $TomcatBinPath = Join-Path -Path $TomcatPath -ChildPath "bin"
                    $serviceBatPath = Join-Path -Path $TomcatBinPath -ChildPath "service.bat"
                    continue
                }
            }
            
            $tomcatPathValidated = $true
        }

        # Validate Java Home separately
        $javaPathValidated = $false
        while (-not $javaPathValidated -and $InstallTomcatService) {
            if (-Not (Test-Path $JavaHome)) {
                Log-Message "ERROR: Java Home not found: $JavaHome"
                Write-Host "The JDK path is incorrect. Please enter the correct JDK path (without quotes) or type 'skip' to skip Tomcat service installation:" -ForegroundColor Yellow
                $userInputJDK = Read-Host

                if ($userInputJDK -eq 'skip') {
                    $InstallTomcatService = $false
                    Log-Message "User chose to skip Tomcat service installation."
                    break
                } else {
                    $JavaHome = $userInputJDK.Trim()
                    $JavaHome = $JavaHome.TrimEnd('\')
                    $JRE_HOME = "$JavaHome\\jre"
                    continue
                }
            }
            $javaPathValidated = $true
        }

        # If user skipped installation, break out
        if (-not $InstallTomcatService) {
            Log-Message "Skipping Tomcat service installation as requested by user."
            continue
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
            sc.exe config ${tomcatServiceName} start= delayed-auto | Out-Null
            Log-Message "Configured Tomcat service to start automatically (delayed)"

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
                $fontsSkipped = 0

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
                                    $fontsSkipped++
                                    continue
                                }
                                
                                # Copy font file to Windows Fonts directory
                                Log-Message "Installing font: $fontName"
                                Copy-Item -Path $fontFile.FullName -Destination $destinationPath -Force -ErrorAction Stop
                                
                                # Wait for file system to register the copy
                                Start-Sleep -Milliseconds 500
                                
                                # Verify installation
                                if (Test-Path $destinationPath) {
                                    $fontsInstalled++
                                    Log-Message "Successfully installed font: $fontName"
                                    
                                    # Update registry to register the font
                                    $registryPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"
                                    $fontRegistryName = $fontName -replace '\.[^.]*$', ''  # Remove extension
                                    
                                    # For TrueType fonts
                                    if ($fontName -match '\.ttf$|\.TTF$') {
                                        $fontRegistryName += " (TrueType)"
                                    }
                                    # For OpenType fonts
                                    elseif ($fontName -match '\.otf$') {
                                        $fontRegistryName += " (OpenType)"
                                    }
                                    
                                    # Add font to registry if it doesn't exist
                                    $existingValue = Get-ItemProperty -Path $registryPath -Name $fontRegistryName -ErrorAction SilentlyContinue
                                    if (-not $existingValue) {
                                        Set-ItemProperty -Path $registryPath -Name $fontRegistryName -Value $fontName -ErrorAction SilentlyContinue
                                        Log-Message "Added font to registry: $fontRegistryName"
                                    }
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
                
                # Provide comprehensive summary
                Log-Message "Font installation summary:"
                Log-Message "  - Successfully installed: $fontsInstalled font(s)"
                Log-Message "  - Already existed (skipped): $fontsSkipped font(s)"
                Log-Message "  - Failed to install: $fontsFailed font(s)"
                
                if ($fontsFailed -gt 0) {
                    Log-Message "WARNING: Some fonts failed to install. The application may still work, but some fonts might not be available."
                } else {
                    Log-Message "SUCCESS: All fonts processed successfully"
                }
            }

            # Update Environment Variables

            if ($SetEnvironmentVariables) {
                Set-WindowsEnvironmentVariables -TomcatPath $TomcatPath -JavaHome $JavaHome -JRE_HOME $JRE_HOME
            } else {
                Log-Message "Environment variables setup skipped (checkbox not enabled)"
            }

            # Update northstar.ini with internal IP if enabled
            if ($UpdateInternalIP -and $InternalIP) {
                Update-NorthstarINI -TomcatPath $TomcatPath -InternalIP $InternalIP
            } elseif ($UpdateInternalIP -and -not $InternalIP) {
                Log-Message "WARNING: Internal IP update enabled but no IP provided"
            }


            # Update Tomcat Path in configuration files if enabled
            if ($UpdateTomcatPath) {
                Update-TomcatPathInFiles -TomcatPath $TomcatPath
            } else {
                Log-Message "Tomcat Path Update skipped (checkbox not enabled)"
            }


            # Install Northstar Desktop Service if enabled
            if ($InstallNorthstarDesktop) {
                Install-NorthstarDesktopService -TomcatPath $TomcatPath
            } else {
                Log-Message "Northstar Desktop Service installation skipped (checkbox not enabled)"
            }


        } catch {
        Log-Message "An error occurred during Tomcat service installation."
        }   
    }

    # FIREWALL RULES ADDITION

    if ($AddFirewallRule -and $FirewallPorts) {
        Add-FirewallRules -Ports $FirewallPorts -ClientName $ClientName
    } elseif ($AddFirewallRule -and -not $FirewallPorts) {
        Log-Message "WARNING: Firewall rule creation enabled but no ports specified"
    } else {
        Log-Message "Firewall rule creation skipped (checkbox not enabled)"
    }


    # CONTROL CENTER SETUP
    if ($ControlCenterSetup) {
        Log-Message "Starting Control Center setup process..."
        Setup-ControlCenter
    } else {
        Log-Message "Control Center setup skipped (checkbox not enabled)"
    }

    # FINAL MIGRATION STATUS

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

    Write-Host "Press Enter to exit..."
    [Console]::ReadKey() | Out-Null
}
`;

    // Generate strong password for RAR download
    const rarPassword = generatePassword();
    const tempDir = path.join(os.tmpdir(), 'migration-scripts');
    fs.mkdirSync(tempDir, { recursive: true });

    const uniqueId = uuidv4();
    const scriptName = `migration-destination-${clientName}.ps1`;

    // Create the script file directly in temp directory (not in package folder)
    const scriptPath = path.join(tempDir, scriptName);
    fs.writeFileSync(scriptPath, script);

    // Create dlls folder directly in temp directory
    const dllsFolder = path.join(tempDir, 'dlls');
    fs.mkdirSync(dllsFolder, { recursive: true });

    // Copy DLL files to the dlls folder
    const dllSourcePath = path.join(process.cwd(), 'utils', 'dll');
    const dllFiles = ['vcruntime140.dll', 'msvcp140.dll', 'vcruntime140_1.dll'];

    dllFiles.forEach(dllFile => {
    const sourceFile = path.join(dllSourcePath, dllFile);
    const destFile = path.join(dllsFolder, dllFile);
    if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
    }
    });

    const rarFilePath = path.join(tempDir, `migration-destination-${clientName}-${uniqueId}.rar`);

    // Create RAR containing both the script and dlls folder at root level
    const rarCommand = `rar a -ep1 -hp"${rarPassword}" "${rarFilePath}" "${scriptPath}" "${dllsFolder}"`;

    exec(rarCommand, (err, stdout, stderr) => {
    // Clean up temporary files
    try {
        if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
        }
        if (fs.existsSync(dllsFolder)) {
        fs.rmSync(dllsFolder, { recursive: true, force: true });
        }
    } catch (cleanupErr) {
        console.error('Temporary files cleanup failed:', cleanupErr);
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