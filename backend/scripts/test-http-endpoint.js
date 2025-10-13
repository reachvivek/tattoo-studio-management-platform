const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 10 seconds'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing HTTP endpoints...\n');

  try {
    // Test health endpoint first
    console.log('1. Testing /health endpoint...');
    const healthResult = await testEndpoint('/health');
    console.log(`   Status: ${healthResult.statusCode}`);
    console.log(`   Response: ${healthResult.data.substring(0, 100)}...\n`);

    // Test analytics-detailed funnel stats
    console.log('2. Testing /api/analytics-detailed/funnel-stats...');
    const analyticsResult = await testEndpoint('/api/analytics-detailed/funnel-stats');
    console.log(`   Status: ${analyticsResult.statusCode}`);
    console.log(`   Response: ${analyticsResult.data}\n`);

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
