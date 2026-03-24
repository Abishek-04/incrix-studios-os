'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import { getCurrentUser } from '@/services/api';

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // If user is already logged in (has valid cookie), redirect to dashboard
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setChecked(true);
      }
    });
  }, [router]);

  const handleLogin = () => {
    router.push('/dashboard');
  };

  // Don't show login until we've checked
  if (!checked) return null;

  return <Login onLogin={handleLogin} />;
}
