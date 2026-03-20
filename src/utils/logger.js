const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVELS || 'DEBUG'];

function formatMessage(level, context, message) {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}] [${context}] ${message}`;
}


const logger = {
    debug: (context, msg) => CURRENT_LEVEL <= LOG_LEVELS.DEBUG && console.log(formatMessage('DEBUG', context, msg)),
    info: (context, msg) => CURRENT_LEVEL <= LOG_LEVELS.INFO && console.log(formatMessage('INFO', context, msg)),
    warn: (context, msg) => CURRENT_LEVEL <= LOG_LEVELS.WARN && console.warn(formatMessage('WARN', context, msg)),
    error: (context, msg) => CURRENT_LEVEL <= LOG_LEVELS.ERROR && console.error(formatMessage('ERROR', context, msg)),
}

export default logger;