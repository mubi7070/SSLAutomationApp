import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const deleteExistingFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted existing file: ${path.basename(filePath)}`);
  }
};

async function uploadToS3(filePath) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `backup/${fileName}`,
    Body: fileContent,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`Uploaded ${fileName} to S3`);
  } catch (err) {
    console.error("Error uploading to S3:", err);
    throw err;
  }
}

const executeCommand = (command, args, inputs = []) =>
  new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
    });

    inputs.forEach((input) => {
      process.stdin.write(`${input}\n`);
    });

    process.stdin.end();

    process.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(error || `Process exited with code ${code}`));
      }
      resolve(output);
    });
  });

const convertKeystoreToPem = async ({ keystoreName, keystorePassword }) => {
  const filesDir = path.join(process.cwd(), 'Files');
  const keystorePath = path.join(filesDir, keystoreName);


  if (!fs.existsSync(keystorePath)) {
    throw new Error('Keystore file does not exist.');
  }

  const baseFileName = keystoreName.replace('.keystore', '');
  const p12FileName = `${baseFileName}.p12`;
  const pemFileName = `${baseFileName}.pem`;
  const p12FilePath = path.join(filesDir, p12FileName);
  const pemFilePath = path.join(filesDir, pemFileName);

  deleteExistingFile(p12FilePath);
  deleteExistingFile(pemFilePath);

  const keytoolArgs = [
    '-importkeystore',
    '-srckeystore',
    keystorePath,
    '-destkeystore',
    p12FilePath,
    '-deststoretype',
    'PKCS12',
  ];

  try {
    const keytoolOutput = await executeCommand('keytool', keytoolArgs, [
      keystorePassword, // Destination password
      keystorePassword, // Confirm destination password
      keystorePassword, // Source keystore password
    ]);

    console.log('Keytool Output:', keytoolOutput);

    const opensslArgs = [
      'pkcs12',
      '-in',
      p12FilePath,
      '-nodes',
      '-nocerts',
      '-out',
      pemFilePath,
      '-passin',
      `pass:${keystorePassword}`,
    ];

    const opensslOutput = await executeCommand('openssl', opensslArgs);
    console.log('OpenSSL Output:', opensslOutput);

    return { 
      message: `PEM file created successfully: ${pemFileName}`, 
      filePath: pemFilePath 
    };
    // return {
    //   keytoolOutput,
    //   opensslOutput,
    //   message: `PEM file created successfully: ${pemFileName}`,
    //   filePath: pemFilePath
    // };
  } catch (error) {
    console.error('Error during conversion:', error.message);
    if (error.message.includes('Import command completed')) {
      return {
        // keytoolOutput: error.message,
        // opensslOutput: 'No certificates were found, but the process completed successfully.',
        message: `PEM file created successfully (with warnings): ${pemFileName}`,
        filePath: pemFilePath
      };
    }
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { keystoreName, keystorePassword } = req.body;

    if (!keystoreName || !keystorePassword) {
      return res.status(400).json({ error: 'Keystore name and password are required.' });
    }

    try {
      const results = await convertKeystoreToPem({ keystoreName, keystorePassword });

      //console.log(`Here See: ${path.basename(result.filePath)}`);

      await new Promise((resolve, reject) => {
              const interval = setInterval(() => {
                if (fs.existsSync(results.filePath)) {
                  clearInterval(interval);
                  resolve();
                }
              }, 500); // Check every 500ms
            });

      let allFiles = [`${results.filePath}`];

      try {
        await Promise.all(allFiles.map(file => uploadToS3(file)));
      } catch (uploadError) {
        console.error('Error uploading files to S3:', uploadError);
        // Optionally add a warning message to the response
        messages.push('Warning: Some files could not be backed up to S3.');
      }

      //res.status(200).json({ results: result });
      return res.status(200).json({ 
        success: true, 
        results: results.message,
        file: path.basename(results.filePath) 
      });

    } catch (error) {
        let temp = "Kindly recheck the password and try again";
        //res.status(500).json({error: error.message });
        res.status(500).json({temp});
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
