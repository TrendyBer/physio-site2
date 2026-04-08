export default function Footer() {
  return (
    <>
      <style>{`
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; }
        .footer-legal { display: flex; gap: 24px; }
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>
      <footer style={{ background: '#0f1d2c', color: 'rgba(255,255,255,0.7)', padding: '60px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid">
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
                PhysioHome
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>Επαγγελματική, εξατομικευμένη φυσιοθεραπεία στην άνεση του σπιτιού σας στην Αθήνα & Αττική.</p>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>Μενού</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['#how', 'Πώς Λειτουργεί'], ['#services', 'Υπηρεσίες'], ['#therapists', 'Θεραπευτές'], ['#blog', 'Blog'], ['#contact', 'Επικοινωνία']].map(([href, label]) => (
                  <li key={href}><a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>Νομικά</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['#', 'Πολιτική Απορρήτου'], ['#', 'Όροι Χρήσης'], ['#', 'Πολιτική Cookies']].map(([href, label]) => (
                  <li key={label}><a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>Επικοινωνία</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '✉', value: 'info@physiohome.gr', href: 'mailto:info@physiohome.gr' },
                  { icon: '📞', value: '+30 210 123 4567', href: 'tel:+302101234567' },
                  { icon: '📍', value: 'Αθήνα & Αττική, Ελλάδα' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                    <span>{item.icon}</span>
                    {item.href
                      ? <a href={item.href} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{item.value}</a>
                      : <span>{item.value}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
            <div className="footer-bottom">
              <span style={{ fontSize: 13 }}>© 2026 PhysioHome. Με επιφύλαξη παντός δικαιώματος.</span>
              <div className="footer-legal">
                {[['#', 'Απόρρητο'], ['#', 'Όροι'], ['#', 'Cookies']].map(([href, label]) => (
                  <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
