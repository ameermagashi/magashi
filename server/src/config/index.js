require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'dev-helpdesk-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'helpdesk',
    waitForConnections: true,
    connectionLimit: 10,
  },
};
