import pool from '../../../../lib/db';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

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

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

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

    let message = `Testing AWS S3 Connection...\n`;
    message += `✅ AWS Credentials are valid\n`;
    message += `✅ Region: ${region}\n\n`;

    const testResults = [];
    let hasErrors = false;

    // Test specific buckets only
    const bucketsToTest = [
      { name: s3_bucket_name, label: 'Backup Bucket' },
      { name: s3_migration_bucket_name, label: 'Migration Bucket' }
    ];

    for (const bucket of bucketsToTest) {
      if (!bucket.name) {
        testResults.push({
          bucket: bucket.label,
          status: '⚠️',
          message: 'Bucket name not provided'
        });
        continue;
      }

      try {
        // Use HeadBucketCommand - this only checks if bucket exists and we have access
        // It doesn't require ListAllMyBuckets permission
        await s3Client.send(new HeadBucketCommand({ Bucket: bucket.name }));
        testResults.push({
          bucket: bucket.name,
          status: '✅',
          message: `Successfully connected to bucket "${bucket.name}"`
        });
      } catch (error) {
        hasErrors = true;
        if (error.name === 'NotFound') {
          testResults.push({
            bucket: bucket.name,
            status: '❌',
            message: `Bucket "${bucket.name}" does not exist`
          });
        } else if (error.name === 'AccessDenied') {
          testResults.push({
            bucket: bucket.name,
            status: '❌',
            message: `Access denied to bucket "${bucket.name}" - check permissions`
          });
        } else if (error.name === 'Forbidden') {
          testResults.push({
            bucket: bucket.name,
            status: '❌',
            message: `Forbidden access to bucket "${bucket.name}" - check bucket policy`
          });
        } else if (error.message.includes('incorrect region')) {
          testResults.push({
            bucket: bucket.name,
            status: '❌',
            message: `Bucket "${bucket.name}" is in a different region than ${region}`
          });
        } else {
          testResults.push({
            bucket: bucket.name,
            status: '❌',
            message: `Error: ${error.message}`
          });
        }
      }
    }

    // Build result message
    message += '--- Test Results ---\n';
    testResults.forEach(result => {
      message += `${result.status} ${result.bucket}: ${result.message}\n`;
    });

    message += '\n--- Summary ---\n';
    if (!hasErrors && testResults.every(r => r.status === '✅')) {
      message += '✅ SUCCESS: All buckets are accessible!';
    } else if (hasErrors) {
      message += '❌ FAILED: Some buckets have access issues.';
    } else {
      message += '⚠️ WARNING: Some buckets may have issues.';
    }

    return res.status(200).json({ 
      success: !hasErrors,
      message: message
    });

  } catch (error) {
    console.error('AWS Connection Test Error:', error);
    
    let errorMessage = 'Failed to test AWS S3 connection:\n';
    
    if (error.name === 'CredentialsProviderError') {
      errorMessage += '❌ Invalid AWS credentials.';
    } else if (error.name === 'InvalidAccessKeyId') {
      errorMessage += '❌ Invalid Access Key ID.';
    } else if (error.name === 'SignatureDoesNotMatch') {
      errorMessage += '❌ Invalid Secret Access Key.';
    } else if (error.name === 'AccessDenied') {
      errorMessage += '❌ Access denied. Check IAM permissions.';
    } else if (error.code === 'NetworkingError') {
      errorMessage += '❌ Network error. Check connection and region.';
    } else {
      errorMessage += `❌ ${error.message}`;
    }

    return res.status(200).json({ 
      success: false, 
      error: errorMessage
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}