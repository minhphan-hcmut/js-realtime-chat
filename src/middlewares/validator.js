

export const validateBody = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
    } catch (error) {
        next(error);
    }
}

export const validateQuery = (schema) => (req, res, next) => {
    try {
        req.query = schema.parse(req.query);
    } catch (error) {
        next(error)
    }
}