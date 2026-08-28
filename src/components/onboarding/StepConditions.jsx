'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ConditionPicker from '@/components/ConditionPicker';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';

/*
  ΒΗΜΑ 2 — Περιστατικά που αναλαμβάνει

  Το ConditionPicker είναι controlled: κρατάει τις επιλογές ο γονέας και
  γράφει ΕΔΩ στη βάση. Το «Συνέχεια» κάνει diff (add/remove) ώστε αν
  γυρίσει πίσω και αλλάξει επιλογές να μη διπλογραφούν εγγραφές.
*/

const MIN_CONDITIONS = 3;
const MAX_RECOMMENDED = 8;

const TX = {
  el: {
    title: 'Περιστατικά που αναλαμβάνεις',
    desc: 'Έτσι σε βρίσκουν οι ασθενείς. Είναι το σημαντικότερο βήμα για το matching.',
    why: 'Χωρίς τουλάχιστον 3 περιστατικά δεν εμφανίζεσαι σε καμία αναζήτηση ασθενή.',
    continue: 'Συνέχεια',
    back: 'Πίσω',
    saving: 'Αποθήκευση...',
    loading: 'Φόρτωση...',
    errMin: (n) => `Επίλεξε τουλάχιστον ${n} περιστατικά για να συνεχίσεις`,
    errSave: 'Σφάλμα αποθήκευσης: ',
  },
  en: {
    title: 'Cases you take on',
    desc: 'This is how patients find you. It is the most important step for matching.',
    why: 'Without at least 3 cases you will not appear in any patient search.',
    continue: 'Continue',
    back: 'Back',
    saving: 'Saving...',
    loading: 'Loading...',
    errMin: (n) => `Select at least ${n} cases to continue`,
    errSave: 'Save error: ',
  },
};

export default function StepConditions({ lang, profile, userId, onNext, onBack }) {
  const tx = TX[lang] || TX.el;

  const [selected, setSelected] = useState([]);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('therapist_conditions')
        .select('condition_id')
        .eq('therapist_id', userId);
      const ids = (data || []).map(r => r.condition_id);
      setSelected(ids);
      setOriginal(ids);
      setLoading(false);
    })();
  }, [userId]);

  async function save() {
    if (selected.length < MIN_CONDITIONS) {
      setError(tx.errMin(MIN_CONDITIONS));
      return;
    }

    setSaving(true); setError('');

    const toAdd = selected.filter(id => !original.includes(id));
    const toRemove = original.filter(id => !selected.includes(id));

    try {
      if (toAdd.length > 0) {
        const { error: e1 } = await supabase
          .from('therapist_conditions')
          .insert(toAdd.map(cid => ({ therapist_id: userId, condition_id: cid })));
        if (e1) throw e1;
      }
      if (toRemove.length > 0) {
        const { error: e2 } = await supabase
          .from('therapist_conditions')
          .delete()
          .eq('therapist_id', userId)
          .in('condition_id', toRemove);
        if (e2) throw e2;
      }
      setOriginal([...selected]);
      setSaving(false);
      onNext();
    } catch (err) {
      console.error('[onboarding] conditions save failed:', err);
      setError(tx.errSave + (err.message || ''));
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{tx.title}</h2>
      <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 22 }}>{tx.desc}</p>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{tx.loading}</div>
      ) : (
        <ConditionPicker
          value={selected}
          onChange={setSelected}
          lang={lang}
          specialty={profile?.specialty || ''}
          minRequired={MIN_CONDITIONS}
          maxRecommended={MAX_RECOMMENDED}
          showDemand={true}
        />
      )}

      <div style={{ marginTop: 18, fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
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
        <button onClick={save} disabled={saving || loading}
          style={{ background: '#1a2e44', color: '#fff', border: 'none', padding: '13px 30px', borderRadius: 30, fontSize: 14.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? tx.saving : tx.continue}
          {!saving && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}