// aws-s3.js
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS with your credentials and region.
// It’s best practice to set these via environment variables.
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,           // Your AWS Access Key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,       // Your AWS Secret Key
  region: process.env.AWS_REGION,                           // e.g. 'us-east-1'
});

// Create an S3 client instance
const s3 = new AWS.S3();

/**
 * Uploads a local file to AWS S3.
 * @param {string} filePath - The absolute or relative path to the file on disk.
 * @param {string} bucketName - (Optional) The S3 bucket name. Defaults to "sslautomationtoolbackup".
 * @returns {Promise<Object>} - Resolves with the S3 upload response.
 */
const uploadFileToS3 = async (filePath, bucketName = 'sslautomationtoolbackup') => {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath);
    // Extract the file name from the path – you may want to adjust the key if needed.
    const fileName = path.basename(filePath);

    // Prepare the parameters for S3.upload
    const params = {
      Bucket: bucketName,
      Key: fileName, // You can also include folders here like 'backups/' + fileName
      Body: fileContent,
    };

    // Upload the file using promises (s3.upload returns a managed upload object)
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully at ${data.Location}`);
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

module.exports = { uploadFileToS3 };
