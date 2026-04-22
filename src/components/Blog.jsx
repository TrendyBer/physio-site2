'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

export default function Blog() {
  const { lang } = useLang();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title_el, title_en, excerpt_el, excerpt_en, category, image_url, reads, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const t = {
    el: {
      title: 'Συμβουλές & ',
      titleEm: 'Πόροι Φυσιοθεραπείας',
      desc: 'Εξερευνήστε εξειδικευμένες συμβουλές και πρακτική καθοδήγηση για να υποστηρίξετε την ανάρρωσή σας στο σπίτι.',
      viewAll: 'Όλα τα Άρθρα',
      readMore: 'Διαβάστε περισσότερα →',
    },
    en: {
      title: 'Tips & ',
      titleEm: 'Physiotherapy Resources',
      desc: 'Explore expert advice and practical guidance to support your recovery journey.',
      viewAll: 'View All Articles',
      readMore: 'Read more →',
    },
  };
  const text = t[lang];

  if (loading) return null;
  if (posts.length === 0) return null;

  return (
    <>
      <style>{`
        .blog-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        @media (max-width: 640px) { .blog-grid { grid-template-columns: 1fr; } }
        .blog-card { background: #faf6ef; border-radius: 16px; border: 1px solid #e8dfd0; overflow: hidden; transition: all .3s; text-decoration: none; color: inherit; display: block; }
        .blog-card:hover { box-shadow: 0 4px 24px rgba(26,46,68,0.08); transform: translateY(-4px); border-color: #2a6fdb; }
      `}</style>
      <section id="blog" style={{ padding: '80px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title}<em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#334155', maxWidth: 560 }}>{text.desc}</p>
            </div>
            <a href="/blog" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.viewAll}</a>
          </div>

          <div className="blog-grid">
            {posts.map((post) => {
              const title   = lang === 'el' ? post.title_el   : post.title_en;
              const excerpt = lang === 'el' ? post.excerpt_el : post.excerpt_en;
              return (
                <a key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                  {post.image_url ? (
                    <img src={post.image_url} alt={title || ''} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #f5ede0, #ebe0cd)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94785a', fontSize: 13 }}>📷</div>
                  )}
                  <div style={{ padding: 20 }}>
                    {post.category && (
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2a6fdb', marginBottom: 8 }}>
                        {post.category}
                      </div>
                    )}
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 8, lineHeight: 1.4 }}>{title}</h3>
                    {excerpt && <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>{excerpt}</p>}
                    <span style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 500 }}>{text.readMore}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}