const { useState, useEffect } = React;
const supabase = window.supabaseClient;
const EmployeeForm = window.EmployeeForm;
const EmployerForm = window.EmployerForm;

// App Component with Routing
const App = () => {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const getComponent = () => {
    if (route === '/' || route === '') {
      return <EmployeeForm supabase={supabase} />;
    }

    const match = route.match(/^\/employer\/(.+)$/);
    if (match) {
      const token = match[1];
      return <EmployerForm supabase={supabase} token={token} />;
    }

    return <div style={styles.container}><p>Page not found</p></div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1 }}>
        {getComponent()}
      </div>
      <footer style={{ backgroundColor: '#0052a3', color: 'white', textAlign: 'center', padding: '20px', marginTop: '40px', fontSize: '14px' }}>
        Payroll Dynamics, Inc. | Workforce Management Solutions
      </footer>
    </div>
  );
};


// Render App
ReactDOM.createRoot(document.getElementById('root')).render(<App />);