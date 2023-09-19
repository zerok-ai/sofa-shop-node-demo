os = require('os');
module.exports = {
    port: process.env.PORT || 3000,
    db_host: process.env.DB_HOST || 'localhost',
    db_port: process.env.DB_PORT || 3306,
    db_name: process.env.DB_NAME || 'inventoryservice',
};
  