// ============================================
// Backend API Server - Node.js + Express
// ============================================
// This server connects to MySQL running in the
// same Kubernetes Pod (via localhost:3306) and
// provides CRUD REST APIs for a "users" table.
// ============================================

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());                    // Allow cross-origin requests
app.use(express.json());            // Parse JSON request bodies

// ============================================
// MySQL Connection Configuration
// ============================================
// Since all containers in a Kubernetes Pod
// share the same network namespace, we can
// connect to MySQL using "localhost".
// Credentials come from environment variables
// set in the Pod YAML definition.
// ============================================

// Retry logic - MySQL may take a few seconds to start
let db;

function connectWithRetry() {
  db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',       // Same Pod = localhost
    user: process.env.DB_USER || 'root',            // MySQL username
    password: process.env.DB_PASSWORD || 'rootpass', // MySQL password
    database: process.env.DB_NAME || 'mydb',         // Database name
  });

  db.connect((err) => {
    if (err) {
      console.log('MySQL not ready, retrying in 5 seconds...', err.message);
      setTimeout(connectWithRetry, 5000);  // Retry after 5 seconds
    } else {
      console.log('Connected to MySQL database!');
      createTableIfNotExists();  // Auto-create table on startup
    }
  });

  // Handle connection errors after initial connect
  db.on('error', (err) => {
    console.log('MySQL connection error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connectWithRetry();
    }
  });
}

// ============================================
// Auto-create "users" table if it doesn't exist
// ============================================
function createTableIfNotExists() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL
    )
  `;
  db.query(sql, (err) => {
    if (err) {
      console.log('Error creating table:', err.message);
    } else {
      console.log('Users table is ready!');
    }
  });
}

// ============================================
// Health check endpoint
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// ============================================
// API 1: POST /create-table
// Manually create the users table
// ============================================
app.post('/create-table', (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL
    )
  `;
  db.query(sql, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Users table created successfully!' });
  });
});

// ============================================
// API 2: POST /add-user
// Add a new user to the database
// Body: { "name": "John", "email": "john@example.com" }
// ============================================
app.post('/add-user', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
  db.query(sql, [name, email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: 'User added successfully!',
      userId: result.insertId
    });
  });
});

// ============================================
// API 3: GET /users
// Fetch all users from the database
// ============================================
app.get('/users', (req, res) => {
  const sql = 'SELECT * FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ============================================
// API 4: PUT /update-user/:id
// Update an existing user by ID
// Body: { "name": "Jane", "email": "jane@example.com" }
// ============================================
app.put('/update-user/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
  db.query(sql, [name, email, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully!' });
  });
});

// ============================================
// API 5: DELETE /delete-user/:id
// Delete a user by ID
// ============================================
app.delete('/delete-user/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully!' });
  });
});

// ============================================
// Start the server
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API server running on port ${PORT}`);
});

// Start MySQL connection with retry
connectWithRetry();
