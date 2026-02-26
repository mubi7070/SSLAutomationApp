import pool from '@/lib/db';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let connection;
  try {
    connection = await pool.getConnection();
    const [userRows] = await connection.execute('SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE', [authHeader]);
    if (userRows.length === 0 || !userRows[0].is_admin) return res.status(403).json({ success: false, error: 'Admin access required' });

    if (req.method === 'GET') {
      const [configRows] = await connection.execute('SELECT * FROM sendgrid_config LIMIT 1');
      if (configRows.length === 0) return res.status(200).json({ success: true, config: null });

      // Mask the key
      const originalKey = configRows[0].api_key;
      let maskedKey = '';
      if (originalKey && originalKey.length > 8) {
        const firstFour = originalKey.substring(0, 4);
        const lastFour = originalKey.substring(originalKey.length - 4);
        maskedKey = firstFour + '*'.repeat(originalKey.length - 8) + lastFour;
      } else {
        maskedKey = originalKey;
      }

      return res.status(200).json({ success: true, config: { id: configRows[0].id, api_key: maskedKey } });
    }

    if (req.method === 'POST') {
      const { api_key } = req.body;
      if (!api_key) return res.status(400).json({ success: false, error: 'Missing API Key' });

      // If the incoming key contains asterisks, it hasn't been changed by the user. Skip the update.
      if (api_key.includes('***')) {
        return res.status(200).json({ success: true, message: 'SendGrid config unchanged and saved successfully' });
      }

      const [existing] = await connection.execute('SELECT id FROM sendgrid_config LIMIT 1');
      if (existing.length > 0) {
        await connection.execute('UPDATE sendgrid_config SET api_key = ?, updated_at = NOW() WHERE id = ?', [api_key, existing[0].id]);
      } else {
        await connection.execute('INSERT INTO sendgrid_config (api_key) VALUES (?)', [api_key]);
      }
      return res.status(200).json({ success: true, message: 'SendGrid config saved successfully' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
}