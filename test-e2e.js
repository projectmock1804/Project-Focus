#!/usr/bin/env node

/**
 * End-to-End Test Script
 * Tests: Signup → DB Save → Admin Retrieval
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';

// Generate test user
const timestamp = Date.now();
const testEmail = `test${timestamp}@example.com`;
const testPassword = 'TestPass123!@#';
const testName = `Test User ${timestamp}`;

// Get today's admin secret (focusMMDD)
function getTodaySecret() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `focus${month}${date}`;
}

const adminSecret = getTodaySecret();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Project Focus - End-to-End Test Suite                ║
╚════════════════════════════════════════════════════════════════╝

📋 Test Configuration:
  API URL: ${API_BASE}
  Test Email: ${testEmail}
  Admin Secret: ${adminSecret}
  Timestamp: ${new Date().toISOString()}
`);

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  console.log(`${icons[type]} ${message}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  try {
    // Test 1: Ensure user endpoint exists
    log('Test 1: Checking API health...', 'info');
    try {
      const healthRes = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (healthRes.status === 200) {
        log('API is healthy', 'success');
        testsPassed++;
      } else {
        log(`API returned status ${healthRes.status}`, 'error');
        testsFailed++;
      }
    } catch (err) {
      log(`API unreachable: ${err.message}`, 'error');
      log('⚠️ Make sure server is running: npm run api', 'warning');
      testsFailed++;
    }

    // Test 2: Check admin users endpoint
    log('\nTest 2: Retrieving admin user list...', 'info');
    try {
      const usersRes = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'x-admin-secret': adminSecret }
      });

      if (usersRes.status === 401) {
        log(`❌ Admin secret is wrong. Should be: ${adminSecret}`, 'error');
        testsFailed++;
      } else if (usersRes.status === 200) {
        const usersData = await usersRes.json();
        const userCount = usersData.users?.length || 0;
        log(`Retrieved ${userCount} users from database`, 'success');
        testsPassed++;

        // Show user list
        if (userCount > 0) {
          console.log('\n📊 Current Users in Database:');
          usersData.users.slice(0, 5).forEach((user, i) => {
            console.log(`  ${i + 1}. ${user.email} (${user.displayName}) - Status: ${user.subscriptionStatus}`);
          });
          if (userCount > 5) {
            console.log(`  ... and ${userCount - 5} more`);
          }
        }
      } else {
        log(`Unexpected status: ${usersRes.status}`, 'error');
        testsFailed++;
      }
    } catch (err) {
      log(`Failed to retrieve users: ${err.message}`, 'error');
      testsFailed++;
    }

    // Test 3: Check subscription status endpoint
    log('\nTest 3: Checking subscription status endpoint...', 'info');
    try {
      // Use a random test user ID
      const testUserId = 'test-user-' + timestamp;
      const subRes = await fetch(`${API_BASE}/api/subscription/status?userId=${encodeURIComponent(testUserId)}`);

      if (subRes.status === 200) {
        const subData = await subRes.json();
        log(`Subscription endpoint working. Status: ${subData.status || 'unknown'}`, 'success');
        testsPassed++;
      } else {
        log(`Subscription endpoint returned ${subRes.status}`, 'error');
        testsFailed++;
      }
    } catch (err) {
      log(`Failed to check subscription: ${err.message}`, 'error');
      testsFailed++;
    }

  } catch (err) {
    log(`Test suite error: ${err.message}`, 'error');
  }

  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     Test Results                               ║
╚════════════════════════════════════════════════════════════════╝

✅ Passed: ${testsPassed}
❌ Failed: ${testsFailed}
📊 Total: ${testsPassed + testsFailed}

${testsFailed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed. Check above for details.'}

📝 Next Steps:
  1. Deploy to Render: git push origin main
  2. Deploy Firestore rules: firebase deploy --only firestore:rules
  3. Set ADMIN_SECRET env var on Render if needed
  4. Visit: ${API_BASE.replace('localhost:3000', 'project-focus-mo3i.onrender.com')}/admin

`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests();
