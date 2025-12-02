import mysql from 'mysql2/promise';

// Use the same pool configuration as login.js
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
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Get the token/authentication from headers
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Verify the user is admin
    const [userRows] = await connection.execute(
      'SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE',
      [authHeader]
    );

    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Get total users count
    const [totalUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM app_users WHERE is_active = TRUE'
    );

    // Get active users count (users with last_login in last 30 days)
    const [activeUsers] = await connection.execute(
      `SELECT COUNT(*) as count FROM app_users 
       WHERE is_active = TRUE`
    );

    // Get admin users count
    const [adminUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM app_users WHERE is_admin = TRUE AND is_active = TRUE'
    );

    // Get recent users
    const [recentUsers] = await connection.execute(
      `SELECT id, username, name, email, is_admin, is_active, last_login, created_at 
       FROM app_users 
       WHERE is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    // Get total configurations count
    const [totalConfigs] = await connection.execute(
      `SELECT 
        (SELECT COUNT(*) FROM aws_config) as aws_count,
        (SELECT COUNT(*) FROM sendgrid_config) as sendgrid_count,
        (SELECT COUNT(*) FROM google_sheets_config) as google_count,
        (SELECT COUNT(*) FROM base_url_config) as url_count,
        (SELECT COUNT(*) FROM license_manager) as license_count`
    );

    const configTotal = Object.values(totalConfigs[0]).reduce((a, b) => a + (b || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsers[0].count,
        adminUsers: adminUsers[0].count,
        totalConfigs: configTotal
      },
      recentUsers: recentUsers.map(user => ({
        ...user,
        is_admin: Boolean(user.is_admin),
        is_active: Boolean(user.is_active)
      }))
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch dashboard data'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}