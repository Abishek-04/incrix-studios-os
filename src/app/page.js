'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import { hasToken } from '@/services/api';

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hasToken()) {
      router.replace('/dashboard');
    } else {
      setChecked(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = () => {
    window.location.href = '/dashboard';
  };

  if (!checked) return null;

  return <Login onLogin={handleLogin} />;
}
