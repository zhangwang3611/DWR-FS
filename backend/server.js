// Simple HTTP server for testing with data persistence API
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// 导入配置文件
const config = require('../config/backend-config');
// 导入日志工具
const logger = require('./logger');

const PORT = config.PORT;
const DATA_FILE = path.join(__dirname, '..', config.DATA_FILE);
const REPORTS_FILE = path.join(__dirname, '..', config.REPORTS_FILE);
const SERVER_IP = config.SERVER_IP;

// MIME types for common file types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon'
};

// Helper function to initialize data file with versioned structure
const initializeDataFile = (filePath, callback) => {
    // 确保目录存在
    const dirPath = path.dirname(filePath);
    fs.mkdirSync(dirPath, { recursive: true });
    
    // 根据文件路径决定初始数据
    let initialData = {};
    if (filePath === REPORTS_FILE) {
        // 如果是reports.json，初始化为包含reports对象的结构
        initialData = {
            reports: {
                data: [],
                version: 1
            }
        };
    } else {
        // 其他文件初始化为空对象
        initialData = {};
    }
    
    // 确保使用 UTF-8 编码初始化文件
    const jsonString = JSON.stringify(initialData, null, 2);
    fs.writeFile(filePath, jsonString, { encoding: 'utf8', flag: 'w' }, (err) => {
        if (err) {
            logger.error('Error initializing data file:', err);
            return callback(err);
        }
        logger.info('Data file initialized successfully:', filePath);
        callback(null);
    });
};

// Helper function to read data from file
const readData = (callback) => {
    // Read both files and merge them
    fs.readFile(DATA_FILE, 'utf8', (err1, data1) => {
        if (err1) {
            if (err1.code === 'ENOENT') {
                // Data file doesn't exist, initialize it
                logger.info('Data file not found, creating new one');
                initializeDataFile(DATA_FILE, (initErr1) => {
                    if (initErr1) {
                        return callback(initErr1);
                    }
                    // After initializing, read again
                    readData(callback);
                });
                return;
            } else {
                logger.error('Error reading data file:', err1);
                return callback(err1);
            }
        }
        
        fs.readFile(REPORTS_FILE, 'utf8', (err2, data2) => {
            if (err2) {
                if (err2.code === 'ENOENT') {
                    // Reports file doesn't exist, initialize it
                    logger.info('Reports file not found, creating new one');
                    initializeDataFile(REPORTS_FILE, (initErr2) => {
                        if (initErr2) {
                            return callback(initErr2);
                        }
                        // After initializing, read again
                        readData(callback);
                    });
                    return;
                } else {
                    logger.error('Error reading reports file:', err2);
                    return callback(err2);
                }
            }
            
            try {
                const mainData = JSON.parse(data1);
                const reportsData = JSON.parse(data2);
                // Merge the data
                const mergedData = { ...mainData, ...reportsData };
                callback(null, mergedData);
            } catch (parseErr) {
                logger.error('Error parsing JSON:', parseErr);
                callback(parseErr);
            }
        });
    });
};

// Helper function to write data to file atomically
const writeFileAtomic = (filePath, content, callback) => {
    const tempPath = filePath + '.tmp';
    // 确保内容以 UTF-8 编码写入，使用明确的编码选项
    fs.writeFile(tempPath, content, { encoding: 'utf8', flag: 'w' }, (err) => {
        if (err) {
            logger.error(`Error writing temp file ${tempPath}:`, err);
            return callback(err);
        }
        // Atomically replace the original file
        fs.rename(tempPath, filePath, (renameErr) => {
            if (renameErr) {
                logger.error(`Error renaming temp file ${tempPath} to ${filePath}:`, renameErr);
                // Try to clean up temp file
                fs.unlink(tempPath, () => {});
                return callback(renameErr);
            }
            callback(null);
        });
    });
};

// Helper function to write data to file
// Only writes files that actually contain data changes
const writeData = (data, callback) => {
    // Split data into main data and reports data
    const mainData = { ...data };
    const hasReports = mainData.hasOwnProperty('reports') && mainData.reports !== undefined;
    const reportsData = hasReports ? { reports: mainData.reports } : null;
    
    // Remove reports from main data
    delete mainData.reports;
    
    // Check if mainData has any meaningful content (not just empty object)
    const hasMainData = Object.keys(mainData).length > 0 && 
                        Object.values(mainData).some(v => v !== null && v !== undefined);
    
    // Determine which files need to be written
    const needsMainFile = hasMainData;
    const needsReportsFile = hasReports;
    
    // If neither file needs updating, just callback
    if (!needsMainFile && !needsReportsFile) {
        return callback(null);
    }
    
    // Write files that need updating
    const writePromises = [];
    
    // Helper function to safely stringify JSON with proper Unicode handling
    const safeStringify = (obj) => {
        // JSON.stringify 默认会正确处理 Unicode 字符
        // 使用 replacer 和 space 参数确保格式化和正确编码
        return JSON.stringify(obj, (key, value) => {
            // 确保所有字符串值都正确编码
            if (typeof value === 'string') {
                return value;
            }
            return value;
        }, 2);
    };
    
    if (needsMainFile) {
        writePromises.push(new Promise((resolve, reject) => {
            const jsonString = safeStringify(mainData);
            writeFileAtomic(DATA_FILE, jsonString, (err) => {
                if (err) reject(err);
                else resolve();
            });
        }));
    }
    
    if (needsReportsFile) {
        writePromises.push(new Promise((resolve, reject) => {
            const jsonString = safeStringify(reportsData);
            writeFileAtomic(REPORTS_FILE, jsonString, (err) => {
                if (err) reject(err);
                else resolve();
            });
        }));
    }
    
    // Wait for all writes to complete
    Promise.all(writePromises)
        .then(() => callback(null))
        .catch((err) => {
            logger.error('Error writing data files:', err);
            callback(err);
        });
};

// Helper function to get versioned data for a key
const getVersionedData = (data, key, defaultValue) => {
    if (!data[key]) {
        return {
            data: defaultValue,
            version: 1
        };
    }
    
    // 检查数据是否为版本化格式，如果不是则转换为版本化格式
    if (!data[key].version) {
        // 旧格式数据，转换为版本化格式
        const oldData = data[key];
        data[key] = {
            data: oldData,
            version: 1
        };
        // 保存转换后的版本化数据到文件
        writeData(data, () => {});
    }
    
    return data[key];
};

// Helper function to update versioned data for a key
const updateVersionedData = (data, key, newData, oldVersion) => {
    // 检查数据是否为版本化格式，如果不是则转换为版本化格式
    if (data[key] && !data[key].version) {
        // 旧格式数据，转换为版本化格式
        const oldData = data[key];
        data[key] = {
            data: oldData,
            version: 1
        };
        // 如果客户端发送的是0版本号（首次保存），允许保存
        if (oldVersion === 0) {
            data[key].data = newData;
            data[key].version = 2;
            return {
                success: true,
                newVersion: 2
            };
        }
    }
    
    if (!data[key]) {
        // First time saving this key
        data[key] = {
            data: newData,
            version: 1
        };
        return {
            success: true,
            newVersion: 1
        };
    }
    
    if (data[key].version !== oldVersion) {
        // Version conflict
        return {
            success: false,
            conflict: true,
            currentVersion: data[key].version
        };
    }
    
    // Update with new version
    const newVersion = oldVersion + 1;
    data[key] = {
        data: newData,
        version: newVersion
    };
    
    return {
        success: true,
        newVersion: newVersion
    };
};

const server = http.createServer((req, res) => {
    // 从请求头中获取操作人信息，并解码Base64编码的中文字符
    let operator = req.headers['x-operator'] || '未知用户';
    try {
        // 尝试解码Base64编码的操作人姓名
        operator = Buffer.from(operator, 'base64').toString('utf8');
    } catch (e) {
        // 如果解码失败，使用原始值
    }
    logger.info(`[${operator}] Request for ${req.url} received`);
    
    // API endpoints for data persistence
    if (req.url.startsWith('/api/data')) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Operator');
        
        // Handle OPTIONS request (CORS preflight)
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Handle GET /api/data (get all data)
        if (req.url === '/api/data' && req.method === 'GET') {
            readData((err, data) => {
                if (err) {
                    logger.error('Error reading data:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to read data' }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            });
            return;
        }

        // Handle POST /api/data (save all data)
        if (req.url === '/api/data' && req.method === 'POST') {
            const chunks = [];
            req.on('data', chunk => {
                chunks.push(chunk);
            });
            req.on('end', () => {
                try {
                    // 使用 Buffer 来确保正确解析 UTF-8 编码的数据
                    const body = Buffer.concat(chunks).toString('utf8');
                    const newData = JSON.parse(body);
                    writeData(newData, (err) => {
                        if (err) {
                            logger.error('Error writing data:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save data' }));
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    });
                } catch (parseErr) {
                    logger.error('Error parsing data:', parseErr);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON data' }));
                }
            });
            return;
        }

        // Handle GET /api/data/:key (get specific data item)
        const getKeyMatch = req.url.match(/^\/api\/data\/(\w+)$/);
        if (getKeyMatch && req.method === 'GET') {
            const key = getKeyMatch[1];
            readData((err, data) => {
                if (err) {
                    logger.error('Error reading data:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to read data' }));
                    return;
                }
                const versionedData = getVersionedData(data, key, []);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(versionedData));
            });
            return;
        }

        // Handle POST /api/data/:key (save specific data item)
        const postKeyMatch = req.url.match(/^\/api\/data\/(\w+)$/);
        if (postKeyMatch && req.method === 'POST') {
            const key = postKeyMatch[1];
            const chunks = [];
            req.on('data', chunk => {
                chunks.push(chunk);
            });
            req.on('end', () => {
                try {
                    // 使用 Buffer 来确保正确解析 UTF-8 编码的数据
                    const body = Buffer.concat(chunks).toString('utf8');
                    const requestData = JSON.parse(body);
                    readData((err, data) => {
                        if (err) {
                            logger.error('Error reading data:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to read data' }));
                            return;
                        }
                        
                        const updateResult = updateVersionedData(data, key, requestData.data, requestData.version);
                        if (updateResult.success) {
                            writeData(data, (writeErr) => {
                                if (writeErr) {
                                    logger.error('Error writing data:', writeErr);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Failed to save data' }));
                                    return;
                                }
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true, newVersion: updateResult.newVersion }));
                            });
                        } else {
                            res.writeHead(409, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Version conflict', currentVersion: updateResult.currentVersion }));
                        }
                    });
                } catch (parseErr) {
                    logger.error('Error parsing data:', parseErr);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON data' }));
                }
            });
            return;
        }
    } else if (req.url === '/api/log' && req.method === 'POST') {
        // Handle log request
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Operator');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Read request body
        const chunks = [];
        req.on('data', chunk => {
            chunks.push(chunk);
        });
        
        req.on('end', () => {
            try {
                // 使用 Buffer 来确保正确解析 UTF-8 编码的数据
                const body = Buffer.concat(chunks).toString('utf8');
                const logData = JSON.parse(body);
                // Write log using logger
                const level = logData.level.toLowerCase();
                if (level === 'info') {
                    logger.info(logData.message, logData.data);
                } else if (level === 'error') {
                    logger.error(logData.message, logData.data);
                } else if (level === 'warning') {
                    logger.warning(logData.message, logData.data);
                } else if (level === 'debug') {
                    logger.debug(logData.message, logData.data);
                } else {
                    logger.info(logData.message, logData.data);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('Failed to process log request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process log request' }));
            }
        });
        
        return;
    }
    

    
    // 登录接口代理转发
    if (req.url === '/api/nerve/login' && req.method === 'POST') {
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // 处理OPTIONS请求（CORS预检）
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // 读取请求体
        const chunks = [];
        req.on('data', chunk => {
            chunks.push(chunk);
        });
        
        req.on('end', () => {
            // 使用 Buffer 来确保正确解析 UTF-8 编码的数据
            const body = Buffer.concat(chunks).toString('utf8');
            // 解析表单数据
            let formData;
            try {
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    formData = JSON.parse(body);
                } else {
                    // 处理表单数据
                    formData = querystring.parse(body);
                }
            } catch (parseErr) {
                logger.error('Error parsing login data:', parseErr);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid form data' }));
                return;
            }
            
            logger.info('登录代理请求参数:', formData);
            
            // 创建HTTPS agent以禁用证书验证
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false,
                timeout: 10000 // 设置10秒超时
            });
            
            // 配置外部API请求选项
            const externalApiOptions = {
                hostname: '192.168.56.78',
                path: '/cvicdns/xcom/rbac/loginAction.do',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(querystring.stringify(formData)),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                agent: httpsAgent,
                timeout: 10000 // 设置10秒超时
            };
            
            // 发送请求到外部API
            const externalReq = https.request(externalApiOptions, externalRes => {
                logger.info(`外部登录API响应状态码: ${externalRes.statusCode}`);
                logger.info(`外部登录API响应头: ${JSON.stringify(externalRes.headers)}`);
                
                // 收集响应体数据
                let responseBody = '';
                externalRes.on('data', chunk => {
                    responseBody += chunk;
                });
                
                externalRes.on('end', () => {
                    // 设置CORS头
                    const responseHeaders = {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': 'true'
                    };
                    
                    // 从响应头中提取JSESSIONID Cookie
                    let jsessionidCookie = null;
                    if (externalRes.headers['set-cookie']) {
                        logger.info(`外部登录API返回的Cookie: ${JSON.stringify(externalRes.headers['set-cookie'])}`);
                        const cookieHeaders = externalRes.headers['set-cookie'];
                        // 查找包含JSESSIONID的Cookie
                        const jsessionidCookieHeader = cookieHeaders.find(cookie => 
                            cookie.trim().startsWith('JSESSIONID=')
                        );
                        if (jsessionidCookieHeader) {
                            // 提取JSESSIONID值
                            const cookieRegex = /JSESSIONID=([a-zA-Z0-9]+)/;
                            const match = jsessionidCookieHeader.match(cookieRegex);
                            if (match) {
                                jsessionidCookie = jsessionidCookieHeader;
                            }
                        }
                    }
                    
                    // 检查响应体是否包含错误信息
                    const hasError = responseBody.includes('用户名口令不匹配');
                    
                    // 构造响应数据
                    const responseData = {
                        success: !hasError,
                        message: hasError ? '登录失败，用户名或密码错误' : '登录成功',
                        cookie: jsessionidCookie,
                        responseBody: responseBody
                    };
                    
                    // 设置响应状态码
                    const statusCode = hasError ? 401 : externalRes.statusCode;
                    
                    // 发送响应
                    res.writeHead(statusCode, responseHeaders);
                    res.end(JSON.stringify(responseData));
                });
            });
            
            // 处理请求超时
            externalReq.on('timeout', () => {
                logger.error('外部登录API请求超时');
                externalReq.destroy();
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '登录服务超时' }));
            });
            
            externalReq.on('error', error => {
                logger.error('外部登录API请求失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '登录服务不可用' }));
            });
            
            // 发送请求体
            externalReq.write(querystring.stringify(formData));
            externalReq.end();
        });
        
        return;
    }

    // Determine file path for static files
    let filePath;
    // 使用绝对路径，基于项目根目录
    const projectRoot = path.join(__dirname, '..');
    
    if (req.url === '/') {
        // 如果访问根路径，使用项目根目录下的index.html
        filePath = path.join(projectRoot, 'index.html');
    } else {
        // 否则，使用相对于项目根目录的绝对路径
        filePath = path.join(projectRoot, req.url);
    }

    // Determine MIME type
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Check if file is binary (images, etc.)
    const isBinary = extname.match(/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|pdf|zip|rar|exe|dll)$/i);

    // Read and serve the static file
    // Use binary encoding for images and other binary files, utf-8 for text files
    fs.readFile(filePath, isBinary ? null : 'utf-8', (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            // For binary files, content is already a Buffer, pass it directly
            // For text files, pass as string with utf-8 encoding
            if (isBinary) {
                res.end(content);
            } else {
                res.end(content, 'utf-8');
            }
        }
    });
});

server.listen(PORT, () => {
    logger.info(`Server running at http://${SERVER_IP}:${PORT}/`);
    logger.info('API endpoints:');
    logger.info('  GET /api/data - Get all data');
    logger.info('  POST /api/data - Save all data');
    logger.info('  GET /api/data/:key - Get specific data item');
    logger.info('  POST /api/data/:key - Save specific data item');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Error: Port ${PORT} is already in use`);
        logger.error('Please stop the existing server or change the port in config/backend-config.js');
        process.exit(1);
    } else {
        logger.error('Server error:', err);
        process.exit(1);
    }
});
