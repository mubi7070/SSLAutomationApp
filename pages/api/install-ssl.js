import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

export default async function handler(req, res) {
  const certsDir = 'D:\\SSLAutomationApp\\Certs'; // Adjust if necessary
  try {
    const files = fs.readdirSync(certsDir).filter(file => file.endsWith('.crt', '.ca-bundle'));
    console.log("The .crt files are present");
    
  } catch (error) {
    res.status(500).json({ message: 'Error reading certificates directory.' });
  }


  if (req.method === 'POST') {
    const { certPaths, keystoreName, keystorePassword } = req.body;

    if (!certPaths || !keystoreName || !keystorePassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const filesDir = path.join(process.cwd(), 'Files');
    const keystorePath = path.join(filesDir, keystoreName);
    const results = [];

    try {
      for (const { alias, path: certPath, enabled } of certPaths) {
        if (!enabled) continue;

        const commandOutput = await new Promise((resolve, reject) => {
          const process = spawn('keytool', [
            '-import',
            '-trustcacerts',
            '-alias', alias,
            '-file', certPath,
            '-keystore', keystorePath,
          ]);

          let output = '';

          process.stdout.on('data', (data) => (output += data.toString()));
          process.stderr.on('data', (data) => (output += data.toString()));

          process.on('close', (code) => {
            if (code !== 0) {
              reject(`Failed to install certificate with alias: ${alias}\nOutput: ${output}`);
            } else {
              resolve(output.trim());
            }
          });

          process.stdin.write(`${keystorePassword}\n`);
          process.stdin.write('YES\n');
          process.stdin.end();
        });

        results.push({ alias, output: commandOutput });
      }

      return res.status(200).json({ 
        results: results,
        file: keystoreName
      });
    } catch (error) {
      return res.status(500).json({ message: `Error: ${error}` });
    }
  } else if (req.method === 'GET') {
    
    const filesDir = path.join(process.cwd(), 'Files');
    try {
      const keystoreFiles = fs.readdirSync(filesDir).filter((file) => file.endsWith('.keystore'));
      res.status(200).json({ files: keystoreFiles });
    } catch (error) {
      console.error('Error reading directory:', error);
      res.status(500).json({ message: 'Unable to read Files directory.' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
