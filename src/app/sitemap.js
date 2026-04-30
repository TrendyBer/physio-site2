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
      url: `${SITE_URL}/packages`,
      lastModified: now,
      changeFrequency: 'monthly',
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
      url: `${SITE_URL}/services`,
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

  // ============== DYNAMIC: CONDITION DETAIL PAGES ==============
  let conditionPages = [];

  try {
    const { data: conditions } = await supabase
      .from('conditions')
      .select('slug, is_popular')
      .eq('is_active', true);

    if (conditions && conditions.length > 0) {
      // Για κάθε condition — 1 EL URL + 1 EN URL
      conditionPages = conditions.flatMap((c) => [
        {
          url: `${SITE_URL}/find-help/${c.slug}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: c.is_popular ? 0.8 : 0.6,
        },
        {
          url: `${SITE_URL}/find-help/${c.slug}?lang=en`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: c.is_popular ? 0.6 : 0.4,
        },
      ]);
    }
  } catch (err) {
    // Αν fail το DB query, δεν σπάει το sitemap — απλά δεν θα έχει τα dynamic
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

  return [...staticPages, ...conditionPages, ...blogPages];
}