import pool from '../../../lib/db';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let connection;
  try {
    connection = await pool.getConnection();
    const [userRows] = await connection.execute(
      'SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE',
      [authHeader]
    );

    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Fetch configs
    const [awsRows] = await connection.execute('SELECT * FROM aws_config LIMIT 1');
    const [sgRows] = await connection.execute('SELECT * FROM sendgrid_config LIMIT 1');

    let awsStatus = 'error';
    let sendgridStatus = 'error';

    // Test AWS Connection
    if (awsRows.length > 0 && awsRows[0].access_key_id && awsRows[0].secret_access_key) {
      try {
        const s3 = new S3Client({
          region: awsRows[0].region,
          credentials: {
            accessKeyId: awsRows[0].access_key_id,
            secretAccessKey: awsRows[0].secret_access_key
          },
          maxAttempts: 2
        });
        await s3.send(new ListBucketsCommand({}));
        awsStatus = 'connected';
      } catch (e) {
        awsStatus = 'error';
      }
    }

    // Test SendGrid Connection
    if (sgRows.length > 0 && sgRows[0].api_key) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/scopes', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${sgRows[0].api_key}`, 
            'Content-Type': 'application/json' 
          }
        });
        if (response.ok) sendgridStatus = 'connected';
      } catch (e) {
        sendgridStatus = 'error';
      }
    }

    return res.status(200).json({ success: true, aws: awsStatus, sendgrid: sendgridStatus });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
}