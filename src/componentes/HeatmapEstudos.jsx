// src/componentes/HeatmapEstudos.jsx
import React, { useState, useEffect } from 'react';

const HeatmapEstudos = ({ tarefas }) => {
  const [diasEstudo, setDiasEstudo] = useState({});
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [stats, setStats] = useState({ totalEstudos: 0, streakAtual: 0, melhorStreak: 0 });

  // Função para carregar dados do Pomodoro
  const carregarDadosPomodoro = () => {
    const estudoPorDia = {};
    
    // 1️⃣ Carregar dados do Pomodoro Global
    const pomodoroGlobal = localStorage.getItem('pomodoro_global');
    if (pomodoroGlobal) {
      const dados = JSON.parse(pomodoroGlobal);
      // O pomodoro_global salva apenas o total do dia atual
      const hoje = new Date().toISOString().slice(0, 10);
      if (dados.data === hoje) {
        estudoPorDia[hoje] = dados.tempoTotalFoco || 0;
      }
    }
    
    // 2️⃣ Carregar histórico de estudos (se existir)
    const historicoEstudos = localStorage.getItem('historico_estudos');
    if (historicoEstudos) {
      const historico = JSON.parse(historicoEstudos);
      Object.assign(estudoPorDia, historico);
    }
    
    // 3️⃣ Também considerar tarefas concluídas como estudo (cada tarefa = 25min)
    const tarefasConcluidas = tarefas?.concluido || [];
    tarefasConcluidas.forEach(tarefa => {
      if (tarefa.dataConclusao) {
        const data = tarefa.dataConclusao.split('T')[0];
        estudoPorDia[data] = (estudoPorDia[data] || 0) + 25;
      }
    });
    
    setDiasEstudo(estudoPorDia);
    calcularStreak(estudoPorDia);
  };

  // Calcular streak (dias consecutivos)
  const calcularStreak = (estudoPorDia) => {
    const hoje = new Date().toISOString().slice(0, 10);
    let streakAtual = 0;
    let melhorStreak = 0;
    let streakTemp = 0;
    
    // Verificar streak atual (dias consecutivos estudando)
    let data = new Date();
    for (let i = 0; i < 365; i++) {
      const dataStr = data.toISOString().slice(0, 10);
      if (estudoPorDia[dataStr] && estudoPorDia[dataStr] > 0) {
        streakAtual++;
        streakTemp++;
        melhorStreak = Math.max(melhorStreak, streakTemp);
      } else {
        streakTemp = 0;
        if (i > 0) break;
      }
      data.setDate(data.getDate() - 1);
    }
    
    const totalEstudos = Object.values(estudoPorDia).reduce((a, b) => a + b, 0);
    setStats({ totalEstudos, streakAtual, melhorStreak });
  };

  // Salvar dados de estudo quando o Pomodoro terminar
  const salvarEstudoDoDia = (minutos) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const historico = JSON.parse(localStorage.getItem('historico_estudos') || '{}');
    historico[hoje] = (historico[hoje] || 0) + minutos;
    localStorage.setItem('historico_estudos', JSON.stringify(historico));
    carregarDadosPomodoro(); // Recarregar dados
  };

  // Escutar eventos do Pomodoro (quando um ciclo termina)
  useEffect(() => {
    carregarDadosPomodoro();
    
    // Criar um evento personalizado para ouvir quando o Pomodoro salva dados
    window.addEventListener('pomodoro-ciclo-completo', (event) => {
      carregarDadosPomodoro();
    });
    
    return () => {
      window.removeEventListener('pomodoro-ciclo-completo', () => {});
    };
  }, [tarefas]);

  const getIntensidade = (data) => {
    const minutos = diasEstudo[data] || 0;
    if (minutos === 0) return 'bg-gray-100';
    if (minutos < 30) return 'bg-green-100';
    if (minutos < 60) return 'bg-green-200';
    if (minutos < 120) return 'bg-green-300';
    if (minutos < 180) return 'bg-green-400';
    return 'bg-green-500';
  };

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  // Gerar dias do mês
  const diasNoMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
  const primeiroDia = new Date(anoSelecionado, mesSelecionado, 1).getDay();

  // Formatar minutos para horas
  const formatarTempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}min`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}min`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20">
      <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-fire text-[#F9D949]" />
              Mapa de Estudos
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Baseado nos seus ciclos Pomodoro
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setAnoSelecionado(anoSelecionado - 1)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              <i className="fas fa-chevron-left text-sm" />
            </button>
            <span className="bg-white/20 px-3 py-1 rounded-full text-white font-semibold text-sm">
              {anoSelecionado}
            </span>
            <button 
              onClick={() => setAnoSelecionado(anoSelecionado + 1)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              <i className="fas fa-chevron-right text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-5 border-b border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#5E2A8C]">{formatarTempo(stats.totalEstudos)}</div>
          <div className="text-xs text-gray-500">Total estudado</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#F9D949]">{stats.streakAtual}</div>
          <div className="text-xs text-gray-500">Dias seguidos 🔥</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{stats.melhorStreak}</div>
          <div className="text-xs text-gray-500">Melhor sequência 🏆</div>
        </div>
      </div>

      {/* Calendário Heatmap */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <select 
            value={mesSelecionado} 
            onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#F9D949] focus:outline-none"
          >
            {meses.map((mes, idx) => (
              <option key={idx} value={idx}>{mes}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Menos</span>
            <div className="flex gap-1">
              <div className="w-5 h-5 bg-gray-100 rounded-md"></div>
              <div className="w-5 h-5 bg-green-200 rounded-md"></div>
              <div className="w-5 h-5 bg-green-300 rounded-md"></div>
              <div className="w-5 h-5 bg-green-400 rounded-md"></div>
              <div className="w-5 h-5 bg-green-500 rounded-md"></div>
            </div>
            <span className="text-gray-500">Mais</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
            <div key={i} className="text-center text-xs font-bold text-gray-400 py-2">{dia}</div>
          ))}
          
          {Array.from({ length: primeiroDia }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          
          {Array.from({ length: diasNoMes }).map((_, i) => {
            const dia = i + 1;
            const dataStr = `${anoSelecionado}-${String(mesSelecionado + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const intensidade = getIntensidade(dataStr);
            const minutos = diasEstudo[dataStr] || 0;
            const ehDiaAtual = dataStr === new Date().toISOString().slice(0, 10);
            
            return (
              <div key={dia} className="group relative">
                <div className={`
                  ${intensidade} p-2 rounded-lg text-center text-sm font-medium transition-all 
                  hover:scale-110 cursor-pointer
                  ${ehDiaAtual ? 'ring-2 ring-[#F9D949] ring-offset-1' : ''}
                `}>
                  {dia}
                </div>
                {minutos > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20">
                    🍅 {formatarTempo(minutos)} estudados
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensagem motivacional baseada nos dados */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-chart-line text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700">
              {stats.streakAtual === 0 && "⚡ Comece seu primeiro Pomodoro hoje! 25 minutos de foco!"}
              {stats.streakAtual === 1 && "🔥 1 dia de sequência! Continue assim!"}
              {stats.streakAtual >= 2 && stats.streakAtual < 5 && `🔥🔥 ${stats.streakAtual} dias seguidos! Você está no caminho!`}
              {stats.streakAtual >= 5 && stats.streakAtual < 10 && `🏆 INCRÍVEL! ${stats.streakAtual} dias de estudo consecutivos!`}
              {stats.streakAtual >= 10 && `🎉 LENDÁRIO! ${stats.streakAtual} dias seguidos! Você é uma máquina!`}
            </p>
            {stats.totalEstudos === 0 && (
              <p className="text-xs text-green-600 mt-1">
                <i className="fas fa-lightbulb mr-1" />
                Complete um ciclo Pomodoro de 25 minutos para ver seu progresso!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapEstudos;