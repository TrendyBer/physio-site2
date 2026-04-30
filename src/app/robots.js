// robots.txt — Επιτρέπει Google indexing + δείχνει το sitemap
// Next.js αυτόματα το serves στο /robots.txt

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://physio-site2.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',           // Authenticated dashboards
          '/auth/',                // Auth pages (login/register/logout)
          '/api/',                 // API routes
          '/admin/',               // Admin (αν υπάρχει)
          '/select',               // Hidden page
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}