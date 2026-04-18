'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = 'cms_platform_settings';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULTS = {
  email: 'info@physiohome.gr',
  phone: '+30 210 123 4567',
  address: 'Αθήνα & Αττική',
};

export default function Contact() {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) { setSettings(prev => ({ ...prev, ...value })); return; }
        }
      } catch (_) {}

      const { data } = await supabase.from('platform_settings').select('key, value');
      if (data) {
        const s = {};
        data.forEach(row => { s[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...s }));
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: s, timestamp: Date.now() })); } catch (_) {}
      }
    }
    fetchSettings();
  }, []);

  return (
    <>
      <style>{`
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .contact-form { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; padding: 32px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; gap: 32px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id="contact" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="contact-grid">
            {/* Left Info */}
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                Επικοινωνήστε <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>μαζί μας</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 32 }}>
                Συμπληρώστε τη φόρμα και θα επικοινωνήσουμε μαζί σας εντός 24 ωρών για να κλείσουμε τη συνεδρία σας.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>Email</div>
                    <a href={`mailto:${settings.email}`} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{settings.email}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📞</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>Τηλέφωνο</div>
                    <a href={`tel:${settings.phone}`} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{settings.phone}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>Περιοχή Εξυπηρέτησης</div>
                    <span style={{ fontWeight: 500, color: '#1a2e44' }}>{settings.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="contact-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row">
                  {['Όνομα', 'Επώνυμο'].map((label) => (
                    <div key={label}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type="text" style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                {[{ label: 'Email', type: 'email' }, { label: 'Τηλέφωνο', type: 'tel' }].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Υπηρεσία</label>
                  <select style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                    <option>Επιλέξτε Υπηρεσία</option>
                    <option>Μυοσκελετική Φυσιοθεραπεία</option>
                    <option>Μετεγχειρητική Αποκατάσταση</option>
                    <option>Αποκατάσταση Αθλητικών Τραυματισμών</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Μήνυμα</label>
                  <textarea rows={4} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <button style={{ width: '100%', background: '#1a2e44', color: '#fff', padding: 14, borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => alert('Ευχαριστούμε! Θα επικοινωνήσουμε μαζί σας εντός 24 ωρών.')}>
                  Αποστολή Αιτήματος →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}