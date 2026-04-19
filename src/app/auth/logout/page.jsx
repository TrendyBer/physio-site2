'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      localStorage.removeItem('userRole');
      await supabase.auth.signOut();
      window.location.replace('/');
    }
    logout();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>Αποσύνδεση...</div>
    </div>
  );
}