import React, { useState } from 'react';

const Login = ({ onLogin, onVoltar }) => {
  // Estados do formulário
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [animacao, setAnimacao] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // URL do backend
  const API_URL = 'http://localhost:3001/api/auth';

  
  const realizarLogin = async (email, senha, lembrar) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha, lembrar })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao fazer login');
    }

    return data;
  };

  // Função de cadastro real
  const realizarCadastro = async (nome, email, senha, confirmarSenha) => {
    const response = await fetch(`${API_URL}/cadastro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome, email, senha, confirmarSenha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar conta');
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    setSucesso('');

    if (modo === 'login') {
      try {
        const response = await realizarLogin(email, senha, lembrar);
        
        if (response.success) {
          setSucesso('Login realizado com sucesso!');
          
          // Salvar token e dados do usuário
          if (response.token) {
            if (lembrar) {
              localStorage.setItem('violetaflow_token', response.token);
              localStorage.setItem('violetaflow_usuario', JSON.stringify(response.usuario));
              localStorage.setItem('violetaflow_logado', 'true');
            } else {
              sessionStorage.setItem('violetaflow_token', response.token);
              sessionStorage.setItem('violetaflow_usuario', JSON.stringify(response.usuario));
              sessionStorage.setItem('violetaflow_logado', 'true');
            }
          }
          
          setTimeout(() => {
            onLogin();
          }, 1000);
        }
      } catch (error) {
        setErro(error.message || 'Email ou senha incorretos');
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 500);
      }
    } else {
      // Validações locais antes de enviar para o backend
      if (!nome.trim()) {
        setErro('Por favor, digite seu nome');
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 500);
        setCarregando(false);
        return;
      }
      
      if (!email.trim()) {
        setErro('Por favor, digite seu email');
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 500);
        setCarregando(false);
        return;
      }
      
      if (senha.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres');
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 500);
        setCarregando(false);
        return;
      }
      
      if (senha !== confirmarSenha) {
        setErro('As senhas não coincidem');
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 500);
        setCarregando(false);
        return;
      }

      try {
        const response = await realizarCadastro(nome, email, senha, confirmarSenha);
        
        if (response.success) {
          setSucesso('Conta criada com sucesso! Faça login.');
          setTimeout(() => {
            setModo('login');
            setNome('');
            setEmail('');
            setSenha('');
            setConfirmarSenha('');
            setSucesso('');
          }, 2000);
        }
      } catch (error) {
        setErro(error.message || 'Erro ao criar conta');
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 500);
      }
    }
    setCarregando(false);
  };

  const alternarModo = () => {
    setModo(modo === 'login' ? 'cadastro' : 'login');
    setErro('');
    setSucesso('');
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
  };

  return (
    <div className="fixed inset-0 bg-[#1a0b2a] flex items-center justify-center z-50">
      {/* Container reduzido */}
      <div className={`relative z-10 w-full max-w-3xl mx-4 flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-2xl ${animacao ? 'animate-shake' : ''}`}>
        {/* Lado esquerdo - Informações (mais compacto) */}
        <div className="flex-1 bg-gradient-to-br from-[#5E2A8C] to-[#7B3FAC] p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#F9D949] rounded-xl flex items-center justify-center text-xl">
              <i className="fas fa-calendar-alt text-[#5E2A8C]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Violeta<span className="text-[#F9D949]">Flow</span></h1>
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            {modo === 'login' ? 'Bem-vindo!' : 'Comece agora!'}
          </h2>
          <p className="text-white/80 mb-5 text-sm leading-relaxed">
            {modo === 'login' 
              ? 'Acesse sua agenda digital e organize sua rotina acadêmica.'
              : 'Crie sua conta gratuita e organize seus compromissos e tarefas.'}
          </p>
          
          <ul className="space-y-2">
            {['Gestão de compromissos', 'Quadro Kanban', 'Lembretes'].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-white/90 text-sm">
                <i className="fas fa-check-circle text-[#F9D949] text-xs" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lado direito - Formulário (mais compacto) */}
        <div className="flex-1 p-6 md:p-8 bg-white">
          {onVoltar && modo === 'login' && (
            <button onClick={onVoltar} className="mb-3 text-[#5E2A8C] hover:text-[#F9D949] transition flex items-center gap-2 text-xs">
              <i className="fas fa-arrow-left" /> Voltar
            </button>
          )}
          
          <h3 className="text-xl font-bold text-[#2D0B4A] mb-1">
            {modo === 'login' ? 'Acessar conta' : 'Criar conta'}
          </h3>
          <p className="text-[#8B6EB0] mb-5 text-sm">
            {modo === 'login' ? 'Digite suas credenciais' : 'Preencha os dados abaixo'}
          </p>
          
          {sucesso && (
            <div className="mb-3 p-2 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 text-xs">
              <i className="fas fa-check-circle" />
              <span>{sucesso}</span>
            </div>
          )}
          
          {erro && (
            <div className="mb-3 p-2 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-xs">
              <i className="fas fa-exclamation-circle" />
              <span>{erro}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {modo === 'cadastro' && (
              <div className="mb-3">
                <label className="block text-[#5E2A8C] font-medium mb-1 text-sm">Nome</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B0E0] text-sm" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-[#F0E2FE] rounded-lg focus:border-[#F9D949] focus:outline-none transition-all text-sm"
                    placeholder="Seu nome"
                    disabled={carregando}
                  />
                </div>
              </div>
            )}
            
            <div className="mb-3">
              <label className="block text-[#5E2A8C] font-medium mb-1 text-sm">E-mail</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B0E0] text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-[#F0E2FE] rounded-lg focus:border-[#F9D949] focus:outline-none transition-all text-sm"
                  placeholder="seu@email.com"
                  disabled={carregando}
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-[#5E2A8C] font-medium mb-1 text-sm">Senha</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B0E0] text-sm" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border-2 border-[#F0E2FE] rounded-lg focus:border-[#F9D949] focus:outline-none transition-all text-sm"
                  placeholder={modo === 'login' ? 'Digite sua senha' : 'Mínimo 6 caracteres'}
                  disabled={carregando}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B0E0] hover:text-[#5E2A8C] transition"
                >
                  <i className={`fas ${mostrarSenha ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                </button>
              </div>
            </div>
            
            {modo === 'cadastro' && (
              <div className="mb-4">
                <label className="block text-[#5E2A8C] font-medium mb-1 text-sm">Confirmar senha</label>
                <div className="relative">
                  <i className="fas fa-check-circle absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B0E0] text-sm" />
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-[#F0E2FE] rounded-lg focus:border-[#F9D949] focus:outline-none transition-all text-sm"
                    placeholder="Confirme sua senha"
                    disabled={carregando}
                  />
                </div>
              </div>
            )}
            
            {modo === 'login' && (
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center gap-2 text-xs text-[#6F5B8E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="w-3 h-3 accent-[#5E2A8C] cursor-pointer"
                  />
                  Lembrar-me
                </label>
                <a href="#" className="text-xs text-[#5E2A8C] font-medium hover:text-[#F9D949] transition">Esqueceu a senha?</a>
              </div>
            )}
            
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-4"
            >
              {carregando ? (
                <><i className="fas fa-spinner fa-spin mr-2" /> {modo === 'login' ? 'Entrando...' : 'Criando...'}</>
              ) : (
                modo === 'login' ? (
                  <><i className="fas fa-arrow-right-to-bracket mr-2" /> Entrar</>
                ) : (
                  <><i className="fas fa-user-plus mr-2" /> Criar conta</>
                )
              )}
            </button>
          </form>
          
          
          
          <p className="text-center text-xs text-[#8B6EB0]">
            {modo === 'login' ? (
              <>Não tem uma conta? <button onClick={alternarModo} className="text-[#5E2A8C] font-semibold hover:text-[#F9D949] transition">Criar conta</button></>
            ) : (
              <>Já tem uma conta? <button onClick={alternarModo} className="text-[#5E2A8C] font-semibold hover:text-[#F9D949] transition">Fazer login</button></>
            )}
          </p>
          
    
            
     
        </div>
      </div>
    </div>
  );
};

export default Login;