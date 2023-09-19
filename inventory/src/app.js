const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const config = require('./config.js');
const secrets = require('./secrets.js');

const port = config.port || 3000;

const app = express();

// Create a MySQL connection
const db = mysql.createConnection({
  host: config.db_host,
  user: secrets.db_username,
  password: secrets.db_password,
  database: config.db_name,
});

// Connect to the MySQL server
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database as id ' + db.threadId);
});

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// GET API to retrieve whole inventory
app.get('/api/inventory/all', (req, res) => {
  // Fetch all products from the product service
  var products = [];
  axios.get('http://'+config.product_service+'/api/product/all')
    .then((response) => {
      const products = response.data;
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  

  db.query('SELECT * FROM inventory', (err, results) => {
    if (err) {
      console.error('Error executing query: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    products.map((product) => {
      results.filter((result) => {
        if (product.sku === result.sku_code) {
          product.currentInventory = result.current_inventory;
        }
      });
    });
    res.json(products);
  });
    
});

// POST API to populate data into inventory table
app.post('/api/inventory/all', (req, res) => {
  const { inventoryRequestList } = req.body;

  if (!Array.isArray(inventoryRequestList)) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  const values = inventoryRequestList.map((item) => [
    item.sku,
    item.currentInventory,
  ]);

  db.query(
    'INSERT INTO inventory (sku_code, current_inventory) VALUES ?',
    [values],
    (err, results) => {
      if (err) {
        console.error('Error executing query: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Inventory data inserted successfully' });
    }
  );
});

// GET API to check stock for a specific SKU and quantity
app.get('/api/inventory', (req, res) => {
  const { skuCode, quantity } = req.query;

  db.query(
    'SELECT * FROM inventory WHERE sku_code = ? AND current_inventory >= ?',
    [skuCode, quantity],
    (err, results) => {
      if (err) {
        console.error('Error executing query: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.json(results[0]);
    }
  );
});

// DELETE API to delete an inventory item by ID
app.delete('/api/inventory', (req, res) => {
  const { id } = req.query;

  db.query('DELETE FROM inventory WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error executing query: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.status(204).send();
  });
});

// POST API to create a new inventory item
app.post('/api/inventory', (req, res) => {
  const { skuCode, quantity } = req.body;

  db.query(
    'INSERT INTO inventory (sku_code, current_inventory) VALUES (?, ?)',
    [skuCode, quantity],
    (err, results) => {
      if (err) {
        console.error('Error executing query: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Inventory item created successfully' });
    }
  );
});

// PUT API to update inventory item
app.put('/api/inventory', (req, res) => {
  const { id, currentInventory } = req.body;

  db.query(
    'UPDATE inventory SET current_inventory = ? WHERE id = ?',
    [currentInventory, id],
    (err, results) => {
      if (err) {
        console.error('Error executing query: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.json({ message: 'Inventory item updated successfully' });
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
