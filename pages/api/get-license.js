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
      SELECT client_name FROM clients
    `);

    if (!rows.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'No expiring licenses found' 
      });
    }

    // Update Google Sheet
    const result = await updateLicenseSheet(rows);
    
    return res.json({ 
      success: true, 
      message: `Appended ${rows.length} records to License Sheet`,
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