// src/app/auth/register/page.jsx
// Εγγραφή — SERVER. Διαβάζει το ?role= (therapist / patient) και στέλνει
// έτοιμη τη φόρμα στο σωστό βήμα. Η λειτουργία ζει στο RegisterClient.jsx.

import RegisterClient from './RegisterClient';

export default async function RegisterPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const role = sp.role === 'therapist' || sp.role === 'patient' ? sp.role : null;
  return <RegisterClient preRole={role} />;
}
