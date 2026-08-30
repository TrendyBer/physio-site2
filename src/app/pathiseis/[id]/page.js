// src/app/pathiseis/[slug]/page.js
// ═══════════════════════════════════════════════════════════════════
// SEO landing page πάθησης.
//
// SERVER COMPONENT, ΟΧΙ CLIENT.
// Η Google διαβάζει HTML, όχι JavaScript που τρέχει μετά. Αν το
// περιεχόμενο ερχόταν με useEffect, ο crawler θα έβλεπε άδεια σελίδα.
// Γι' αυτό τα δεδομένα φορτώνονται εδώ, πριν σταλεί η απάντηση.
//
// ΔΕΝ είναι σελίδα ιατρικής διάγνωσης. Είναι informational landing
// page ενός marketplace: εξηγεί πότε βοηθά η φυσικοθεραπεία και δείχνει
// ποιος μπορεί να την κάνει — χωρίς υποσχέσεις θεραπείας.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  S, SERIF, Breadcrumbs, TherapistCard, ChipLinks, Faq, CtaBox, Section, H2,
} from '@/components/SeoPageParts';
import { MapPin, Stethoscope } from 'lucide-react';

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
  const { data, error } = await db().rpc('condition_page', { p_slug: slug });
  if (error) { console.error('[condition_page]', error.message); return null; }
  return data;
}

// Προ-παραγωγή μόνο για όσες αξίζουν index. Οι υπόλοιπες παράγονται
// on-demand — υπάρχουν, αλλά δεν σπαταλάμε build time γι' αυτές.
export async function generateStaticParams() {
  try {
    const { data } = await db().rpc('seo_pages');
    return (data || [])
      .filter(p => p.kind === 'condition' && p.should_index)
      .map(p => ({ slug: p.slug }));
  } catch { return []; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getPage(slug);
  if (!p) return { title: 'Δεν βρέθηκε — PhysioHome' };

  const title = p.seo_title || `Φυσικοθεραπεία στο σπίτι για ${p.name}`;
  const description = p.seo_description
    || (p.intro ? String(p.intro).slice(0, 155)
      : `Βρείτε φυσικοθεραπευτές που αναλαμβάνουν ${p.name} και πραγματοποιούν συνεδρίες στο σπίτι σας.`);
  const url = `${SITE}/pathiseis/${p.slug}`;

  return {
    title: `${title} | PhysioHome`,
    description,
    alternates: { canonical: url },
    // Ο φραγμός κατά των thin pages. Μια σελίδα χωρίς θεραπευτές και
    // χωρίς κείμενο βλάπτει ΟΛΟ το domain, όχι μόνο τον εαυτό της.
    robots: p.should_index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, type: 'article', locale: 'el_GR', siteName: 'PhysioHome' },
  };
}

export default async function ConditionPage({ params }) {
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
          { '@type': 'ListItem', position: 2, name: 'Περιστατικά', item: `${SITE}/find-help` },
          { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE}/pathiseis/${p.slug}` },
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
            { label: 'Περιστατικά', href: '/find-help' },
            { label: p.name },
          ]} />

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 3.6vw, 42px)', color: S.navy, lineHeight: 1.2, margin: '0 0 18px', fontWeight: 400 }}>
            Φυσικοθεραπεία στο σπίτι για <em style={{ fontStyle: 'italic', color: S.accent }}>{String(p.name).toLowerCase()}</em>
          </h1>

          {p.intro && (
            <p style={{ fontSize: 17, color: S.muted, lineHeight: 1.75, margin: 0, maxWidth: 720 }}>
              {p.intro}
            </p>
          )}

          {p.therapist_count > 0 && (
            <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${S.border}`, borderRadius: 30, padding: '9px 18px', fontSize: 14, color: S.navy }}>
              <Stethoscope size={15} color={S.accent} strokeWidth={2} />
              <strong>{p.therapist_count}</strong>
              {p.therapist_count === 1 ? ' φυσικοθεραπευτής αναλαμβάνει' : ' φυσικοθεραπευτές αναλαμβάνουν'} {p.name}
            </div>
          )}
        </div>
      </section>

      {/* Το ενημερωτικό περιεχόμενο. Γράφεται από το admin — χωρίς αυτό
          η σελίδα μένει noindex και δεν εμφανίζεται στη Google. */}
      {hasContent && (
        <Section>
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

      {/* Οι θεραπευτές — ο λόγος που η σελίδα δεν είναι απλό άρθρο */}
      <Section bg={S.off}>
        <H2>{`Φυσικοθεραπευτές που αναλαμβάνουν ${p.name}`}</H2>

        {therapists.length === 0 ? (
          <p style={{ fontSize: 15.5, color: S.muted, lineHeight: 1.7 }}>
            Δεν υπάρχουν αυτή τη στιγμή διαθέσιμοι φυσικοθεραπευτές για το συγκεκριμένο
            περιστατικό. Δείτε όλους τους διαθέσιμους επαγγελματίες ή δοκιμάστε ξανά σύντομα.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {therapists.map(t => <TherapistCard key={t.id} t={t} />)}
          </div>
        )}
      </Section>

      {/* Internal linking: πάθηση → περιοχές */}
      {p.areas?.length > 0 && (
        <Section>
          <H2>Περιοχές εξυπηρέτησης</H2>
          <ChipLinks items={p.areas} base="/fysiotherapeia-sto-spiti" icon={MapPin} />
        </Section>
      )}

      {p.related?.length > 0 && (
        <Section bg={S.off}>
          <H2>Σχετικά περιστατικά</H2>
          <ChipLinks items={p.related} base="/pathiseis" icon={Stethoscope} />
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
          title={`Χρειάζεστε φυσικοθεραπεία για ${String(p.name).toLowerCase()};`}
          desc="Πείτε μας τι σας ταλαιπωρεί και δείτε ποιοι φυσικοθεραπευτές μπορούν να σας εξυπηρετήσουν στην περιοχή σας."
          href={`/therapists?condition=${p.slug}`}
          label="Βρες φυσικοθεραπευτή"
        />
      </Section>

      <Footer />
    </>
  );
}