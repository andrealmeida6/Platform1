/**
 * deslocacoes-lista.js
 * Lógica para a página de listagem de pedidos de deslocação
 */

// ====================
// VARIÁVEIS GLOBAIS
// ====================
let allRequests = [];
let currentViewRequest = null;
let sortColumn = 'data';
let sortDirection = 'desc';

// ====================
// INICIALIZAÇÃO
// ====================
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
});

async function initializePage() {
  await loadRequests();
  
  // Verificar se deve abrir modal de visualização
  const urlParams = new URLSearchParams(window.location.search);
  const viewId = urlParams.get('view');
  if (viewId) {
    await openViewRequest(viewId);
  }
}

// ====================
// CARREGAR PEDIDOS
// ====================
async function loadRequests() {
  try {
    showLoadingInTable();
    
    // Carregar pedidos do DataService
    if (typeof DataService !== 'undefined' && DataService.getDeslocacoes) {
      allRequests = await DataService.getDeslocacoes();
    } else {
      // Dados de exemplo para demonstração
      allRequests = getExampleData();
    }
    
    updateStats();
    renderTable();
    
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    showErrorInTable('Erro ao carregar pedidos. Por favor, tente novamente.');
  }
}

function getExampleData() {
  return [
    {
      id: '1',
      motivo: 'Reunião com cliente ABC',
      colaboradores: ['João Silva'],
      local_origem: 'Lisboa',
      local_destino: 'Porto',
      pontos_intermedios: [],
      data_partida: '2026-01-15',
      data_chegada: '2026-01-15',
      transportes: [{ tipo_codigo: 'comboio', nome: 'Comboio' }],
      estado: 'Aprovado',
      created_at: '2026-01-10T10:00:00Z'
    },
    {
      id: '2',
      motivo: 'Formação Power BI Avançado',
      colaboradores: ['Maria Costa', 'Pedro Santos'],
      local_origem: 'Porto',
      local_destino: 'Coimbra',
      pontos_intermedios: [],
      data_partida: '2026-01-20',
      data_chegada: '2026-01-21',
      transportes: [{ tipo_codigo: 'frota', nome: 'Viatura EMRP (Frota)' }],
      estado: 'Em Aprovação',
      created_at: '2026-01-12T14:30:00Z'
    },
    {
      id: '3',
      motivo: 'Visita técnica - Projeto Solar',
      colaboradores: ['Ana Ferreira'],
      local_origem: 'Lisboa',
      local_destino: 'Faro',
      pontos_intermedios: ['Setúbal', 'Beja'],
      data_partida: '2026-02-01',
      data_chegada: '2026-02-03',
      transportes: [{ tipo_codigo: 'frota', nome: 'Viatura EMRP (Frota)' }, { tipo_codigo: 'aviao', nome: 'Avião' }],
      estado: 'Rascunho',
      created_at: '2026-01-14T09:15:00Z'
    }
  ];
}

// ====================
// ESTATÍSTICAS
// ====================
function updateStats() {
  const total = allRequests.length;
  const pending = allRequests.filter(r => r.estado === 'Em Aprovação' || r.estado === 'Submetido').length;
  const approved = allRequests.filter(r => r.estado === 'Aprovado').length;
  const draft = allRequests.filter(r => r.estado === 'Rascunho').length;
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statDraft').textContent = draft;
}

// ====================
// RENDERIZAR TABELA
// ====================
function renderTable() {
  const container = document.getElementById('requestsTable');
  const noData = document.getElementById('requestsNoData');
  
  if (!container) return;
  
  if (allRequests.length === 0) {
    container.innerHTML = '';
    if (noData) noData.style.display = 'block';
    return;
  }
  
  if (noData) noData.style.display = 'none';
  
  // Ordenar
  const sorted = sortRequests(allRequests);
  
  container.innerHTML = sorted.map(request => `
    <div class="table-grid table-grid-row table-grid-deslocacoes" onclick="openViewRequest('${request.id}')">
      <div class="table-cell">
        <span class="cell-main">${request.motivo || '-'}</span>
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatColaboradores(request.colaboradores)}</span>
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatPercurso(request)}</span>
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatDateDisplay(request.data_partida)}</span>
        ${request.data_chegada && request.data_chegada !== request.data_partida ? 
          `<span class="cell-sub">até ${formatDateDisplay(request.data_chegada)}</span>` : ''}
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatTransportes(request.transportes)}</span>
      </div>
      <div class="table-cell">
        ${renderStatusBadge(request.estado)}
      </div>
    </div>
  `).join('');
}

function sortRequests(requests) {
  return [...requests].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortColumn) {
      case 'motivo':
        aVal = a.motivo || '';
        bVal = b.motivo || '';
        break;
      case 'colaboradores':
        aVal = formatColaboradores(a.colaboradores);
        bVal = formatColaboradores(b.colaboradores);
        break;
      case 'percurso':
        aVal = formatPercurso(a);
        bVal = formatPercurso(b);
        break;
      case 'data':
        aVal = a.data_partida || '';
        bVal = b.data_partida || '';
        break;
      case 'transporte':
        aVal = formatTransportes(a.transportes);
        bVal = formatTransportes(b.transportes);
        break;
      case 'status':
        aVal = a.estado || '';
        bVal = b.estado || '';
        break;
      default:
        aVal = a.created_at || '';
        bVal = b.created_at || '';
    }
    
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

function sortTable(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  renderTable();
}

// ====================
// PESQUISA
// ====================
function searchTable() {
  const searchTerm = document.getElementById('searchRequests')?.value?.toLowerCase() || '';
  
  if (!searchTerm) {
    renderTable();
    return;
  }
  
  const filtered = allRequests.filter(request => {
    const searchableText = [
      request.motivo,
      formatColaboradores(request.colaboradores),
      formatPercurso(request),
      formatTransportes(request.transportes),
      request.estado
    ].join(' ').toLowerCase();
    
    return searchableText.includes(searchTerm);
  });
  
  const container = document.getElementById('requestsTable');
  const noData = document.getElementById('requestsNoData');
  
  if (filtered.length === 0) {
    container.innerHTML = '';
    if (noData) {
      noData.style.display = 'block';
      noData.innerHTML = '<p>Nenhum resultado encontrado para a pesquisa.</p>';
    }
    return;
  }
  
  if (noData) noData.style.display = 'none';
  
  const sorted = sortRequests(filtered);
  
  container.innerHTML = sorted.map(request => `
    <div class="table-grid table-grid-row table-grid-deslocacoes" onclick="openViewRequest('${request.id}')">
      <div class="table-cell">
        <span class="cell-main">${request.motivo || '-'}</span>
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatColaboradores(request.colaboradores)}</span>
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatPercurso(request)}</span>
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatDateDisplay(request.data_partida)}</span>
        ${request.data_chegada && request.data_chegada !== request.data_partida ? 
          `<span class="cell-sub">até ${formatDateDisplay(request.data_chegada)}</span>` : ''}
      </div>
      <div class="table-cell">
        <span class="cell-main">${formatTransportes(request.transportes)}</span>
      </div>
      <div class="table-cell">
        ${renderStatusBadge(request.estado)}
      </div>
    </div>
  `).join('');
}

// ====================
// FORMATADORES
// ====================
function formatColaboradores(colaboradores) {
  if (!colaboradores || colaboradores.length === 0) return '-';
  if (colaboradores.length === 1) return colaboradores[0];
  return `${colaboradores[0]} +${colaboradores.length - 1}`;
}

function formatPercurso(request) {
  const origem = request.local_origem || '';
  const destino = request.local_destino || '';
  const intermedios = request.pontos_intermedios || [];
  
  if (!origem && !destino) return '-';
  
  let percurso = origem;
  if (intermedios.length > 0) {
    percurso += ` → ${intermedios.length} paragem(s)`;
  }
  percurso += ` → ${destino}`;
  
  return percurso;
}

function formatTransportes(transportes) {
  if (!transportes || transportes.length === 0) return '-';
  
  const nomes = transportes.map(t => {
    if (t.nome) return t.nome;
    switch (t.tipo_codigo) {
      case 'frota': return 'Viatura EMRP';
      case 'publico': return 'Transp. Público';
      case 'aviao': return 'Avião';
      case 'comboio': return 'Comboio';
      case 'taxi': return 'Táxi/TVDE';
      default: return t.tipo_codigo;
    }
  });
  
  if (nomes.length === 1) return nomes[0];
  return `${nomes[0]} +${nomes.length - 1}`;
}

function formatDateDisplay(isoDate) {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

function renderStatusBadge(status) {
  const statusClasses = {
    'Rascunho': 'status-draft',
    'Submetido': 'status-pending',
    'Em Aprovação': 'status-pending',
    'Aprovado': 'status-approved',
    'Rejeitado': 'status-rejected',
    'Cancelado': 'status-cancelled'
  };
  
  const statusClass = statusClasses[status] || 'status-default';
  return `<span class="status-badge ${statusClass}">${status || '-'}</span>`;
}

// ====================
// MODAL: VISUALIZAR PEDIDO
// ====================
async function openViewRequest(requestId) {
  const modal = document.getElementById('viewRequestModal');
  const detailsContainer = document.getElementById('viewRequestDetails');
  
  if (!modal || !detailsContainer) return;
  
  // Encontrar pedido
  currentViewRequest = allRequests.find(r => r.id === requestId);
  
  if (!currentViewRequest) {
    // Tentar carregar do servidor
    if (typeof DataService !== 'undefined' && DataService.getDeslocacaoById) {
      try {
        currentViewRequest = await DataService.getDeslocacaoById(requestId);
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        alert('Pedido não encontrado.');
        return;
      }
    }
  }
  
  if (!currentViewRequest) {
    alert('Pedido não encontrado.');
    return;
  }
  
  // Atualizar process tracker
  updateViewProcessTracker(currentViewRequest.estado);
  
  // Renderizar detalhes
  detailsContainer.innerHTML = renderRequestDetails(currentViewRequest);
  
  // Mostrar/esconder botão de editar
  const btnEditar = document.getElementById('btnEditarPedido');
  if (btnEditar) {
    btnEditar.style.display = currentViewRequest.estado === 'Rascunho' ? 'inline-flex' : 'none';
  }
  
  // Abrir modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeViewRequestModal() {
  const modal = document.getElementById('viewRequestModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  currentViewRequest = null;
}

function editCurrentRequest() {
  if (currentViewRequest) {
    window.location.href = `novo-pedido-deslocacao?id=${currentViewRequest.id}`;
  }
}

function updateViewProcessTracker(estado) {
  const step1 = document.getElementById('viewStep1Circle');
  const step2 = document.getElementById('viewStep2Circle');
  const step3 = document.getElementById('viewStep3Circle');
  const progress = document.getElementById('viewTrackerProgress');
  
  // Reset
  [step1, step2, step3].forEach(el => {
    if (el) el.className = 'process-step-circle';
  });
  
  switch (estado) {
    case 'Rascunho':
      step1?.classList.add('active');
      if (progress) progress.style.width = '0%';
      break;
    case 'Submetido':
    case 'Em Aprovação':
      step1?.classList.add('completed');
      step2?.classList.add('active');
      if (progress) progress.style.width = '50%';
      break;
    case 'Aprovado':
      step1?.classList.add('completed');
      step2?.classList.add('completed');
      step3?.classList.add('completed');
      if (progress) progress.style.width = '100%';
      break;
    case 'Rejeitado':
      step1?.classList.add('completed');
      step2?.classList.add('rejected');
      if (progress) progress.style.width = '50%';
      break;
  }
}

function renderRequestDetails(request) {
  return `
    <div class="detail-section">
      <h4 class="detail-section-title">Informação Geral</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Motivo</span>
          <span class="detail-value">${request.motivo || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Colaboradores</span>
          <span class="detail-value">${request.colaboradores?.join(', ') || '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4 class="detail-section-title">Datas e Horários</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Data de Partida</span>
          <span class="detail-value">${formatDateDisplay(request.data_partida)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Data de Chegada</span>
          <span class="detail-value">${formatDateDisplay(request.data_chegada)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Hora de Partida</span>
          <span class="detail-value">${request.hora_partida || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Hora de Chegada</span>
          <span class="detail-value">${request.hora_chegada || '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4 class="detail-section-title">Percurso</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Origem</span>
          <span class="detail-value">${request.local_origem || '-'}</span>
        </div>
        ${request.pontos_intermedios?.length > 0 ? `
          <div class="detail-item">
            <span class="detail-label">Pontos Intermédios</span>
            <span class="detail-value">${request.pontos_intermedios.join(' → ')}</span>
          </div>
        ` : ''}
        <div class="detail-item">
          <span class="detail-label">Destino</span>
          <span class="detail-value">${request.local_destino || '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4 class="detail-section-title">Transportes</h4>
      ${request.transportes?.map(t => `
        <div class="transport-detail-item">
          <span class="transport-name">${getTransportName(t.tipo_codigo)}</span>
          ${t.observacoes ? `<span class="transport-obs">${t.observacoes}</span>` : ''}
        </div>
      `).join('') || '<p>Nenhum transporte selecionado</p>'}
    </div>
    
    ${request.alojamentos?.length > 0 ? `
      <div class="detail-section">
        <h4 class="detail-section-title">Alojamento</h4>
        ${request.alojamentos.map(a => `
          <div class="alojamento-detail-item">
            <span class="alojamento-local">${a.local}</span>
            ${a.observacoes ? `<span class="alojamento-obs">${a.observacoes}</span>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    ${request.observacoes ? `
      <div class="detail-section">
        <h4 class="detail-section-title">Observações</h4>
        <p class="detail-obs">${request.observacoes}</p>
      </div>
    ` : ''}
  `;
}

function getTransportName(codigo) {
  const nomes = {
    'frota': 'Viatura EMRP (Frota)',
    'publico': 'Transporte Público (Metro, Autocarro, etc.)',
    'aviao': 'Avião',
    'comboio': 'Comboio',
    'taxi': 'Táxi / TVDE'
  };
  return nomes[codigo] || codigo;
}

// ====================
// UTILITÁRIOS UI
// ====================
function showLoadingInTable() {
  const container = document.getElementById('requestsTable');
  if (container) {
    container.innerHTML = `
      <div class="table-loading">
        <div class="loading-spinner"></div>
        <span>A carregar pedidos...</span>
      </div>
    `;
  }
}

function showErrorInTable(message) {
  const container = document.getElementById('requestsTable');
  if (container) {
    container.innerHTML = `
      <div class="table-error">
        <p>${message}</p>
        <button onclick="loadRequests()" class="btn btn-primary">Tentar novamente</button>
      </div>
    `;
  }
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeViewRequestModal();
  }
});

// Fechar modal com Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeViewRequestModal();
  }
});
