import { config } from "dotenv";
import AuthService from "../services/authService";

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
            res.status(400).json({ success: true, message: error.message });
        }
    }
    static async register(req, res) {
        return AuthController.handleAuth(req, res, () => AuthService.register(req.body));
    }
    static async login(req, res) {
        return AuthController.handleAuth(req, res, () => AuthService.login(req.body));
    }
    static async loginWithGoogle(req, res) {
        return AuthController.handleAuth(req, res, () => AuthService, this.loginWithGoogle(req.body.idToken));
    }
}

export default AuthController;