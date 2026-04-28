const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  try {
    // Step 1: Get all tasks
    console.log('Step 1: Fetching all tasks...');
    const tasksRes = await makeRequest('http://localhost:3000/api/tasks');
    console.log(`  Status: ${tasksRes.status}`);

    if (!tasksRes.data.tasks || tasksRes.data.tasks.length === 0) {
      console.log('  ERROR: No tasks found!');
      return;
    }

    const taskId = tasksRes.data.tasks[0].id;
    const taskTitle = tasksRes.data.tasks[0].title;
    console.log(`  Found ${tasksRes.data.tasks.length} tasks`);
    console.log(`  First task: "${taskTitle}" (${taskId})`);

    // Step 2: Fetch progress for that task
    console.log(`\nStep 2: Fetching progress for task ${taskId}...`);
    const progressRes = await makeRequest(`http://localhost:3000/api/task/${taskId}/progress`);
    console.log(`  Status: ${progressRes.status}`);

    if (progressRes.status === 200) {
      console.log(`  SUCCESS: Got task progress`);
      console.log(`  Task title: "${progressRes.data.title}"`);
      console.log(`  Progress: ${progressRes.data.progress}%`);
      console.log(`  Status: ${progressRes.data.status}`);
    } else {
      console.log(`  ERROR: Got status ${progressRes.status}`);
      console.log(`  Response:`, progressRes.data);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
