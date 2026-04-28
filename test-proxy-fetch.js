const http = require('http');

function makeRequest(url, host = 'localhost:5176') {
  return new Promise((resolve, reject) => {
    const reqUrl = new URL(url);
    const options = {
      hostname: reqUrl.hostname || 'localhost',
      port: reqUrl.port || 5176,
      path: reqUrl.pathname + reqUrl.search,
      method: 'GET',
      headers: {
        'Host': host,
      }
    };

    http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    }).on('error', reject).end();
  });
}

async function test() {
  try {
    // Get a task ID first
    console.log('Getting task ID from direct API...');
    const directRes = await makeRequest('http://localhost:3000/api/tasks');
    const taskId = directRes.data.tasks[0].id;
    console.log(`Task ID: ${taskId}\n`);

    // Test 1: Direct API call (should work)
    console.log('Test 1: Direct API call to localhost:3000');
    const directTest = await makeRequest(`http://localhost:3000/api/task/${taskId}/progress`);
    console.log(`  Status: ${directTest.status}`);
    console.log(`  Success: ${directTest.status === 200}\n`);

    // Test 2: Through web server proxy (what browser does)
    console.log('Test 2: Through Vite proxy on localhost:5176');
    const proxyTest = await makeRequest(`http://localhost:5176/api/task/${taskId}/progress`);
    console.log(`  Status: ${proxyTest.status}`);
    console.log(`  Content-Type: ${proxyTest.headers['content-type']}`);
    if (proxyTest.status !== 200) {
      console.log(`  Response: ${JSON.stringify(proxyTest.data).substring(0, 200)}`);
    } else {
      console.log(`  Title: "${proxyTest.data.title}"`);
    }
    console.log(`  Success: ${proxyTest.status === 200}\n`);

    if (directTest.status === 200 && proxyTest.status !== 200) {
      console.log('⚠️  ISSUE FOUND: Direct API works but proxy fails!');
      console.log('This means the Vite proxy might not be properly configured.');
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
