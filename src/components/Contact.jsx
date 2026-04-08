'use client';

export default function Contact() {
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
                {[
                  { icon: '✉', label: 'Email', value: 'info@physiohome.gr', href: 'mailto:info@physiohome.gr' },
                  { icon: '📞', label: 'Τηλέφωνο', value: '+30 210 123 4567', href: 'tel:+302101234567' },
                  { icon: '📍', label: 'Περιοχή Εξυπηρέτησης', value: 'Αθήνα & Αττική' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>{item.label}</div>
                      {item.href
                        ? <a href={item.href} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{item.value}</a>
                        : <span style={{ fontWeight: 500, color: '#1a2e44' }}>{item.value}</span>
                      }
                    </div>
                  </div>
                ))}
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
                {[
                  { label: 'Email', type: 'email' },
                  { label: 'Τηλέφωνο', type: 'tel' },
                ].map((field) => (
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
