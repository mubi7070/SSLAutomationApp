export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { drive, clientName, tomcatPath, jdkPath, mysqlPath } = req.body;

  // Validate input parameters
  if (!drive || !clientName || !tomcatPath || !jdkPath || !mysqlPath) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
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
    [string]$TomcatPath = "${tomcatPath.replace(/\\/g, '\\\\')}",
    [string]$JavaHome = "${jdkPath.replace(/\\/g, '\\\\')}",
    [string]$MySQLPath = "${mysqlPath.replace(/\\/g, '\\\\')}"
)

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
}
`;

  res.status(200).json({ script });
}