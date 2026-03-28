'use client';

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProfile } from '../services/profileService';

export function useProfile() {
  const { profile, setProfile, updatedFields } = useApp();

  useEffect(() => {
    if (!profile) {
      getProfile().then(setProfile).catch(console.error);
    }
  }, []);

  return { profile, updatedFields };
}
