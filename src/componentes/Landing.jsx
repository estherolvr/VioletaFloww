import React from 'react';

const Landing = ({ onEntrarDashboard }) => {
  // Dados estatísticos da pesquisa
  const estatisticas = [
    { numero: '+32', label: 'usuários pesquisados', icone: 'fas fa-users', cor: 'bg-purple-100' },
    { numero: '81%', label: 'priorizam notificações', icone: 'fas fa-bell', cor: 'bg-yellow-100' },
    { numero: '76%', label: 'querem simplicidade', icone: 'fas fa-heart', cor: 'bg-pink-100' }
  ];

  // Cards informativos com posições alternadas
  const cards = [
    { 
      icone: 'fas fa-bullseye', 
      titulo: 'Nosso Objetivo', 
      texto: 'Ajudar estudantes universitários a gerenciar compromissos, tarefas e prazos acadêmicos de forma simples, intuitiva e integrada com ferramentas visuais como Kanban.',
      posicao: 'md:col-span-1',
      delay: 'delay-0'
    },
    { 
      icone: 'fas fa-users', 
      titulo: 'Público-Alvo', 
      texto: 'Estudantes com múltiplas demandas acadêmicas e pessoais, que buscam otimizar sua rotina e reduzir o esquecimento de compromissos importantes.',
      posicao: 'md:col-span-1 md:mt-12',
      delay: 'delay-100'
    },
    { 
      icone: 'fas fa-chart-line', 
      titulo: 'Metodologia', 
      texto: 'Pesquisa quantitativa (Google Forms com 32 respostas) e entrevistas qualitativas validaram a necessidade de uma agenda com lembretes e integração com Kanban.',
      posicao: 'md:col-span-1',
      delay: 'delay-200'
    },
    { 
      icone: 'fas fa-star', 
      titulo: 'Diferenciais', 
      texto: 'Notificações de lembretes, quadro Kanban integrado, feriados nacionais brasileiros e visualização por dia, semana e mês com design inclusivo.',
      posicao: 'md:col-span-1 md:mt-12',
      delay: 'delay-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf5ff] via-[#f3eaff] to-[#f0e6fc] relative overflow-hidden">
      {/* Elementos decorativos assimétricos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-[#F9D949]/20 to-[#AE7BEC]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-to-l from-[#5E2A8C]/10 to-[#F9D949]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#AE7BEC]/10 rounded-full blur-2xl"></div>
        
        {/* Linhas decorativas diagonais */}
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-10" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 V46.29 c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5 C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,44,1113-14.29,1200,52.47V0Z" fill="#5E2A8C"></path>
        </svg>
      </div>

      {/* Barra de navegação */}
      <nav className="sticky top-0 z-50 bg-[#5E2A8C]/90 backdrop-blur-lg px-6 md:px-12 py-4 flex justify-between items-center shadow-xl border-b border-[#F9D949]/30">
        <div className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-[#F9D949] rounded-2xl flex items-center justify-center text-2xl animate-float shadow-lg group-hover:scale-110 transition-transform">
            <i className="fas fa-calendar-alt text-[#5E2A8C]" />
          </div>
          <div>
            <h1 className="text-white text-xl md:text-2xl font-bold tracking-tight">Violeta<span className="text-[#F9D949]">Flow</span></h1>
            <p className="text-white/50 text-xs hidden md:block">organização inteligente</p>
          </div>
        </div>
        <button
          onClick={onEntrarDashboard}
          className="bg-[#F9D949] text-[#3C096C] px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 hover:shadow-2xl transition-all group"
        >
          <i className="fas fa-arrow-right-to-bracket group-hover:translate-x-1 transition-transform" />
          Acessar Agenda
        </button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 md:px-16 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Lado esquerdo - Texto */}
          <div className="order-2 md:order-1">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-[#F9D949]/20 rounded-full text-xs font-semibold text-[#5E2A8C] mb-3">
                ✨ Nova experiência
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-[#5E2A8C]">Sua rotina,</span>
                <br />
                <span className="bg-gradient-to-r from-[#5E2A8C] to-[#F9D949] bg-clip-text text-transparent">
                  sob controle
                </span>
              </h1>
            </div>
            <p className="text-[#6F5B8E] text-lg mb-8 leading-relaxed max-w-md">
              Organize compromissos, tarefas e prazos acadêmicos com a ferramenta que combina agenda e Kanban em um só lugar.
            </p>
            
            {/* Estatísticas */}
            <div className="flex gap-8">
              {estatisticas.map((stat, i) => (
                <div key={i} className="text-center group cursor-pointer">
                  <div className={`w-12 h-12 ${stat.cor} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <i className={`${stat.icone} text-[#5E2A8C] text-lg`} />
                  </div>
                  <div className="text-xl font-bold text-[#5E2A8C]">{stat.numero}</div>
                  <div className="text-xs text-[#8B6EB0]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Lado direito - Elemento visual */}
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#F9D949]/30 to-[#AE7BEC]/30 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#5E2A8C]/20 rounded-2xl p-4 text-center">
                    <i className="fas fa-calendar-check text-3xl text-[#5E2A8C] mb-2" />
                    <p className="text-xs text-[#5E2A8C] font-semibold">Agenda</p>
                  </div>
                  <div className="bg-[#F9D949]/20 rounded-2xl p-4 text-center">
                    <i className="fas fa-tasks text-3xl text-[#F9D949] mb-2" />
                    <p className="text-xs text-[#5E2A8C] font-semibold">Kanban</p>
                  </div>
                  <div className="bg-[#AE7BEC]/20 rounded-2xl p-4 text-center">
                    <i className="fas fa-bell text-3xl text-[#AE7BEC] mb-2" />
                    <p className="text-xs text-[#5E2A8C] font-semibold">Lembretes</p>
                  </div>
                  <div className="bg-gradient-to-r from-[#5E2A8C] to-[#F9D949] rounded-2xl p-4 text-center">
                    <i className="fas fa-chart-line text-3xl text-white mb-2" />
                    <p className="text-xs text-white font-semibold">Produtividade</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards informativos */}
      <div className="relative z-10 px-6 md:px-16 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#3C096C] mb-3">✨ Sobre o Projeto</h2>
          <p className="text-[#8B6EB0]">Baseado em pesquisa com estudantes universitários</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className={`bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-[#F9D949]/30 group`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#F9E6B3] to-[#F9D949]/50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
                  <i className={`${card.icone} text-[#5E2A8C]`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#5E2A8C] mb-2">{card.titulo}</h3>
                  <p className="text-[#6F5B8E] text-sm leading-relaxed">{card.texto}</p>
                  <div className="mt-3 w-12 h-0.5 bg-[#F9D949] group-hover:w-24 transition-all"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative z-10 mx-6 md:mx-16 mb-16">
        <div className="bg-gradient-to-r from-[#5E2A8C] to-[#7B3FAC] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F9D949]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <i className="fas fa-rocket text-4xl text-[#F9D949] mb-4 animate-bounce" />
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Pronto para começar?</h3>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Junte-se a outros estudantes que já estão organizando sua rotina com o VioletaFlow
            </p>
            <button
              onClick={onEntrarDashboard}
              className="bg-[#F9D949] text-[#5E2A8C] px-8 py-3 rounded-full font-bold hover:scale-105 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              Começar agora
              <i className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="text-center py-8 text-[#8B6EB0] text-sm border-t border-[#F9D949]/20">
        <p>© 2024 VioletaFlow — Organização inteligente para sua rotina acadêmica</p>
        <p className="text-xs mt-2">✨ Feito com 💜 para estudantes universitários ✨</p>
        <p className="text-xs mt-2">Por Eric Victor Bittu Silva, Esther Oliveira Costa, Higor Luiz Fonseca Dos Santos e João Victor De Faria Santana</p>
      </footer>
    </div>
  );
};

export default Landing;