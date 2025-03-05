import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import DownloadFiles from "../components/DownloadFiles";


const ensureFilesDirectory = () => {
  const dirPath = path.join(process.cwd(), 'Files');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  return dirPath;
};

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

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const renameExistingFiles = (filesDir, baseName, extensions) => {
  const files = fs.readdirSync(filesDir);
  let maxVersion = 0;

  const regexPattern = new RegExp(
    `^${escapeRegExp(baseName)}-old-(\\d+)\\.(${extensions.join('|')})$`
  );

  files.forEach(file => {
    const match = file.match(regexPattern);
    if (match) {
      const version = parseInt(match[1], 10);
      if (version > maxVersion) {
        maxVersion = version;
      }
    }
  });

  const nextVersion = maxVersion + 1;

  extensions.forEach(ext => {
    const oldPath = path.join(filesDir, `${baseName}.${ext}`);
    if (fs.existsSync(oldPath)) {
      const newPath = path.join(filesDir, `${baseName}-old-${nextVersion}.${ext}`);
      fs.renameSync(oldPath, newPath);
    }
  });
};

const generateTomcatCSR = (domain, password) => 
  new Promise((resolve, reject) => {
    const filesDir = ensureFilesDirectory();
    const year = new Date().getFullYear();
    let keystoreFile = "";
    let csrFile = "";
    let baseName = "";

    if (domain.startsWith('*.')) {
      let tempdomain = domain.substring(2);  // It willl remove "*." from the start
      baseName = `star.${tempdomain}${year}`;
      keystoreFile = path.join(filesDir, `star.${tempdomain}${year}.keystore`);
      csrFile = path.join(filesDir, `star.${tempdomain}${year}.csr`);
    }
    else {
      baseName = `${domain}${year}`;
      keystoreFile = path.join(filesDir, `${domain}${year}.keystore`);
      csrFile = path.join(filesDir, `${domain}${year}.csr`);
    }

    if (fs.existsSync(keystoreFile) || fs.existsSync(csrFile)) {
      renameExistingFiles(filesDir, baseName, ['keystore', 'csr']);
    }

    console.log(`The domain is: ${domain}`);
    console.log(`The password is: ${password}`);
    console.log(`The keystoreFile is: ${keystoreFile}`);
    console.log(`The CSRFile is: ${csrFile}`);

    const keytoolGen = spawn('keytool', [
      '-genkey',
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-alias',
      'godaddy',
      '-keystore',
      keystoreFile,
    ]);

    keytoolGen.stdin.write(`${password}\n`); // Keystore password
    keytoolGen.stdin.write(`${password}\n`); // Confirm password
    keytoolGen.stdin.write(`${domain}\n`);   // CN (Common Name)
    keytoolGen.stdin.write(`IT\n`);          // OU (Organizational Unit)
    keytoolGen.stdin.write(`Northstar Technologies\n`); // O (Organization Name)
    keytoolGen.stdin.write(`Alpharetta\n`);  // L (City)
    keytoolGen.stdin.write(`Georgia\n`);     // S (State)
    keytoolGen.stdin.write(`US\n`);          // C (Country)
    keytoolGen.stdin.write(`yes\n`);         // Confirmation 
    keytoolGen.stdin.end();

    keytoolGen.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to generate keystore for ${domain}. Kindly recheck if the same CSR already exists in the directory!`));
      }

      const keytoolReq = spawn('keytool', [
        '-certreq',
        '-keyalg',
        'RSA',
        '-alias',
        'godaddy',
        '-file',
        csrFile,
        '-keystore',
        keystoreFile,
      ]);

      keytoolReq.stdin.write(`${password}\n`); 
      keytoolReq.stdin.end();

      keytoolReq.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Failed to generate CSR for ${domain}`));
        }

        // In generateTomcatCSR function
        resolve({
          message: `Keystore and CSR generated for ${domain}`,
          files: [keystoreFile, csrFile]
        });
        //resolve(`Keystore and CSR generated for ${domain}`);
      });
    });
  });

const generateApacheCSR = (domain, password) =>
  new Promise((resolve, reject) => {
    const filesDir = ensureFilesDirectory();
    const year = new Date().getFullYear();
    let keyFile = "";
    let csrFile = "";
    let baseName = "";

    if (domain.startsWith('*.')) {
      let tempdomain = domain.substring(2);  // It willl remove "*." from the start
      baseName = `star.${tempdomain}${year}`;
      keyFile = path.join(filesDir, `star.${tempdomain}${year}.key`);
      csrFile = path.join(filesDir, `star.${tempdomain}${year}.csr`);
    }
    else {
      baseName = `${domain}${year}`;
      keyFile = path.join(filesDir, `${domain}${year}.key`);
      csrFile = path.join(filesDir, `${domain}${year}.csr`);
    }
    
    if (fs.existsSync(keyFile) || fs.existsSync(csrFile)) {
      renameExistingFiles(filesDir, baseName, ['key', 'csr']);
    }

    const configPath =
      os.platform() === "win32"
        ? "C:/Apache24/conf/openssl.cnf"
        : "/etc/ssl/openssl.cnf";

    const openssl = spawn('openssl', [
      'req',
      '-config',
      configPath,
      '-new',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      keyFile,
      '-out',
      csrFile,
    ]);

    openssl.stdin.write(`US\n`);             // C (Country)
    openssl.stdin.write(`Georgia\n`);        // S (State)
    openssl.stdin.write(`Alpharetta\n`);     // L (City)
    openssl.stdin.write(`Northstar Technologies\n`); // O (Organization Name)
    openssl.stdin.write(`IT\n`);             // OU (Organizational Unit)
    openssl.stdin.write(`${domain}\n`);      // CN (Common Name)
    openssl.stdin.write(`\n`);               // Email (optional)
    openssl.stdin.write(`${password}\n`);    // CSR password
    openssl.stdin.write(`\n`);               // Optional fields
    openssl.stdin.end();

    openssl.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to generate CSR and key for ${domain}`));
      }

      // In generateApacheCSR function
      resolve({
        message: `CSR and key generated for ${domain}`,
        files: [keyFile, csrFile]
      });
      //resolve(`CSR and key generated for ${domain}`);
    });
  });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domains, option, password } = req.body;

  if (!domains || !Array.isArray(domains) || domains.length === 0) {
    return res.status(400).json({ error: 'Invalid domains provided' });
  }
  if (!['Tomcat', 'Apache'].includes(option)) {
    return res.status(400).json({ error: 'Invalid option provided' });
  }

  try {
    const generateFunction =
      option === 'Tomcat' ? generateTomcatCSR : generateApacheCSR;
      
      console.log(`The Password in Promise is: ${password}`);
      
      const generationResults = await Promise.all(
        domains.map((domain) => generateFunction(domain, password))
      );

      const messages = generationResults.map(r => r.message);
      const allFiles = generationResults.flatMap(r => r.files);
      const allFilesNew = generationResults.flatMap(r => r.files.map(file => path.basename(file))); // Extracts only the filename

      console.log(`All files are:
        ${allFiles}
        `);
      
        // Ensure all files are completely written before responding
        await Promise.all(allFiles.map(file => {
          return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
              if (fs.existsSync(file)) {
                clearInterval(interval);
                resolve();
              }
            }, 500); // Check every 500ms
          });
        }));


      try {
        await Promise.all(allFiles.map(file => uploadToS3(file)));
      } catch (uploadError) {
        console.error('Error uploading files to S3:', uploadError);
        // Optionally add a warning message to the response
        messages.push('Warning: Some files could not be backed up to S3.');
      }

    // In the success case
    res.status(200).json({ 
      success: true,
      results: messages, // Array of success messages
      files: allFilesNew // Sending files back to frontend
    });
  } catch (error) {
    // In error cases
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
