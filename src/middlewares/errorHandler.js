
// export default function errorHandler(err, req, res, next) {
//     console.error('[ERROR]', err.stack || err.message);
//     const statusCode = err.statusCode || 500;
//     res.status(statusCode).json({
//         success: false,
//         message: err.message || 'Internal Server Error'
//     });
// }

import { success } from "zod";

export default function errorHandler(err, req, res, next) {
    console.error('[ERROR]', err.stack || err.message);

    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map(e => ({
                field: e.path.json('.'),
                message: e.message,
            })),
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Resource already exists',
            detail: err.message,
        });
    }
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
}