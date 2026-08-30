// src/app/fysiotherapeia-sto-spiti/[slug]/page.js
// ═══════════════════════════════════════════════════════════════════
// SEO landing page περιοχής.
//
// Ίδια λογική με τη σελίδα πάθησης: server-rendered ώστε να τη διαβάζει
// η Google, με πραγματικούς θεραπευτές από τη βάση.
//
// Ο φραγμός εδώ είναι ΑΥΣΤΗΡΟΤΕΡΟΣ: χρειάζονται ΔΥΟ θεραπευτές αντί για
// έναν. Μια σελίδα «Φυσικοθεραπεία στο Χαλάνδρι» με έναν μόνο διαθέσιμο
// δεν δίνει επιλογή στον επισκέπτη — και η Google το αντιλαμβάνεται ως
// σελίδα χαμηλής αξίας.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  S, SERIF, Breadcrumbs, TherapistCard, ChipLinks, Faq, CtaBox, Section, H2,
} from '@/components/SeoPageParts';
import { MapPin, Stethoscope, Users } from 'lucide-react';

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://physio-site2.vercel.app';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

async function getPage(slug) {
  const { data, error } = await db().rpc('area_page', { p_slug: slug });
  if (error) { console.error('[area_page]', error.message); return null; }
  return data;
}

export async function generateStaticParams() {
  try {
    const { data } = await db().rpc('seo_pages');
    return (data || [])
      .filter(p => p.kind === 'area' && p.should_index)
      .map(p => ({ slug: p.slug }));
  } catch { return []; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getPage(slug);
  if (!p) return { title: 'Δεν βρέθηκε — PhysioHome' };

  const title = p.seo_title || `Φυσικοθεραπεία στο σπίτι στην περιοχή ${p.name}`;
  const description = p.seo_description
    || (p.intro ? String(p.intro).slice(0, 155)
      : `Βρείτε φυσικοθεραπευτές που πραγματοποιούν κατ' οίκον συνεδρίες στην περιοχή ${p.name}.`);
  const url = `${SITE}/fysiotherapeia-sto-spiti/${p.slug}`;

  return {
    title: `${title} | PhysioHome`,
    description,
    alternates: { canonical: url },
    robots: p.should_index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, type: 'website', locale: 'el_GR', siteName: 'PhysioHome' },
  };
}

export default async function AreaPage({ params }) {
  const { slug } = await params;
  const p = await getPage(slug);
  if (!p) notFound();

  const therapists = p.therapists || [];
  const hasContent = Array.isArray(p.content) && p.content.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Αρχική', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Περιοχές', item: `${SITE}/therapists` },
          { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE}/fysiotherapeia-sto-spiti/${p.slug}` },
        ],
      },
      ...(Array.isArray(p.faq) && p.faq.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: p.faq.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <section style={{ background: `linear-gradient(160deg, ${S.soft} 0%, ${S.off} 100%)`, padding: '40px 24px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Breadcrumbs items={[
            { label: 'Αρχική', href: '/' },
            { label: 'Περιοχές', href: '/therapists' },
            { label: p.name },
          ]} />

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 3.6vw, 42px)', color: S.navy, lineHeight: 1.2, margin: '0 0 18px', fontWeight: 400 }}>
            Φυσικοθεραπεία στο σπίτι <em style={{ fontStyle: 'italic', color: S.accent }}>{p.name}</em>
          </h1>

          <p style={{ fontSize: 17, color: S.muted, lineHeight: 1.75, margin: 0, maxWidth: 720 }}>
            {p.intro || `Βρείτε φυσικοθεραπευτές που πραγματοποιούν κατ' οίκον συνεδρίες στην περιοχή ${p.name}. Δείτε εμπειρία, περιστατικά που αναλαμβάνουν, τιμές και διαθέσιμες ώρες.`}
          </p>

          {p.therapist_count > 0 && (
            <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${S.border}`, borderRadius: 30, padding: '9px 18px', fontSize: 14, color: S.navy }}>
              <Users size={15} color={S.accent} strokeWidth={2} />
              <strong>{p.therapist_count}</strong>
              {p.therapist_count === 1 ? ' φυσικοθεραπευτής εξυπηρετεί' : ' φυσικοθεραπευτές εξυπηρετούν'} {p.name}
            </div>
          )}
        </div>
      </section>

      {/* Τι αντιμετωπίζεται εδώ — internal links προς condition pages.
          Έτσι η περιοχή τροφοδοτεί τις παθήσεις και αντίστροφα. */}
      {p.conditions?.length > 0 && (
        <Section>
          <H2>Τι μπορείτε να αντιμετωπίσετε</H2>
          <p style={{ fontSize: 15.5, color: S.muted, lineHeight: 1.7, margin: '0 0 20px', maxWidth: 640 }}>
            Περιστατικά που αναλαμβάνουν οι φυσικοθεραπευτές της περιοχής.
          </p>
          <ChipLinks items={p.conditions} base="/pathiseis" icon={Stethoscope} />
        </Section>
      )}

      {hasContent && (
        <Section bg={S.off}>
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 34 }}>
            {p.content.map((sec, i) => (
              <div key={i}>
                <H2>{sec.title}</H2>
                <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                  {sec.body}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section bg={hasContent ? '#fff' : S.off}>
        <H2>{`Φυσικοθεραπευτές που εξυπηρετούν ${p.name}`}</H2>

        {therapists.length === 0 ? (
          <p style={{ fontSize: 15.5, color: S.muted, lineHeight: 1.7 }}>
            Δεν υπάρχουν αυτή τη στιγμή διαθέσιμοι φυσικοθεραπευτές στη συγκεκριμένη περιοχή.
            Δείτε γειτονικές περιοχές παρακάτω.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {therapists.map(t => <TherapistCard key={t.id} t={t} />)}
          </div>
        )}
      </Section>

      {p.nearby?.length > 0 && (
        <Section bg={S.off}>
          <H2>Γειτονικές περιοχές</H2>
          <ChipLinks items={p.nearby} base="/fysiotherapeia-sto-spiti" icon={MapPin} />
        </Section>
      )}

      {Array.isArray(p.faq) && p.faq.length > 0 && (
        <Section>
          <H2>Συχνές ερωτήσεις</H2>
          <Faq items={p.faq} />
        </Section>
      )}

      <Section bg={S.off}>
        <CtaBox
          title={`Χρειάζεστε φυσικοθεραπεία στο σπίτι ${p.name};`}
          desc="Πείτε μας τι σας ταλαιπωρεί και δείτε ποιοι φυσικοθεραπευτές μπορούν να σας εξυπηρετήσουν."
          href="/dashboard/patient/new-request"
          label="Βρες φυσικοθεραπευτή"
        />
      </Section>

      <Footer />
    </>
  );
}