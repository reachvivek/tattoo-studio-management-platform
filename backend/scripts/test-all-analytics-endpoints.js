const http = require('http');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing all analytics endpoints...\n');

  const tests = [
    { name: 'Funnel Stats', path: '/api/analytics-detailed/funnel-stats' },
    { name: 'Daily Analytics', path: '/api/analytics-detailed/daily' },
    { name: 'Traffic Sources', path: '/api/analytics-detailed/traffic-sources' },
    { name: 'Device Stats', path: '/api/analytics-detailed/device-stats' },
    { name: 'Drop-off Analysis', path: '/api/analytics-detailed/drop-off' },
    { name: 'Real-time Stats', path: '/api/analytics-detailed/realtime' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await makeRequest(test.path);

      if (result.statusCode === 200 && result.data.success) {
        console.log(`   ✅ Status: ${result.statusCode}`);
        console.log(`   ✅ Has data: ${result.data.data ? 'Yes' : 'No'}`);

        // Show preview of data
        if (result.data.data) {
          const dataStr = JSON.stringify(result.data.data).substring(0, 100);
          console.log(`   📊 Preview: ${dataStr}...`);
        }
      } else {
        console.log(`   ⚠️  Status: ${result.statusCode}`);
        console.log(`   ⚠️  Response:`, result.data);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('✅ All endpoint tests completed!');
}

testAllEndpoints();
