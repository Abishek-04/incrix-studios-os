'use client';

import { useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(registration) {
  if (!VAPID_PUBLIC_KEY) return;
  if (!('PushManager' in window)) return;

  // Get current user from localStorage
  const stored = localStorage.getItem('auth_user');
  if (!stored) return;

  const user = JSON.parse(stored);
  if (!user?.id) return;

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        subscription: subscription.toJSON()
      })
    });
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Wait for the service worker to be ready before subscribing
        const ready = await navigator.serviceWorker.ready;
        subscribeToPush(ready);
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerWorker();
    } else {
      window.addEventListener('load', registerWorker, { once: true });
    }
  }, []);

  return null;
}
