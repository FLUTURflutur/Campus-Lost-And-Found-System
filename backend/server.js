const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.error('FATAL: SESSION_SECRET must be set and at least 16 characters.');
    process.exit(1);
}

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

function makeRateLimiter(windowMs, max) {
    const store = new Map();
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const cutoff = now - windowMs;
        const hits = (store.get(key) || []).filter(t => t > cutoff);
        if (hits.length >= max) {
            return res.status(429).json({ message: 'Too many requests, please slow down.' });
        }
        hits.push(now);
        store.set(key, hits);
        next();
    };
}

const authLimiter     = makeRateLimiter(15 * 60 * 1000, 20);  // 20 per 15 min
const postLimiter     = makeRateLimiter(60 * 60 * 1000, 30);  // 30 per hour
const registerLimiter = makeRateLimiter(60 * 60 * 1000, 10);  // 10 per hour

app.get('/', (req, res) => {
    res.json({ message: 'Campus Lost and Found API' });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/auth/register', registerLimiter);
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/claims', postLimiter, require('./routes/claims'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/superadmin', require('./routes/superadmin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});