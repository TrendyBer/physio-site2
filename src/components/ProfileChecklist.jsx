"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, Circle, AlertTriangle, Eye, EyeOff, Award, ChevronDown, ChevronUp,
  ArrowRight, ShieldCheck, Rocket,
} from "lucide-react";

import { C, R, T, card, btn, badge } from "@/lib/tokens";

const NAVY = C.brand;
const ACCENT = C.accent;
const SOFT = C.accentSoft;
const OFFWHITE = C.surfaceAlt;

/**
 * ProfileChecklist
 *
 * ΔΥΟ ΞΕΚΑΘΑΡΑ ΤΜΗΜΑΤΑ:
 *
 *   1. ΑΠΑΡΑΙΤΗΤΑ ΓΙΑ ΕΝΕΡΓΟΠΟΙΗΣΗ
 *      Χωρίς αυτά το προφίλ ΔΕΝ εμφανίζεται σε καμία αναζήτηση.
 *      Ο ορισμός είναι ο ΙΔΙΟΣ με τη συνάρτηση therapist_activation_status
 *      στη βάση — αν αποκλίνουν, ο θεραπευτής βλέπει «όλα εντάξει» ενώ
 *      παραμένει αόρατος.
 *
 *   2. ΠΡΟΑΙΡΕΤΙΚΑ ΓΙΑ ΚΑΛΥΤΕΡΗ ΠΡΟΒΟΛΗ
 *      Δεν μπλοκάρουν τίποτα. Βελτιώνουν κατάταξη και εντύπωση.
 *
 * Τα δύο ΔΕΝ αναμειγνύονται ποτέ σε ενιαίο ποσοστό: ένα «85% ολοκληρωμένο»
 * έκανε τον θεραπευτή να νομίζει ότι είναι σχεδόν έτοιμος ενώ του έλειπε
 * η άδεια — δηλαδή ήταν στο μηδέν.
 */

// Οι στόχοι πλοήγησης μεταφράζονται από τον γονέα (goToChecklistTarget).
export default function ProfileChecklist({ onGoToTab, onOpenDocuments }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [condCount, setCondCount] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [cityName, setCityName] = useState("");
  const [onboarding, setOnboarding] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let { data: p } = await supabase
      .from("therapist_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Αυτο-επιδιόρθωση: αν δεν δημιουργήθηκε γραμμή στην εγγραφή,
    // τη φτιάχνουμε τώρα αντί να εξαφανιστεί σιωπηλά το checklist.
    if (!p) {
      const { data: created } = await supabase
        .from("therapist_profiles")
        .upsert({ id: user.id, name: user.user_metadata?.name || null, is_approved: false }, { onConflict: "id" })
        .select()
        .maybeSingle();
      p = created;
    }
    if (!p) { setLoading(false); return; }

    if (!p.name && user.user_metadata?.name) {
      await supabase.from("therapist_profiles").update({ name: user.user_metadata.name }).eq("id", user.id);
      p = { ...p, name: user.user_metadata.name };
    }

    const [{ count }, { data: sub }, { data: ob }] = await Promise.all([
      supabase.from("therapist_conditions").select("*", { count: "exact", head: true }).eq("therapist_id", p.id),
      supabase.from("therapist_subscriptions")
        .select("id, status, plan_id, effective_price, effective_first_session_fee, promo_code_text, promo_ends_at, plan_snapshot")
        .eq("therapist_id", p.id)
        .in("status", ["trialing", "active", "past_due", "exempt"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("therapist_onboarding")
        .select("current_step, completed_at")
        .eq("therapist_id", p.id)
        .maybeSingle(),
    ]);

    if (p.city_id) {
      const { data: c } = await supabase.from("cities").select("name_el").eq("id", p.city_id).maybeSingle();
      if (c) setCityName(c.name_el);
    }

    setProfile(p);
    setCondCount(count || 0);
    setSubscription(sub || null);
    setOnboarding(ob || null);
    setLoading(false);
  }

  if (loading || !profile) return null;

  const has = (v) => !!(v && String(v).trim());
  const jsonCount = (v) => (Array.isArray(v) ? v.length : 0);

  // ── ΑΠΑΡΑΙΤΗΤΑ ΓΙΑ ΕΝΕΡΓΟΠΟΙΗΣΗ ──
  // Ίδια λίστα με την therapist_activation_status στη βάση.
  const required = [
    {
      key: "name",
      label: "Ονοματεπώνυμο",
      ok: has(profile.name),
      why: "Ο ασθενής πρέπει να ξέρει ποιον καλεί.",
      tab: "profile",
    },
    {
      key: "city",
      label: "Πόλη",
      ok: !!profile.city_id,
      value: cityName,
      why: "Καθορίζει σε ποια αγορά εμφανίζεσαι.",
      tab: "profile",
    },
    {
      key: "conditions",
      label: "Τουλάχιστον 3 περιστατικά",
      ok: condCount >= 3,
      progress: `${condCount}/3`,
      why: "Έτσι σε βρίσκουν οι ασθενείς που έχουν το πρόβλημα που αναλαμβάνεις.",
      tab: "conditions",
    },
    {
      key: "areas",
      label: "Περιοχές εξυπηρέτησης",
      ok: jsonCount(profile.service_areas) >= 1,
      progress: jsonCount(profile.service_areas) > 0 ? `${jsonCount(profile.service_areas)}` : null,
      why: "Πού πηγαίνεις για κατ' οίκον επισκέψεις.",
      tab: "areas",
    },
    {
      key: "price",
      label: "Τιμή συνεδρίας",
      ok: Number(profile.price_per_session) > 0,
      value: Number(profile.price_per_session) > 0 ? `${profile.price_per_session}€` : null,
      why: "Διαφάνεια από την αρχή — χωρίς εκπλήξεις.",
      tab: "profile",
    },
    {
      key: "subscription",
      label: "Ενεργό πακέτο συνεργασίας",
      ok: !!subscription,
      value: subscription?.plan_snapshot?.name_el || null,
      why: "Επίλεξε πακέτο και αποδέξου τη Σύμβαση Συνεργασίας.",
      tab: "onboarding",
    },
    {
      key: "license",
      label: "Άδεια ασκήσεως — εγκεκριμένη",
      ok: !!profile.license_verified,
      why: has(profile.license_url)
        ? "Η άδεια ανέβηκε και ελέγχεται από την ομάδα μας. Δεν χρειάζεται να κάνεις κάτι."
        : "Υποχρεωτικό από τον νόμο. Χωρίς αυτήν το προφίλ δεν ενεργοποιείται.",
      waiting: has(profile.license_url) && !profile.license_verified,
      tab: "documents",
    },
  ];

  // ── ΠΡΟΑΙΡΕΤΙΚΑ ──
  const optional = [
    { key: "photo",        label: "Φωτογραφία προφίλ", ok: has(profile.photo_url), tab: "profile" },
    { key: "bio",          label: "Σύντομο βιογραφικό", ok: has(profile.bio) && profile.bio.trim().length >= 30, tab: "profile" },
    { key: "experience",   label: "Έτη εμπειρίας",      ok: Number(profile.years_experience) > 0, tab: "profile" },
    { key: "education",    label: "Σπουδές",            ok: has(profile.education_school), tab: "profile" },
    { key: "certs",        label: "Πιστοποιήσεις",      ok: jsonCount(profile.certifications_urls) >= 1, tab: "documents" },
    { key: "cv",           label: "Βιογραφικό (CV)",    ok: has(profile.cv_url), tab: "documents" },
    { key: "availability", label: "Διαθεσιμότητα",      ok: (profile.availability_slots || []).length >= 1, tab: "availability" },
  ];

  const reqDone = required.filter(r => r.ok).length;
  const optDone = optional.filter(o => o.ok).length;
  const missing = required.filter(r => !r.ok);
  const isActive = missing.length === 0;
  const isFull = isActive && optDone >= 4;

  // Δεν ολοκλήρωσε ποτέ το onboarding — αυτό είναι το ΕΝΑ πράγμα που
  // πρέπει να κάνει, όχι μια λίστα εφτά.
  const inOnboarding = !onboarding?.completed_at;

  const isOpen = expanded === null ? !isActive : expanded;

  function goTo(tab) {
    if (tab === "documents" && onOpenDocuments) { onOpenDocuments(); return; }
    if (tab === "onboarding") { window.location.href = "/onboarding/therapist"; return; }
    if (tab && onGoToTab) onGoToTab(tab);
  }

  // Λευκή card με accent, ΟΧΙ γεμάτο χρωματιστό panel.
  // Το έντονο κίτρινο background έκανε το checklist να μοιάζει με
  // προειδοποίηση σφάλματος αντί για καθοδήγηση.
  const state = isFull
    ? { color: C.success, tint: C.successBg }
    : isActive
      ? { color: C.accent,  tint: C.accentSoft }
      : { color: C.warn,    tint: C.warnBg };

  return (
    <div style={{
      ...card({ padding: 0 }),
      marginBottom: 24,
      overflow: "hidden",
      // Λεπτή έγχρωμη γραμμή στην κορυφή αντί για γεμάτο φόντο
      borderTop: `3px solid ${state.color}`,
    }}>

      {/* ── ΕΝΑ ΒΗΜΑ: δεν τελείωσε το onboarding ── */}
      {inOnboarding && (
        <div style={{ background: NAVY, padding: "24px 26px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Rocket size={25} color="#fff" strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Εκκρεμεί
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: "'DM Serif Display', Georgia, serif" }}>
              Ολοκλήρωσε την εγγραφή σου
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
              {onboarding?.current_step
                ? `Σταμάτησες στο βήμα ${onboarding.current_step} από 5. Η πρόοδός σου είναι αποθηκευμένη.`
                : "Λίγα βήματα ακόμα για να ενεργοποιηθεί το επαγγελματικό σου προφίλ."}
            </div>
          </div>
          <a href="/onboarding/therapist"
            style={{
              padding: "13px 26px", borderRadius: 30, background: "#fff", color: NAVY,
              fontSize: 14, fontWeight: 700, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
            Συνέχεια
            <ArrowRight size={16} strokeWidth={2.3} />
          </a>
        </div>
      )}

      {/* ── ΣΥΜΠΤΥΓΜΕΝΗ ΓΡΑΜΜΗ όταν το προφίλ είναι ενεργό ── */}
      {isActive && !isOpen ? (
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {isFull
            ? <Award size={19} color={state.color} strokeWidth={2.1} />
            : <Eye size={19} color={state.color} strokeWidth={2.1} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
            {isFull ? "Προφίλ πλήρες" : "Προφίλ ενεργό"}
          </span>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            {optDone}/{optional.length} προαιρετικά συμπληρωμένα
          </span>
          <button onClick={() => setExpanded(true)}
            style={{ ...btn("secondary", { padding: "7px 16px", fontSize: 12.5, marginLeft: "auto" }) }}>
            {isFull ? "Δες το checklist" : "Βελτίωση προφίλ"}
            <ChevronDown size={14} strokeWidth={2.3} />
          </button>
        </div>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div onClick={() => setExpanded(!isOpen)}
            style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", flexWrap: "wrap" }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, background: state.tint,
              border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {isActive
                ? (isFull ? <Award size={22} color={state.color} strokeWidth={2} /> : <Eye size={22} color={state.color} strokeWidth={2} />)
                : <EyeOff size={22} color={state.color} strokeWidth={2} />}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: NAVY, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 3 }}>
                {isFull ? "Το προφίλ σου είναι πλήρες"
                  : isActive ? "Το προφίλ σου είναι ενεργό"
                  : "Το προφίλ σου δεν είναι ακόμη ορατό"}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                {isFull
                  ? "Εμφανίζεσαι ψηλότερα στα αποτελέσματα και έχεις το σήμα «Πλήρες προφίλ»."
                  : isActive
                    ? `Οι ασθενείς μπορούν να σε βρουν. Συμπλήρωσε ${Math.max(0, 4 - optDone)} ακόμα προαιρετικά για το σήμα «Πλήρες προφίλ».`
                    : `Απομένει ${missing.length} ${missing.length === 1 ? "απαραίτητο στοιχείο" : "απαραίτητα στοιχεία"}.`}
              </div>
            </div>

            {/* ΔΥΟ ΞΕΧΩΡΙΣΤΟΙ μετρητές — ποτέ ενιαίο ποσοστό */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: state.color, lineHeight: 1 }}>
                  {reqDone}/{required.length}
                </div>
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 3 }}>απαραίτητα</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.textFaint, lineHeight: 1 }}>
                  {optDone}/{optional.length}
                </div>
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 3 }}>προαιρετικά</div>
              </div>
              {isOpen ? <ChevronUp size={20} color="#8a9aab" /> : <ChevronDown size={20} color="#8a9aab" />}
            </div>
          </div>

          {/* Η μπάρα μετράει ΜΟΝΟ τα απαραίτητα */}
          <div style={{ padding: "0 24px 18px" }}>
            <div style={{ height: 6, background: C.borderSoft, borderRadius: R.pill, overflow: "hidden" }}>
              <div style={{
                width: `${(reqDone / required.length) * 100}%`, height: "100%",
                background: state.color, borderRadius: R.pill, transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {isOpen && (
            <div style={{ background: "#fff", borderTop: `1px solid ${C.borderSoft}`, padding: "20px 24px" }}>

              {/* ═══ ΤΜΗΜΑ 1 ═══ */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Απαραίτητα για ενεργοποίηση — {reqDone}/{required.length}
              </div>
              <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                Χωρίς αυτά το προφίλ σου δεν εμφανίζεται σε καμία αναζήτηση ασθενή.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {required.map(r => (
                  <div key={r.key} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 0", borderBottom: "1px solid #f1f5f9",
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
                        fontSize: 14, fontWeight: 600,
                        color: r.ok ? "#8a9aab" : NAVY,
                        textDecoration: r.ok ? "line-through" : "none",
                        marginBottom: r.ok ? 0 : 3,
                      }}>
                        {r.label}
                        {r.ok && r.value && (
                          <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 500, color: C.textFaint, textDecoration: "none" }}>
                            {r.value}
                          </span>
                        )}
                        {!r.ok && r.progress && (
                          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: C.warn }}>
                            {r.progress}
                          </span>
                        )}
                      </div>
                      {!r.ok && (
                        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{r.why}</div>
                      )}
                    </div>

                    {!r.ok && !r.waiting && r.tab && (
                      <button onClick={() => goTo(r.tab)}
                        style={btn("secondary", { padding: "7px 15px", fontSize: 12.5, flexShrink: 0 })}>
                        Συμπλήρωσε
                        <ArrowRight size={13} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Ενεργή συνδρομή — τι ισχύει ΟΝΤΩΣ, μετά την προσφορά */}
              {subscription && (
                <div style={{
                  marginTop: 16, background: C.successBg, border: `1px solid ${C.successBorder}`,
                  borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <ShieldCheck size={15} color="#15803d" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 12.5, color: C.success, lineHeight: 1.6 }}>
                    Πακέτο <strong>{subscription.plan_snapshot?.name_el || "—"}</strong>
                    {" · "}
                    {Number(subscription.effective_price) > 0
                      ? `${Number(subscription.effective_price).toFixed(2)}€/μήνα`
                      : "χωρίς μηνιαία χρέωση"}
                    {" · τέλος νέου ασθενή "}
                    {Number(subscription.effective_first_session_fee) > 0
                      ? `${Number(subscription.effective_first_session_fee).toFixed(2)}€`
                      : "0€"}
                    {subscription.promo_code_text && (
                      <> {" · κωδικός "}<strong>{subscription.promo_code_text}</strong>
                        {subscription.promo_ends_at &&
                          ` έως ${new Date(subscription.promo_ends_at).toLocaleDateString("el-GR")}`}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ ΤΜΗΜΑ 2 ═══ */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 26, marginBottom: 4 }}>
                Προαιρετικά για καλύτερη προβολή — {optDone}/{optional.length}
              </div>
              <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                Δεν είναι απαραίτητα για να δέχεσαι ραντεβού. Με <strong style={{ color: NAVY }}>4 από τα {optional.length}</strong> παίρνεις το σήμα «Πλήρες προφίλ» και εμφανίζεσαι ψηλότερα στα αποτελέσματα.
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {optional.map(o => (
                  <button key={o.key} onClick={() => !o.ok && goTo(o.tab)} disabled={o.ok}
                    style={{
                      ...badge(o.ok ? "completed" : "neutral"),
                      height: 32, padding: "0 14px", fontSize: 12.5,
                      cursor: o.ok ? "default" : "pointer",
                    }}>
                    {o.ok ? <CheckCircle2 size={14} strokeWidth={2.2} /> : <Circle size={14} strokeWidth={2} color="#cbd5e1" />}
                    {o.label}
                  </button>
                ))}
              </div>

              {!isActive && (
                <div style={{
                  marginTop: 22, padding: "14px 18px", background: OFFWHITE,
                  border: "1px solid #e8e4dc", borderRadius: 12,
                  fontSize: 13, color: C.textMuted, lineHeight: 1.6,
                }}>
                  Ζητάμε αυτά τα στοιχεία γιατί ο ασθενής σε δέχεται <strong style={{ color: NAVY }}>στο σπίτι του</strong>. Όσο πιο πλήρες το προφίλ σου, τόσο περισσότερα αιτήματα δέχεσαι.
                </div>
              )}

              {isActive && (
                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => setExpanded(false)}
                    style={btn("quiet", { padding: "8px 18px", fontSize: 12.5 })}>
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