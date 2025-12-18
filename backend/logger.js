const fs = require('fs');
const path = require('path');

// 日志目录
const LOGS_DIR = path.join(__dirname, '..', 'logs');

// 确保日志目录存在
const ensureLogsDir = () => {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
};

// 获取当天的日志文件名
const getLogFileName = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.log`;
};

// 格式化日志消息
const formatLogMessage = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    if (data) {
        return `${timestamp} [${level}] ${message} ${JSON.stringify(data)}\n`;
    }
    return `${timestamp} [${level}] ${message}\n`;
};

// 写入日志到文件
const writeLog = (level, message, data = null) => {
    ensureLogsDir();
    
    const logFileName = getLogFileName();
    const logFilePath = path.join(LOGS_DIR, logFileName);
    const logMessage = formatLogMessage(level, message, data);
    
    // 同时输出到控制台和文件
    console.log(logMessage.replace(/\n$/, ''));
    
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
};

// 日志对象，提供不同级别的日志方法
const logger = {
    info: (message, data = null) => writeLog('INFO', message, data),
    error: (message, data = null) => writeLog('ERROR', message, data),
    warning: (message, data = null) => writeLog('WARNING', message, data),
    debug: (message, data = null) => writeLog('DEBUG', message, data)
};

module.exports = logger;
