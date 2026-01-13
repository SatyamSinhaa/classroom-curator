import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '1rem',
          fontSize: '2.5rem'
        }}>
          Welcome to Classroom Curator!
        </h1>

        <p style={{
          color: '#666',
          fontSize: '1.2rem',
          marginBottom: '2rem'
        }}>
          Hello, <strong>{user?.user_metadata?.full_name || user?.email}</strong>!
        </p>

        <p style={{
          color: '#888',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Your educational platform is ready. Start managing your classrooms and curriculum with ease.
        </p>

        <button
          onClick={handleSignOut}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Home