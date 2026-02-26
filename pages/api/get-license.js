import mysql from 'mysql2/promise';
import { updateLicenseSheet } from './licenseSheetService';
import { getConfig } from '@/lib/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { months } = req.body;
  let licenseConnection;
  let appConnection;

  try {
    // First, connect to the main app database to get license server details
    appConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Get license server connection details from database
    const [licenseConfig] = await appConnection.execute(
      'SELECT host, user, password, database_name, port FROM license_manager WHERE connection_name = ? LIMIT 1',
      ['license_server']
    );

    if (licenseConfig.length === 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'License server configuration not found in database' 
      });
    }

    const licenseServer = licenseConfig[0];

    // Now connect to the license server using the details from database
    licenseConnection = await mysql.createConnection({
      host: licenseServer.host,
      user: licenseServer.user,
      password: licenseServer.password,
      database: licenseServer.database_name,
      port: licenseServer.port || 3306,
    });

    // Generate dynamic date ranges
    const dateConditions = Array.from({ length: months }, (_, i) => 
      `DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL ${i + 1} MONTH), '%Y-%m-01')`
    ).join(',');

    const [rows] = await licenseConnection.execute(`
      SELECT 
        client_name, 
        source_key, 
        active_key, 
        DATE_FORMAT(key_expire, '%Y-%m-%d') as key_expire
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
    // Close both connections
    if (licenseConnection) await licenseConnection.end();
    if (appConnection) await appConnection.end();
  }
}