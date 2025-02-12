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

const convertKeystoreToP12 = async ({ keystoreName, keystorePassword }) => {
  const filesDir = path.join(process.cwd(), 'Files');
  const keystorePath = path.join(filesDir, keystoreName);

  if (!fs.existsSync(keystorePath)) {
    throw new Error('Keystore file does not exist.');
  }

  const baseFileName = keystoreName.replace('.keystore', '');
  const p12FileName = `${baseFileName}.p12`;
  const p12FilePath = path.join(filesDir, p12FileName);

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


    return {
      keytoolOutput,
      message: `P12 file created successfully: ${p12FileName}`,
      filePath: p12FilePath
    };
  } catch (error) {
    console.error('Error during conversion:', error.message);
    if (error.message.includes('Import command completed')) {
      return {
        keytoolOutput: error.message,
        message: `P12 file created successfully (with warnings): ${p12FileName}`,
        filePath: p12FilePath
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
      const results = await convertKeystoreToP12({ keystoreName, keystorePassword });

      await new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (fs.existsSync(results.filePath)) {
            clearInterval(interval);
            resolve();
          }
        }, 500); // Check every 500ms
      });

      return res.status(200).json({ 
        success: true, 
        results: results.message,
        file: path.basename(results.filePath) 
      });


      //res.status(200).json({ results: result });
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
