'use client';
import { useState, useEffect } from 'react';

// Cookie Banner Component
// Εμφανίζεται μόνο αν δεν έχει γίνει επιλογή ακόμα (localStorage check)
// Επιλογές: Accept All / Reject Optional / Customize

const STORAGE_KEY = 'physiohome_cookie_consent';
const CONSENT_VERSION = '1.0'; // Αν αλλάξει η πολιτική, αύξησε το version για να ξαναζητηθεί η συγκατάθεση

const TEXT = {
  el: {
    title: '🍪 Χρησιμοποιούμε cookies',
    desc: 'Χρησιμοποιούμε cookies για τη λειτουργία της Πλατφόρμας και για τη βελτίωση της εμπειρίας σας. Μπορείτε να επιλέξετε ποια θα αποδεχτείτε.',
    learn: 'Μάθετε περισσότερα',
    acceptAll: 'Αποδοχή όλων',
    rejectOptional: 'Μόνο τα απαραίτητα',
    customize: 'Προσαρμογή',
    save: 'Αποθήκευση επιλογών',
    cancel: 'Άκυρο',
    customizeTitle: 'Προσαρμογή Cookies',
    customizeDesc: 'Επιλέξτε ποια cookies θέλετε να αποδεχτείτε:',
    cats: {
      necessary: { title: 'Αυστηρώς Απαραίτητα', desc: 'Απαραίτητα για τη λειτουργία της πλατφόρμας. Δεν μπορούν να απενεργοποιηθούν.', required: 'Πάντα ενεργά' },
      functional: { title: 'Λειτουργικά', desc: 'Απομνημόνευση γλώσσας και προτιμήσεων UI.' },
      analytics: { title: 'Αναλυτικά', desc: 'Μας βοηθούν να βελτιώσουμε την Πλατφόρμα. (Δεν ενεργά αυτή τη στιγμή)' },
      marketing: { title: 'Marketing', desc: 'Για στοχευμένη διαφήμιση. (Δεν ενεργά αυτή τη στιγμή)' },
    },
  },
  en: {
    title: '🍪 We use cookies',
    desc: 'We use cookies to operate the Platform and improve your experience. You can choose which ones to accept.',
    learn: 'Learn more',
    acceptAll: 'Accept all',
    rejectOptional: 'Only necessary',
    customize: 'Customize',
    save: 'Save preferences',
    cancel: 'Cancel',
    customizeTitle: 'Customize Cookies',
    customizeDesc: 'Choose which cookies you want to accept:',
    cats: {
      necessary: { title: 'Strictly Necessary', desc: 'Required for platform operation. Cannot be disabled.', required: 'Always active' },
      functional: { title: 'Functional', desc: 'Remember language and UI preferences.' },
      analytics: { title: 'Analytics', desc: 'Help us improve the Platform. (Not currently active)' },
      marketing: { title: 'Marketing', desc: 'For targeted advertising. (Not currently active)' },
    },
  },
};

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [lang, setLang] = useState('el');
  const [prefs, setPrefs] = useState({
    necessary: true, // πάντα true, δεν μπορεί να αλλάξει
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Detect γλώσσα από browser
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language?.startsWith('el') ? 'el' : 'en';
      setLang(browserLang);

      // Check αν υπάρχει saved consent
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setShow(true);
          return;
        }
        const parsed = JSON.parse(saved);
        if (parsed.version !== CONSENT_VERSION) {
          setShow(true);
        }
      } catch (_) {
        setShow(true);
      }
    }
  }, []);

  function saveConsent(consentPrefs) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: CONSENT_VERSION,
          timestamp: new Date().toISOString(),
          prefs: consentPrefs,
        })
      );
    } catch (_) {}
    setShow(false);
    setShowCustomize(false);
  }

  function acceptAll() {
    saveConsent({ necessary: true, functional: true, analytics: true, marketing: true });
  }

  function rejectOptional() {
    saveConsent({ necessary: true, functional: false, analytics: false, marketing: false });
  }

  function saveCustom() {
    saveConsent(prefs);
  }

  if (!show) return null;

  const t = TEXT[lang];

  return (
    <>
      {/* Banner */}
      {!showCustomize && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            borderTop: '3px solid #2a6fdb',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            zIndex: 9999,
            padding: '20px 24px',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 400px', minWidth: 280 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>
                {t.title}
              </h3>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {t.desc}{' '}
                <a
                  href="/cookies"
                  style={{ color: '#2a6fdb', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {t.learn}
                </a>
                .
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setShowCustomize(true)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.customize}
              </button>
              <button
                onClick={rejectOptional}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.rejectOptional}
              </button>
              <button
                onClick={acceptAll}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1a2e44',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showCustomize && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomize(false);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              maxWidth: 540,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>
              {t.customizeTitle}
            </h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>
              {t.customizeDesc}
            </p>

            {/* Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* Necessary - always on */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D', marginBottom: 4 }}>
                    {t.cats.necessary.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    {t.cats.necessary.desc}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#15803D',
                    background: '#fff',
                    padding: '4px 10px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.cats.necessary.required}
                </span>
              </div>

              {/* Functional */}
              <CategoryToggle
                title={t.cats.functional.title}
                desc={t.cats.functional.desc}
                checked={prefs.functional}
                onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
              />

              {/* Analytics */}
              <CategoryToggle
                title={t.cats.analytics.title}
                desc={t.cats.analytics.desc}
                checked={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />

              {/* Marketing */}
              <CategoryToggle
                title={t.cats.marketing.title}
                desc={t.cats.marketing.desc}
                checked={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCustomize(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 30,
                  border: '1px solid #e2e8f0',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.cancel}
              </button>
              <button
                onClick={saveCustom}
                style={{
                  padding: '10px 24px',
                  borderRadius: 30,
                  border: 'none',
                  background: '#1a2e44',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryToggle({ title, desc, checked, onChange }) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <label
        style={{
          position: 'relative',
          display: 'inline-block',
          width: 44,
          height: 24,
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: checked ? '#2a6fdb' : '#cbd5e1',
            borderRadius: 24,
            transition: '0.2s',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            background: '#fff',
            borderRadius: '50%',
            transition: '0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </label>
    </div>
  );
}