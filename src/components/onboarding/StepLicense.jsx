'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, ArrowLeft, Upload, ShieldCheck, Clock, AlertTriangle, FileText, Eye, Trash2, Lock } from 'lucide-react';

/*
  ΒΗΜΑ 4 — Επαγγελματική επαλήθευση

  Το αρχείο ανεβαίνει στο ιδιωτικό bucket therapist-documents και
  ΔΕΝ εκτίθεται ποτέ δημόσια: το v_public_therapists δεν περιλαμβάνει
  το license_url. Η προβολή γίνεται μόνο με προσωρινό signed URL.

  Η άδεια είναι απαραίτητη για να γίνει ΟΡΑΤΟ το προφίλ, αλλά ΔΕΝ
  μπλοκάρει το onboarding: αν δεν την έχει πρόχειρη τώρα, προχωράει και
  την ανεβάζει από τον πίνακά του. Το να τον κολλήσουμε εδώ σημαίνει ότι
  δεν θα διαλέξει ποτέ πακέτο και θα φύγει.
*/

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_MB = 10;

const TX = {
  el: {
    title: 'Επαγγελματική επαλήθευση',
    desc: 'Ανέβασε την άδεια ασκήσεως επαγγέλματος για να ενεργοποιηθεί το δημόσιο προφίλ σου.',
    privacy: 'Το έγγραφο χρησιμοποιείται μόνο για την επαλήθευση του επαγγελματικού σου δικαιώματος και δεν εμφανίζεται δημόσια στους ασθενείς.',
    label: 'Άδεια ασκήσεως επαγγέλματος',
    fileHint: 'PDF, JPG ή PNG · έως 10 MB',
    choose: 'Επιλογή αρχείου',
    uploading: 'Ανέβασμα...',
    replace: 'Αντικατάσταση',
    view: 'Προβολή',
    remove: 'Αφαίρεση',
    statusLabel: 'Κατάσταση',
    stNone: 'Δεν έχει υποβληθεί',
    stPending: 'Υπό έλεγχο',
    stApproved: 'Εγκεκριμένο',
    stRejected: 'Απορρίφθηκε — χρειάζεται νέο αρχείο',
    stPendingNote: 'Η ομάδα μας ελέγχει την άδεια, συνήθως εντός 48 ωρών. Δεν χρειάζεται να κάνεις κάτι άλλο.',
    stApprovedNote: 'Η άδειά σου επαληθεύτηκε.',
    continue: 'Συνέχεια',
    back: 'Πίσω',
    skip: 'Θα την ανεβάσω αργότερα',
    skipNote: 'Μπορείς να συνεχίσεις, αλλά το προφίλ σου δεν θα εμφανίζεται στους ασθενείς μέχρι να ανεβάσεις και να εγκριθεί η άδεια.',
    confirmRemove: 'Αφαίρεση του αρχείου;',
    errType: 'Επιτρέπονται μόνο PDF, JPG και PNG.',
    errSize: `Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: ${MAX_MB} MB.`,
    errUpload: 'Σφάλμα ανεβάσματος: ',
  },
  en: {
    title: 'Professional verification',
    desc: 'Upload your professional licence so your public profile can be activated.',
    privacy: 'The document is used solely to verify your professional standing and is never shown publicly to patients.',
    label: 'Professional licence',
    fileHint: 'PDF, JPG or PNG · up to 10 MB',
    choose: 'Choose file',
    uploading: 'Uploading...',
    replace: 'Replace',
    view: 'View',
    remove: 'Remove',
    statusLabel: 'Status',
    stNone: 'Not submitted',
    stPending: 'Under review',
    stApproved: 'Approved',
    stRejected: 'Rejected — a new file is needed',
    stPendingNote: 'Our team is reviewing your licence, usually within 48 hours. Nothing else is needed from you.',
    stApprovedNote: 'Your licence has been verified.',
    continue: 'Continue',
    back: 'Back',
    skip: "I'll upload it later",
    skipNote: 'You can continue, but your profile will not be shown to patients until the licence is uploaded and approved.',
    confirmRemove: 'Remove this file?',
    errType: 'Only PDF, JPG and PNG are allowed.',
    errSize: `That file is too large. Maximum size: ${MAX_MB} MB.`,
    errUpload: 'Upload error: ',
  },
};

export default function StepLicense({ lang, profile, userId, refreshProfile, onNext, onBack }) {
  const tx = TX[lang] || TX.el;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const hasLicense = !!profile?.license_url;
  const verified = !!profile?.license_verified;
  const rejected = profile?.application_status === 'rejected';

  const status = rejected ? 'rejected' : verified ? 'approved' : hasLicense ? 'pending' : 'none';

  const statusStyle = {
    none:     { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', Icon: AlertTriangle, label: tx.stNone },
    pending:  { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', Icon: Clock,        label: tx.stPending },
    approved: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', Icon: ShieldCheck,  label: tx.stApproved },
    rejected: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', Icon: AlertTriangle, label: tx.stRejected },
  }[status];

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type)) { setError(tx.errType); setFileInputKey(k => k + 1); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(tx.errSize); setFileInputKey(k => k + 1); return; }

    setUploading(true); setError('');

    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${userId}/license.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('therapist-documents')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (upErr) { setError(tx.errUpload + upErr.message); setUploading(false); setFileInputKey(k => k + 1); return; }

    const { error: dbErr } = await supabase.from('therapist_profiles').update({
      license_url: path,
      application_status: 'pending',
    }).eq('id', userId);

    setUploading(false);
    setFileInputKey(k => k + 1);
    if (dbErr) { setError(tx.errUpload + dbErr.message); return; }

    await refreshProfile();
  }

  async function view() {
    const { data, error: err } = await supabase.storage
      .from('therapist-documents')
      .createSignedUrl(profile.license_url, 3600);
    if (err) { setError(tx.errUpload + err.message); return; }
    window.open(data.signedUrl, '_blank');
  }

  async function remove() {
    if (!confirm(tx.confirmRemove)) return;
    await supabase.storage.from('therapist-documents').remove([profile.license_url]);
    await supabase.from('therapist_profiles')
      .update({ license_url: null, application_status: 'incomplete' })
      .eq('id', userId);
    await refreshProfile();
  }

  const StatusIcon = statusStyle.Icon;

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{tx.title}</h2>
      <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 20 }}>{tx.desc}</p>

      {/* Ιδιωτικότητα εγγράφου — ο θεραπευτής πρέπει να ξέρει πού πάει */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 16px', marginBottom: 22, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Lock size={15} color="#1D4ED8" strokeWidth={2.1} style={{ marginTop: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: '#1E40AF', lineHeight: 1.6 }}>{tx.privacy}</span>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>
        {tx.label} *
      </div>

      {hasLicense ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, flexWrap: 'wrap' }}>
          <FileText size={17} color="#64748b" />
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600, flex: 1, minWidth: 80 }}>
            {profile.license_url.split('/').pop()}
          </span>
          <button type="button" onClick={view}
            style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 13px', fontSize: 11.5, fontWeight: 600, color: '#1a2e44', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Eye size={12} />
            {tx.view}
          </button>
          <label style={{ background: 'transparent', border: '1px solid #BFDBFE', borderRadius: 20, padding: '6px 13px', fontSize: 11.5, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Upload size={12} />
            {uploading ? tx.uploading : tx.replace}
            <input key={fileInputKey} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={upload} style={{ display: 'none' }} />
          </label>
          {!verified && (
            <button type="button" onClick={remove}
              style={{ background: 'transparent', border: '1px solid #FECDD3', borderRadius: 20, padding: '6px 13px', fontSize: 11.5, fontWeight: 600, color: '#BE123C', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={12} />
              {tx.remove}
            </button>
          )}
        </div>
      ) : (
        <div style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '26px 20px', textAlign: 'center' }}>
          <Upload size={26} color="#cbd5e1" strokeWidth={1.8} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 16 }}>{tx.fileHint}</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#1a2e44', color: '#fff', padding: '11px 24px', borderRadius: 30, fontSize: 13.5, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            <Upload size={14} />
            {uploading ? tx.uploading : tx.choose}
            <input key={fileInputKey} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={upload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {/* Κατάσταση επαλήθευσης */}
      <div style={{ marginTop: 18, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, borderRadius: 12, padding: '13px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: status === 'none' ? 0 : 5 }}>
          <StatusIcon size={15} color={statusStyle.color} strokeWidth={2.2} />
          <span style={{ fontSize: 11, fontWeight: 700, color: statusStyle.color, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {tx.statusLabel}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: statusStyle.color }}>{statusStyle.label}</span>
        </div>
        {status === 'pending' && (
          <div style={{ fontSize: 12.5, color: statusStyle.color, lineHeight: 1.6 }}>{tx.stPendingNote}</div>
        )}
        {status === 'approved' && (
          <div style={{ fontSize: 12.5, color: statusStyle.color, lineHeight: 1.6 }}>{tx.stApprovedNote}</div>
        )}
        {status === 'rejected' && profile?.admin_comment && (
          <div style={{ fontSize: 12.5, color: statusStyle.color, lineHeight: 1.6, fontStyle: 'italic' }}>{profile.admin_comment}</div>
        )}
      </div>

      {!hasLicense && (
        <div style={{ marginTop: 14, fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55 }}>
          {tx.skipNote}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} type="button"
          style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '13px 24px', borderRadius: 30, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <ArrowLeft size={15} />
          {tx.back}
        </button>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {!hasLicense && (
            <button onClick={onNext} type="button"
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
              {tx.skip}
            </button>
          )}
          <button onClick={onNext} disabled={uploading}
            style={{ background: '#1a2e44', color: '#fff', border: 'none', padding: '13px 30px', borderRadius: 30, fontSize: 14.5, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {tx.continue}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}