import React, { useState, useEffect } from 'react';
import { roteirosAPI } from '../services/roteiros';

const RoteiroEstudos = ({ tarefas, eventos, usuarioId }) => {
  const [planoSemanal, setPlanoSemanal] = useState([]);
  const [metaDiaria, setMetaDiaria] = useState(120);
  const [modalAberto, setModalAberto] = useState(false);
  const [estudoEditando, setEstudoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [roteiroBackendId, setRoteiroBackendId] = useState(null);
  const [novoEstudo, setNovoEstudo] = useState({
    materia: '',
    tempo: 60,
    horario: '19:00',
    dia: ''
  });

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Inicializar plano semanal vazio
  const inicializarPlanoVazio = () => {
    return diasSemana.map(dia => ({
      dia,
      estudos: [],
      metaMinutos: 120,
      concluido: false
    }));
  };

  // Carregar dados do backend
  const carregarDados = async () => {
    if (!usuarioId) {
      setPlanoSemanal([]);
      setRoteiroBackendId(null);
      return;
    }

    setCarregando(true);
    
    try {
      console.log('📡 Buscando roteiro para usuário:', usuarioId);
      const response = await roteirosAPI.getAll();
      console.log('📡 Resposta:', response);
      
      if (response.success && response.roteiros && response.roteiros.length > 0) {
        const roteiro = response.roteiros[0];
        setRoteiroBackendId(roteiro.id);
        
        const itens = roteiro.itens || [];
        
        const planoConvertido = diasSemana.map(dia => {
          const itensDoDia = itens.filter(item => item.dia_semana === dia);
          
          return {
            dia,
            estudos: itensDoDia.map(item => ({
              id: item.id,
              materia: item.titulo,
              tempo: item.tempo_estudo || 60,
              horario: item.horario || '19:00',
              backendId: item.id
            })),
            metaMinutos: roteiro.meta_diaria || 120,
            concluido: false
          };
        });
        
        setPlanoSemanal(planoConvertido);
        if (roteiro.meta_diaria) setMetaDiaria(roteiro.meta_diaria);
      } else {
        setPlanoSemanal(inicializarPlanoVazio());
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setPlanoSemanal(inicializarPlanoVazio());
    } finally {
      setCarregando(false);
    }
  };

  // Executa quando usuarioId mudar
  useEffect(() => {
    carregarDados();
  }, [usuarioId]);

  // Salvar estudo no backend
  const salvarEstudoNoBackend = async (dia, estudo) => {
    if (!roteiroBackendId) return null;
    
    try {
      const response = await roteirosAPI.addItem(roteiroBackendId, {
        titulo: estudo.materia,
        descricao: `Tempo: ${estudo.tempo} minutos | Horário: ${estudo.horario}`,
        dia_semana: dia,
        tempo_estudo: estudo.tempo,
        horario: estudo.horario,
        data_prevista: new Date().toISOString().split('T')[0]
      });
      
      if (response.success) {
        return response.item.id;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      return null;
    }
  };

  // Remover estudo do backend
  const removerEstudoDoBackend = async (estudoId) => {
    if (!estudoId) return;
    try {
      await roteirosAPI.deleteItem(estudoId);
    } catch (error) {
      console.error('❌ Erro ao remover:', error);
    }
  };

  const adicionarEstudo = async () => {
    if (!novoEstudo.materia.trim()) {
      alert('Digite o nome da matéria!');
      return;
    }

    const novoItem = {
      id: Date.now(),
      materia: novoEstudo.materia,
      tempo: Number(novoEstudo.tempo),
      horario: novoEstudo.horario,
      backendId: null
    };

    const backendId = await salvarEstudoNoBackend(novoEstudo.dia, novoItem);
    if (backendId) {
      novoItem.backendId = backendId;
      novoItem.id = backendId;
    }

    const novoPlano = planoSemanal.map(dia => {
      if (dia.dia === novoEstudo.dia) {
        return {
          ...dia,
          estudos: [...dia.estudos, novoItem]
        };
      }
      return dia;
    });

    setPlanoSemanal(novoPlano);
    setModalAberto(false);
    setNovoEstudo({ materia: '', tempo: 60, horario: '19:00', dia: '' });
  };

  const editarEstudo = async () => {
    if (!estudoEditando) return;

    const novoPlano = planoSemanal.map(dia => {
      if (dia.dia === estudoEditando.dia) {
        const estudosAtualizados = dia.estudos.map(estudo => {
          if (estudo.id === estudoEditando.id) {
            return {
              ...estudo,
              materia: novoEstudo.materia,
              tempo: Number(novoEstudo.tempo),
              horario: novoEstudo.horario
            };
          }
          return estudo;
        });
        return { ...dia, estudos: estudosAtualizados };
      }
      return dia;
    });

    setPlanoSemanal(novoPlano);
    setModalAberto(false);
    setEstudoEditando(null);
    setNovoEstudo({ materia: '', tempo: 60, horario: '19:00', dia: '' });
  };

  const removerEstudo = async (diaNome, estudoId, backendId) => {
    if (backendId) {
      await removerEstudoDoBackend(backendId);
    }
    
    const novoPlano = planoSemanal.map(dia => {
      if (dia.dia === diaNome) {
        return {
          ...dia,
          estudos: dia.estudos.filter(estudo => estudo.id !== estudoId)
        };
      }
      return dia;
    });
    setPlanoSemanal(novoPlano);
  };

  const marcarConcluido = (diaIndex) => {
    const novoPlano = [...planoSemanal];
    novoPlano[diaIndex].concluido = !novoPlano[diaIndex].concluido;
    setPlanoSemanal(novoPlano);
  };

  const atualizarMeta = (diaIndex, novaMeta) => {
    const novoPlano = [...planoSemanal];
    novoPlano[diaIndex].metaMinutos = novaMeta;
    setPlanoSemanal(novoPlano);
  };

  const abrirModalEditar = (diaNome, estudo) => {
    setEstudoEditando({ ...estudo, dia: diaNome });
    setNovoEstudo({
      materia: estudo.materia,
      tempo: estudo.tempo,
      horario: estudo.horario,
      dia: diaNome
    });
    setModalAberto(true);
  };

  const abrirModalAdicionar = (dia) => {
    setEstudoEditando(null);
    setNovoEstudo({
      materia: '',
      tempo: 60,
      horario: '19:00',
      dia: dia
    });
    setModalAberto(true);
  };

  const calcularTotalDia = (estudos) => {
    if (!estudos || estudos.length === 0) return 0;
    return estudos.reduce((total, estudo) => total + (Number(estudo.tempo) || 0), 0);
  };

  const formatarTempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}min`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}min`;
  };

  const resetarSemana = async () => {
    if (confirm('Resetar todo o planejamento da semana?')) {
      for (const dia of planoSemanal) {
        for (const estudo of dia.estudos) {
          if (estudo.backendId) {
            await removerEstudoDoBackend(estudo.backendId);
          }
        }
      }
      setPlanoSemanal(inicializarPlanoVazio());
    }
  };

  if (carregando) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20 p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5E2A8C] border-t-[#F9D949] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando roteiro de estudos...</p>
        </div>
      </div>
    );
  }

  if (!usuarioId) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20 p-8">
        <div className="text-center">
          <i className="fas fa-lock text-gray-300 text-4xl mb-3 block"></i>
          <p className="text-gray-500">Faça login para ver seu roteiro de estudos</p>
        </div>
      </div>
    );
  }

  if (planoSemanal.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20 p-8">
        <div className="text-center">
          <i className="fas fa-calendar-plus text-gray-300 text-4xl mb-3 block"></i>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20">
      <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-calendar-week text-[#F9D949]" />
              Roteiro de Estudos
            </h2>
            <p className="text-white/70 text-sm mt-1">
              <i className="fas fa-pen mr-1" /> Personalize seu plano de estudos da semana
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-white/70 text-xs">
              <i className="fas fa-flag-checkered mr-1" /> Meta padrão:
            </label>
            <select 
              value={metaDiaria} 
              onChange={(e) => setMetaDiaria(Number(e.target.value))}
              className="bg-white/20 text-white rounded-lg px-2 py-1 text-sm"
            >
              <option value={60}>1h/dia</option>
              <option value={90}>1.5h/dia</option>
              <option value={120}>2h/dia</option>
              <option value={180}>3h/dia</option>
              <option value={240}>4h/dia</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto">
        {planoSemanal.map((dia, idx) => {
          const totalEstudo = calcularTotalDia(dia.estudos);
          const percentualMeta = Math.min(100, (totalEstudo / (dia.metaMinutos || metaDiaria)) * 100);
          
          return (
            <div key={idx} className={`p-4 hover:bg-gray-50 transition ${dia.concluido ? 'bg-green-50' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    idx < 5 ? 'bg-purple-100' : 'bg-orange-100'
                  }`}>
                    <i className={`fas ${idx < 5 ? 'fa-calendar-day' : 'fa-calendar-weekend'} ${
                      idx < 5 ? 'text-purple-600' : 'text-orange-600'
                    } text-sm`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${dia.concluido ? 'text-green-600 line-through' : 'text-gray-800'}`}>
                      {dia.dia}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <i className="fas fa-clock text-gray-400 text-xs" />
                        <span className="text-xs text-gray-500">
                          {formatarTempo(totalEstudo)} / {formatarTempo(dia.metaMinutos || metaDiaria)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const novaMeta = prompt('Nova meta em minutos:', dia.metaMinutos || metaDiaria);
                          if (novaMeta && !isNaN(novaMeta)) {
                            atualizarMeta(idx, parseInt(novaMeta));
                          }
                        }}
                        className="text-[#5E2A8C] text-xs hover:underline"
                      >
                        <i className="fas fa-edit" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${percentualMeta}%` }}
                    />
                  </div>
                  <button
                    onClick={() => marcarConcluido(idx)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      dia.concluido 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-500'
                    }`}
                  >
                    <i className={`fas ${dia.concluido ? 'fa-check' : 'fa-circle'}`} />
                  </button>
                </div>
              </div>

              <div className="ml-13 space-y-2">
                {!dia.estudos || dia.estudos.length === 0 ? (
                  <div className="text-center py-3 bg-gray-50 rounded-lg">
                    <i className="fas fa-book-open text-gray-300 text-sm" />
                    <p className="text-xs text-gray-400 mt-1">Nenhum estudo planejado</p>
                  </div>
                ) : (
                  dia.estudos.map((estudo) => (
                    <div key={estudo.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 group hover:shadow-sm transition">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-[#5E2A8C]/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-graduation-cap text-[#5E2A8C] text-xs" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{estudo.materia}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <i className="far fa-clock" /> {formatarTempo(estudo.tempo)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <i className="far fa-hourglass" /> {estudo.horario}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => abrirModalEditar(dia.dia, estudo)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-blue-100 text-blue-500 transition flex items-center justify-center"
                        >
                          <i className="fas fa-pen text-xs" />
                        </button>
                        <button
                          onClick={() => removerEstudo(dia.dia, estudo.id, estudo.backendId)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-red-100 text-red-500 transition flex items-center justify-center"
                        >
                          <i className="fas fa-trash-alt text-xs" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                
                <button
                  onClick={() => abrirModalAdicionar(dia.dia)}
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm hover:border-[#F9D949] hover:text-[#5E2A8C] transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus-circle" />
                  Adicionar estudo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={resetarSemana}
          className="w-full py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-sync-alt" />
          Resetar Semana
        </button>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-modal-in">
            <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F9D949] rounded-xl flex items-center justify-center">
                  <i className="fas fa-book-open text-[#5E2A8C] text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {estudoEditando ? 'Editar Estudo' : 'Novo Estudo'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {novoEstudo.dia} • {estudoEditando ? 'Altere os dados' : 'Adicione ao seu roteiro'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm flex items-center gap-1">
                  <i className="fas fa-graduation-cap text-[#F9D949]" />
                  Matéria / Assunto
                </label>
                <input
                  type="text"
                  value={novoEstudo.materia}
                  onChange={(e) => setNovoEstudo({ ...novoEstudo, materia: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                  placeholder="Ex: Cálculo II, Física, Português..."
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm flex items-center gap-1">
                    <i className="fas fa-hourglass-half text-[#F9D949]" />
                    Tempo
                  </label>
                  <select
                    value={novoEstudo.tempo}
                    onChange={(e) => setNovoEstudo({ ...novoEstudo, tempo: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h30</option>
                    <option value={120}>2 horas</option>
                    <option value={180}>3 horas</option>
                    <option value={240}>4 horas</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm flex items-center gap-1">
                    <i className="fas fa-clock text-[#F9D949]" />
                    Horário
                  </label>
                  <input
                    type="time"
                    value={novoEstudo.horario}
                    onChange={(e) => setNovoEstudo({ ...novoEstudo, horario: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setModalAberto(false);
                  setEstudoEditando(null);
                }}
                className="px-5 py-2 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <i className="fas fa-times" />
                Cancelar
              </button>
              <button
                onClick={estudoEditando ? editarEstudo : adicionarEstudo}
                className="px-5 py-2 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <i className={`fas ${estudoEditando ? 'fa-save' : 'fa-plus'}`} />
                {estudoEditando ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
        .ml-13 {
          margin-left: 3.25rem;
        }
      `}</style>
    </div>
  );
};

export default RoteiroEstudos;