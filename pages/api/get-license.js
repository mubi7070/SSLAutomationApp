import mysql from 'mysql2/promise';
import { updateLicenseSheet } from '../utils/licenseSheetService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let connection;
  try {
    // MySQL Connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Fetch expiring licenses
    const [rows] = await connection.execute(`
      SELECT client_name, source_key, active_key, key_expire
      FROM lm_clients
      WHERE key_expire IN (
        DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
        DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')
      )
      ORDER BY key_expire ASC
    `);

    if (!rows.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'No expiring licenses found' 
      });
    }

    // Process data for Google Sheets
    const sheetData = rows.map(row => ({
      client_name: row.client_name,
      source_key: row.source_key,
      active_key: row.active_key,
      key_expire: row.key_expire
    }));

    const result = await updateLicenseSheet(sheetData);
    
    return res.json({ 
      success: true, 
      message: `Added ${rows.length} records to License Sheet`,
      details: result
    });

  } catch (error) {
    console.error('License renewal error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process license renewal'
    });
  } finally {
    if (connection) await connection.end();
  }
}