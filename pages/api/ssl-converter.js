import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const createP12 = ({ certFileName, keyFileName, bundleFileName, p12FileName, password }) =>
  new Promise((resolve, reject) => {
    const certFilePath = path.join(process.cwd(), 'Certs', certFileName);
    const keyFilePath = path.join(process.cwd(), 'Files', keyFileName);
    const bundleFilePath = path.join(process.cwd(), 'Certs', bundleFileName);
    const p12FilePath = path.join(process.cwd(), 'Files', `${p12FileName}.p12`);

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

    openssl.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to create P12 file: ${p12FileName}.p12`));
      } else {
        return resolve(`P12 file created successfully: ${p12FileName}.p12`);
      }
    });
  });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { certFileName, keyFileName, bundleFileName, p12FileName, password } = req.body;
    console.log(`
        certFileName: ${certFileName}, 
        keyFileName: ${keyFileName}, 
        bundleFileName: ${bundleFileName}, 
        p12FileName: ${p12FileName}, 
        password: ${password}`
    );
        if (!certFileName || !keyFileName || !bundleFileName || !p12FileName || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        try {
            const results = await createP12({ certFileName, keyFileName, bundleFileName, p12FileName, password });
            return res.status(200).json({ message: results });
            //return res.status(200).json({ results });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
        } 
    else {
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }

}
