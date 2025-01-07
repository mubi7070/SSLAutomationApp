import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export default async function handler(req, res) {
  if (req.method === 'GET') {
      
      const filesDir = path.join(process.cwd(), 'Certs');
      try {
        const allowedExtensions = ['.crt'];
        const keystoreFiles = fs.readdirSync(filesDir).filter((file) =>
            allowedExtensions.some((ext) => file.endsWith(ext))
        );
        res.status(200).json({ files: keystoreFiles });
      } catch (error) {
        console.error('Error reading directory:', error);
        res.status(500).json({ message: 'Unable to read Files directory.' });
      }
    }
    else {
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }

  
}
