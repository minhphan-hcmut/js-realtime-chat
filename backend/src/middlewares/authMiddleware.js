import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({
        success: false,
        message: 'Missing token',
    });
    jwt.verify(token, config.jwt_access_secret, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Token is outdated or wrong - Forbidden'})
        req.user = decoded;
    })
    next();
}