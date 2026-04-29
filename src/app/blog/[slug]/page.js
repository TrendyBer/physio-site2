'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const t = {
  el: {
    back: '← Επιστροφή στο Blog',
    notFound: 'Το άρθρο δεν βρέθηκε',
    notFoundLink: '← Επιστροφή στο Blog',
    loading: 'Φόρτωση...',
    ctaTitle: 'Θέλετε εξειδικευμένη βοήθεια;',
    ctaSubtitle: 'Κλείστε μια δωρεάν αξιολόγηση με έναν από τους φυσιοθεραπευτές μας.',
    ctaBtn: 'Κλείστε Ραντεβού',
  },
  en: {
    back: '← Back to Blog',
    notFound: 'Article not found',
    notFoundLink: '← Back to Blog',
    loading: 'Loading...',
    ctaTitle: 'Want specialized help?',
    ctaSubtitle: 'Book a free assessment with one of our physiotherapists.',
    ctaBtn: 'Book a Session',
  },
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug;
  const { lang } = useLang();
  const tx = t[lang];
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchArticle() {
      setLoading(true);
      console.log('[Blog] Fetching slug:', slug);

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) {
        console.error('[Blog] Fetch error:', error);
        setNotFound(true);
      } else if (!data) {
        console.warn('[Blog] No article found for slug:', slug);
        setNotFound(true);
      } else {
        console.log('[Blog] Article loaded:', data.title_el);
        setPost(data);
        // Increment reads count (μη-blocking)
        supabase
          .from('articles')
          .update({ reads: (data.reads || 0) + 1 })
          .eq('id', data.id)
          .then(() => {});
      }
      setLoading(false);
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 16, color: '#6b7a8d' }}>{tx.loading}</div>
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>😔</div>
          <h1 style={{ fontSize: 24, color: '#1a2e44' }}>{tx.notFound}</h1>
          <a href="/blog" style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.notFoundLink}</a>
        </div>
        <Footer />
      </>
    );
  }

  const title = lang === 'el' ? post.title_el : post.title_en;
  const content = lang === 'el' ? post.content_el : post.content_en;

  let contentBlocks = [];
  try {
    contentBlocks = JSON.parse(content || '[]');
  } catch {
    contentBlocks = content ? [{ type: 'p', text: content }] : [];
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .article-p { font-size: 17px; color: #3d4f63; line-height: 1.8; margin-bottom: 20px; }
        .article-h { font-size: 20px; font-weight: 700; color: #1a2e44; margin: 36px 0 12px; }
        .article-li { font-size: 16px; color: #3d4f63; line-height: 1.8; margin-left: 24px; margin-bottom: 8px; list-style: disc; }
      `}</style>

      <Navbar />

      <section style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #f8fafb 100%)', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <a href="/blog" style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            {tx.back}
          </a>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: '#2a6fdb', marginBottom: 16 }}>
            {post.category}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 4vw, 42px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 20 }}>
            {title}
          </h1>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#6b7a8d', flexWrap: 'wrap' }}>
            <span>📅 {new Date(post.created_at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>👁 {post.reads || 0} {lang === 'el' ? 'αναγνώσεις' : 'reads'}</span>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
        {post.image_url ? (
          <img src={post.image_url} alt={title} style={{ width: '100%', borderRadius: 16, marginTop: 40, objectFit: 'cover', maxHeight: 400 }} />
        ) : (
          <div style={{ aspectRatio: '16/6', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 16, marginTop: 40 }}>
            📷 Photo
          </div>
        )}
      </div>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>
        {contentBlocks.length > 0 ? (
          contentBlocks.map((block, i) => {
            if (block.type === 'h')  return <div key={i} className="article-h">{block.text}</div>;
            if (block.type === 'li') return <ul key={i} style={{ marginBottom: 8 }}><li className="article-li">{block.text}</li></ul>;
            return <p key={i} className="article-p">{block.text}</p>;
          })
        ) : (
          <p className="article-p">{lang === 'el' ? post.excerpt_el : post.excerpt_en}</p>
        )}

        <div style={{ marginTop: 60, padding: 36, background: 'linear-gradient(135deg, #f0f6ff, #e8f0fb)', borderRadius: 16, textAlign: 'center', border: '1px solid #dce6f0' }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a2e44', marginBottom: 10 }}>
            {tx.ctaTitle}
          </h3>
          <p style={{ fontSize: 15, color: '#6b7a8d', marginBottom: 24 }}>{tx.ctaSubtitle}</p>
          <a href="/dashboard/patient/new-request" style={{ display: 'inline-block', background: '#2a6fdb', color: '#fff', padding: '12px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {tx.ctaBtn}
          </a>
        </div>
      </article>

      <Footer />
    </>
  );
}