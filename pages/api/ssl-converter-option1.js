import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const createP12 = ({ certFileName, keyFileName, bundleFileName, p12FileName, password }) =>
  new Promise((resolve, reject) => {
    const certFilePath = path.join(process.cwd(), 'Certs', certFileName);
    const keyFilePath = path.join(process.cwd(), 'Files', keyFileName);
    const bundleFilePath = path.join(process.cwd(), 'Certs', bundleFileName);
    const p12FilePath = path.join(process.cwd(), 'Files', `${p12FileName}.p12`);

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath) || !fs.existsSync(bundleFilePath)) {
      return reject(new Error('One or more required files are missing.'));
    }

    const openssl = spawn('openssl', [
      'pkcs12',
      '-export',
      '-in',
      certFilePath,
      '-inkey',
      keyFilePath,
      '-out',
      p12FilePath,
      '-name',
      'tomcat',
      '-CAfile',
      bundleFilePath,
      '-caname',
      'intermediate',
      '-chain',
      '-password',
      `pass:${password}`,
    ]);

    openssl.stderr.on('data', (data) => {
      console.error(`OpenSSL error: ${data.toString()}`);
    });

    openssl.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`OpenSSL process exited with code ${code}`));
      }
      resolve({ message: `P12 file created successfully: ${p12FileName}.p12`, filePath: p12FilePath });
    });
  });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { certFileName, keyFileName, bundleFileName, p12FileName, password } = req.body;

        if (!certFileName || !keyFileName || !bundleFileName || !p12FileName || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        try {
            const results = await createP12({ certFileName, keyFileName, bundleFileName, p12FileName, password });
            console.log(`The Results: ${results.message}`);
            
            
            await new Promise((resolve, reject) => {
              const interval = setInterval(() => {
                if (fs.existsSync(results.filePath)) {
                  clearInterval(interval);
                  resolve();
                }
              }, 500); // Check every 500ms
            });
            
            console.log(`Here See: ${path.basename(results.filePath)}`);
            
            return res.status(200).json({ 
              success: true, 
              results: results.message,
              file: path.basename(results.filePath) 
            });
            
            
            
        } catch (error) {
          // let temp = "Kindly recheck the password and try again";
          // //res.status(500).json({error: error.message });
          // res.status(500).json({temp});

          console.error(error);
          return res.status(500).json({ error: error.message });
        }
        } 
    else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }

}