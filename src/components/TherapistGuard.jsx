'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';

/**
 * TherapistGuard
 *
 * Ο θεραπευτής δεν είναι πελάτης — δεν ψάχνει θεραπευτές.
 * Όταν είναι συνδεδεμένος και ανοίξει οποιαδήποτε δημόσια σελίδα,
 * τον στέλνουμε στον πίνακά του.
 *
 * ΕΞΑΙΡΕΣΗ: το κουμπί «Site» στο dashboard βάζει ένα flag στο
 * sessionStorage. Όσο υπάρχει, μπορεί να περιηγηθεί ελεύθερα και
 * βλέπει μια μπάρα επιστροφής. Το flag σβήνει όταν κλείσει το tab.
 *
 * Ο ΑΣΘΕΝΗΣ δεν ανακατευθύνεται — πρέπει να μπορεί να ψάξει θεραπευτή.
 * Βλέπει όμως την ίδια μπάρα επιστροφής, για να ξέρει πάντα πώς
 * γυρίζει στον λογαριασμό του.
 */

export const VIEW_SITE_KEY = 'physiohome_view_site';

// Σελίδες που ΔΕΝ πιάνει ο guard
const EXEMPT_PREFIXES = [
  '/dashboard',
  '/auth',
  '/admin',
];

function isExempt(path) {
  return EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export default function TherapistGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [browsing, setBrowsing] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const r = localStorage.getItem('userRole');
    setRole(r);

    // Μη συνδεδεμένος, ή admin → τίποτα
    if (r !== 'therapist' && r !== 'patient') { setBrowsing(false); return; }

    // Σε dashboard/auth/admin δεν εμφανίζεται τίποτα
    if (isExempt(pathname)) { setBrowsing(false); return; }

    // ΑΣΘΕΝΗΣ: ελεύθερη περιήγηση, απλά με μπάρα επιστροφής
    if (r === 'patient') { setBrowsing(true); return; }

    // ΘΕΡΑΠΕΥΤΗΣ: μόνο αν πάτησε «Site»
    if (sessionStorage.getItem(VIEW_SITE_KEY) === '1') {
      setBrowsing(true);
      return;
    }

    // Αλλιώς πίσω στον πίνακά του
    router.replace('/dashboard/therapist');
  }, [pathname, router]);

  const dashboardPath = role === 'therapist' ? '/dashboard/therapist' : '/dashboard/patient';

  function backToDashboard() {
    sessionStorage.removeItem(VIEW_SITE_KEY);
    router.push(dashboardPath);
  }

  if (!browsing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        background: '#1a2e44',
        color: '#fff',
        borderRadius: 30,
        padding: '10px 12px 10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 8px 30px rgba(26,46,68,0.3)',
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, whiteSpace: 'nowrap' }}>
        <Eye size={14} color="rgba(255,255,255,0.7)" />
        {role === 'patient' ? 'Περιηγείστε στο site' : 'Προβολή site'}
      </span>

      <button
        onClick={backToDashboard}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: role === 'patient' ? '#15803d' : '#2a6fdb',
          border: 'none',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 30,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        <ArrowLeft size={14} />
        Το προφίλ μου
      </button>
    </div>
  );
}