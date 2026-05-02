'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Cookie, Shield, BarChart3, Megaphone, Settings as SettingsIcon, Mail } from 'lucide-react';

const COOKIE_PREFS_KEY = 'physiohome_cookie_prefs';

export default function CookiesPage() {
  const [currentPrefs, setCurrentPrefs] = useState(null);
  const [lastUpdated] = useState('1 Μαΐου 2026'); // Update when policy changes

  useEffect(() => {
    // Load current preferences
    try {
      const stored = localStorage.getItem(COOKIE_PREFS_KEY);
      if (stored) {
        setCurrentPrefs(JSON.parse(stored));
      }
    } catch {}
  }, []);

  function reopenSettings() {
    // Clear stored prefs to trigger banner re-display
    localStorage.removeItem(COOKIE_PREFS_KEY);
    window.location.reload();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f6', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a2e44 0%, #2a6fdb 100%)', padding: '80px 24px 60px', color: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Cookie size={36} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 12, letterSpacing: '-.02em' }}>
            Πολιτική Cookies
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            Πώς και γιατί χρησιμοποιούμε cookies στο PhysioHome.
          </p>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            Τελευταία ενημέρωση: {lastUpdated}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>

        {/* Quick action */}
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <SettingsIcon size={20} color="#2a6fdb" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
              Διαχείριση των επιλογών σας
            </div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              Μπορείτε να αλλάξετε τις προτιμήσεις σας οποιαδήποτε στιγμή.
            </div>
          </div>
          <button
            onClick={reopenSettings}
            style={{
              padding: '11px 22px',
              borderRadius: 30,
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
            Αλλαγή Ρυθμίσεων
          </button>
        </div>

        {/* Sections */}
        <Section title="Τι είναι τα cookies;">
          <p>
            Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας (υπολογιστή,
            tablet, κινητό) όταν επισκέπτεστε ένα website. Επιτρέπουν στο website να θυμάται
            ενέργειες και προτιμήσεις σας (όπως login, γλώσσα, μέγεθος γραμματοσειράς) ώστε να μη
            χρειάζεται να τις εισάγετε ξανά κάθε φορά.
          </p>
        </Section>

        <Section title="Πώς χρησιμοποιούμε τα cookies στο PhysioHome;">
          <p>Χρησιμοποιούμε cookies για 3 βασικούς σκοπούς:</p>
          <ul style={{ marginTop: 12, paddingLeft: 24 }}>
            <li style={{ marginBottom: 8 }}><strong>Λειτουργικότητα:</strong> Διατήρηση session login, προτιμήσεις γλώσσας, ασφάλεια.</li>
            <li style={{ marginBottom: 8 }}><strong>Analytics:</strong> Κατανόηση πώς χρησιμοποιείται το site για να το βελτιώσουμε.</li>
            <li style={{ marginBottom: 8 }}><strong>Marketing:</strong> Εξατομικευμένο περιεχόμενο και διαφημίσεις (όταν τα ενεργοποιήσετε).</li>
          </ul>
        </Section>

        {/* Categories */}
        <Section title="Κατηγορίες Cookies">
          <CookieCategoryCard
            Icon={Shield}
            color="#15803D"
            bg="#F0FDF4"
            border="#BBF7D0"
            title="Απαραίτητα Cookies"
            alwaysOn
            description="Είναι απαραίτητα για τη βασική λειτουργία του site. Χωρίς αυτά, δεν μπορείτε να συνδεθείτε ή να κάνετε κρατήσεις."
            examples={[
              { name: 'sb-access-token', purpose: 'Authentication με Supabase', duration: 'Session' },
              { name: 'sb-refresh-token', purpose: 'Διατήρηση login session', duration: '7 μέρες' },
              { name: 'physiohome_cookie_prefs', purpose: 'Αποθήκευση των επιλογών σας για cookies', duration: '1 χρόνος' },
            ]}
          />

          <CookieCategoryCard
            Icon={BarChart3}
            color="#1D4ED8"
            bg="#EFF6FF"
            border="#BFDBFE"
            title="Analytics Cookies"
            description="Μας βοηθούν να καταλάβουμε πώς χρησιμοποιείτε το site (πχ ποιες σελίδες επισκέπτεστε, πόσο χρόνο μένετε, από πού μας βρήκατε). Όλα τα δεδομένα είναι ανώνυμα."
            examples={[
              { name: '(προαιρετικά)', purpose: 'Δεν τρέχουμε ακόμα analytics tools', duration: '—' },
            ]}
          />

          <CookieCategoryCard
            Icon={Megaphone}
            color="#9333EA"
            bg="#FAF5FF"
            border="#E9D5FF"
            title="Marketing Cookies"
            description="Επιτρέπουν εξατομικευμένο περιεχόμενο και διαφημίσεις βασισμένες στα ενδιαφέροντά σας (πχ remarketing, social media tracking)."
            examples={[
              { name: '(προαιρετικά)', purpose: 'Δεν τρέχουμε ακόμα marketing tools', duration: '—' },
            ]}
          />
        </Section>

        <Section title="Πώς μπορείτε να ελέγξετε τα cookies;">
          <p>Μπορείτε να ελέγξετε τα cookies με 3 τρόπους:</p>
          <ol style={{ marginTop: 12, paddingLeft: 24 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Στο PhysioHome:</strong> Πατήστε "Αλλαγή Ρυθμίσεων" παραπάνω για να
              αλλάξετε τις προτιμήσεις σας.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Στον browser σας:</strong> Όλοι οι σύγχρονοι browsers (Chrome, Firefox,
              Safari, Edge) σας επιτρέπουν να διαχειρίζεστε τα cookies στις ρυθμίσεις τους.
              Μπορείτε να τα διαγράψετε ή να τα μπλοκάρετε.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Με DNT (Do Not Track):</strong> Σεβόμαστε το Do Not Track signal αν είναι
              ενεργό στον browser σας.
            </li>
          </ol>
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 16,
            fontSize: 13,
            color: '#92400E',
          }}>
            <strong>Σημαντικό:</strong> Αν απενεργοποιήσετε τα απαραίτητα cookies, ορισμένες
            λειτουργίες του site (όπως login, κρατήσεις) δεν θα δουλεύουν.
          </div>
        </Section>

        <Section title="Αλλαγές στην Πολιτική Cookies">
          <p>
            Μπορεί να ενημερώνουμε αυτή την Πολιτική περιοδικά για να αντικατοπτρίζει αλλαγές στις
            πρακτικές μας ή για άλλους λειτουργικούς, νομικούς ή κανονιστικούς λόγους. Σας
            ενθαρρύνουμε να την επισκέπτεστε τακτικά.
          </p>
        </Section>

        <Section title="Επικοινωνία">
          <p>
            Αν έχετε ερωτήσεις σχετικά με την Πολιτική Cookies ή τη χρήση cookies στο PhysioHome,
            μπορείτε να επικοινωνήσετε μαζί μας:
          </p>
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            marginTop: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Mail size={16} color="#2a6fdb" />
            <a href="mailto:info@physiohome.gr" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>
              info@physiohome.gr
            </a>
          </div>
        </Section>

        {/* Related links */}
        <div style={{
          marginTop: 48,
          padding: '20px 24px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>Σχετικά κείμενα:</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: '#2a6fdb', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Πολιτική Απορρήτου
            </a>
            <a href="/terms" style={{ color: '#2a6fdb', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Όροι Χρήσης
            </a>
            <a href="/contact" style={{ color: '#2a6fdb', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Επικοινωνία
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 22,
        fontWeight: 700,
        color: '#0F172A',
        fontFamily: 'Georgia, serif',
        marginBottom: 12,
        letterSpacing: '-.01em',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  );
}

function CookieCategoryCard({ Icon, color, bg, border, title, description, examples, alwaysOn }) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: '20px 22px',
      marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={22} color={color} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
            {title}
            {alwaysOn && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: color,
                marginLeft: 10,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                background: '#fff',
                padding: '2px 10px',
                borderRadius: 999,
              }}>
                Πάντα ενεργά
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            {description}
          </div>
        </div>
      </div>

      {examples && examples.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 10,
          padding: '12px 16px',
          marginTop: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
            Παραδείγματα cookies
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Όνομα</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Σκοπός</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Διάρκεια</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((ex, i) => (
                <tr key={i} style={{ borderBottom: i < examples.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '8px', color: '#0F172A', fontFamily: 'monospace', fontSize: 11 }}>{ex.name}</td>
                  <td style={{ padding: '8px', color: '#475569' }}>{ex.purpose}</td>
                  <td style={{ padding: '8px', color: '#475569', whiteSpace: 'nowrap' }}>{ex.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}