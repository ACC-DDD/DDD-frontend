#!/usr/bin/env node

// Simple Node.js script to test backend connection
const https = require('https');
const http = require('http');

const BACKEND_URL = 'http://43.203.156.19:8080';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test function
async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Frontend-Test-Script/1.0'
      },
      timeout: 10000 // 10 second timeout
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Main test function
async function runTests() {
  log('blue', '🚀 Starting Backend Connection Tests...');
  log('yellow', `📡 Testing connection to: ${BACKEND_URL}`);
  console.log('');

  const tests = [
    {
      name: 'Health Check',
      path: '/health',
      description: 'Basic server health check'
    },
    {
      name: 'CCTV Data',
      path: '/cctvs',
      description: 'Fetch CCTV locations'
    },
    {
      name: 'Districts Data',
      path: '/cctvs/districts',
      description: 'Fetch district information'
    },
    {
      name: 'Root Endpoint',
      path: '/',
      description: 'Test root endpoint'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      log('yellow', `🔄 Testing: ${test.name} (${test.path})`);
      
      const result = await testEndpoint(test.path);
      
      if (result.status >= 200 && result.status < 400) {
        log('green', `✅ ${test.name}: SUCCESS (Status: ${result.status})`);
        if (result.data && typeof result.data === 'object') {
          console.log(`   📊 Response data preview:`, JSON.stringify(result.data).substring(0, 100) + '...');
        }
        successCount++;
      } else {
        log('red', `❌ ${test.name}: FAILED (Status: ${result.status})`);
        console.log(`   📄 Response:`, result.data);
      }
    } catch (error) {
      log('red', `❌ ${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }

  // Summary
  log('blue', '📋 Test Summary:');
  log(successCount === totalTests ? 'green' : 'yellow', `✅ Successful: ${successCount}/${totalTests}`);
  log(successCount < totalTests ? 'red' : 'green', `❌ Failed: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount > 0) {
    log('green', '🎉 Backend is reachable! Your frontend should be able to connect.');
  } else {
    log('red', '⚠️  Backend connection failed. Please check:');
    console.log('   1. Backend server is running');
    console.log('   2. Backend URL is correct');
    console.log('   3. Network connectivity');
    console.log('   4. CORS settings on backend');
  }
}

// Run the tests
runTests().catch(console.error);