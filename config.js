const path = require('path');

module.exports = {
  // 服务器配置
  port: process.env.NODE_ENV === 'production' ? 3003 : 3000,
  
  // 数据库配置
  database: {
    path: process.env.DB_PATH || path.join(__dirname, 'data/links.db'),
    mode: process.env.NODE_ENV === 'production' ? 
      sqlite3.OPEN_READWRITE : 
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  },
  
  // 上传配置
  upload: {
    maxSize: 1024 * 1024 * 2, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
  }
}; 