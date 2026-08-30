import { supabase } from '@/lib/supabase';

// Sitemap.xml — Δυναμικά παραγόμενος για όλα τα site URLs
// Next.js αυτόματα το serves στο /sitemap.xml
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

// Cache για 1 ώρα — αρκετό για να μην χτυπάει συνέχεια το DB
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://physio-site2.vercel.app';

export default async function sitemap() {
  const now = new Date();

  // ============== STATIC PAGES ==============
  // ΔΕΝ μπαίνουν εδώ:
  //   /packages — η σελίδα καταργήθηκε
  //   /services — κάνει redirect στο /find-help και είναι noindex.
  //               Ένα URL που ανακατευθύνει δεν έχει θέση στο sitemap:
  //               λέει στη Google «αυτή είναι σελίδα» και μετά την πετάει αλλού.
  const staticPages = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/therapists`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/find-help`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/find-help?lang=en`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/become-therapist`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ============== DYNAMIC: SEO LANDING PAGES ==============
  //
  // Η seo_pages() επιστρέφει ΜΟΝΟ σελίδες που περνούν τον φραγμό:
  // αρκετοί θεραπευτές ΚΑΙ γραμμένο κείμενο. Οι υπόλοιπες υπάρχουν
  // και είναι προσβάσιμες, αλλά μένουν εκτός sitemap και noindex.
  //
  // Το να δηλώσεις στη Google σαράντα κενές σελίδες βλάπτει ΟΛΟ το
  // domain, όχι μόνο αυτές. Καλύτερα δέκα καλές.
  let seoPages = [];

  try {
    const { data: pages } = await supabase.rpc('seo_pages');

    if (pages && pages.length > 0) {
      seoPages = pages
        .filter((p) => p.should_index)
        .map((p) => ({
          url: p.kind === 'condition'
            ? `${SITE_URL}/pathiseis/${p.slug}`
            : `${SITE_URL}/fysiotherapeia-sto-spiti/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: 'weekly',
          // Οι περιοχές έχουν συνήθως υψηλότερο commercial intent:
          // «φυσικοθεραπευτής Παγκράτι» είναι πιο κοντά σε κράτηση από
          // «τι είναι η οσφυαλγία».
          priority: p.kind === 'area' ? 0.8 : 0.7,
        }));
    }
  } catch (err) {
    console.error('Sitemap: failed to load SEO pages', err);
  }

  // ============== DYNAMIC: CONDITION FILTER PAGES ==============
  // Το /find-help/[slug] παραμένει ως φίλτρο της εφαρμογής.
  // ΧΩΡΙΣ τα ?lang=en διπλότυπα: το ίδιο περιεχόμενο σε δύο URL
  // ανταγωνίζεται τον εαυτό του στα αποτελέσματα.
  let conditionPages = [];

  try {
    const { data: conditions } = await supabase
      .from('conditions')
      .select('slug, is_popular')
      .eq('is_active', true);

    if (conditions && conditions.length > 0) {
      conditionPages = conditions.map((c) => ({
        url: `${SITE_URL}/find-help/${c.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: c.is_popular ? 0.6 : 0.5,
      }));
    }
  } catch (err) {
    console.error('Sitemap: failed to load conditions', err);
  }

  // ============== DYNAMIC: BLOG POSTS (αν υπάρχουν) ==============
  let blogPages = [];
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (posts && posts.length > 0) {
      blogPages = posts.map((p) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'monthly',
        priority: 0.5,
      }));
    }
  } catch (err) {
    // Αν δεν υπάρχει blog_posts table, σιωπηλά skip
  }

  return [...staticPages, ...seoPages, ...conditionPages, ...blogPages];
}