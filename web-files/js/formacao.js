// ===================================================================
// MÓDULO DE FORMAÇÃO - JAVASCRIPT COMPLETO
// Gestão de Formação Profissional
// ===================================================================

// ==========================================
// DATA & STATE
// ==========================================

// Departamentos
const departamentosDB = [
  { id: 'IT', nome: 'Tecnologias de Informação' },
  { id: 'RH', nome: 'Recursos Humanos' },
  { id: 'Financeiro', nome: 'Financeiro' },
  { id: 'Comercial', nome: 'Comercial' },
  { id: 'Marketing', nome: 'Marketing' },
  { id: 'Operações', nome: 'Operações' },
  { id: 'Qualidade', nome: 'Qualidade' },
  { id: 'Logística', nome: 'Logística' }
];

// Formadores
const formadoresDB = [
  { id: 1, nome: 'Dr. João Silva', especialidade: 'Gestão de Projetos', tipo: 'Interno' },
  { id: 2, nome: 'Eng. Maria Santos', especialidade: 'Tecnologia', tipo: 'Interno' },
  { id: 3, nome: 'Dr. Pedro Costa', especialidade: 'Liderança', tipo: 'Externo' },
  { id: 4, nome: 'Dra. Ana Ferreira', especialidade: 'RH e Soft Skills', tipo: 'Externo' },
  { id: 5, nome: 'Eng. Carlos Martins', especialidade: 'Excel Avançado', tipo: 'Interno' },
  { id: 6, nome: 'Dra. Sofia Rodrigues', especialidade: 'Comunicação', tipo: 'Externo' }
];

// Colaboradores (para inscrições)
const colaboradoresDB = [
  { id: 1, nome: 'Ana Silva', email: 'ana.silva@empresa.pt', departamento: 'RH' },
  { id: 2, nome: 'Bruno Costa', email: 'bruno.costa@empresa.pt', departamento: 'Financeiro' },
  { id: 3, nome: 'Carla Santos', email: 'carla.santos@empresa.pt', departamento: 'IT' },
  { id: 4, nome: 'David Ferreira', email: 'david.ferreira@empresa.pt', departamento: 'Comercial' },
  { id: 5, nome: 'Eva Rodrigues', email: 'eva.rodrigues@empresa.pt', departamento: 'Marketing' },
  { id: 6, nome: 'Fernando Almeida', email: 'fernando.almeida@empresa.pt', departamento: 'Operações' },
  { id: 7, nome: 'Gabriela Martins', email: 'gabriela.martins@empresa.pt', departamento: 'Qualidade' },
  { id: 8, nome: 'Hugo Pereira', email: 'hugo.pereira@empresa.pt', departamento: 'Logística' },
  { id: 9, nome: 'Inês Oliveira', email: 'ines.oliveira@empresa.pt', departamento: 'IT' },
  { id: 10, nome: 'Jorge Sousa', email: 'jorge.sousa@empresa.pt', departamento: 'Comercial' }
];

// Formações (dados de exemplo)
let formacoesDB = [
  {
    id: 1,
    titulo: 'Gestão de Projetos com Scrum',
    tipo: 'Interna',
    entidade: 'Interno',
    formadorId: 1,
    formador: 'Dr. João Silva',
    objetivo: 'Capacitar os colaboradores nas metodologias ágeis, com foco no framework Scrum para gestão eficiente de projetos.',
    conteudos: '1. Introdução ao Agile\n2. Framework Scrum\n3. Papéis e Responsabilidades\n4. Cerimoniais Scrum\n5. Ferramentas e Boas Práticas',
    departamentosAlvo: ['IT', 'Marketing', 'Comercial'],
    duracao: 16,
    sessoes: [
      { data: '2026-02-10', horaInicio: '09:00', horaFim: '13:00' },
      { data: '2026-02-11', horaInicio: '09:00', horaFim: '13:00' },
      { data: '2026-02-17', horaInicio: '09:00', horaFim: '13:00' },
      { data: '2026-02-18', horaInicio: '09:00', horaFim: '13:00' }
    ],
    localTipo: 'Presencial',
    localDetalhe: 'Sala de Formação A, Piso 2',
    modalidade: 'Opcional',
    minParticipantes: 5,
    maxParticipantes: 15,
    custoParticipante: 0,
    custoTotal: 0,
    justificacao: 'Melhoria da eficiência na gestão de projetos internos.',
    estado: 'Agendada',
    dataLimiteInscricao: '2026-02-05',
    inscritos: [1, 3, 5, 9],
    presencas: {},
    resultados: {},
    avaliacoes: [],
    favoritos: []
  },
  {
    id: 2,
    titulo: 'Excel Avançado para Análise de Dados',
    tipo: 'Interna',
    entidade: 'Interno',
    formadorId: 5,
    formador: 'Eng. Carlos Martins',
    objetivo: 'Dominar funcionalidades avançadas do Excel para análise e visualização de dados empresariais.',
    conteudos: '1. Fórmulas Avançadas\n2. Tabelas Dinâmicas\n3. Power Query\n4. Dashboards\n5. Automação com Macros',
    departamentosAlvo: ['Financeiro', 'RH', 'Operações'],
    duracao: 8,
    sessoes: [
      { data: '2026-01-28', horaInicio: '14:00', horaFim: '18:00' },
      { data: '2026-01-29', horaInicio: '14:00', horaFim: '18:00' }
    ],
    localTipo: 'Híbrido',
    localDetalhe: 'Sala Informática + Teams',
    modalidade: 'Obrigatória',
    minParticipantes: 8,
    maxParticipantes: 20,
    custoParticipante: 0,
    custoTotal: 0,
    justificacao: 'Formação obrigatória para equipas financeiras.',
    estado: 'Agendada',
    dataLimiteInscricao: '2026-01-24',
    inscritos: [1, 2, 6, 7, 8],
    presencas: {},
    resultados: {},
    avaliacoes: [],
    favoritos: [1]
  },
  {
    id: 3,
    titulo: 'Liderança e Gestão de Equipas',
    tipo: 'Externa',
    entidade: 'Cegoc',
    formadorId: 3,
    formador: 'Dr. Pedro Costa',
    objetivo: 'Desenvolver competências de liderança para gestores e coordenadores de equipa.',
    conteudos: '1. Estilos de Liderança\n2. Motivação de Equipas\n3. Feedback Construtivo\n4. Gestão de Conflitos\n5. Delegação Eficaz',
    departamentosAlvo: ['RH', 'Comercial', 'Operações', 'IT'],
    duracao: 24,
    sessoes: [
      { data: '2026-03-03', horaInicio: '09:00', horaFim: '17:00' },
      { data: '2026-03-04', horaInicio: '09:00', horaFim: '17:00' },
      { data: '2026-03-05', horaInicio: '09:00', horaFim: '17:00' }
    ],
    localTipo: 'Presencial',
    localDetalhe: 'Hotel Lisboa Plaza - Sala Executiva',
    modalidade: 'Opcional',
    minParticipantes: 10,
    maxParticipantes: 12,
    custoParticipante: 450,
    custoTotal: 5400,
    justificacao: 'Desenvolvimento de liderança para gestores de primeira linha.',
    estado: 'Pendente Aprovação',
    dataLimiteInscricao: '2026-02-25',
    inscritos: [],
    presencas: {},
    resultados: {},
    avaliacoes: [],
    favoritos: []
  },
  {
    id: 4,
    titulo: 'Segurança da Informação e RGPD',
    tipo: 'Interna',
    entidade: 'Interno',
    formadorId: 2,
    formador: 'Eng. Maria Santos',
    objetivo: 'Sensibilizar todos os colaboradores para as boas práticas de segurança da informação e conformidade com RGPD.',
    conteudos: '1. Princípios de Segurança\n2. RGPD - Obrigações\n3. Phishing e Ameaças\n4. Passwords Seguras\n5. Procedimentos Internos',
    departamentosAlvo: ['IT', 'RH', 'Financeiro', 'Comercial', 'Marketing', 'Operações', 'Qualidade', 'Logística'],
    duracao: 4,
    sessoes: [
      { data: '2025-12-15', horaInicio: '10:00', horaFim: '12:00' },
      { data: '2025-12-15', horaInicio: '14:00', horaFim: '16:00' }
    ],
    localTipo: 'Online',
    localDetalhe: 'Microsoft Teams',
    modalidade: 'Obrigatória',
    minParticipantes: 20,
    maxParticipantes: 100,
    custoParticipante: 0,
    custoTotal: 0,
    justificacao: 'Formação obrigatória anual de RGPD.',
    estado: 'Concluída',
    dataLimiteInscricao: '2025-12-10',
    inscritos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    presencas: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: true, 8: true, 9: true, 10: true },
    resultados: { 1: 'Aprovado', 2: 'Aprovado', 3: 'Aprovado', 4: 'Aprovado', 6: 'Aprovado', 7: 'Aprovado', 8: 'Aprovado', 9: 'Aprovado', 10: 'Aprovado' },
    avaliacoes: [
      { odId: 1, conteudo: 5, formador: 5, organizacao: 4, comentario: 'Muito útil e bem estruturada.', data: '2025-12-16' },
      { odId: 3, conteudo: 4, formador: 5, organizacao: 5, comentario: 'Excelente formadora!', data: '2025-12-16' },
      { odId: 6, conteudo: 4, formador: 4, organizacao: 4, comentario: '', data: '2025-12-17' }
    ],
    favoritos: [3, 9]
  },
  {
    id: 5,
    titulo: 'Técnicas de Negociação Comercial',
    tipo: 'Externa',
    entidade: 'IEFP',
    formadorId: 6,
    formador: 'Dra. Sofia Rodrigues',
    objetivo: 'Aperfeiçoar técnicas de negociação para a equipa comercial.',
    conteudos: '1. Preparação da Negociação\n2. Técnicas de Persuasão\n3. Gestão de Objeções\n4. Fecho de Negócio\n5. Pós-venda',
    departamentosAlvo: ['Comercial'],
    duracao: 12,
    sessoes: [
      { data: '2026-01-20', horaInicio: '09:00', horaFim: '13:00' },
      { data: '2026-01-21', horaInicio: '09:00', horaFim: '13:00' },
      { data: '2026-01-22', horaInicio: '09:00', horaFim: '13:00' }
    ],
    localTipo: 'Presencial',
    localDetalhe: 'Centro IEFP Lisboa',
    modalidade: 'Opcional',
    minParticipantes: 6,
    maxParticipantes: 10,
    custoParticipante: 150,
    custoTotal: 1500,
    justificacao: 'Melhoria das competências comerciais da equipa de vendas.',
    estado: 'Em Curso',
    dataLimiteInscricao: '2026-01-15',
    inscritos: [4, 10],
    presencas: { 4: true, 10: true },
    resultados: {},
    avaliacoes: [],
    favoritos: [4]
  },
  {
    id: 6,
    titulo: 'Inteligência Artificial para Negócios',
    tipo: 'Externa',
    entidade: 'Microsoft',
    formadorId: 2,
    formador: 'Eng. Maria Santos',
    objetivo: 'Introduzir conceitos de IA e suas aplicações práticas no contexto empresarial.',
    conteudos: '1. Fundamentos de IA\n2. Machine Learning Basics\n3. Copilot e Ferramentas IA\n4. Casos de Uso\n5. Ética e IA',
    departamentosAlvo: ['IT', 'Marketing', 'Comercial', 'RH'],
    duracao: 8,
    sessoes: [
      { data: '2026-04-15', horaInicio: '09:00', horaFim: '17:00' }
    ],
    localTipo: 'Online',
    localDetalhe: 'Microsoft Learn Virtual',
    modalidade: 'Opcional',
    minParticipantes: 10,
    maxParticipantes: 50,
    custoParticipante: 200,
    custoTotal: 10000,
    justificacao: 'Preparação da organização para adoção de ferramentas IA.',
    estado: 'Agendada',
    dataLimiteInscricao: '2026-04-10',
    inscritos: [3, 5, 9],
    presencas: {},
    resultados: {},
    avaliacoes: [],
    favoritos: [3, 5]
  }
];

// State
let currentView = 'cards';
let currentFormacaoId = null;
let editingFormacaoId = null;
let sessaoCount = 0;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let currentRatings = { conteudo: 0, formador: 0, organizacao: 0 };
let currentUserId = 3; // Simula utilizador atual (Carla Santos)

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  initializeFormadores();
  initializeDepartamentos();
  renderFormacoes();
  updateStats();
  addSessao(); // Adiciona primeira sessão por defeito
  initializeStarRatings();
  
  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('nova') === 'true') {
    setTimeout(() => {
      openNovaFormacao();
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 300);
  }
});

// ==========================================
// INITIALIZATION HELPERS
// ==========================================

function initializeFormadores() {
  const select = document.getElementById('formFormador');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecionar...</option>';
  formadoresDB.forEach(f => {
    const option = document.createElement('option');
    option.value = f.id;
    option.textContent = `${f.nome} (${f.especialidade})`;
    select.appendChild(option);
  });
}

function initializeDepartamentos() {
  const container = document.getElementById('departamentosCheckboxes');
  if (!container) return;
  
  container.innerHTML = departamentosDB.map(d => `
    <label class="checkbox-item">
      <input type="checkbox" name="departamentos" value="${d.id}">
      <span>${d.nome}</span>
    </label>
  `).join('');
}

function initializeStarRatings() {
  ['ratingConteudo', 'ratingFormador', 'ratingOrganizacao'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const stars = container.querySelectorAll('.star');
    const ratingType = containerId.replace('rating', '').toLowerCase();
    
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        currentRatings[ratingType] = value;
        updateStarDisplay(container, value);
      });
      
      star.addEventListener('mouseenter', () => {
        const value = parseInt(star.dataset.value);
        updateStarDisplay(container, value);
      });
      
      star.addEventListener('mouseleave', () => {
        updateStarDisplay(container, currentRatings[ratingType]);
      });
    });
  });
}

function updateStarDisplay(container, value) {
  const stars = container.querySelectorAll('.star');
  stars.forEach(star => {
    const starValue = parseInt(star.dataset.value);
    star.classList.toggle('active', starValue <= value);
  });
}

// ==========================================
// STATISTICS
// ==========================================

function updateStats() {
  const agendadas = formacoesDB.filter(f => f.estado === 'Agendada' || f.estado === 'Em Curso').length;
  const inscritos = formacoesDB.reduce((sum, f) => sum + f.inscritos.length, 0);
  const concluidas = formacoesDB.filter(f => f.estado === 'Concluída').length;
  const avaliacoesPendentes = formacoesDB.filter(f => 
    f.estado === 'Concluída' && 
    f.inscritos.includes(currentUserId) && 
    !f.avaliacoes.find(a => a.odId === currentUserId)
  ).length;
  
  animateCounter('statAgendadas', agendadas);
  animateCounter('statInscritos', inscritos);
  animateCounter('statConcluidas', concluidas);
  animateCounter('statAvaliacoes', avaliacoesPendentes);
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 500;
  const startValue = parseInt(element.textContent) || 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// ==========================================
// FILTERING & SEARCH
// ==========================================

function filterFormacoes() {
  renderFormacoes();
}

function getFilteredFormacoes() {
  const departamento = document.getElementById('filterDepartamento')?.value || '';
  const tipo = document.getElementById('filterTipo')?.value || '';
  const estado = document.getElementById('filterEstado')?.value || '';
  const search = document.getElementById('searchFormacao')?.value?.toLowerCase() || '';
  
  return formacoesDB.filter(f => {
    if (departamento && !f.departamentosAlvo.includes(departamento)) return false;
    if (tipo && f.tipo !== tipo) return false;
    if (estado && f.estado !== estado) return false;
    if (search && !f.titulo.toLowerCase().includes(search) && !f.formador.toLowerCase().includes(search)) return false;
    return true;
  });
}

// ==========================================
// VIEW TOGGLE
// ==========================================

function setView(view) {
  currentView = view;
  
  document.getElementById('viewCards').classList.toggle('active', view === 'cards');
  document.getElementById('viewList').classList.toggle('active', view === 'list');
  
  document.getElementById('formacoesGrid').style.display = view === 'cards' ? 'grid' : 'none';
  document.getElementById('formacoesTable').style.display = view === 'list' ? 'block' : 'none';
  
  renderFormacoes();
}

// ==========================================
// RENDER FORMAÇÕES
// ==========================================

function renderFormacoes() {
  const formacoes = getFilteredFormacoes();
  const emptyState = document.getElementById('formacoesEmpty');
  
  if (formacoes.length === 0) {
    document.getElementById('formacoesGrid').innerHTML = '';
    document.getElementById('formacoesTableBody').innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  if (currentView === 'cards') {
    renderCardsView(formacoes);
  } else {
    renderTableView(formacoes);
  }
}

function renderCardsView(formacoes) {
  const container = document.getElementById('formacoesGrid');
  
  container.innerHTML = formacoes.map((f, index) => {
    const vagas = f.maxParticipantes - f.inscritos.length;
    const vagasPercent = (f.inscritos.length / f.maxParticipantes) * 100;
    const isFavorite = f.favoritos.includes(currentUserId);
    const isInscrito = f.inscritos.includes(currentUserId);
    const proximaSessao = getProximaSessao(f);
    
    let vagasClass = '';
    if (vagasPercent >= 90) vagasClass = 'full';
    else if (vagasPercent >= 70) vagasClass = 'almost-full';
    
    let actionButton = '';
    if (f.estado === 'Agendada' && !isInscrito && vagas > 0) {
      actionButton = `<button class="formacao-card-action" onclick="event.stopPropagation(); openInscricao(${f.id})">Inscrever</button>`;
    } else if (f.estado === 'Agendada' && isInscrito) {
      actionButton = `<button class="formacao-card-action" style="background: var(--success)" onclick="event.stopPropagation();">Inscrito ✓</button>`;
    } else if (f.estado === 'Concluída' && isInscrito && !f.avaliacoes.find(a => a.odId === currentUserId)) {
      actionButton = `<button class="formacao-card-action" style="background: var(--warning)" onclick="event.stopPropagation(); openAvaliacao(${f.id})">Avaliar</button>`;
    } else {
      actionButton = `<button class="formacao-card-action" onclick="event.stopPropagation(); openDetalhes(${f.id})">Ver mais</button>`;
    }
    
    return `
      <div class="formacao-card" onclick="openDetalhes(${f.id})" style="animation-delay: ${index * 0.1}s">
        <div class="formacao-card-inner">
          <div class="formacao-card-icon ${f.tipo.toLowerCase()}">
            ${f.tipo === 'Interna' ? `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            `}
          </div>
          
          <button class="formacao-card-favorite ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorito(${f.id})">
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          
          <span class="formacao-card-badge ${getEstadoClass(f.estado)}">${f.estado}</span>
          
          <h3 class="formacao-card-title">${f.titulo}</h3>
          <p class="formacao-card-formador">${f.formador}</p>
          
          <div class="formacao-card-meta">
            <span class="formacao-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
              </svg>
              ${proximaSessao || 'Sem data'}
            </span>
            <span class="formacao-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              ${f.duracao}h
            </span>
            <span class="formacao-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${f.localTipo}
            </span>
          </div>
          
          <div class="formacao-card-footer">
            <div class="formacao-card-vagas">
              <span>${vagas} vagas disponíveis</span>
              <div class="formacao-card-vagas-bar">
                <div class="formacao-card-vagas-fill ${vagasClass}" style="width: ${vagasPercent}%"></div>
              </div>
            </div>
            ${actionButton}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTableView(formacoes) {
  const container = document.getElementById('formacoesTableBody');
  
  container.innerHTML = formacoes.map((f, index) => {
    const proximaSessao = getProximaSessao(f);
    const vagas = f.maxParticipantes - f.inscritos.length;
    
    return `
      <div class="table-grid table-grid-formacao" style="cursor: pointer; animation-delay: ${index * 0.05}s" onclick="openDetalhes(${f.id})">
        <div>
          <strong>${f.titulo}</strong>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${f.modalidade}</div>
        </div>
        <div><span class="table-status-${f.tipo.toLowerCase()}">${f.tipo}</span></div>
        <div>${f.formador}</div>
        <div>${proximaSessao || '-'}</div>
        <div>${vagas}/${f.maxParticipantes}</div>
        <div><span class="${getStatusClass(f.estado)}">${f.estado}</span></div>
      </div>
    `;
  }).join('');
}

function getEstadoClass(estado) {
  switch(estado) {
    case 'Agendada': return 'agendada';
    case 'Em Curso': return 'em-curso';
    case 'Concluída': return 'concluida';
    case 'Cancelada': return 'cancelada';
    case 'Pendente Aprovação': return 'pendente';
    default: return '';
  }
}

function getStatusClass(estado) {
  switch(estado) {
    case 'Agendada': return 'table-status-em-aprovacao';
    case 'Em Curso': return 'table-status-draft';
    case 'Concluída': return 'table-status-aprovado';
    case 'Cancelada': return 'table-status-draft';
    case 'Pendente Aprovação': return 'table-status-em-aprovacao';
    default: return '';
  }
}

function getProximaSessao(formacao) {
  const now = new Date();
  const futuras = formacao.sessoes
    .map(s => new Date(s.data))
    .filter(d => d >= now)
    .sort((a, b) => a - b);
  
  if (futuras.length > 0) {
    return futuras[0].toLocaleDateString('pt-PT');
  }
  
  if (formacao.sessoes.length > 0) {
    return new Date(formacao.sessoes[0].data).toLocaleDateString('pt-PT');
  }
  
  return null;
}

// ==========================================
// MODAL: NOVA/EDITAR FORMAÇÃO
// ==========================================

function openNovaFormacao() {
  editingFormacaoId = null;
  document.getElementById('modalFormacaoTitle').textContent = 'Nova Formação';
  document.getElementById('formFormacao').reset();
  
  // Reset tabs
  switchTab('info');
  
  // Reset departamentos
  document.querySelectorAll('input[name="departamentos"]').forEach(cb => cb.checked = false);
  
  // Reset sessões
  document.getElementById('sessoesContainer').innerHTML = '';
  sessaoCount = 0;
  addSessao();
  
  const modal = document.getElementById('modalFormacao');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModalFormacao() {
  const modal = document.getElementById('modalFormacao');
  modal.classList.remove('show');
  document.body.style.overflow = '';
  editingFormacaoId = null;
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.form-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.form-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  });
}

function onTipoChange() {
  const tipo = document.getElementById('formTipo').value;
  const entidadeSelect = document.getElementById('formEntidade');
  
  if (tipo === 'Interna') {
    entidadeSelect.value = 'Interno';
  }
}

function onEntidadeChange() {
  const entidade = document.getElementById('formEntidade').value;
  const outraGroup = document.getElementById('entidadeOutraGroup');
  
  outraGroup.style.display = entidade === 'outro' ? 'block' : 'none';
}

function onLocalTipoChange() {
  const tipo = document.getElementById('formLocalTipo').value;
  const detalheInput = document.getElementById('formLocalDetalhe');
  
  if (tipo === 'Online') {
    detalheInput.placeholder = 'Ex: Microsoft Teams, Zoom...';
  } else {
    detalheInput.placeholder = 'Ex: Sala de Formação A, Piso 2';
  }
}

// Sessões
function addSessao() {
  sessaoCount++;
  const container = document.getElementById('sessoesContainer');
  
  const sessaoDiv = document.createElement('div');
  sessaoDiv.className = 'sessao-item';
  sessaoDiv.id = `sessao_${sessaoCount}`;
  sessaoDiv.innerHTML = `
    <div class="form-group">
      <label class="form-label">Data</label>
      <input type="date" class="form-input sessao-data" required>
    </div>
    <div class="form-group">
      <label class="form-label">Horário</label>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="time" class="form-input sessao-inicio" value="09:00" style="flex: 1;">
        <span>-</span>
        <input type="time" class="form-input sessao-fim" value="17:00" style="flex: 1;">
      </div>
    </div>
    ${sessaoCount > 1 ? `
      <button type="button" class="btn-remove-sessao" onclick="removeSessao(${sessaoCount})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    ` : '<div></div>'}
  `;
  
  container.appendChild(sessaoDiv);
}

function removeSessao(id) {
  const element = document.getElementById(`sessao_${id}`);
  if (element) {
    element.remove();
  }
}

function collectSessoes() {
  const sessoes = [];
  document.querySelectorAll('.sessao-item').forEach(item => {
    const data = item.querySelector('.sessao-data')?.value;
    const inicio = item.querySelector('.sessao-inicio')?.value;
    const fim = item.querySelector('.sessao-fim')?.value;
    
    if (data) {
      sessoes.push({ data, horaInicio: inicio, horaFim: fim });
    }
  });
  return sessoes;
}

function handleSubmitFormacao(event) {
  event.preventDefault();
  
  const formData = collectFormData();
  formData.estado = 'Pendente Aprovação';
  
  if (editingFormacaoId) {
    const index = formacoesDB.findIndex(f => f.id === editingFormacaoId);
    if (index !== -1) {
      formacoesDB[index] = { ...formacoesDB[index], ...formData };
    }
  } else {
    formData.id = Date.now();
    formData.inscritos = [];
    formData.presencas = {};
    formData.resultados = {};
    formData.avaliacoes = [];
    formData.favoritos = [];
    formacoesDB.unshift(formData);
  }
  
  renderFormacoes();
  updateStats();
  closeModalFormacao();
  showToast('Formação submetida para aprovação!', 'success');
}

function saveFormacaoRascunho() {
  const formData = collectFormData();
  formData.estado = 'Rascunho';
  
  if (editingFormacaoId) {
    const index = formacoesDB.findIndex(f => f.id === editingFormacaoId);
    if (index !== -1) {
      formacoesDB[index] = { ...formacoesDB[index], ...formData };
    }
  } else {
    formData.id = Date.now();
    formData.inscritos = [];
    formData.presencas = {};
    formData.resultados = {};
    formData.avaliacoes = [];
    formData.favoritos = [];
    formacoesDB.unshift(formData);
  }
  
  renderFormacoes();
  updateStats();
  closeModalFormacao();
  showToast('Rascunho guardado!', 'warning');
}

function collectFormData() {
  const formadorId = document.getElementById('formFormador').value;
  const formador = formadoresDB.find(f => f.id == formadorId);
  
  let entidade = document.getElementById('formEntidade').value;
  if (entidade === 'outro') {
    entidade = document.getElementById('formEntidadeOutra').value;
  }
  
  const departamentosAlvo = [];
  document.querySelectorAll('input[name="departamentos"]:checked').forEach(cb => {
    departamentosAlvo.push(cb.value);
  });
  
  return {
    titulo: document.getElementById('formTitulo').value,
    tipo: document.getElementById('formTipo').value,
    entidade: entidade,
    formadorId: formadorId,
    formador: formador?.nome || '',
    objetivo: document.getElementById('formObjetivo').value,
    conteudos: document.getElementById('formConteudos').value,
    departamentosAlvo: departamentosAlvo,
    duracao: parseInt(document.getElementById('formDuracao').value) || 0,
    sessoes: collectSessoes(),
    localTipo: document.getElementById('formLocalTipo').value,
    localDetalhe: document.getElementById('formLocalDetalhe').value,
    modalidade: document.getElementById('formModalidade').value,
    minParticipantes: parseInt(document.getElementById('formMinParticipantes').value) || 1,
    maxParticipantes: parseInt(document.getElementById('formMaxParticipantes').value) || 20,
    custoParticipante: parseFloat(document.getElementById('formCustoParticipante').value) || 0,
    custoTotal: parseFloat(document.getElementById('formCustoTotal').value) || 0,
    justificacao: document.getElementById('formJustificacao').value,
    dataLimiteInscricao: document.getElementById('formDataLimite').value
  };
}

// ==========================================
// MODAL: DETALHES
// ==========================================

function openDetalhes(id) {
  const formacao = formacoesDB.find(f => f.id === id);
  if (!formacao) return;
  
  currentFormacaoId = id;
  
  // Header
  document.getElementById('detalhesTipo').textContent = formacao.tipo;
  document.getElementById('detalhesTitulo').textContent = formacao.titulo;
  document.getElementById('detalhesFormador').textContent = formacao.formador;
  
  // Update header gradient based on type
  const header = document.getElementById('modalDetalhesHeader');
  if (formacao.tipo === 'Externa') {
    header.style.background = 'var(--gradient-formacao-2)';
  } else {
    header.style.background = 'var(--gradient-formacao-1)';
  }
  
  // Info tab
  document.getElementById('detalhesObjetivo').textContent = formacao.objetivo;
  document.getElementById('detalhesConteudos').innerHTML = formacao.conteudos.replace(/\n/g, '<br>');
  document.getElementById('detalhesEstado').innerHTML = `<span class="formacao-card-badge ${getEstadoClass(formacao.estado)}">${formacao.estado}</span>`;
  document.getElementById('detalhesDuracao').textContent = `${formacao.duracao} horas`;
  document.getElementById('detalhesModalidade').textContent = formacao.modalidade;
  document.getElementById('detalhesLocal').textContent = `${formacao.localTipo} - ${formacao.localDetalhe}`;
  document.getElementById('detalhesVagas').textContent = `${formacao.inscritos.length}/${formacao.maxParticipantes}`;
  document.getElementById('detalhesDataLimite').textContent = formacao.dataLimiteInscricao ? new Date(formacao.dataLimiteInscricao).toLocaleDateString('pt-PT') : '-';
  
  // Sessões
  const sessoesContainer = document.getElementById('detalhesSessoes');
  sessoesContainer.innerHTML = formacao.sessoes.map(s => `
    <div class="sessao-list-item">
      <div class="sessao-list-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
        </svg>
      </div>
      <div class="sessao-list-info">
        <div class="sessao-list-date">${new Date(s.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div class="sessao-list-time">${s.horaInicio} - ${s.horaFim}</div>
      </div>
    </div>
  `).join('');
  
  // Actions
  const actionsContainer = document.getElementById('detalhesActions');
  const isInscrito = formacao.inscritos.includes(currentUserId);
  const vagas = formacao.maxParticipantes - formacao.inscritos.length;
  
  let actionsHTML = '';
  
  if (formacao.estado === 'Agendada') {
    if (!isInscrito && vagas > 0) {
      actionsHTML += `<button class="btn btn-primary" onclick="openInscricao(${id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>Inscrever-me</button>`;
    } else if (isInscrito) {
      actionsHTML += `<button class="btn btn-secondary" onclick="cancelarInscricao(${id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>Cancelar Inscrição</button>`;
    }
  } else if (formacao.estado === 'Concluída' && isInscrito) {
    if (!formacao.avaliacoes.find(a => a.odId === currentUserId)) {
      actionsHTML += `<button class="btn btn-primary" onclick="openAvaliacao(${id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Avaliar Formação</button>`;
    }
  }
  
  actionsContainer.innerHTML = actionsHTML;
  
  // Participantes tab
  renderParticipantes(formacao);
  
  // Avaliações tab
  renderAvaliacoes(formacao);
  
  // Reset to first tab
  switchDetalhesTab('detalhesInfo');
  
  const modal = document.getElementById('modalDetalhes');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModalDetalhes() {
  const modal = document.getElementById('modalDetalhes');
  modal.classList.remove('show');
  document.body.style.overflow = '';
  currentFormacaoId = null;
}

function switchDetalhesTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.detalhes-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.detalhes-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  });
}

function renderParticipantes(formacao) {
  const container = document.getElementById('participantesTableBody');
  const presentes = Object.values(formacao.presencas).filter(p => p === true).length;
  
  document.getElementById('numInscritos').textContent = formacao.inscritos.length;
  document.getElementById('numPresentes').textContent = presentes;
  
  if (formacao.inscritos.length === 0) {
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Nenhum participante inscrito.</div>';
    return;
  }
  
  container.innerHTML = formacao.inscritos.map(colabId => {
    const colab = colaboradoresDB.find(c => c.id === colabId);
    if (!colab) return '';
    
    const presenca = formacao.presencas[colabId];
    const resultado = formacao.resultados[colabId];
    const initials = colab.nome.split(' ').map(n => n[0]).join('').substring(0, 2);
    
    let presencaBadge = '<span class="presenca-badge pendente">Pendente</span>';
    if (presenca === true) presencaBadge = '<span class="presenca-badge presente">Presente</span>';
    else if (presenca === false) presencaBadge = '<span class="presenca-badge ausente">Ausente</span>';
    
    let resultadoBadge = '<span class="resultado-badge pendente">-</span>';
    if (resultado === 'Aprovado') resultadoBadge = '<span class="resultado-badge aprovado">Aprovado</span>';
    else if (resultado === 'Reprovado') resultadoBadge = '<span class="resultado-badge reprovado">Reprovado</span>';
    
    return `
      <div class="participante-row">
        <div class="participante-info">
          <div class="participante-avatar">${initials}</div>
          <span class="participante-nome">${colab.nome}</span>
        </div>
        <div>${colab.departamento}</div>
        <div>${new Date().toLocaleDateString('pt-PT')}</div>
        <div>${presencaBadge}</div>
        <div>${resultadoBadge}</div>
        <div class="participante-actions">
          <button class="participante-action-btn" title="Marcar presença" onclick="togglePresenca(${formacao.id}, ${colabId})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderAvaliacoes(formacao) {
  const container = document.getElementById('avaliacoesList');
  
  if (formacao.avaliacoes.length === 0) {
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Ainda não existem avaliações.</div>';
    
    // Reset scores
    updateScoreCircle('scoreConteudo', 0);
    updateScoreCircle('scoreFormador', 0);
    updateScoreCircle('scoreOrganizacao', 0);
    updateScoreCircle('scoreGlobal', 0);
    document.getElementById('scoreConteudoValue').textContent = '-';
    document.getElementById('scoreFormadorValue').textContent = '-';
    document.getElementById('scoreOrganizacaoValue').textContent = '-';
    document.getElementById('scoreGlobalValue').textContent = '-';
    return;
  }
  
  // Calculate averages
  const avgConteudo = formacao.avaliacoes.reduce((sum, a) => sum + a.conteudo, 0) / formacao.avaliacoes.length;
  const avgFormador = formacao.avaliacoes.reduce((sum, a) => sum + a.formador, 0) / formacao.avaliacoes.length;
  const avgOrganizacao = formacao.avaliacoes.reduce((sum, a) => sum + a.organizacao, 0) / formacao.avaliacoes.length;
  const avgGlobal = (avgConteudo + avgFormador + avgOrganizacao) / 3;
  
  // Update score circles
  updateScoreCircle('scoreConteudo', avgConteudo / 5 * 100);
  updateScoreCircle('scoreFormador', avgFormador / 5 * 100);
  updateScoreCircle('scoreOrganizacao', avgOrganizacao / 5 * 100);
  updateScoreCircle('scoreGlobal', avgGlobal / 5 * 100);
  
  document.getElementById('scoreConteudoValue').textContent = avgConteudo.toFixed(1);
  document.getElementById('scoreFormadorValue').textContent = avgFormador.toFixed(1);
  document.getElementById('scoreOrganizacaoValue').textContent = avgOrganizacao.toFixed(1);
  document.getElementById('scoreGlobalValue').textContent = avgGlobal.toFixed(1);
  
  // Render list
  container.innerHTML = formacao.avaliacoes.map(av => {
    const colab = colaboradoresDB.find(c => c.id === av.odId);
    const initials = colab ? colab.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';
    const avgStar = (av.conteudo + av.formador + av.organizacao) / 3;
    const stars = '★'.repeat(Math.round(avgStar)) + '☆'.repeat(5 - Math.round(avgStar));
    
    return `
      <div class="avaliacao-item">
        <div class="avaliacao-item-header">
          <div class="avaliacao-item-user">
            <div class="avaliacao-item-avatar">${initials}</div>
            <div>
              <div class="avaliacao-item-name">${colab?.nome || 'Anónimo'}</div>
              <div class="avaliacao-item-date">${av.data}</div>
            </div>
          </div>
          <div class="avaliacao-item-stars">${stars}</div>
        </div>
        ${av.comentario ? `<p class="avaliacao-item-comment">"${av.comentario}"</p>` : ''}
      </div>
    `;
  }).join('');
}

function updateScoreCircle(id, percentage) {
  const circle = document.getElementById(id);
  if (circle) {
    circle.style.strokeDasharray = `${percentage}, 100`;
  }
}

function togglePresenca(formacaoId, colabId) {
  const formacao = formacoesDB.find(f => f.id === formacaoId);
  if (!formacao) return;
  
  if (formacao.presencas[colabId] === true) {
    formacao.presencas[colabId] = false;
  } else {
    formacao.presencas[colabId] = true;
  }
  
  renderParticipantes(formacao);
}

function toggleFavorito(id) {
  const formacao = formacoesDB.find(f => f.id === id);
  if (!formacao) return;
  
  const index = formacao.favoritos.indexOf(currentUserId);
  if (index === -1) {
    formacao.favoritos.push(currentUserId);
    showToast('Adicionado aos favoritos!', 'success');
  } else {
    formacao.favoritos.splice(index, 1);
    showToast('Removido dos favoritos', 'warning');
  }
  
  renderFormacoes();
}

// ==========================================
// MODAL: INSCRIÇÃO
// ==========================================

function openInscricao(id) {
  const formacao = formacoesDB.find(f => f.id === id);
  if (!formacao) return;
  
  currentFormacaoId = id;
  
  document.getElementById('inscricaoTitulo').textContent = formacao.titulo;
  document.getElementById('inscricaoData').textContent = getProximaSessao(formacao) || 'A definir';
  document.getElementById('inscricaoDuracao').textContent = `${formacao.duracao} horas`;
  document.getElementById('inscricaoLocal').textContent = `${formacao.localTipo} - ${formacao.localDetalhe}`;
  
  const vagas = formacao.maxParticipantes - formacao.inscritos.length;
  const percent = (formacao.inscritos.length / formacao.maxParticipantes) * 100;
  
  document.getElementById('inscricaoVagasBar').style.width = `${percent}%`;
  document.getElementById('inscricaoVagasText').textContent = `${formacao.inscritos.length} de ${formacao.maxParticipantes} vagas preenchidas`;
  
  document.getElementById('inscricaoConfirm').checked = false;
  document.getElementById('inscricaoObservacoes').value = '';
  
  closeModalDetalhes();
  
  const modal = document.getElementById('modalInscricao');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModalInscricao() {
  const modal = document.getElementById('modalInscricao');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function confirmarInscricao() {
  if (!document.getElementById('inscricaoConfirm').checked) {
    showToast('Por favor confirme a sua disponibilidade', 'danger');
    return;
  }
  
  const formacao = formacoesDB.find(f => f.id === currentFormacaoId);
  if (!formacao) return;
  
  if (!formacao.inscritos.includes(currentUserId)) {
    formacao.inscritos.push(currentUserId);
  }
  
  closeModalInscricao();
  renderFormacoes();
  updateStats();
  showToast('Inscrição confirmada com sucesso!', 'success');
}

function cancelarInscricao(id) {
  const formacao = formacoesDB.find(f => f.id === id);
  if (!formacao) return;
  
  const index = formacao.inscritos.indexOf(currentUserId);
  if (index !== -1) {
    formacao.inscritos.splice(index, 1);
  }
  
  closeModalDetalhes();
  renderFormacoes();
  updateStats();
  showToast('Inscrição cancelada', 'warning');
}

// ==========================================
// MODAL: AVALIAÇÃO
// ==========================================

function openAvaliacao(id) {
  currentFormacaoId = id;
  currentRatings = { conteudo: 0, formador: 0, organizacao: 0 };
  
  // Reset stars
  ['ratingConteudo', 'ratingFormador', 'ratingOrganizacao'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      updateStarDisplay(container, 0);
    }
  });
  
  document.getElementById('avaliacaoComentarios').value = '';
  document.querySelectorAll('input[name="recomendaria"]').forEach(r => r.checked = false);
  
  closeModalDetalhes();
  
  const modal = document.getElementById('modalAvaliacao');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModalAvaliacao() {
  const modal = document.getElementById('modalAvaliacao');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function submitAvaliacao() {
  if (currentRatings.conteudo === 0 || currentRatings.formador === 0 || currentRatings.organizacao === 0) {
    showToast('Por favor avalie todas as categorias', 'danger');
    return;
  }
  
  const formacao = formacoesDB.find(f => f.id === currentFormacaoId);
  if (!formacao) return;
  
  const avaliacao = {
    odId: currentUserId,
    conteudo: currentRatings.conteudo,
    formador: currentRatings.formador,
    organizacao: currentRatings.organizacao,
    comentario: document.getElementById('avaliacaoComentarios').value,
    data: new Date().toISOString().split('T')[0]
  };
  
  formacao.avaliacoes.push(avaliacao);
  
  closeModalAvaliacao();
  renderFormacoes();
  updateStats();
  showToast('Obrigado pela sua avaliação!', 'success');
}

// ==========================================
// MODAL: HISTÓRICO
// ==========================================

function openMeuHistorico() {
  // Calculate stats
  const minhasFormacoes = formacoesDB.filter(f => f.inscritos.includes(currentUserId));
  const concluidas = minhasFormacoes.filter(f => f.estado === 'Concluída');
  const totalHoras = concluidas.reduce((sum, f) => sum + f.duracao, 0);
  const certificados = concluidas.filter(f => f.resultados[currentUserId] === 'Aprovado').length;
  
  const obrigatorias = minhasFormacoes.filter(f => f.modalidade === 'Obrigatória');
  const obrigatoriasCompletas = obrigatorias.filter(f => f.estado === 'Concluída' && f.resultados[currentUserId] === 'Aprovado').length;
  const percentObrigatorias = obrigatorias.length > 0 ? Math.round((obrigatoriasCompletas / obrigatorias.length) * 100) : 100;
  
  document.getElementById('historicoTotal').textContent = concluidas.length;
  document.getElementById('historicoHoras').textContent = `${totalHoras}h`;
  document.getElementById('historicoCertificados').textContent = certificados;
  document.getElementById('historicoObrigatorias').textContent = `${percentObrigatorias}%`;
  
  // Obrigatórias pendentes
  const pendentes = formacoesDB.filter(f => 
    f.modalidade === 'Obrigatória' && 
    (f.estado === 'Agendada' || f.estado === 'Em Curso') &&
    !f.inscritos.includes(currentUserId)
  );
  
  const pendentesContainer = document.getElementById('obrigatoriasPendentes');
  if (pendentes.length === 0) {
    pendentesContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--success);">Todas as formações obrigatórias estão em dia! ✓</div>';
  } else {
    pendentesContainer.innerHTML = pendentes.map(f => `
      <div class="historico-item">
        <div class="historico-item-info">
          <div class="historico-item-icon pendente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <div class="historico-item-title">${f.titulo}</div>
            <div class="historico-item-meta">${f.duracao}h • ${getProximaSessao(f) || 'Sem data'}</div>
          </div>
        </div>
        <div class="historico-item-actions">
          <button class="btn btn-sm btn-primary" onclick="closeModalHistorico(); openInscricao(${f.id})">Inscrever</button>
        </div>
      </div>
    `).join('');
  }
  
  // Concluídas
  const concluidasContainer = document.getElementById('formacoesConcluidas');
  if (concluidas.length === 0) {
    concluidasContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Ainda não completou nenhuma formação.</div>';
  } else {
    concluidasContainer.innerHTML = concluidas.map(f => {
      const resultado = f.resultados[currentUserId];
      
      return `
        <div class="historico-item">
          <div class="historico-item-info">
            <div class="historico-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
            </div>
            <div>
              <div class="historico-item-title">${f.titulo}</div>
              <div class="historico-item-meta">${f.duracao}h • ${f.sessoes[0]?.data ? new Date(f.sessoes[0].data).toLocaleDateString('pt-PT') : '-'}</div>
            </div>
          </div>
          <div class="historico-item-actions">
            ${resultado === 'Aprovado' ? '<button class="btn btn-sm btn-secondary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Certificado</button>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  const modal = document.getElementById('modalHistorico');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModalHistorico() {
  const modal = document.getElementById('modalHistorico');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// ==========================================
// MODAL: CALENDÁRIO
// ==========================================

function openCalendario() {
  renderCalendario();
  
  const modal = document.getElementById('modalCalendario');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModalCalendario() {
  const modal = document.getElementById('modalCalendario');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function prevMonth() {
  currentCalendarMonth--;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderCalendario();
}

function nextMonth() {
  currentCalendarMonth++;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  renderCalendario();
}

function renderCalendario() {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  document.getElementById('calendarioMesAno').textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
  
  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get events for this month
  const eventos = {};
  formacoesDB.forEach(f => {
    f.sessoes.forEach(s => {
      const date = new Date(s.data);
      if (date.getMonth() === currentCalendarMonth && date.getFullYear() === currentCalendarYear) {
        const day = date.getDate();
        if (!eventos[day]) eventos[day] = [];
        eventos[day].push(f);
      }
    });
  });
  
  let html = '';
  
  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    html += '<div class="calendario-day other-month"></div>';
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(currentCalendarYear, currentCalendarMonth, day);
    const isToday = currentDate.getTime() === today.getTime();
    const dayEvents = eventos[day] || [];
    
    let dotsHtml = '';
    if (dayEvents.length > 0) {
      const uniqueStates = [...new Set(dayEvents.map(e => e.estado))];
      dotsHtml = '<div class="event-dots">';
      uniqueStates.slice(0, 3).forEach(estado => {
        dotsHtml += `<span class="event-dot ${getEstadoClass(estado)}"></span>`;
      });
      dotsHtml += '</div>';
    }
    
    html += `
      <div class="calendario-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''}" onclick="showDayEvents(${day})">
        ${day}
        ${dotsHtml}
      </div>
    `;
  }
  
  document.getElementById('calendarioDays').innerHTML = html;
}

function showDayEvents(day) {
  const eventos = [];
  formacoesDB.forEach(f => {
    f.sessoes.forEach(s => {
      const date = new Date(s.data);
      if (date.getDate() === day && date.getMonth() === currentCalendarMonth && date.getFullYear() === currentCalendarYear) {
        eventos.push(f);
      }
    });
  });
  
  if (eventos.length === 0) {
    showToast('Sem formações neste dia', 'warning');
    return;
  }
  
  if (eventos.length === 1) {
    closeModalCalendario();
    openDetalhes(eventos[0].id);
  } else {
    // Para simplificar, abre a primeira
    closeModalCalendario();
    openDetalhes(eventos[0].id);
  }
}

// ==========================================
// PARTICIPANTES MANAGEMENT
// ==========================================

function openAdicionarParticipante() {
  showToast('Funcionalidade em desenvolvimento', 'warning');
}

function exportarParticipantes() {
  showToast('Lista exportada!', 'success');
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      ${type === 'success' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' : ''}
      ${type === 'warning' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : ''}
      ${type === 'danger' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' : ''}
    </div>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    const modalId = e.target.id;
    switch(modalId) {
      case 'modalFormacao': closeModalFormacao(); break;
      case 'modalDetalhes': closeModalDetalhes(); break;
      case 'modalInscricao': closeModalInscricao(); break;
      case 'modalAvaliacao': closeModalAvaliacao(); break;
      case 'modalHistorico': closeModalHistorico(); break;
      case 'modalCalendario': closeModalCalendario(); break;
    }
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModalFormacao();
    closeModalDetalhes();
    closeModalInscricao();
    closeModalAvaliacao();
    closeModalHistorico();
    closeModalCalendario();
  }
});
