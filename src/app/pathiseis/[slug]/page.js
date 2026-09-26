// src/app/pathiseis/[slug]/page.js
// ═══════════════════════════════════════════════════════════════════
// Η ΜΟΝΑΔΙΚΗ σελίδα πάθησης — δίγλωσση (EL / EN με ?lang=en).
//
// Η παλιά /find-help/[slug] καταργήθηκε και ανακατευθύνει εδώ
// (next.config.mjs). Γι' αυτό η σελίδα δείχνει ό,τι έδειχνε κι εκείνη:
// κείμενο, συμπτώματα, θεραπευτές που δήλωσαν την πάθηση ΚΑΙ θεραπευτές
// σχετικής ειδικότητας, αξιολογήσεις, σχετικές παθήσεις.
//
// SERVER COMPONENT: η Google διαβάζει έτοιμο HTML.
//
// ΤΙΤΛΟΙ ΧΩΡΙΣ ΓΡΑΜΜΑΤΙΚΗ ΠΤΩΣΗ:
// Το όνομα της πάθησης είναι σε ονομαστική («Πόνος ώμου»). Η φράση
// «για Πόνος ώμου» είναι λάθος ελληνικά. Γι' αυτό το όνομα μπαίνει
// πάντα αυτόνομο: «Πόνος ώμου: φυσικοθεραπεία στο σπίτι».
//
// ΧΩΡΙΣ « | Theralivo» στον τίτλο: το προσθέτει ήδη το layout.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LangSync from '@/components/LangSync';
import {
  S, SERIF, Breadcrumbs, TherapistCard, ChipLinks, Faq, CtaBox, Section, H2,
} from '@/components/SeoPageParts';
import { MapPin, Stethoscope } from 'lucide-react';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://theralivo.com';

const TX = {
  el: {
    home: 'Αρχική', conditions: 'Παθήσεις',
    titleSuffix: 'φυσικοθεραπεία στο σπίτι',
    descFallback: (n) => `${n}: βρείτε φυσικοθεραπευτές που πραγματοποιούν συνεδρίες στο σπίτι σας, σε Αθήνα και Αττική.`,
    count: (n) => n === 1 ? '1 φυσικοθεραπευτής αναλαμβάνει αυτό το περιστατικό' : `${n} φυσικοθεραπευτές αναλαμβάνουν αυτό το περιστατικό`,
    about: 'Πώς βοηθά η φυσικοθεραπεία',
    symptoms: 'Συχνά συμπτώματα',
    therapists: 'Φυσικοθεραπευτές για αυτό το περιστατικό',
    therapistsHint: 'Πρώτα όσοι το αναλαμβάνουν ρητά· μετά όσοι έχουν σχετική ειδικότητα.',
    noTherapists: 'Δεν υπάρχουν αυτή τη στιγμή διαθέσιμοι φυσικοθεραπευτές για το συγκεκριμένο περιστατικό. Πείτε μας τι χρειάζεστε και θα σας βρούμε.',
    areas: 'Περιοχές εξυπηρέτησης',
    related: 'Σχετικά περιστατικά',
    faq: 'Συχνές ερωτήσεις',
    ctaTitle: 'Χρειάζεστε φυσικοθεραπεία στο σπίτι;',
    ctaDesc: 'Πείτε μας τι σας ταλαιπωρεί και δείτε ποιοι φυσικοθεραπευτές μπορούν να σας εξυπηρετήσουν στην περιοχή σας.',
    ctaBtn: 'Βρες φυσικοθεραπευτή',
    notFound: 'Δεν βρέθηκε',
  },
  en: {
    home: 'Home', conditions: 'Conditions',
    titleSuffix: 'home physiotherapy',
    descFallback: (n) => `${n}: find physiotherapists who treat you at home, in Athens and Attica.`,
    count: (n) => n === 1 ? '1 physiotherapist treats this condition' : `${n} physiotherapists treat this condition`,
    about: 'How physiotherapy helps',
    symptoms: 'Common symptoms',
    therapists: 'Physiotherapists for this condition',
    therapistsHint: 'Those who explicitly treat it come first, then those with a related specialty.',
    noTherapists: 'No physiotherapists are currently available for this condition. Tell us what you need and we will find one for you.',
    areas: 'Areas served',
    related: 'Related conditions',
    faq: 'Frequently asked questions',
    ctaTitle: 'Need physiotherapy at home?',
    ctaDesc: 'Tell us what is bothering you and see which physiotherapists can help you in your area.',
    ctaBtn: 'Find a physiotherapist',
    notFound: 'Not found',
  },
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

async function getPage(slug, lang) {
  const { data, error } = await db().rpc('condition_page', { p_slug: slug, p_lang: lang });
  if (error) { console.error('[condition_page]', error.message); return null; }
  return data;
}

async function readLang(searchParams) {
  const sp = await searchParams;
  return sp?.lang === 'en' ? 'en' : 'el';
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const lang = await readLang(searchParams);
  const tx = TX[lang];
  const p = await getPage(slug, lang);
  if (!p) return { title: tx.notFound };

  const title = p.seo_title || `${p.name}: ${tx.titleSuffix}`;
  const description = p.seo_description
    || (p.intro ? String(p.intro).slice(0, 155) : tx.descFallback(p.name));

  const elUrl = `${SITE}/pathiseis/${p.slug}`;
  const enUrl = `${elUrl}?lang=en`;
  const url = lang === 'en' ? enUrl : elUrl;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { 'el-GR': elUrl, 'en-US': enUrl },
    },
    // Ο φραγμός κατά των thin pages — ίδιος για τις δύο γλώσσες.
    robots: p.should_index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title, description, url, type: 'article',
      locale: lang === 'en' ? 'en_US' : 'el_GR', siteName: 'Theralivo',
    },
  };
}

export default async function ConditionPage({ params, searchParams }) {
  const { slug } = await params;
  const lang = await readLang(searchParams);
  const tx = TX[lang];
  const p = await getPage(slug, lang);
  if (!p) notFound();

  const suffix = lang === 'en' ? '?lang=en' : '';
  const therapists = Array.isArray(p.therapists) ? p.therapists : [];
  const hasSpecialty = therapists.some(t => t.match === 'specialty');
  // «about» είναι ΚΕΙΜΕΝΟ (conditions.content_el / content_en), όχι λίστα.
  const about = typeof p.about === 'string' && p.about.trim() ? p.about : null;
  const symptoms = Array.isArray(p.symptoms) ? p.symptoms.filter(s => typeof s === 'string' && s.trim()) : [];
  const faq = Array.isArray(p.faq) ? p.faq : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: tx.home, item: `${SITE}/${suffix}` },
          { '@type': 'ListItem', position: 2, name: tx.conditions, item: `${SITE}/find-help${suffix}` },
          { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE}/pathiseis/${p.slug}${suffix}` },
        ],
      },
      ...(faq.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: faq.map(f => ({
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
      {/* Ο διακόπτης EL/EN του header γράφει ?lang= στη διεύθυνση */}
      <LangSync urlLang={lang} />

      <section style={{ background: `linear-gradient(160deg, ${S.soft} 0%, ${S.off} 100%)`, padding: '40px 24px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Breadcrumbs items={[
            { label: tx.home, href: `/${suffix}` },
            { label: tx.conditions, href: `/find-help${suffix}` },
            { label: p.name },
          ]} />

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 3.6vw, 42px)', color: S.navy, lineHeight: 1.2, margin: '0 0 18px', fontWeight: 400 }}>
            {p.name}: <em style={{ fontStyle: 'italic', color: S.accent }}>{tx.titleSuffix}</em>
          </h1>

          {p.intro && (
            <p style={{ fontSize: 17, color: S.muted, lineHeight: 1.75, margin: 0, maxWidth: 720 }}>
              {p.intro}
            </p>
          )}

          {p.therapist_count > 0 && (
            <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${S.border}`, borderRadius: 30, padding: '9px 18px', fontSize: 14, color: S.navy }}>
              <Stethoscope size={15} color={S.accent} strokeWidth={2} />
              {tx.count(p.therapist_count)}
            </div>
          )}
        </div>
      </section>

      {(about || symptoms.length > 0) && (
        <Section>
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 34 }}>
            {about && (
              <div>
                <H2>{tx.about}</H2>
                <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                  {about}
                </p>
              </div>
            )}

            {symptoms.length > 0 && (
              <div>
                <H2>{tx.symptoms}</H2>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {symptoms.map((s, i) => (
                    <li key={i} style={{ fontSize: 16, color: S.muted, lineHeight: 1.7 }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Οι θεραπευτές — ο λόγος που η σελίδα δεν είναι απλό άρθρο */}
      <Section bg={S.off}>
        <H2>{tx.therapists}</H2>
        {hasSpecialty && (
          <p style={{ fontSize: 14, color: S.muted, lineHeight: 1.6, margin: '-6px 0 20px' }}>
            {tx.therapistsHint}
          </p>
        )}

        {therapists.length === 0 ? (
          <p style={{ fontSize: 15.5, color: S.muted, lineHeight: 1.7 }}>
            {tx.noTherapists}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {therapists.map(t => <TherapistCard key={t.id} t={t} lang={lang} />)}
          </div>
        )}
      </Section>

      {/* Internal linking: πάθηση → περιοχές. Οι σελίδες περιοχών είναι
          μόνο ελληνικές, γι' αυτό χωρίς suffix. */}
      {p.areas?.length > 0 && (
        <Section>
          <H2>{tx.areas}</H2>
          <ChipLinks items={p.areas} base="/fysiotherapeia-sto-spiti" icon={MapPin} />
        </Section>
      )}

      {p.related?.length > 0 && (
        <Section bg={S.off}>
          <H2>{tx.related}</H2>
          <ChipLinks items={p.related} base="/pathiseis" icon={Stethoscope} suffix={suffix} />
        </Section>
      )}

      {faq.length > 0 && (
        <Section>
          <H2>{tx.faq}</H2>
          <Faq items={faq} />
        </Section>
      )}

      <Section bg={S.off}>
        <CtaBox
          title={tx.ctaTitle}
          desc={tx.ctaDesc}
          href={`/therapists?condition=${p.slug}`}
          label={tx.ctaBtn}
        />
      </Section>

      <Footer />
    </>
  );
}
