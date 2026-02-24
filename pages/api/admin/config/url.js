import pool from '../../../lib/db';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let connection;
  try {
    connection = await pool.getConnection();
    const [userRows] = await connection.execute('SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE', [authHeader]);
    if (userRows.length === 0 || !userRows[0].is_admin) return res.status(403).json({ success: false, error: 'Admin access required' });

    if (req.method === 'GET') {
      const [configRows] = await connection.execute('SELECT * FROM base_url_config LIMIT 1');
      if (configRows.length === 0) return res.status(200).json({ success: true, config: null });
      return res.status(200).json({ success: true, config: { id: configRows[0].id, base_url: configRows[0].base_url, environment: configRows[0].environment } });
    }

    if (req.method === 'POST') {
      const { base_url, environment } = req.body;
      if (!base_url || !environment) return res.status(400).json({ success: false, error: 'Missing Base URL or Environment' });

      const [existing] = await connection.execute('SELECT id FROM base_url_config LIMIT 1');
      if (existing.length > 0) {
        await connection.execute('UPDATE base_url_config SET base_url = ?, environment = ?, updated_at = NOW() WHERE id = ?', [base_url, environment, existing[0].id]);
      } else {
        await connection.execute('INSERT INTO base_url_config (base_url, environment) VALUES (?, ?)', [base_url, environment]);
      }
      return res.status(200).json({ success: true, message: 'Base URL config saved successfully' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
}