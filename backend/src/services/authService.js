import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import config from '../config/index.js'
import redisClient from '../config/redis.js'

// import { nextTick } from 'process';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {

    static generateTokens(user) {
        const payload = { uid: user.uid, email: user.email };
        const accessToken = jwt.sign(payload, config.jwt_access_secret, { expiresIn: config.jwt_access_expires_in });
        const refreshToken = jwt.sign(payload, config.jwt_refresh_secret, {
            expiresIn: config.jwt_refresh_expires_in
        });
        return { accessToken, refreshToken };
    }

    static async register({ email, password, name }) {
        const existing = await User.findOne({ email });
        if (existing) {
            throw new Error('Email already in use!');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = "USR-" + Date.now();
        const user = await User.create({
            uid, email, name, password: hashedPassword, auth_type: 'local'
        });
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        return { userWithoutPassword, ...this.generateTokens(userWithoutPassword) };
    }
    static async login({ email, password }) {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error('Non-existent email!');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Wrong password!')
        }
        return {user, ...this.generateTokens(user)}
    }
    static async loginWithGoogle(idToken) {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: config.google_client_id,
        });
        const { email, name, picture, sub: googleId } = ticket.getPayload();
        
        let user = await User.findOne({ email });
        if (!user) {
            const uid = "GGL-" + Date.now();
            user = await User.create({
                uid, email, name, google_id: googleId, avatar: picture, auth_type: 'google'
            });
        } else if (!user.google_id) {
            user.google_id = googleId;
            await user.save();
        }
        return { user, ...this.generateTokens(user) };
    }
    static async refreshToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwt_refresh_secret)
            const user = { uid: decoded.uid, email: decoded.email };
            return this.generateTokens(user);
        } catch (error) {
            throw new Error('Invalid or expired refresh token')
        }
    }
    static async logOut(accessToken) {
        if (!accessToken) return;
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = decoded.exp - currentTime;
            if (timeLeft > 0) {
                // redis client
                await redisClient.setEx(`bl_${accessToken}`, timeLeft, 'revoked');
            }
        }

    }
}
export default AuthService;