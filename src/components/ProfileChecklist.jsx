"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, Circle, AlertTriangle, Eye, EyeOff, Award, ChevronDown, ChevronUp,
  Upload, ArrowRight, ShieldCheck,
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
 *   <ProfileChecklist onGoToTab={goToChecklistTarget} onOpenDocuments={() => setDocsModal(true)} />
 *
 * ΝΕΟ:
 *  - Όταν το προφίλ είναι ενεργό, το checklist ΚΛΕΙΝΕΙ από μόνο του.
 *    Ο θεραπευτής που τελείωσε δεν πρέπει να βλέπει κάθε μέρα μια λίστα
 *    με 16 γραμμές πάνω από τη δουλειά του.
 *  - Υποχρεωτικά και προαιρετικά μετρούνται ΞΕΧΩΡΙΣΤΑ. Ένα ενιαίο
 *    ποσοστό έκανε τον θεραπευτή να νομίζει ότι είναι «σχεδόν έτοιμος»
 *    ενώ του έλειπε η άδεια.
 *
 * Τα keys του `tab` πηγαίνουν αυτούσια στο onGoToTab — ο γονέας ξέρει
 * πού ζει πλέον το καθένα στη νέα δομή των 5 tabs.
 */

export default function ProfileChecklist({ onGoToTab, onOpenDocuments }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [condCount, setCondCount] = useState(0);
  const [expanded, setExpanded] = useState(null); // null = δεν αποφασίστηκε ακόμα

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let { data: p } = await supabase
      .from("therapist_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Αυτο-επιδιόρθωση: αν για οποιονδήποτε λόγο δεν δημιουργήθηκε γραμμή
    // κατά την εγγραφή, τη φτιάχνουμε τώρα από τα στοιχεία του λογαριασμού.
    if (!p) {
      const { data: created } = await supabase
        .from("therapist_profiles")
        .upsert({
          id: user.id,
          name: user.user_metadata?.name || null,
          is_approved: false,
        }, { onConflict: "id" })
        .select()
        .maybeSingle();
      p = created;
    }

    if (!p) { setLoading(false); return; }

    // Αν το όνομα λείπει αλλά υπάρχει στον λογαριασμό, συμπλήρωσέ το.
    if (!p.name && user.user_metadata?.name) {
      await supabase
        .from("therapist_profiles")
        .update({ name: user.user_metadata.name })
        .eq("id", user.id);
      p = { ...p, name: user.user_metadata.name };
    }

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

  // ── ΥΠΟΧΡΕΩΤΙΚΑ ──
  // Η άδεια είναι ΠΡΩΤΗ: χωρίς αυτήν τίποτα άλλο δεν έχει νόημα.
  const required = [
    {
      key: "license",
      label: "Άδεια ασκήσεως επαγγέλματος",
      ok: has(profile.license_url),
      why: "Υποχρεωτικό από τον νόμο και βάση της εμπιστοσύνης. Ξεκίνα από εδώ.",
      tab: "documents",
      first: true,
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
      label: "Τουλάχιστον 3 περιστατικά",
      ok: condCount >= 3,
      why: "Έτσι σε βρίσκουν οι ασθενείς που έχουν το πρόβλημα που θεραπεύεις.",
      tab: "conditions",
      progress: `${condCount}/3 επιλεγμένα`,
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

  // ── ΠΡΟΑΙΡΕΤΙΚΑ ──
  const optional = [
    { key: "education",    label: "Σπουδές (σχολή & έτος)", ok: has(profile.education_school), tab: "profile" },
    { key: "certs",        label: "Πιστοποιήσεις",           ok: jsonCount(profile.certifications_urls) >= 1, tab: "documents" },
    { key: "cv",           label: "Βιογραφικό (CV)",         ok: has(profile.cv_url), tab: "documents" },
    { key: "experience",   label: "Έτη εμπειρίας",           ok: Number(profile.years_experience) > 0, tab: "profile" },
    { key: "availability", label: "Διαθεσιμότητα",           ok: (profile.availability_slots || []).length >= 1, tab: "availability" },
    { key: "iban",         label: "IBAN για πληρωμές",       ok: has(profile.iban), tab: "profile" },
    { key: "terms",        label: "Αποδοχή όρων συνεργασίας", ok: !!profile.terms_accepted_at || !!profile.contract_accepted, tab: "profile" },
  ];

  const reqDone = required.filter((r) => r.ok).length;
  const optDone = optional.filter((o) => o.ok).length;
  const isComplete = reqDone === required.length;
  const isFull = isComplete && optDone >= 4;
  const missing = required.filter((r) => !r.ok);

  // Ολοκαίνουργιος θεραπευτής: δεν έχει καν ανεβάσει άδεια.
  // Του δείχνουμε ΕΝΑ βήμα, όχι λίστα εννιά.
  const isBrandNew = !has(profile.license_url) && reqDone <= 3;

  // Ανοιχτό όσο λείπει κάτι υποχρεωτικό, κλειστό όταν το προφίλ είναι
  // ενεργό. Μόλις ο θεραπευτής το πειράξει χειροκίνητα, η επιλογή του μένει.
  const isOpen = expanded === null ? !isComplete : expanded;

  function goTo(tab) {
    if (tab === "documents" && onOpenDocuments) { onOpenDocuments(); return; }
    if (tab && onGoToTab) onGoToTab(tab);
  }

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

      {/* ── ΠΡΩΤΟ ΒΗΜΑ για νέους θεραπευτές ── */}
      {isBrandNew && (
        <div style={{
          background: NAVY,
          padding: "24px 26px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ShieldCheck size={26} color="#fff" strokeWidth={1.9} />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6,
            }}>
              Πρώτο βήμα
            </div>
            <div style={{
              fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 6,
              fontFamily: "'DM Serif Display', Georgia, serif",
            }}>
              Ανέβασε την άδεια ασκήσεως επαγγέλματος
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
              Είναι το μόνο που χρειάζεται για να ξεκινήσει ο έλεγχος του λογαριασμού σου.
              Τα υπόλοιπα στοιχεία μπορείς να τα συμπληρώσεις όσο περιμένεις.
            </div>
          </div>

          <button
            onClick={() => goTo("documents")}
            style={{
              padding: "13px 26px", borderRadius: 30, border: "none",
              background: "#fff", color: NAVY,
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}
          >
            <Upload size={16} strokeWidth={2.3} />
            Ανέβασμα άδειας
          </button>
        </div>
      )}

      {/* ── ΣΥΜΠΤΥΓΜΕΝΗ ΓΡΑΜΜΗ όταν το προφίλ είναι ενεργό ── */}
      {isComplete && !isOpen ? (
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {isFull
            ? <Award size={19} color={state.color} strokeWidth={2.1} />
            : <Eye size={19} color={state.color} strokeWidth={2.1} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
            {isFull ? "Προφίλ πλήρες" : "Προφίλ ενεργό"}
          </span>
          <span style={{ fontSize: 13, color: "#5a6b7d" }}>
            {optDone}/{optional.length} προαιρετικά συμπληρωμένα
          </span>
          <button
            onClick={() => setExpanded(true)}
            style={{
              marginLeft: "auto", padding: "7px 16px", borderRadius: 30,
              border: `1px solid ${state.border}`, background: "#fff", color: state.color,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            {isFull ? "Δες το checklist" : "Βελτίωση προφίλ"}
            <ChevronDown size={14} strokeWidth={2.3} />
          </button>
        </div>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div
            onClick={() => setExpanded(!isOpen)}
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

            {/* Δύο ΞΕΧΩΡΙΣΤΟΙ μετρητές. Ένα ενιαίο ποσοστό έκρυβε το ότι
                λείπει κάτι υποχρεωτικό. */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: state.color, lineHeight: 1 }}>
                  {reqDone}/{required.length}
                </div>
                <div style={{ fontSize: 11, color: "#8a9aab", marginTop: 3 }}>υποχρεωτικά</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#8a9aab", lineHeight: 1 }}>
                  {optDone}/{optional.length}
                </div>
                <div style={{ fontSize: 11, color: "#8a9aab", marginTop: 3 }}>προαιρετικά</div>
              </div>
              {isOpen ? <ChevronUp size={20} color="#8a9aab" /> : <ChevronDown size={20} color="#8a9aab" />}
            </div>
          </div>

          {/* ── PROGRESS BAR (μόνο για τα υποχρεωτικά) ── */}
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
          {isOpen && (
            <div style={{ background: "#fff", borderTop: `1px solid ${state.border}`, padding: "20px 24px" }}>

              <div style={{
                fontSize: 11, fontWeight: 700, color: "#8a9aab",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
              }}>
                Απαραίτητα για να εμφανιστείς — {reqDone}/{required.length}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {required.map((r) => (
                  <div key={r.key} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid #f1f5f9",
                    background: r.first && !r.ok ? "#fffbeb" : "transparent",
                    borderRadius: r.first && !r.ok ? 8 : 0,
                    paddingLeft: r.first && !r.ok ? 12 : 0,
                    paddingRight: r.first && !r.ok ? 12 : 0,
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
                        {r.first && !r.ok && (
                          <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#b45309",
                            background: "#fef3c7", border: "1px solid #fde68a",
                            padding: "2px 8px", borderRadius: 30,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>
                            Υποχρεωτικό
                          </span>
                        )}
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
                          border: `1px solid ${r.first ? "#b45309" : ACCENT}`,
                          background: r.first ? "#b45309" : SOFT,
                          color: r.first ? "#fff" : ACCENT,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {r.first ? "Ανέβασε" : "Συμπλήρωσε"}
                        <ArrowRight size={13} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Προαιρετικά — ξεχωριστό block, ξεχωριστός μετρητής */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#8a9aab",
                textTransform: "uppercase", letterSpacing: "0.08em",
                marginTop: 26, marginBottom: 6,
              }}>
                Προαιρετικά — {optDone}/{optional.length}
              </div>
              <div style={{ fontSize: 12.5, color: "#5a6b7d", marginBottom: 14, lineHeight: 1.5 }}>
                Με <strong style={{ color: NAVY }}>4 από τα 7</strong> παίρνεις το σήμα «Πλήρες προφίλ» και εμφανίζεσαι ψηλότερα στα αποτελέσματα. Δεν είναι απαραίτητα για να δέχεσαι ραντεβού.
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

              {isComplete && (
                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setExpanded(false)}
                    style={{
                      padding: "8px 18px", borderRadius: 30, border: "1px solid #e2e8f0",
                      background: "#fff", color: "#5a6b7d", fontSize: 12.5, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <ChevronUp size={14} strokeWidth={2.3} />
                    Σύμπτυξη
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}