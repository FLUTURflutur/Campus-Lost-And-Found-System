const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { superadminMiddleware } = require('../middleware/auth');

router.use(superadminMiddleware);

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
    try {
        const { search = '', page = 1 } = req.query;
        const limit = 20;
        const offset = (parseInt(page) - 1) * limit;
        const conditions = [];
        const params = [];
        if (search) {
            conditions.push('(username LIKE ? OR email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
        const [users] = await db.query(
            `SELECT id, username, email, role, created_at, failed_attempts, locked_until
             FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) || 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/users', async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!['user', 'admin', 'superadmin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]
        );
        if (existing.length > 0) return res.status(400).json({ message: 'Username or email already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashed, role]
        );
        res.status(201).json({ message: 'User created', userId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, password } = req.body;
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const updates = [];
        const params = [];
        if (username) { updates.push('username = ?'); params.push(username.trim()); }
        if (email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            updates.push('email = ?'); params.push(email.trim());
        }
        if (role) {
            if (!['user', 'admin', 'superadmin'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            updates.push('role = ?'); params.push(role);
        }
        if (password) {
            if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
            const hashed = await bcrypt.hash(password, 10);
            updates.push('password = ?'); params.push(hashed);
        }
        if (updates.length === 0) return res.status(400).json({ message: 'Nothing to update' });
        params.push(id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.session.userId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id/unlock', async (req, res) => {
    try {
        await db.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [req.params.id]);
        res.json({ message: 'Account unlocked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Items ────────────────────────────────────────────────────────────────────

router.get('/items', async (req, res) => {
    try {
        const { search = '', page = 1, status = '' } = req.query;
        const limit = 20;
        const offset = (parseInt(page) - 1) * limit;
        const conditions = [];
        const params = [];
        if (search) {
            conditions.push('(i.title LIKE ? OR i.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status === 'deleted') {
            conditions.push('i.deleted_at IS NOT NULL');
        } else if (status) {
            conditions.push('i.status = ? AND i.deleted_at IS NULL');
            params.push(status);
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM items i ${where}`, params
        );
        const [items] = await db.query(
            `SELECT i.*, u.username AS reporter_name FROM items i
             LEFT JOIN users u ON u.id = i.reported_by
             ${where} ORDER BY i.id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / limit) || 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/items/:id', async (req, res) => {
    try {
        const { title, description, category, type, location, status, image_url } = req.body;
        const updates = [];
        const params = [];
        if (title !== undefined) {
            if (!title.trim() || title.length > 150) return res.status(400).json({ message: 'Title must be 1–150 characters' });
            updates.push('title = ?'); params.push(title.trim());
        }
        if (description !== undefined) {
            if (!description.trim() || description.length > 2000) return res.status(400).json({ message: 'Description must be 1–2000 characters' });
            updates.push('description = ?'); params.push(description.trim());
        }
        if (category !== undefined) { updates.push('category = ?'); params.push(category.trim()); }
        if (type !== undefined) {
            if (!['lost', 'found'].includes(type)) return res.status(400).json({ message: 'Type must be lost or found' });
            updates.push('type = ?'); params.push(type);
        }
        if (location !== undefined) { updates.push('location = ?'); params.push(location.trim()); }
        if (status !== undefined) {
            if (!['pending', 'approved', 'claimed', 'resolved'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
            updates.push('status = ?'); params.push(status);
        }
        if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url || null); }
        if (updates.length === 0) return res.status(400).json({ message: 'Nothing to update' });
        params.push(req.params.id);
        const [result] = await db.query(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item permanently deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/items/:id/restore', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE items SET deleted_at = NULL WHERE id = ?', [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item restored' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Claims ───────────────────────────────────────────────────────────────────

router.get('/claims', async (req, res) => {
    try {
        const { search = '', page = 1 } = req.query;
        const limit = 20;
        const offset = (parseInt(page) - 1) * limit;
        const conditions = [];
        const params = [];
        if (search) {
            conditions.push('(u.username LIKE ? OR i.title LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM claims c
             JOIN users u ON u.id = c.user_id
             JOIN items i ON i.id = c.item_id ${where}`,
            params
        );
        const [claims] = await db.query(
            `SELECT c.*, u.username AS claimer_name, i.title AS item_title FROM claims c
             JOIN users u ON u.id = c.user_id
             JOIN items i ON i.id = c.item_id
             ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        res.json({ claims, total, page: parseInt(page), pages: Math.ceil(total / limit) || 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/claims/:id', async (req, res) => {
    try {
        const { status, rejection_reason, message } = req.body;
        const updates = [];
        const params = [];
        if (status !== undefined) {
            if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
            updates.push('status = ?'); params.push(status);
        }
        if (rejection_reason !== undefined) { updates.push('rejection_reason = ?'); params.push(rejection_reason || null); }
        if (message !== undefined) { updates.push('message = ?'); params.push(message.trim()); }
        if (updates.length === 0) return res.status(400).json({ message: 'Nothing to update' });
        params.push(req.params.id);
        const [result] = await db.query(`UPDATE claims SET ${updates.join(', ')} WHERE id = ?`, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Claim not found' });
        res.json({ message: 'Claim updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/claims/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM claims WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Claim not found' });
        res.json({ message: 'Claim deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
