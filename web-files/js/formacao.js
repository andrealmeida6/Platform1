// ===================================================================
// MÓDULO DE FORMAÇÃO - JAVASCRIPT COMPLETO
// Integração com Supabase via DataService
// Estrutura compatível com Power Pages
// ===================================================================

// ==========================================
// STATE & CACHE
// ==========================================

let formacoesCache = [];
let colaboradoresCache = [];
let departamentosCache = [];
let formadoresCache = [];
let entidadesCache = [];

let currentView = 'cards';
let currentFormacaoId = null;
let editingFormacaoId = null;
let sessaoCount = 0;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let currentRatings = { conteudo: 0, formador: 0, organizacao: 0 };

// Utilizador atual (em produção viria da sessão/auth)
// Para Power Pages: seria obtido via liquid {{ user.id }}
let currentUserId = null;
const CURRENT_USER_EMAIL = 'carla.santos@empresa.pt'; // Simulação

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
  showLoadingState();
  
  try {
    // Carregar dados do Supabase
    await loadInitialData();
    
    // Inicializar UI
    initializeFormadores();
    initializeDepartamentos();
    initializeEntidades();
    renderFormacoes();
    updateStats();
    addSessao();
    initializeStarRatings();
    
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('nova') === 'true') {
      setTimeout(() => {
        openNovaFormacao();
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 300);
    }
  } catch (error) {
    console.error('Erro ao inicializar:', error);
    showToast('Erro ao carregar dados. Por favor recarregue a página.', 'danger');
  } finally {
    hideLoadingState();
  }
});

async function loadInitialData() {
  // Carregar em paralelo para melhor performance
  const [formacoes, colaboradores, departamentos, formadores, entidades] = await Promise.all([
    DataService.getFormacoes(),
    DataService.getColaboradores(),
    DataService.getDepartamentos(),
    DataService.getFormadores(),
    DataService.getEntidadesFormadoras()
  ]);
  
  formacoesCache = transformFormacoes(formacoes);
  colaboradoresCache = colaboradores;
  departamentosCache = departamentos;
  formadoresCache = formadores;
  entidadesCache = entidades;
  
  // Obter ID do utilizador atual
  const currentUser = colaboradores.find(c => c.email === CURRENT_USER_EMAIL);
  if (currentUser) {
    currentUserId = currentUser.id;
  }
  
  console.log('[Formação] Dados carregados:', {
    formacoes: formacoesCache.length,
    colaboradores: colaboradoresCache.length,
    departamentos: departamentosCache.length,
    formadores: formadoresCache.length
  });
}

// Transforma dados do Supabase para formato compatível com a UI
function transformFormacoes(formacoes) {
  return formacoes.map(f => {
    // Extrair sessões
    const sessoes = (f.formacao_sessoes || []).map(s => ({
      data: s.data,
      horaInicio: s.hora_inicio,
      horaFim: s.hora_fim
    }));
    
    // Extrair inscrições ativas
    const inscricoes = (f.formacao_inscricoes || [])
      .filter(i => i.estado === 'Inscrito')
      .map(i => i.colaborador_id);
    
    // Extrair presenças
    const presencas = {};
    (f.formacao_presencas || []).forEach(p => {
      presencas[p.colaborador_id] = p.presente;
    });
    
    // Extrair resultados
    const resultados = {};
    (f.formacao_resultados || []).forEach(r => {
      resultados[r.colaborador_id] = r.resultado;
    });
    
    // Extrair avaliações
    const avaliacoes = (f.formacao_avaliacoes || []).map(a => ({
      odId: a.colaborador_id,
      conteudo: a.score_conteudo,
      formador: a.score_formador,
      organizacao: a.score_organizacao,
      comentario: a.comentario,
      data: a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : null
    }));
    
    // Extrair favoritos
    const favoritos = (f.formacao_favoritos || []).map(fav => fav.colaborador_id);
    
    // Extrair departamentos alvo
    const departamentosAlvo = (f.formacao_departamentos || [])
      .map(fd => fd.departamentos?.codigo || fd.departamento_id);
    
    return {
      id: f.id,
      titulo: f.titulo,
      tipo: f.tipo,
      entidade: f.entidades_formadoras?.nome || 'Interno',
      entidadeId: f.entidade_id,
      formadorId: f.formador_id,
      formador: f.formadores?.nome || '-',
      objetivo: f.objetivo || '',
      conteudos: f.conteudos || '',
      departamentosAlvo,
      duracao: f.duracao_horas || 0,
      sessoes,
      localTipo: f.local_tipo || 'Presencial',
      localDetalhe: f.local_detalhe || '',
      modalidade: f.modalidade || 'Opcional',
      minParticipantes: f.min_participantes || 1,
      maxParticipantes: f.max_participantes || 20,
      custoParticipante: parseFloat(f.custo_participante) || 0,
      custoTotal: parseFloat(f.custo_total) || 0,
      justificacao: f.justificacao || '',
      preRequisitos: f.pre_requisitos || '',
      materiais: f.materiais || '',
      estado: f.estado || 'Rascunho',
      dataLimiteInscricao: f.data_limite_inscricao,
      inscritos: inscricoes,
      presencas,
      resultados,
      avaliacoes,
      favoritos
    };
  });
}

function showLoadingState() {
  const grid = document.getElementById('formacoesGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 1rem; color: var(--text-secondary);">A carregar formações...</p>
      </div>
    `;
  }
}

function hideLoadingState() {
  // O render vai substituir o loading
}

// ==========================================
// INITIALIZATION HELPERS
// ==========================================

function initializeFormadores() {
  const select = document.getElementById('formFormador');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecionar...</option>';
  formadoresCache.forEach(f => {
    const option = document.createElement('option');
    option.value = f.id;
    option.textContent = `${f.nome} (${f.especialidade || f.tipo})`;
    select.appendChild(option);
  });
}

function initializeDepartamentos() {
  const container = document.getElementById('departamentosCheckboxes');
  if (!container) return;
  
  container.innerHTML = departamentosCache.map(d => `
    <label class="checkbox-item">
      <input type="checkbox" name="departamentos" value="${d.id}" data-codigo="${d.codigo}">
      <span>${d.nome}</span>
    </label>
  `).join('');
}

function initializeEntidades() {
  const select = document.getElementById('formEntidade');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecionar ou criar nova...</option>';
  entidadesCache.forEach(e => {
    const option = document.createElement('option');
    option.value = e.id;
    option.textContent = e.nome;
    select.appendChild(option);
  });
  
  // Adicionar opção "Outra"
  const outraOption = document.createElement('option');
  outraOption.value = 'outro';
  outraOption.textContent = '+ Outra (especificar)';
  select.appendChild(outraOption);
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

async function updateStats() {
  const stats = {
    agendadas: 0,
    inscritos: 0,
    concluidas: 0,
    avaliacoesPendentes: 0
  };
  
  formacoesCache.forEach(f => {
    if (f.estado === 'Agendada' || f.estado === 'Em Curso') stats.agendadas++;
    if (f.estado === 'Concluída') stats.concluidas++;
    stats.inscritos += f.inscritos.length;
    
    if (currentUserId) {
      const estaInscrito = f.inscritos.includes(currentUserId);
      const jaAvaliou = f.avaliacoes.some(a => a.odId === currentUserId);
      if (f.estado === 'Concluída' && estaInscrito && !jaAvaliou) {
        stats.avaliacoesPendentes++;
      }
    }
  });
  
  animateCounter('statAgendadas', stats.agendadas);
  animateCounter('statInscritos', stats.inscritos);
  animateCounter('statConcluidas', stats.concluidas);
  animateCounter('statAvaliacoes', stats.avaliacoesPendentes);
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
  
  return formacoesCache.filter(f => {
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
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
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
    const isFavorite = currentUserId && f.favoritos.includes(currentUserId);
    const isInscrito = currentUserId && f.inscritos.includes(currentUserId);
    const proximaSessao = getProximaSessao(f);
    
    let vagasClass = '';
    if (vagasPercent >= 90) vagasClass = 'full';
    else if (vagasPercent >= 70) vagasClass = 'almost-full';
    
    let actionButton = '';
    if (f.estado === 'Agendada' && !isInscrito && vagas > 0) {
      actionButton = `<button class="formacao-card-action" onclick="event.stopPropagation(); openInscricao('${f.id}')">Inscrever</button>`;
    } else if (f.estado === 'Agendada' && isInscrito) {
      actionButton = `<button class="formacao-card-action" style="background: var(--success)" onclick="event.stopPropagation();">Inscrito ✓</button>`;
    } else if (f.estado === 'Concluída' && isInscrito && !f.avaliacoes.find(a => a.odId === currentUserId)) {
      actionButton = `<button class="formacao-card-action" style="background: var(--warning)" onclick="event.stopPropagation(); openAvaliacao('${f.id}')">Avaliar</button>`;
    } else {
      actionButton = `<button class="formacao-card-action" onclick="event.stopPropagation(); openDetalhes('${f.id}')">Ver mais</button>`;
    }
    
    return `
      <div class="formacao-card" onclick="openDetalhes('${f.id}')" style="animation-delay: ${index * 0.1}s">
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
          
          <button class="formacao-card-favorite ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorito('${f.id}')">
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
      <div class="table-grid table-grid-formacao" style="cursor: pointer; animation-delay: ${index * 0.05}s" onclick="openDetalhes('${f.id}')">
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
  
  switchTab('info');
  document.querySelectorAll('input[name="departamentos"]').forEach(cb => cb.checked = false);
  
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
  document.querySelectorAll('.form-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.form-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  });
}

function onTipoChange() {
  const tipo = document.getElementById('formTipo').value;
  const entidadeSelect = document.getElementById('formEntidade');
  
  if (tipo === 'Interna') {
    // Selecionar "Interno" se existir
    const internoOption = Array.from(entidadeSelect.options).find(o => o.textContent.toLowerCase().includes('interno'));
    if (internoOption) {
      entidadeSelect.value = internoOption.value;
    }
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

async function handleSubmitFormacao(event) {
  event.preventDefault();
  
  try {
    const formData = collectFormData();
    formData.estado = 'Pendente Aprovação';
    formData.criado_por = currentUserId;
    
    // Criar no Supabase
    await DataService.createFormacao(formData);
    
    // Recarregar dados
    const formacoes = await DataService.getFormacoes();
    formacoesCache = transformFormacoes(formacoes);
    
    renderFormacoes();
    updateStats();
    closeModalFormacao();
    showToast('Formação submetida para aprovação!', 'success');
  } catch (error) {
    console.error('Erro ao submeter formação:', error);
    showToast('Erro ao submeter formação. Tente novamente.', 'danger');
  }
}

async function saveFormacaoRascunho() {
  try {
    const formData = collectFormData();
    formData.estado = 'Rascunho';
    formData.criado_por = currentUserId;
    
    await DataService.createFormacao(formData);
    
    const formacoes = await DataService.getFormacoes();
    formacoesCache = transformFormacoes(formacoes);
    
    renderFormacoes();
    updateStats();
    closeModalFormacao();
    showToast('Rascunho guardado!', 'warning');
  } catch (error) {
    console.error('Erro ao guardar rascunho:', error);
    showToast('Erro ao guardar rascunho. Tente novamente.', 'danger');
  }
}

function collectFormData() {
  const formadorId = document.getElementById('formFormador').value;
  const formador = formadoresCache.find(f => f.id === formadorId);
  
  let entidadeId = document.getElementById('formEntidade').value;
  if (entidadeId === 'outro') {
    entidadeId = null; // Seria necessário criar a entidade primeiro
  }
  
  const departamentos_alvo = [];
  document.querySelectorAll('input[name="departamentos"]:checked').forEach(cb => {
    departamentos_alvo.push(cb.value);
  });
  
  return {
    titulo: document.getElementById('formTitulo').value,
    tipo: document.getElementById('formTipo').value,
    entidade_id: entidadeId || null,
    formador_id: formadorId || null,
    objetivo: document.getElementById('formObjetivo').value,
    conteudos: document.getElementById('formConteudos').value,
    departamentos_alvo,
    duracao_horas: parseInt(document.getElementById('formDuracao').value) || 0,
    sessoes: collectSessoes(),
    local_tipo: document.getElementById('formLocalTipo').value,
    local_detalhe: document.getElementById('formLocalDetalhe').value,
    modalidade: document.getElementById('formModalidade').value,
    min_participantes: parseInt(document.getElementById('formMinParticipantes').value) || 1,
    max_participantes: parseInt(document.getElementById('formMaxParticipantes').value) || 20,
    custo_participante: parseFloat(document.getElementById('formCustoParticipante').value) || 0,
    custo_total: parseFloat(document.getElementById('formCustoTotal').value) || 0,
    justificacao: document.getElementById('formJustificacao').value,
    pre_requisitos: document.getElementById('formPreRequisitos')?.value || '',
    materiais: document.getElementById('formMateriais')?.value || '',
    data_limite_inscricao: document.getElementById('formDataLimite').value || null
  };
}

// ==========================================
// MODAL: DETALHES
// ==========================================

function openDetalhes(id) {
  const formacao = formacoesCache.find(f => f.id === id);
  if (!formacao) return;
  
  currentFormacaoId = id;
  
  // Header
  document.getElementById('detalhesTipo').textContent = formacao.tipo;
  document.getElementById('detalhesTitulo').textContent = formacao.titulo;
  document.getElementById('detalhesFormador').textContent = formacao.formador;
  
  const header = document.getElementById('modalDetalhesHeader');
  header.style.background = formacao.tipo === 'Externa' ? 'var(--gradient-formacao-2)' : 'var(--gradient-formacao-1)';
  
  // Info tab
  document.getElementById('detalhesObjetivo').textContent = formacao.objetivo || '-';
  document.getElementById('detalhesConteudos').innerHTML = (formacao.conteudos || '-').replace(/\n/g, '<br>');
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
        <div class="sessao-list-time">${s.horaInicio || '09:00'} - ${s.horaFim || '17:00'}</div>
      </div>
    </div>
  `).join('') || '<p style="color: var(--text-muted);">Sem sessões definidas</p>';
  
  // Actions
  const actionsContainer = document.getElementById('detalhesActions');
  const isInscrito = currentUserId && formacao.inscritos.includes(currentUserId);
  const vagas = formacao.maxParticipantes - formacao.inscritos.length;
  
  let actionsHTML = '';
  
  if (formacao.estado === 'Agendada') {
    if (!isInscrito && vagas > 0) {
      actionsHTML += `<button class="btn btn-primary" onclick="openInscricao('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>Inscrever-me</button>`;
    } else if (isInscrito) {
      actionsHTML += `<button class="btn btn-secondary" onclick="cancelarInscricao('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>Cancelar Inscrição</button>`;
    }
  } else if (formacao.estado === 'Concluída' && isInscrito) {
    if (!formacao.avaliacoes.find(a => a.odId === currentUserId)) {
      actionsHTML += `<button class="btn btn-primary" onclick="openAvaliacao('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Avaliar Formação</button>`;
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
  document.querySelectorAll('.detalhes-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
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
    const colab = colaboradoresCache.find(c => c.id === colabId);
    if (!colab) return '';
    
    const presenca = formacao.presencas[colabId];
    const resultado = formacao.resultados[colabId];
    const initials = colab.nome.split(' ').map(n => n[0]).join('').substring(0, 2);
    const depNome = colab.departamentos?.nome || 'N/D';
    
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
        <div>${depNome}</div>
        <div>${new Date().toLocaleDateString('pt-PT')}</div>
        <div>${presencaBadge}</div>
        <div>${resultadoBadge}</div>
        <div class="participante-actions">
          <button class="participante-action-btn" title="Marcar presença" onclick="togglePresenca('${formacao.id}', '${colabId}')">
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
  
  const avgConteudo = formacao.avaliacoes.reduce((sum, a) => sum + (a.conteudo || 0), 0) / formacao.avaliacoes.length;
  const avgFormador = formacao.avaliacoes.reduce((sum, a) => sum + (a.formador || 0), 0) / formacao.avaliacoes.length;
  const avgOrganizacao = formacao.avaliacoes.reduce((sum, a) => sum + (a.organizacao || 0), 0) / formacao.avaliacoes.length;
  const avgGlobal = (avgConteudo + avgFormador + avgOrganizacao) / 3;
  
  updateScoreCircle('scoreConteudo', avgConteudo / 5 * 100);
  updateScoreCircle('scoreFormador', avgFormador / 5 * 100);
  updateScoreCircle('scoreOrganizacao', avgOrganizacao / 5 * 100);
  updateScoreCircle('scoreGlobal', avgGlobal / 5 * 100);
  
  document.getElementById('scoreConteudoValue').textContent = avgConteudo.toFixed(1);
  document.getElementById('scoreFormadorValue').textContent = avgFormador.toFixed(1);
  document.getElementById('scoreOrganizacaoValue').textContent = avgOrganizacao.toFixed(1);
  document.getElementById('scoreGlobalValue').textContent = avgGlobal.toFixed(1);
  
  container.innerHTML = formacao.avaliacoes.map(av => {
    const colab = colaboradoresCache.find(c => c.id === av.odId);
    const initials = colab ? colab.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';
    const avgStar = ((av.conteudo || 0) + (av.formador || 0) + (av.organizacao || 0)) / 3;
    const stars = '★'.repeat(Math.round(avgStar)) + '☆'.repeat(5 - Math.round(avgStar));
    
    return `
      <div class="avaliacao-item">
        <div class="avaliacao-item-header">
          <div class="avaliacao-item-user">
            <div class="avaliacao-item-avatar">${initials}</div>
            <div>
              <div class="avaliacao-item-name">${colab?.nome || 'Anónimo'}</div>
              <div class="avaliacao-item-date">${av.data || '-'}</div>
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

async function togglePresenca(formacaoId, colabId) {
  const formacao = formacoesCache.find(f => f.id === formacaoId);
  if (!formacao) return;
  
  const novoEstado = formacao.presencas[colabId] !== true;
  
  try {
    await DataService.registarPresenca(formacaoId, colabId, novoEstado);
    
    // Atualizar cache local
    formacao.presencas[colabId] = novoEstado;
    renderParticipantes(formacao);
    showToast(novoEstado ? 'Presença registada!' : 'Presença removida', 'success');
  } catch (error) {
    console.error('Erro ao registar presença:', error);
    showToast('Erro ao registar presença', 'danger');
  }
}

async function toggleFavorito(id) {
  if (!currentUserId) {
    showToast('Utilizador não identificado', 'warning');
    return;
  }
  
  const formacao = formacoesCache.find(f => f.id === id);
  if (!formacao) return;
  
  try {
    const isFavorito = await DataService.toggleFavoritoFormacao(id, currentUserId);
    
    // Atualizar cache local
    if (isFavorito) {
      formacao.favoritos.push(currentUserId);
      showToast('Adicionado aos favoritos!', 'success');
    } else {
      const index = formacao.favoritos.indexOf(currentUserId);
      if (index !== -1) formacao.favoritos.splice(index, 1);
      showToast('Removido dos favoritos', 'warning');
    }
    
    renderFormacoes();
  } catch (error) {
    console.error('Erro ao alterar favorito:', error);
    showToast('Erro ao alterar favorito', 'danger');
  }
}

// ==========================================
// MODAL: INSCRIÇÃO
// ==========================================

function openInscricao(id) {
  const formacao = formacoesCache.find(f => f.id === id);
  if (!formacao) return;
  
  currentFormacaoId = id;
  
  document.getElementById('inscricaoTitulo').textContent = formacao.titulo;
  document.getElementById('inscricaoData').textContent = getProximaSessao(formacao) || 'A definir';
  document.getElementById('inscricaoDuracao').textContent = `${formacao.duracao} horas`;
  document.getElementById('inscricaoLocal').textContent = `${formacao.localTipo} - ${formacao.localDetalhe}`;
  
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

async function confirmarInscricao() {
  if (!document.getElementById('inscricaoConfirm').checked) {
    showToast('Por favor confirme a sua disponibilidade', 'danger');
    return;
  }
  
  if (!currentUserId) {
    showToast('Utilizador não identificado', 'danger');
    return;
  }
  
  const formacao = formacoesCache.find(f => f.id === currentFormacaoId);
  if (!formacao) return;
  
  try {
    const observacoes = document.getElementById('inscricaoObservacoes').value;
    await DataService.inscreverFormacao(currentFormacaoId, currentUserId, observacoes);
    
    // Atualizar cache local
    if (!formacao.inscritos.includes(currentUserId)) {
      formacao.inscritos.push(currentUserId);
    }
    
    closeModalInscricao();
    renderFormacoes();
    updateStats();
    showToast('Inscrição confirmada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao inscrever:', error);
    showToast('Erro ao confirmar inscrição', 'danger');
  }
}

async function cancelarInscricao(id) {
  if (!currentUserId) {
    showToast('Utilizador não identificado', 'danger');
    return;
  }
  
  const formacao = formacoesCache.find(f => f.id === id);
  if (!formacao) return;
  
  try {
    await DataService.cancelarInscricaoFormacao(id, currentUserId);
    
    // Atualizar cache local
    const index = formacao.inscritos.indexOf(currentUserId);
    if (index !== -1) {
      formacao.inscritos.splice(index, 1);
    }
    
    closeModalDetalhes();
    renderFormacoes();
    updateStats();
    showToast('Inscrição cancelada', 'warning');
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    showToast('Erro ao cancelar inscrição', 'danger');
  }
}

// ==========================================
// MODAL: AVALIAÇÃO
// ==========================================

function openAvaliacao(id) {
  currentFormacaoId = id;
  currentRatings = { conteudo: 0, formador: 0, organizacao: 0 };
  
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

async function submitAvaliacao() {
  if (currentRatings.conteudo === 0 || currentRatings.formador === 0 || currentRatings.organizacao === 0) {
    showToast('Por favor avalie todas as categorias', 'danger');
    return;
  }
  
  if (!currentUserId) {
    showToast('Utilizador não identificado', 'danger');
    return;
  }
  
  const formacao = formacoesCache.find(f => f.id === currentFormacaoId);
  if (!formacao) return;
  
  try {
    const recomendariaEl = document.querySelector('input[name="recomendaria"]:checked');
    
    await DataService.submeterAvaliacao(currentFormacaoId, currentUserId, {
      conteudo: currentRatings.conteudo,
      formador: currentRatings.formador,
      organizacao: currentRatings.organizacao,
      comentario: document.getElementById('avaliacaoComentarios').value,
      recomendaria: recomendariaEl?.value || null
    });
    
    // Atualizar cache local
    formacao.avaliacoes.push({
      odId: currentUserId,
      conteudo: currentRatings.conteudo,
      formador: currentRatings.formador,
      organizacao: currentRatings.organizacao,
      comentario: document.getElementById('avaliacaoComentarios').value,
      data: new Date().toISOString().split('T')[0]
    });
    
    closeModalAvaliacao();
    renderFormacoes();
    updateStats();
    showToast('Obrigado pela sua avaliação!', 'success');
  } catch (error) {
    console.error('Erro ao submeter avaliação:', error);
    showToast('Erro ao submeter avaliação', 'danger');
  }
}

// ==========================================
// MODAL: HISTÓRICO
// ==========================================

function openMeuHistorico() {
  if (!currentUserId) {
    showToast('Utilizador não identificado', 'warning');
    return;
  }
  
  const minhasFormacoes = formacoesCache.filter(f => f.inscritos.includes(currentUserId));
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
  const pendentes = formacoesCache.filter(f => 
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
          <button class="btn btn-sm btn-primary" onclick="closeModalHistorico(); openInscricao('${f.id}')">Inscrever</button>
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
  
  const eventos = {};
  formacoesCache.forEach(f => {
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
  
  for (let i = 0; i < startDay; i++) {
    html += '<div class="calendario-day other-month"></div>';
  }
  
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
  formacoesCache.forEach(f => {
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
  
  closeModalCalendario();
  openDetalhes(eventos[0].id);
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
