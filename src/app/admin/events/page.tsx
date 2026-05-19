export default function AdminEvents() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
      <div style={{ fontSize: '48px' }}>📅</div>
      <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>Events</h1>
      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: '300px' }}>
        Audit log and user activity timeline. Coming soon.
      </p>
    </div>
  );
}
