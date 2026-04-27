import React, { useState, useEffect } from 'react';

const Calendario = ({ 
  eventos, 
  dataSelecionada, 
  setDataSelecionada, 
  dataAtual, 
  setDataAtual, 
  adicionarEvento, 
  deletarEvento, 
  atualizarEvento 
}) => {
  const [novoEventoTitulo, setNovoEventoTitulo] = useState('');
  const [novoEventoData, setNovoEventoData] = useState('');
  const [novoEventoHorario, setNovoEventoHorario] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [feriados, setFeriados] = useState({});
  const [carregandoFeriados, setCarregandoFeriados] = useState(false);
  const [loading, setLoading] = useState(false);

  const buscarFeriados = async (ano) => {
    setCarregandoFeriados(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
      const data = await response.json();
      const feriadosObj = {};
      data.forEach(feriado => {
        feriadosObj[feriado.date] = {
          nome: feriado.name,
          tipo: feriado.type || 'national',
          icone: getIconePorFeriado(feriado.name)
        };
      });
      setFeriados(feriadosObj);
    } catch (error) {
      console.error('Erro ao buscar feriados:', error);
    } finally {
      setCarregandoFeriados(false);
    }
  };

  const getIconePorFeriado = (nome) => {
    const icones = {
      'Confraternização mundial': 'fas fa-glass-cheers',
      'Carnaval': 'fas fa-mask',
      'Sexta-feira Santa': 'fas fa-cross',
      'Páscoa': 'fas fa-egg',
      'Tiradentes': 'fas fa-gavel',
      'Dia do trabalho': 'fas fa-hard-hat',
      'Corpus Christi': 'fas fa-church',
      'Independência do Brasil': 'fas fa-flag-checkered',
      'Nossa Senhora Aparecida': 'fas fa-pray',
      'Finados': 'fas fa-candle',
      'Proclamação da República': 'fas fa-landmark',
      'Dia da consciência negra': 'fas fa-fist-raised',
      'Natal': 'fas fa-gift'
    };
    return icones[nome] || 'fas fa-calendar-day';
  };

  useEffect(() => {
    const ano = dataAtual.getFullYear();
    buscarFeriados(ano);
  }, [dataAtual]);

  const obterFeriado = (data) => feriados[data] || null;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const diasArray = [];
  for (let i = 0; i < primeiroDia; i++) diasArray.push(null);
  for (let d = 1; d <= diasNoMes; d++) diasArray.push(new Date(ano, mes, d));

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  const diasSemanaCompletos = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const temEvento = (dataStr) => {
    if (!eventos || eventos.length === 0) return false;
    return eventos.some(evento => {
      const dataEvento = String(evento.data).split('T')[0];
      return dataEvento === dataStr;
    });
  };
  
  const ehHoje = (dataStr) => dataStr === new Date().toISOString().slice(0, 10);

  const eventosDoDia = eventos.filter(evento => {
    const dataEvento = String(evento.data).split('T')[0];
    return dataEvento === dataSelecionada;
  });
  
  const feriado = obterFeriado(dataSelecionada);

  const handleAdicionarEvento = async () => {
    if (!novoEventoTitulo.trim() || !novoEventoData) {
      alert('Preencha o título e a data!');
      return;
    }
    
    setLoading(true);
    const sucesso = await adicionarEvento(novoEventoTitulo, novoEventoData, novoEventoHorario);
    setLoading(false);
    
    if (sucesso) {
      setNovoEventoTitulo('');
      setNovoEventoData('');
      setNovoEventoHorario('');
      setModalAberto(false);
      setDataSelecionada(novoEventoData);
    } else {
      alert('Erro ao adicionar compromisso. Tente novamente.');
    }
  };

  const handleEditarEvento = (evento) => {
    setEventoEditando(evento);
    setNovoEventoTitulo(evento.titulo);
    setNovoEventoData(evento.data);
    setNovoEventoHorario(evento.horario);
    setModalAberto(true);
  };

  const salvarEdicao = async () => {
    if (!eventoEditando) return;
    setLoading(true);
    await atualizarEvento(eventoEditando.id, novoEventoTitulo, novoEventoData, novoEventoHorario);
    setLoading(false);
    setEventoEditando(null);
    setModalAberto(false);
    setNovoEventoTitulo('');
    setNovoEventoData('');
    setNovoEventoHorario('');
    setDataSelecionada(novoEventoData);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F9D949]/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-calendar-alt text-[#F9D949]" />
                Agenda Mensal
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {carregandoFeriados ? (
                  <><i className="fas fa-spinner fa-spin mr-1" /> Carregando feriados...</>
                ) : (
                  <><i className="fas fa-star mr-1" /> Passe o mouse nos feriados para ver detalhes</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setDataAtual(new Date(ano, mes - 1))} 
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all flex items-center justify-center"
              >
                <i className="fas fa-chevron-left text-sm" />
              </button>
              <span className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-white font-semibold text-sm">
                {meses[mes]} {ano}
              </span>
              <button 
                onClick={() => setDataAtual(new Date(ano, mes + 1))} 
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all flex items-center justify-center"
              >
                <i className="fas fa-chevron-right text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="px-5 pt-4 pb-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Compromisso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">Feriado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F9D949] ring-2 ring-[#F9D949]/50"></div>
              <span className="text-gray-600">Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#5E2A8C]"></div>
              <span className="text-gray-600">Selecionado</span>
            </div>
          </div>
        </div>
        
        {/* Calendário Grid */}
        <div className="p-5 bg-gradient-to-br from-[#faf5ff] to-[#f3eaff]">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {diasSemanaCompletos.map((dia, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-bold text-[#5E2A8C] mb-1">{diasSemana[i]}</div>
                <div className="text-[10px] text-gray-400 hidden md:block">{dia.substring(0, 3)}</div>
              </div>
            ))}
          </div>
          
          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-2">
            {diasArray.map((dia, idx) => {
              if (!dia) return <div key={idx} className="p-2" />;
              
              const dataStr = dia.toISOString().slice(0, 10);
              const temEventoDia = temEvento(dataStr);
              const ehHojeDia = ehHoje(dataStr);
              const feriadoData = obterFeriado(dataStr);
              const isSelected = dataSelecionada === dataStr;
              
              let bgColor = '';
              let textColor = 'text-gray-700';
              let borderClass = '';
              
              if (isSelected) {
                bgColor = 'bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white shadow-md';
                textColor = 'text-white';
              } else if (feriadoData) {
                bgColor = 'bg-orange-100';
                textColor = 'text-orange-700';
                borderClass = 'border border-orange-200';
              } else if (temEventoDia) {
                bgColor = 'bg-red-100';
                textColor = 'text-red-700';
                borderClass = 'border border-red-200';
              } else if (ehHojeDia) {
                bgColor = 'bg-[#F9D949]/20';
                borderClass = 'ring-2 ring-[#F9D949]';
              } else {
                bgColor = 'bg-white hover:bg-gray-50';
                borderClass = 'border border-gray-100';
              }
              
              return (
                <div
                  key={idx}
                  onClick={() => setDataSelecionada(dataStr)}
                  className={`
                    relative group p-3 text-center rounded-xl cursor-pointer transition-all duration-200
                    ${bgColor} ${borderClass} ${isSelected ? 'scale-105' : 'hover:scale-105'}
                  `}
                >
                  <span className={`text-sm font-bold ${textColor}`}>{dia.getDate()}</span>
                  {feriadoData && (
                    <div className="mt-1">
                      <i className={`${feriadoData.icone} text-xs ${textColor}`} />
                    </div>
                  )}
                  {temEventoDia && !feriadoData && !isSelected && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                  {ehHojeDia && !isSelected && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#F9D949] rounded-full"></div>
                  )}
                  
                  {/* Tooltip do feriado - APENAS quando passa o mouse */}
                  {feriadoData && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                      <div className="flex items-center gap-2">
                        <i className={`${feriadoData.icone} text-[#F9D949] text-xs`} />
                        <span className="font-medium">{feriadoData.nome}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Compromissos do dia */}
        <div className="border-t border-[#F9E6B3] p-5 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#5E2A8C] flex items-center gap-2">
              <i className="fas fa-clock text-[#F9D949]" />
              Compromissos do dia
            </h3>
            <span className="text-xs text-[#8B6EB0] bg-gray-100 px-3 py-1 rounded-full">
              {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {feriado && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <i className={`${feriado.icone} text-orange-600 text-lg`} />
                  </div>
                  <div>
                    <p className="font-bold text-orange-700">{feriado.nome}</p>
                    <p className="text-xs text-gray-500">Feriado</p>
                  </div>
                </div>
              </div>
            )}
            
            {eventosDoDia.length === 0 && !feriado && (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <i className="fas fa-calendar-day text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-400 text-sm">Nenhum compromisso</p>
                <button
                  onClick={() => {
                    setNovoEventoData(dataSelecionada);
                    setModalAberto(true);
                  }}
                  className="mt-3 text-[#5E2A8C] text-sm hover:underline flex items-center gap-1 mx-auto"
                >
                  <i className="fas fa-plus-circle" /> Adicionar compromisso
                </button>
              </div>
            )}
            
            {eventosDoDia.map(evento => (
              <div key={evento.id} className="bg-red-50 p-3 rounded-xl border-l-4 border-red-500 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-calendar-check text-red-500 text-sm" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{evento.titulo}</p>
                        {evento.horario && evento.horario !== '--:--' && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <i className="far fa-clock" /> {evento.horario}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditarEvento(evento)} 
                      className="w-7 h-7 rounded-lg bg-white hover:bg-blue-100 text-blue-500 transition-all flex items-center justify-center"
                    >
                      <i className="fas fa-pen text-xs" />
                    </button>
                    <button 
                      onClick={() => deletarEvento(evento.id)} 
                      className="w-7 h-7 rounded-lg bg-white hover:bg-red-100 text-red-500 transition-all flex items-center justify-center"
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Botão adicionar */}
        <div className="p-5 bg-gray-50 border-t border-[#F9E6B3]">
          <button
            onClick={() => {
              setEventoEditando(null);
              setNovoEventoTitulo('');
              setNovoEventoData('');
              setNovoEventoHorario('');
              setModalAberto(true);
            }}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 group"
          >
            <i className="fas fa-plus-circle text-xl group-hover:rotate-90 transition-transform duration-300" />
            Adicionar Compromisso
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-modal-in">
            <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F9D949] rounded-xl flex items-center justify-center">
                  <i className={`fas ${eventoEditando ? 'fa-pen' : 'fa-calendar-plus'} text-[#5E2A8C] text-lg`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {eventoEditando ? 'Editar Compromisso' : 'Novo Compromisso'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {eventoEditando ? 'Altere os dados do compromisso' : 'Adicione um novo compromisso'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-tag text-[#F9D949] mr-1" />
                  Título
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={novoEventoTitulo}
                  onChange={(e) => setNovoEventoTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                  placeholder="Ex: Reunião importante"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-calendar-day text-[#F9D949] mr-1" />
                  Data
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={novoEventoData}
                  onChange={(e) => setNovoEventoData(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[#5E2A8C] font-semibold mb-2 text-sm">
                  <i className="fas fa-clock text-[#F9D949] mr-1" />
                  Horário
                </label>
                <input
                  type="time"
                  value={novoEventoHorario}
                  onChange={(e) => setNovoEventoHorario(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F9D949] focus:outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Opcional</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setModalAberto(false);
                  setEventoEditando(null);
                  setNovoEventoTitulo('');
                  setNovoEventoData('');
                  setNovoEventoHorario('');
                }}
                className="px-5 py-2 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <i className="fas fa-times" />
                Cancelar
              </button>
              <button
                onClick={eventoEditando ? salvarEdicao : handleAdicionarEvento}
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin" /> Salvando...</>
                ) : (
                  <><i className={`fas ${eventoEditando ? 'fa-save' : 'fa-plus'}`} /> {eventoEditando ? 'Salvar' : 'Adicionar'}</>
                )}
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
      `}</style>
    </>
  );
};

export default Calendario;