import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import { PassThrough } from 'stream';

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

    // Generate strong password
    const password = generatePassword();

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
      '"System Volume Information"',
      '"$RECYCLE.BIN"'
    ];

    const allExclusions = [...defaultExclusions, ...excludePaths];

    // Create PowerShell script
    const script = `
# Server Migration Source Script
# Requires WinRAR installed (https://www.rarlab.com/)
# Generated: ${new Date().toISOString()}
# Client: ${clientName}
# Drive: ${drive}

# AWS Configuration
$env:AWS_ACCESS_KEY_ID = "${process.env.AWS_ACCESS_KEY_ID}"
$env:AWS_SECRET_ACCESS_KEY = "${process.env.AWS_SECRET_ACCESS_KEY}"
$env:AWS_REGION = "${process.env.AWS_REGION}"

# Parameters
$BucketName = "${process.env.S3_MIGRATION_BUCKET_NAME}"
$FolderName = "${s3Folder}"
$DriveLetter = "${drive}"
$MigrationFolder = "${drive}:\\${clientName}-ServerMigration-${formattedDate}"
$LogPath = "$MigrationFolder\\${clientName}-${formattedDate}.log"
$ArchiveName = "${archiveName}"
$ArchivePath = "$MigrationFolder\\$ArchiveName"
$WinRARPath = "C:\\Program Files\\WinRAR\\WinRAR.exe"

function Schedule-FileDeletion {
    param(
        [string]$FilePath
    )
    $deleteCommand = @"
        Start-Sleep -Seconds 60
        if (Test-Path -LiteralPath "$FilePath") {
            Remove-Item -LiteralPath "$FilePath" -Force -ErrorAction SilentlyContinue
        }
"@
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($deleteCommand)
    $encodedCommand = [Convert]::ToBase64String($bytes)
    Start-Process -WindowStyle Hidden -FilePath "powershell.exe" -ArgumentList "-EncodedCommand", $encodedCommand
}

function Log-Message {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Write-Host $logEntry
    $logEntry | Out-File -FilePath $LogPath -Append -Encoding utf8
}

# Create migration folder
New-Item -ItemType Directory -Path $MigrationFolder -Force | Out-Null
Log-Message "Created migration folder: $MigrationFolder"
Log-Message "Starting migration for client ${clientName} on drive ${drive}"

# Check for WinRAR
if (-not (Test-Path $WinRARPath)) {
    $msg = "WinRAR not found. Please install from: https://www.rarlab.com/download.htm"
    Log-Message $msg
    throw $msg
}

try {
    # Delete existing archive if present
    if (Test-Path $ArchivePath) {
        Remove-Item -Path $ArchivePath -Force
        Log-Message "Deleted existing archive: $ArchivePath"
    }

    # Build exclusion arguments
    $exclusionArgs = @()
    $exclusions = @(
      ${allExclusions.map(e => `"${e.replace(/"/g, '')}"`).join(", ")}
    )
    
    foreach ($ex in $exclusions) {
      $exclusionArgs += "-xr!$ex"
    }

    # Archive drive using WinRAR
    Log-Message "Archiving drive ${drive} using WinRAR with exclusions..."
    
    # Execute WinRAR command
    $commandArgs = @(
        "a",
        "-r",
        "-ep1",
        "-hp${password}",
        "-y",
        "\`\"$ArchivePath\`\"",
        "${drive}:\\*"
        ) + $exclusionArgs

    # Log command for debugging (without password)
    $loggedArgs = $commandArgs -replace "-hp${password}", "-hp*****"
    $commandLine = "$WinRARPath $($loggedArgs -join ' ')"
    Log-Message "Executing: $commandLine"
    
    $process = Start-Process -FilePath $WinRARPath -ArgumentList $commandArgs -Wait -NoNewWindow -PassThru
    
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
      const fileName = path.basename(filePath);
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
        Log-Message "ERROR: $errorMsg"
    } finally {
        # Schedule JS file deletion whether successful or not
        if ($uploadScriptPath -and (Test-Path -LiteralPath $uploadScriptPath)) {
            Schedule-FileDeletion -FilePath $uploadScriptPath
            Log-Message "Scheduled deletion of $uploadScriptPath in 1 minute"
        }
        
        # Schedule self-deletion of this script
        $scriptPath = $MyInvocation.MyCommand.Path
        if ($scriptPath) {
            Log-Message "Scheduling self-deletion of this script"
            $deleteCommand = "Start-Sleep -Seconds 1; Remove-Item -LiteralPath '$scriptPath' -Force -ErrorAction SilentlyContinue"
            Start-Process -WindowStyle Hidden -FilePath powershell.exe -ArgumentList "-Command", $deleteCommand
        }
        
        Log-Message "Log saved to $LogPath"
        Log-Message "Press Enter to exit..."
        $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
    }

`;

// Set headers for PowerShell script download
    res.setHeader('X-Password', password);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=migration-source-${clientName}.ps1`);
    res.status(200).send(script);
}