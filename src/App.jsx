import React, { useState, useEffect } from 'react';
import Login from './componentes/Login';
import Landing from './componentes/Landing';
import Dashboard from './componentes/Dashboard';

function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [mostrarLanding, setMostrarLanding] = useState(true);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  useEffect(() => {
    const logado = localStorage.getItem('violetaflow_logado') || sessionStorage.getItem('violetaflow_logado');
    if (logado === 'true') {
      setEstaLogado(true);
      setMostrarLanding(false);
      setMostrarLogin(false);
    }
  }, []);

  const handleAcessarAgenda = () => {
    setMostrarLanding(false);
    setMostrarLogin(true);
  };

  const handleLogin = () => {
    setEstaLogado(true);
    setMostrarLanding(false);
    setMostrarLogin(false);
  };

  const handleLogout = () => {
    setEstaLogado(false);
    setMostrarLanding(true);
    setMostrarLogin(false);
  };

  const handleVoltarLanding = () => {
    setMostrarLanding(true);
    setMostrarLogin(false);
  };

  if (estaLogado) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (mostrarLanding) {
    return <Landing onEntrarDashboard={handleAcessarAgenda} />;
  }

  if (mostrarLogin) {
    return <Login onLogin={handleLogin} onVoltar={handleVoltarLanding} />;
  }

  return <Landing onEntrarDashboard={handleAcessarAgenda} />;
}

export default App;