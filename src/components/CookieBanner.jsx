'use client';
import { useState, useEffect } from 'react';
import { Cookie, X, Check, Shield, BarChart3, Megaphone } from 'lucide-react';

const COOKIE_PREFS_KEY = 'physiohome_cookie_prefs';
const COOKIE_PREFS_VERSION = '1.0';

// Default preferences
const DEFAULT_PREFS = {
  necessary: true,    // always true, can't be disabled
  analytics: false,
  marketing: false,
  version: COOKIE_PREFS_VERSION,
  timestamp: null,
};

// Helper: get current preferences from localStorage
export function getCookiePrefs() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(COOKIE_PREFS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // If version mismatch, treat as not consented (force re-prompt)
    if (parsed.version !== COOKIE_PREFS_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Helper: check if user has consented to specific category
export function hasCookieConsent(category) {
  const prefs = getCookiePrefs();
  if (!prefs) return false;
  return prefs[category] === true;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS });

  useEffect(() => {
    // Check if user has already made a choice
    const stored = getCookiePrefs();
    if (!stored) {
      // First time visitor — show banner
      setIsVisible(true);
    }
  }, []);

  function savePrefs(newPrefs) {
    const toSave = {
      ...newPrefs,
      necessary: true, // always true
      version: COOKIE_PREFS_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(toSave));
    setIsVisible(false);
    setShowSettings(false);

    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('cookie-prefs-changed', { detail: toSave }));
  }

  function acceptAll() {
    savePrefs({ necessary: true, analytics: true, marketing: true });
  }

  function acceptNecessaryOnly() {
    savePrefs({ necessary: true, analytics: false, marketing: false });
  }

  function saveCustom() {
    savePrefs(prefs);
  }

  function openSettings() {
    setShowSettings(true);
  }

  function togglePref(key) {
    if (key === 'necessary') return; // can't toggle necessary
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  if (!isVisible && !showSettings) return null;

  return (
    <>
      {/* MAIN BANNER */}
      {isVisible && !showSettings && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          padding: '20px 24px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Cookie size={24} color="#2a6fdb" strokeWidth={2.2} />
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                Χρησιμοποιούμε cookies
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σας και να αναλύσουμε την
                χρήση του site.{' '}
                <a href="/cookies" style={{ color: '#2a6fdb', textDecoration: 'underline', fontWeight: 600 }}>
                  Διαβάστε την Πολιτική Cookies
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={acceptNecessaryOnly}
                style={{
                  padding: '10px 18px',
                  borderRadius: 30,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Μόνο Απαραίτητα
              </button>
              <button
                onClick={openSettings}
                style={{
                  padding: '10px 18px',
                  borderRadius: 30,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Ρυθμίσεις
              </button>
              <button
                onClick={acceptAll}
                style={{
                  padding: '10px 22px',
                  borderRadius: 30,
                  border: 'none',
                  background: '#1a2e44',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                Αποδοχή Όλων
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 24,
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={e => { if (e.target === e.currentTarget) { setShowSettings(false); if (!getCookiePrefs()) setIsVisible(true); } }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 28px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Cookie size={22} color="#2a6fdb" />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Ρυθμίσεις Cookies
                </h2>
              </div>
              <button
                onClick={() => { setShowSettings(false); if (!getCookiePrefs()) setIsVisible(true); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 28px' }}>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                Επιλέξτε ποιά cookies επιτρέπετε. Τα απαραίτητα cookies είναι πάντα ενεργά για
                τη σωστή λειτουργία του site.
              </p>

              {/* NECESSARY (always on) */}
              <CookieCategory
                Icon={Shield}
                title="Απαραίτητα"
                description="Login, security, βασικές λειτουργίες του site (πχ shopping cart, session). Δεν μπορούν να απενεργοποιηθούν."
                checked={true}
                disabled={true}
                color="#15803D"
                bg="#F0FDF4"
                border="#BBF7D0"
              />

              {/* ANALYTICS */}
              <CookieCategory
                Icon={BarChart3}
                title="Analytics"
                description="Μας βοηθούν να καταλάβουμε πώς χρησιμοποιείτε το site (πχ ποιες σελίδες επισκέπτεστε) ώστε να το βελτιώσουμε. Δεν συλλέγουμε προσωπικά δεδομένα."
                checked={prefs.analytics}
                disabled={false}
                onChange={() => togglePref('analytics')}
                color="#1D4ED8"
                bg="#EFF6FF"
                border="#BFDBFE"
              />

              {/* MARKETING */}
              <CookieCategory
                Icon={Megaphone}
                title="Marketing"
                description="Επιτρέπουν εξατομικευμένο περιεχόμενο και διαφημίσεις βασισμένες στα ενδιαφέροντά σας."
                checked={prefs.marketing}
                disabled={false}
                onChange={() => togglePref('marketing')}
                color="#9333EA"
                bg="#FAF5FF"
                border="#E9D5FF"
              />

              <div style={{ marginTop: 16, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                Για περισσότερες πληροφορίες, διαβάστε την{' '}
                <a href="/cookies" style={{ color: '#2a6fdb', textDecoration: 'underline', fontWeight: 600 }}>
                  Πολιτική Cookies
                </a>{' '}
                και την{' '}
                <a href="/privacy" style={{ color: '#2a6fdb', textDecoration: 'underline', fontWeight: 600 }}>
                  Πολιτική Απορρήτου
                </a>.
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={acceptNecessaryOnly}
                style={{
                  padding: '10px 18px',
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
                Μόνο Απαραίτητα
              </button>
              <button
                onClick={saveCustom}
                style={{
                  padding: '10px 22px',
                  borderRadius: 30,
                  border: 'none',
                  background: '#1a2e44',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                Αποθήκευση Επιλογών
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CookieCategory({ Icon, title, description, checked, disabled, onChange, color, bg, border }) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={color} strokeWidth={2.2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              {title}
              {disabled && (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D', marginLeft: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  · Πάντα ενεργά
                </span>
              )}
            </div>

            {/* Toggle switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: checked ? color : '#cbd5e1',
                borderRadius: 999,
                transition: 'background .2s',
                opacity: disabled ? 0.7 : 1,
              }} />
              <span style={{
                position: 'absolute',
                left: checked ? 20 : 2,
                top: 2,
                width: 18,
                height: 18,
                background: '#fff',
                borderRadius: '50%',
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </label>
          </div>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}