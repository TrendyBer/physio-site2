'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { Globe, X } from 'lucide-react';

/*
  LanguageSwitcher — στυλ Uber
  ----------------------------
  Κλειστό:  μονόχρωμο globe icon + label (EL-GR / EN-US), χωρίς πλαίσιο, χωρίς χρώμα.
  Ανοιχτό:  panel που κατεβαίνει ΚΑΤΩ από το navbar — το navbar παραμένει ορατό.

  Props:
    color        — χρώμα κειμένου/εικονιδίου (default: #6b7a8d)
    hoverColor   — χρώμα στο hover (default: #1a2e44)
    size         — μέγεθος γραμματοσειράς label (default: 13)
    navHeight    — ύψος του navbar σε px (default: 68) — πρέπει να ταιριάζει με το Navbar
*/

const LOCALE_LABEL = { el: 'EL-GR', en: 'EN-US' };

const OPTION_LABELS = {
  el: [
    { code: 'en', label: 'Αγγλικά, English' },
    { code: 'el', label: 'Ελληνικά, Ελληνικά' },
  ],
  en: [
    { code: 'en', label: 'English, English' },
    { code: 'el', label: 'Greek, Ελληνικά' },
  ],
};

const TITLE = {
  el: 'Επιλέξτε τη γλώσσα που προτιμάτε',
  en: 'Choose your preferred language',
};

export default function LanguageSwitcher({
  color = '#6b7a8d',
  hoverColor = '#1a2e44',
  size = 13,
  navHeight = 68,
}) {
  const { lang, setLanguage } = useLang();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);

  // Κλείσιμο με Escape + κλείδωμα scroll όσο είναι ανοιχτό
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function choose(code) {
    setLanguage(code);
    setOpen(false);
  }

  const options = OPTION_LABELS[lang] || OPTION_LABELS.el;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-expanded={open}
        aria-label={TITLE[lang]}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          padding: '6px 4px',
          fontSize: size,
          fontWeight: 500,
          fontFamily: 'inherit',
          color: hover || open ? hoverColor : color,
          cursor: 'pointer',
          transition: 'color .15s',
          whiteSpace: 'nowrap',
        }}
      >
        <Globe size={16} strokeWidth={2} color="currentColor" />
        {LOCALE_LABEL[lang]}
      </button>

      {open && (
        <>
          <style>{`
            @keyframes langPanelDrop {
              from { opacity: 0; transform: translateY(-12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .lang-panel {
              animation: langPanelDrop .18s ease-out;
            }
            .lang-panel-inner {
              max-width: 1200px;
              margin: 0 auto;
              padding: 56px 24px 72px;
              position: relative;
            }
            .lang-panel-options {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 20px 32px;
              max-width: 900px;
            }
            @media (max-width: 640px) {
              .lang-panel-options { grid-template-columns: 1fr; }
              .lang-panel-inner { padding: 32px 20px 48px; }
            }
          `}</style>

          {/* Σκίαση κάτω από το panel — κλείνει με κλικ */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              top: navHeight,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 90,
              background: 'rgba(15,29,44,0.35)',
            }}
          />

          {/* Panel — ξεκινάει ΑΚΡΙΒΩΣ κάτω από το navbar */}
          <div
            className="lang-panel"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: navHeight,
              left: 0,
              right: 0,
              maxHeight: `calc(100vh - ${navHeight}px)`,
              overflowY: 'auto',
              zIndex: 95,
              background: '#fff',
              boxShadow: '0 12px 32px rgba(15,29,44,0.16)',
            }}
          >
            <div className="lang-panel-inner">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={lang === 'el' ? 'Κλείσιμο' : 'Close'}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 24,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#1a2e44',
                  padding: 8,
                  lineHeight: 0,
                }}
              >
                <X size={26} strokeWidth={2.5} />
              </button>

              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(22px, 3vw, 34px)',
                  fontWeight: 700,
                  color: '#1a2e44',
                  margin: '0 0 40px',
                  maxWidth: 760,
                  lineHeight: 1.25,
                }}
              >
                {TITLE[lang]}
              </h2>

              <div className="lang-panel-options">
                {options.map((opt) => {
                  const active = opt.code === lang;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => choose(opt.code)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px 0',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        fontSize: 16,
                        fontWeight: active ? 700 : 500,
                        color: '#1a2e44',
                        cursor: 'pointer',
                        textDecoration: active ? 'underline' : 'none',
                        textUnderlineOffset: 4,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#2a6fdb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#1a2e44'; }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}