'use client';

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProfile } from '../services/profileService';

export function useProfile() {
  const { profile, setProfile, updatedFields, authUser, isDemo } = useApp();

  useEffect(() => {
    if (isDemo || profile) return;
    const userId = authUser?.id ?? 'demo_user';
    getProfile(userId).then(setProfile).catch(console.error);
  }, [authUser?.id]);

  return { profile, updatedFields };
}
