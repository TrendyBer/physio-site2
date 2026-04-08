'use client';
import { useLang } from '@/context/LanguageContext';

const POSTS = {
  el: [
    { slug: 'how-home-physiotherapy-can-help-with-back-and-neck-pain', cat: 'Pain Management', time: '5 λεπτά ανάγνωση', title: 'Πώς η φυσιοθεραπεία στο σπίτι βοηθά με πόνο στη πλάτη και τον αυχένα', desc: 'Απλές συνήθειες και πρακτικά βήματα που μπορούν να κάνουν τη διαδικασία ανάρρωσής σας πιο ομαλή και αποτελεσματική.' },
    { slug: 'simple-ways-to-improve-mobility-and-balance-at-home', cat: 'Mobility & Balance', time: '4 λεπτά ανάγνωση', title: 'Απλοί τρόποι για να βελτιώσετε την κινητικότητα και ισορροπία σας στο σπίτι', desc: 'Εξερευνήστε εξειδικευμένες ασκήσεις και καθημερινές συνήθειες που βελτιώνουν την κινητικότητά σας.' },
  ],
  en: [
    { slug: 'how-home-physiotherapy-can-help-with-back-and-neck-pain', cat: 'Pain Management', time: '5 min read', title: 'How home physiotherapy can help with back and neck pain', desc: 'Simple habits and practical steps that can make your recovery process smoother and more effective.' },
    { slug: 'simple-ways-to-improve-mobility-and-balance-at-home', cat: 'Mobility & Balance', time: '4 min read', title: 'Simple ways to improve mobility and balance at home', desc: 'Explore specialized exercises and daily habits that improve your mobility and balance.' },
  ],
};

export default function Blog() {
  const { lang } = useLang();
  const posts = POSTS[lang];
  const allArticles = lang === 'el' ? 'Όλα τα Άρθρα' : 'View All Articles';
  const readMore = lang === 'el' ? 'Διαβάστε περισσότερα →' : 'Read more →';
  const title = lang === 'el' ? 'Συμβουλές & ' : 'Tips & ';
  const titleEm = lang === 'el' ? 'Πόροι Φυσιοθεραπείας' : 'Physiotherapy Resources';
  const desc = lang === 'el'
    ? 'Εξερευνήστε εξειδικευμένες συμβουλές και πρακτική καθοδήγηση για να υποστηρίξετε την ανάρρωσή σας στο σπίτι.'
    : 'Explore expert advice and practical guidance to support your recovery journey.';

  return (
    <>
      <style>{`
        .blog-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        @media (max-width: 640px) { .blog-grid { grid-template-columns: 1fr; } }
        .blog-card { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; overflow: hidden; transition: all .3s; text-decoration: none; color: inherit; display: block; }
        .blog-card:hover { box-shadow: 0 4px 24px rgba(26,46,68,0.08); transform: translateY(-4px); }
      `}</style>
      <section id="blog" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {title}<em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{desc}</p>
            </div>
            <a href="/blog" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{allArticles}</a>
          </div>
          <div className="blog-grid">
            {posts.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 13 }}>📷 Photo</div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2a6fdb', marginBottom: 8 }}>{post.cat} · {post.time}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 16 }}>{post.desc}</p>
                  <span style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 500 }}>{readMore}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}