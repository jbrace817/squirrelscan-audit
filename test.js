// Simple test script to verify API locally
// Run with: node test.js

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-key';

console.log('🧪 Testing SquirrelScan Audit API\n');
console.log(`API URL: ${API_URL}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...\n`);

// Helper function to make requests
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health endpoint...');
    const health = await makeRequest('/');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${health.data.status}`);
    console.log('   ✅ Health check passed\n');

    // Test 2: Authentication
    console.log('2️⃣  Testing authentication...');
    const test = await makeRequest('/test');
    console.log(`   Status: ${test.status}`);
    if (test.status === 200) {
      console.log('   ✅ Authentication passed\n');
      console.log('   SquirrelScan:', test.data.tests.squirrelscan);
      console.log('   Google Drive:', test.data.tests.googleDrive);
      console.log('   Node:', test.data.tests.node);
    } else {
      console.log('   ❌ Authentication failed');
      console.log('   Response:', test.data);
    }
    console.log('');

    // Test 3: Single audit (if you want to test live)
    if (process.env.TEST_AUDIT === 'true') {
      console.log('3️⃣  Testing single audit...');
      console.log('   This will take ~30 seconds...');
      const audit = await makeRequest('/audit', 'POST', {
        url: 'https://example.com',
        format: 'json',
        uploadToDrive: false
      });
      console.log(`   Status: ${audit.status}`);
      if (audit.status === 200) {
        console.log('   ✅ Audit passed');
        console.log('   Metrics:', audit.data.metrics?.summary);
      } else {
        console.log('   ❌ Audit failed');
        console.log('   Error:', audit.data.error);
      }
      console.log('');
    }

    console.log('🎉 All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
