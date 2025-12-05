import pool from '../../../../lib/db';

export default async function handler(req, res) {
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

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Get AWS configuration with actual secret key
    const [configRows] = await connection.execute(
      'SELECT * FROM aws_config LIMIT 1'
    );

    if (configRows.length === 0) {
      return res.status(200).json({ 
        success: true, 
        config: null,
        message: 'No AWS configuration found'
      });
    }

    return res.status(200).json({ 
      success: true, 
      config: {
        id: configRows[0].id,
        access_key_id: configRows[0].access_key_id,
        secret_access_key: configRows[0].secret_access_key, // Actual key, not masked
        region: configRows[0].region,
        s3_bucket_name: configRows[0].s3_bucket_name,
        s3_migration_bucket_name: configRows[0].s3_migration_bucket_name
      }
    });

  } catch (error) {
    console.error('AWS Config API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Database error occurred'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}