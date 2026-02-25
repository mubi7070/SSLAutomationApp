import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 3000,
  queueLimit: 0
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT username, password, name, is_admin FROM app_users WHERE username = ? AND is_active = TRUE',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const user = rows[0];

      // STRICT CHECK: Only accepts bcrypt hashed passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      return res.status(200).json({ 
        success: true, 
        user: { 
          username: user.username, 
          name: user.name,
          is_admin: Boolean(user.is_admin)
        } 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
}