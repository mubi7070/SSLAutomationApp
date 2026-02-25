import mysql from 'mysql2/promise';

// Create MySQL connection pool
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
    // Get connection from pool
    const connection = await pool.getConnection();
    
    try {
      // Query user from database
      const [rows] = await connection.execute(
        'SELECT username, password, name, is_admin FROM app_users WHERE username = ? AND is_active = TRUE',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const user = rows[0];

      // Compare plain text passwords
      if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      // Login successful, return user info
      return res.status(200).json({ 
        success: true, 
        user: { 
          username: user.username, 
          name: user.name,
          is_admin: Boolean(user.is_admin)
        } 
      });
    } finally {
      // Release connection back to pool
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
}