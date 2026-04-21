'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BookingButton from '../../components/BookingButton';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Pain Management', 'Mobility & Balance', 'Post-Surgery', 'Recovery Tips', 'Sports Injuries'];

const t = {
  el: {
    badge: 'Blog & Άρθρα',
    title: 'Συμβουλές &',
    titleItalic: 'Πόροι Φυσιοθεραπείας',
    subtitle: 'Εξειδικευμένες συμβουλές και πρακτική καθοδήγηση για να υποστηρίξετε την ανάρρωσή σας.',
    all: 'Όλα',
    readMore: 'Διαβάστε περισσότερα →',
    noArticles: 'Δεν βρέθηκαν άρθρα σε αυτή την κατηγορία.',
    loading: 'Φόρτωση...',
    ctaTitle: 'Ξεκινήστε με μια Δωρεάν Αξιολόγηση',
    ctaSubtitle: 'Μιλήστε με έναν ειδικό φυσιοθεραπευτή σήμερα.',
    ctaBtn: 'Κλείσε Αξιολόγηση',
  },
  en: {
    badge: 'Blog & Articles',
    title: 'Tips &',
    titleItalic: 'Physiotherapy Resources',
    subtitle: 'Expert advice and practical guidance to support your recovery journey.',
    all: 'All',
    readMore: 'Read more →',
    noArticles: 'No articles found in this category.',
    loading: 'Loading...',
    ctaTitle: 'Start With a Free Assessment',
    ctaSubtitle: 'Talk to a specialist physiotherapist today.',
    ctaBtn: 'Book Assessment',
  },
};

export default function BlogPage() {
  const { lang } = useLang();
  const tx = t[lang];
  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        @media (max-width: 1024px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .blog-grid { grid-template-columns: 1fr; } }
        .cat-tab { padding: 8px 20px; border-radius: 30px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1.5px solid #dce6f0; background: #fff; color: #6b7a8d; transition: all .2s; white-space: nowrap; }
        .cat-tab:hover { border-color: #2a6fdb; color: #2a6fdb; }
        .cat-tab.active { background: #2a6fdb; color: #fff; border-color: #2a6fdb; }
        .post-card { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; overflow: hidden; transition: all .3s; text-decoration: none; display: block; color: inherit; }
        .post-card:hover { box-shadow: 0 8px 32px rgba(26,46,68,0.10); transform: translateY(-4px); }
        .cat-tabs-wrapper { display: flex; gap: 10px; flex-wrap: wrap; }
      `}</style>

      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #f8fafb 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
            {tx.badge}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {tx.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.titleItalic}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 560, margin: '0 auto' }}>
            {tx.subtitle}
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section style={{ background: '#f8fafb', padding: '32px 24px 0', borderBottom: '1px solid #dce6f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="cat-tabs-wrapper">
            <button className={`cat-tab${activeCategory === 'all' ? ' active' : ''}`} onClick={() => setActiveCategory('all')}>
              {tx.all}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} className={`cat-tab${activeCategory === cat ? ' active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section style={{ background: '#f8fafb', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 0' }}>{tx.loading}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 0' }}>{tx.noArticles}</div>
          ) : (
            <div className="blog-grid">
              {filtered.map(post => (
                <a key={post.slug} href={`/blog/${post.slug}`} className="post-card">
                  {post.image_url ? (
                    <img src={post.image_url} alt={lang === 'el' ? post.title_el : post.title_en} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 13 }}>
                      📷 Photo
                    </div>
                  )}
                  <div style={{ padding: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2a6fdb', marginBottom: 10 }}>
                      {post.category}
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a2e44', marginBottom: 10, lineHeight: 1.4 }}>
                      {lang === 'el' ? post.title_el : post.title_en}
                    </h2>
                    <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 20, lineHeight: 1.6 }}>
                      {lang === 'el' ? post.excerpt_el : post.excerpt_en}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{tx.readMore}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>👁 {post.reads || 0}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA — χρησιμοποιεί BookingButton με variant=assessment */}
      <section style={{ background: '#1a2e44', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', marginBottom: 16 }}>
            {tx.ctaTitle}
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32 }}>{tx.ctaSubtitle}</p>
          <BookingButton
            variant="assessment"
            style={{ background: '#2a6fdb', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {tx.ctaBtn}
          </BookingButton>
        </div>
      </section>

      <Footer />
    </>
  );
}