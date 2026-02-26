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
      const [configRows] = await connection.execute('SELECT * FROM google_sheets_config LIMIT 1');
      if (configRows.length === 0) return res.status(200).json({ success: true, config: null });
      return res.status(200).json({ success: true, config: { id: configRows[0].id, license_sheet_id: configRows[0].license_sheet_id } });
    }

    if (req.method === 'POST') {
      const { license_sheet_id } = req.body;
      if (!license_sheet_id) return res.status(400).json({ success: false, error: 'Missing License Sheet ID' });

      const [existing] = await connection.execute('SELECT id FROM google_sheets_config LIMIT 1');
      if (existing.length > 0) {
        await connection.execute('UPDATE google_sheets_config SET license_sheet_id = ?, updated_at = NOW() WHERE id = ?', [license_sheet_id, existing[0].id]);
      } else {
        await connection.execute('INSERT INTO google_sheets_config (license_sheet_id) VALUES (?)', [license_sheet_id]);
      }
      return res.status(200).json({ success: true, message: 'Google Sheets config saved successfully' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
}