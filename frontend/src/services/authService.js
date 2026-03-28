// Auth service — wraps Supabase auth with a mock fallback.
// Set USE_MOCK = false once Supabase credentials are configured in .env.local

import { supabase } from '../lib/supabase';

const USE_MOCK = !supabase;

// Mock demo user returned in mock mode
const MOCK_USER = {
  id: 'demo-user-001',
  email: 'alex.chen@laurier.ca',
  name: 'Alex Chen',
};

export async function signInWithEmail(email, password) {
  if (USE_MOCK) {
    await delay(800);
    // Accept any credentials in mock mode
    return { user: { ...MOCK_USER, email }, error: null };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, error };
}

export async function signUpWithEmail(email, password, name) {
  if (USE_MOCK) {
    await delay(1000);
    return { user: { ...MOCK_USER, email, name }, error: null };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  return { user: data?.user ?? null, error };
}

export async function signOut() {
  if (USE_MOCK) {
    await delay(300);
    return { error: null };
  }
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (USE_MOCK) return null; // Not logged in by default in mock mode
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updateUserName(name) {
  if (USE_MOCK) {
    await delay(400);
    return { error: null };
  }
  // TODO: supabase.auth.updateUser({ data: { name } })
  const { error } = await supabase.auth.updateUser({ data: { name } });
  return { error };
}

export async function updateUserEmail(email) {
  if (USE_MOCK) {
    await delay(400);
    return { error: null };
  }
  // TODO: supabase.auth.updateUser({ email })
  const { error } = await supabase.auth.updateUser({ email });
  return { error };
}

export async function sendPasswordReset(email) {
  if (USE_MOCK) {
    await delay(400);
    return { error: null };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error };
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
