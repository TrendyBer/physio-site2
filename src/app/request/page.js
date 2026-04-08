'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';

const SERVICES = ['Not sure/Need guidance','Musculoskeletal Physiotherapy','Post-Surgery Rehabilitation','Sports Injury Recovery','Elderly Care and Mobility Support','Back Pain','Neck and Shoulder Pain','Joint Pain','Sports Injury','Balance Issues','Reduced Mobility','Neurological Physiotherapy'];
const SERVICES_EL = ['Δεν είμαι σίγουρος/η - Χρειάζομαι καθοδήγηση','Μυοσκελετική Φυσιοθεραπεία','Μετεγχειρητική Αποκατάσταση','Αποκατάσταση Αθλητικών Τραυματισμών','Φροντίδα Ηλικιωμένων & Κινητικότητα','Πόνος στη Μέση','Πόνος στον Αυχένα & Ώμους','Πόνος στις Αρθρώσεις','Αθλητικός Τραυματισμός','Προβλήματα Ισορροπίας','Μειωμένη Κινητικότητα','Νευρολογική Φυσιοθεραπεία'];
const COUNTRIES = ['Greece','Cyprus','Germany','France','United Kingdom','Italy','Spain','United States','Australia','Other'];
const HOW_HEARD_EN = ['Google / Search engine','Social media','Friend or family referral','Doctor or healthcare professional','Online advertisement','Other'];
const HOW_HEARD_EL = ['Google / Μηχανή αναζήτησης','Social media','Φίλος ή συγγενής','Γιατρός ή επαγγελματίας υγείας','Διαδικτυακή διαφήμιση','Άλλο'];

const t = {
  el: {
    pageTitle: 'Κλείστε τη', pageTitleEm: 'Συνεδρία σας',
    pageDesc: 'Συμπληρώστε τη φόρμα και η ομάδα μας θα επικοινωνήσει μαζί σας εντός 24 ωρών.',
    preferenceNotice: 'Έχετε επιλέξει θεραπευτή:',
    steps: ['Στοιχεία Επικοινωνίας','Διεύθυνση','Υπηρεσία / Κατάσταση','Επιπλέον Πληροφορίες'],
    contacts: [
      { icon: '✉', value: 'email@example.com', href: 'mailto:email@example.com' },
      { icon: '📞', value: '+1 (555) 000-0000', href: 'tel:+15550000000' },
      { icon: '📍', value: '123 Sample St, Sydney NSW 2000 AU' },
    ],
    step1Title: 'Τα στοιχεία επικοινωνίας σας', step1Desc: 'Θα τα χρησιμοποιήσουμε για να επιβεβαιώσουμε τη συνεδρία σας',
    fullName: 'Ονοματεπώνυμο', fullNamePh: 'π.χ. Γιώργος Παπαδόπουλος',
    email: 'Email', emailPh: 'emailexample@gmail.com',
    phone: 'Αριθμός Τηλεφώνου', phonePh: 'π.χ. +30 69 1234 5678',
    step2Title: 'Η διεύθυνσή σας', step2Desc: 'Χρησιμοποιούμε την τοποθεσία σας για να σας αντιστοιχίσουμε με τον πλησιέστερο διαθέσιμο θεραπευτή',
    country: 'Χώρα', countryPh: 'Επιλέξτε χώρα',
    zip: 'Ταχυδρομικός Κώδικας', zipPh: 'π.χ. 10001',
    city: 'Πόλη', cityPh: 'π.χ. Αθήνα',
    street: 'Οδός', streetPh: 'Ξεκινήστε να πληκτρολογείτε...',
    step3Title: 'Οι ανάγκες φροντίδας σας', step3Desc: 'Τι είδος φροντίδας ή κατάστασης χρειάζεστε βοήθεια;',
    service: 'Επιλέξτε Υπηρεσία ή Κατάσταση', servicePh: 'Επιλέξτε...',
    description: 'Σύντομη Περιγραφή', descriptionPh: 'Οτιδήποτε πρέπει να γνωρίζουμε σχετικά με την κατάστασή σας',
    step4Title: 'Λίγες ακόμα λεπτομέρειες', step4Desc: 'Βοηθήστε μας να κατανοήσουμε πώς μας βρήκατε.',
    howHeard: 'Πώς μάθατε για εμάς;', howHeardPh: 'Επιλέξτε...',
    referred: 'Παραπεμφθήκατε από γιατρό ή επαγγελματία υγείας;',
    no: 'Όχι', yes: 'Ναι',
    doctorLabel: 'Όνομα Γιατρού ή Κλινική παραπομπής', doctorPh: 'π.χ. Δρ. Παπαδόπουλος',
    consent: 'Συμφωνώ ότι τα στοιχεία μου θα χρησιμοποιηθούν για την επεξεργασία αυτού του αιτήματος. Κατανοώ ότι αυτό είναι αίτημα, όχι επιβεβαιωμένη κράτηση.',
    next: 'Επόμενο', back: 'Πίσω', submit: 'Υποβολή',
    required: 'Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.',
    consentRequired: 'Παρακαλώ αποδεχτείτε τους όρους για να συνεχίσετε.',
    successTitle: 'Το Αίτημά σας Ελήφθη!',
    successDesc: 'Ευχαριστούμε! Θα επικοινωνήσουμε μαζί σας στο',
    successEnd: 'εντός 24 ωρών.',
    successBtn: 'Επιστροφή στην Αρχική',
  },
  en: {
    pageTitle: 'Request Your', pageTitleEm: 'Session',
    pageDesc: 'Complete the form below and our team will contact you within 24 hours.',
    preferenceNotice: 'You selected a preferred therapist:',
    steps: ['Contact Details','Address details','Service or condition','Additional information'],
    contacts: [
      { icon: '✉', value: 'email@example.com', href: 'mailto:email@example.com' },
      { icon: '📞', value: '+1 (555) 000-0000', href: 'tel:+15550000000' },
      { icon: '📍', value: '123 Sample St, Sydney NSW 2000 AU' },
    ],
    step1Title: 'Your contact details', step1Desc: "We'll use this to confirm your session and get in touch",
    fullName: 'Full Name', fullNamePh: 'e.g. John Smith',
    email: 'Your Email', emailPh: 'emailexample@gmail.com',
    phone: 'Your Phone Number', phonePh: 'e.g. +48 (123) 456 789',
    step2Title: 'Your address', step2Desc: 'We use your location to match you with the nearest available therapist',
    country: 'Country', countryPh: 'Select your country',
    zip: 'Zip/Postal Code', zipPh: 'e.g. 10001',
    city: 'City', cityPh: 'e.g. London',
    street: 'Street', streetPh: 'Start typing your street...',
    step3Title: 'Your care needs', step3Desc: 'What type of care or condition are you seeking help with?',
    service: 'Choose Service or Condition', servicePh: 'Select one...',
    description: 'Short Description', descriptionPh: 'Anything we should know about your condition or availability',
    step4Title: 'A few more details', step4Desc: 'Help us understand how you found us.',
    howHeard: 'How did you hear about us?', howHeardPh: 'Select one...',
    referred: 'Were you referred by a doctor or healthcare professional?',
    no: 'No', yes: 'Yes',
    doctorLabel: "Enter Doctor's name or Clinic you were referred by", doctorPh: 'e.g. Dr. Sarah Johnson',
    consent: 'I agree that my information will be used to process this request. I understand this is a request, not a confirmed booking.',
    next: 'Next', back: 'Back', submit: 'Submit',
    required: 'Please fill in all required fields.',
    consentRequired: 'Please accept the terms to continue.',
    successTitle: 'Request Received!',
    successDesc: "Thanks! We'll contact you at",
    successEnd: 'within 24 hours.',
    successBtn: 'Back to Home',
  },
};

export default function RequestPage() {
  const { lang } = useLang();
  const tx = t[lang];
  const searchParams = useSearchParams();
  const preferredTherapist = searchParams.get('therapist') || '';

  const services = lang === 'el' ? SERVICES_EL : SERVICES;
  const howHeardOptions = lang === 'el' ? HOW_HEARD_EL : HOW_HEARD_EN;

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    country: '', zip: '', city: '', street: '',
    service: '', description: '',
    howHeard: '', referred: 'no', doctorName: '', consent: false,
  });

  const completedSteps = {
    1: form.name ? [form.name, form.phone, form.email].filter(Boolean) : [],
    2: form.country ? [form.country, `${form.zip}${form.city ? ', ' + form.city : ''}`, form.street].filter(Boolean) : [],
    3: form.service ? [form.service].filter(Boolean) : [],
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateStep = () => {
    if (step === 1 && (!form.name || !form.email || !form.phone)) { setError(tx.required); return false; }
    if (step === 2 && (!form.country || !form.zip || !form.city)) { setError(tx.required); return false; }
    if (step === 3 && !form.service) { setError(tx.required); return false; }
    if (step === 4 && !form.consent) { setError(tx.consentRequired); return false; }
    setError(''); return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => { setError(''); setStep(s => s - 1); };
  const handleSubmit = () => {
    if (!validateStep()) return;
    const existing = JSON.parse(localStorage.getItem('sessionRequests') || '[]');
    localStorage.setItem('sessionRequests', JSON.stringify([...existing, {
      ...form,
      id: Date.now(),
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      preferredTherapist: preferredTherapist || null,
    }]));
    // Clear preference after submit
    localStorage.removeItem('preferredTherapist');
    setSubmitted(true);
  };

  const inputStyle = { width: '100%', padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#1a2e44', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#1a2e44', marginBottom: 6, display: 'block' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #2a6fdb !important; outline: none; }
        .req-layout { display: grid; grid-template-columns: 300px 1fr; gap: 0; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 40px rgba(0,0,0,0.08); }
        .req-sidebar { display: block; }
        .req-mobile-banner { display: none; }
        @media (max-width: 768px) {
          .req-layout { grid-template-columns: 1fr; border-radius: 16px; }
          .req-sidebar { display: none; }
          .req-mobile-banner { display: block; }
        }
        .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 480px) { .form-row2 { grid-template-columns: 1fr; } }
      `}</style>

      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '60px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 16 }}>
          {tx.pageTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.pageTitleEm}</em>
        </h1>
        <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 600, margin: '0 auto' }}>{tx.pageDesc}</p>

        {/* Therapist preference notice */}
        {preferredTherapist && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 20px', marginTop: 20, fontSize: 14, color: '#92400E', fontWeight: 600 }}>
            ⭐ {tx.preferenceNotice} <strong>{preferredTherapist}</strong>
          </div>
        )}
      </section>

      {/* Main */}
      <section style={{ background: 'linear-gradient(180deg, #e8f3ff 0%, #f8fafb 100%)', padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="req-layout">

            {/* Desktop Sidebar */}
            <div className="req-sidebar" style={{ background: '#eef4fb', padding: '40px 28px', display: 'flex', flexDirection: 'column' }}>
              {/* Therapist preference in sidebar */}
              {preferredTherapist && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 14px', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Προτίμηση</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>⭐ {preferredTherapist}</div>
                </div>
              )}
              <div style={{ flex: 1 }}>
                {tx.steps.map((stepLabel, i) => {
                  const stepNum = i + 1;
                  const isCompleted = step > stepNum;
                  const isActive = step === stepNum;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: isCompleted || isActive ? '#2a6fdb' : '#cbd5e1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                          {isCompleted ? '✓' : stepNum}
                        </div>
                        {i < tx.steps.length - 1 && (
                          <div style={{ width: 2, flex: 1, minHeight: 32, background: isCompleted ? '#2a6fdb' : '#cbd5e1', margin: '4px 0' }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: i < tx.steps.length - 1 ? 24 : 0, paddingTop: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#2a6fdb' : isCompleted ? '#1a2e44' : '#94a3b8' }}>{stepLabel}</div>
                        {isCompleted && completedSteps[stepNum] && (
                          <div style={{ marginTop: 4 }}>
                            {completedSteps[stepNum].map((line, j) => (
                              <div key={j} style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tx.contacts.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{c.icon}</span>
                    {c.href ? <a href={c.href} style={{ fontSize: 13, color: '#2a6fdb', textDecoration: 'none', fontWeight: 500 }}>{c.value}</a>
                    : <span style={{ fontSize: 13, color: '#475569' }}>{c.value}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Mobile banner */}
              <div className="req-mobile-banner" style={{ background: '#eef4fb', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Step {step} of {tx.steps.length}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2a6fdb' }}>{tx.steps[step - 1]}</div>
                {preferredTherapist && (
                  <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, marginTop: 6 }}>⭐ {tx.preferenceNotice} {preferredTherapist}</div>
                )}
              </div>

              <div style={{ padding: '40px 40px 32px', flex: 1 }}>

                {step === 1 && (
                  <div>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a2e44', marginBottom: 8, textAlign: 'center' }}>{tx.step1Title}</h2>
                    <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 32, textAlign: 'center' }}>{tx.step1Desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div><label style={labelStyle}>{tx.fullName}</label><input name="name" value={form.name} onChange={handleChange} style={inputStyle} placeholder={tx.fullNamePh} /></div>
                      <div><label style={labelStyle}>{tx.email}</label><input name="email" type="email" value={form.email} onChange={handleChange} style={inputStyle} placeholder={tx.emailPh} /></div>
                      <div><label style={labelStyle}>{tx.phone}</label><input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder={tx.phonePh} /></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a2e44', marginBottom: 8, textAlign: 'center' }}>{tx.step2Title}</h2>
                    <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 32, textAlign: 'center' }}>{tx.step2Desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div>
                        <label style={labelStyle}>{tx.country}</label>
                        <select name="country" value={form.country} onChange={handleChange} style={inputStyle}>
                          <option value="">{tx.countryPh}</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-row2">
                        <div><label style={labelStyle}>{tx.zip}</label><input name="zip" value={form.zip} onChange={handleChange} style={inputStyle} placeholder={tx.zipPh} /></div>
                        <div><label style={labelStyle}>{tx.city}</label><input name="city" value={form.city} onChange={handleChange} style={inputStyle} placeholder={tx.cityPh} /></div>
                      </div>
                      <div><label style={labelStyle}>{tx.street}</label><input name="street" value={form.street} onChange={handleChange} style={inputStyle} placeholder={tx.streetPh} /></div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a2e44', marginBottom: 8, textAlign: 'center' }}>{tx.step3Title}</h2>
                    <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 32, textAlign: 'center' }}>{tx.step3Desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div>
                        <label style={labelStyle}>{tx.service}</label>
                        <select name="service" value={form.service} onChange={handleChange} style={inputStyle}>
                          <option value="">{tx.servicePh}</option>
                          {services.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>{tx.description}</label>
                        <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical' }} placeholder={tx.descriptionPh} rows={5} maxLength={300} />
                        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{form.description.length}/300</div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a2e44', marginBottom: 8, textAlign: 'center' }}>{tx.step4Title}</h2>
                    <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 32, textAlign: 'center' }}>{tx.step4Desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div>
                        <label style={labelStyle}>{tx.howHeard}</label>
                        <select name="howHeard" value={form.howHeard} onChange={handleChange} style={inputStyle}>
                          <option value="">{tx.howHeardPh}</option>
                          {howHeardOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>{tx.referred}</label>
                        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" name="referred" value="no" checked={form.referred === 'no'} onChange={handleChange} style={{ width: 20, height: 20, accentColor: '#2a6fdb' }} />
                            <span style={{ fontSize: 14, color: '#1a2e44' }}>{tx.no}</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" name="referred" value="yes" checked={form.referred === 'yes'} onChange={handleChange} style={{ width: 20, height: 20, accentColor: '#2a6fdb' }} />
                            <span style={{ fontSize: 14, color: '#1a2e44' }}>{tx.yes}</span>
                          </label>
                        </div>
                      </div>
                      {form.referred === 'yes' && (
                        <div>
                          <label style={labelStyle}>{tx.doctorLabel}</label>
                          <input name="doctorName" value={form.doctorName} onChange={handleChange} style={inputStyle} placeholder={tx.doctorPh} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#2a6fdb', flexShrink: 0 }} />
                        <label style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, cursor: 'pointer' }}>{tx.consent}</label>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ marginTop: 20, background: '#FFE4E6', color: '#9F1239', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: step === 1 ? 'flex-end' : 'space-between', marginTop: 40 }}>
                  {step > 1 && (
                    <button onClick={handleBack} style={{ background: 'transparent', color: '#1a2e44', padding: '12px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {tx.back}
                    </button>
                  )}
                  {step < 4 ? (
                    <button onClick={handleNext} style={{ background: '#1a2e44', color: '#fff', padding: '12px 36px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {tx.next}
                    </button>
                  ) : (
                    <button onClick={handleSubmit} style={{ background: '#1a2e44', color: '#fff', padding: '12px 36px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {tx.submit}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setSubmitted(false)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: '#065F46' }}>✓</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a2e44', marginBottom: 16 }}>{tx.successTitle}</h3>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 28 }}>
              {tx.successDesc} <strong>{form.email}</strong> {tx.successEnd}
            </p>
            <a href="/" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 40px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              {tx.successBtn}
            </a>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}