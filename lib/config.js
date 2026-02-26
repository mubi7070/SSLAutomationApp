import mysql from 'mysql2/promise';

let cachedConfig = null;
let lastFetch = 0;
const CACHE_DURATION = 600000; // 10 minute cache

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 3000,
  queueLimit: 0
});

export async function getConfig() {
  // Return cached config if it's fresh
  if (cachedConfig && Date.now() - lastFetch < CACHE_DURATION) {
    return cachedConfig;
  }

  const connection = await pool.getConnection();
  try {
    const [awsConfig] = await connection.execute('SELECT * FROM aws_config LIMIT 1');
    const [sendgridConfig] = await connection.execute('SELECT * FROM sendgrid_config LIMIT 1');
    const [googleSheetsConfig] = await connection.execute('SELECT * FROM google_sheets_config LIMIT 1');
    const [baseUrlConfig] = await connection.execute('SELECT * FROM base_url_config WHERE environment = ?', [process.env.NODE_ENV || 'production']);

    cachedConfig = {
      AWS_ACCESS_KEY_ID: awsConfig[0]?.access_key_id,
      AWS_SECRET_ACCESS_KEY: awsConfig[0]?.secret_access_key,
      AWS_REGION: awsConfig[0]?.region,
      S3_BUCKET_NAME: awsConfig[0]?.s3_bucket_name,
      S3_MIGRATION_BUCKET_NAME: awsConfig[0]?.s3_migration_bucket_name,
      SENDGRID_API_KEY: sendgridConfig[0]?.api_key,
      GOOGLE_LICENSE_SHEET_ID: googleSheetsConfig[0]?.license_sheet_id,
      BASE_URL: baseUrlConfig[0]?.base_url
    };

    lastFetch = Date.now();
    return cachedConfig;
  } finally {
    connection.release();
  }
}