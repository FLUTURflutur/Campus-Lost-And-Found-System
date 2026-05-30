const authMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please log in to continue' });
    }
    next();
};

const adminMiddleware = (req, res, next) => {
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'superadmin')) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

const superadminMiddleware = (req, res, next) => {
    if (!req.session.userId || req.session.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware, superadminMiddleware };