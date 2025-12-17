// Simple HTTP server for testing with data persistence API
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 10086;
const DATA_FILE = './data.json';

// MIME types for common file types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.txt': 'text/plain',
    '.json': 'application/json'
};

// Helper function to initialize data file with versioned structure
const initializeDataFile = (callback) => {
    const initialData = {};
    writeData(initialData, callback);
};

// Helper function to read data from file
const readData = (callback) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File doesn't exist, initialize it
                console.log('Data file not found, creating new one');
                initializeDataFile((initErr) => {
                    if (initErr) {
                        return callback(initErr);
                    }
                    readData(callback);
                });
                return;
            }
            console.error('Error reading data file:', err);
            return callback(err);
        }
        try {
            const parsedData = JSON.parse(data);
            callback(null, parsedData);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            callback(parseErr);
        }
    });
};

// Helper function to write data to file
const writeData = (data, callback) => {
    fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing data file:', err);
            return callback(err);
        }
        callback(null);
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
    console.log(`Request for ${req.url} received`);
    
    // API endpoints for data persistence
    if (req.url.startsWith('/api/data')) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle OPTIONS request (CORS preflight)
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Parse URL to get key if present
        const urlParts = req.url.split('/');
        const key = urlParts[3]; // /api/data/:key
        
        // Handle GET requests
        if (req.method === 'GET') {
            readData((err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to read data' }));
                    return;
                }
                
                if (key) {
                    // Return specific data item with version
                    const value = getVersionedData(data, key, null);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(value));
                } else {
                    // Return all data
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                }
            });
            return;
        }
        
        // Handle POST requests
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const postData = JSON.parse(body);
                    
                    readData((err, data) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to read data' }));
                            return;
                        }
                        
                        if (key) {
                            // Update specific data item with version check
                            const oldVersion = postData.version || 0;
                            const newData = postData.data;
                            
                            const result = updateVersionedData(data, key, newData, oldVersion);
                            
                            if (!result.success) {
                                // Version conflict
                                res.writeHead(409, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    error: 'Version conflict',
                                    conflict: true,
                                    currentVersion: result.currentVersion
                                }));
                                return;
                            }
                            
                            writeData(data, (writeErr) => {
                                if (writeErr) {
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Failed to save data' }));
                                    return;
                                }
                                
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: true,
                                    data: data[key].data,
                                    version: result.newVersion
                                }));
                            });
                        } else {
                            // Replace all data (not recommended for versioned data)
                            // Convert plain data to versioned format
                            const versionedData = {};
                            Object.keys(postData).forEach(k => {
                                if (postData[k] && postData[k].data !== undefined) {
                                    // Already versioned
                                    versionedData[k] = postData[k];
                                } else {
                                    // Convert to versioned
                                    versionedData[k] = {
                                        data: postData[k],
                                        version: 1
                                    };
                                }
                            });
                            
                            writeData(versionedData, (writeErr) => {
                                if (writeErr) {
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Failed to save data' }));
                                    return;
                                }
                                
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                            });
                        }
                    });
                } catch (parseErr) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }
    }

    // Determine file path for static files
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Determine MIME type
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve the static file with utf-8 encoding
    fs.readFile(filePath, 'utf-8', (error, content) => {
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
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://192.168.53.2:${PORT}/`);
    console.log('API endpoints:');
    console.log('  GET /api/data - Get all data');
    console.log('  POST /api/data - Save all data');
    console.log('  GET /api/data/:key - Get specific data item');
    console.log('  POST /api/data/:key - Save specific data item');
});
