const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET all customers sorted by spend descending (max 10)
app.get('/api/customers', (req, res) => {
  const customers = readData()
    .sort((a, b) => b.amountSpent - a.amountSpent)
    .slice(0, 10)
    .map((c, i) => ({ ...c, rank: i + 1, cashback: i < 3 }));
  res.json(customers);
});

// POST — add a new customer (max 10 enforced)
app.post('/api/customers', (req, res) => {
  const { name, amountSpent } = req.body;
  if (!name || amountSpent === undefined || amountSpent === '') {
    return res.status(400).json({ error: 'name and amountSpent are required' });
  }
  const spend = parseFloat(amountSpent);
  if (isNaN(spend) || spend < 0) {
    return res.status(400).json({ error: 'amountSpent must be a non-negative number' });
  }
  const customers = readData();
  if (customers.length >= 10) {
    return res.status(400).json({ error: 'Maximum 10 customers allowed. Delete one first.' });
  }
  const newCustomer = {
    id: Date.now().toString(),
    name: name.trim(),
    amountSpent: spend,
    createdAt: new Date().toISOString()
  };
  customers.push(newCustomer);
  writeData(customers);
  res.status(201).json({ success: true, customer: newCustomer });
});

// PUT — update an existing customer
app.put('/api/customers/:id', (req, res) => {
  const { name, amountSpent } = req.body;
  if (!name || amountSpent === undefined || amountSpent === '') {
    return res.status(400).json({ error: 'name and amountSpent are required' });
  }
  const spend = parseFloat(amountSpent);
  if (isNaN(spend) || spend < 0) {
    return res.status(400).json({ error: 'amountSpent must be a non-negative number' });
  }
  const customers = readData();
  const idx = customers.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  customers[idx] = {
    ...customers[idx],
    name: name.trim(),
    amountSpent: spend,
    updatedAt: new Date().toISOString()
  };
  writeData(customers);
  res.json({ success: true, customer: customers[idx] });
});

// DELETE — remove a customer
app.delete('/api/customers/:id', (req, res) => {
  let customers = readData();
  const before = customers.length;
  customers = customers.filter(c => c.id !== req.params.id);
  if (customers.length === before) return res.status(404).json({ error: 'Customer not found' });
  writeData(customers);
  res.json({ success: true });
});

// DELETE all customers (reset)
app.delete('/api/customers', (req, res) => {
  writeData([]);
  res.json({ success: true });
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎉 Doto Kids Birthday Leaderboard running at http://localhost:${PORT}`);
  console.log(`📋 Admin panel: http://localhost:${PORT}/admin\n`);
});
