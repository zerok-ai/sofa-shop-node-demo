const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const app = express();

const config = require('./config.js');
const secrets = require('./secrets.js');

const port = config.port || 3000;

// MySQL database connection configuration
const db = mysql.createConnection({
  host: config.db_host,
  user: secrets.db_username,
  password: secrets.db_password,
  database: config.db_name,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database.");
});

// Middleware to parse JSON requests
app.use(express.json());

// Create Order API
app.post('/api/order', async (req, res) => {
  try {
    // Start DB transaction
    db.beginTransaction();

    // generate random Order number using ssid
    var orderNo = Math.floor(Math.random() * 1000000000);

    // Insert the order into the orders table (assuming order data is in req.body)
    const [insertResult] = await db.query(
      'INSERT INTO orders (order_number, status) VALUES (?, ?)',
      [orderNo, 'Pending']
    );

    // Insert into order line items table
    for (const lineItem of req.body.orderLineItemDtoList) {
      const [insertLineItemResult] = await db.execute(
        'INSERT INTO order_line_items (order_number, sku, price, quantity) VALUES (?, ?, ?, ?)',
        [orderNo, lineItem.skuCode, lineItem.price, lineItem.quantity]
      );
    }

    // Perform validations for each SKU here
    for (const lineItem of req.body.orderLineItemDtoList) {
      // 1. Check inventory service
      const inventoryResponse = await axios.get(
        'http://'+config.inventory_service+'/api/inventory',
        {
          params: {
            skuCode: lineItem.skuCode,
            quantity: lineItem.quantity,
          },
        }
      );

      // 2. Check product service
      const productServiceResponse = await axios.get(
        'http://'+config.product_service+'/api/product/price',
        {
          params: {
            price: lineItem.price,
            skuCode: lineItem.skuCode,
          },
        }
      );

      // Check if validations fail
      if (
        !inventoryResponse.data.available ||
        productServiceResponse.data.error 
      ) {
        return res.status(500).json({ error: 'Upstream Validation failed' });
      }

      if(productServiceResponse.data.currentInventory < lineItem.quantity) {
        return res.status(500).json({ error: 'Inventory validation failed' });
      }
    }

    for (const lineItem of req.body.orderLineItemDtoList) {
      // reduce inventory
      const updateInventoryResponse = await axios.put(
        'http://'+config.inventory_service+'/api/inventory',
        {
          sku: lineItem.skuCode,
          currentInventory: inventoryResponse.data.currentInventory - req.params.quantity,
        }
      );    
    }

    // update order DB table
    const [updateResult] = await db.execute(
      'UPDATE orders SET status = ? WHERE order_number = ?',
      ['Completed', orderNo]
    );

    // Commit DB transaction
    db.commit();

    // Return a success response
    return res.status(200).json({ message: 'Order created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel Order API
app.delete('/api/order', async (req, res) => {
  try {
    // Delete order and associated line items based on the order ID (assuming order ID is in req.query.id)
    const [deleteResult] = db.query(
      'DELETE FROM orders WHERE order_number = ?',
      [req.query.order_number]
    );

    // Check if the order was found and deleted
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Return a success response
    return res.status(200).json({ message: 'Order canceled successfully' });
  } catch (error) {
    console.error(error);
    return res
  }
});

// Get Order API
app.get('/api/order', async (req, res) => {
  try {
    if(!req.query.order_number) {
      return res.status(400).json({ error: 'Order number not found' });
    }
    // Get order details based on the order ID (assuming order ID is in req.query.id)
    const [queryResult] = db.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [req.query.order_number]
    );

    // Check if the order was found
    if (queryResult.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order line items
    const [lineItemsResult] = db.execute(
      'SELECT * FROM order_line_items WHERE order_number = ?',
      [req.query.order_number]
    );

    // Return the order details
    return res.status(200).json({
      order: queryResult[0],
      orderLineItems: lineItemsResult,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
