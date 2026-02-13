'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';

export default function HomePage() {
  const router = useRouter();

  const handleLogin = (user) => {
    // Store in localStorage
    localStorage.setItem('auth_user', JSON.stringify(user));
    // Redirect to dashboard
    router.push('/dashboard');
  };

  return <Login onLogin={handleLogin} />;
}
