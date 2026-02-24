import pool from '../../../../lib/db';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let connection;
  try {
    connection = await pool.getConnection();
    const [userRows] = await connection.execute('SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE', [authHeader]);
    if (userRows.length === 0 || !userRows[0].is_admin) return res.status(403).json({ success: false, error: 'Admin access required' });

    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    let { api_key } = req.body;
    if (!api_key) return res.status(400).json({ success: false, error: 'SendGrid API Key is required for testing' });

    // If the frontend sent the masked key, fetch the actual key from the database to perform the test
    if (api_key.includes('***')) {
      const [configRows] = await connection.execute('SELECT api_key FROM sendgrid_config LIMIT 1');
      if (configRows.length > 0) {
        api_key = configRows[0].api_key;
      } else {
        return res.status(400).json({ success: false, error: 'No existing SendGrid key found to test.' });
      }
    }

    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: '✅ Successfully connected to SendGrid. API Key is valid.' });
    } else {
      const errorData = await response.json();
      return res.status(400).json({ success: false, error: `❌ Connection Failed: ${errorData.errors?.[0]?.message || 'Invalid API Key'}` });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: `❌ Test execution failed: ${error.message}` });
  } finally {
    if (connection) connection.release();
  }
}