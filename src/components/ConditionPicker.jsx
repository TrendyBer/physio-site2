'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { C, R as RAD, T, card, badge } from '@/lib/tokens';
import { Target, Search, Check, ChevronDown, ChevronUp, AlertCircle, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

/*
  ConditionPicker
  ───────────────
  Controlled component επιλογής περιστατικών. Δεν γράφει ΤΙΠΟΤΑ στη βάση —
  ο γονέας κρατάει τις επιλογές και αποφασίζει πότε θα αποθηκευτούν.

  Γι' αυτό δουλεύει και στην ΕΓΓΡΑΦΗ, όπου δεν υπάρχει ακόμα therapist_id.

  ΟΡΟΛΟΓΙΑ: λέμε «περιστατικά που αναλαμβάνεις», όχι «παθήσεις που
  θεραπεύεις». Ο φυσικοθεραπευτής δεν διαγιγνώσκει και δεν «θεραπεύει
  παθήσεις» — αναλαμβάνει περιστατικά. Η ίδια διατύπωση χρησιμοποιείται
  και στην εγγραφή και στο προφίλ.

  ΟΡΙΟ: υπάρχει συνιστώμενο ανώτατο όριο. Αν ο θεραπευτής τσεκάρει τα
  πάντα, το matching χάνει κάθε νόημα και ο ασθενής βλέπει τους ίδιους
  δέκα ανθρώπους σε κάθε αναζήτηση. Το όριο είναι προειδοποίηση, όχι
  φράγμα — δεν μπλοκάρουμε κάποιον με πραγματικά ευρύ αντικείμενο.

  Props:
    value          — array με condition ids (υποχρεωτικό)
    onChange       — (ids: string[]) => void
    lang           — 'el' | 'en'
    specialty      — string, για auto-suggest βάσει related_specialties
    minRequired    — πόσα χρειάζονται (default 3)
    maxRecommended — πάνω από πόσα προειδοποιούμε (default 8)
    showDemand     — αν true, δείχνει τη ζήτηση των ασθενών (μόνο στο προφίλ)
    compact        — μικρότερο padding για ενσωμάτωση σε φόρμα
*/

const TX = {
  el: {
    title: 'Περιστατικά που αναλαμβάνετε',
    subtitle: (n, m) => `Επιλέξτε τουλάχιστον ${n}, ιδανικά έως ${m}. Οι ασθενείς σας βρίσκουν μέσα από αυτά.`,
    searchPh: 'Αναζήτηση περιστατικού...',
    selected: (n) => `${n} επιλεγμένα`,
    needMore: (n) => `Χρειάζονται ${n} ακόμα`,
    enough: 'Έτοιμο',
    overLimit: (m) => `Πάνω από ${m}`,
    warnTitle: (n, m) => `Έχετε επιλέξει ${n} περιστατικά — προτείνουμε έως ${m}.`,
    warnBody: 'Όταν επιλέγετε σχεδόν τα πάντα, το προφίλ σας δεν ξεχωρίζει σε καμία αναζήτηση. Κρατήστε αυτά που πράγματι αναλαμβάνετε τακτικά.',
    suggested: 'Προτεινόμενα για την ειδικότητά σας',
    selectAll: 'Επιλογή όλων',
    popular: 'Δημοφιλές',
    demandTitle: 'Τι ζητούν οι ασθενείς',
    demandDesc: 'Περιστατικά με ζήτηση και λίγους διαθέσιμους θεραπευτές.',
    demandRequests: (n) => `${n} ${n === 1 ? 'αίτημα' : 'αιτήματα'}`,
    demandTherapists: (n) => `${n} ${n === 1 ? 'θεραπευτής' : 'θεραπευτές'}`,
    demandGap: 'Χωρίς κάλυψη',
    noResults: 'Δεν βρέθηκαν περιστατικά.',
    loading: 'Φόρτωση...',
    suggestionsWord: 'προτάσεις',
  },
  en: {
    title: 'Cases you take on',
    subtitle: (n, m) => `Choose at least ${n}, ideally up to ${m}. This is how patients find you.`,
    searchPh: 'Search cases...',
    selected: (n) => `${n} selected`,
    needMore: (n) => `${n} more needed`,
    enough: 'Ready',
    overLimit: (m) => `Over ${m}`,
    warnTitle: (n, m) => `You have selected ${n} cases — we recommend up to ${m}.`,
    warnBody: "When you select almost everything, your profile stands out in no search at all. Keep the ones you genuinely take on regularly.",
    suggested: 'Suggested for your specialty',
    selectAll: 'Select all',
    popular: 'Popular',
    demandTitle: 'What patients are asking for',
    demandDesc: 'Cases with demand and few available therapists.',
    demandRequests: (n) => `${n} ${n === 1 ? 'request' : 'requests'}`,
    demandTherapists: (n) => `${n} ${n === 1 ? 'therapist' : 'therapists'}`,
    demandGap: 'Uncovered',
    noResults: 'No cases found.',
    loading: 'Loading...',
    suggestionsWord: 'suggestions',
  },
};

function norm(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function ConditionPicker({
  value = [],
  onChange,
  lang = 'el',
  specialty = '',
  minRequired = 3,
  maxRecommended = 8,
  showDemand = false,
  compact = false,
}) {
  const tx = TX[lang] || TX.el;

  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [demand, setDemand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const selected = useMemo(() => new Set(value || []), [value]);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: conds }] = await Promise.all([
        supabase.from('condition_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('conditions')
          .select('id, slug, name_el, name_en, description_el, description_en, category_id, is_popular, related_specialties, display_order')
          .eq('is_active', true)
          .order('display_order'),
      ]);

      setCategories(cats || []);
      setConditions(conds || []);

      // Ανοίγουμε τις κατηγορίες που έχουν ήδη επιλογές
      const open = new Set();
      (cats || []).forEach(cat => {
        const has = (conds || []).some(c => c.category_id === cat.id && selected.has(c.id));
        if (has) open.add(cat.id);
      });
      // Αν δεν υπάρχει καμία επιλογή, ανοίγουμε την πρώτη κατηγορία
      if (open.size === 0 && (cats || []).length > 0) open.add(cats[0].id);
      setExpanded(open);

      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ζήτηση ασθενών — μόνο όπου ζητηθεί ρητά (προφίλ, όχι εγγραφή)
  useEffect(() => {
    if (!showDemand) return;
    (async () => {
      const { data, error } = await supabase.rpc('get_condition_demand', { p_limit: 8 });
      if (!error && data) setDemand(data);
    })();
  }, [showDemand]);

  const suggestedIds = useMemo(() => {
    const spec = norm(specialty);
    if (!spec || spec.length < 3) return new Set();
    const ids = conditions
      .filter(c => (c.related_specialties || []).some(r => {
        const rn = norm(r);
        return rn.includes(spec) || spec.includes(rn);
      }))
      .map(c => c.id);
    return new Set(ids);
  }, [specialty, conditions]);

  const unselectedSuggested = useMemo(
    () => [...suggestedIds].filter(id => !selected.has(id)),
    [suggestedIds, selected]
  );

  const grouped = useMemo(() => {
    const q = norm(search);
    return categories.map(cat => {
      let items = conditions.filter(c => c.category_id === cat.id);
      if (q) {
        items = items.filter(c => {
          const hay = norm(`${c.name_el} ${c.name_en} ${c.description_el || ''} ${c.description_en || ''}`);
          return hay.includes(q);
        });
      }
      return { ...cat, items };
    }).filter(cat => cat.items.length > 0);
  }, [categories, conditions, search]);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.([...next]);
  }

  function toggleCategory(catId) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function selectSuggested() {
    const next = new Set(selected);
    suggestedIds.forEach(id => next.add(id));
    onChange?.([...next]);
  }

  const count = selected.size;
  const remaining = Math.max(0, minRequired - count);
  const overLimit = count > maxRecommended;
  const label = (c) => (lang === 'el' ? c.name_el : (c.name_en || c.name_el));
  const desc = (c) => (lang === 'el' ? c.description_el : (c.description_en || c.description_el));

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C.textFaint, fontSize: 13 }}>
        {tx.loading}
      </div>
    );
  }

  const pad = compact ? 16 : 20;

  // Τρεις καταστάσεις μετρητή: λείπουν / εντάξει / πάρα πολλά
  const counterStyle = overLimit
    ? { bg: C.warnBg, border: C.warnBorder, color: C.warn }
    : remaining === 0
      ? { bg: C.successBg, border: C.successBorder, color: C.success }
      : { bg: C.warnBg, border: C.warnBorder, color: C.warn };

  return (
    <div>
      <style>{`
        .cp-cat-btn { width:100%; padding:11px 14px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:10px; font-family:inherit; }
        .cp-chip { display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:999px; font-size:12.5px; font-weight:500; cursor:pointer; transition:all .15s; border:1.5px solid; font-family:inherit; text-align:left; }
        .cp-demand-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px,1fr)); gap:8px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: C.brand, marginBottom: 3 }}>
          <Target size={15} color={C.accent} strokeWidth={2.2} />
          {tx.title}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{tx.subtitle(minRequired, maxRecommended)}</div>
      </div>

      {/* Μετρητής */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '9px 14px', borderRadius: RAD.input, marginBottom: overLimit ? 8 : 12, flexWrap: 'wrap',
        background: counterStyle.bg,
        border: `1px solid ${counterStyle.border}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: counterStyle.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {overLimit
            ? <AlertTriangle size={14} strokeWidth={2.4} />
            : remaining === 0
              ? <Check size={14} strokeWidth={3} />
              : <AlertCircle size={14} strokeWidth={2.2} />}
          {tx.selected(count)}
        </span>
        <span style={{ fontSize: 12, color: counterStyle.color, fontWeight: 500 }}>
          {overLimit ? tx.overLimit(maxRecommended) : remaining === 0 ? tx.enough : tx.needMore(remaining)}
        </span>
      </div>

      {/* Προειδοποίηση υπέρβασης — δεν μπλοκάρει, εξηγεί το κόστος */}
      {overLimit && (
        <div style={{
          background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: RAD.input,
          padding: '11px 14px', marginBottom: 12, display: 'flex', gap: 9, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={15} color={C.warn} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.warn, marginBottom: 3 }}>
              {tx.warnTitle(count, maxRecommended)}
            </div>
            <div style={{ fontSize: 11.5, color: C.warn, lineHeight: 1.55 }}>{tx.warnBody}</div>
          </div>
        </div>
      )}

      {/* Ζήτηση ασθενών — μόνο στο προφίλ */}
      {showDemand && demand.length > 0 && (
        <div style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: RAD.button, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.info, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={13} strokeWidth={2.2} />
            {tx.demandTitle}
          </div>
          <div style={{ fontSize: 11.5, color: C.info, marginBottom: 10, lineHeight: 1.5 }}>{tx.demandDesc}</div>
          <div className="cp-demand-grid">
            {demand.map(d => {
              const isSel = selected.has(d.condition_id);
              const gap = Number(d.request_count) > 0 && Number(d.therapist_count) === 0;
              return (
                <button
                  key={d.condition_id}
                  type="button"
                  onClick={() => toggle(d.condition_id)}
                  style={{
                    background: isSel ? C.infoBg : C.surface,
                    border: `1.5px solid ${isSel ? C.info : C.infoBorder}`,
                    borderRadius: RAD.input, padding: '9px 12px', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.brand, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isSel && <Check size={11} color={C.info} strokeWidth={3} />}
                    {lang === 'el' ? d.name_el : (d.name_en || d.name_el)}
                  </div>
                  <div style={{ fontSize: 11, color: C.info }}>
                    {tx.demandRequests(d.request_count)} · {tx.demandTherapists(d.therapist_count)}
                    {gap && <span style={{ color: C.danger, fontWeight: 600 }}> · {tx.demandGap}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-suggest */}
      {unselectedSuggested.length > 0 && (
        <div style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: RAD.button, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.info, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} strokeWidth={2.2} />
              {tx.suggested}
            </div>
            <div style={{ fontSize: 11.5, color: C.info }}>
              {unselectedSuggested.length} {tx.suggestionsWord}
            </div>
          </div>
          <button type="button" onClick={selectSuggested}
            style={{ background: C.info, color: C.surface, border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Check size={12} strokeWidth={3} />
            {tx.selectAll}
          </button>
        </div>
      )}

      {/* Αναζήτηση */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} color={C.textFaint} strokeWidth={2} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tx.searchPh}
          style={{ width: '100%', padding: '10px 14px 10px 36px', border: `1.5px solid ${C.border}`, borderRadius: RAD.input, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.brand, boxSizing: 'border-box' }}
        />
      </div>

      {/* Κατηγορίες */}
      {grouped.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: C.textFaint, fontSize: 13, fontStyle: 'italic' }}>
          {tx.noResults}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {grouped.map(cat => {
            const isOpen = expanded.has(cat.id) || search.trim().length > 0;
            const catSelected = cat.items.filter(c => selected.has(c.id)).length;
            return (
              <div key={cat.id} style={{ border: `1px solid ${C.border}`, borderRadius: RAD.input, overflow: 'hidden' }}>
                <button
                  type="button"
                  className="cp-cat-btn"
                  onClick={() => !search && toggleCategory(cat.id)}
                  style={{
                    background: isOpen ? C.surfaceAlt : C.surface,
                    borderBottom: isOpen ? `1px solid ${C.borderSoft}` : 'none',
                    cursor: search ? 'default' : 'pointer',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 3, height: 16, borderRadius: 2, background: catSelected > 0 ? C.accent : C.border, display: 'inline-block' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>
                      {lang === 'el' ? cat.name_el : (cat.name_en || cat.name_el)}
                    </span>
                    {catSelected > 0 && (
                      <span style={{ ...badge('active'), height: 19, padding: '0 8px', fontSize: 10.5 }}>
                        {catSelected}
                      </span>
                    )}
                  </span>
                  {!search && (
                    isOpen
                      ? <ChevronUp size={15} color={C.textMuted} strokeWidth={2.2} />
                      : <ChevronDown size={15} color={C.textMuted} strokeWidth={2.2} />
                  )}
                </button>

                {isOpen && (
                  <div style={{ background: C.surface, padding: pad === 16 ? 12 : 14, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {cat.items.map(c => {
                      const isSel = selected.has(c.id);
                      const isSug = suggestedIds.has(c.id) && !isSel;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className="cp-chip"
                          onClick={() => toggle(c.id)}
                          title={desc(c) || ''}
                          style={{
                            background: isSel ? C.successBg : isSug ? C.warnBg : C.surface,
                            borderColor: isSel ? C.success : isSug ? C.warnBorder : C.border,
                            color: isSel ? C.success : C.textBody,
                            fontWeight: isSel ? 600 : 500,
                            opacity: overLimit && !isSel ? 0.55 : 1,
                          }}
                        >
                          {isSel && <Check size={12} strokeWidth={3} />}
                          {label(c)}
                          {c.is_popular && !isSel && (
                            <span style={{ fontSize: 9.5, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                              {tx.popular}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}