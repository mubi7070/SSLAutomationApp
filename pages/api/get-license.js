import mysql from 'mysql2/promise';
import { updateLicenseSheet } from '../utils/licenseSheetService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { months } = req.body;
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Generate dynamic date ranges
    const dateConditions = Array.from({ length: months }, (_, i) => 
      `DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL ${i + 1} MONTH), '%Y-%m-01')`
    ).join(',');

    const [rows] = await connection.execute(`
      SELECT client_name, source_key, active_key, key_expire
      FROM lm_clients
      WHERE key_expire IN (
        ${dateConditions}
      )
      ORDER BY key_expire ASC
    `);

    if (!rows.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'No expiring licenses found for selected period' 
      });
    }

    const result = await updateLicenseSheet(rows, parseInt(months));
    
    res.json({ 
      success: true, 
      message: `Added ${rows.length} records for ${months}-month period`,
      details: result
    });

  } catch (error) {
    console.error('License error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'License update failed'
    });
  } finally {
    if (connection) await connection.end();
  }
}