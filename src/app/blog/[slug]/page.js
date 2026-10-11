// src/app/blog/[slug]/page.js
// Άρθρο — SERVER. Φορτώνει το άρθρο και στέλνει έτοιμη σελίδα, ώστε το
// κείμενο να διαβάζεται από το Google. Ο μετρητής αναγνώσεων ανεβαίνει
// μόνο στον browser (ArticleClient.jsx), όχι σε κάθε φόρτωση του server.

import ArticleClient from './ArticleClient';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  let post = null;
  try {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    post = data || null;
  } catch (_) {}
  return <ArticleClient slug={slug} initialPost={post} />;
}
