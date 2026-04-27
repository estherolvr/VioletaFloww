// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Calendario from './Calendar';
import Kanban from './Kanban';
import Pomodoro from './Pomodoro';
import HeatmapEstudos from './HeatmapEstudos';
import RoteiroEstudos from './RoteiroEstudos';
import GerenciadorMaterias from './GerenciadorMaterias';
import { tarefasAPI, eventosAPI } from '../services/api';

const Dashboard = ({ onLogout }) => {
  const [eventos, setEventos] = useState([]);
  const [tarefas, setTarefas] = useState({ fazer: [], andamento: [], concluido: [] });
  const [dataAtual, setDataAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().slice(0, 10));
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('painel');

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('violetaflow_usuario') || sessionStorage.getItem('violetaflow_usuario');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const tarefasResponse = await tarefasAPI.getAll();
      if (tarefasResponse.success) {
        setTarefas(tarefasResponse.tarefas);
      }

      const eventosResponse = await eventosAPI.getAll();
      if (eventosResponse.success) {
        setEventos(eventosResponse.eventos);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const adicionarEvento = async (titulo, data, horario) => {
    if (!titulo.trim() || !data) return false;
    try {
      const response = await eventosAPI.create({ titulo, data, horario });
      if (response.success) {
        await carregarDados();
        setDataSelecionada(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      return false;
    }
  };

  const deletarEvento = async (id) => {
    const response = await eventosAPI.delete(id);
    if (response.success) await carregarDados();
  };

  const atualizarEvento = async (id, novoTitulo, novaData, novoHorario) => {
    const response = await eventosAPI.update(id, { titulo: novoTitulo, data: novaData, horario: novoHorario });
    if (response.success) await carregarDados();
  };

  const handleLogout = () => {
    localStorage.removeItem('violetaflow_token');
    localStorage.removeItem('violetaflow_usuario');
    localStorage.removeItem('violetaflow_logado');
    sessionStorage.removeItem('violetaflow_token');
    sessionStorage.removeItem('violetaflow_usuario');
    sessionStorage.removeItem('violetaflow_logado');
    if (onLogout) onLogout();
  };

  // ========== FUNÇÃO PARA PEGAR A DATA DE HOJE (início do dia) ==========
  const getDataHoje = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
  };

  // ========== FILTRAR APENAS EVENTOS FUTUROS (hoje ou depois) ==========
  const getEventosFuturos = () => {
    const hoje = getDataHoje();
    
    return eventos
      .filter(evento => {
        const dataEvento = new Date(evento.data);
        dataEvento.setHours(0, 0, 0, 0);
        return dataEvento >= hoje;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  };

  // ========== EVENTOS PRÓXIMOS (máximo 5, apenas futuros) ==========
  const eventosProximos = getEventosFuturos().slice(0, 5);

  // ========== ESTATÍSTICAS CONSIDERANDO APENAS EVENTOS FUTUROS ==========
  const totalEventosFuturos = getEventosFuturos().length;
  
  // ========== EVENTOS DE HOJE ==========
  const getEventosHoje = () => {
    const hoje = getDataHoje();
    return eventos.filter(evento => {
      const dataEvento = new Date(evento.data);
      dataEvento.setHours(0, 0, 0, 0);
      return dataEvento.getTime() === hoje.getTime();
    });
  };
  
  const eventosHoje = getEventosHoje();
  const totalEventosHoje = eventosHoje.length;

  // Estatísticas de tarefas
  const tarefasPendentes = tarefas.fazer.length + tarefas.andamento.length;
  const tarefasConcluidas = tarefas.concluido.length;
  const totalTarefas = tarefasPendentes + tarefasConcluidas;
  const produtividadePercentual = totalTarefas === 0 ? 0 : Math.round((tarefasConcluidas / totalTarefas) * 100);

  // Últimas tarefas (pendentes)
  const tarefasRecentes = [...tarefas.fazer, ...tarefas.andamento].slice(0, 5);

  const dataAtualFormatada = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Configuração das abas
  const abas = [
    { id: 'painel', icone: 'fas fa-chart-pie', label: 'Painel', desc: 'Visão geral', cor: 'purple' },
    { id: 'agenda', icone: 'fas fa-calendar-alt', label: 'Agenda', desc: 'Compromissos', cor: 'blue' },
    { id: 'kanban', icone: 'fas fa-tasks', label: 'Kanban', desc: 'Tarefas', cor: 'yellow' },
    { id: 'pomodoro', icone: 'fas fa-hourglass-half', label: 'Foco', desc: 'Estudo', cor: 'red' },
    { id: 'notas', icone: 'fas fa-calculator', label: 'Notas', desc: 'Médias', cor: 'green' }
  ];

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#f8f3fe] to-[#f0e6fe]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5E2A8C] border-t-[#F9D949] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5E2A8C] font-medium">Carregando seu espaço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#f8f3fe] to-[#f0e6fe]">
      {/* ========== SIDEBAR ========== */}
      <aside className="w-20 md:w-64 bg-gradient-to-b from-[#5E2A8C] to-[#3C096C] flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-4 md:p-5 border-b border-white/10">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#F9D949] rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-alt text-[#5E2A8C] text-sm md:text-base" />
            </div>
            <span className="hidden md:block text-white font-bold text-lg">Violeta<span className="text-[#F9D949]">Flow</span></span>
          </div>
        </div>
        
        {/* Perfil */}
        <div className="hidden md:block px-4 py-3 mx-3 mt-3 bg-white/10 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F9D949] rounded-full flex items-center justify-center">
              <i className="fas fa-user text-[#5E2A8C] text-xs" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{usuario?.nome?.split(' ')[0] || 'Estudante'}</p>
              <p className="text-white/40 text-xs">Bem-vindo(a)</p>
            </div>
          </div>
        </div>
        
        {/* Navegação */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {abas.map((item) => {
            const isActive = abaAtiva === item.id;
            const cores = {
              purple: isActive ? 'bg-purple-500/20 text-purple-300' : '',
              blue: isActive ? 'bg-blue-500/20 text-blue-300' : '',
              yellow: isActive ? 'bg-yellow-500/20 text-yellow-300' : '',
              red: isActive ? 'bg-red-500/20 text-red-300' : '',
              green: isActive ? 'bg-green-500/20 text-green-300' : ''
            };
            
            return (
              <button 
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive ? `${cores[item.cor]} shadow-md` : 'text-white/60 hover:bg-white/10 hover:text-white'}
                `}
              >
                <i className={`${item.icone} text-base w-5 text-center`} />
                <span className="hidden md:inline text-sm font-medium">{item.label}</span>
                {isActive && <div className="hidden md:block ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
              </button>
            );
          })}
        </nav>
        
        {/* Produtividade */}
        <div className="hidden md:block p-4 mx-3 mb-3 bg-white/10 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/50 text-xs">
              <i className="fas fa-chart-line mr-1" /> Produtividade
            </span>
            <span className="text-[#F9D949] text-sm font-bold">{produtividadePercentual}%</span>
          </div>
          <div className="h-1.5 bg-[#3C096C] rounded-full overflow-hidden">
            <div className="h-full bg-[#F9D949] rounded-full transition-all" style={{ width: `${produtividadePercentual}%` }} />
          </div>
          <p className="text-white/30 text-xs mt-2">
            {tarefasConcluidas}/{totalTarefas} tarefas
          </p>
        </div>
        
        {/* Sair */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-xl text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <i className="fas fa-sign-out-alt text-sm" />
            <span className="hidden md:inline text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* ========== CONTEÚDO PRINCIPAL ========== */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#F9D949]/20 px-5 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#5E2A8C] to-[#9B51E0] bg-clip-text text-transparent">
                {abaAtiva === 'painel' && <><i className="fas fa-chart-pie mr-2 text-[#5E2A8C]" />Painel de Controle</>}
                {abaAtiva === 'agenda' && <><i className="fas fa-calendar-alt mr-2 text-[#5E2A8C]" />Minha Agenda</>}
                {abaAtiva === 'kanban' && <><i className="fas fa-tasks mr-2 text-[#5E2A8C]" />Quadro Kanban</>}
                {abaAtiva === 'pomodoro' && <><i className="fas fa-hourglass-half mr-2 text-[#5E2A8C]" />Modo Foco</>}
                {abaAtiva === 'notas' && <><i className="fas fa-calculator mr-2 text-[#5E2A8C]" />Gerenciador de Matérias</>}
              </h1>
              <p className="text-[#6F42A1] text-xs mt-0.5">
                {abaAtiva === 'painel' && 'Visão geral da sua produtividade'}
                {abaAtiva === 'agenda' && 'Gerencie seus compromissos e eventos'}
                {abaAtiva === 'kanban' && 'Organize suas tarefas com o método Kanban'}
                {abaAtiva === 'pomodoro' && 'Timer para estudar com foco total'}
                {abaAtiva === 'notas' && 'Gerencie suas matérias, notas e cálculos de média'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-[#f8f3fe] px-3 py-1.5 rounded-full">
              <i className="far fa-calendar-alt text-[#5E2A8C] text-sm" />
              <span className="text-[#3C096C] text-sm capitalize">{dataAtualFormatada}</span>
            </div>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="p-4 md:p-6">
          
          {/* ========== ABA PAINEL ========== */}
          {abaAtiva === 'painel' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Cards de estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-purple-500 text-xs font-semibold uppercase">
                        <i className="fas fa-calendar-week mr-1" /> Total Compromissos
                      </p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{totalEventosFuturos}</p>
                      <p className="text-xs text-gray-400 mt-1">Futuros + Hoje</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-calendar-check text-purple-500 text-lg" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-green-500 text-xs font-semibold uppercase">
                        <i className="fas fa-calendar-day mr-1" /> Compromissos Hoje
                      </p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{totalEventosHoje}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {totalEventosHoje === 0 ? 'Nenhum hoje' : totalEventosHoje === 1 ? '1 hoje' : `${totalEventosHoje} hoje`}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-calendar-day text-green-500 text-lg" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-yellow-500 text-xs font-semibold uppercase">
                        <i className="fas fa-list-ul mr-1" /> Pendentes
                      </p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{tarefasPendentes}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-list-ul text-yellow-500 text-lg" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-blue-500 text-xs font-semibold uppercase">
                        <i className="fas fa-check-circle mr-1" /> Concluídas
                      </p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{tarefasConcluidas}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-check-circle text-blue-500 text-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerta de compromissos hoje */}
              {totalEventosHoje > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-bell text-green-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="text-green-700 font-semibold text-sm">
                        <i className="fas fa-clock mr-1" /> Lembrete de Hoje
                      </p>
                      <p className="text-green-600 text-sm">
                        Você tem {totalEventosHoje} compromisso{totalEventosHoje !== 1 ? 's' : ''} marcado{totalEventosHoje !== 1 ? 's' : ''} para hoje!
                      </p>
                    </div>
                    <button 
                      onClick={() => setAbaAtiva('agenda')}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition"
                    >
                      Ver agenda
                    </button>
                  </div>
                </div>
              )}

              {/* Progresso do dia */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">
                    <i className="fas fa-chart-line text-[#5E2A8C] mr-2" />
                    Progresso Geral
                  </h3>
                  <span className="text-sm text-gray-500">{produtividadePercentual}% completo</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5E2A8C] to-[#F9D949] rounded-full transition-all duration-500"
                    style={{ width: `${produtividadePercentual}%` }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-xs text-gray-400">
                  <span><i className="fas fa-check-circle mr-1" /> {tarefasConcluidas} tarefas concluídas</span>
                  <span><i className="fas fa-clock mr-1" /> {tarefasPendentes} pendentes</span>
                  <span><i className="fas fa-calendar mr-1" /> {totalEventosFuturos} compromissos futuros</span>
                </div>
              </div>

              {/* NOVAS FUNCIONALIDADES: Heatmap + Roteiro */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HeatmapEstudos tarefas={tarefas} />
                {/* CORREÇÃO: Adicionado key para forçar recriação do componente quando o usuário muda */}
                <RoteiroEstudos 
                  key={usuario?.id || 'sem-usuario'} 
                  tarefas={tarefas} 
                  eventos={eventos} 
                  usuarioId={usuario?.id} 
                />
              </div>

              {/* Próximos Eventos + Tarefas Recentes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Próximos Compromissos */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
                    <h3 className="text-white font-semibold">
                      <i className="fas fa-calendar-week mr-2" />
                      Próximos Compromissos
                    </h3>
                    <p className="text-white/70 text-xs mt-0.5">
                      <i className="fas fa-clock mr-1" />A partir de hoje
                    </p>
                  </div>
                  <div className="p-4">
                    {eventosProximos.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <i className="fas fa-calendar-plus text-3xl mb-2 block" />
                        <p className="text-sm">Nenhum compromisso futuro</p>
                        <p className="text-xs text-gray-300 mt-1">Que tal agendar algo?</p>
                        <button 
                          onClick={() => setAbaAtiva('agenda')}
                          className="mt-2 text-purple-500 text-xs hover:underline"
                        >
                          Adicionar na Agenda →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {eventosProximos.map((evento, idx) => {
                          const dataEvento = new Date(evento.data);
                          const hoje = new Date();
                          const isHoje = dataEvento.toDateString() === hoje.toDateString();
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-purple-50 rounded-lg transition">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHoje ? 'bg-green-100' : 'bg-purple-100'}`}>
                                  <i className={`fas ${isHoje ? 'fa-calendar-day' : 'fa-calendar-alt'} ${isHoje ? 'text-green-500' : 'text-purple-500'} text-xs`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">{evento.titulo}</p>
                                  <p className="text-xs text-gray-400">
                                    {isHoje ? (
                                      <span className="text-green-600 font-medium">
                                        <i className="fas fa-hourglass-start mr-1" />HOJE
                                      </span>
                                    ) : (
                                      new Date(evento.data).toLocaleDateString('pt-BR')
                                    )}
                                    {evento.horario && ` • ${evento.horario}`}
                                  </p>
                                </div>
                              </div>
                              {isHoje && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                  Hoje
                                </span>
                              )}
                            </div>
                          );
                        })}
                        
                        {getEventosFuturos().length > 5 && (
                          <button 
                            onClick={() => setAbaAtiva('agenda')}
                            className="w-full mt-2 text-center text-purple-500 text-xs hover:underline py-1"
                          >
                            + {getEventosFuturos().length - 5} outros compromissos →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarefas Recentes */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3">
                    <h3 className="text-white font-semibold">
                      <i className="fas fa-list-check mr-2" />
                      Tarefas Pendentes
                    </h3>
                  </div>
                  <div className="p-4">
                    {tarefasRecentes.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <i className="fas fa-check-double text-3xl mb-2 block" />
                        <p className="text-sm">Todas as tarefas concluídas!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tarefasRecentes.map((tarefa, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 hover:bg-yellow-50 rounded-lg transition">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-tasks text-yellow-500 text-xs" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{tarefa.titulo}</p>
                                {tarefa.horario && (
                                  <p className="text-xs text-gray-400"><i className="far fa-clock mr-1" />{tarefa.horario}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={() => setAbaAtiva('kanban')}
                      className="w-full mt-3 text-center text-yellow-600 text-sm hover:underline py-2"
                    >
                      Ver todas no Kanban →
                    </button>
                  </div>
                </div>
              </div>

              {/* Dica do dia */}
              <div className="bg-gradient-to-r from-[#5E2A8C]/10 to-[#F9D949]/10 rounded-xl p-4 border border-[#F9D949]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F9D949] rounded-full flex items-center justify-center">
                    <i className="fas fa-lightbulb text-[#5E2A8C] text-lg" />
                  </div>
                  <div>
                    <p className="text-[#5E2A8C] font-semibold text-sm">
                      <i className="fas fa-star mr-1" /> Dica do Dia
                    </p>
                    <p className="text-gray-600 text-sm">
                      {produtividadePercentual < 30 && "Comece com uma tarefa pequena para ganhar momentum!"}
                      {produtividadePercentual >= 30 && produtividadePercentual < 70 && "Você está no caminho certo! Faça uma pausa e volte com tudo!"}
                      {produtividadePercentual >= 70 && "Incrível! Você está muito produtivo hoje! Continue assim!"}
                      {totalTarefas === 0 && "Crie suas primeiras tarefas no Kanban e comece a organizar seus estudos!"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== ABA AGENDA ========== */}
          {abaAtiva === 'agenda' && (
            <div className="animate-fadeIn">
              <Calendario
                eventos={eventos}
                dataSelecionada={dataSelecionada}
                setDataSelecionada={setDataSelecionada}
                dataAtual={dataAtual}
                setDataAtual={setDataAtual}
                adicionarEvento={adicionarEvento}
                deletarEvento={deletarEvento}
                atualizarEvento={atualizarEvento}
              />
            </div>
          )}

          {/* ========== ABA KANBAN ========== */}
          {abaAtiva === 'kanban' && (
            <div className="animate-fadeIn">
              <Kanban
                tarefas={tarefas}
                setTarefas={setTarefas}
              />
            </div>
          )}

          {/* ========== ABA POMODORO ========== */}
          {abaAtiva === 'pomodoro' && (
            <div className="animate-fadeIn max-w-3xl mx-auto">
              <Pomodoro 
                tarefas={tarefas}
                onTarefaSelecionada={(tarefa) => console.log('Tarefa selecionada:', tarefa)}
              />
            </div>
          )}

          {/* ========== ABA NOTAS ========== */}
          {abaAtiva === 'notas' && (
            <div className="animate-fadeIn">
              <GerenciadorMaterias />
            </div>
          )}

        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;