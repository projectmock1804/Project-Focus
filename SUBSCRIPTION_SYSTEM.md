# Project Focus Subscription System

## Overview

The subscription system manages user access to Project Focus with a 14-day free trial period and paid plan options.

## User Flow

### New User Signup
1. User signs up via Firebase Authentication (Google OAuth or Email)
2. User document is created in Firestore with default subscription fields:
   - `subscriptionStatus`: 'free' (trial period)
   - `freeTrialEndsAt`: ISO timestamp (current time + 14 days)
   - `paidUntil`: null

### During Free Trial
- User can access full Dashboard features
- Subscription badge shows "Trial: X days left"
- User receives email reminder before trial expiration (TODO: implement)

### Trial Expires
- User is redirected to UpgradePage
- User sees "Trial Expired" message with upgrade button
- User cannot access Dashboard until upgrading

### After Upgrade
- User completes payment via Toss (TODO: integrate)
- POST /api/subscription/upgrade is called
- User document updated with:
  - `subscriptionStatus`: 'paid'
  - `paidUntil`: ISO timestamp (current time + 1 month)
- User gains full Dashboard access again

## Database Schema

### Users Collection (`users`)
```javascript
{
  uid: string,              // Firebase UID
  email: string,
  displayName: string,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp,
  tasksCreated: number,
  tasksCompleted: number,
  
  // Subscription fields
  subscriptionStatus: 'free' | 'paid' | 'expired',
  freeTrialEndsAt: ISO timestamp | null,  // 14 days from signup
  paidUntil: ISO timestamp | null,         // Only set when user upgrades
}
```

## API Endpoints

### GET /api/subscription/status?userId={userId}
Checks user's subscription status.

**Response:**
```json
{
  "hasAccess": true,
  "status": "free_trial",
  "expiresAt": "2026-05-15T10:30:00Z",
  "daysLeft": 14
}
```

**Status Values:**
- `free_trial`: User is within 14-day trial period
- `paid`: User has active paid subscription
- `expired`: Both trial and paid subscription have expired
- `no_user`: User document not found

### POST /api/subscription/upgrade
Upgrades user to paid plan (called after successful Toss payment).

**Request Body:**
```json
{
  "userId": "user_uid",
  "monthsToAdd": 1  // optional, defaults to 1
}
```

**Response:**
```json
{
  "success": true,
  "status": "paid",
  "paidUntil": "2026-05-30T10:30:00Z"
}
```

## Frontend Components

### App.jsx
Main app component that:
- Listens for Firebase auth state changes
- Fetches subscription status when user authenticates
- Routes authenticated users based on subscription status
- Passes `subscriptionStatus` prop to Dashboard

### UpgradePage.jsx
Shown when user's subscription is expired:
- Displays trial expiration or upgrade needed message
- Shows remaining days if still in grace period
- "Upgrade Now" button (currently shows placeholder for Toss integration)
- "Logout" button

### SubscriptionBadge.jsx
Optional visual component to display subscription status:
- Shows "✨ Trial: X days left" (blue)
- Shows "✓ Paid Plan Active" (green)
- Shows "⚠ Subscription Expired" (red)

Can be added to Dashboard header or sidebar for users to see their subscription status at a glance.

## Next Steps

### Toss Payment Integration
1. Create checkout page with Toss SDK
2. Implement server-side payment verification
3. Call POST /api/subscription/upgrade after successful payment
4. Handle payment failures and retries

### Email Notifications
1. Send email 3 days before trial expiration
2. Send email when subscription is about to expire
3. Implement email templates

### Admin Dashboard
- View user subscription statuses
- Manually upgrade/downgrade users (for support)
- Track MRR (Monthly Recurring Revenue)
- View trial-to-paid conversion rate

### Auto-Renewal
- Implement auto-renewal for paid subscriptions
- Handle failed payment retries
- Send renewal reminders

## Testing

### Local Testing
```javascript
// In browser console
const userId = localStorage.getItem('userId');

// Check subscription status
fetch(`/api/subscription/status?userId=${userId}`)
  .then(r => r.json())
  .then(d => console.log(d));

// Simulate upgrade (for testing only)
fetch('/api/subscription/upgrade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, monthsToAdd: 1 })
})
  .then(r => r.json())
  .then(d => console.log(d));
```

### Production Testing
1. Create test user account
2. Sign up and verify 14-day trial is set
3. Verify UpgradePage appears after trial ends
4. Test payment flow (use Toss sandbox)
5. Verify user regains access after upgrade

## Error Handling

If subscription status check fails:
- App defaults to `{ hasAccess: true, status: 'free_trial' }`
- User can still access Dashboard
- Error is logged to console
- Graceful degradation ensures service continuity

## Database Cleanup

For testing, to reset a user's subscription:
```javascript
// Firestore console
db.collection('users').doc(userId).update({
  subscriptionStatus: 'free',
  freeTrialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  paidUntil: null
})
```

---

**Last Updated:** 2026-04-30
**Status:** MVP - Free trial system working, Toss integration pending
