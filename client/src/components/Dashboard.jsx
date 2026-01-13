import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Classroom Curator</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        <h2>Dashboard</h2>
        <p>This is your main application area. The Classroom Curator features will be implemented here.</p>
      </main>
    </div>
  )
}

export default Dashboard