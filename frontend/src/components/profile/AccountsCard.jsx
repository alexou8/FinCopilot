'use client';

import { Building2, CreditCard, Landmark, PiggyBank, TrendingUp } from 'lucide-react';
import { NeuCard } from '../shared/NeuCard';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

const ACCOUNT_ICON_MAP = {
  chequing: Building2,
  savings: PiggyBank,
  tfsa: TrendingUp,
  rrsp: Landmark,
};

export function AccountsCard({ accounts, updated }) {
  if (!accounts || accounts.length === 0) return null;

  const total = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <NeuCard updated={updated}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Accounts
          </span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
          {fmt(total)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {accounts.map(account => {
          const Icon = ACCOUNT_ICON_MAP[account.type] || CreditCard;

          return (
            <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  className="neu-raised-sm"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>
                  {account.label}
                </span>
                {account.apy && (
                  <span style={{ fontSize: '11px', color: 'var(--ink-subtle)' }}>
                    ({account.apy}%)
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                {fmt(account.balance)}
              </span>
            </div>
          );
        })}
      </div>
    </NeuCard>
  );
}
