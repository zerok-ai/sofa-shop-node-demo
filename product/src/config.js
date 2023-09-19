os = require('os');
const namespace = process.env.NAMESPACE || 'default';
console.log("namespace: "+namespace);
console.log("DB Host:", process.env.DB_HOST);
module.exports = {
    port: process.env.PORT || 3000,

    db_host: process.env.DB_HOST || 'localhost',
    db_port: process.env.DB_PORT || 3306,
    db_name: process.env.DB_NAME || 'productservice',

    availability_service: process.env.AVAILABILITY_HOST || "localhost:3001",
    inventory_service: process.env.INVENTORY_HOST || "localhost:3002"
};
  