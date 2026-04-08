'use client';
import { useState } from 'react';

export default function Faq() {
  const [open, setOpen] = useState(null);

  const faqs = [
    { q: 'Χρειάζομαι παραπομπή για να κλείσω συνεδρία;', a: 'Στις περισσότερες περιπτώσεις, μπορείτε να ζητήσετε συνεδρία φυσιοθεραπείας απευθείας χωρίς παραπομπή. Εάν η κατάστασή σας απαιτεί πρόσθετες ιατρικές πληροφορίες, η ομάδα μας θα σας ενημερώσει κατά τη διαδικασία κράτησης.' },
    { q: 'Τι γίνεται κατά την πρώτη επίσκεψη στο σπίτι;', a: 'Ο θεραπευτής σας θα αξιολογήσει την κατάστασή σας, θα συζητήσει τους στόχους σας και θα δημιουργήσει ένα εξατομικευμένο πλάνο θεραπείας. Η πρώτη συνεδρία συνήθως διαρκεί 60-90 λεπτά.' },
    { q: 'Ποιες παθήσεις αντιμετωπίζετε;', a: 'Αντιμετωπίζουμε ένα ευρύ φάσμα παθήσεων: μυοσκελετικά προβλήματα, νευρολογικές παθήσεις, μετεγχειρητική αποκατάσταση, αθλητικούς τραυματισμούς, πόνο στη μέση και αυχένα, και πολλά άλλα.' },
    { q: 'Πώς κλείνω ραντεβού;', a: 'Μπορείτε να κλείσετε ραντεβού συμπληρώνοντας τη φόρμα επικοινωνίας παρακάτω, καλώντας μας ή στέλνοντάς μας email. Η ομάδα μας θα επικοινωνήσει μαζί σας εντός 24 ωρών.' },
    { q: 'Φέρνετε τον απαραίτητο εξοπλισμό;', a: 'Ναι! Οι θεραπευτές μας έρχονται εξοπλισμένοι με ό,τι χρειάζεται για τη συνεδρία σας. Δεν χρειάζεται να αγοράσετε ή να έχετε κανένα ειδικό εξοπλισμό.' },
  ];

  return (
    <section style={{ padding: '80px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
            Συχνές <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>Ερωτήσεις</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>Δεν βρίσκετε αυτό που ψάχνετε; Είμαστε εδώ να βοηθήσουμε.</p>
          <a href="#contact" style={{ display: 'inline-block', marginTop: 16, background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>Επικοινωνήστε μαζί μας</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 760 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ border: '1px solid #dce6f0', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', background: open === i ? '#e8f1fd' : 'none', border: 'none', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: open === i ? '#2a6fdb' : '#1a2e44' }}>
                {faq.q}
                <span style={{ fontSize: 20, flexShrink: 0, marginLeft: 12, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform .3s', display: 'inline-block' }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 20px', fontSize: 14, color: '#6b7a8d', lineHeight: 1.7 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
