import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { log } from 'util';

const ensureFilesDirectory = () => {
  const dirPath = path.join(process.cwd(), 'Files');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  return dirPath;
};

const generateTomcatCSR = (domain, password) => 
  new Promise((resolve, reject) => {
    const filesDir = ensureFilesDirectory();
    const year = new Date().getFullYear();
    const keystoreFile = path.join(filesDir, `${domain}${year}.keystore`);
    const csrFile = path.join(filesDir, `${domain}${year}.csr`);

    console.log(`The password is: ${password}`);
    

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

    // Provide user-provided password
    keytoolGen.stdin.write(`${password}\n`); // Keystore password
    keytoolGen.stdin.write(`${password}\n`); // Confirm password
    keytoolGen.stdin.write(`${domain}\n`);   // CN (Common Name)
    keytoolGen.stdin.write(`IT\n`);          // OU (Organizational Unit)
    keytoolGen.stdin.write(`Northstar Technologies\n`); // O (Organization Name)
    keytoolGen.stdin.write(`Alpharetta\n`);  // L (City)
    keytoolGen.stdin.write(`Georgia\n`);     // S (State)
    keytoolGen.stdin.write(`US\n`);          // C (Country)
    keytoolGen.stdin.write(`yes\n`);         // Confirm correctness
    keytoolGen.stdin.end();

    keytoolGen.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to generate keystore for ${domain}. Kindly recheck if the same CSR already exists in the directory!`));
      }

      // Generate CSR using the same password
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

      keytoolReq.stdin.write(`${password}\n`); // Provide password for CSR generation
      keytoolReq.stdin.end();

      keytoolReq.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Failed to generate CSR for ${domain}`));
        }
        resolve(`Keystore and CSR generated for ${domain}`);
      });
    });
  });

const generateApacheCSR = (domain, password) =>
  new Promise((resolve, reject) => {
    const filesDir = ensureFilesDirectory();
    const year = new Date().getFullYear();
    const keyFile = path.join(filesDir, `${domain}${year}.key`);
    const csrFile = path.join(filesDir, `${domain}${year}.csr`);
    const configPath = 'C:/Apache24/conf/openssl.cnf';

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
      resolve(`CSR and key generated for ${domain}`);
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
      
    const results = await Promise.all(
      domains.map((domain) => generateFunction(domain, password))
    
    );
    res.status(200).json({ message: 'Success', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
