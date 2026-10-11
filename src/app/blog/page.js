// src/app/blog/page.js
// Λίστα άρθρων — SERVER. Φορτώνει τα δημοσιευμένα άρθρα και στέλνει
// έτοιμη σελίδα (πριν το Google έβλεπε μόνο «Φόρτωση...»).
// Η λειτουργία (κατηγορίες, φίλτρο) ζει στο BlogClient.jsx.

import BlogClient from './BlogClient';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

export default async function BlogPage() {
  let posts = null;
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (!error && data) posts = data;
  } catch (_) {}
  return <BlogClient initialPosts={posts} />;
}
