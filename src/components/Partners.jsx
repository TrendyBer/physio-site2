export default function Partners() {
  return (
    <div style={{ background: '#ffffff', padding: '36px 24px', borderTop: '1px solid #e8dfd0', borderBottom: '1px solid #e8dfd0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94785a', marginBottom: 20, fontWeight: 500 }}>
          Οι Συνεργάτες μας
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 90, height: 32, borderRadius: 6, background: '#e8dfd0', opacity: 0.7 }} />
          ))}
        </div>
      </div>
    </div>
  );
}