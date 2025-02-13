import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

const certsDir = 'D:\\SSLAutomationApp\\Certs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create directory if not exists
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }

    const form = new IncomingForm();
    const files = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve(files.certificates || []);
      });
    });

    let uploadedCount = 0;
    for (const file of files) {
      const filePath = path.join(certsDir, file.originalFilename);
      const fileData = fs.readFileSync(file.filepath);
      fs.writeFileSync(filePath, fileData);
      uploadedCount++;
    }

    return res.status(200).json({ 
      message: 'Files uploaded successfully',
      uploadedCount 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading files' });
  }
}