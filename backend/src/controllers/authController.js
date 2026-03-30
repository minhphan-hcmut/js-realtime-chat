import { config } from "dotenv";
import AuthService from "../services/authService.js";

class AuthController {
    static async handleAuth(req, res, actionFunc) {
        try {
            const { user, accessToken, refreshToken } = await actionFunc();

            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: config.node_env === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({ success: true, data: user, accessToken });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async register(req, res) {
        return AuthController.handleAuth(req, res, () => AuthService.register(req.body));
    }
    static async login(req, res) {
        return AuthController.handleAuth(req, res, () => AuthService.login(req.body));
    }
    static async loginWithGoogle(req, res) {
        return AuthController.handleAuth(req, res, () => AuthService.loginWithGoogle(req.body.idToken));
    }
    static async refreshToken(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ message: "no refresh token provided" });
            jwt.verify(refreshToken, config.jwt_refresh_secret, (err, decoded) => {
                if (err) return res.status(403).json({ message: "Invalid refresh token" });
                const user = { uid: decoded.uid, email: decoded.email };
                const newTokens = AuthService.generateTokens(user);
                res.cookie('refreshToken', newTokens.refreshToken, {
                    httpOnly: true,
                    secure: config.node_env === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });
                return res.json({ message: true, accessToken: newTokens.accessToken });
            })
        } catch (error) {
            next(error)
        }
    }
    static async logOut(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader.split(' ')[1];
            await AuthService.logOut(accessToken);
            res.clearCookie('refreshToken');
            return res.json({ success: true , message: "Logout successfully"});
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;