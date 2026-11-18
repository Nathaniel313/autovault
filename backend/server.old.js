const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth');
const authorizeRole = require('./middleware/authorize');


require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Test route
app.get('/', (req, res) => {
    res.send('Welcome to AutoVault API!');
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM listings');

        res.json({
            message: 'Database connected successfully!',
            totalCars: rows[0].total
        });
    } catch (error) {
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Get all available cars
app.get('/api/cars', async (req, res) => {
    try {
        const [cars] = await db.query(`
            SELECT 
                listings.*,
                dealers.name AS dealer_name
            FROM listings
            JOIN dealers ON listings.dealer_id = dealers.id
            WHERE listings.status = 'active'
            ORDER BY listings.created_at DESC
        `);

        res.json({
            success: true,
            total: cars.length,
            cars: cars
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get a single car by ID
app.get('/api/cars/:id', async (req, res) => {
    try {
        const carId = req.params.id;

        const [cars] = await db.query(`
            SELECT 
                listings.*,
                dealers.name AS dealer_name
            FROM listings
            JOIN dealers ON listings.dealer_id = dealers.id
            WHERE listings.id = ?
            AND listings.status = 'active'
        `, [carId]);

        if (cars.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        const [photos] = await db.query(
            'SELECT * FROM listing_photos WHERE listing_id = ?',
            [carId]
        );

        const [features] = await db.query(
            'SELECT * FROM listing_features WHERE listing_id = ?',
            [carId]
        );

        res.json({
            success: true,
            car: {
                ...cars[0],
                photos,
                features
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Search cars by brand, model or location
app.get('/api/search', async (req, res) => {
    try {
        const { brand, model, location } = req.query;

        let sql = `
            SELECT listings.*, dealers.name AS dealer_name
            FROM listings
            JOIN dealers ON listings.dealer_id = dealers.id
            WHERE listings.status = 'active'
        `;

        const values = [];

        if (brand) {
            sql += ' AND listings.make LIKE ?';
            values.push(`%${brand}%`);
        }

        if (model) {
            sql += ' AND listings.model LIKE ?';
            values.push(`%${model}%`);
        }

        if (location) {
            sql += ' AND listings.location LIKE ?';
            values.push(`%${location}%`);
        }

        sql += ' ORDER BY listings.created_at DESC';

        const [cars] = await db.query(sql, values);

        res.json({
            success: true,
            total: cars.length,
            cars
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, phone, password, role } = req.body;

        // Check required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        // Validate account role
        const userRole = role || 'buyer';

        if (!['buyer', 'dealer'].includes(userRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account role'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user in database
        const [result] = await db.query(
            `INSERT INTO users 
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?)`,
            [full_name, email, phone || null, hashedPassword, userRole]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            userId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Compare passwords
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Protected User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, full_name, email, phone, role, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Dealer Dashboard (Dealer Only)
app.get('/api/dealer/dashboard',
    authenticateToken,
    authorizeRole('dealer'),
    (req, res) => {

        res.json({
            success: true,
            message: 'Welcome to the AutoVault Dealer Dashboard!'
        });

    }
);

// Add New Car Listing (Dealer Only)
app.post('/api/dealer/listings', 
    authenticateToken,
    authorizeRole('dealer'),
    async (req, res) => {

        try {
            const {
                title,
                make,
                model,
                year,
                price,
                mileage,
                fuel_type,
                transmission,
                location,
                description
            } = req.body;

            // Find dealer profile
            const [dealers] = await db.query(
                'SELECT id FROM dealers WHERE user_id = ?',
                [req.user.id]
            );

            if (dealers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Dealer profile not found.'
                });
            }

            const dealerId = dealers[0].id;

            // Insert car listing
            const [result] = await db.query(
                `INSERT INTO listings
                (dealer_id, title, make, model, year, price, mileage,
                 fuel_type, transmission, location, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    dealerId,
                    title,
                    make,
                    model,
                    year,
                    price,
                    mileage || 0,
                    fuel_type || 'Petrol',
                    transmission || 'Automatic',
                    location,
                    description
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Car listed successfully!',
                listingId: result.insertId
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

console.log('Dealer dashboard route registered');
console.log('Dealer listings route registered');
// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`AutoVault server running on port ${PORT}`);
});
 