"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, Circle, AlertTriangle, Eye, EyeOff, Award, ChevronDown, ChevronUp,
} from "lucide-react";

const NAVY = "#1a2e44";
const ACCENT = "#2a6fdb";
const SOFT = "#eaf2fc";
const OFFWHITE = "#faf9f6";

/**
 * ProfileChecklist
 *
 * Δείχνει στον θεραπευτή ΤΙ ΤΟΥ ΛΕΙΠΕΙ για να εμφανιστεί δημόσια.
 *
 * Χρήση στο dashboard/therapist/page.jsx:
 *   import ProfileChecklist from "@/components/ProfileChecklist";
 *   ...
 *   <ProfileChecklist onGoToTab={setActiveTab} />
 *
 * Το onGoToTab είναι προαιρετικό. Αν το περάσεις, τα κουμπιά
 * "Συμπλήρωσε" πάνε στο σωστό tab. Τα tab ids που χρησιμοποιεί:
 *   "profile" | "conditions" | "areas" | "availability"
 * Αν τα δικά σου έχουν άλλα ονόματα, άλλαξέ τα στο TAB_MAP παρακάτω.
 */

// Τα πραγματικά tab ids του dashboard θεραπευτή
const TAB_MAP = {
  profile:      "profile",
  conditions:   "conditions",
  areas:        "areas",
  availability: "calendar",   // το tab "Διαθεσιμότητα" έχει id "calendar"
  documents:    null,         // ανοίγει modal, όχι tab
};

export default function ProfileChecklist({ onGoToTab, onOpenDocuments }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [condCount, setCondCount] = useState(0);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: p } = await supabase
      .from("therapist_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!p) { setLoading(false); return; }

    const { count } = await supabase
      .from("therapist_conditions")
      .select("*", { count: "exact", head: true })
      .eq("therapist_id", p.id);

    setProfile(p);
    setCondCount(count || 0);
    setLoading(false);
  }

  if (loading || !profile) return null;

  const has = (v) => !!(v && String(v).trim());
  const jsonCount = (v) => (Array.isArray(v) ? v.length : 0);

  // ── 9 ΥΠΟΧΡΕΩΤΙΚΑ ──
  const required = [
    {
      key: "name",
      label: "Ονοματεπώνυμο",
      ok: has(profile.name),
      why: "Ο ασθενής πρέπει να ξέρει ποιον καλεί.",
      tab: "profile",
    },
    {
      key: "photo",
      label: "Φωτογραφία προφίλ",
      ok: has(profile.photo_url),
      why: "Θα μπεις στο σπίτι του. Χωρίς πρόσωπο, δεν σε επιλέγει.",
      tab: "profile",
    },
    {
      key: "license",
      label: "Άδεια ασκήσεως επαγγέλματος",
      ok: has(profile.license_url),
      why: "Υποχρεωτικό από τον νόμο και βάση της εμπιστοσύνης.",
      tab: "documents",
    },
    {
      key: "license_verified",
      label: "Έλεγχος άδειας από την ομάδα μας",
      ok: !!profile.license_verified,
      why: "Γίνεται από εμάς μόλις ανεβάσεις την άδεια. Συνήθως εντός 48 ωρών.",
      tab: null,
      waiting: has(profile.license_url) && !profile.license_verified,
    },
    {
      key: "specialty",
      label: "Ειδικότητα",
      ok: has(profile.specialty) && profile.specialty.trim().length > 3,
      why: "Π.χ. Μυοσκελετική, Νευρολογική, Αθλητική.",
      tab: "profile",
    },
    {
      key: "bio",
      label: "Σύντομο βιογραφικό",
      ok: has(profile.bio) && profile.bio.trim().length >= 30,
      why: "Τουλάχιστον 30 χαρακτήρες. Το πρώτο πράγμα που διαβάζει ο ασθενής.",
      tab: "profile",
      progress: has(profile.bio) ? `${profile.bio.trim().length}/30 χαρακτήρες` : null,
    },
    {
      key: "conditions",
      label: "Τουλάχιστον 3 παθήσεις",
      ok: condCount >= 3,
      why: "Έτσι σε βρίσκουν οι ασθενείς που έχουν το πρόβλημα που θεραπεύεις.",
      tab: "conditions",
      progress: `${condCount}/3 επιλεγμένες`,
    },
    {
      key: "areas",
      label: "Περιοχές εξυπηρέτησης",
      ok: jsonCount(profile.service_areas) >= 1 || (has(profile.area) && profile.area.trim().length > 2),
      why: "Πού πηγαίνεις για κατ' οίκον επισκέψεις.",
      tab: "areas",
    },
    {
      key: "price",
      label: "Τιμή συνεδρίας",
      ok: Number(profile.price_per_session) > 0,
      why: "Διαφάνεια από την αρχή — χωρίς εκπλήξεις.",
      tab: "profile",
    },
  ];

  // ── 7 ΠΡΟΑΙΡΕΤΙΚΑ ──
  const optional = [
    { key: "education",    label: "Σπουδές (σχολή & έτος)", ok: has(profile.education_school), tab: "profile" },
    { key: "certs",        label: "Πιστοποιήσεις",           ok: jsonCount(profile.certifications_urls) >= 1, tab: "documents" },
    { key: "cv",           label: "Βιογραφικό (CV)",         ok: has(profile.cv_url), tab: "documents" },
    { key: "experience",   label: "Έτη εμπειρίας",           ok: Number(profile.years_experience) > 0, tab: "profile" },
    { key: "availability", label: "Διαθεσιμότητα",           ok: (profile.availability_slots || []).length >= 1, tab: "availability" },
    { key: "iban",         label: "IBAN για πληρωμές",       ok: has(profile.iban), tab: "profile" },
    { key: "terms",        label: "Αποδοχή όρων συνεργασίας", ok: !!profile.terms_accepted_at, tab: "profile" },
  ];

  const reqDone = required.filter((r) => r.ok).length;
  const optDone = optional.filter((o) => o.ok).length;
  const isComplete = reqDone === required.length;
  const isFull = isComplete && optDone >= 4;
  const missing = required.filter((r) => !r.ok);

  function goTo(tab) {
    if (tab === "documents" && onOpenDocuments) { onOpenDocuments(); return; }
    if (tab && onGoToTab) onGoToTab(TAB_MAP[tab] || tab);
  }

  // ── ΧΡΩΜΑΤΑ ΚΑΤΑΣΤΑΣΗΣ ──
  const state = isFull
    ? { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" }
    : isComplete
      ? { bg: SOFT, border: "#bfdbfe", color: ACCENT }
      : { bg: "#fffbeb", border: "#fde68a", color: "#b45309" };

  return (
    <div style={{
      background: state.bg,
      border: `1px solid ${state.border}`,
      borderRadius: 16,
      marginBottom: 24,
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── HEADER ── */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", flexWrap: "wrap" }}
      >
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: "#fff", border: `1px solid ${state.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {isComplete
            ? (isFull ? <Award size={22} color={state.color} strokeWidth={2} />
                      : <Eye size={22} color={state.color} strokeWidth={2} />)
            : <EyeOff size={22} color={state.color} strokeWidth={2} />}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, color: NAVY,
            fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 3,
          }}>
            {isFull
              ? "Το προφίλ σου είναι πλήρες"
              : isComplete
                ? "Το προφίλ σου είναι ενεργό"
                : "Το προφίλ σου δεν είναι ορατό ακόμα"}
          </div>
          <div style={{ fontSize: 13, color: "#5a6b7d", lineHeight: 1.5 }}>
            {isFull
              ? "Εμφανίζεσαι ψηλότερα στα αποτελέσματα και έχεις το σήμα «Πλήρες προφίλ»."
              : isComplete
                ? `Οι ασθενείς μπορούν να σε βρουν. Συμπλήρωσε ${4 - optDone > 0 ? `${4 - optDone} ακόμα προαιρετικά` : "τα υπόλοιπα"} για το σήμα «Πλήρες προφίλ».`
                : `Λείπουν ${missing.length} ${missing.length === 1 ? "στοιχείο" : "στοιχεία"}. Μέχρι να συμπληρωθούν, δεν εμφανίζεσαι στις αναζητήσεις.`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: state.color, lineHeight: 1 }}>
              {reqDone}/{required.length}
            </div>
            <div style={{ fontSize: 11, color: "#8a9aab", marginTop: 3 }}>υποχρεωτικά</div>
          </div>
          {expanded ? <ChevronUp size={20} color="#8a9aab" /> : <ChevronDown size={20} color="#8a9aab" />}
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ padding: "0 24px 18px" }}>
        <div style={{ height: 8, background: "rgba(255,255,255,0.7)", borderRadius: 30, overflow: "hidden" }}>
          <div style={{
            width: `${(reqDone / required.length) * 100}%`,
            height: "100%",
            background: state.color,
            borderRadius: 30,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* ── ΛΙΣΤΑ ── */}
      {expanded && (
        <div style={{ background: "#fff", borderTop: `1px solid ${state.border}`, padding: "20px 24px" }}>

          {/* Υποχρεωτικά */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#8a9aab",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>
            Απαραίτητα για να εμφανιστείς
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {required.map((r) => (
              <div key={r.key} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid #f1f5f9",
              }}>
                <div style={{ paddingTop: 1, flexShrink: 0 }}>
                  {r.ok
                    ? <CheckCircle2 size={19} color="#15803d" strokeWidth={2.2} />
                    : r.waiting
                      ? <AlertTriangle size={19} color="#b45309" strokeWidth={2.2} />
                      : <Circle size={19} color="#cbd5e1" strokeWidth={2} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: r.ok ? "#8a9aab" : NAVY,
                    textDecoration: r.ok ? "line-through" : "none",
                    marginBottom: r.ok ? 0 : 3,
                  }}>
                    {r.label}
                    {r.progress && !r.ok && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "#b45309" }}>
                        {r.progress}
                      </span>
                    )}
                  </div>

                  {!r.ok && (
                    <div style={{ fontSize: 12.5, color: "#5a6b7d", lineHeight: 1.5 }}>
                      {r.waiting ? "Η άδεια ανέβηκε — περιμένει έλεγχο από εμάς. Δεν χρειάζεται να κάνεις κάτι." : r.why}
                    </div>
                  )}
                </div>

                {!r.ok && !r.waiting && r.tab && (
                  <button
                    onClick={() => goTo(r.tab)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 30,
                      border: `1px solid ${ACCENT}`,
                      background: SOFT,
                      color: ACCENT,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Συμπλήρωσε
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Προαιρετικά */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#8a9aab",
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginTop: 26, marginBottom: 6,
          }}>
            Προαιρετικά — {optDone}/{optional.length} ολοκληρωμένα
          </div>
          <div style={{ fontSize: 12.5, color: "#5a6b7d", marginBottom: 14, lineHeight: 1.5 }}>
            Με <strong style={{ color: NAVY }}>4 από τα 7</strong> παίρνεις το σήμα «Πλήρες προφίλ» και εμφανίζεσαι ψηλότερα στα αποτελέσματα.
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {optional.map((o) => (
              <button
                key={o.key}
                onClick={() => !o.ok && goTo(o.tab)}
                disabled={o.ok}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px",
                  borderRadius: 30,
                  border: `1px solid ${o.ok ? "#bbf7d0" : "#e2e8f0"}`,
                  background: o.ok ? "#f0fdf4" : "#fff",
                  color: o.ok ? "#15803d" : "#5a6b7d",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: o.ok ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {o.ok
                  ? <CheckCircle2 size={14} strokeWidth={2.2} />
                  : <Circle size={14} strokeWidth={2} color="#cbd5e1" />}
                {o.label}
              </button>
            ))}
          </div>

          {/* Κλείσιμο */}
          {!isComplete && (
            <div style={{
              marginTop: 22,
              padding: "14px 18px",
              background: OFFWHITE,
              border: "1px solid #e8e4dc",
              borderRadius: 12,
              fontSize: 13,
              color: "#5a6b7d",
              lineHeight: 1.6,
            }}>
              Ζητάμε αυτά τα στοιχεία γιατί ο ασθενής σε δέχεται <strong style={{ color: NAVY }}>στο σπίτι του</strong>. Όσο πιο πλήρες το προφίλ σου, τόσο περισσότερα αιτήματα δέχεσαι.
            </div>
          )}
        </div>
      )}
    </div>
  );
}