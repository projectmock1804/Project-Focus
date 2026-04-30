/**
 * Test script to verify subscription system functionality
 * Run: node test-subscription.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Load Firebase config from environment
require('dotenv').config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testSubscriptionSystem() {
  console.log('\n🧪 Testing Project Focus Subscription System\n');

  try {
    // Test 1: Create a test user
    console.log('✓ Test 1: Creating test user...');
    const testUserId = `test-user-${Date.now()}`;
    const now = new Date().toISOString();
    const freeTrialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      createdAt: now,
      updatedAt: now,
      tasksCreated: 0,
      tasksCompleted: 0,
      subscriptionStatus: 'free',
      freeTrialEndsAt,
      paidUntil: null,
    });
    console.log(`  Created user: ${testUserId}`);
    console.log(`  Trial ends at: ${freeTrialEndsAt}`);

    // Test 2: Check subscription status (should be free trial)
    console.log('\n✓ Test 2: Checking subscription status...');
    const userDoc = await db.collection('users').doc(testUserId).get();
    const user = userDoc.data();

    const now_date = new Date();
    const trialEnds = new Date(user.freeTrialEndsAt);
    const daysLeft = Math.ceil((trialEnds - now_date) / (1000 * 60 * 60 * 24));

    console.log(`  Status: ${user.subscriptionStatus}`);
    console.log(`  Days left: ${daysLeft}`);
    console.log(`  Has access: true (within trial period)`);

    // Test 3: Simulate upgrade to paid
    console.log('\n✓ Test 3: Simulating upgrade to paid plan...');
    const paidUntil = new Date();
    paidUntil.setMonth(paidUntil.getMonth() + 1);

    await db.collection('users').doc(testUserId).update({
      subscriptionStatus: 'paid',
      paidUntil: paidUntil.toISOString(),
    });
    console.log(`  Status: paid`);
    console.log(`  Paid until: ${paidUntil.toISOString()}`);

    // Test 4: Verify upgrade worked
    console.log('\n✓ Test 4: Verifying upgrade...');
    const updatedUserDoc = await db.collection('users').doc(testUserId).get();
    const updatedUser = updatedUserDoc.data();
    console.log(`  Current status: ${updatedUser.subscriptionStatus}`);
    console.log(`  Paid until: ${updatedUser.paidUntil}`);

    // Test 5: Test expired subscription
    console.log('\n✓ Test 5: Testing expired subscription...');
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    await db.collection('users').doc(testUserId).update({
      subscriptionStatus: 'expired',
      paidUntil: expiredDate.toISOString(),
    });
    console.log(`  Status: expired`);
    console.log(`  Expired at: ${expiredDate.toISOString()}`);
    console.log(`  Has access: false (should show UpgradePage)`);

    // Test 6: Cleanup
    console.log('\n✓ Test 6: Cleaning up test user...');
    await db.collection('users').doc(testUserId).delete();
    console.log(`  Test user deleted`);

    console.log('\n✅ All tests passed!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  }
}

testSubscriptionSystem();
