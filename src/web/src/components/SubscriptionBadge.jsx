import React from 'react';

export default function SubscriptionBadge({ subscriptionStatus, daysLeft }) {
  if (!subscriptionStatus) return null;

  const getBackgroundColor = () => {
    if (subscriptionStatus === 'free_trial') {
      return 'rgba(102, 126, 234, 0.1)'; // Blue-ish
    } else if (subscriptionStatus === 'paid') {
      return 'rgba(102, 200, 126, 0.1)'; // Green-ish
    }
    return 'rgba(200, 126, 102, 0.1)'; // Red-ish
  };

  const getTextColor = () => {
    if (subscriptionStatus === 'free_trial') {
      return '#667eea';
    } else if (subscriptionStatus === 'paid') {
      return '#66c87e';
    }
    return '#c87e66';
  };

  const getBorderColor = () => {
    if (subscriptionStatus === 'free_trial') {
      return 'rgba(102, 126, 234, 0.3)';
    } else if (subscriptionStatus === 'paid') {
      return 'rgba(102, 200, 126, 0.3)';
    }
    return 'rgba(200, 126, 102, 0.3)';
  };

  return (
    <div style={{
      display: 'inline-block',
      padding: '6px 12px',
      background: getBackgroundColor(),
      border: `1px solid ${getBorderColor()}`,
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      color: getTextColor(),
      whiteSpace: 'nowrap'
    }}>
      {subscriptionStatus === 'free_trial' && daysLeft !== undefined && (
        <>✨ Trial: {daysLeft} days left</>
      )}
      {subscriptionStatus === 'paid' && (
        <>✓ Paid Plan Active</>
      )}
      {subscriptionStatus === 'expired' && (
        <>⚠ Subscription Expired</>
      )}
    </div>
  );
}
