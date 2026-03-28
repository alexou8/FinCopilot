'use client';

import { User } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { NeuProgressBar } from '../shared/NeuProgressBar';
import { IncomeCard } from './IncomeCard';
import { ExpensesCard } from './ExpensesCard';
import { DebtCard } from './DebtCard';
import { AccountsCard } from './AccountsCard';
import { GoalCard } from './GoalCard';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export function ProfileSidebar() {
  const { profile, updatedFields } = useProfile();

  if (!profile) {
    return (
      <div className="neu-raised-lg" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ width: '130px', height: '14px' }} />
          <div className="skeleton" style={{ width: '90px', height: '12px' }} />
        </div>
      </div>
    );
  }

  const surplus = profile.income.monthly - profile.expenses.monthly;

  return (
    <div className="neu-raised-lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div className="neu-raised" style={{ width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{profile.name}</h2>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '2px' }}>{profile.year} · {profile.school}</p>
          </div>
        </div>
        <NeuProgressBar value={profile.completionPercent} max={100} label="Profile complete" color="primary" />
      </div>

      {/* Surplus */}
      <div className="neu-inset-sm" style={{ margin: '16px 20px 0', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>Monthly surplus</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '18px', fontWeight: 700, color: surplus >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {surplus >= 0 ? '+' : ''}{fmt(surplus)}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <IncomeCard   income={profile.income}     updated={!!updatedFields.income}   />
        <ExpensesCard expenses={profile.expenses} updated={!!updatedFields.expenses} />
        <DebtCard     debt={profile.debt}         updated={!!updatedFields.debt}     />
        <AccountsCard accounts={profile.accounts} updated={!!updatedFields.accounts} />
        <GoalCard     goal={profile.goal}         updated={!!updatedFields.goal}     />
      </div>
    </div>
  );
}
