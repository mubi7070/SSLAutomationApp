import pool from '@/lib/db';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

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

    if (req.method === 'GET') {
      // Get AWS configuration
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

        // Mask the secret key before sending to frontend
        const originalKey = configRows[0].secret_access_key;
        let maskedKey = '';
        
        if (originalKey && originalKey.length > 8) {
            const firstFour = originalKey.substring(0, 4);
            const lastFour = originalKey.substring(originalKey.length - 4);
            const maskedLength = originalKey.length - 8;
            const maskedChars = '*'.repeat(maskedLength);
            maskedKey = firstFour + maskedChars + lastFour;
        } else if (originalKey) {
            // If key is 8 chars or less, just return it as-is
            maskedKey = originalKey;
        }

      return res.status(200).json({ 
        success: true, 
        config: {
        id: configRows[0].id,
        access_key_id: configRows[0].access_key_id,
        secret_access_key: maskedKey, // Send masked version
        region: configRows[0].region,
        s3_bucket_name: configRows[0].s3_bucket_name,
        s3_migration_bucket_name: configRows[0].s3_migration_bucket_name
        }
    });
    }

    if (req.method === 'POST') {
      // Check if this is a test request
      if (req.url.includes('/test')) {
        return testAWSConnection(req, res);
      }

      // Save or update AWS configuration
      const { access_key_id, secret_access_key, region, s3_bucket_name, s3_migration_bucket_name } = req.body;

      if (!access_key_id || !secret_access_key || !region || !s3_bucket_name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Check if configuration exists
      const [existingConfig] = await connection.execute(
        'SELECT id FROM aws_config LIMIT 1'
      );

      if (existingConfig.length > 0) {
        // Update existing configuration
        await connection.execute(
          `UPDATE aws_config SET 
            access_key_id = ?, 
            secret_access_key = ?, 
            region = ?, 
            s3_bucket_name = ?, 
            s3_migration_bucket_name = ?,
            updated_at = NOW()
           WHERE id = ?`,
          [access_key_id, secret_access_key, region, s3_bucket_name, s3_migration_bucket_name, existingConfig[0].id]
        );
      } else {
        // Insert new configuration
        await connection.execute(
          `INSERT INTO aws_config 
            (access_key_id, secret_access_key, region, s3_bucket_name, s3_migration_bucket_name) 
           VALUES (?, ?, ?, ?, ?)`,
          [access_key_id, secret_access_key, region, s3_bucket_name, s3_migration_bucket_name]
        );
      }

      return res.status(200).json({ 
        success: true, 
        message: 'AWS configuration saved successfully'
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

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

// Test AWS S3 Connection
async function testAWSConnection(req, res) {
  try {
    const { access_key_id, secret_access_key, region, s3_bucket_name, s3_migration_bucket_name } = req.body;

    if (!access_key_id || !secret_access_key || !region) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access Key ID, Secret Access Key, and Region are required for testing' 
      });
    }

    // Create S3 client
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: access_key_id,
        secretAccessKey: secret_access_key
      },
      maxAttempts: 3
    });

    // Test connection by listing buckets
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    let message = `✅ Connected successfully to AWS S3!\n`;
    message += `✅ Region: ${region}\n`;
    message += `✅ Total buckets accessible: ${response.Buckets?.length || 0}`;

    // Test specific buckets if provided
    if (s3_bucket_name) {
      try {
        const bucketCheckCommand = new ListBucketsCommand({});
        const allBuckets = await s3Client.send(bucketCheckCommand);
        const bucketExists = allBuckets.Buckets?.some(bucket => bucket.Name === s3_bucket_name);
        
        if (bucketExists) {
          message += `\n✅ S3 Bucket "${s3_bucket_name}" exists and is accessible`;
        } else {
          message += `\n⚠️ S3 Bucket "${s3_bucket_name}" does not exist or is not accessible`;
        }
      } catch (bucketError) {
        message += `\n❌ Error checking S3 bucket "${s3_bucket_name}": ${bucketError.message}`;
      }
    }

    if (s3_migration_bucket_name) {
      try {
        const bucketCheckCommand = new ListBucketsCommand({});
        const allBuckets = await s3Client.send(bucketCheckCommand);
        const bucketExists = allBuckets.Buckets?.some(bucket => bucket.Name === s3_migration_bucket_name);
        
        if (bucketExists) {
          message += `\n✅ Migration Bucket "${s3_migration_bucket_name}" exists and is accessible`;
        } else {
          message += `\n⚠️ Migration Bucket "${s3_migration_bucket_name}" does not exist or is not accessible`;
        }
      } catch (bucketError) {
        message += `\n❌ Error checking migration bucket "${s3_migration_bucket_name}": ${bucketError.message}`;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: message
    });

  } catch (error) {
    console.error('AWS Connection Test Error:', error);
    
    let errorMessage = 'Failed to connect to AWS S3:\n';
    
    if (error.name === 'CredentialsProviderError') {
      errorMessage += '❌ Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.';
    } else if (error.name === 'InvalidAccessKeyId') {
      errorMessage += '❌ Invalid Access Key ID. The access key ID you provided does not exist in our records.';
    } else if (error.name === 'SignatureDoesNotMatch') {
      errorMessage += '❌ Invalid Secret Access Key. The secret key you provided is incorrect.';
    } else if (error.name === 'AccessDenied') {
      errorMessage += '❌ Access denied. The provided credentials do not have permission to access S3.';
    } else if (error.code === 'NetworkingError') {
      errorMessage += '❌ Network error. Please check your internet connection and region configuration.';
    } else if (error.message.includes('region')) {
      errorMessage += `❌ Invalid region "${req.body.region}". Please check the region name.`;
    } else {
      errorMessage += `❌ ${error.message}`;
    }

    return res.status(200).json({ 
      success: false, 
      error: errorMessage
    });
  }
}