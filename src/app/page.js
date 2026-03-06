'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      router.replace('/dashboard');
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleLogin = (user) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    router.push('/dashboard');
  };

  // Don't show login until we've checked localStorage
  if (!checked) return null;

  return <Login onLogin={handleLogin} />;
}
