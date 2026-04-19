'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function Avatar({ name, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color }) {
  return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>;
}

function Stars({ rating, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onClick={() => onChange && onChange(i)}
          style={{ fontSize: 24, color: i <= rating ? '#F59E0B' : '#E2E8F0', cursor: onChange ? 'pointer' : 'default' }}>★</span>
      ))}
    </div>
  );
}

const STATUS = {
  pending:   { label: 'Εκκρεμές',      bg: '#FEF3C7', color: '#92400E' },
  accepted:  { label: 'Αποδεκτό',      bg: '#D1FAE5', color: '#065F46' },
  rejected:  { label: 'Απορρίφθηκε',   bg: '#FFE4E6', color: '#9F1239' },
  completed: { label: 'Ολοκληρώθηκε',  bg: '#EDE9FE', color: '#5B21B6' },
  cancelled: { label: 'Ακυρώθηκε',     bg: '#F1F5F9', color: '#64748B' },
};

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    setUser(user);

    const [{ data: prof }, { data: appts }] = await Promise.all([
      supabase.from('patient_profiles').select('*').eq('id', user.id).single(),
      supabase.from('appointments').select('*, reviews(id, rating, comment)').eq('patient_id', user.id).order('created_at', { ascending: false }),
    ]);

    setProfile(prof || {});
    setAppointments(appts || []);
    setLoading(false);
  }

  async function submitReview() {
    if (!reviewForm.rating) return;
    setSubmittingReview(true);
    await supabase.from('reviews').insert([{
      appointment_id: reviewModal.id,
      patient_id: user.id,
      therapist_id: reviewModal.therapist_id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      status: 'pending',
    }]);
    setReviewModal(null);
    setReviewForm({ rating: 0, comment: '' });
    await init();
    setSubmittingReview(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const pending   = appointments.filter(a => a.status === 'pending').length;
  const accepted  = appointments.filter(a => a.status === 'accepted').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>Φόρτωση...</div>
    </div>
  );

  const TABS = [
    { id: 'appointments', label: '📋 Τα Αιτήματά μου' },
    { id: 'profile', label: '👤 Προφίλ' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 8, background: '#f1f5f9', padding: '2px 10px', borderRadius: 999 }}>Ασθενής</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={profile?.name || user?.email} size={36} />
          <button onClick={signOut} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Αποσύνδεση</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Καλώς ήρθατε, {profile?.name?.split(' ')[0] || 'Ασθενής'}! 👋</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Διαχειριστείτε τα αιτήματά σας και τα ραντεβού σας.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Εκκρεμή', value: pending, bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' },
            { label: 'Αποδεκτά', value: accepted, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
            { label: 'Ολοκληρωμένα', value: completed, bg: '#D1FAE5', border: '#BBF7D0', text: '#15803D' },
          ].map(c => (
            <div key={c.label} style={{ flex: 1, minWidth: 140, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: c.text }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* New appointment CTA */}
        <div style={{ background: '#1a2e44', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Θέλετε νέο ραντεβού;</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Κλείστε ραντεβού με έναν από τους θεραπευτές μας</div>
          </div>
          <a href="/request" style={{ background: '#fff', color: '#1a2e44', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            Νέο Αίτημα →
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#0F172A' : '#64748B', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14 }}>
                Δεν έχετε κάνει αίτημα ακόμα.<br />
                <a href="/request" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>Κλείστε το πρώτο σας ραντεβού →</a>
              </div>
            ) : appointments.map(a => {
              const st = STATUS[a.status] || STATUS.pending;
              const hasReview = a.reviews && a.reviews.length > 0;
              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{a.service || 'Φυσιοθεραπεία'}</span>
                        <Badge label={st.label} bg={st.bg} color={st.color} />
                        <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>{new Date(a.created_at).toLocaleDateString('el-GR')}</span>
                      </div>
                      {a.patient_address && <div style={{ fontSize: 13, color: '#2a6fdb', marginBottom: 4 }}>📍 {a.patient_address}, {a.patient_city}</div>}
                      {a.notes && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #cbd5e1', marginTop: 6 }}>{a.notes}</div>}

                      {/* Review section */}
                      {a.status === 'completed' && (
                        <div style={{ marginTop: 12 }}>
                          {hasReview ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Stars rating={a.reviews[0].rating} />
                              <span style={{ fontSize: 13, color: '#64748B' }}>Η αξιολόγησή σας</span>
                            </div>
                          ) : (
                            <button onClick={() => setReviewModal(a)}
                              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              ⭐ Αξιολόγηση θεραπευτή
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar name={profile?.name || user?.email} size={64} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{profile?.name || '—'}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{user?.email}</div>
              </div>
            </div>
            {[
              ['Email', user?.email],
              ['Τηλέφωνο', profile?.phone],
              ['Μέλος από', user?.created_at ? new Date(user.created_at).toLocaleDateString('el-GR') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <span style={{ color: '#64748B' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Αξιολόγηση Συνεδρίας</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>{reviewModal.service}</p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Βαθμολογία *</div>
              <Stars rating={reviewForm.rating} onChange={r => setReviewForm(p => ({ ...p, rating: r }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Σχόλιο (προαιρετικό)</div>
              <textarea rows={4} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Πώς ήταν η εμπειρία σας;"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#0F172A' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={submitReview} disabled={!reviewForm.rating || submittingReview}
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: 'none', background: reviewForm.rating ? '#1a2e44' : '#e2e8f0', color: reviewForm.rating ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600, cursor: reviewForm.rating ? 'pointer' : 'not-allowed' }}>
                {submittingReview ? 'Αποστολή...' : 'Υποβολή Αξιολόγησης'}
              </button>
              <button onClick={() => setReviewModal(null)}
                style={{ padding: '12px 20px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Άκυρο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}