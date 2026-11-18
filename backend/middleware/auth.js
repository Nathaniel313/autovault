const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    console.log('AUTH MIDDLEWARE IS RUNNING');
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];
    console.log('AUTH HEADER RECEIVED:', !!authHeader);
console.log('TOKEN RECEIVED:', !!token);
console.log('JWT SECRET LOADED:', !!process.env.JWT_SECRET);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please log in.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('JWT ERROR:', err.message);

            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }

        req.user = user;
        next();
    });
};

module.exports = authenticateToken;