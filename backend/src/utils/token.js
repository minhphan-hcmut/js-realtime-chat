import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const generateTokens = (user) => {
    const payload = { uid: user.id || user.uid, email: user.email };

    const accessToken = jwt.sign(payload, config.jwt_access_secret, {
        expiresIn: '15m'
    });

    const refreshToken = jwt.sign(payload, config.jwt_refresh_secret, {
        expiresIn: '7d'
    });

    return { accessToken, refreshToken };
};