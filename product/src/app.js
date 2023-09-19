const axios = require('axios');
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require('body-parser');

const secrets = require("./secrets.js");
const config = require("./config.js");

const port = config.port;
const app = express();

app.use(bodyParser.json());

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

// Bulk upload Products
app.post('/api/product/all', (req, res) => {
  const products = req.body.productRequestList;
  const query = 'INSERT INTO products (categories, name, price, image, description, brand, sku) VALUES ?';
  const values = products.map(product => [
    product.categories.join(','),
    product.name,
    product.price,
    product.image,
    product.description,
    product.brand,
    product.sku
  ]);

  db.query(query, [values], (error, result) => {
    if (error) {
      res.status(500).json({ error });
    } else {
      res.status(201).json({ message: 'Products added successfully', result });
    }
  });
});

// Create Product
app.post("/api/product", (req, res) => {
  const { name, description, price } = req.body;
  const query =
    "INSERT INTO products (name, description, price) VALUES (?, ?, ?)";
  db.query(query, [name, description, price], (err, result) => {
    if (err) throw err;
    res.status(201).send("Product created.");
  });
});

// Update Product
app.put("/api/product", (req, res) => {
  const { name, description, price } = req.body;
  const id = req.query.id;
  const query =
    "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?";
  db.query(query, [name, description, price, id], (err, result) => {
    if (err) throw err;
    res.status(200).send("Product updated.");
  });
});

// Delete Product
app.delete("/api/product", (req, res) => {
  const { id } = req.query;
  const query = "DELETE FROM products WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) throw err;
    res.status(200).send("Product deleted.");
  });
});

// Get All Products
app.get("/api/product", (req, res) => {
  const query = "SELECT * FROM products";
  db.query(query, (err, results) => {
    if (err) throw err;
    results.map((result) => {
      // console.log(result);
      console.log(result.categories);
      try {
        // Handle java array to js array
        result.categories = result.categories.split(",");
      } catch (error) {
        console.log(error);
        result.categories = [];
      }
    });
    res.status(200).json(results);
  });
});

// Check Product
app.get("/api/product/price", (req, res) => {
  const { price, skuCode } = req.query;
  const query = "SELECT * FROM products WHERE price = ? AND sku = ?";
  db.query(query, [price, skuCode], (err, results) => {
    if (err) throw err;
    res.status(200).json(results);
  });
});

// Check Product Availability
app.get("/api/product/availability", async (req, res) => {
  const { skuCode, zipcode } = req.query;
  try {
    const response = await axios.get(
      `http://availability.sofa-shop-mysql.svc.cluster.local/availability?skuCode=${skuCode}&zipcode=${zipcode}`
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).send("Error fetching product availability.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
