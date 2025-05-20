// Generate new hashes with unique salts for each password
const bcrypt = require('bcryptjs');

const passwords = [
  { username: 'DevOps', password: 'sibisoft2025' },
  { username: 'Support', password: 'BlCnsupportvvag57sf' },
  { username: 'PM', password: 'BlCnvvag57sfpm' }
];

passwords.forEach(user => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(user.password, salt);
  console.log(`{
    "username": "${user.username}",
    "password": "${hash}",
    "name": "${user.username} Team"
  },`);
});