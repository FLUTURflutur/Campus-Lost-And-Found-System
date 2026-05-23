const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all approved items (public) with pagination, search, and filters
router.get('/', async (req, res) => {
    try {
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.max(1, parseInt(req.query.limit) || 20);
        const offset   = (page - 1) * limit;
        const search   = req.query.search   || '';
        const type     = req.query.type     || '';
        const category = req.query.category || '';

        const conditions = ["items.status = 'approved'", 'items.deleted_at IS NULL'];
        const params = [];

        if (search) {
            conditions.push('(items.title LIKE ? OR items.description LIKE ? OR items.location LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (type)     { conditions.push('items.type = ?');     params.push(type); }
        if (category) { conditions.push('items.category = ?'); params.push(category); }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM items JOIN users ON items.reported_by = users.id ${where}`,
            params
        );

        const [items] = await db.query(
            `SELECT items.*, users.username as reporter_name
             FROM items
             JOIN users ON items.reported_by = users.id
             ${where}
             ORDER BY items.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all items — all statuses (admin only)
router.get('/admin/all', adminMiddleware, async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT items.*, users.username as reporter_name
            FROM items
            JOIN users ON items.reported_by = users.id
            WHERE items.deleted_at IS NULL
            ORDER BY items.created_at DESC
        `);
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's own items (authenticated)
router.get('/user/my-items', authMiddleware, async (req, res) => {
    try {
        const [items] = await db.query(
            'SELECT * FROM items WHERE reported_by = ? AND deleted_at IS NULL ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single item
router.get('/:id', async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT items.*, users.username as reporter_name
            FROM items
            JOIN users ON items.reported_by = users.id
            WHERE items.id = ? AND items.deleted_at IS NULL
        `, [req.params.id]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found' });
        res.json(items[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new item (authenticated users only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, type, location, image_url } = req.body;
        if (!title || !description || !category || !type || !location) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }
        const [result] = await db.query(
            'INSERT INTO items (title, description, category, type, location, image_url, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, category, type, location, image_url || null, req.session.userId]
        );
        if (image_url) {
            await db.query(
                'UPDATE images SET item_id = ? WHERE url = ? AND uploaded_by = ? AND item_id IS NULL',
                [result.insertId, image_url, req.session.userId]
            );
        }
        res.status(201).json({ message: 'Item reported successfully', itemId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update item status or details (owner or admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, location, status } = req.body;
        const itemId = req.params.id;

        if (title        && title.length        > 150)  return res.status(400).json({ message: 'Title must be 150 characters or fewer' });
        if (description  && description.length  > 2000) return res.status(400).json({ message: 'Description must be 2000 characters or fewer' });
        if (location     && location.length     > 200)  return res.status(400).json({ message: 'Location must be 200 characters or fewer' });

        const [items] = await db.query('SELECT * FROM items WHERE id = ? AND deleted_at IS NULL', [itemId]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found' });

        const item = items[0];
        const isAdmin = req.session.userRole === 'admin';
        const isOwner = item.reported_by === req.session.userId;
        if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Not authorized' });

        const updateFields = [];
        const values = [];
        if (title)       { updateFields.push('title = ?');       values.push(title); }
        if (description) { updateFields.push('description = ?'); values.push(description); }
        if (category)    { updateFields.push('category = ?');    values.push(category); }
        if (location)    { updateFields.push('location = ?');    values.push(location); }
        if (status) {
            const ownerAllowed = isOwner && status === 'resolved';
            if (isAdmin || ownerAllowed) {
                updateFields.push('status = ?');
                values.push(status);
            }
        }

        if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });
        values.push(itemId);
        await db.query(`UPDATE items SET ${updateFields.join(', ')} WHERE id = ?`, values);
        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete item — soft delete (owner or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM items WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found' });
        const item = items[0];
        const isAdmin = req.session.userRole === 'admin';
        const isOwner = item.reported_by === req.session.userId;
        if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Not authorized' });
        await db.query('UPDATE items SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
