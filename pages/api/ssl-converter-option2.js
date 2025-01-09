import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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
      keytoolOutput,
      opensslOutput,
      message: `PEM file created successfully: ${pemFileName}`,
    };
  } catch (error) {
    console.error('Error during conversion:', error.message);
    if (error.message.includes('Import command completed')) {
      return {
        keytoolOutput: error.message,
        opensslOutput: 'No certificates were found, but the process completed successfully.',
        message: `PEM file created successfully (with warnings): ${pemFileName}`,
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
      const result = await convertKeystoreToPem({ keystoreName, keystorePassword });
      res.status(200).json({ results: result });
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
