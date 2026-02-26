import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 3000,
  queueLimit: 0
});

export async function getConfig() {
  const connection = await pool.getConnection();
  try {
    // Get all configuration from database
    const [awsConfig] = await connection.execute('SELECT * FROM aws_config LIMIT 1');
    const [sendgridConfig] = await connection.execute('SELECT * FROM sendgrid_config LIMIT 1');
    const [googleSheetsConfig] = await connection.execute('SELECT * FROM google_sheets_config LIMIT 1');
    const [baseUrlConfig] = await connection.execute('SELECT * FROM base_url_config WHERE environment = ?', [process.env.NODE_ENV || 'production']);

    return {
      aws: awsConfig[0],
      sendgrid: sendgridConfig[0],
      googleSheets: googleSheetsConfig[0],
      baseUrl: baseUrlConfig[0]?.base_url
    };
  } finally {
    connection.release();
  }
}

export default pool;