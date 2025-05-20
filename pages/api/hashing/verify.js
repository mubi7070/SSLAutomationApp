// Run this in Node.js to verify password matching
const bcrypt = require('bcryptjs');
const password = 'sibisoft2025'; // Test password
const hash = '.ftgS64lfpNIhu75ezxCAYA6hBI4brR2PhX.1Pu0EHRS6';

console.log('Password match:', bcrypt.compareSync(password, hash));