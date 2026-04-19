'use client';
import { useLang } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const { lang, toggleLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [loginModal, setLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setMounted(true);
    const cached = localStorage.getItem('userRole');
    const cachedName = localStorage.getItem('userName');
    if (cached) setUserRole(cached);
    if (cachedName) setUserName(cachedName);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const cached = localStorage.getItem('userRole');
        if (cached) { setUserRole(cached); return; }
        const { data } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
        if (data?.role) { setUserRole(data.role); localStorage.setItem('userRole', data.role); }
      } else {
        setUser(null); setUserRole(null); setUserName(''); localStorage.removeItem('userRole'); localStorage.removeItem('userName');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const cached = localStorage.getItem('userRole');
        if (cached) { setUserRole(cached); return; }
        const { data } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
        if (data?.role) { setUserRole(data.role); localStorage.setItem('userRole', data.role); }
      } else {
        setUser(null); setUserRole(null); setUserName(''); localStorage.removeItem('userRole'); localStorage.removeItem('userName');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password });
    if (error) { setLoginError(error.message); setLoginLoading(false); return; }
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', data.user.id).single();
    const role = profile?.role;
    if (role) localStorage.setItem('userRole', role);
    // Fetch name
    if (role) {
      const table = role === 'therapist' ? 'therapist_profiles' : 'patient_profiles';
      const { data: nameData } = await supabase.from(table).select('name').eq('id', data.user.id).single();
      if (nameData?.name) { const fn = nameData.name.split(' ')[0]; localStorage.setItem('userName', fn); }
    }
    setLoginModal(false);
    if (role === 'therapist') window.location.href = '/dashboard/therapist';
    else if (role === 'patient') window.location.href = '/dashboard/patient';
    else if (role === 'admin') window.location.href = '/admin';
    else window.location.href = '/';
  }

  async function handleSignOut() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const t = {
    el: { login: 'Σύνδεση', register: 'Εγγραφή' },
    en: { login: 'Login', register: 'Register' },
  };
  const text = t[lang];

  // ── Nav links per role ──────────────────────────────────────────────────────
  const publicLinks = [
    { label: lang === 'el' ? 'Πώς Λειτουργεί' : 'How it Works', href: '/how-it-works' },
    { label: lang === 'el' ? 'Υπηρεσίες' : 'Services', href: '/services' },
    { label: lang === 'el' ? 'Θεραπευτές' : 'Therapists', href: '/therapists' },
    { label: 'Blog', href: '/blog' },
    { label: lang === 'el' ? 'Επικοινωνία' : 'Contact', href: '/contact' },
  ];

  const therapistLinks = [
    { label: lang === 'el' ? 'Αρχική' : 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard/therapist' },
    { label: lang === 'el' ? 'Διαθεσιμότητα' : 'Availability', href: '/dashboard/therapist?tab=calendar' },
    { label: lang === 'el' ? 'Ραντεβού' : 'Appointments', href: '/dashboard/therapist?tab=requests' },
    { label: lang === 'el' ? 'Προφίλ' : 'Profile', href: '/dashboard/therapist?tab=profile' },
  ];

  const patientLinks = [
    { label: lang === 'el' ? 'Αρχική' : 'Home', href: '/' },
    { label: lang === 'el' ? 'Θεραπευτές' : 'Therapists', href: '/therapists' },
    { label: lang === 'el' ? 'Κλείσε Συνεδρία' : 'Book Session', href: '/request' },
    { label: 'My Account', href: '/dashboard/patient' },
  ];

  const activeLinks = userRole === 'therapist' ? therapistLinks : userRole === 'patient' ? patientLinks : publicLinks;

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' };

  return (
    <>
      <style>{`
        .nav-links-desktop { display: flex; }
        .nav-right-desktop { display: flex; }
        .hamburger { display: none !important; }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-right-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #dce6f0', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

          {/* Logo */}
          <a href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </a>

          {/* Nav links */}
          <ul className="nav-links-desktop" style={{ alignItems: 'center', gap: 28, listStyle: 'none', margin: 0, padding: 0 }}>
            {activeLinks.map(item => (
              <li key={item.href + item.label}>
                <a href={item.href} style={{ fontSize: 14, fontWeight: 500, color: '#6b7a8d', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#1a2e44'}
                  onMouseLeave={e => e.target.style.color = '#6b7a8d'}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="nav-right-desktop" style={{ alignItems: 'center', gap: 10 }}>
            <button onClick={toggleLang} style={{ border: '1px solid #dce6f0', background: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, color: '#6b7a8d', cursor: 'pointer' }}>
              {lang === 'el' ? 'EN' : 'ΕΛ'}
            </button>

            {/* Show role badge if logged in */}
            {mounted && userRole && userName && (
              <span style={{ background: userRole === 'therapist' ? '#EFF6FF' : '#F0FDF4', color: userRole === 'therapist' ? '#1D4ED8' : '#15803D', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                {userRole === 'therapist' ? '👨‍⚕️' : '🏥'} {userName}
              </span>
            )}

            {mounted && user ? (
              <a href="/auth/logout"
                style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, border: '1px solid #FECACA', cursor: 'pointer', textDecoration: 'none' }}>
                Logout
              </a>
            ) : (
              mounted && <>
                <button onClick={() => setLoginModal(true)}
                  style={{ fontSize: 14, fontWeight: 600, color: '#1a2e44', background: 'none', border: '1px solid #dce6f0', padding: '8px 18px', borderRadius: 20, cursor: 'pointer' }}>
                  {text.login}
                </button>
                <button onClick={() => setRoleModal(true)}
                  style={{ background: '#1a2e44', color: '#fff', padding: '9px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {text.register}
                </button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(true)} style={{ flexDirection: 'column', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
            <span style={{ width: 24, height: 2, background: '#1a2e44', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 24, height: 2, background: '#1a2e44', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 24, height: 2, background: '#1a2e44', borderRadius: 2, display: 'block' }} />
          </button>
        </div>
      </nav>

      {/* Role Modal */}
      {roleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setRoleModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>Εγγραφή στο PhysioHome</div>
              <p style={{ fontSize: 14, color: '#6b7a8d' }}>Τι θέλετε να κάνετε;</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { role: 'patient',   icon: '🏥',   title: 'Θέλω Φυσιοθεραπεία',  desc: 'Εγγραφή ως ασθενής και κλείσιμο ραντεβού' },
                { role: 'therapist', icon: '👨‍⚕️', title: 'Θέλω να Προσφέρω',    desc: 'Εγγραφή ως θεραπευτής και αίτηση συνεργασίας' },
              ].map(r => (
                <a key={r.role} href={`/auth/register?role=${r.role}`} onClick={() => setRoleModal(false)}
                  style={{ padding: '24px 16px', border: '2px solid #e2e8f0', borderRadius: 16, textAlign: 'center', textDecoration: 'none', display: 'block', background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a6fdb'; e.currentTarget.style.background = '#EFF6FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{r.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7a8d', lineHeight: 1.5 }}>{r.desc}</div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7a8d' }}>
              Έχετε ήδη λογαριασμό;{' '}
              <button onClick={() => { setRoleModal(false); setLoginModal(true); }} style={{ color: '#2a6fdb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Σύνδεση</button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {loginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setLoginModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>Σύνδεση</div>
              <p style={{ fontSize: 14, color: '#6b7a8d' }}>Καλώς ήρθατε πίσω</p>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Email</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Password</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} style={inputStyle} />
              </div>
              {loginError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{loginError}</div>}
              <button type="submit" disabled={loginLoading}
                style={{ background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1, fontFamily: 'inherit', marginTop: 4 }}>
                {loginLoading ? 'Σύνδεση...' : 'Σύνδεση →'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7a8d' }}>
              Δεν έχετε λογαριασμό;{' '}
              <button onClick={() => { setLoginModal(false); setRoleModal(true); }} style={{ color: '#2a6fdb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Εγγραφή</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff', display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1a2e44' }}>PhysioHome</span>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1a2e44', padding: 4 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button onClick={() => { if (lang !== 'en') toggleLang(); }} style={{ padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: lang === 'en' ? '#1a2e44' : '#dce6f0', background: lang === 'en' ? '#1a2e44' : '#fff', color: lang === 'en' ? '#fff' : '#6b7a8d' }}>EN</button>
            <button onClick={() => { if (lang !== 'el') toggleLang(); }} style={{ padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: lang === 'el' ? '#1a2e44' : '#dce6f0', background: lang === 'el' ? '#1a2e44' : '#fff', color: lang === 'el' ? '#fff' : '#6b7a8d' }}>EL</button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {activeLinks.map(item => (
              <a key={item.href + item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{ fontSize: 18, fontWeight: 600, color: '#1a2e44', textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                {item.label}
              </a>
            ))}
          </nav>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <a href="/auth/logout" style={{ background: '#FEF2F2', color: '#DC2626', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: '1px solid #FECACA', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                Logout
              </a>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); setLoginModal(true); }} style={{ background: 'transparent', color: '#1a2e44', padding: '12px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: '1.5px solid #1a2e44', cursor: 'pointer' }}>{text.login}</button>
                <button onClick={() => { setMenuOpen(false); setRoleModal(true); }} style={{ background: '#1a2e44', color: '#fff', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>{text.register}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}