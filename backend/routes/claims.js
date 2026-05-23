const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get user's claims
router.get('/user/my-claims', authMiddleware, async (req, res) => {
    try {
        const [claims] = await db.query(`
            SELECT claims.*, items.title as item_title, items.type as item_type
            FROM claims
            JOIN items ON claims.item_id = items.id
            WHERE claims.user_id = ?
            ORDER BY claims.created_at DESC
        `, [req.session.userId]);
        res.json(claims);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all claims (admin only)
router.get('/admin/all', adminMiddleware, async (req, res) => {
    try {
        const [claims] = await db.query(`
            SELECT claims.*, items.title as item_title, items.type as item_type, users.username as claimer_name
            FROM claims
            JOIN items ON claims.item_id = items.id
            JOIN users ON claims.user_id = users.id
            ORDER BY claims.created_at DESC
        `);
        res.json(claims);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all claims on a specific item (item owner only)
router.get('/item/:itemId', authMiddleware, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const [items] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found' });
        if (items[0].reported_by !== req.session.userId && req.session.userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const [claims] = await db.query(`
            SELECT claims.*, users.username as claimer_name, users.email as claimer_email
            FROM claims
            JOIN users ON claims.user_id = users.id
            WHERE claims.item_id = ?
            ORDER BY claims.created_at DESC
        `, [itemId]);
        res.json(claims);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit a claim
router.post('/:itemId', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const itemId = req.params.itemId;
        if (!message) return res.status(400).json({ message: 'Message is required' });
        if (message.length > 1000) return res.status(400).json({ message: 'Message must be 1000 characters or fewer' });
        const [items] = await db.query('SELECT * FROM items WHERE id = ? AND status = "approved"', [itemId]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found or not approved' });
        const [existingClaims] = await db.query('SELECT * FROM claims WHERE item_id = ? AND user_id = ?', [itemId, req.session.userId]);
        if (existingClaims.length > 0) return res.status(400).json({ message: 'You have already claimed this item' });
        const [result] = await db.query(
            'INSERT INTO claims (item_id, user_id, message) VALUES (?, ?, ?)',
            [itemId, req.session.userId, message]
        );
        res.status(201).json({ message: 'Claim submitted successfully', claimId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update claim status (admin only)
router.put('/admin/:id', adminMiddleware, async (req, res) => {
    try {
        const { status, rejection_reason } = req.body;
        const claimId = req.params.id;
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const updateFields = ['status = ?'];
        const values = [status];
        if (rejection_reason !== undefined) {
            updateFields.push('rejection_reason = ?');
            values.push(rejection_reason || null);
        }
        values.push(claimId);

        const [result] = await db.query(
            `UPDATE claims SET ${updateFields.join(', ')} WHERE id = ?`, values
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Claim not found' });
        if (status === 'approved') {
            const [claimRows] = await db.query('SELECT item_id FROM claims WHERE id = ?', [claimId]);
            if (claimRows.length === 0) return res.status(404).json({ message: 'Claim not found' });
            const [alreadyApproved] = await db.query(
                'SELECT id FROM claims WHERE item_id = ? AND status = "approved" AND id != ?',
                [claimRows[0].item_id, claimId]
            );
            if (alreadyApproved.length > 0) {
                return res.status(409).json({ message: 'Another claim for this item is already approved.' });
            }
            await db.query('UPDATE items SET status = "claimed" WHERE id = ?', [claimRows[0].item_id]);
        }
        res.json({ message: 'Claim updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
