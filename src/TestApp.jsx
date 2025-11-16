// Ultra-simple test component
export default function TestApp() {
  return (
    <div style={{
      backgroundColor: '#0A0E27',
      color: 'white',
      padding: '50px',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🥔 TEST - React is Working!
      </h1>
      <p style={{ fontSize: '24px' }}>
        If you can see this, React is rendering.
      </p>
      <p style={{ fontSize: '18px', color: '#00FF88' }}>
        Server time: {new Date().toLocaleTimeString()}
      </p>
    </div>
  )
}
