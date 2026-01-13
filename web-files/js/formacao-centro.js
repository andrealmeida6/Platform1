// ===================================================================
// CENTRO DE FORMAÇÃO - JAVASCRIPT
// Página para colaboradores verem e se inscreverem em formações
// Integração com Supabase via DataService
// ===================================================================

// ==========================================
// STATE & VARIABLES
// ==========================================

let allFormacoes = [];
let myFormacoes = [];
let myPropostas = [];
let currentUser = null;
let selectedFormacao = null;
let formacaoCalendarDate = new Date();
let formacaoEvents = {};
let calendarExpanded = true;
let canViewInscritos = false;

const MONTH_NAMES_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// ==========================================
// INITIALIZATION
// ==========================================

async function waitForServices() {
  return new Promise((resolve) => {
    const check = () => {
      if (typeof DataService !== 'undefined' && typeof AuthService !== 'undefined') {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  try {
    await waitForServices();
    currentUser = await AuthService.getCurrentUser();
    console.log('[Formação] Utilizador:', currentUser?.nome);
    
    if (currentUser && AuthService.canAccessFormacaoManagement(currentUser)) {
      const btnGestao = document.getElementById('btnGestaoFormacoes');
      if (btnGestao) btnGestao.style.display = 'inline-flex';
      canViewInscritos = true;
    }
    
    await loadFormacoes();
    await loadMyPropostas();
    initFormacaoCalendar();
    
  } catch (error) {
    console.error('[Formação] Erro na inicialização:', error);
  }
});

// ==========================================
// DATA LOADING
// ==========================================

async function loadFormacoes() {
  try {
    allFormacoes = await DataService.getFormacoes();
    console.log('[Formação] Carregadas:', allFormacoes.length, 'formações');
    
    if (currentUser) {
      myFormacoes = allFormacoes.filter(f => 
        (f.formacao_inscricoes || []).some(i => i.colaborador_id === currentUser.id && i.estado === 'Inscrito')
      );
    }
    
    buildFormacaoEvents();
    updateStats();
    renderCatalog(allFormacoes);
    renderMyFormacoes(myFormacoes);
    renderFormacaoCalendar();
    
  } catch (error) {
    console.error('[Formação] Erro ao carregar:', error);
  }
}

async function loadMyPropostas() {
  if (!currentUser) return;
  
  try {
    myPropostas = await DataService.getMyPedidosFormacao(currentUser.id);
    console.log('[Propostas] Carregadas:', myPropostas.length, 'propostas');
    
    const section = document.getElementById('minhasPropostas');
    if (section) {
      if (myPropostas.length > 0) {
        section.style.display = 'block';
        renderMyPropostas(myPropostas);
      } else {
        section.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('[Propostas] Erro ao carregar:', error);
  }
}

// ==========================================
// STATISTICS
// ==========================================

function updateStats() {
  const agendadas = allFormacoes.filter(f => f.estado === 'Agendada' || f.estado === 'Em Curso').length;
  
  if (currentUser) {
    const concluidas = myFormacoes.filter(f => f.estado === 'Concluída').length;
    const emCurso = myFormacoes.filter(f => f.estado === 'Em Curso' || f.estado === 'Agendada').length;
    const pendentes = myFormacoes.filter(f => {
      const jaAvaliou = (f.formacao_avaliacoes || []).some(a => a.colaborador_id === currentUser?.id);
      return f.estado === 'Concluída' && !jaAvaliou;
    }).length;
    
    setStatValue('statConcluidas', concluidas);
    setStatValue('statEmCurso', emCurso);
    setStatValue('statPendentes', pendentes);
    setStatValue('statAgendadas', agendadas);
  }
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ==========================================
// HELPERS
// ==========================================

function isFormadorOf(formacao, userId) {
  if (!formacao || !userId) return false;
  if (formacao.formacao_formadores && formacao.formacao_formadores.length > 0) {
    return formacao.formacao_formadores.some(ff => ff.formadores?.colaborador_id === userId);
  }
  return formacao.formadores?.colaborador_id === userId;
}

function canSeeInscritos(formacao) {
  if (!currentUser) return false;
  if (canViewInscritos) return true;
  return isFormadorOf(formacao, currentUser.id);
}

function getCategoriaClass(titulo) {
  titulo = (titulo || '').toLowerCase();
  if (titulo.includes('excel') || titulo.includes('power') || titulo.includes('python')) return 'tech';
  if (titulo.includes('liderança') || titulo.includes('gestão')) return 'leadership';
  if (titulo.includes('comunicação') || titulo.includes('soft')) return 'soft';
  if (titulo.includes('segurança') || titulo.includes('compliance')) return 'compliance';
  return 'tech';
}

function getCategoriaIcon(categoria) {
  const icons = {
    tech: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    leadership: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    soft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    compliance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  };
  return icons[categoria] || icons.tech;
}

function formatDate(dateStr) {
  if (!dateStr) return 'A definir';
  return new Date(dateStr).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

function isNew(createdAt) {
  if (!createdAt) return false;
  const diffDays = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  return diffDays < 30;
}

function getEstadoClass(estado) {
  const classes = {
    'Agendada': 'status-scheduled',
    'Em Curso': 'status-progress',
    'Concluída': 'status-complete',
    'Cancelada': 'status-cancelled'
  };
  return classes[estado] || '';
}

// ==========================================
// CATALOG RENDERING
// ==========================================

function renderCatalog(formacoes) {
  const grid = document.getElementById('courseGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;
  
  const disponiveis = formacoes.filter(f => f.estado === 'Agendada' || f.estado === 'Em Curso');
  
  if (disponiveis.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  
  grid.innerHTML = disponiveis.map(f => {
    const categoria = getCategoriaClass(f.titulo);
    let formadorDisplay = getFormadorDisplay(f);
    
    const inscritos = (f.formacao_inscricoes || []).filter(i => i.estado === 'Inscrito').length;
    const vagas = f.max_participantes || 20;
    const jaInscrito = currentUser && (f.formacao_inscricoes || []).some(i => i.colaborador_id === currentUser.id && i.estado === 'Inscrito');
    const favorito = currentUser && (f.formacao_favoritos || []).some(fav => fav.colaborador_id === currentUser.id);
    
    const primeiraSessao = (f.formacao_sessoes || []).sort((a, b) => new Date(a.data) - new Date(b.data))[0];
    const dataInicio = primeiraSessao ? formatDate(primeiraSessao.data) : 'A definir';
    
    let badges = '';
    if (f.modalidade === 'Obrigatória') badges += '<span class="course-badge mandatory">Obrigatória</span>';
    if (isNew(f.created_at)) badges += '<span class="course-badge new">Nova</span>';
    
    const showInscritos = canSeeInscritos(f);
    const inscritosDisplay = showInscritos ? `${inscritos}/${vagas}` : `${vagas} vagas`;
    
    return `
      <div class="course-card" onclick="openCourseDetails('${f.id}')">
        <div class="course-card-banner ${categoria}">
          ${getCategoriaIcon(categoria)}
          <div class="course-card-badges">${badges}</div>
          <button class="course-card-favorite ${favorito ? 'active' : ''}" onclick="toggleFavorite(event, '${f.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="course-card-body">
          <span class="course-card-category">${f.tipo || 'Formação'}</span>
          <h3 class="course-card-title">${f.titulo}</h3>
          <p class="course-card-instructor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${formadorDisplay}
          </p>
          <div class="course-card-meta">
            <span class="course-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${f.duracao_horas || 0}h
            </span>
            <span class="course-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              ${inscritosDisplay}
            </span>
          </div>
          <div class="course-card-footer">
            <span class="course-card-date"><strong>${dataInicio}</strong></span>
            ${jaInscrito 
              ? '<button class="course-card-cta enrolled">Inscrito</button>'
              : inscritos >= vagas
                ? '<button class="course-card-cta full">Esgotado</button>'
                : '<button class="course-card-cta enroll">Inscrever</button>'
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getFormadorDisplay(f) {
  if (f.formacao_formadores && f.formacao_formadores.length > 0) {
    const nomes = f.formacao_formadores.map(ff => {
      if (ff.formadores?.nome) return DataService.cleanFormadorName(ff.formadores.nome);
      if (ff.entidades_formadoras?.nome) return ff.entidades_formadoras.nome;
      return null;
    }).filter(Boolean);
    if (nomes.length > 0) return nomes.join(', ');
  }
  if (f.formadores?.nome) return DataService.cleanFormadorName(f.formadores.nome);
  return 'Formador interno';
}

function filterCourses() {
  const search = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  const tipo = document.getElementById('filterTipo')?.value || '';
  const modalidade = document.getElementById('filterModalidade')?.value || '';
  
  let filtered = allFormacoes;
  if (search) filtered = filtered.filter(f => f.titulo.toLowerCase().includes(search));
  if (tipo) filtered = filtered.filter(f => f.tipo === tipo);
  if (modalidade) filtered = filtered.filter(f => f.modalidade === modalidade);
  
  renderCatalog(filtered);
}

// ==========================================
// MY FORMAÇÕES TABLE
// ==========================================

function renderMyFormacoes(formacoes) {
  const tbody = document.getElementById('myFormacoesTable');
  if (!tbody) return;
  
  if (!currentUser) {
    tbody.innerHTML = '<div class="table-empty"><p>Faça login para ver as suas formações.</p></div>';
    return;
  }
  
  if (formacoes.length === 0) {
    tbody.innerHTML = `
      <div class="table-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
        <p>Ainda não está inscrito em nenhuma formação.</p>
        <button class="btn btn-primary" onclick="scrollToCatalog()">Explorar Catálogo</button>
      </div>
    `;
    return;
  }
  
  tbody.innerHTML = formacoes.map(f => {
    const formadorDisplay = getFormadorDisplay(f);
    const sessoes = (f.formacao_sessoes || []).sort((a, b) => new Date(a.data) - new Date(b.data));
    const dataStr = sessoes[0] ? formatDate(sessoes[0].data) : 'A definir';
    
    let progresso = 0, progressoClass = '';
    if (f.estado === 'Concluída') { progresso = 100; progressoClass = 'complete'; }
    else if (f.estado === 'Em Curso') { progresso = 50; progressoClass = 'in-progress'; }
    
    return `
      <div class="formacoes-table-row" onclick="openCourseDetails('${f.id}')">
        <div class="formacao-title-cell">
          <strong>${f.titulo}</strong>
          ${f.modalidade === 'Obrigatória' ? '<span class="badge-mandatory">Obrigatória</span>' : ''}
        </div>
        <div>${f.tipo || '-'}</div>
        <div>${formadorDisplay}</div>
        <div>${dataStr}</div>
        <div>${f.duracao_horas || 0}h</div>
        <div>
          <div class="progress-mini"><div class="progress-mini-bar ${progressoClass}" style="width: ${progresso}%"></div></div>
          <span class="progress-text">${progresso}%</span>
        </div>
        <div><span class="status-badge ${getEstadoClass(f.estado)}">${f.estado}</span></div>
        <div>
          <button class="btn-action" onclick="event.stopPropagation(); openCourseDetails('${f.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterMyFormacoes(filter) {
  document.querySelectorAll('[data-filter]').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
  
  let filtered = myFormacoes;
  if (filter === 'enrolled') filtered = myFormacoes.filter(f => f.estado === 'Agendada' || f.estado === 'Em Curso');
  else if (filter === 'completed') filtered = myFormacoes.filter(f => f.estado === 'Concluída');
  
  renderMyFormacoes(filtered);
}

function searchMyFormacoes() {
  const term = document.getElementById('searchMyFormacoes')?.value?.toLowerCase() || '';
  const filtered = myFormacoes.filter(f => f.titulo.toLowerCase().includes(term));
  renderMyFormacoes(filtered);
}

// ==========================================
// MY PROPOSTAS (PEDIDOS DE FORMAÇÃO)
// ==========================================

function renderMyPropostas(propostas) {
  const tbody = document.getElementById('myPropostasTable');
  if (!tbody) return;
  
  if (propostas.length === 0) {
    tbody.innerHTML = `
      <div class="table-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Ainda não submeteu nenhuma proposta de formação.</p>
        <button class="btn btn-primary" onclick="openModalProporFormacao()">Propor Formação</button>
      </div>
    `;
    return;
  }
  
  tbody.innerHTML = propostas.map(p => {
    const estadoClass = getEstadoPedidoClass(p.estado);
    const estadoLabel = getEstadoPedidoLabel(p.estado);
    const dataPedido = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-PT') : '-';
    const custo = p.custo_estimado ? `${parseFloat(p.custo_estimado).toFixed(2)}€` : '-';
    const duracao = p.duracao_horas ? `${p.duracao_horas}h` : '-';
    
    return `
      <div class="propostas-table-row" data-estado="${p.estado}">
        <div class="proposta-title-cell">
          <strong>${p.titulo}</strong>
          ${p.modalidade === 'Obrigatória' ? '<span class="badge-mandatory">Obrigatória</span>' : ''}
        </div>
        <div>${p.tipo || '-'}</div>
        <div>${p.entidade_formadora || '-'}</div>
        <div>${duracao}</div>
        <div>${custo}</div>
        <div>${dataPedido}</div>
        <div><span class="status-badge ${estadoClass}">${estadoLabel}</span></div>
        <div>
          <button class="btn-action" onclick="verDetalhesProposta('${p.id}')" title="Ver detalhes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterMyPropostas(filter) {
  document.querySelectorAll('[data-filter-propostas]').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-filter-propostas="${filter}"]`)?.classList.add('active');
  
  let filtered = myPropostas;
  if (filter === 'pendente') filtered = myPropostas.filter(p => ['pendente_dirigente', 'pendente_rh', 'devolvido'].includes(p.estado));
  else if (filter === 'aprovado') filtered = myPropostas.filter(p => p.estado === 'aprovado');
  else if (filter === 'rejeitado') filtered = myPropostas.filter(p => p.estado === 'rejeitado');
  
  renderMyPropostas(filtered);
}

function getEstadoPedidoClass(estado) {
  const classes = {
    'pendente_dirigente': 'status-pending',
    'pendente_rh': 'status-pending-rh',
    'aprovado': 'status-approved',
    'rejeitado': 'status-rejected',
    'devolvido': 'status-returned'
  };
  return classes[estado] || 'status-pending';
}

function getEstadoPedidoLabel(estado) {
  const labels = {
    'pendente_dirigente': 'Pendente Dirigente',
    'pendente_rh': 'Pendente RH',
    'aprovado': 'Aprovado',
    'rejeitado': 'Rejeitado',
    'devolvido': 'Devolvido'
  };
  return labels[estado] || estado;
}

function verDetalhesProposta(propostaId) {
  const proposta = myPropostas.find(p => p.id === propostaId);
  if (!proposta) return;
  
  const estadoClass = getEstadoPedidoClass(proposta.estado);
  const estadoLabel = getEstadoPedidoLabel(proposta.estado);
  const dataPedido = proposta.created_at ? new Date(proposta.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  
  let historicoHtml = '';
  if (proposta.pedidos_formacao_historico?.length > 0) {
    const historico = proposta.pedidos_formacao_historico.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    historicoHtml = `
      <div style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
        <h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem;">Histórico do Pedido</h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${historico.map(h => `
            <div style="display: flex; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
              <div style="width: 8px; height: 8px; background: #00b276; border-radius: 50%; margin-top: 6px; flex-shrink: 0;"></div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1e293b; font-size: 0.875rem;">${h.acao}</div>
                ${h.comentario ? `<div style="color: #64748b; font-size: 0.8rem; margin-top: 0.25rem;">${h.comentario}</div>` : ''}
                <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem;">
                  ${h.user_nome || 'Sistema'} • ${new Date(h.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  document.getElementById('modalPropostaTitulo').textContent = proposta.titulo;
  document.getElementById('modalPropostaContent').innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <span class="status-badge ${estadoClass}" style="font-size: 0.8rem; padding: 0.5rem 1rem;">${estadoLabel}</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">
      <div><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Tipo</div><div style="color: #1e293b;">${proposta.tipo || '-'}</div></div>
      <div><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Modalidade</div><div style="color: #1e293b;">${proposta.modalidade || '-'}</div></div>
      <div><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Entidade Formadora</div><div style="color: #1e293b;">${proposta.entidade_formadora || '-'}</div></div>
      <div><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Duração</div><div style="color: #1e293b;">${proposta.duracao_horas ? proposta.duracao_horas + ' horas' : '-'}</div></div>
      <div><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Custo Estimado</div><div style="color: #1e293b;">${proposta.custo_estimado ? parseFloat(proposta.custo_estimado).toFixed(2) + '€' : '-'}</div></div>
      <div><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Data do Pedido</div><div style="color: #1e293b;">${dataPedido}</div></div>
    </div>
    ${proposta.objetivo ? `<div style="margin-bottom: 1.25rem;"><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">Objetivo</div><div style="color: #475569; line-height: 1.6; background: #f8fafc; padding: 1rem; border-radius: 8px;">${proposta.objetivo}</div></div>` : ''}
    <div style="margin-bottom: 1.25rem;"><div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">Justificação</div><div style="color: #475569; line-height: 1.6; background: #f8fafc; padding: 1rem; border-radius: 8px;">${proposta.justificacao || '-'}</div></div>
    ${proposta.dirigente_comentario ? `<div style="margin-bottom: 1.25rem; padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;"><div style="font-size: 0.75rem; font-weight: 600; color: #92400e; margin-bottom: 0.5rem;">Comentário do Dirigente</div><div style="color: #78350f;">${proposta.dirigente_comentario}</div></div>` : ''}
    ${proposta.rh_comentario ? `<div style="margin-bottom: 1.25rem; padding: 1rem; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;"><div style="font-size: 0.75rem; font-weight: 600; color: #1e40af; margin-bottom: 0.5rem;">Comentário RH</div><div style="color: #1e3a8a;">${proposta.rh_comentario}</div></div>` : ''}
    ${historicoHtml}
  `;
  
  document.getElementById('modalDetalhesProposta').classList.add('show');
}

// ==========================================
// PROPOR FORMAÇÃO
// ==========================================

function openModalProporFormacao() {
  if (!currentUser) {
    showToast('É necessário estar autenticado para propor uma formação.', 'error');
    return;
  }
  
  const form = document.getElementById('formProporFormacao');
  if (form) form.reset();
  
  const fileText = document.getElementById('fileUploadText');
  const fileArea = document.getElementById('fileUploadArea');
  if (fileText) fileText.textContent = 'Clique para carregar documento (PDF, DOC, DOCX)';
  if (fileArea) fileArea.style.borderColor = '#e2e8f0';
  
  document.getElementById('modalProporFormacao')?.classList.add('show');
}

function handlePedidoFileSelect(input) {
  const file = input.files[0];
  const fileText = document.getElementById('fileUploadText');
  const fileArea = document.getElementById('fileUploadArea');
  
  if (file) {
    if (fileText) fileText.textContent = file.name;
    if (fileArea) fileArea.style.borderColor = '#00b276';
  } else {
    if (fileText) fileText.textContent = 'Clique para carregar documento (PDF, DOC, DOCX)';
    if (fileArea) fileArea.style.borderColor = '#e2e8f0';
  }
}

async function submeterPedidoFormacao() {
  if (!currentUser) {
    showToast('É necessário estar autenticado.', 'error');
    return;
  }
  
  const titulo = document.getElementById('pedidoTitulo')?.value?.trim();
  const tipo = document.getElementById('pedidoTipo')?.value;
  const modalidade = document.getElementById('pedidoModalidade')?.value;
  const entidade = document.getElementById('pedidoEntidade')?.value?.trim();
  const duracao = document.getElementById('pedidoDuracao')?.value;
  const dataInicio = document.getElementById('pedidoDataInicio')?.value;
  const custo = document.getElementById('pedidoCusto')?.value;
  const objetivo = document.getElementById('pedidoObjetivo')?.value?.trim();
  const justificacao = document.getElementById('pedidoJustificacao')?.value?.trim();
  
  if (!titulo || !entidade || !justificacao) {
    showToast('Preencha os campos obrigatórios.', 'error');
    return;
  }
  
  try {
    const pedido = {
      titulo, tipo, modalidade,
      entidade_formadora: entidade,
      duracao_horas: duracao ? parseInt(duracao) : null,
      data_prevista_inicio: dataInicio || null,
      custo_estimado: custo ? parseFloat(custo) : null,
      objetivo, justificacao,
      solicitante_id: currentUser.id,
      departamento_id: currentUser.departamento_id,
      estado: 'pendente_dirigente'
    };
    
    const result = await DataService.createPedidoFormacao(pedido);
    
    await DataService.addHistoricoPedido(
      result.id, 'Pedido submetido', currentUser.id, currentUser.nome,
      'Pedido criado e submetido para aprovação do dirigente.', null, 'pendente_dirigente'
    );
    
    closeModal('modalProporFormacao');
    showToast('Pedido de formação submetido com sucesso! Aguarde aprovação.', 'success');
    await loadMyPropostas();
    
  } catch (error) {
    console.error('Erro ao submeter pedido:', error);
    showToast('Erro ao submeter pedido. Tente novamente.', 'error');
  }
}

// ==========================================
// CALENDAR
// ==========================================

function buildFormacaoEvents() {
  formacaoEvents = {};
  allFormacoes.forEach(f => {
    (f.formacao_sessoes || []).forEach(s => {
      if (s.data) {
        const dateKey = s.data.split('T')[0];
        if (!formacaoEvents[dateKey]) formacaoEvents[dateKey] = [];
        formacaoEvents[dateKey].push({
          formacaoId: f.id,
          titulo: f.titulo,
          hora: s.hora_inicio || '09:00',
          tipo: f.tipo,
          estado: f.estado
        });
      }
    });
  });
}

function initFormacaoCalendar() {
  document.getElementById('formacaoPrevMonth')?.addEventListener('click', () => {
    formacaoCalendarDate.setMonth(formacaoCalendarDate.getMonth() - 1);
    renderFormacaoCalendar();
  });
  
  document.getElementById('formacaoNextMonth')?.addEventListener('click', () => {
    formacaoCalendarDate.setMonth(formacaoCalendarDate.getMonth() + 1);
    renderFormacaoCalendar();
  });
  
  document.getElementById('formacaoClearFilterBtn')?.addEventListener('click', clearFormacaoDateFilter);
}

function toggleFormacaoCalendar() {
  const content = document.getElementById('formacaoCalendarContent');
  const btn = document.getElementById('calendarToggleBtn');
  if (!content || !btn) return;
  
  calendarExpanded = !calendarExpanded;
  
  if (calendarExpanded) {
    content.classList.add('expanded');
    btn.innerHTML = `<span class="toggle-label">Calendário de Formações</span><span class="toggle-separator">•</span><svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg><span class="toggle-action">Esconder</span>`;
  } else {
    content.classList.remove('expanded');
    btn.innerHTML = `<span class="toggle-label">Calendário de Formações</span><span class="toggle-separator">•</span><svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg><span class="toggle-action">Mostrar</span>`;
  }
}

function renderFormacaoCalendar() {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonth = formacaoCalendarDate.getMonth();
  const currentYear = formacaoCalendarDate.getFullYear();
  
  const el1 = document.getElementById('formacaoCurrentMonthName');
  if (el1) el1.textContent = `${months[currentMonth]} ${currentYear}`;
  renderFormacaoMonthDays('formacaoCurrentMonthGrid', currentYear, currentMonth);
  
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const el2 = document.getElementById('formacaoNextMonthName');
  if (el2) el2.textContent = `${months[nextMonth]} ${nextYear}`;
  renderFormacaoMonthDays('formacaoNextMonthGrid', nextYear, nextMonth);
  
  renderFormacaoUpcomingEvents();
}

function renderFormacaoMonthDays(containerId, year, month) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<p class="day-number other-month"></p>';
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEvents = formacaoEvents[dateStr]?.length > 0;
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    
    let classes = 'day-number';
    if (isToday) classes += ' today';
    if (hasEvents) classes += ' formacao';
    
    html += `<p class="${classes}" onclick="selectFormacaoDate('${dateStr}')" data-date="${dateStr}">${day}</p>`;
  }
  
  container.innerHTML = html;
}

function selectFormacaoDate(dateStr) {
  document.querySelectorAll('.calendar-grid .day-number.active').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`[data-date="${dateStr}"]`).forEach(el => el.classList.add('active'));
  
  const events = formacaoEvents[dateStr] || [];
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const titleEl = document.getElementById('formacaoEventsTitle');
  const infoEl = document.getElementById('formacaoSelectedDateInfo');
  const clearBtn = document.getElementById('formacaoClearFilterBtn');
  
  if (titleEl) titleEl.textContent = 'Formações em ' + formattedDate;
  if (infoEl) { infoEl.style.display = 'block'; infoEl.textContent = events.length > 0 ? `${events.length} formação(ões)` : 'Sem formações'; }
  if (clearBtn) clearBtn.style.display = 'flex';
  
  const container = document.getElementById('formacaoEventsContainer');
  if (!container) return;
  
  if (events.length === 0) {
    container.innerHTML = '<div class="no-events">Sem formações agendadas para este dia.</div>';
  } else {
    container.innerHTML = events.map(e => `
      <div class="event-item formacao" onclick="openCourseDetails('${e.formacaoId}')" style="--event-color: #00b276;">
        <div class="event-date"><div class="event-day">${dateObj.getDate()}</div><div class="event-month">${MONTH_NAMES_SHORT[dateObj.getMonth()]}</div></div>
        <div class="event-details"><div class="event-title">${e.titulo}</div><div class="event-meta">${e.hora} • ${e.tipo || 'Formação'}</div></div>
      </div>
    `).join('');
  }
}

function clearFormacaoDateFilter() {
  document.querySelectorAll('.calendar-grid .day-number.active').forEach(el => el.classList.remove('active'));
  const titleEl = document.getElementById('formacaoEventsTitle');
  const infoEl = document.getElementById('formacaoSelectedDateInfo');
  const clearBtn = document.getElementById('formacaoClearFilterBtn');
  
  if (titleEl) titleEl.textContent = 'Próximas Formações';
  if (infoEl) infoEl.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'none';
  
  renderFormacaoUpcomingEvents();
}

function renderFormacaoUpcomingEvents() {
  const container = document.getElementById('formacaoEventsContainer');
  if (!container) return;
  
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingEvents = [];
  
  Object.keys(formacaoEvents).sort().forEach(dateStr => {
    if (new Date(dateStr) >= today) {
      formacaoEvents[dateStr].forEach(e => upcomingEvents.push({ ...e, date: dateStr }));
    }
  });
  
  const eventsToShow = upcomingEvents.slice(0, 5);
  
  if (eventsToShow.length === 0) {
    container.innerHTML = '<div class="no-events">Sem formações agendadas próximas.</div>';
  } else {
    container.innerHTML = eventsToShow.map(e => {
      const dateObj = new Date(e.date);
      return `
        <div class="event-item formacao" onclick="openCourseDetails('${e.formacaoId}')" style="--event-color: #00b276;">
          <div class="event-date"><div class="event-day">${dateObj.getDate()}</div><div class="event-month">${MONTH_NAMES_SHORT[dateObj.getMonth()]}</div></div>
          <div class="event-details"><div class="event-title">${e.titulo}</div><div class="event-meta">${e.hora} • ${e.tipo || 'Formação'}</div></div>
        </div>
      `;
    }).join('');
  }
}

// ==========================================
// COURSE DETAILS MODAL
// ==========================================

function switchCourseTab(tabName) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  document.querySelector(`.modal-tab[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`)?.classList.add('active');
}

async function openCourseDetails(formacaoId) {
  selectedFormacao = allFormacoes.find(f => f.id === formacaoId);
  if (!selectedFormacao) return;
  
  const f = selectedFormacao;
  const formadorDisplay = getFormadorDisplay(f);
  const sessoes = (f.formacao_sessoes || []).sort((a, b) => new Date(a.data) - new Date(b.data));
  const inscritos = (f.formacao_inscricoes || []).filter(i => i.estado === 'Inscrito').length;
  const vagas = f.max_participantes || 20;
  const jaInscrito = currentUser && (f.formacao_inscricoes || []).some(i => i.colaborador_id === currentUser.id && i.estado === 'Inscrito');
  const showInscritos = canSeeInscritos(f);
  
  document.getElementById('modalCourseTitle').textContent = f.titulo;
  
  const inscritosHtml = showInscritos
    ? `<div style="text-align: center;"><div style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">${inscritos}/${vagas}</div><div style="font-size: 0.75rem; color: #64748b;">Inscritos</div></div>`
    : `<div style="text-align: center;"><div style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">${vagas}</div><div style="font-size: 0.75rem; color: #64748b;">Vagas</div></div>`;
  
  document.getElementById('tabDetalhes').innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #d1fae5; color: #065f46; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">${f.tipo || 'Formação'}</span>
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #dbeafe; color: #1e40af; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${f.estado}</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 12px;">
      <div style="text-align: center;"><div style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">${f.duracao_horas || 0}h</div><div style="font-size: 0.75rem; color: #64748b;">Duração</div></div>
      ${inscritosHtml}
      <div style="text-align: center;"><div style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">${sessoes.length}</div><div style="font-size: 0.75rem; color: #64748b;">Sessões</div></div>
    </div>
    <div style="margin-bottom: 1.5rem;"><h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">Formador</h4><p style="color: #475569;">${formadorDisplay}</p></div>
    <div style="margin-bottom: 1.5rem;"><h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">Objetivo</h4><p style="color: #475569; line-height: 1.6;">${f.objetivo || 'Sem descrição disponível.'}</p></div>
    ${sessoes.length > 0 ? `<div><h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.75rem;">Sessões</h4>${sessoes.map(s => `<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem;"><div style="width: 40px; height: 40px; background: #00b276; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg></div><div><div style="font-weight: 600; color: #1e293b;">${new Date(s.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</div><div style="font-size: 0.75rem; color: #64748b;">${s.hora_inicio || '09:00'} - ${s.hora_fim || '18:00'}</div></div></div>`).join('')}</div>` : ''}
  `;
  
  // Tab: Conteúdo
  const cp = f.conteudo_programatico;
  document.getElementById('tabConteudo').innerHTML = cp
    ? `<div class="conteudo-programatico">${cp}</div>`
    : `<div class="empty-tab-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p style="color: #64748b; font-size: 0.875rem;">Conteúdo programático não disponível.</p></div>`;
  
  // Tab: Anexos
  const anexos = f.formacao_anexos || [];
  document.getElementById('tabAnexos').innerHTML = anexos.length > 0
    ? `<div class="anexos-list">${anexos.map(a => `<div class="anexo-item"><div class="anexo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="anexo-info"><span class="anexo-nome">${a.nome || 'Documento'}</span><span class="anexo-tipo">${a.tipo || 'PDF'}</span></div><a href="${a.url}" target="_blank" class="anexo-download" title="Descarregar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a></div>`).join('')}</div>`
    : `<div class="empty-tab-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><p style="color: #64748b; font-size: 0.875rem;">Sem anexos disponíveis.</p></div>`;
  
  switchCourseTab('detalhes');
  
  // Botão inscrever
  const btnInscrever = document.getElementById('btnInscrever');
  if (btnInscrever) {
    if (jaInscrito) {
      btnInscrever.textContent = 'Já Inscrito';
      btnInscrever.disabled = true;
      btnInscrever.className = 'btn btn-secondary';
    } else if (inscritos >= vagas) {
      btnInscrever.textContent = 'Esgotado';
      btnInscrever.disabled = true;
      btnInscrever.className = 'btn btn-secondary';
    } else {
      btnInscrever.textContent = 'Inscrever-me';
      btnInscrever.disabled = false;
      btnInscrever.className = 'btn btn-primary';
    }
  }
  
  document.getElementById('modalCourse')?.classList.add('show');
}

async function inscreverFormacao() {
  if (!selectedFormacao || !currentUser) return;
  
  try {
    await DataService.inscreverFormacao(selectedFormacao.id, currentUser.id);
    showToast('Inscrição realizada com sucesso!', 'success');
    closeModal('modalCourse');
    await loadFormacoes();
  } catch (error) {
    console.error('Erro ao inscrever:', error);
    showToast('Erro ao realizar inscrição', 'error');
  }
}

async function toggleFavorite(event, formacaoId) {
  event.stopPropagation();
  if (!currentUser) return;
  
  try {
    await DataService.toggleFavoritoFormacao(formacaoId, currentUser.id);
    await loadFormacoes();
  } catch (error) {
    console.error('Erro ao alternar favorito:', error);
  }
}

// ==========================================
// MODALS & NAVIGATION
// ==========================================

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('show');
}

function scrollToCatalog() {
  document.getElementById('courseCatalog')?.scrollIntoView({ behavior: 'smooth' });
}

function scrollToMinhasFormacoes() {
  document.getElementById('minhasFormacoes')?.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  }
});
