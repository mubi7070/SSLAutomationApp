import pool from '../../lib/db';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let connection;
  try {
    connection = await pool.getConnection();
    const [userRows] = await connection.execute('SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE', [authHeader]);
    if (userRows.length === 0 || !userRows[0].is_admin) return res.status(403).json({ success: false, error: 'Admin access required' });

    if (req.method === 'GET') {
      // 1. Fetch all logs
      const [logs] = await connection.execute(
        'SELECT * FROM sendgrid_limit_logs ORDER BY created_at DESC'
      );

      // 2. Fetch Top 5 Sub-Accounts from the last 6 months (Updated)
      const [topAccounts] = await connection.execute(`
        SELECT sub_account, COUNT(*) as request_count 
        FROM sendgrid_limit_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
        GROUP BY sub_account 
        ORDER BY request_count DESC 
        LIMIT 5
      `);

      // 3. Fetch monthly increased credits for the graph (Last 6 months)
      const [graphData] = await connection.execute(`
        SELECT DATE_FORMAT(created_at, '%b %y') as month_name, DATE_FORMAT(created_at, '%Y-%m') as month_sort, SUM(credits_adjusted) as total_increased
        FROM sendgrid_limit_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND credits_adjusted > 0
        GROUP BY month_name, month_sort
        ORDER BY month_sort ASC
      `);

      return res.status(200).json({ success: true, logs, topAccounts, graphData });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('SendGrid Logs API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  } finally {
    if (connection) connection.release();
  }
}