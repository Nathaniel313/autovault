require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
const server = http.createServer(app);
const io = new Server(server);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

// All active listings, with optional filters
app.get('/api/listings', wrap(async (req, res) => {
  const { q, make, minPrice, maxPrice, fuel, limit } = req.query;
  let sql = `SELECT l.id, l.title, l.make, l.model, l.year, l.price, l.mileage,
      l.fuel_type, l.transmission, l.location, d.name AS dealer_name,
      (SELECT url FROM listing_photos p WHERE p.listing_id = l.id
       ORDER BY p.is_primary DESC, p.id LIMIT 1) AS photo
    FROM listings l JOIN dealers d ON d.id = l.dealer_id
    WHERE l.status = 'active'`;
  const params = [];
  if (q) {
    sql += ' AND (l.title LIKE ? OR l.make LIKE ? OR l.model LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (make) { sql += ' AND l.make = ?'; params.push(make); }
  if (fuel) { sql += ' AND l.fuel_type = ?'; params.push(fuel); }
  if (minPrice) { sql += ' AND l.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND l.price <= ?'; params.push(Number(maxPrice)); }
  sql += ' ORDER BY l.created_at DESC, l.id DESC';
  if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit, 10)); }
  const [rows] = await db.query(sql, params);
  res.json(rows);
}));

// One listing with photos, features and dealer info
app.get('/api/listings/:id', wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT l.*, d.id AS dealer_id, d.name AS dealer_name,
            d.phone AS dealer_phone, d.location AS dealer_location
     FROM listings l JOIN dealers d ON d.id = l.dealer_id WHERE l.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Listing not found' });
  const [photos] = await db.query(
    'SELECT url, is_primary FROM listing_photos WHERE listing_id = ? ORDER BY is_primary DESC, id',
    [req.params.id]
  );
  const [features] = await db.query(
    'SELECT feature FROM listing_features WHERE listing_id = ?',
    [req.params.id]
  );
  res.json({ ...rows[0], photos, features: features.map((f) => f.feature) });
}));

// Create a listing (post-a-listing page)
app.post('/api/listings', wrap(async (req, res) => {
  const { dealer_id, title, make, model, year, price, mileage, fuel_type,
          transmission, location, description, photo_url, features } = req.body;
  if (!dealer_id || !title || !make || !model || !year || !price) {
    return res.status(400).json({ error: 'Dealer, title, make, model, year and price are required' });
  }
  const [result] = await db.query(
    `INSERT INTO listings (dealer_id, title, make, model, year, price, mileage,
       fuel_type, transmission, location, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dealer_id, title, make, model, year, price, mileage || 0,
     fuel_type || 'Petrol', transmission || 'Automatic', location || null, description || null]
  );
  const id = result.insertId;
  if (photo_url) {
    await db.query('INSERT INTO listing_photos (listing_id, url, is_primary) VALUES (?, ?, 1)', [id, photo_url]);
  }
  if (Array.isArray(features)) {
    for (const f of features.filter(Boolean)) {
      await db.query('INSERT INTO listing_features (listing_id, feature) VALUES (?, ?)', [id, f]);
    }
  }
  res.status(201).json({ id });
}));

// Dealers
app.get('/api/dealers', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT id, name, location FROM dealers ORDER BY name');
  res.json(rows);
}));

app.get('/api/dealers/:id', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM dealers WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Dealer not found' });
  res.json(rows[0]);
}));

app.get('/api/dealers/:id/reviews', wrap(async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, reviewer_name, rating, comment, created_at FROM reviews WHERE dealer_id = ? ORDER BY created_at DESC, id DESC',
    [req.params.id]
  );
  res.json(rows);
}));

// Inquiries (listing_id is optional so the contact page can use it too)
app.post('/api/inquiries', wrap(async (req, res) => {
  const { listing_id, name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }
  const [result] = await db.query(
    'INSERT INTO inquiries (listing_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
    [listing_id || null, name, email, phone || null, message]
  );
  res.status(201).json({ id: result.insertId });
}));

// ---------- Auctions ----------
async function getAuctionState(auctionId) {
  const [[auction]] = await db.query(
    `SELECT id, listing_id, starting_price,
            GREATEST(TIMESTAMPDIFF(SECOND, NOW(), ends_at), 0) AS seconds_left
     FROM auctions WHERE id = ?`, [auctionId]);
  if (!auction) return null;
  const [bids] = await db.query(
    'SELECT bidder_name, amount, created_at FROM bids WHERE auction_id = ? ORDER BY amount DESC, id DESC LIMIT 10',
    [auctionId]);
  return { ...auction, bids, highest: bids.length ? Number(bids[0].amount) : null };
}

app.get('/api/auctions/by-listing/:listingId', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT id FROM auctions WHERE listing_id = ?', [req.params.listingId]);
  if (!rows.length) return res.status(404).json({ error: 'No auction for this listing' });
  res.json(await getAuctionState(rows[0].id));
}));

app.post('/api/auctions/:id/bids', wrap(async (req, res) => {
  const { bidder_name } = req.body;
  const amount = Number(req.body.amount);
  if (!bidder_name || !amount) return res.status(400).json({ error: 'Name and amount are required' });
  const state = await getAuctionState(req.params.id);
  if (!state) return res.status(404).json({ error: 'Auction not found' });
  if (state.seconds_left <= 0) return res.status(400).json({ error: 'This auction has ended' });
  const minimum = state.highest === null ? Number(state.starting_price) : state.highest + 1;
  if (amount < minimum) return res.status(400).json({ error: 'Bid must be at least ' + minimum });
  await db.query('INSERT INTO bids (auction_id, bidder_name, amount) VALUES (?, ?, ?)',
    [req.params.id, bidder_name, amount]);
  const updated = await getAuctionState(req.params.id);
  io.to('auction:' + req.params.id).emit('auction-update', updated);
  res.status(201).json(updated);
}));

io.on('connection', (socket) => {
  socket.on('join', (auctionId) => socket.join('auction:' + auctionId));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`AutoVault running on http://localhost:${PORT}`));