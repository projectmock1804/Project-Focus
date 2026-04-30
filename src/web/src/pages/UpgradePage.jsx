import React, { useState, useEffect } from 'react';

export default function UpgradePage({ subscriptionInfo, onLogout }) {
  const { status, daysLeft, expiresAt } = subscriptionInfo;
  const isTrialExpired = status === 'expired';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#0E0E0C',
      color: '#F2F0EB',
      fontFamily: 'Inter, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        {isTrialExpired ? (
          <>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#F2F0EB'
            }}>
              Trial Expired
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(242,240,235,0.7)',
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              Your 14-day free trial has ended. To continue using Project Focus, please upgrade to a paid plan.
            </p>
          </>
        ) : (
          <>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#F2F0EB'
            }}>
              Free Trial Active
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(242,240,235,0.7)',
              marginBottom: '10px'
            }}>
              You have <span style={{ fontSize: '20px', fontWeight: '600', color: '#F2F0EB' }}>{daysLeft}</span> days remaining
            </p>
            <p style={{
              fontSize: '14px',
              color: 'rgba(242,240,235,0.5)',
              marginBottom: '30px'
            }}>
              Trial ends on {new Date(expiresAt).toLocaleDateString()}
            </p>
          </>
        )}

        <div style={{
          display: 'flex',
          gap: '15px',
          flexDirection: 'column',
          marginBottom: '20px'
        }}>
          {isTrialExpired && (
            <button
              onClick={() => {
                // TODO: Integrate Toss payment API here
                alert('Toss payment integration coming soon. For now, please contact support.');
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#F2F0EB',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Upgrade Now
            </button>
          )}

          <button
            onClick={onLogout}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: 'rgba(242,240,235,0.7)',
              border: '1px solid rgba(242,240,235,0.2)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(242,240,235,0.5)';
              e.target.style.color = '#F2F0EB';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(242,240,235,0.2)';
              e.target.style.color = 'rgba(242,240,235,0.7)';
            }}
          >
            Logout
          </button>
        </div>

        {!isTrialExpired && (
          <p style={{
            fontSize: '13px',
            color: 'rgba(242,240,235,0.5)',
            marginTop: '20px'
          }}>
            You can access all features during your trial period.
          </p>
        )}
      </div>
    </div>
  );
}
