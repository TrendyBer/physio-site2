'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { searchAreas, canonicalArea, phonetic } from '@/lib/areas';
import { ArrowRight, ArrowLeft, MapPin, Plus, X, Info } from 'lucide-react';

/*
  ΒΗΜΑ 3 — Περιοχές εξυπηρέτησης

  Οι περιοχές ζουν στο service_areas (jsonb array) — ΟΧΙ στο `area`,
  που είναι μόνο η έδρα. Το φίλτρο αναζήτησης και το matching διαβάζουν
  αυτή τη λίστα.

  Η αποθήκευση της επίσημης γραφής γίνεται μέσω canonicalArea: αν γράψει
  «kolonaki» ή «κολονακι», μπαίνει «Κολωνάκι». Αλλιώς δύο θεραπευτές που
  εννοούν την ίδια περιοχή δεν θα εμφανίζονται στην ίδια αναζήτηση.
*/

const TX = {
  el: {
    title: 'Περιοχές εξυπηρέτησης',
    desc: 'Πού μπορείς να πηγαίνεις για κατ’ οίκον συνεδρίες.',
    selected: (n) => `Επιλεγμένες περιοχές (${n})`,
    empty: 'Δεν έχεις επιλέξει ακόμα περιοχές. Ξεκίνα γράφοντας παρακάτω.',
    addLabel: 'Προσθήκη περιοχής',
    placeholder: 'π.χ. Παγκράτι, Κολωνάκι...',
    add: 'Προσθήκη',
    hint: 'Πληκτρολόγησε για προτάσεις. Μπορείς να προσθέσεις και δικές σου περιοχές.',
    why: 'Ο ασθενής βλέπει μόνο θεραπευτές που καλύπτουν τη δική του περιοχή. Όσο πιο ρεαλιστική η λίστα, τόσο λιγότερα άσκοπα αιτήματα.',
    continue: 'Συνέχεια',
    back: 'Πίσω',
    saving: 'Αποθήκευση...',
    errMin: 'Πρόσθεσε τουλάχιστον μία περιοχή για να συνεχίσεις',
    errSave: 'Σφάλμα αποθήκευσης: ',
  },
  en: {
    title: 'Service areas',
    desc: 'Where you can travel for home sessions.',
    selected: (n) => `Selected areas (${n})`,
    empty: "You haven't selected any areas yet. Start typing below.",
    addLabel: 'Add an area',
    placeholder: 'e.g. Pangrati, Kolonaki...',
    add: 'Add',
    hint: 'Type to see suggestions. You can also add your own areas.',
    why: 'Patients only see therapists who cover their own area. The more realistic your list, the fewer pointless requests.',
    continue: 'Continue',
    back: 'Back',
    saving: 'Saving...',
    errMin: 'Add at least one area to continue',
    errSave: 'Save error: ',
  },
};

export default function StepAreas({ lang, profile, userId, draft, patchDraft, refreshProfile, onNext, onBack }) {
  const tx = TX[lang] || TX.el;

  const [areas, setAreas] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const existing = Array.isArray(profile?.service_areas) ? profile.service_areas.filter(Boolean) : [];
    if (existing.length > 0) { setAreas(existing); return; }
    // Αν δεν έχει δηλώσει τίποτα, προτείνουμε την έδρα του ως πρώτη περιοχή
    if (profile?.area) setAreas([profile.area]);
  }, [profile]);

  function handleInput(v) {
    setInput(v);
    setSuggestions(v.trim().length > 0 ? searchAreas(v, 6, areas) : []);
  }

  function add(value) {
    const cleaned = (canonicalArea(value) || value).trim();
    if (!cleaned) return;
    if (areas.some(a => phonetic(a) === phonetic(cleaned))) {
      setInput(''); setSuggestions([]); return;
    }
    const next = [...areas, cleaned];
    setAreas(next);
    patchDraft({ areas: next });
    setInput(''); setSuggestions([]);
    setError('');
  }

  function remove(a) {
    const next = areas.filter(x => x !== a);
    setAreas(next);
    patchDraft({ areas: next });
  }

  async function save() {
    if (areas.length === 0) { setError(tx.errMin); return; }

    setSaving(true); setError('');
    const { error: err } = await supabase
      .from('therapist_profiles')
      .update({ service_areas: areas })
      .eq('id', userId);
    setSaving(false);

    if (err) { setError(tx.errSave + err.message); return; }
    await refreshProfile();
    onNext();
  }

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44', background: '#fff' };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{tx.title}</h2>
      <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 22 }}>{tx.desc}</p>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
          {tx.selected(areas.length)}
        </div>
        {areas.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
            {tx.empty}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {areas.map(a => (
              <div key={a} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 30, padding: '6px 8px 6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1D4ED8', fontWeight: 500 }}>
                <MapPin size={12} />
                {a}
                <button type="button" onClick={() => remove(a)}
                  style={{ background: 'transparent', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0, marginLeft: 2, display: 'flex', alignItems: 'center', width: 18, height: 18 }}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>
          {tx.addLabel}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { e.preventDefault(); add(input); } }}
            placeholder={tx.placeholder}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="button" onClick={() => add(input)} disabled={!input.trim()}
            style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: !input.trim() ? '#cbd5e1' : '#1a2e44', color: '#fff', fontSize: 13, fontWeight: 600, cursor: !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Plus size={14} strokeWidth={2.5} />
            {tx.add}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 110, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 240, overflowY: 'auto' }}>
            {suggestions.map(s => (
              <div key={s} onClick={() => add(s)}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: '#0F172A', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={12} color="#94a3b8" />
                {s}
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8 }}>{tx.hint}</div>
      </div>

      <div style={{ marginTop: 20, fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
        <Info size={13} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
        <span>{tx.why}</span>
      </div>

      {error && (
        <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onBack} type="button"
          style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '13px 24px', borderRadius: 30, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <ArrowLeft size={15} />
          {tx.back}
        </button>
        <button onClick={save} disabled={saving}
          style={{ background: '#1a2e44', color: '#fff', border: 'none', padding: '13px 30px', borderRadius: 30, fontSize: 14.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? tx.saving : tx.continue}
          {!saving && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}