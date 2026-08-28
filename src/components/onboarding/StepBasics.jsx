'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Info } from 'lucide-react';

/*
  ΒΗΜΑ 1 — Βασικά επαγγελματικά στοιχεία

  Η ΠΟΛΗ δηλώθηκε στην εγγραφή και εμφανίζεται μόνο για ανάγνωση.
  Αλλάζει από τις ρυθμίσεις του προφίλ, όχι εδώ: είναι απόφαση που
  επηρεάζει ολόκληρο το matching και δεν πρέπει να αλλάζει κατά λάθος
  ενώ ο θεραπευτής συμπληρώνει την τιμή του.
*/

const PRICE_MIN = 25;
const PRICE_MAX = 50;

const TX = {
  el: {
    title: 'Βασικά επαγγελματικά στοιχεία',
    desc: 'Τρία στοιχεία που βλέπει ο ασθενής πριν σε επιλέξει.',
    city: 'Πόλη',
    cityLocked: 'Δηλώθηκε στην εγγραφή. Αλλάζει από τις ρυθμίσεις του προφίλ.',
    baseArea: 'Περιοχή έδρας',
    baseAreaPh: 'π.χ. Νέα Σμύρνη',
    baseAreaHint: 'Από πού ξεκινάς για τις επισκέψεις. Τις περιοχές που εξυπηρετείς θα τις δηλώσεις στο βήμα 3.',
    years: 'Χρόνια εμπειρίας',
    yearsPh: 'π.χ. 5',
    price: 'Τιμή συνεδρίας',
    priceHint: (min, max) => `Από ${min}€ έως ${max}€. Ο ασθενής σε πληρώνει απευθείας σε μετρητά μετά τη συνεδρία — κρατάς ολόκληρο το ποσό.`,
    continue: 'Συνέχεια',
    saving: 'Αποθήκευση...',
    errArea: 'Συμπλήρωσε την περιοχή έδρας',
    errPrice: (min, max) => `Η τιμή πρέπει να είναι από ${min}€ έως ${max}€`,
    errSave: 'Σφάλμα αποθήκευσης: ',
  },
  en: {
    title: 'Basic professional details',
    desc: 'Three things a patient sees before choosing you.',
    city: 'City',
    cityLocked: 'Set during registration. Change it from your profile settings.',
    baseArea: 'Base area',
    baseAreaPh: 'e.g. Nea Smyrni',
    baseAreaHint: 'Where you set out from for visits. You will declare the areas you serve in step 3.',
    years: 'Years of experience',
    yearsPh: 'e.g. 5',
    price: 'Session price',
    priceHint: (min, max) => `Between €${min} and €${max}. The patient pays you directly in cash after the session — you keep the full amount.`,
    continue: 'Continue',
    saving: 'Saving...',
    errArea: 'Please fill in your base area',
    errPrice: (min, max) => `Price must be between €${min} and €${max}`,
    errSave: 'Save error: ',
  },
};

export default function StepBasics({ lang, profile, userId, draft, patchDraft, refreshProfile, onNext }) {
  const tx = TX[lang] || TX.el;

  const [area, setArea] = useState('');
  const [years, setYears] = useState('');
  const [price, setPrice] = useState('');
  const [cityName, setCityName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Προτεραιότητα: ό,τι έχει ήδη αποθηκευτεί στο προφίλ, μετά το draft.
  useEffect(() => {
    setArea(profile?.area ?? draft.area ?? '');
    setYears(profile?.years_experience != null ? String(profile.years_experience) : (draft.years ?? ''));
    setPrice(profile?.price_per_session != null ? String(profile.price_per_session) : (draft.price ?? ''));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile?.city_id) return;
    (async () => {
      const { data } = await supabase
        .from('cities')
        .select('name_el, name_en')
        .eq('id', profile.city_id)
        .maybeSingle();
      if (data) setCityName(lang === 'en' ? (data.name_en || data.name_el) : data.name_el);
    })();
  }, [profile?.city_id, lang]);

  async function save() {
    const cleanArea = area.trim();
    const p = parseFloat(price);

    if (!cleanArea) { setError(tx.errArea); return; }
    if (!Number.isFinite(p) || p < PRICE_MIN || p > PRICE_MAX) {
      setError(tx.errPrice(PRICE_MIN, PRICE_MAX)); return;
    }

    setSaving(true); setError('');

    const { error: err } = await supabase.from('therapist_profiles').update({
      area: cleanArea,
      years_experience: years === '' ? null : parseInt(years, 10),
      price_per_session: p,
    }).eq('id', userId);

    setSaving(false);
    if (err) { setError(tx.errSave + err.message); return; }

    await refreshProfile();
    onNext();
  }

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44', background: '#fff' };
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 };
  const hintStyle = { fontSize: 11.5, color: '#94a3b8', marginTop: 6, lineHeight: 1.55 };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{tx.title}</h2>
      <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 24 }}>{tx.desc}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {cityName && (
          <div>
            <label style={labelStyle}>{tx.city}</label>
            <div style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center' }}>
              {cityName}
            </div>
            <div style={hintStyle}>{tx.cityLocked}</div>
          </div>
        )}

        <div>
          <label style={labelStyle}>{tx.baseArea} *</label>
          <input
            value={area}
            onChange={e => { setArea(e.target.value); patchDraft({ area: e.target.value }); }}
            placeholder={tx.baseAreaPh}
            style={inputStyle}
          />
          <div style={hintStyle}>{tx.baseAreaHint}</div>
        </div>

        <div>
          <label style={labelStyle}>{tx.years}</label>
          <input
            type="number" min={0} max={60}
            value={years}
            onChange={e => { setYears(e.target.value); patchDraft({ years: e.target.value }); }}
            placeholder={tx.yearsPh}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>{tx.price} *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number" min={PRICE_MIN} max={PRICE_MAX}
              value={price}
              onChange={e => { setPrice(e.target.value); patchDraft({ price: e.target.value }); }}
              style={{ ...inputStyle, paddingRight: 36 }}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15, pointerEvents: 'none' }}>€</span>
          </div>
          <div style={{ ...hintStyle, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{tx.priceHint(PRICE_MIN, PRICE_MAX)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 18, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving}
          style={{ background: '#1a2e44', color: '#fff', border: 'none', padding: '13px 30px', borderRadius: 30, fontSize: 14.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? tx.saving : tx.continue}
          {!saving && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}