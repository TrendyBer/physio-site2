export default function Partners() {
  return (
    <div style={{ background: '#f8fafb', padding: '36px 24px', borderTop: '1px solid #dce6f0', borderBottom: '1px solid #dce6f0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6b7a8d', marginBottom: 20, fontWeight: 500 }}>
          Οι Συνεργάτες μας
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 90, height: 32, borderRadius: 6, background: '#dce6f0', opacity: 0.6 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
