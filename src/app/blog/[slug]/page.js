'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Calendar, Eye, FileText, Frown } from 'lucide-react';

const t = {
  el: {
    back: '← Επιστροφή στο Blog',
    notFound: 'Το άρθρο δεν βρέθηκε',
    notFoundLink: '← Επιστροφή στο Blog',
    loading: 'Φόρτωση...',
    ctaTitleFor: (topic) => `Χρειάζεστε φυσικοθεραπεία για ${topic};`,
    ctaTitle: 'Χρειάζεστε φυσικοθεραπεία στο σπίτι;',
    ctaSubFor: (topic) => `Δείτε φυσικοθεραπευτές που αναλαμβάνουν ${topic} και εξυπηρετούν την περιοχή σας.`,
    ctaSubtitle: 'Δείτε φυσικοθεραπευτές που αναλαμβάνουν το περιστατικό σας και εξυπηρετούν την περιοχή σας.',
    ctaBtn: 'Βρες φυσικοθεραπευτή',
  },
  en: {
    back: '← Back to Blog',
    notFound: 'Article not found',
    notFoundLink: '← Back to Blog',
    loading: 'Loading...',
    ctaTitleFor: (topic) => `Need physiotherapy for ${topic}?`,
    ctaTitle: 'Need physiotherapy at home?',
    ctaSubFor: (topic) => `See physiotherapists who handle ${topic} and serve your area.`,
    ctaSubtitle: 'See physiotherapists who handle your condition and serve your area.',
    ctaBtn: 'Find a physiotherapist',
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
          <Frown size={44} color="#94a3b8" strokeWidth={1.6} />
          <h1 style={{ fontSize: 24, color: '#1a2e44' }}>{tx.notFound}</h1>
          <a href="/blog" style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.notFoundLink}</a>
        </div>
        <Footer />
      </>
    );
  }

  const title = lang === 'el' ? post.title_el : post.title_en;

  // Αν το άρθρο είναι δεμένο με πάθηση, το CTA οδηγεί κατευθείαν σε
  // θεραπευτές που την αναλαμβάνουν — όχι σε γενική λίστα.
  const topic = post.condition_name || null;
  const ctaHref = post.condition_slug
    ? `/therapists?condition=${encodeURIComponent(post.condition_slug)}`
    : '/therapists';
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Calendar size={14} />{new Date(post.created_at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={14} />{post.reads || 0} {lang === 'el' ? 'αναγνώσεις' : 'reads'}</span>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
        {post.image_url ? (
          <img src={post.image_url} alt={title} style={{ width: '100%', borderRadius: 16, marginTop: 40, objectFit: 'cover', maxHeight: 400 }} />
        ) : (
          <div style={{ aspectRatio: '16/6', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', marginTop: 40 }}>
            <FileText size={30} strokeWidth={1.7} />
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
          {/* CONTEXTUAL CTA.
              Ένα γενικό «Κλείστε τώρα» στο τέλος άρθρου για οσφυαλγία
              αγνοεί ότι ο αναγνώστης μόλις διάβασε για οσφυαλγία.
              Το θέμα του άρθρου μπαίνει μέσα στο κάλεσμα, και το κουμπί
              οδηγεί σε φιλτραρισμένα αποτελέσματα. */}
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a2e44', marginBottom: 10 }}>
            {post.condition_slug && topic ? tx.ctaTitleFor(topic) : tx.ctaTitle}
          </h3>
          <p style={{ fontSize: 15, color: '#6b7a8d', marginBottom: 24 }}>
            {post.condition_slug && topic ? tx.ctaSubFor(topic) : tx.ctaSubtitle}
          </p>
          <a href={ctaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2a6fdb', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14.5, fontWeight: 600, textDecoration: 'none' }}>
            {tx.ctaBtn}
            <ArrowRight size={16} />
          </a>
        </div>
      </article>

      <Footer />
    </>
  );
}