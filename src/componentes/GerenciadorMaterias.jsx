import React, { useState, useEffect } from 'react';
import { materiasAPI } from '../services/materias';
import Toast from './Toast';

const GerenciadorMaterias = () => {
  const [materias, setMaterias] = useState([]);
  const [modalMateriaAberto, setModalMateriaAberto] = useState(false);
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState(null);
  const [materiaSelecionada, setMateriaSelecionada] = useState(null);
  const [avaliacaoEditando, setAvaliacaoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [tipoExclusao, setTipoExclusao] = useState(null);
  
  const [novaMateria, setNovaMateria] = useState({
    nome: '',
    mediaAprovacao: 6
  });
  
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    nome: '',
    nota: '',
    peso: 0
  });

  const mostrarMensagem = (mensagem, tipo = 'success') => {
    setToast({ message: mensagem, type: tipo });
  };

  const carregarMaterias = async () => {
    setCarregando(true);
    const response = await materiasAPI.getAll();
    if (response.success) {
      const materiasComMedia = response.materias.map(materia => ({
        ...materia,
        mediaAprovacao: materia.media_aprovacao || materia.mediaAprovacao || 6.0
      }));
      setMaterias(materiasComMedia);
    } else {
      mostrarMensagem(response.error || 'Erro ao carregar matérias', 'error');
    }
    setCarregando(false);
  };

  useEffect(() => {
    carregarMaterias();
  }, []);

  const adicionarMateria = async () => {
    if (!novaMateria.nome.trim()) {
      mostrarMensagem('Digite o nome da matéria!', 'warning');
      return;
    }
    
    setCarregando(true);
    const response = await materiasAPI.create({
      nome: novaMateria.nome,
      mediaAprovacao: novaMateria.mediaAprovacao
    });
    
    if (response.success) {
      await carregarMaterias();
      mostrarMensagem(`Matéria "${novaMateria.nome}" criada com sucesso!`, 'success');
      setModalMateriaAberto(false);
      setNovaMateria({ nome: '', mediaAprovacao: 6 });
    } else {
      mostrarMensagem(response.error || 'Erro ao criar matéria', 'error');
    }
    setCarregando(false);
  };

  const editarMateria = async () => {
    if (!materiaEditando) return;
    
    setCarregando(true);
    const response = await materiasAPI.update(materiaEditando.id, {
      nome: novaMateria.nome,
      mediaAprovacao: novaMateria.mediaAprovacao
    });
    
    if (response.success) {
      await carregarMaterias();
      mostrarMensagem(`Matéria "${novaMateria.nome}" atualizada!`, 'success');
      setModalMateriaAberto(false);
      setMateriaEditando(null);
      setNovaMateria({ nome: '', mediaAprovacao: 6 });
    } else {
      mostrarMensagem(response.error || 'Erro ao atualizar matéria', 'error');
    }
    setCarregando(false);
  };

  const confirmarExclusaoMateria = (id, nome) => {
    setItemParaExcluir({ id, nome });
    setTipoExclusao('materia');
    setModalConfirmacaoAberto(true);
  };

  const executarExclusao = async () => {
    if (tipoExclusao === 'materia' && itemParaExcluir) {
      setCarregando(true);
      const response = await materiasAPI.delete(itemParaExcluir.id);
      if (response.success) {
        await carregarMaterias();
        mostrarMensagem('Matéria removida com sucesso!', 'success');
        if (materiaSelecionada?.id === itemParaExcluir.id) setMateriaSelecionada(null);
      } else {
        mostrarMensagem(response.error || 'Erro ao remover matéria', 'error');
      }
      setCarregando(false);
    } else if (tipoExclusao === 'avaliacao' && itemParaExcluir && materiaSelecionada) {
      setCarregando(true);
      const response = await materiasAPI.deleteAvaliacao(materiaSelecionada.id, itemParaExcluir.id);
      if (response.success) {
        await carregarMaterias();
        mostrarMensagem('Avaliação removida!', 'success');
      } else {
        mostrarMensagem(response.error || 'Erro ao remover avaliação', 'error');
      }
      setCarregando(false);
    }
    
    setModalConfirmacaoAberto(false);
    setItemParaExcluir(null);
    setTipoExclusao(null);
  };

  const adicionarAvaliacao = async () => {
    if (!novaAvaliacao.nome.trim()) {
      mostrarMensagem('Digite o nome da avaliação!', 'warning');
      return;
    }
    
    const pesoNum = parseFloat(novaAvaliacao.peso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      mostrarMensagem('Por favor, digite um peso válido (número positivo)!', 'warning');
      return;
    }
    
    if (pesoNum > 100) {
      mostrarMensagem('O peso não pode ser maior que 100%!', 'warning');
      return;
    }
    
    let notaValida = null;
    if (novaAvaliacao.nota && novaAvaliacao.nota.trim() !== '') {
      notaValida = parseFloat(novaAvaliacao.nota);
      if (isNaN(notaValida) || notaValida < 0 || notaValida > 10) {
        mostrarMensagem('Nota inválida! Deve ser entre 0 e 10.', 'warning');
        return;
      }
    }
    
    const somaAtual = materiaSelecionada.avaliacoes.reduce((sum, a) => sum + parseFloat(a.peso), 0);
    const novaSoma = somaAtual + pesoNum;
    
    if (novaSoma > 100) {
      const maxPermitido = 100 - somaAtual;
      mostrarMensagem(`⚠️ A soma dos pesos seria ${novaSoma}%! Máximo permitido é 100%. Disponível: ${maxPermitido}%`, 'warning');
      return;
    }
    
    setCarregando(true);
    const response = await materiasAPI.addAvaliacao(materiaSelecionada.id, {
      nome: novaAvaliacao.nome,
      nota: notaValida,
      peso: pesoNum
    });
    
    if (response.success) {
      await carregarMaterias();
      mostrarMensagem(`✅ Avaliação "${novaAvaliacao.nome}" adicionada!`, 'success');
      setModalAvaliacaoAberto(false);
      setNovaAvaliacao({ nome: '', nota: '', peso: 0 });
    } else {
      mostrarMensagem(response.error || 'Erro ao adicionar avaliação', 'error');
    }
    setCarregando(false);
  };

  const editarAvaliacao = async () => {
    if (!avaliacaoEditando) return;
    
    const pesoNum = parseFloat(novaAvaliacao.peso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      mostrarMensagem('Por favor, digite um peso válido (número positivo)!', 'warning');
      return;
    }
    
    if (pesoNum > 100) {
      mostrarMensagem('O peso não pode ser maior que 100%!', 'warning');
      return;
    }
    
    let notaValida = null;
    if (novaAvaliacao.nota && novaAvaliacao.nota.trim() !== '') {
      notaValida = parseFloat(novaAvaliacao.nota);
      if (isNaN(notaValida) || notaValida < 0 || notaValida > 10) {
        mostrarMensagem('Nota inválida! Deve ser entre 0 e 10.', 'warning');
        return;
      }
    }
    
    const outrasAvaliacoes = materiaSelecionada.avaliacoes.filter(a => a.id !== avaliacaoEditando.id);
    const somaOutras = outrasAvaliacoes.reduce((sum, a) => sum + parseFloat(a.peso), 0);
    const novaSoma = somaOutras + pesoNum;
    
    if (novaSoma > 100) {
      const maxPermitido = 100 - somaOutras;
      mostrarMensagem(`⚠️ A soma dos pesos seria ${novaSoma}%! Máximo permitido é 100%. Disponível: ${maxPermitido}%`, 'warning');
      return;
    }
    
    setCarregando(true);
    const response = await materiasAPI.updateAvaliacao(materiaSelecionada.id, avaliacaoEditando.id, {
      nome: novaAvaliacao.nome,
      nota: notaValida,
      peso: pesoNum
    });
    
    if (response.success) {
      await carregarMaterias();
      mostrarMensagem(`✅ Avaliação "${novaAvaliacao.nome}" atualizada!`, 'success');
      setModalAvaliacaoAberto(false);
      setAvaliacaoEditando(null);
      setNovaAvaliacao({ nome: '', nota: '', peso: 0 });
    } else {
      mostrarMensagem(response.error || 'Erro ao atualizar avaliação', 'error');
    }
    setCarregando(false);
  };

  const confirmarExclusaoAvaliacao = (id, nome) => {
    setItemParaExcluir({ id, nome });
    setTipoExclusao('avaliacao');
    setModalConfirmacaoAberto(true);
  };

  // ========== FUNÇÃO PRINCIPAL DE PREVISÃO ==========
  const calcularPrevisao = (avaliacoes, mediaAprovacao) => {
    // Ordenar avaliações por nome (N1, N2, N3)
    const ordenadas = [...avaliacoes].sort((a, b) => {
      const numA = parseInt(a.nome.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.nome.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
    
    // Separar as que têm nota e as que não têm
    const comNota = ordenadas.filter(a => a.nota !== null && a.nota !== '' && !isNaN(parseFloat(a.nota)));
    const semNota = ordenadas.filter(a => a.nota === null || a.nota === '' || isNaN(parseFloat(a.nota)));
    
    // Verificar se todas as avaliações já foram cadastradas
    if (ordenadas.length < 3) {
      return {
        tipo: 'config',
        mensagem: `⚠️ Cadastre as 3 avaliações (N1, N2, N3) com seus pesos. Faltam ${3 - ordenadas.length}`,
        cor: 'text-yellow-600',
        bg: 'bg-yellow-50'
      };
    }
    
    // Verificar se os pesos somam 100%
    const somaPesos = ordenadas.reduce((sum, a) => sum + parseFloat(a.peso), 0);
    if (somaPesos !== 100) {
      return {
        tipo: 'config',
        mensagem: `⚠️ A soma dos pesos é ${somaPesos}%. Deve ser 100%. Ajuste os pesos das avaliações.`,
        cor: 'text-yellow-600',
        bg: 'bg-yellow-50'
      };
    }
    
    // Se não tem nenhuma nota lançada
    if (comNota.length === 0) {
      return {
        tipo: 'info',
        mensagem: `📝 Comece lançando a nota da N1 para ver a previsão do que precisa nas próximas provas.`,
        cor: 'text-blue-600',
        bg: 'bg-blue-50'
      };
    }
    
    // Calcular soma ponderada atual
    let somaPonderada = 0;
    let somaPesosAtual = 0;
    
    comNota.forEach(a => {
      somaPonderada += parseFloat(a.nota) * parseFloat(a.peso);
      somaPesosAtual += parseFloat(a.peso);
    });
    
    // Verificar se já tem todas as notas
    if (comNota.length === 3) {
      const mediaFinal = somaPonderada / 100;
      if (mediaFinal >= mediaAprovacao) {
        return {
          tipo: 'aprovado',
          mensagem: `🎉 APROVADO! Sua média final é ${mediaFinal.toFixed(1)}. Parabéns!`,
          cor: 'text-green-600',
          bg: 'bg-green-50',
          mediaFinal: mediaFinal
        };
      } else {
        return {
          tipo: 'reprovado',
          mensagem: `❌ REPROVADO! Sua média final é ${mediaFinal.toFixed(1)}. A média necessária era ${mediaAprovacao}.`,
          cor: 'text-red-600',
          bg: 'bg-red-50',
          mediaFinal: mediaFinal
        };
      }
    }
    
    // PREVISÃO PARA A PRÓXIMA PROVA
    const proximaProva = semNota[0];
    const pesoProxima = parseFloat(proximaProva.peso);
    const somaPesosTotal = somaPesosAtual + pesoProxima;
    
    // Calcular nota necessária na próxima prova
    // Fórmula: (somaPonderada + nota * pesoProxima) / (somaPesosAtual + pesoProxima) = mediaAprovacao
    // => nota = (mediaAprovacao * somaPesosTotal - somaPonderada) / pesoProxima
    const notaNecessaria = (mediaAprovacao * somaPesosTotal - somaPonderada) / pesoProxima;
    const notaArredondada = Math.min(10, Math.max(0, Math.round(notaNecessaria * 10) / 10));
    
    // Calcular o que precisa nas provas restantes (média)
    const pesoRestante = semNota.reduce((sum, a) => sum + parseFloat(a.peso), 0);
    const notaNecessariaGeral = (mediaAprovacao * 100 - somaPonderada) / pesoRestante;
    const notaGeralArredondada = Math.min(10, Math.max(0, Math.round(notaNecessariaGeral * 10) / 10));
    
    // Verificar se já é possível saber se vai passar
    if (notaNecessaria > 10) {
      return {
        tipo: 'critico',
        mensagem: `❌ Infelizmente não é mais possível atingir a média ${mediaAprovacao}. Mesmo tirando 10 na ${proximaProva.nome}, você não alcança a média.`,
        cor: 'text-red-600',
        bg: 'bg-red-50',
        notaNecessaria: notaArredondada,
        proximaProva: proximaProva.nome
      };
    }
    
    if (notaNecessaria <= 0) {
      return {
        tipo: 'success',
        mensagem: `🎉 Ótimo! Mesmo tirando 0 na ${proximaProva.nome}, sua média já ultrapassa ${mediaAprovacao}. Você já garantiu!`,
        cor: 'text-green-600',
        bg: 'bg-green-50'
      };
    }
    
    // PREVISÃO PARA CADA PROVA RESTANTE
    if (semNota.length === 1) {
      // Só falta uma prova
      return {
        tipo: 'previsao_unica',
        mensagem: `📊 Sua média atual é ${(somaPonderada / somaPesosAtual).toFixed(1)}. Para atingir a média ${mediaAprovacao}, você precisa tirar ${notaArredondada.toFixed(1)} na ${proximaProva.nome}!`,
        cor: 'text-purple-600',
        bg: 'bg-purple-50',
        notaNecessaria: notaArredondada,
        proximaProva: proximaProva.nome,
        pesoProxima: pesoProxima
      };
    } else {
      // Faltam 2 ou mais provas - mostrar previsão para cada uma
      const previsoes = [];
      let somaPonderadaTemp = somaPonderada;
      let somaPesosTemp = somaPesosAtual;
      
      for (let i = 0; i < semNota.length; i++) {
        const prova = semNota[i];
        const pesoProva = parseFloat(prova.peso);
        
        if (i === semNota.length - 1) {
          // Última prova
          const notaFinal = (mediaAprovacao * 100 - somaPonderadaTemp) / pesoProva;
          previsoes.push({
            nome: prova.nome,
            peso: pesoProva,
            nota: Math.min(10, Math.max(0, Math.round(notaFinal * 10) / 10))
          });
        } else {
          // Para as primeiras provas, usa a média necessária
          previsoes.push({
            nome: prova.nome,
            peso: pesoProva,
            nota: notaGeralArredondada
          });
          somaPonderadaTemp += notaGeralArredondada * pesoProva;
          somaPesosTemp += pesoProva;
        }
      }
      
      // Montar mensagem com todas as previsões
      const textoPrevisoes = previsoes.map(p => `${p.nome}: ${p.nota.toFixed(1)}`).join(', ');
      
      return {
        tipo: 'previsao_multipla',
        mensagem: `📊 Sua média atual é ${(somaPonderada / somaPesosAtual).toFixed(1)}. Faltam ${semNota.length} provas (${pesoRestante}%). Para atingir a média ${mediaAprovacao}, você precisa tirar: ${textoPrevisoes}`,
        cor: 'text-purple-600',
        bg: 'bg-purple-50',
        previsoes: previsoes,
        notaGeral: notaGeralArredondada
      };
    }
  };

  const getStatus = (avaliacoes) => {
    if (avaliacoes.length < 3) {
      return { texto: 'Configurar', cor: 'text-gray-400', bg: 'bg-gray-100' };
    }
    
    const somaPesos = avaliacoes.reduce((sum, a) => sum + parseFloat(a.peso), 0);
    if (somaPesos !== 100) {
      return { texto: 'Ajustar pesos', cor: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    
    const comNota = avaliacoes.filter(a => a.nota !== null && a.nota !== '' && !isNaN(parseFloat(a.nota)));
    if (comNota.length === 0) {
      return { texto: 'Aguardando notas', cor: 'text-blue-600', bg: 'bg-blue-100' };
    }
    
    if (comNota.length < 3) {
      return { texto: 'Em andamento', cor: 'text-purple-600', bg: 'bg-purple-100' };
    }
    
    return { texto: 'Finalizado', cor: 'text-green-600', bg: 'bg-green-100' };
  };

  if (carregando && materias.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5E2A8C] border-t-[#F9D949] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {modalConfirmacaoAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirmar Exclusão</h3>
                  <p className="text-white/70 text-sm">Esta ação não pode ser desfeita</p>
                </div>
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trash-alt text-red-500 text-2xl" />
              </div>
              <p className="text-gray-700 font-semibold mb-2">
                {tipoExclusao === 'materia' ? 'Remover Matéria?' : 'Remover Avaliação?'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                {tipoExclusao === 'materia' ? (
                  <>Tem certeza que deseja remover <strong className="text-red-600">"{itemParaExcluir?.nome}"</strong>?</>
                ) : (
                  <>Tem certeza que deseja remover <strong className="text-red-600">"{itemParaExcluir?.nome}"</strong>?</>
                )}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalConfirmacaoAberto(false)} className="flex-1 px-4 py-3 border-2 rounded-xl text-gray-500 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={executarExclusao} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20">
        <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-graduation-cap text-[#F9D949]" />
                Gerenciador de Matérias
              </h2>
              <p className="text-white/70 text-sm mt-1">
                <i className="fas fa-calculator mr-1" /> Cadastre as 3 avaliações com pesos, depois lance as notas
              </p>
            </div>
            <button
              onClick={() => {
                setMateriaEditando(null);
                setNovaMateria({ nome: '', mediaAprovacao: 6 });
                setModalMateriaAberto(true);
              }}
              disabled={carregando}
              className="bg-[#F9D949] text-[#5E2A8C] px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <i className="fas fa-plus-circle" /> Nova Matéria
            </button>
          </div>
        </div>

        <div className="p-5">
          {materias.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-book-open text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-400">Nenhuma matéria cadastrada</p>
              <p className="text-gray-300 text-sm mt-1">Clique em "Nova Matéria" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {materias.map((materia) => {
                const avaliacoes = materia.avaliacoes || [];
                const previsao = calcularPrevisao(avaliacoes, materia.mediaAprovacao);
                const status = getStatus(avaliacoes);
                const isSelected = materiaSelecionada?.id === materia.id;
                const somaPesos = avaliacoes.reduce((sum, a) => sum + parseFloat(a.peso), 0);
                const comNota = avaliacoes.filter(a => a.nota !== null && a.nota !== '' && !isNaN(parseFloat(a.nota)));
                
                // Calcular média atual para exibição
                let mediaAtual = 0;
                let somaPonderada = 0;
                let somaPesosNota = 0;
                comNota.forEach(a => {
                  somaPonderada += parseFloat(a.nota) * parseFloat(a.peso);
                  somaPesosNota += parseFloat(a.peso);
                });
                if (somaPesosNota > 0) {
                  mediaAtual = somaPonderada / somaPesosNota;
                }
                
                return (
                  <div key={materia.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${isSelected ? 'border-[#F9D949] shadow-md' : 'border-gray-200'}`}>
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setMateriaSelecionada(isSelected ? null : materia)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <i className="fas fa-book text-[#5E2A8C]" />
                            <h3 className="text-lg font-bold text-gray-800">{materia.nome}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.cor}`}>
                              {status.texto}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-chart-simple text-sm text-gray-400" />
                              <span className="text-xl font-bold">{mediaAtual.toFixed(1)}</span>
                              <span className="text-gray-400 text-sm">/ {materia.mediaAprovacao}</span>
                            </div>
                            {avaliacoes.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <i className="fas fa-percent" />
                                <span>{somaPesos}% dos pesos</span>
                              </div>
                            )}
                          </div>
                          
                          {/* PREVISÃO PRINCIPAL */}
                          {previsao && (
                            <div className={`mt-2 flex items-start gap-2 ${previsao.bg} px-3 py-2 rounded-lg`}>
                              {previsao.tipo === 'previsao_unica' && <i className="fas fa-lightbulb text-purple-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'previsao_multipla' && <i className="fas fa-chart-line text-purple-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'critico' && <i className="fas fa-exclamation-triangle text-red-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'success' && <i className="fas fa-check-circle text-green-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'aprovado' && <i className="fas fa-trophy text-green-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'reprovado' && <i className="fas fa-frown text-red-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'config' && <i className="fas fa-cog text-yellow-500 text-sm mt-0.5" />}
                              {previsao.tipo === 'info' && <i className="fas fa-info-circle text-blue-500 text-sm mt-0.5" />}
                              <span className={`text-sm font-medium ${previsao.cor}`}>
                                {previsao.mensagem}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMateriaEditando(materia);
                              setNovaMateria({ nome: materia.nome, mediaAprovacao: materia.mediaAprovacao });
                              setModalMateriaAberto(true);
                            }}
                            disabled={carregando}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-500 transition"
                          >
                            <i className="fas fa-pen text-xs" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarExclusaoMateria(materia.id, materia.nome);
                            }}
                            disabled={carregando}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition"
                          >
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </div>
                      </div>
                      
                      {avaliacoes.length > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progresso</span>
                            <span>{comNota.length} de {avaliacoes.length} notas lançadas</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all bg-[#5E2A8C]"
                              style={{ width: `${(comNota.length / avaliacoes.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center mt-2">
                        <i className={`fas fa-chevron-${isSelected ? 'up' : 'down'} text-gray-400 text-xs`} />
                      </div>
                    </div>

                    {isSelected && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <i className="fas fa-list-check" /> Avaliações (N1, N2, N3)
                          </h4>
                          <button
                            onClick={() => {
                              setAvaliacaoEditando(null);
                              setNovaAvaliacao({ nome: `N${avaliacoes.length + 1}`, nota: '', peso: 0 });
                              setModalAvaliacaoAberto(true);
                            }}
                            disabled={carregando || avaliacoes.length >= 3}
                            className="text-xs text-[#5E2A8C] hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fas fa-plus-circle" /> Adicionar Avaliação
                          </button>
                        </div>

                        {avaliacoes.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-4">
                            <i className="fas fa-info-circle mr-1" />
                            Adicione as 3 avaliações (N1, N2, N3) com seus pesos. Ex: N1 peso 20%, N2 peso 30%, N3 peso 50%
                          </p>
                        ) : (
                          <>
                            <div className="space-y-2 mb-3">
                              {avaliacoes.sort((a, b) => {
                                const numA = parseInt(a.nome.match(/\d+/)?.[0] || 0);
                                const numB = parseInt(b.nome.match(/\d+/)?.[0] || 0);
                                return numA - numB;
                              }).map((avaliacao) => {
                                const temNota = avaliacao.nota !== null && avaliacao.nota !== '' && !isNaN(parseFloat(avaliacao.nota));
                                return (
                                  <div key={avaliacao.id} className="bg-white rounded-lg p-3 border border-gray-200 group">
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-gray-800">{avaliacao.nome}</span>
                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                            Peso: {avaliacao.peso}%
                                          </span>
                                        </div>
                                        <div className="mt-1">
                                          {temNota ? (
                                            <span className="text-lg font-bold text-green-600">{parseFloat(avaliacao.nota).toFixed(1)}</span>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setAvaliacaoEditando(avaliacao);
                                                setNovaAvaliacao({
                                                  nome: avaliacao.nome,
                                                  nota: '',
                                                  peso: avaliacao.peso
                                                });
                                                setModalAvaliacaoAberto(true);
                                              }}
                                              className="text-sm text-blue-500 hover:text-blue-700"
                                            >
                                              <i className="fas fa-plus-circle mr-1" /> Lançar Nota
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                          onClick={() => {
                                            setAvaliacaoEditando(avaliacao);
                                            setNovaAvaliacao({
                                              nome: avaliacao.nome,
                                              nota: avaliacao.nota !== null ? avaliacao.nota.toString() : '',
                                              peso: avaliacao.peso
                                            });
                                            setModalAvaliacaoAberto(true);
                                          }}
                                          disabled={carregando}
                                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-500 transition"
                                        >
                                          <i className="fas fa-pen text-xs" />
                                        </button>
                                        <button
                                          onClick={() => confirmarExclusaoAvaliacao(avaliacao.id, avaliacao.nome)}
                                          disabled={carregando}
                                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition"
                                        >
                                          <i className="fas fa-trash-alt text-xs" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* PREVISÃO DETALHADA COM NOTAS ESPECÍFICAS */}
                            {previsao && previsao.tipo === 'previsao_multipla' && previsao.previsoes && (
                              <div className="mb-3 p-3 rounded-lg border bg-purple-50 border-purple-200">
                                <p className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                                  <i className="fas fa-chart-line" /> Previsão de notas necessárias:
                                </p>
                                <div className="space-y-2">
                                  {previsao.previsoes.map((p, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-2 flex justify-between items-center">
                                      <span className="font-medium">{p.nome}</span>
                                      <div className="text-right">
                                        <span className="text-xl font-bold text-purple-600">{p.nota.toFixed(1)}</span>
                                        <span className="text-xs text-gray-500 ml-1">(peso {p.peso}%)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                  *Para atingir a média {materia.mediaAprovacao}
                                </p>
                              </div>
                            )}
                            
                            {previsao && previsao.tipo === 'previsao_unica' && (
                              <div className="mb-3 p-3 rounded-lg border bg-purple-50 border-purple-200">
                                <div className="text-center">
                                  <p className="text-sm text-purple-700 mb-1">🎯 Nota necessária:</p>
                                  <p className="text-3xl font-bold text-purple-600">{previsao.notaNecessaria.toFixed(1)}</p>
                                  <p className="text-sm text-gray-600 mt-1">na {previsao.proximaProva}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="text-center">
                            <p className="text-gray-500 text-sm">Média atual</p>
                            <p className="text-3xl font-bold text-[#5E2A8C]">{mediaAtual.toFixed(1)}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Média necessária: {materia.mediaAprovacao} | 
                              {comNota.length} de {avaliacoes.length} notas lançadas
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Matéria */}
      {modalMateriaAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F9D949] rounded-xl flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-[#5E2A8C] text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {materiaEditando ? 'Editar Matéria' : 'Nova Matéria'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {materiaEditando ? 'Altere os dados da matéria' : 'Adicione uma disciplina'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-book text-[#F9D949] mr-1" /> Nome da Matéria
                </label>
                <input
                  type="text"
                  value={novaMateria.nome}
                  onChange={(e) => setNovaMateria({ ...novaMateria, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none"
                  placeholder="Ex: Matemática, Português, História..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-flag-checkered text-[#F9D949] mr-1" /> Média de Aprovação
                </label>
                <select
                  value={novaMateria.mediaAprovacao}
                  onChange={(e) => setNovaMateria({ ...novaMateria, mediaAprovacao: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none"
                >
                  <option value={5}>5.0</option>
                  <option value={6}>6.0 (Padrão)</option>
                  <option value={7}>7.0</option>
                  <option value={8}>8.0</option>
                </select>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setModalMateriaAberto(false);
                  setMateriaEditando(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={materiaEditando ? editarMateria : adicionarMateria}
                disabled={carregando}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {carregando ? <i className="fas fa-spinner fa-spin" /> : <i className={`fas ${materiaEditando ? 'fa-save' : 'fa-plus'}`} />}
                {materiaEditando ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Avaliação */}
      {modalAvaliacaoAberto && materiaSelecionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F9D949] rounded-xl flex items-center justify-center">
                  <i className="fas fa-star text-[#5E2A8C] text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {avaliacaoEditando ? 'Editar Avaliação' : 'Nova Avaliação'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {materiaSelecionada?.nome}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-tag text-[#F9D949] mr-1" /> Nome
                </label>
                <input
                  type="text"
                  value={novaAvaliacao.nome}
                  onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none"
                  placeholder="Ex: N1, N2, N3"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                    <i className="fas fa-star text-[#F9D949] mr-1" /> Nota (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={novaAvaliacao.nota}
                    onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, nota: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none"
                    placeholder="Ex: 7.5"
                  />
                  <p className="text-xs text-gray-400 mt-1">Deixe em branco se ainda não fez</p>
                </div>
                
                <div>
                  <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                    <i className="fas fa-percent text-[#F9D949] mr-1" /> Peso (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={novaAvaliacao.peso}
                    onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, peso: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none"
                    placeholder="Ex: 30"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setModalAvaliacaoAberto(false);
                  setAvaliacaoEditando(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={avaliacaoEditando ? editarAvaliacao : adicionarAvaliacao}
                disabled={carregando}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {carregando ? <i className="fas fa-spinner fa-spin" /> : <i className={`fas ${avaliacaoEditando ? 'fa-save' : 'fa-plus'}`} />}
                {avaliacaoEditando ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciadorMaterias;