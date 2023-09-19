CREATE DATABASE inventoryservice;

GRANT ALL PRIVILEGES ON inventoryservice.* TO 'service_user'@'localhost';

USE inventoryservice;

CREATE TABLE `inventory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `current_inventory` int(11) DEFAULT NULL,
  `sku_code` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;