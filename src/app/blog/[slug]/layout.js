// src/app/blog/[slug]/layout.js
// Δίνει σε κάθε άρθρο δικό του τίτλο και περιγραφή στο Google,
// διαβάζοντας το άρθρο στον server. Η σελίδα του άρθρου είναι
// 'use client' και δεν μπορεί να το κάνει μόνη της.

import { supabase } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    // select('*'): αν ζητούσαμε στήλη που δεν υπάρχει, το άρθρο θα
    // φαινόταν «δεν βρέθηκε» και θα έβγαινε από το Google.
    const { data: post, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) return { title: 'Άρθρο' };
    if (!post) return { title: 'Το άρθρο δεν βρέθηκε', robots: { index: false, follow: true } };

    const title = post.title_el || 'Άρθρο';
    const description = post.excerpt_el ? String(post.excerpt_el).slice(0, 160) : undefined;

    return {
      title,
      description,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        title: `${title} | Theralivo`,
        description,
        url: `/blog/${post.slug}`,
        type: 'article',
        locale: 'el_GR',
        siteName: 'Theralivo',
        ...(post.image_url ? { images: [post.image_url] } : {}),
      },
    };
  } catch (_) {
    return { title: 'Άρθρο' };
  }
}

export default function Layout({ children }) {
  return children;
}
