import { supabase } from '@/lib/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

export const revalidate = 3600; // ISR: regenerate κάθε 1 ώρα

// Detect γλώσσα από URL search param (?lang=en)
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang === 'en' ? 'en' : 'el';

  const meta = {
    el: {
      title: 'Βρες τη φυσιοθεραπεία που χρειάζεσαι | PhysioHome',
      description: 'Επιλέξτε την πάθησή σας και βρείτε τον κατάλληλο φυσιοθεραπευτή στην Αθήνα. Οσφυαλγία, αυχενικό, πόνος γόνατου, μετεγχειρητική αποκατάσταση και πολλά άλλα.',
    },
    en: {
      title: 'Find the physiotherapy you need | PhysioHome',
      description: 'Choose your condition and find the right physiotherapist in Athens. Back pain, neck pain, knee pain, post-surgery rehabilitation and many more.',
    },
  };

  return {
    title: meta[lang].title,
    description: meta[lang].description,
    alternates: {
      canonical: `/find-help${lang === 'en' ? '?lang=en' : ''}`,
      languages: {
        'el-GR': '/find-help',
        'en-US': '/find-help?lang=en',
      },
    },
    openGraph: {
      title: meta[lang].title,
      description: meta[lang].description,
      type: 'website',
      locale: lang === 'el' ? 'el_GR' : 'en_US',
    },
  };
}

const TX = {
  el: {
    badge: 'Βρες τη βοήθεια που χρειάζεσαι',
    title1: 'Φυσιοθεραπεία',
    titleEm: 'Κατά Πάθηση',
    titleEnd: '',
    desc: 'Επιλέξτε την πάθησή σας και θα σας συνδέσουμε με εξειδικευμένους φυσιοθεραπευτές στην Αθήνα.',
    popularTitle: 'Δημοφιλείς Παθήσεις',
    allTitle: 'Όλες οι Παθήσεις ανά Κατηγορία',
    therapists: 'θεραπευτές',
    therapist: 'θεραπευτής',
    findTherapists: 'Βρες θεραπευτές →',
    notSure: 'Δεν είστε σίγουροι ποια πάθηση έχετε;',
    notSureDesc: 'Συμπληρώστε ένα αίτημα και θα σας προτείνουμε τους κατάλληλους θεραπευτές.',
    notSureBtn: 'Νέο Αίτημα →',
    switchLang: 'EN',
  },
  en: {
    badge: 'Find the help you need',
    title1: 'Physiotherapy',
    titleEm: 'By Condition',
    titleEnd: '',
    desc: 'Choose your condition and we will connect you with specialized physiotherapists in Athens.',
    popularTitle: 'Popular Conditions',
    allTitle: 'All Conditions by Category',
    therapists: 'therapists',
    therapist: 'therapist',
    findTherapists: 'Find therapists →',
    notSure: 'Not sure which condition you have?',
    notSureDesc: 'Submit a request and we will recommend the right therapists for you.',
    notSureBtn: 'New Request →',
    switchLang: 'ΕΛ',
  },
};

export default async function FindHelpPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang === 'en' ? 'en' : 'el';
  const tx = TX[lang];

  // Fetch categories + conditions + therapist counts
  const { data: categories } = await supabase
    .from('condition_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: conditions } = await supabase
    .from('conditions')
    .select('id, slug, name_el, name_en, description_el, description_en, category_id, is_popular, related_specialties, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // Count tagged therapists per condition
  const { data: tcData } = await supabase
    .from('therapist_conditions')
    .select('condition_id');

  const tagCountsByCondition = {};
  (tcData || []).forEach((tc) => {
    tagCountsByCondition[tc.condition_id] = (tagCountsByCondition[tc.condition_id] || 0) + 1;
  });

  // Fetch therapists για να μετρήσουμε και specialty matches
  const { data: therapists } = await supabase
    .from('therapist_profiles')
    .select('id, specialty')
    .eq('is_approved', true);

  // For each condition, compute total reach (exact tags + specialty matches, deduped)
  const reachByCondition = {};
  (conditions || []).forEach((c) => {
    const taggedIds = new Set();
    // Exact tags
    (tcData || []).forEach((tc) => {
      if (tc.condition_id === c.id) taggedIds.add(tc.therapist_id);
    });
    // Specialty matches
    const related = (c.related_specialties || []).map((s) => (s || '').toLowerCase());
    (therapists || []).forEach((t) => {
      const spec = (t.specialty || '').toLowerCase();
      if (related.some((rs) => spec.includes(rs) || rs.includes(spec))) {
        taggedIds.add(t.id);
      }
    });
    reachByCondition[c.id] = taggedIds.size;
  });

  const popularConditions = (conditions || []).filter((c) => c.is_popular);

  // Helper για link με γλώσσα
  const langSuffix = lang === 'en' ? '?lang=en' : '';
  const langSuffixAmp = lang === 'en' ? '&lang=en' : '';

  return (
    <>
      <Navbar />

      <style>{`
        .fh-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .fh-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .fh-grid { grid-template-columns: 1fr; } }
        .fh-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          transition: all .2s;
          text-decoration: none;
          display: block;
          color: inherit;
        }
        .fh-card:hover {
          border-color: #2a6fdb;
          box-shadow: 0 8px 24px rgba(26,46,68,0.10);
          transform: translateY(-2px);
        }
        .fh-popular-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 900px) { .fh-popular-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .fh-popular-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Lang switcher (top right of hero) */}
      <div style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px 0', textAlign: 'right' }}>
          <Link
            href={lang === 'el' ? '/find-help?lang=en' : '/find-help'}
            style={{ display: 'inline-block', padding: '6px 14px', background: '#fff', border: '1px solid #BFDBFE', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#1D4ED8', textDecoration: 'none' }}
          >
            🌐 {tx.switchLang}
          </Link>
        </div>

        {/* HERO */}
        <section style={{ padding: '40px 24px 60px', textAlign: 'center' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
              🎯 {tx.badge}
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px, 5vw, 56px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
              {tx.title1} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.titleEm}</em> {tx.titleEnd}
            </h1>
            <p style={{ fontSize: 17, color: '#6b7a8d', lineHeight: 1.6, margin: '0 auto', maxWidth: 580 }}>
              {tx.desc}
            </p>
          </div>
        </section>
      </div>

      {/* POPULAR CONDITIONS */}
      <section style={{ background: '#fff', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a2e44', marginBottom: 8, textAlign: 'center' }}>
            ⭐ {tx.popularTitle}
          </h2>
          <div style={{ width: 60, height: 3, background: '#2a6fdb', margin: '0 auto 32px' }} />

          <div className="fh-popular-grid">
            {popularConditions.map((c) => {
              const name = lang === 'el' ? c.name_el : c.name_en;
              const desc = lang === 'el' ? c.description_el : c.description_en;
              const reach = reachByCondition[c.id] || 0;
              return (
                <Link key={c.id} href={`/find-help/${c.slug}${langSuffix}`} className="fh-card">
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{name}</div>
                  {desc && (
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
                  )}
                  {reach > 0 && (
                    <div style={{ fontSize: 12, color: '#2a6fdb', fontWeight: 600 }}>
                      {reach} {reach === 1 ? tx.therapist : tx.therapists}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ALL CONDITIONS BY CATEGORY */}
      <section style={{ background: '#f8fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a2e44', marginBottom: 8, textAlign: 'center' }}>
            🏷️ {tx.allTitle}
          </h2>
          <div style={{ width: 60, height: 3, background: '#2a6fdb', margin: '0 auto 40px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {(categories || []).map((cat) => {
              const catConditions = (conditions || []).filter((c) => c.category_id === cat.id);
              if (catConditions.length === 0) return null;
              const catName = lang === 'el' ? cat.name_el : cat.name_en;
              return (
                <div key={cat.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16,
                      padding: '12px 18px',
                      background: cat.bg || '#EFF6FF',
                      border: `1px solid ${cat.color || '#BFDBFE'}33`,
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{cat.icon || '🏷️'}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: cat.color || '#1a2e44', margin: 0 }}>{catName}</h3>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: cat.color || '#64748b', fontWeight: 600 }}>
                      {catConditions.length}
                    </span>
                  </div>

                  <div className="fh-grid">
                    {catConditions.map((c) => {
                      const name = lang === 'el' ? c.name_el : c.name_en;
                      const desc = lang === 'el' ? c.description_el : c.description_en;
                      const reach = reachByCondition[c.id] || 0;
                      return (
                        <Link key={c.id} href={`/find-help/${c.slug}${langSuffix}`} className="fh-card">
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{name}</div>
                          {desc && (
                            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
                          )}
                          {reach > 0 && (
                            <div style={{ fontSize: 11, color: '#2a6fdb', fontWeight: 600 }}>
                              👥 {reach}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#fff', padding: '60px 24px' }}>
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f0f6ff, #e8f0fb)',
            border: '1px solid #dce6f0',
            borderRadius: 20,
            padding: '40px 32px',
          }}
        >
          <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(22px, 3vw, 28px)', color: '#1a2e44', marginBottom: 10 }}>
            {tx.notSure}
          </h3>
          <p style={{ fontSize: 15, color: '#6b7a8d', marginBottom: 24, lineHeight: 1.6 }}>{tx.notSureDesc}</p>
          <a
            href="/dashboard/patient/new-request"
            style={{
              display: 'inline-block',
              background: '#2a6fdb',
              color: '#fff',
              padding: '13px 32px',
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {tx.notSureBtn}
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}