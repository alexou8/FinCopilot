'use client';

import { useState, useCallback } from 'react';
import { User, Mail, Lock, Plus, Trash2, Pencil, Check, X, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NeuButton } from '../shared/NeuButton';
import { NeuProgressBar } from '../shared/NeuProgressBar';

const FONT = 'DM Sans, sans-serif';
const MONO = 'JetBrains Mono, monospace';
const fmt  = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ title, onAdd, onEditAll, editMode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        {onAdd && !editMode && (
          <button onClick={onAdd} style={iconBtn} title={`Add ${title.toLowerCase()}`}>
            <Plus size={13} />
          </button>
        )}
        {onEditAll && (
          <button onClick={onEditAll} style={{ ...iconBtn, color: editMode ? 'var(--primary)' : '#94a3b8' }} title={editMode ? 'Done' : `Edit ${title.toLowerCase()}`}>
            {editMode ? <Check size={13} /> : <Pencil size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

const iconBtn = {
  border: 'none', background: 'transparent', cursor: 'pointer',
  color: '#94a3b8', padding: '4px', borderRadius: '6px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 0.15s',
};

function InlineField({ label, value, onChange, type = 'text', prefix }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {label && <label style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: FONT, fontWeight: 600 }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {prefix && <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: MONO }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="neu-input"
          style={{ padding: '6px 10px', fontSize: '13px', fontFamily: MONO, width: '100%' }}
        />
      </div>
    </div>
  );
}

// ─── Account tab ──────────────────────────────────────────────────────────────

function AccountTab({ profile, authUser }) {
  const { setProfile } = useApp();
  const [editName, setEditName]   = useState(false);
  const [nameVal, setNameVal]     = useState(profile?.name || '');
  const [editEmail, setEditEmail] = useState(false);
  const [emailVal, setEmailVal]   = useState(authUser?.email || 'alex.chen@laurier.ca');

  function saveName() {
    setProfile(prev => ({ ...prev, name: nameVal }));
    // TODO: authService.updateUserName(nameVal) → Supabase auth.updateUser
    setEditName(false);
  }

  function saveEmail() {
    // TODO: authService.updateUserEmail(emailVal) → Supabase auth.updateUser
    setEditEmail(false);
  }

  const initials = nameVal.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', paddingTop: '8px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '24px',
          background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontFamily: FONT, fontWeight: 700, color: '#fff',
          boxShadow: '6px 6px 16px rgba(0,102,102,0.25), -4px -4px 12px rgba(255,255,255,0.7)',
        }}>
          {initials}
        </div>
        {editName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '240px' }}>
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }}
              className="neu-input"
              style={{ padding: '8px 12px', fontSize: '14px', fontFamily: FONT, fontWeight: 600, textAlign: 'center', flex: 1 }}
            />
            <button onClick={saveName} style={{ ...iconBtn, color: 'var(--success)' }}><Check size={15} /></button>
            <button onClick={() => setEditName(false)} style={{ ...iconBtn, color: 'var(--danger)' }}><X size={15} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: '18px', color: 'var(--ink)' }}>{nameVal}</h2>
            <button onClick={() => setEditName(true)} style={iconBtn} title="Edit name"><Pencil size={13} /></button>
          </div>
        )}
        {profile && (
          <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: FONT }}>
            {profile.year} · {profile.school}
          </span>
        )}
      </div>

      {/* Account details */}
      <div className="neu-inset-sm" style={{ borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Email */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Mail size={13} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
          </div>
          {editEmail ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                autoFocus
                type="email"
                value={emailVal}
                onChange={e => setEmailVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEmail(); if (e.key === 'Escape') setEditEmail(false); }}
                className="neu-input"
                style={{ padding: '7px 12px', fontSize: '13px', fontFamily: FONT, flex: 1 }}
              />
              <button onClick={saveEmail} style={{ ...iconBtn, color: 'var(--success)' }}><Check size={14} /></button>
              <button onClick={() => setEditEmail(false)} style={{ ...iconBtn, color: 'var(--danger)' }}><X size={14} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: FONT }}>{emailVal}</span>
              <button onClick={() => setEditEmail(true)} style={iconBtn} title="Change email"><Pencil size={12} /></button>
            </div>
          )}
          <p style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: FONT, marginTop: '4px' }}>
            {/* TODO: Supabase auth.updateUser({ email }) — requires email confirmation */}
            Managed by Supabase auth
          </p>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Lock size={13} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</span>
          </div>
          <NeuButton size="sm" style={{ fontSize: '12px' }}>
            {/* TODO: authService.sendPasswordReset(email) → Supabase resetPasswordForEmail */}
            Send reset link
          </NeuButton>
        </div>
      </div>
    </div>
  );
}

// ─── Income section ───────────────────────────────────────────────────────────

function IncomeSection({ income, onChange }) {
  const [editing, setEditing] = useState(false);
  const [sources, setSources] = useState(income?.sources || []);

  function addSource() {
    setSources(prev => [...prev, { label: '', amount: 0, frequency: 'monthly' }]);
    setEditing(true);
  }
  function removeSource(i) { setSources(prev => prev.filter((_, idx) => idx !== i)); }
  function updateSource(i, field, val) {
    setSources(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: field === 'amount' ? Number(val) : val } : s));
  }
  function save() {
    const monthly = sources.reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.amount / 12), 0);
    onChange({ sources, monthly: Math.round(monthly) });
    setEditing(false);
  }

  const total = sources.reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.amount / 12), 0);

  return (
    <div>
      <SectionHeader title="Income" onAdd={addSource} onEditAll={() => editing ? save() : setEditing(true)} editMode={editing} />
      <div className="neu-inset-sm" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sources.map((src, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editing ? (
              <>
                <input value={src.label} onChange={e => updateSource(i, 'label', e.target.value)} placeholder="Source" className="neu-input" style={{ flex: 2, padding: '5px 8px', fontSize: '12px', fontFamily: FONT }} />
                <input type="number" value={src.amount} onChange={e => updateSource(i, 'amount', e.target.value)} className="neu-input" style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: MONO }} />
                <select value={src.frequency} onChange={e => updateSource(i, 'frequency', e.target.value)} className="neu-input" style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: FONT }}>
                  <option value="monthly">/ mo</option>
                  <option value="annually">/ yr</option>
                </select>
                <button onClick={() => removeSource(i)} style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={12} /></button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--ink)', fontFamily: FONT }}>{src.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--success)', fontFamily: MONO, fontWeight: 600 }}>+{fmt(src.amount)}</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: FONT }}>/mo</span>
              </>
            )}
          </div>
        ))}
        {sources.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--ink-subtle)', fontFamily: FONT, textAlign: 'center', padding: '8px 0' }}>
            No income sources — add one above
          </p>
        )}
        <div style={{ borderTop: '1px solid var(--surface-dark)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', fontFamily: FONT }}>Monthly total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', fontFamily: MONO }}>{fmt(Math.round(total))}</span>
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <NeuButton size="sm" onClick={() => { setSources(income?.sources || []); setEditing(false); }}>Cancel</NeuButton>
            <NeuButton size="sm" variant="primary" onClick={save}>Save</NeuButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Expenses section ─────────────────────────────────────────────────────────

function ExpensesSection({ expenses, onChange }) {
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState(expenses?.categories || []);

  const COLORS = ['#006666','#008080','#33a3a3','#66c2c2','#004d4d','#003333','#00a3a3','#339999'];

  function addCat() {
    const color = COLORS[categories.length % COLORS.length];
    setCategories(prev => [...prev, { label: '', amount: 0, color }]);
    setEditing(true);
  }
  function removeCat(i) { setCategories(prev => prev.filter((_, idx) => idx !== i)); }
  function updateCat(i, field, val) {
    setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: field === 'amount' ? Number(val) : val } : c));
  }
  function save() {
    const monthly = categories.reduce((sum, c) => sum + c.amount, 0);
    onChange({ categories, monthly });
    setEditing(false);
  }

  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div>
      <SectionHeader title="Expenses" onAdd={addCat} onEditAll={() => editing ? save() : setEditing(true)} editMode={editing} />
      <div className="neu-inset-sm" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            {editing ? (
              <>
                <input value={cat.label} onChange={e => updateCat(i, 'label', e.target.value)} placeholder="Category" className="neu-input" style={{ flex: 2, padding: '5px 8px', fontSize: '12px', fontFamily: FONT }} />
                <input type="number" value={cat.amount} onChange={e => updateCat(i, 'amount', e.target.value)} className="neu-input" style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: MONO }} />
                <button onClick={() => removeCat(i)} style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={12} /></button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--ink)', fontFamily: FONT }}>{cat.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: MONO, fontWeight: 600 }}>-{fmt(cat.amount)}</span>
              </>
            )}
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--surface-dark)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', fontFamily: FONT }}>Monthly total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger)', fontFamily: MONO }}>-{fmt(total)}</span>
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <NeuButton size="sm" onClick={() => { setCategories(expenses?.categories || []); setEditing(false); }}>Cancel</NeuButton>
            <NeuButton size="sm" variant="primary" onClick={save}>Save</NeuButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Debt section ─────────────────────────────────────────────────────────────

function DebtSection({ debt, onChange }) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(debt || []);

  function addItem() {
    setItems(prev => [...prev, { id: `debt-${Date.now()}`, label: '', balance: 0, interestRate: 0, minPayment: 0 }]);
    setEditing(true);
  }
  function removeItem(id) { setItems(prev => prev.filter(d => d.id !== id)); }
  function updateItem(id, field, val) {
    setItems(prev => prev.map(d => d.id === id ? { ...d, [field]: ['balance','interestRate','minPayment'].includes(field) ? Number(val) : val } : d));
  }
  function save() { onChange(items); setEditing(false); }

  return (
    <div>
      <SectionHeader title="Debt" onAdd={addItem} onEditAll={() => editing ? save() : setEditing(true)} editMode={editing} />
      <div className="neu-inset-sm" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(d => (
          <div key={d.id}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={d.label} onChange={e => updateItem(d.id, 'label', e.target.value)} placeholder="Loan / card name" className="neu-input" style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: FONT }} />
                  <button onClick={() => removeItem(d.id)} style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={12} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: FONT }}>Balance</label>
                    <input type="number" value={d.balance} onChange={e => updateItem(d.id, 'balance', e.target.value)} className="neu-input" style={{ width: '100%', padding: '5px 8px', fontSize: '12px', fontFamily: MONO }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: FONT }}>Rate %</label>
                    <input type="number" value={d.interestRate} onChange={e => updateItem(d.id, 'interestRate', e.target.value)} className="neu-input" style={{ width: '100%', padding: '5px 8px', fontSize: '12px', fontFamily: MONO }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: FONT }}>Min/mo</label>
                    <input type="number" value={d.minPayment} onChange={e => updateItem(d.id, 'minPayment', e.target.value)} className="neu-input" style={{ width: '100%', padding: '5px 8px', fontSize: '12px', fontFamily: MONO }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: FONT, fontWeight: 500 }}>{d.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: FONT }}>{d.interestRate}% · Min {fmt(d.minPayment)}/mo</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)', fontFamily: MONO }}>{fmt(d.balance)}</span>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--ink-subtle)', fontFamily: FONT, textAlign: 'center', padding: '8px 0' }}>No debts added yet</p>
        )}
        {editing && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <NeuButton size="sm" onClick={() => { setItems(debt || []); setEditing(false); }}>Cancel</NeuButton>
            <NeuButton size="sm" variant="primary" onClick={save}>Save</NeuButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Accounts section ─────────────────────────────────────────────────────────

function AccountsSection({ accounts, onChange }) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(accounts || []);

  function addItem() {
    setItems(prev => [...prev, { id: `acct-${Date.now()}`, label: '', balance: 0, type: 'chequing' }]);
    setEditing(true);
  }
  function removeItem(id) { setItems(prev => prev.filter(a => a.id !== id)); }
  function updateItem(id, field, val) {
    setItems(prev => prev.map(a => a.id === id ? { ...a, [field]: field === 'balance' ? Number(val) : val } : a));
  }
  function save() { onChange(items); setEditing(false); }

  const total = items.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div>
      <SectionHeader title="Accounts" onAdd={addItem} onEditAll={() => editing ? save() : setEditing(true)} editMode={editing} />
      <div className="neu-inset-sm" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editing ? (
              <>
                <input value={a.label} onChange={e => updateItem(a.id, 'label', e.target.value)} placeholder="Account name" className="neu-input" style={{ flex: 2, padding: '5px 8px', fontSize: '12px', fontFamily: FONT }} />
                <select value={a.type} onChange={e => updateItem(a.id, 'type', e.target.value)} className="neu-input" style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: FONT }}>
                  <option value="chequing">Chequing</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
                <input type="number" value={a.balance} onChange={e => updateItem(a.id, 'balance', e.target.value)} className="neu-input" style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: MONO }} />
                <button onClick={() => removeItem(a.id)} style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={12} /></button>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: FONT, fontWeight: 500 }}>{a.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: FONT, textTransform: 'capitalize' }}>{a.type}</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)', fontFamily: MONO }}>{fmt(a.balance)}</span>
              </>
            )}
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--surface-dark)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', fontFamily: FONT }}>Total balance</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', fontFamily: MONO }}>{fmt(total)}</span>
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <NeuButton size="sm" onClick={() => { setItems(accounts || []); setEditing(false); }}>Cancel</NeuButton>
            <NeuButton size="sm" variant="primary" onClick={save}>Save</NeuButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Finances tab ─────────────────────────────────────────────────────────────

function FinancesTab({ profile }) {
  const { setProfile } = useApp();

  const update = useCallback((section, data) => {
    setProfile(prev => ({ ...prev, [section]: data }));
    // TODO: Save to Supabase: supabase.from('financial_profiles').upsert({ user_id, [section]: data })
  }, [setProfile]);

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)', fontFamily: FONT }}>
      Complete onboarding in Chat to see your financial data here.
    </div>
  );

  const surplus = (profile.income?.monthly || 0) - (profile.expenses?.monthly || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Completion + surplus */}
      <div>
        <NeuProgressBar value={profile.completionPercent || 0} max={100} label="Profile complete" color="primary" />
      </div>
      <div className="neu-inset-sm" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={14} style={{ color: surplus >= 0 ? 'var(--success)' : 'var(--danger)' }} />
          <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: FONT }}>Monthly surplus</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 700, color: surplus >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {surplus >= 0 ? '+' : ''}{fmt(surplus)}
        </span>
      </div>

      <IncomeSection   income={profile.income}     onChange={data => update('income', data)} />
      <ExpensesSection expenses={profile.expenses}  onChange={data => update('expenses', data)} />
      <DebtSection     debt={profile.debt}          onChange={data => update('debt', data)} />
      <AccountsSection accounts={profile.accounts}  onChange={data => update('accounts', data)} />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ProfileSidebar() {
  const { profile, authUser } = useApp();
  const [activeTab, setActiveTab] = useState('finances'); // start on finances — more to see

  const tabStyle = (id) => ({
    flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', borderRadius: '10px',
    fontFamily: FONT, fontSize: '13px', fontWeight: activeTab === id ? 600 : 400,
    background: activeTab === id ? 'var(--surface)' : 'transparent',
    color: activeTab === id ? 'var(--primary)' : 'var(--ink-muted)',
    boxShadow: activeTab === id ? 'var(--shadow-out-sm)' : 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <div className="neu-raised-lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div className="neu-raised" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
              {profile?.name || authUser?.name || 'Your Profile'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: FONT, marginTop: '1px' }}>
              {/* TODO: show "Synced with Supabase" when connected */}
              {authUser ? 'Synced with Supabase' : 'Demo mode — log in to save'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="neu-inset-sm" style={{ display: 'flex', padding: '4px', borderRadius: '14px', gap: '2px' }}>
          <button style={tabStyle('account')} onClick={() => setActiveTab('account')}>Account</button>
          <button style={tabStyle('finances')} onClick={() => setActiveTab('finances')}>Finances</button>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {activeTab === 'account'
          ? <AccountTab profile={profile} authUser={authUser} />
          : <FinancesTab profile={profile} />
        }
      </div>
    </div>
  );
}
