import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.PORT,
    mongodb_user: process.env.MONGODB_USER,
    mongodb_password: process.env.MONGODB_PASSWORD,
    mongodb_host: process.env.MONGODB_HOST,
    mongodb_db: process.env.MONGODB_DB,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    redis_url: process.env.REDIS_URL,
};
