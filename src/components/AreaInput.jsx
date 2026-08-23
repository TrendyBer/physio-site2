'use client';
import { useState, useRef, useEffect } from 'react';
import { searchAreas, canonicalArea, phonetic } from '@/lib/areas';
import { MapPin, Check, AlertCircle } from 'lucide-react';

/*
  AreaInput
  ─────────
  Πεδίο περιοχής με autocomplete που καταλαβαίνει ορθογραφία και greeklish.
  «κολονακι», «Kolonaki», «Κολωνάκι» -> όλα οδηγούν στο «Κολωνάκι».

  Γιατί έχει σημασία: αν ο ασθενής γράψει διαφορετικά από τον θεραπευτή,
  το φίλτρο περιοχής δεν βρίσκει κανέναν και το site δείχνει «δεν υπάρχουν
  διαθέσιμοι θεραπευτές» ενώ υπάρχουν.

  Props:
    value       — η τρέχουσα τιμή
    onChange    — (value: string) => void
    placeholder
    lang        — 'el' | 'en'
    style       — override του input style
    allowCustom — αν true, δέχεται και περιοχές εκτός λίστας (default true)
*/

const TX = {
  el: {
    ph: 'π.χ. Κολωνάκι',
    matched: 'Αναγνωρίστηκε',
    custom: 'Εκτός λίστας — μπορεί να μη βρεθούν θεραπευτές',
    noResults: 'Δεν βρέθηκε περιοχή',
  },
  en: {
    ph: 'e.g. Kolonaki',
    matched: 'Recognised',
    custom: 'Not in list — therapists may not be found',
    noResults: 'No area found',
  },
};

export default function AreaInput({
  value = '',
  onChange,
  placeholder,
  lang = 'el',
  style,
  allowCustom = true,
}) {
  const tx = TX[lang] || TX.el;
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const suggestions = query.trim() ? searchAreas(query, 7) : [];
  const canonical = canonicalArea(query);
  const isKnown = !!canonical;

  useEffect(() => { setHighlight(0); }, [suggestions.length]);

  function pick(area) {
    setQuery(area);
    onChange?.(area);
    setOpen(false);
  }

  function handleChange(v) {
    setQuery(v);
    setOpen(true);
    // Ενημερώνουμε τον γονέα με ό,τι γράφει. Αν πέσει σε γνωστή περιοχή,
    // στέλνουμε την ΕΠΙΣΗΜΗ γραφή ώστε να ταιριάζει με τον θεραπευτή.
    const c = canonicalArea(v);
    onChange?.(c || v);
  }

  function handleKey(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const baseStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a2e44',
    ...style,
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder || tx.ph}
        autoComplete="off"
        style={baseStyle}
      />

      {/* Ένδειξη αναγνώρισης */}
      {query.trim().length >= 3 && !open && (
        isKnown ? (
          <div style={{ fontSize: 11.5, color: '#15803D', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={12} strokeWidth={3} />
            {tx.matched}: <strong>{canonical}</strong>
          </div>
        ) : allowCustom ? (
          <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={12} strokeWidth={2.2} />
            {tx.custom}
          </div>
        ) : null
      )}

      {/* Dropdown */}
      {open && query.trim() && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
          zIndex: 100,
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {suggestions.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              {tx.noResults}
            </div>
          ) : suggestions.map((a, i) => (
            <div
              key={a}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(a)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                background: i === highlight ? '#EFF6FF' : '#fff',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13.5,
                color: '#1a2e44',
                fontWeight: phonetic(a) === phonetic(query) ? 700 : 500,
              }}
            >
              <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
              {a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}