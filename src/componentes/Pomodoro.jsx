// src/components/Pomodoro.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

const Pomodoro = ({ tarefas, onTarefaSelecionada }) => {
  const [tempo, setTempo] = useState(25 * 60);
  const [estaAtivo, setEstaAtivo] = useState(false);
  const [modo, setModo] = useState('pomodoro');
  const [ciclos, setCiclos] = useState(0);
  const [tarefaAtual, setTarefaAtual] = useState(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [notificacaoPermitida, setNotificacaoPermitida] = useState(false);
  const [tempoTotalFoco, setTempoTotalFoco] = useState(0);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const tempos = {
    pomodoro: 25 * 60,
    pausaCurta: 5 * 60,
    pausaLonga: 15 * 60
  };

  // Carregar dados salvos
  useEffect(() => {
    const salvos = localStorage.getItem('pomodoro_global');
    if (salvos) {
      const dados = JSON.parse(salvos);
      const hoje = new Date().toDateString();
      if (dados.data === hoje) {
        setCiclos(dados.ciclosHoje || 0);
        setTempoTotalFoco(dados.tempoTotalFoco || 0);
      }
    }
  }, []);

  // Salvar dados do Pomodoro
  const salvarDadosPomodoro = useCallback((novoCiclos, novoTempoTotal) => {
    const hoje = new Date().toDateString();
    localStorage.setItem('pomodoro_global', JSON.stringify({
      ciclosHoje: novoCiclos,
      tempoTotalFoco: novoTempoTotal,
      data: hoje
    }));
  }, []);

  // Salvar dados no Heatmap (histórico)
  const salvarNoHeatmap = useCallback((minutos) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const historico = JSON.parse(localStorage.getItem('historico_estudos') || '{}');
    historico[hoje] = (historico[hoje] || 0) + minutos;
    localStorage.setItem('historico_estudos', JSON.stringify(historico));
    
    // Disparar evento para atualizar o Heatmap
    window.dispatchEvent(new Event('pomodoro-ciclo-completo'));
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificacaoPermitida(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    audioRef.current = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const minutos = Math.floor(tempo / 60);
    const segundos = tempo % 60;
    const tempoStr = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    const prefixo = modo === 'pomodoro' ? 'Foco' : modo === 'pausaCurta' ? 'Pausa' : 'Descanso';
    document.title = estaAtivo ? `${prefixo} ${tempoStr} - VioletaFlow` : 'VioletaFlow';
    
    return () => {
      document.title = 'VioletaFlow';
    };
  }, [tempo, estaAtivo, modo]);

  const pararTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setEstaAtivo(false);
  }, []);

  const notificar = useCallback((titulo, corpo) => {
    if (notificacaoPermitida && Notification.permission === 'granted') {
      new Notification(titulo, { 
        body: corpo,
        icon: 'https://cdn-icons-png.flaticon.com/512/3294/3294646.png',
        silent: false
      });
    }
    
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Erro ao tocar som:', e));
    }
    
    if ('vibrate' in navigator) {
      navigator.vibrate(500);
    }
  }, [notificacaoPermitida]);

  const alternarModo = useCallback((novoModo) => {
    pararTimer();
    setModo(novoModo);
    setTempo(tempos[novoModo]);
    
    if (novoModo === 'pomodoro') {
      setTarefaAtual(null);
    }
  }, [pararTimer, tempos]);

  const completarCiclo = useCallback(() => {
    if (modo === 'pomodoro') {
      const novoCiclo = ciclos + 1;
      const novoTempoTotal = tempoTotalFoco + 25;
      
      setCiclos(novoCiclo);
      setTempoTotalFoco(novoTempoTotal);
      
      salvarDadosPomodoro(novoCiclo, novoTempoTotal);
      salvarNoHeatmap(25);
      
      notificar(
        'Pomodoro Concluído', 
        tarefaAtual ? `Estudo na tarefa: ${tarefaAtual.titulo}` : '25 minutos de foco!'
      );
      
      if (novoCiclo % 4 === 0) {
        alternarModo('pausaLonga');
        notificar('Pausa Longa', '15 minutos de descanso');
      } else {
        alternarModo('pausaCurta');
        notificar('Pausa Curta', '5 minutos de descanso');
      }
    } else {
      notificar('Hora de Focar', 'A pausa acabou, volte ao trabalho');
      alternarModo('pomodoro');
    }
  }, [modo, ciclos, tempoTotalFoco, alternarModo, notificar, tarefaAtual, salvarDadosPomodoro, salvarNoHeatmap]);

  useEffect(() => {
    if (estaAtivo && tempo > 0) {
      intervalRef.current = setInterval(() => {
        setTempo(prev => prev - 1);
      }, 1000);
    } else if (estaAtivo && tempo === 0) {
      completarCiclo();
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [estaAtivo, tempo, completarCiclo]);

  const iniciarTimer = () => {
    if (tempo === 0) {
      setTempo(tempos[modo]);
    }
    setEstaAtivo(true);
  };

  const pausarTimer = () => {
    pararTimer();
  };

  const resetarTimer = () => {
    pararTimer();
    setTempo(tempos[modo]);
    setEstaAtivo(false);
  };

  const selecionarTarefa = (tarefa) => {
    setTarefaAtual(tarefa);
    setMostrarSelector(false);
    if (onTarefaSelecionada) {
      onTarefaSelecionada(tarefa);
    }
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progresso = ((tempos[modo] - tempo) / tempos[modo]) * 100;

  const tarefasPendentes = [
    ...tarefas.fazer.map(t => ({ ...t, status: 'fazer' })),
    ...tarefas.andamento.map(t => ({ ...t, status: 'andamento' }))
  ];

  const getModoIcone = () => {
    switch(modo) {
      case 'pomodoro': return <i className="fas fa-brain text-white" />;
      case 'pausaCurta': return <i className="fas fa-coffee text-white" />;
      case 'pausaLonga': return <i className="fas fa-tree text-white" />;
      default: return <i className="fas fa-clock text-white" />;
    }
  };

  const getModoTitulo = () => {
    switch(modo) {
      case 'pomodoro': return 'Foco';
      case 'pausaCurta': return 'Pausa Curta';
      case 'pausaLonga': return 'Pausa Longa';
      default: return 'Pomodoro';
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#5E2A8C] to-[#7B3FAC] rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-white/10 backdrop-blur p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <i className="fas fa-hourglass-half text-[#F9D949]" />
            Pomodoro Timer
          </h2>
          <div className="bg-white/20 rounded-full px-3 py-1">
            <span className="text-white text-sm">
              <i className="fas fa-chart-line mr-1 text-[#F9D949]" />
              Ciclo {ciclos}/4
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 text-center">
        <div className="relative inline-block">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#F9D949"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progresso / 100)}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white font-mono">
              {formatarTempo(tempo)}
            </div>
            <div className="text-white/70 text-sm mt-2 flex items-center gap-1">
              {getModoIcone()} {getModoTitulo()}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-6">
          {!estaAtivo ? (
            <button
              onClick={iniciarTimer}
              className="bg-[#F9D949] text-[#5E2A8C] px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <i className="fas fa-play" /> Iniciar
            </button>
          ) : (
            <button
              onClick={pausarTimer}
              className="bg-[#F9D949] text-[#5E2A8C] px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <i className="fas fa-pause" /> Pausar
            </button>
          )}
          <button
            onClick={resetarTimer}
            className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2"
          >
            <i className="fas fa-redo-alt" /> Reset
          </button>
        </div>

        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={() => alternarModo('pomodoro')}
            className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1 ${
              modo === 'pomodoro' 
                ? 'bg-[#F9D949] text-[#5E2A8C]' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <i className="fas fa-brain" /> Foco 25
          </button>
          <button
            onClick={() => alternarModo('pausaCurta')}
            className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1 ${
              modo === 'pausaCurta' 
                ? 'bg-[#F9D949] text-[#5E2A8C]' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <i className="fas fa-coffee" /> Pausa 5
          </button>
          <button
            onClick={() => alternarModo('pausaLonga')}
            className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1 ${
              modo === 'pausaLonga' 
                ? 'bg-[#F9D949] text-[#5E2A8C]' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <i className="fas fa-tree" /> Descanso 15
          </button>
        </div>
      </div>

      <div className="border-t border-white/20 p-4 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
              <i className="fas fa-tasks" /> Tarefa em foco
            </p>
            {tarefaAtual ? (
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-[#F9D949] text-xs" />
                <span className="text-white text-sm font-medium truncate">
                  {tarefaAtual.titulo}
                </span>
                <button
                  onClick={() => setTarefaAtual(null)}
                  className="text-white/40 hover:text-white/80 text-xs"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <p className="text-white/50 text-sm flex items-center gap-1">
                <i className="fas fa-info-circle" /> Nenhuma tarefa selecionada
              </p>
            )}
          </div>
          <button
            onClick={() => setMostrarSelector(!mostrarSelector)}
            className="bg-[#F9D949] text-[#5E2A8C] px-3 py-1.5 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-1"
          >
            <i className="fas fa-plus" /> Tarefa
          </button>
        </div>

        {mostrarSelector && (
          <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
            {tarefasPendentes.length > 0 ? (
              tarefasPendentes.map((tarefa, idx) => (
                <button
                  key={tarefa.id || idx}
                  onClick={() => selecionarTarefa(tarefa)}
                  className="w-full text-left bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">
                      {tarefa.status === 'fazer' ? <i className="fas fa-list" /> : <i className="fas fa-play" />}
                    </span>
                    <span className="text-white text-sm flex-1 truncate">
                      {tarefa.titulo}
                    </span>
                    <span className="text-white/40 group-hover:text-white/80 text-xs">
                      <i className="fas fa-arrow-right" />
                    </span>
                  </div>
                  {tarefa.horario && (
                    <p className="text-white/40 text-xs mt-1 ml-5 flex items-center gap-1">
                      <i className="far fa-clock" /> {tarefa.horario}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-4 bg-white/10 rounded-lg">
                <i className="fas fa-check-circle text-white/40 text-2xl mb-2 block" />
                <p className="text-white/50 text-sm">
                  Nenhuma tarefa pendente
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Adicione tarefas no Kanban
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/20 p-3 bg-black/20">
        <div className="flex justify-between text-white/50 text-xs">
          <span className="flex items-center gap-1">
            <i className="fas fa-chart-line" /> {ciclos} ciclos hoje
          </span>
          <span className="flex items-center gap-1">
            <i className="far fa-clock" /> {Math.floor(tempoTotalFoco / 60)} min foco
          </span>
          <span className="flex items-center gap-1">
            <i className="fas fa-bell" /> {notificacaoPermitida ? 'Notificações ON' : 'Notificações OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;