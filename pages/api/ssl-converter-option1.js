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

const deleteExistingFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted existing file: ${path.basename(filePath)}`);
  }
};

const createP12 = ({ certFileName, keyFileName, bundleFileName, p12FileName, password }) =>
  new Promise((resolve, reject) => {
    const certFilePath = path.join(process.cwd(), 'Certs', certFileName);
    const keyFilePath = path.join(process.cwd(), 'Files', keyFileName);
    const bundleFilePath = path.join(process.cwd(), 'Certs', bundleFileName);
    const p12FilePath = path.join(process.cwd(), 'Files', `${p12FileName}.p12`);


    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath) || !fs.existsSync(bundleFilePath)) {
      return reject(new Error('One or more required files are missing.'));
    }

    deleteExistingFile(p12FilePath);

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

            let allFiles = [`${results.filePath}`];

            try {
              await Promise.all(allFiles.map(file => uploadToS3(file)));
            } catch (uploadError) {
              console.error('Error uploading files to S3:', uploadError);
              // Optionally add a warning message to the response
              // results.message.push('Warning: Some files could not be backed up to S3.');
            }
            
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