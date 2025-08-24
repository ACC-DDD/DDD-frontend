#!/usr/bin/env node

// Test script to check backend connection
require('dotenv').config({ path: '.env.local' });
const http = require('http');

const BACKEND_URL = process.env.API_BASE_URL || 'http://43.203.156.19:8080';
const TEST_TOKEN = process.env.TEST_TOKEN;

console.log('🔍 Testing backend connection...');
console.log('🌐 Backend URL:', BACKEND_URL);
console.log('🔑 Using test token for member ID 3');
console.log('📱 Phone: 010-8888-7777');
console.log('');

// Test basic connectivity
function testConnection() {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + '/cctvs');

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      timeout: 10000 // 10 seconds timeout
    };

    const req = http.request(options, (res) => {
      console.log('✅ Connection successful!');
      console.log('📊 Status Code:', res.statusCode);
      console.log('📋 Headers:', res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('📦 Response Data:', JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          console.log('📄 Raw Response:', data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Connection failed:', error.message);
      if (error.code === 'ETIMEDOUT') {
        console.error('⏰ Connection timed out - server may be down');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 Connection refused - server is not accepting connections');
      } else if (error.code === 'ENOTFOUND') {
        console.error('🔍 Host not found - check the IP address');
      }
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏰ Request timed out after 10 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test without authentication
function testWithoutAuth() {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + '/cctvs');

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    console.log('🔓 Testing without authentication...');

    const req = http.request(options, (res) => {
      console.log('📊 Status Code (no auth):', res.statusCode);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📄 Response (no auth):', data.substring(0, 200) + '...');
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ No-auth test failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏰ No-auth test timed out');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    console.log('='.repeat(50));
    console.log('🧪 Test 1: Connection with authentication');
    console.log('='.repeat(50));
    await testConnection();

    console.log('\n' + '='.repeat(50));
    console.log('🧪 Test 2: Connection without authentication');
    console.log('='.repeat(50));
    await testWithoutAuth();

  } catch (error) {
    console.error('\n💥 All tests failed. Backend server appears to be down.');
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check if the backend server is running');
    console.log('2. Verify the IP address: 43.203.156.19');
    console.log('3. Check if port 8080 is open');
    console.log('4. Test from a different network');
    console.log('5. Contact the backend team');
  }
}

runTests();