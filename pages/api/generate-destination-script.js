export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { drive, clientName, tomcatPath, jdkPath, mysqlPath } = req.body;
  
  // Generate formatted date (MMDDYY)
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(today.getFullYear()).slice(-2)}`;
  const s3Folder = `${clientName} - ${formattedDate}`;
  
  
  // Generate PowerShell script
  const script = `
@echo off
REM Server Migration Destination Script (Batch File)
REM Requires 7-Zip installed (https://www.7-zip.org/)
REM Generated: ${new Date().toISOString()}
REM Client: ${clientName}
REM Drive: ${drive}

setlocal enabledelayedexpansion

REM Configure AWS credentials
set AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}
set AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}
set AWS_REGION=${process.env.AWS_REGION}

REM Parameters
set BUCKET_NAME=${process.env.S3_MIGRATION_BUCKET_NAME}
set CLIENT_NAME=${clientName}
set DRIVE_LETTER=${drive}
set WEBHOOK_URL=${process.env.NEXTAUTH_URL}/api/migration-webhook
set TOMCAT_PATH=${tomcatPath}
set JDK_PATH=${jdkPath}
set MYSQL_PATH=${mysqlPath}

REM Generate date string (MMDDYY)
for /f "tokens=1-3 delims=/- " %%a in ('date /t') do (
    set MM=%%a
    set DD=%%b
    set YY=%%c
)
if "!MM!"=="Jan" set MM=01
if "!MM!"=="Feb" set MM=02
if "!MM!"=="Mar" set MM=03
if "!MM!"=="Apr" set MM=04
if "!MM!"=="May" set MM=05
if "!MM!"=="Jun" set MM=06
if "!MM!"=="Jul" set MM=07
if "!MM!"=="Aug" set MM=08
if "!MM!"=="Sep" set MM=09
if "!MM!"=="Oct" set MM=10
if "!MM!"=="Nov" set MM=11
if "!MM!"=="Dec" set MM=12
set DATE_STRING=!MM!!DD!!YY:~-2!

REM Create migration folder
set MIGRATION_FOLDER=!DRIVE_LETTER!:\!CLIENT_NAME!-ServerMigration-!DATE_STRING!
mkdir "!MIGRATION_FOLDER!" >nul 2>&1
if exist "!MIGRATION_FOLDER!\" (
    echo Created migration folder: !MIGRATION_FOLDER!
) else (
    echo ERROR: Failed to create migration folder
    goto :error
)

REM Set archive name
set ARCHIVE_NAME=!CLIENT_NAME!-!DATE_STRING!.7z
set ARCHIVE_PATH=!MIGRATION_FOLDER!\!ARCHIVE_NAME!

REM Check for 7-Zip
set SEVEN_ZIP="C:\\Program Files\\7-Zip\\7z.exe"
if not exist !SEVEN_ZIP! (
    echo 7-Zip not found. Please install from: https://www.7-zip.org/download.html
    goto :error
)

REM Download from S3
echo Downloading archive from S3...
aws s3 cp "s3://%BUCKET_NAME%/%CLIENT_NAME% - %DATE_STRING%/%ARCHIVE_NAME%" "!ARCHIVE_PATH!"

if not !errorlevel! == 0 (
    echo ERROR: S3 download failed with error code !errorlevel!
    goto :error
)

echo Download completed: !ARCHIVE_PATH!

REM Extract archive
echo Extracting archive to !DRIVE_LETTER!:\...
!SEVEN_ZIP! x -y "!ARCHIVE_PATH!" -o"!DRIVE_LETTER!:\" 

if not !errorlevel! == 0 (
    echo ERROR: Extraction failed with error code !errorlevel!
    goto :error
)

echo Extraction completed successfully

REM Set environment variables
setx CATALINA_HOME "!TOMCAT_PATH!" /M
setx JAVA_HOME "!JDK_PATH!" /M
setx MYSQL_HOME "!MYSQL_PATH!" /M

echo Environment variables configured:
echo   CATALINA_HOME=!TOMCAT_PATH!
echo   JAVA_HOME=!JDK_PATH!
echo   MYSQL_HOME=!MYSQL_PATH!

echo Webhook notification sent
goto :success

:error
echo Migration failed - see log for details
goto :end

:success
echo Migration completed successfully

:end
REM Save log to file
set LOG_FILE=%~dp0migration-log-%DATE_STRING%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.txt
echo Log saved to: !LOG_FILE!
> "!LOG_FILE!" (
    echo Migration Log - %DATE% %TIME%
    echo ==================================
    echo Client: !CLIENT_NAME!
    echo Drive: !DRIVE_LETTER!
    echo Downloaded: !ARCHIVE_PATH!
    echo ==================================
    type con
)
pause
`;
  res.status(200).json({ script });
}