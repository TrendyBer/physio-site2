'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Reusable component for condition-based search.
 *
 * Props:
 * - lang: 'el' | 'en' (default 'el')
 * - value: { id, slug, name } | null  (currently selected condition)
 * - onChange: (condition | null) => void
 * - placeholder?: string (overrides default)
 * - autoFocus?: boolean
 * - showChips?: boolean (default true) — whether to show popular chips
 * - compact?: boolean (default false) — smaller styling for embedding in filters
 *
 * Search logic:
 * - Matches name_el, name_en, aliases_el, aliases_en (case-insensitive)
 * - Καλλίτερο match score = exact name > alias match > partial match
 */

const TX = {
  el: {
    placeholder: '🔍 Περιγράψτε το πρόβλημά σας... (π.χ. πόνος μέσης, αυχενικό)',
    placeholderCompact: '🔍 Πόνος, πάθηση, σύνδρομο...',
    popular: 'Δημοφιλείς αναζητήσεις',
    noMatches: 'Δεν βρέθηκαν παθήσεις. Δοκιμάστε διαφορετικούς όρους.',
    clear: 'Καθαρισμός',
    selected: 'Επιλέχθηκε',
  },
  en: {
    placeholder: '🔍 Describe your problem... (e.g. back pain, neck stiffness)',
    placeholderCompact: '🔍 Pain, condition, syndrome...',
    popular: 'Popular searches',
    noMatches: 'No conditions found. Try different terms.',
    clear: 'Clear',
    selected: 'Selected',
  },
};

export default function ConditionSearch({
  lang = 'el',
  value = null,
  onChange,
  placeholder,
  autoFocus = false,
  showChips = true,
  compact = false,
}) {
  const tx = TX[lang] || TX.el;
  const [query, setQuery] = useState('');
  const [conditions, setConditions] = useState([]);
  const [popularConditions, setPopularConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Load conditions από Supabase
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('conditions')
        .select('id, slug, name_el, name_en, aliases_el, aliases_en, description_el, description_en, related_specialties, is_popular, category_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!active) return;
      if (error) {
        console.error('ConditionSearch fetch error:', error);
        setConditions([]);
        setPopularConditions([]);
      } else {
        setConditions(data || []);
        setPopularConditions((data || []).filter((c) => c.is_popular));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Click outside → close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search/filter logic με score-based ranking
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const scored = conditions
      .map((c) => {
        const nameEl = (c.name_el || '').toLowerCase();
        const nameEn = (c.name_en || '').toLowerCase();
        const aliasesEl = (c.aliases_el || []).map((a) => (a || '').toLowerCase());
        const aliasesEn = (c.aliases_en || []).map((a) => (a || '').toLowerCase());

        let score = 0;
        // Exact name match
        if (nameEl === q || nameEn === q) score = 100;
        // Name starts with
        else if (nameEl.startsWith(q) || nameEn.startsWith(q)) score = 80;
        // Name contains
        else if (nameEl.includes(q) || nameEn.includes(q)) score = 60;
        // Alias exact
        else if (aliasesEl.includes(q) || aliasesEn.includes(q)) score = 70;
        // Alias starts with
        else if (
          aliasesEl.some((a) => a.startsWith(q)) ||
          aliasesEn.some((a) => a.startsWith(q))
        )
          score = 50;
        // Alias contains
        else if (aliasesEl.some((a) => a.includes(q)) || aliasesEn.some((a) => a.includes(q)))
          score = 40;

        return { condition: c, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return scored.map((m) => m.condition);
  }, [query, conditions]);

  // Reset highlight όταν αλλάζουν τα matches
  useEffect(() => {
    setHighlightIdx(0);
  }, [matches.length]);

  function handleSelect(condition) {
    if (!condition) return;
    const formatted = {
      id: condition.id,
      slug: condition.slug,
      name: lang === 'el' ? condition.name_el : condition.name_en,
      related_specialties: condition.related_specialties || [],
    };
    onChange?.(formatted);
    setQuery('');
    setShowDropdown(false);
  }

  function handleClear() {
    onChange?.(null);
    setQuery('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!showDropdown || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(matches[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  const inputPadding = compact ? '10px 14px' : '14px 16px';
  const inputFontSize = compact ? 13 : 15;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selected state — chip με όνομα + X button */}
      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: inputPadding,
            border: '1.5px solid #2a6fdb',
            background: '#EFF6FF',
            borderRadius: 10,
            fontSize: inputFontSize,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 14 }}>🎯</span>
            <span style={{ fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value.name}
            </span>
          </div>
          <button
            onClick={handleClear}
            type="button"
            style={{
              background: '#fff',
              border: '1px solid #BFDBFE',
              borderRadius: 999,
              width: 26,
              height: 26,
              fontSize: 14,
              cursor: 'pointer',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
            title={tx.clear}
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (compact ? tx.placeholderCompact : tx.placeholder)}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            padding: inputPadding,
            border: '1.5px solid #e2e8f0',
            borderRadius: 10,
            fontSize: inputFontSize,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1a2e44',
          }}
        />
      )}

      {/* Dropdown με matches */}
      {showDropdown && !value && query.trim() && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 100,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>...</div>
          ) : matches.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>{tx.noMatches}</div>
          ) : (
            matches.map((c, idx) => {
              const name = lang === 'el' ? c.name_el : c.name_en;
              const desc = lang === 'el' ? c.description_el : c.description_en;
              const isHighlighted = idx === highlightIdx;
              return (
                <div
                  key={c.id}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onClick={() => handleSelect(c)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: isHighlighted ? '#EFF6FF' : '#fff',
                    borderBottom: idx < matches.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2e44', marginBottom: 2 }}>{name}</div>
                  {desc && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{desc}</div>}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Popular chips */}
      {showChips && !value && popularConditions.length > 0 && !query.trim() && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            {tx.popular}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {popularConditions.map((c) => {
              const name = lang === 'el' ? c.name_el : c.name_en;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  style={{
                    padding: '6px 14px',
                    background: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#BFDBFE';
                    e.currentTarget.style.color = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}