'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Search, Check, ChevronDown, ChevronUp, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';

/*
  ConditionPicker
  ───────────────
  Controlled component επιλογής παθήσεων. Δεν γράφει ΤΙΠΟΤΑ στη βάση —
  ο γονέας κρατάει τις επιλογές και αποφασίζει πότε θα αποθηκευτούν.

  Γι' αυτό δουλεύει και στην ΕΓΓΡΑΦΗ, όπου δεν υπάρχει ακόμα therapist_id.

  Props:
    value          — array με condition ids (υποχρεωτικό)
    onChange       — (ids: string[]) => void
    lang           — 'el' | 'en'
    specialty      — string, για auto-suggest βάσει related_specialties
    minRequired    — πόσες χρειάζονται (default 3)
    showDemand     — αν true, δείχνει τη ζήτηση των ασθενών (μόνο στο προφίλ)
    compact        — μικρότερο padding για ενσωμάτωση σε φόρμα
*/

const TX = {
  el: {
    title: 'Παθήσεις που θεραπεύετε',
    subtitle: (n) => `Επιλέξτε τουλάχιστον ${n}. Οι ασθενείς σας βρίσκουν μέσα από αυτές.`,
    searchPh: 'Αναζήτηση πάθησης...',
    selected: (n) => `${n} επιλεγμένες`,
    needMore: (n) => `Χρειάζονται ${n} ακόμα`,
    enough: 'Έτοιμο',
    suggested: 'Προτεινόμενες για την ειδικότητά σας',
    selectAll: 'Επιλογή όλων',
    popular: 'Δημοφιλές',
    demandTitle: 'Τι ζητούν οι ασθενείς',
    demandDesc: 'Παθήσεις με ζήτηση και λίγους διαθέσιμους θεραπευτές.',
    demandRequests: (n) => `${n} ${n === 1 ? 'αίτημα' : 'αιτήματα'}`,
    demandTherapists: (n) => `${n} ${n === 1 ? 'θεραπευτής' : 'θεραπευτές'}`,
    demandGap: 'Χωρίς κάλυψη',
    noResults: 'Δεν βρέθηκαν παθήσεις.',
    loading: 'Φόρτωση...',
  },
  en: {
    title: 'Conditions you treat',
    subtitle: (n) => `Choose at least ${n}. This is how patients find you.`,
    searchPh: 'Search conditions...',
    selected: (n) => `${n} selected`,
    needMore: (n) => `${n} more needed`,
    enough: 'Ready',
    suggested: 'Suggested for your specialty',
    selectAll: 'Select all',
    popular: 'Popular',
    demandTitle: 'What patients are asking for',
    demandDesc: 'Conditions with demand and few available therapists.',
    demandRequests: (n) => `${n} ${n === 1 ? 'request' : 'requests'}`,
    demandTherapists: (n) => `${n} ${n === 1 ? 'therapist' : 'therapists'}`,
    demandGap: 'Uncovered',
    noResults: 'No conditions found.',
    loading: 'Loading...',
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
  const label = (c) => (lang === 'el' ? c.name_el : (c.name_en || c.name_el));
  const desc = (c) => (lang === 'el' ? c.description_el : (c.description_en || c.description_el));

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        {tx.loading}
      </div>
    );
  }

  const pad = compact ? 16 : 20;

  return (
    <div>
      <style>{`
        .cp-cat-btn { width:100%; padding:11px 14px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:10px; font-family:inherit; }
        .cp-chip { display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:999px; font-size:12.5px; font-weight:500; cursor:pointer; transition:all .15s; border:1.5px solid; font-family:inherit; text-align:left; }
        .cp-demand-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px,1fr)); gap:8px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 3 }}>
          <Target size={15} color="#2a6fdb" strokeWidth={2.2} />
          {tx.title}
        </div>
        <div style={{ fontSize: 12, color: '#6b7a8d', lineHeight: 1.5 }}>{tx.subtitle(minRequired)}</div>
      </div>

      {/* Μετρητής */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '9px 14px', borderRadius: 10, marginBottom: 12, flexWrap: 'wrap',
        background: remaining === 0 ? '#F0FDF4' : '#FFFBEB',
        border: `1px solid ${remaining === 0 ? '#BBF7D0' : '#FDE68A'}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: remaining === 0 ? '#15803D' : '#92400E', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {remaining === 0 ? <Check size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={2.2} />}
          {tx.selected(count)}
        </span>
        <span style={{ fontSize: 12, color: remaining === 0 ? '#15803D' : '#92400E', fontWeight: 500 }}>
          {remaining === 0 ? tx.enough : tx.needMore(remaining)}
        </span>
      </div>

      {/* Ζήτηση ασθενών — μόνο στο προφίλ */}
      {showDemand && demand.length > 0 && (
        <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6D28D9', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={13} strokeWidth={2.2} />
            {tx.demandTitle}
          </div>
          <div style={{ fontSize: 11.5, color: '#7C3AED', marginBottom: 10, lineHeight: 1.5 }}>{tx.demandDesc}</div>
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
                    background: isSel ? '#EDE9FE' : '#fff',
                    border: `1.5px solid ${isSel ? '#8B5CF6' : '#E9D5FF'}`,
                    borderRadius: 10, padding: '9px 12px', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a2e44', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isSel && <Check size={11} color="#6D28D9" strokeWidth={3} />}
                    {lang === 'el' ? d.name_el : (d.name_en || d.name_el)}
                  </div>
                  <div style={{ fontSize: 11, color: '#7C3AED' }}>
                    {tx.demandRequests(d.request_count)} · {tx.demandTherapists(d.therapist_count)}
                    {gap && <span style={{ color: '#BE123C', fontWeight: 600 }}> · {tx.demandGap}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-suggest */}
      {unselectedSuggested.length > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1D4ED8', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} strokeWidth={2.2} />
              {tx.suggested}
            </div>
            <div style={{ fontSize: 11.5, color: '#1E40AF' }}>
              {unselectedSuggested.length} {lang === 'el' ? 'προτάσεις' : 'suggestions'}
            </div>
          </div>
          <button type="button" onClick={selectSuggested}
            style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Check size={12} strokeWidth={3} />
            {tx.selectAll}
          </button>
        </div>
      )}

      {/* Αναζήτηση */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} color="#94a3b8" strokeWidth={2} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tx.searchPh}
          style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a2e44', boxSizing: 'border-box' }}
        />
      </div>

      {/* Κατηγορίες */}
      {grouped.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
          {tx.noResults}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {grouped.map(cat => {
            const isOpen = expanded.has(cat.id) || search.trim().length > 0;
            const catSelected = cat.items.filter(c => selected.has(c.id)).length;
            return (
              <div key={cat.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  type="button"
                  className="cp-cat-btn"
                  onClick={() => !search && toggleCategory(cat.id)}
                  style={{
                    background: cat.bg || '#f8fafc',
                    borderBottom: isOpen ? `1px solid ${cat.color || '#e2e8f0'}33` : 'none',
                    cursor: search ? 'default' : 'pointer',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 3, height: 16, borderRadius: 2, background: cat.color || '#2a6fdb', display: 'inline-block' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: cat.color || '#0F172A' }}>
                      {lang === 'el' ? cat.name_el : (cat.name_en || cat.name_el)}
                    </span>
                    {catSelected > 0 && (
                      <span style={{ background: cat.color || '#1D4ED8', color: '#fff', padding: '1px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>
                        {catSelected}
                      </span>
                    )}
                  </span>
                  {!search && (
                    isOpen
                      ? <ChevronUp size={15} color={cat.color || '#64748b'} strokeWidth={2.2} />
                      : <ChevronDown size={15} color={cat.color || '#64748b'} strokeWidth={2.2} />
                  )}
                </button>

                {isOpen && (
                  <div style={{ background: '#fff', padding: pad === 16 ? 12 : 14, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
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
                            background: isSel ? '#F0FDF4' : isSug ? '#FFFBEB' : '#fff',
                            borderColor: isSel ? '#15803D' : isSug ? '#FDE68A' : '#e2e8f0',
                            color: isSel ? '#15803D' : '#475569',
                            fontWeight: isSel ? 600 : 500,
                          }}
                        >
                          {isSel && <Check size={12} strokeWidth={3} />}
                          {label(c)}
                          {c.is_popular && !isSel && (
                            <span style={{ fontSize: 9.5, color: '#2a6fdb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
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