import { supabase } from '@/lib/supabase';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import RatingDisplay from '../../../components/RatingDisplay';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, Lightbulb, ClipboardList, Stethoscope, Search, MapPin, Euro, Link2, Check, ArrowRight } from 'lucide-react';

export const revalidate = 3600; // ISR: 1 ώρα

// Generate static paths για όλα τα active conditions
export async function generateStaticParams() {
  const { data } = await supabase
    .from('conditions')
    .select('slug')
    .eq('is_active', true);

  return (data || []).map((c) => ({ slug: c.slug }));
}

// SEO metadata generator
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = sp?.lang === 'en' ? 'en' : 'el';

  const { data: condition } = await supabase
    .from('conditions')
    .select('name_el, name_en, description_el, description_en, content_el, content_en')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!condition) return { title: 'Not found' };

  const name = lang === 'el' ? condition.name_el : condition.name_en;
  const desc = lang === 'el' ? condition.description_el : condition.description_en;

  const titles = {
    el: `${name} - Φυσιοθεραπεία στο Σπίτι | PhysioHome`,
    en: `${name} - Home Physiotherapy | PhysioHome`,
  };

  const descriptions = {
    el: `${desc} Βρείτε εξειδικευμένους φυσιοθεραπευτές στην Αθήνα για ${name.toLowerCase()}.`,
    en: `${desc} Find specialized physiotherapists in Athens for ${name.toLowerCase()}.`,
  };

  const langSuffix = lang === 'en' ? '?lang=en' : '';

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `/find-help/${slug}${langSuffix}`,
      languages: {
        'el-GR': `/find-help/${slug}`,
        'en-US': `/find-help/${slug}?lang=en`,
      },
    },
    openGraph: {
      title: titles[lang],
      description: descriptions[lang],
      type: 'article',
      locale: lang === 'el' ? 'el_GR' : 'en_US',
    },
  };
}

const TX = {
  el: {
    backToHelp: '← Όλες οι παθήσεις',
    aboutTitle: 'Πώς βοηθά η φυσιοθεραπεία',
    symptomsTitle: 'Συχνά συμπτώματα',
    therapistsTitle: 'Εξειδικευμένοι Θεραπευτές',
    therapistsDesc: 'Φυσιοθεραπευτές που εξειδικεύονται σε αυτή την πάθηση ή έχουν σχετική ειδικότητα.',
    noTherapists: 'Δεν υπάρχουν διαθέσιμοι θεραπευτές προς το παρόν για αυτή την πάθηση. Συμπληρώστε αίτημα και θα σας βρούμε.',
    matchedExact: 'Εξειδικεύεται',
    matchedSpecialty: 'Σχετική ειδικότητα',
    seeAll: 'Δες όλους τους θεραπευτές',
    bookSession: 'Κλείσε Ραντεβού',
    viewProfile: 'Προφίλ',
    ctaTitle: 'Έτοιμος να ξεκινήσεις;',
    ctaDesc: 'Συμπλήρωσε ένα γρήγορο αίτημα και θα σου βρούμε τον κατάλληλο θεραπευτή.',
    ctaBtn: 'Νέο Αίτημα',
    relatedTitle: 'Σχετικές παθήσεις',
    switchLang: 'EN',
    perSession: 'συνεδρία',
  },
  en: {
    backToHelp: '← All conditions',
    aboutTitle: 'How physiotherapy helps',
    symptomsTitle: 'Common symptoms',
    therapistsTitle: 'Specialized Therapists',
    therapistsDesc: 'Physiotherapists who specialize in this condition or have a related specialty.',
    noTherapists: 'No therapists currently available for this condition. Submit a request and we will find you one.',
    matchedExact: 'Specialized',
    matchedSpecialty: 'Related specialty',
    seeAll: 'See all therapists',
    bookSession: 'Book Session',
    viewProfile: 'Profile',
    ctaTitle: 'Ready to get started?',
    ctaDesc: 'Submit a quick request and we will match you with the right therapist.',
    ctaBtn: 'New Request',
    relatedTitle: 'Related conditions',
    switchLang: 'ΕΛ',
    perSession: 'session',
  },
};

export default async function ConditionDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = sp?.lang === 'en' ? 'en' : 'el';
  const tx = TX[lang];

  // Fetch condition
  const { data: condition } = await supabase
    .from('conditions')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!condition) notFound();

  // Fetch category
  const { data: category } = await supabase
    .from('condition_categories')
    .select('*')
    .eq('id', condition.category_id)
    .single();

  // Fetch related conditions
  const { data: relatedConditions } = await supabase
    .from('conditions')
    .select('id, slug, name_el, name_en')
    .eq('category_id', condition.category_id)
    .eq('is_active', true)
    .neq('id', condition.id)
    .limit(5);

  // Fetch therapists
  const { data: therapists } = await supabase
    .from('therapist_profiles')
    .select('*')
    .eq('is_approved', true);

  const { data: tcData } = await supabase
    .from('therapist_conditions')
    .select('therapist_id, condition_id')
    .eq('condition_id', condition.id);

  const exactTaggedIds = new Set((tcData || []).map((t) => t.therapist_id));
  const relatedSpecs = (condition.related_specialties || []).map((s) => (s || '').toLowerCase());

  // Match logic
  const matchedTherapists = (therapists || [])
    .map((t) => {
      const isExact = exactTaggedIds.has(t.id);
      const therapistSpec = (t.specialty || '').toLowerCase();
      const isSpecMatch = relatedSpecs.some((rs) => therapistSpec.includes(rs) || rs.includes(therapistSpec));
      return { ...t, matchType: isExact ? 'exact' : isSpecMatch ? 'specialty' : null };
    })
    .filter((t) => t.matchType !== null)
    .sort((a, b) => {
      if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
      if (b.matchType === 'exact' && a.matchType !== 'exact') return 1;
      return 0;
    })
    .slice(0, 6);

  // Reviews counts
  const therapistIds = matchedTherapists.map((t) => t.id);
  let ratingsMap = {};
  if (therapistIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('therapist_id, rating')
      .eq('is_published', true)
      .in('therapist_id', therapistIds);
    (reviews || []).forEach((rv) => {
      if (!ratingsMap[rv.therapist_id]) ratingsMap[rv.therapist_id] = { sum: 0, count: 0 };
      ratingsMap[rv.therapist_id].sum += rv.rating;
      ratingsMap[rv.therapist_id].count += 1;
    });
  }

  const enrichedTherapists = matchedTherapists.map((t) => {
    const stats = ratingsMap[t.id];
    return {
      ...t,
      avg_rating: stats ? stats.sum / stats.count : 0,
      review_count: stats ? stats.count : 0,
    };
  });

  const conditionName = lang === 'el' ? condition.name_el : condition.name_en;
  const description = lang === 'el' ? condition.description_el : condition.description_en;
  const content = lang === 'el' ? condition.content_el : condition.content_en;
  const symptoms = lang === 'el' ? condition.symptoms_el : condition.symptoms_en;
  const categoryName = category ? (lang === 'el' ? category.name_el : category.name_en) : '';

  const langSuffix = lang === 'en' ? '?lang=en' : '';

  // JSON-LD structured data για SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    name: conditionName,
    description: description,
    associatedAnatomy: categoryName,
    possibleTreatment: {
      '@type': 'MedicalTherapy',
      name: lang === 'el' ? 'Φυσιοθεραπεία στο σπίτι' : 'Home physiotherapy',
    },
    signOrSymptom: (symptoms || []).map((s) => ({
      '@type': 'MedicalSignOrSymptom',
      name: s,
    })),
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <style>{`
        .th-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 900px) { .th-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .th-grid { grid-template-columns: 1fr; } }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        @media (max-width: 900px) { .related-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .related-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Hero με category color */}
      <section
        style={{
          background: `linear-gradient(135deg, ${category?.bg || '#EFF6FF'} 0%, #fff 100%)`,
          padding: '32px 24px 48px',
          borderBottom: `1px solid ${category?.color || '#e2e8f0'}22`,
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Breadcrumbs + lang switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
            <Link
              href={`/find-help${langSuffix}`}
              style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
            >
              {tx.backToHelp}
            </Link>
            <Link
              href={lang === 'el' ? `/find-help/${slug}?lang=en` : `/find-help/${slug}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#fff', border: '1px solid #BFDBFE', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#1D4ED8', textDecoration: 'none' }}
            >
              <Globe size={12} />
              {tx.switchLang}
            </Link>
          </div>

          {category && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                border: `1px solid ${category.color}33`,
                color: category.color || '#1D4ED8',
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {/* Colored vertical bar instead of emoji */}
              <span style={{ width: 3, height: 12, borderRadius: 2, background: category.color || '#2a6fdb', display: 'inline-block' }} />
              <span>{categoryName}</span>
            </div>
          )}

          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 48px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 16 }}>
            {conditionName}
          </h1>
          {description && (
            <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.6, maxWidth: 720 }}>{description}</p>
          )}
        </div>
      </section>

      {/* Educational content + Symptoms */}
      <section style={{ background: '#fff', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
          {/* Content */}
          {content && (
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(22px, 3vw, 30px)', color: '#1a2e44', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Lightbulb size={26} color="#2a6fdb" strokeWidth={2} />
                {tx.aboutTitle}
              </h2>
              <p style={{ fontSize: 16, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{content}</p>
            </div>
          )}

          {/* Symptoms */}
          {symptoms && symptoms.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '24px 28px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#92400E', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={20} color="#92400E" strokeWidth={2} />
                {tx.symptomsTitle}
              </h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
                {symptoms.map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 15, color: '#78350F', lineHeight: 1.5 }}>
                    <span style={{ color: '#92400E', flexShrink: 0 }}>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Therapists */}
      <section style={{ background: '#f8fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a2e44', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <Stethoscope size={28} color="#2a6fdb" strokeWidth={2} />
              {tx.therapistsTitle}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7a8d', maxWidth: 580, margin: '0 auto' }}>
              {tx.therapistsDesc}
            </p>
          </div>

          {enrichedTherapists.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '40px 24px', background: '#fff', borderRadius: 16, border: '1px dashed #dce6f0' }}>
              <Search size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{tx.noTherapists}</p>
              <a
                href="/dashboard/patient/new-request"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a2e44', color: '#fff', padding: '11px 24px', borderRadius: 30, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                {tx.ctaBtn}
                <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <>
              <div className="th-grid">
                {enrichedTherapists.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      padding: 22,
                    }}
                  >
                    {/* Match badge */}
                    {t.matchType && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          marginBottom: 12,
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '.05em',
                          background: t.matchType === 'exact' ? '#DCFCE7' : '#EFF6FF',
                          color: t.matchType === 'exact' ? '#15803D' : '#1D4ED8',
                          border: `1px solid ${t.matchType === 'exact' ? '#86EFAC' : '#BFDBFE'}`,
                        }}
                      >
                        {t.matchType === 'exact' ? <Check size={10} strokeWidth={3} /> : <Stethoscope size={10} />}
                        {t.matchType === 'exact' ? tx.matchedExact : tx.matchedSpecialty}
                      </div>
                    )}

                    {t.photo_url ? (
                      <img
                        src={t.photo_url}
                        alt={t.name}
                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#2a6fdb',
                        }}
                      >
                        {t.name?.charAt(0)}
                      </div>
                    )}

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{t.specialty}</div>

                    <div style={{ marginBottom: 8 }}>
                      <RatingDisplay rating={t.avg_rating} count={t.review_count} lang={lang} variant="compact" size={12} />
                    </div>

                    {t.area && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} />
                        {t.area}
                      </div>
                    )}
                    {t.price_per_session && (
                      <div style={{ fontSize: 12, color: '#2a6fdb', fontWeight: 600, marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Euro size={12} strokeWidth={2.5} />
                        {t.price_per_session}€/{tx.perSession}
                      </div>
                    )}

                    <a
                      href={`/dashboard/patient/new-request?therapist=${encodeURIComponent(t.name)}&condition=${condition.slug}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: '#1a2e44',
                        color: '#fff',
                        padding: '9px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                        textAlign: 'center',
                      }}
                    >
                      {tx.bookSession}
                      <ArrowRight size={12} />
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <Link
                  href={`/therapists?condition=${condition.slug}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2a6fdb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                  {tx.seeAll}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Related Conditions */}
      {(relatedConditions || []).length > 0 && (
        <section style={{ background: '#fff', padding: '40px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 16, textAlign: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
              <Link2 size={18} color="#2a6fdb" strokeWidth={2} />
              {tx.relatedTitle}
            </h3>
            <div className="related-grid">
              {(relatedConditions || []).map((rc) => {
                const name = lang === 'el' ? rc.name_el : rc.name_en;
                return (
                  <Link
                    key={rc.id}
                    href={`/find-help/${rc.slug}${langSuffix}`}
                    style={{
                      padding: '12px 16px',
                      background: '#f8fafb',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#475569',
                      fontWeight: 600,
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    {name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section style={{ background: '#fff', padding: '60px 24px 80px' }}>
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1a2e44 0%, #2a6fdb 100%)',
            borderRadius: 20,
            padding: '40px 32px',
            color: '#fff',
          }}
        >
          <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 32px)', marginBottom: 10, color: '#fff' }}>
            {tx.ctaTitle}
          </h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 24, lineHeight: 1.6 }}>{tx.ctaDesc}</p>
          <a
            href={`/dashboard/patient/new-request?condition=${condition.slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              color: '#1a2e44',
              padding: '14px 36px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {tx.ctaBtn}
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}