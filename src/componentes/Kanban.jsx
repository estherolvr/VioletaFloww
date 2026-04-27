import React, { useState } from 'react';
import { tarefasAPI } from '../services/api';

const Kanban = ({ tarefas, setTarefas }) => {
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    horario: '',
    descricao: ''
  });
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [animacao, setAnimacao] = useState(false);
  const [descricaoExpandida, setDescricaoExpandida] = useState({});
  const [carregando, setCarregando] = useState(false);

  const colunas = [
    { 
      id: 'fazer', 
      titulo: 'A Fazer', 
      itens: tarefas.fazer,
      cor: 'yellow',
      icon: 'fa-clipboard-list',
      gradient: 'from-yellow-400 to-yellow-500',
      bgLight: 'bg-yellow-50',
      borderLight: 'border-yellow-200',
      textDark: 'text-yellow-700'
    },
    { 
      id: 'andamento', 
      titulo: 'Em Andamento', 
      itens: tarefas.andamento,
      cor: 'blue',
      icon: 'fa-spinner',
      gradient: 'from-blue-400 to-blue-500',
      bgLight: 'bg-blue-50',
      borderLight: 'border-blue-200',
      textDark: 'text-blue-700'
    },
    { 
      id: 'concluido', 
      titulo: 'Concluído', 
      itens: tarefas.concluido,
      cor: 'green',
      icon: 'fa-check-circle',
      gradient: 'from-green-400 to-green-500',
      bgLight: 'bg-green-50',
      borderLight: 'border-green-200',
      textDark: 'text-green-700'
    }
  ];

  const toggleDescricao = (tarefaId) => {
    setDescricaoExpandida(prev => ({
      ...prev,
      [tarefaId]: !prev[tarefaId]
    }));
  };

  const moverTarefa = async (coluna, indice, direcao) => {
    let arrayOrigem;
    if (coluna === 'fazer') arrayOrigem = [...tarefas.fazer];
    else if (coluna === 'andamento') arrayOrigem = [...tarefas.andamento];
    else arrayOrigem = [...tarefas.concluido];

    if (indice < 0 || indice >= arrayOrigem.length) return;
    
    const tarefa = arrayOrigem[indice];
    const texto = tarefa;
    arrayOrigem.splice(indice, 1);

    let colunaDestino = null;
    if (direcao === 'esquerda') {
      if (coluna === 'andamento') colunaDestino = 'fazer';
      else if (coluna === 'concluido') colunaDestino = 'andamento';
    } else {
      if (coluna === 'fazer') colunaDestino = 'andamento';
      else if (coluna === 'andamento') colunaDestino = 'concluido';
    }

    const novasTarefas = { ...tarefas };
    
    if (colunaDestino) {
      if (colunaDestino === 'fazer') novasTarefas.fazer.push(texto);
      else if (colunaDestino === 'andamento') novasTarefas.andamento.push(texto);
      else novasTarefas.concluido.push(texto);
    } else {
      if (coluna === 'fazer') novasTarefas.fazer.splice(indice, 0, texto);
      else if (coluna === 'andamento') novasTarefas.andamento.splice(indice, 0, texto);
      else novasTarefas.concluido.splice(indice, 0, texto);
    }

    if (coluna === 'fazer') novasTarefas.fazer = arrayOrigem;
    else if (coluna === 'andamento') novasTarefas.andamento = arrayOrigem;
    else novasTarefas.concluido = arrayOrigem;

    setTarefas(novasTarefas);
    setAnimacao(true);
    setTimeout(() => setAnimacao(false), 300);

    if (tarefa.id && colunaDestino) {
      try {
        await tarefasAPI.mover(tarefa.id, colunaDestino);
      } catch (error) {
        console.error('Erro ao mover tarefa:', error);
      }
    }
  };

  const deletarTarefa = async (coluna, indice) => {
    let tarefa;
    if (coluna === 'fazer') tarefa = tarefas.fazer[indice];
    else if (coluna === 'andamento') tarefa = tarefas.andamento[indice];
    else tarefa = tarefas.concluido[indice];

    const novasTarefas = { ...tarefas };
    if (coluna === 'fazer') novasTarefas.fazer.splice(indice, 1);
    else if (coluna === 'andamento') novasTarefas.andamento.splice(indice, 1);
    else novasTarefas.concluido.splice(indice, 1);
    setTarefas(novasTarefas);

    if (tarefa.id) {
      try {
        await tarefasAPI.delete(tarefa.id);
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
      }
    }
  };

  const editarTarefa = (coluna, indice, tarefaObj) => {
    setTarefaEditando({ coluna, indice, ...tarefaObj });
    setNovaTarefa({
      titulo: tarefaObj.titulo,
      horario: tarefaObj.horario || '',
      descricao: tarefaObj.descricao || ''
    });
    setModalAberto(true);
  };

  const adicionarTarefa = async () => {
    if (!novaTarefa.titulo.trim()) return;

    setCarregando(true);

    try {
      if (tarefaEditando) {
        const response = await tarefasAPI.update(tarefaEditando.id, {
          titulo: novaTarefa.titulo.trim(),
          horario: novaTarefa.horario || '',
          descricao: novaTarefa.descricao || ''
        });

        if (response.success) {
          const novasTarefas = { ...tarefas };
          const coluna = tarefaEditando.coluna;
          const tarefaAtualizada = {
            ...tarefaEditando,
            titulo: novaTarefa.titulo.trim(),
            horario: novaTarefa.horario || '',
            descricao: novaTarefa.descricao || ''
          };
          
          if (coluna === 'fazer') novasTarefas.fazer[tarefaEditando.indice] = tarefaAtualizada;
          else if (coluna === 'andamento') novasTarefas.andamento[tarefaEditando.indice] = tarefaAtualizada;
          else novasTarefas.concluido[tarefaEditando.indice] = tarefaAtualizada;
          
          setTarefas(novasTarefas);
          setTarefaEditando(null);
        }
      } else {
        const response = await tarefasAPI.create({
          titulo: novaTarefa.titulo.trim(),
          horario: novaTarefa.horario || '',
          descricao: novaTarefa.descricao || ''
        });

        if (response.success) {
          const novaTarefaObj = {
            id: response.tarefa.id,
            titulo: response.tarefa.titulo,
            horario: response.tarefa.horario,
            descricao: response.tarefa.descricao
          };
          setTarefas({ ...tarefas, fazer: [...tarefas.fazer, novaTarefaObj] });
        }
      }
      
      setModalAberto(false);
      setNovaTarefa({ titulo: '', horario: '', descricao: '' });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const contarTarefas = () => {
    const total = tarefas.fazer.length + tarefas.andamento.length + tarefas.concluido.length;
    const concluidas = tarefas.concluido.length;
    return { total, concluidas };
  };

  const { total, concluidas } = contarTarefas();
  const progresso = total === 0 ? 0 : Math.round((concluidas / total) * 100);

  const truncarTexto = (texto, limite = 80) => {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  };

  const renderizarTarefa = (tarefa, idx, coluna) => {
    const tarefaObj = typeof tarefa === 'string' 
      ? { id: null, titulo: tarefa, horario: '', descricao: '' }
      : tarefa;
    
    const tarefaId = tarefaObj.id || `${coluna.id}-${idx}`;
    const descricaoExp = descricaoExpandida[tarefaId];
    const temDescricaoLonga = tarefaObj.descricao && tarefaObj.descricao.length > 80;
    const descricaoParaMostrar = descricaoExp ? tarefaObj.descricao : truncarTexto(tarefaObj.descricao, 80);

    const coresCard = {
      yellow: 'border-l-4 border-yellow-400 hover:shadow-yellow-100/50',
      blue: 'border-l-4 border-blue-400 hover:shadow-blue-100/50',
      green: 'border-l-4 border-green-400 hover:shadow-green-100/50'
    };

    return (
      <div
        key={idx}
        className={`group bg-white p-4 rounded-xl shadow-sm ${coresCard[coluna.cor]} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${animacao ? 'animate-pulse' : ''}`}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full bg-${coluna.cor}-400`} />
              <p className="text-gray-800 text-sm font-semibold break-words">
                {tarefaObj.titulo}
              </p>
            </div>
            
            {tarefaObj.horario && tarefaObj.horario !== '' && (
              <div className="flex items-center gap-1 mt-1 text-xs text-purple-600">
                <i className="far fa-clock" />
                <span>{tarefaObj.horario}</span>
              </div>
            )}
            
            {tarefaObj.descricao && tarefaObj.descricao !== '' && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 break-words leading-relaxed">
                  {descricaoParaMostrar}
                </p>
                {temDescricaoLonga && (
                  <button
                    onClick={() => toggleDescricao(tarefaId)}
                    className="text-xs text-[#5E2A8C] hover:text-[#F9D949] mt-1 font-medium transition-colors flex items-center gap-1"
                  >
                    <i className={`fas ${descricaoExp ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                    {descricaoExp ? 'Ler menos' : 'Ler mais'}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
            <button
              onClick={() => moverTarefa(coluna.id, idx, 'esquerda')}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-yellow-100 text-gray-500 hover:text-yellow-600 transition-all flex items-center justify-center"
              title="Mover para esquerda"
            >
              <i className="fas fa-arrow-left text-xs" />
            </button>
            <button
              onClick={() => moverTarefa(coluna.id, idx, 'direita')}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-yellow-100 text-gray-500 hover:text-yellow-600 transition-all flex items-center justify-center"
              title="Mover para direita"
            >
              <i className="fas fa-arrow-right text-xs" />
            </button>
            <button
              onClick={() => editarTarefa(coluna.id, idx, tarefaObj)}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center"
              title="Editar tarefa"
            >
              <i className="fas fa-pen text-xs" />
            </button>
            <button
              onClick={() => deletarTarefa(coluna.id, idx)}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all flex items-center justify-center"
              title="Excluir tarefa"
            >
              <i className="fas fa-trash-alt text-xs" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20">
        {/* Header do Kanban */}
        <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-chalkboard text-[#F9D949]" />
                Quadro Kanban
              </h2>
              <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
                <i className="fas fa-chart-line text-xs" />
                Organize suas tarefas com horários e descrições
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-full px-4 py-2">
              <span className="text-white font-bold">{progresso}%</span>
              <span className="text-white/70 text-sm ml-1">concluído</span>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#F9D949] to-[#FFE66D] rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
        
        {/* Colunas Kanban */}
        <div className="overflow-x-auto p-5 bg-gradient-to-br from-[#faf5ff] to-[#f3eaff]">
          <div className="flex gap-5 min-w-[800px]">
            {colunas.map(col => (
              <div 
                key={col.id} 
                className="flex-1 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Cabeçalho da coluna */}
                <div className={`p-4 ${col.bgLight} border-b-2 border-${col.cor}-200`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${col.gradient} flex items-center justify-center shadow-sm`}>
                        <i className={`fas ${col.icon} text-white text-sm`} />
                      </div>
                      <h3 className={`font-bold ${col.textDark}`}>
                        {col.titulo}
                      </h3>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${col.bgLight} ${col.textDark} border ${col.borderLight}`}>
                      {col.itens.length}
                    </div>
                  </div>
                </div>
                
                {/* Lista de tarefas */}
                <div className="p-3 space-y-2 min-h-[350px] max-h-[450px] overflow-y-auto">
                  {col.itens.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`w-16 h-16 mx-auto rounded-full ${col.bgLight} flex items-center justify-center mb-3`}>
                        <i className={`fas ${col.icon} text-2xl text-${col.cor}-300`} />
                      </div>
                      <p className="text-gray-400 text-sm">Nenhuma tarefa</p>
                      <p className="text-gray-300 text-xs mt-1">Clique em Nova Tarefa</p>
                    </div>
                  ) : (
                    col.itens.map((tarefa, idx) => renderizarTarefa(tarefa, idx, col))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Botão adicionar */}
        <div className="p-5 border-t border-[#F9E6B3] bg-white">
          <button
            onClick={() => {
              setTarefaEditando(null);
              setNovaTarefa({ titulo: '', horario: '', descricao: '' });
              setModalAberto(true);
            }}
            disabled={carregando}
            className="w-full py-3 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 group"
          >
            <i className="fas fa-plus-circle text-xl group-hover:rotate-90 transition-transform duration-300" />
            Nova Tarefa
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center flex items-center justify-center gap-2">
            <i className="fas fa-mouse-pointer" />
            Passe o mouse sobre as tarefas para ver as opções
            <i className="fas fa-arrows-alt-h text-gray-300" />
          </p>
        </div>
      </div>

      {/* Modal de Nova/Editar Tarefa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-modal-in">
            <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F9D949] rounded-xl flex items-center justify-center">
                  <i className={`fas ${tarefaEditando ? 'fa-pen' : 'fa-plus'} text-[#5E2A8C] text-lg`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {tarefaEditando ? 'Altere os dados da sua tarefa' : 'Adicione uma nova tarefa ao seu quadro'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-tag text-[#F9D949] mr-1" />
                  Título da tarefa
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={novaTarefa.titulo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                  placeholder="Ex: Estudar para a prova"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="far fa-clock text-[#F9D949] mr-1" />
                  Horário
                </label>
                <input
                  type="time"
                  value={novaTarefa.horario}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, horario: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Opcional</p>
              </div>
              
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-align-left text-[#F9D949] mr-1" />
                  Descrição
                </label>
                <textarea
                  value={novaTarefa.descricao}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all resize-none"
                  placeholder="Descreva os detalhes da tarefa..."
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">
                    <i className="fas fa-keyboard mr-1" />
                    {novaTarefa.descricao.length} caracteres
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setModalAberto(false)}
                className="px-5 py-2 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <i className="fas fa-times" />
                Cancelar
              </button>
              <button
                onClick={adicionarTarefa}
                disabled={carregando}
                className="px-5 py-2 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
              >
                {carregando ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className={`fas ${tarefaEditando ? 'fa-save' : 'fa-plus'}`} />
                    {tarefaEditando ? 'Salvar Alterações' : 'Adicionar Tarefa'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse {
          animation: pulse 0.3s ease-in-out;
        }
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
      `}</style>
    </>
  );
};

export default Kanban;