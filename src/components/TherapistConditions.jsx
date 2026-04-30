'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * TherapistConditions — Component που επιτρέπει στον therapist να tagάρει
 * τα conditions στα οποία εξειδικεύεται.
 *
 * Props:
 * - userId: το auth.uid() του therapist
 * - specialty: η specialty του therapist (για auto-suggest)
 *
 * Πώς λειτουργεί:
 * - Φορτώνει όλα τα ενεργά conditions από DB, grouped by category
 * - Φορτώνει τα ήδη επιλεγμένα conditions από therapist_conditions
 * - Save/delete entries με optimistic UI updates
 */

export default function TherapistConditions({ userId, specialty }) {
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [originalIds, setOriginalIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [savedMsg, setSavedMsg] = useState(null);

  useEffect(() => {
    if (!userId) return;
    loadAll();
  }, [userId]);

  async function loadAll() {
    setLoading(true);

    // Categories
    const { data: cats } = await supabase
      .from('condition_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // All conditions
    const { data: conds } = await supabase
      .from('conditions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Selected conditions του therapist
    const { data: tagged } = await supabase
      .from('therapist_conditions')
      .select('condition_id')
      .eq('therapist_id', userId);

    setCategories(cats || []);
    setConditions(conds || []);
    const ids = new Set((tagged || []).map((t) => t.condition_id));
    setSelectedIds(ids);
    setOriginalIds(ids);

    // Auto-expand categories που έχουν ήδη επιλεγμένα
    const expanded = new Set();
    (cats || []).forEach((cat) => {
      const hasSelected = (conds || []).some(
        (c) => c.category_id === cat.id && ids.has(c.id)
      );
      if (hasSelected) expanded.add(cat.id);
    });
    setExpandedCategories(expanded);

    setLoading(false);
  }

  // Auto-suggest από specialty: conditions που έχουν την specialty στο related_specialties
  const suggestedIds = useMemo(() => {
    if (!specialty) return new Set();
    const spec = specialty.toLowerCase().trim();
    const suggested = conditions.filter((c) => {
      const related = (c.related_specialties || []).map((r) => (r || '').toLowerCase());
      return related.some((r) => r.includes(spec) || spec.includes(r));
    });
    return new Set(suggested.map((c) => c.id));
  }, [specialty, conditions]);

  // Group conditions by category, με search filter
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.map((cat) => {
      let catConditions = conditions.filter((c) => c.category_id === cat.id);

      if (q) {
        catConditions = catConditions.filter((c) => {
          const nameEl = (c.name_el || '').toLowerCase();
          const nameEn = (c.name_en || '').toLowerCase();
          const aliasesEl = (c.aliases_el || []).map((a) => (a || '').toLowerCase());
          const aliasesEn = (c.aliases_en || []).map((a) => (a || '').toLowerCase());
          return (
            nameEl.includes(q) ||
            nameEn.includes(q) ||
            aliasesEl.some((a) => a.includes(q)) ||
            aliasesEn.some((a) => a.includes(q))
          );
        });
      }

      return { ...cat, items: catConditions };
    }).filter((c) => c.items.length > 0); // hide categories χωρίς matches
  }, [categories, conditions, search]);

  function toggleCondition(conditionId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conditionId)) next.delete(conditionId);
      else next.add(conditionId);
      return next;
    });
  }

  function toggleCategory(catId) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function expandAll() {
    setExpandedCategories(new Set(categories.map((c) => c.id)));
  }

  function collapseAll() {
    setExpandedCategories(new Set());
  }

  function selectSuggested() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      suggestedIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function saveChanges() {
    if (!userId) return;
    setSaving(true);
    setSavedMsg(null);

    const toAdd = [...selectedIds].filter((id) => !originalIds.has(id));
    const toRemove = [...originalIds].filter((id) => !selectedIds.has(id));

    try {
      // Insert νέα tags
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('therapist_conditions')
          .insert(toAdd.map((cid) => ({ therapist_id: userId, condition_id: cid })));
        if (insertError) throw insertError;
      }

      // Delete αφαιρεμένα tags
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('therapist_conditions')
          .delete()
          .eq('therapist_id', userId)
          .in('condition_id', toRemove);
        if (deleteError) throw deleteError;
      }

      setOriginalIds(new Set(selectedIds));
      setSavedMsg({ type: 'success', text: `✓ Αποθηκεύτηκαν ${selectedIds.size} ${selectedIds.size === 1 ? 'πάθηση' : 'παθήσεις'}` });
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setSavedMsg({ type: 'error', text: 'Σφάλμα αποθήκευσης: ' + (err.message || 'Άγνωστο') });
    }
    setSaving(false);
  }

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== originalIds.size) return true;
    for (const id of selectedIds) {
      if (!originalIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, originalIds]);

  const unsuggestedIds = useMemo(() => {
    return [...suggestedIds].filter((id) => !selectedIds.has(id));
  }, [suggestedIds, selectedIds]);

  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748B' }}>
        Φόρτωση παθήσεων...
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
        🎯 Παθήσεις που Θεραπεύω
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
        Επιλέξτε τις παθήσεις στις οποίες εξειδικεύεστε. Οι ασθενείς που ψάχνουν αυτές τις παθήσεις θα σας βλέπουν με σήμα <strong style={{ color: '#15803D' }}>✓ Εξειδικεύεται</strong> στα αποτελέσματα.
      </div>

      {/* Strategic info box */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
        💡 <strong>Tip:</strong> Όσο πιο συγκεκριμένος είστε, τόσο πιο σχετικά αιτήματα θα λαμβάνετε. Επιλέξτε μόνο παθήσεις στις οποίες έχετε πραγματική εμπειρία.
      </div>

      {/* Auto-suggest banner */}
      {unsuggestedIds.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
              ✨ Προτάσεις βάσει της ειδικότητάς σας
            </div>
            <div style={{ fontSize: 12, color: '#78350F' }}>
              Βρήκαμε <strong>{unsuggestedIds.length}</strong> {unsuggestedIds.length === 1 ? 'πάθηση' : 'παθήσεις'} που σχετίζονται με «{specialty || 'την ειδικότητά σας'}».
            </div>
          </div>
          <button
            onClick={selectSuggested}
            style={{ background: '#92400E', color: '#fff', border: 'none', borderRadius: 30, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            ✓ Επιλογή όλων
          </button>
        </div>
      )}

      {/* Search + Stats + Expand controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Αναζήτηση πάθησης..."
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0F172A' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={expandAll}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ⊕ Όλα
          </button>
          <button
            onClick={collapseAll}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ⊖ Σύμπτυξη
          </button>
        </div>
      </div>

      {/* Counter */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          <strong style={{ color: '#0F172A' }}>{selectedIds.size}</strong> παθήσεις επιλεγμένες
        </span>
        {selectedIds.size === 0 && (
          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Επιλέξτε τουλάχιστον 1 για καλύτερα αποτελέσματα</span>
        )}
      </div>

      {/* Categories with conditions */}
      {grouped.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
          Δεν βρέθηκαν παθήσεις. Δοκιμάστε διαφορετικούς όρους.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grouped.map((cat) => {
            const isExpanded = expandedCategories.has(cat.id) || search.trim().length > 0;
            const selectedInCat = cat.items.filter((c) => selectedIds.has(c.id)).length;
            return (
              <div key={cat.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => !search && toggleCategory(cat.id)}
                  disabled={!!search}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: cat.bg || '#f8fafc',
                    border: 'none',
                    borderBottom: isExpanded ? `1px solid ${cat.color || '#e2e8f0'}33` : 'none',
                    cursor: search ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon || '🏷️'}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cat.color || '#0F172A' }}>{cat.name_el}</span>
                    {selectedInCat > 0 && (
                      <span style={{ background: cat.color || '#1D4ED8', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {selectedInCat}
                      </span>
                    )}
                  </div>
                  {!search && (
                    <span style={{ fontSize: 14, color: cat.color || '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                  )}
                </button>

                {isExpanded && (
                  <div style={{ background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cat.items.map((c) => {
                      const isSelected = selectedIds.has(c.id);
                      const isSuggested = suggestedIds.has(c.id) && !isSelected;
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '10px 12px',
                            background: isSelected ? '#F0FDF4' : isSuggested ? '#FFFBEB' : '#fff',
                            border: `1px solid ${isSelected ? '#BBF7D0' : isSuggested ? '#FDE68A' : '#f1f5f9'}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'background .1s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCondition(c.id)}
                            style={{ marginTop: 2, accentColor: '#15803D', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {c.name_el}
                              {isSuggested && (
                                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                                  ✨ Προτεινόμενο
                                </span>
                              )}
                              {c.is_popular && (
                                <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                                  Δημοφιλές
                                </span>
                              )}
                            </div>
                            {c.description_el && (
                              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{c.description_el}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save bar */}
      {(hasChanges || savedMsg) && (
        <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {savedMsg ? (
            <div
              style={{
                background: savedMsg.type === 'success' ? '#D1FAE5' : '#FEF2F2',
                border: `1px solid ${savedMsg.type === 'success' ? '#86EFAC' : '#FECACA'}`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                color: savedMsg.type === 'success' ? '#15803D' : '#DC2626',
                fontWeight: 600,
                flex: 1,
              }}
            >
              {savedMsg.text}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#64748B', flex: 1 }}>
              📝 Έχετε αλλαγές χωρίς αποθήκευση
            </div>
          )}
          {hasChanges && (
            <button
              onClick={saveChanges}
              disabled={saving}
              style={{
                background: '#1a2e44',
                color: '#fff',
                border: 'none',
                padding: '11px 28px',
                borderRadius: 30,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: saving ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {saving ? 'Αποθήκευση...' : '💾 Αποθήκευση'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}