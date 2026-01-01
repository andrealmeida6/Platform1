// ===================================================================
// DESLOCAÇÕES PAGE - INTEGRAÇÃO SUPABASE
// Implements RF1-RF6 requirements
// Estrutura compatível com Power Pages
// ===================================================================

// ==========================================
// STATE & CACHE
// ==========================================

let deslocacoesCache = [];
let colaboradoresCache = [];
let departamentosCache = [];
let frotaCache = [];
let tiposTransporteCache = [];
let tiposTransportePublicoCache = [];

let currentSortField = null;
let currentSortOrder = 'asc';
let editingRequestId = null;
let currentViewingId = null;
let transportCount = 0;
let selectedFiles = [];

// Utilizador atual (em produção viria da sessão/auth)
// Para Power Pages: seria obtido via liquid {{ user.id }}
let currentUserId = null;
const CURRENT_USER_EMAIL = 'carla.santos@empresa.pt';

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
  showLoadingState();
  
  try {
    await loadInitialData();
    
    renderTable();
    updateStats();
    initializeCollaboratorsList();
    initializeTransportTypes();
    addTransportMethod();
    populateOnBehalfDropdown();
    
    // Check URL params for auto-open modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('novo') === 'true') {
      setTimeout(() => {
        openCreateRequestModal();
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
  const [deslocacoes, colaboradores, departamentos, frota, tiposTransporte, tiposPublico] = await Promise.all([
    DataService.getDeslocacoes(),
    DataService.getColaboradores(),
    DataService.getDepartamentos(),
    DataService.getFrota(),
    DataService.getTiposTransporte(),
    DataService.getTiposTransportePublico()
  ]);
  
  deslocacoesCache = transformDeslocacoes(deslocacoes);
  colaboradoresCache = colaboradores;
  departamentosCache = departamentos;
  frotaCache = frota;
  tiposTransporteCache = tiposTransporte;
  tiposTransportePublicoCache = tiposPublico;
  
  // Obter ID do utilizador atual
  const currentUser = colaboradores.find(c => c.email === CURRENT_USER_EMAIL);
  if (currentUser) {
    currentUserId = currentUser.id;
  }
  
  console.log('[Deslocações] Dados carregados:', {
    deslocacoes: deslocacoesCache.length,
    colaboradores: colaboradoresCache.length,
    frota: frotaCache.length,
    tiposTransporte: tiposTransporteCache.length
  });
}

function transformDeslocacoes(deslocacoes) {
  return deslocacoes.map(d => {
    // Extrair colaboradores
    const colaboradores = (d.deslocacao_colaboradores || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map(dc => ({
        id: dc.colaborador_id,
        nome: dc.colaboradores?.nome || 'N/D',
        departamento: dc.colaboradores?.departamentos?.nome || 'N/D'
      }));
    
    // Extrair transportes
    const transportes = (d.deslocacao_transportes || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map(dt => {
        const tipo = dt.tipos_transporte?.nome || 'N/D';
        const tipoCodigo = dt.tipos_transporte?.codigo || '';
        
        return {
          tipo,
          tipoCodigo,
          tipoId: dt.tipo_transporte_id,
          viatura: dt.frota ? `${dt.frota.modelo} (${dt.frota.matricula})` : null,
          viaturaId: dt.viatura_id,
          subtipo: dt.tipos_transporte_publico?.nome || null,
          subtipoId: dt.tipo_publico_id,
          motorista: dt.motorista?.nome || null,
          motoristaId: dt.motorista_id,
          observacoes: dt.observacoes
        };
      });
    
    // Calcular duração
    let duracao = '1 dia';
    if (d.data_partida && d.data_chegada) {
      const start = new Date(d.data_partida);
      const end = new Date(d.data_chegada);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      duracao = `${diffDays} dia(s)`;
    }
    
    return {
      id: d.id,
      motivo: d.motivo || '',
      origem: d.origem || '',
      pontoIntermedio: d.ponto_intermedio || '',
      destino: d.destino || '',
      dataPartida: d.data_partida,
      horaPartida: d.hora_partida || '09:00',
      dataChegada: d.data_chegada,
      horaChegada: d.hora_chegada || '18:00',
      data: d.data_partida ? new Date(d.data_partida).toLocaleDateString('pt-PT') : '-',
      duracao,
      colaboradores: colaboradores.map(c => c.nome),
      colaboradoresData: colaboradores,
      numColaboradores: colaboradores.length,
      transportes,
      status: mapEstadoToStatus(d.estado),
      estado: d.estado,
      observacoes: d.observacoes || '',
      criador: d.criador?.nome || 'N/D',
      criadoPor: d.criado_por,
      anexos: (d.deslocacao_anexos || []).map(a => a.nome_ficheiro)
    };
  });
}

function mapEstadoToStatus(estado) {
  const map = {
    'Rascunho': 'Draft',
    'Pendente Aprovação': 'Em Aprovação',
    'Aprovada': 'Aprovado',
    'Rejeitada': 'Rejeitado',
    'Concluída': 'Concluído',
    'Cancelada': 'Cancelado'
  };
  return map[estado] || estado;
}

function mapStatusToEstado(status) {
  const map = {
    'Draft': 'Rascunho',
    'Em Aprovação': 'Pendente Aprovação',
    'Aprovado': 'Aprovada',
    'Rejeitado': 'Rejeitada',
    'Concluído': 'Concluída',
    'Cancelado': 'Cancelada'
  };
  return map[status] || status;
}

function showLoadingState() {
  const container = document.getElementById('requestsTable');
  if (container) {
    container.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 1rem; color: var(--text-secondary);">A carregar deslocações...</p>
      </div>
    `;
  }
}

function hideLoadingState() {
  // O render vai substituir o loading
}

function initializeTransportTypes() {
  // Os tipos já foram carregados do Supabase
  console.log('[Deslocações] Tipos de transporte:', tiposTransporteCache);
  console.log('[Deslocações] Tipos públicos:', tiposTransportePublicoCache);
}

// ==========================================
// STATISTICS
// ==========================================

function updateStats() {
  const total = deslocacoesCache.length;
  const pending = deslocacoesCache.filter(r => r.estado === 'Pendente Aprovação').length;
  const approved = deslocacoesCache.filter(r => r.estado === 'Aprovada').length;
  const draft = deslocacoesCache.filter(r => r.estado === 'Rascunho').length;
  
  animateCounter('statTotal', total);
  animateCounter('statPending', pending);
  animateCounter('statApproved', approved);
  animateCounter('statDraft', draft);
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
// TABLE RENDERING
// ==========================================

function renderTable() {
  const container = document.getElementById('requestsTable');
  const noData = document.getElementById('requestsNoData');
  
  if (deslocacoesCache.length === 0) {
    container.innerHTML = '';
    if (noData) noData.style.display = 'grid';
    return;
  }
  
  if (noData) noData.style.display = 'none';
  
  container.innerHTML = deslocacoesCache.map((request, index) => {
    const percurso = request.pontoIntermedio 
      ? `${request.origem} → ${request.pontoIntermedio} → ${request.destino}`
      : `${request.origem} → ${request.destino}`;
    
    const transporteDisplay = request.transportes.map(t => t.tipo).join(', ') || '-';
    
    return `
      <div class="table-grid table-grid-deslocacoes" style="animation-delay: ${index * 0.05}s; cursor: pointer;" onclick="openViewRequestModal('${request.id}')">
        <div class="cell-with-icon" title="${request.motivo}">
          <span class="cell-text">${request.motivo}</span>
        </div>
        <div>
          <span class="colaboradores-badge">${request.numColaboradores}</span>
          <span class="colaboradores-text">${request.colaboradores.slice(0, 2).join(', ')}${request.colaboradores.length > 2 ? '...' : ''}</span>
        </div>
        <div class="cell-percurso" title="${percurso}">${percurso}</div>
        <div>${request.data}</div>
        <div class="cell-transporte">${transporteDisplay}</div>
        <div><span class="${getStatusClass(request.status)}">${request.status}</span></div>
      </div>
    `;
  }).join('');
}

function getStatusClass(status) {
  const s = status.toLowerCase();
  if (s.includes('draft') || s.includes('rascunho')) return 'table-status-draft';
  if (s.includes('aprovação')) return 'table-status-em-aprovacao';
  if (s.includes('aprovado') || s.includes('aprovada')) return 'table-status-aprovado';
  return 'table-status-draft';
}

function searchTable() {
  const searchTerm = document.getElementById('searchRequests')?.value?.toLowerCase() || '';
  const rows = document.querySelectorAll('#requestsTable .table-grid');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function sortTable(field) {
  if (currentSortField === field) {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field;
    currentSortOrder = 'asc';
  }
  
  deslocacoesCache.sort((a, b) => {
    let valA = a[field] || '';
    let valB = b[field] || '';
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  renderTable();
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================

function openCreateRequestModal() {
  editingRequestId = null;
  document.getElementById('modalTitle').textContent = 'Novo Pedido de Deslocação';
  document.getElementById('createRequestForm').reset();
  resetForm();
  resetTracker();
  
  const modal = document.getElementById('createRequestModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCreateRequestModal() {
  const modal = document.getElementById('createRequestModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
  editingRequestId = null;
}

function resetForm() {
  document.getElementById('numColaboradores').value = 1;
  initializeCollaboratorsList();
  
  document.getElementById('horaPartida').value = '09';
  document.getElementById('minutoPartida').value = '00';
  document.getElementById('horaChegada').value = '18';
  document.getElementById('minutoChegada').value = '00';
  document.getElementById('dayCounterValue').textContent = '0';
  
  removeIntermediatePoint();
  
  document.getElementById('transportesContainer').innerHTML = '';
  transportCount = 0;
  addTransportMethod();
  
  selectedFiles = [];
  document.getElementById('fileList').innerHTML = '';
}

function resetTracker() {
  document.getElementById('trackerProgress').style.width = '0%';
  
  ['step1', 'step2', 'step3'].forEach((step, index) => {
    const circle = document.getElementById(`${step}Circle`);
    const label = document.getElementById(`${step}Label`);
    
    if (circle) circle.classList.remove('active', 'completed');
    if (label) label.classList.remove('active', 'completed');
    
    if (index === 0) {
      if (circle) circle.classList.add('active');
      if (label) label.classList.add('active');
    }
  });
}

// ==========================================
// RF1: COLLABORATORS MANAGEMENT
// ==========================================

function populateOnBehalfDropdown() {
  const select = document.getElementById('submitOnBehalf');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione (opcional)</option>';
  colaboradoresCache.forEach(colab => {
    const option = document.createElement('option');
    option.value = colab.id;
    option.textContent = colab.nome;
    select.appendChild(option);
  });
}

function adjustCollaborators(delta) {
  const input = document.getElementById('numColaboradores');
  let value = parseInt(input.value) || 1;
  value = Math.max(1, Math.min(20, value + delta));
  input.value = value;
  updateCollaboratorsList();
}

function initializeCollaboratorsList() {
  updateCollaboratorsList();
}

function updateCollaboratorsList() {
  const num = parseInt(document.getElementById('numColaboradores')?.value) || 1;
  const container = document.getElementById('colaboradoresContainer');
  if (!container) return;
  
  const currentSelections = getCurrentCollaboratorSelections();
  
  let html = '';
  for (let i = 0; i < num; i++) {
    const selectedValue = currentSelections[i] || '';
    html += `
      <div class="colaborador-item">
        <div class="colaborador-number">${i + 1}</div>
        <select class="form-select colaborador-select" id="colaborador_${i}" onchange="onCollaboratorChange()" required>
          <option value="">Selecionar colaborador...</option>
          ${colaboradoresCache.map(c => `
            <option value="${c.id}" ${selectedValue == c.id ? 'selected' : ''}>${c.nome} - ${c.departamentos?.nome || 'N/D'}</option>
          `).join('')}
        </select>
      </div>
    `;
  }
  
  container.innerHTML = html;
  updateDriverDropdowns();
}

function getCurrentCollaboratorSelections() {
  const selects = document.querySelectorAll('.colaborador-select');
  return Array.from(selects).map(s => s.value);
}

function getSelectedCollaborators() {
  const selects = document.querySelectorAll('.colaborador-select');
  const selected = [];
  selects.forEach(select => {
    if (select.value) {
      const colab = colaboradoresCache.find(c => c.id === select.value);
      if (colab) selected.push(colab);
    }
  });
  return selected;
}

function onCollaboratorChange() {
  updateDriverDropdowns();
}

// ==========================================
// RF2: ROUTE / INTERMEDIATE POINT
// ==========================================

function toggleIntermediatePoint() {
  const fields = document.getElementById('intermediatePointFields');
  const btn = document.getElementById('btnToggleIntermediate');
  
  if (fields && fields.style.display === 'none') {
    fields.style.display = 'flex';
    if (btn) btn.style.display = 'none';
  }
}

function removeIntermediatePoint() {
  const fields = document.getElementById('intermediatePointFields');
  const btn = document.getElementById('btnToggleIntermediate');
  const input = document.getElementById('localIntermedio');
  
  if (fields) fields.style.display = 'none';
  if (btn) btn.style.display = 'inline-flex';
  if (input) input.value = '';
}

// ==========================================
// RF3, RF4, RF5, RF6: TRANSPORT MANAGEMENT
// ==========================================

function addTransportMethod() {
  transportCount++;
  const container = document.getElementById('transportesContainer');
  if (!container) return;
  
  // Gerar opções de tipos de transporte
  const tiposOptions = tiposTransporteCache.map(t => 
    `<option value="${t.id}" data-codigo="${t.codigo}" data-requer-motorista="${t.requer_motorista}" data-requer-viatura="${t.requer_viatura}">${t.nome}</option>`
  ).join('');
  
  // Gerar opções de frota
  const frotaOptions = frotaCache.filter(v => v.disponivel).map(v => 
    `<option value="${v.id}">${v.modelo} (${v.matricula}) - ${v.tipo || 'Ligeiro'}, ${v.lugares} lugares</option>`
  ).join('');
  
  // Gerar opções de transporte público
  const publicoOptions = tiposTransportePublicoCache.map(t => 
    `<option value="${t.id}">${t.nome}</option>`
  ).join('');
  
  const transportDiv = document.createElement('div');
  transportDiv.className = 'transport-item';
  transportDiv.id = `transport_${transportCount}`;
  transportDiv.innerHTML = `
    <div class="transport-header">
      <span class="transport-number">Transporte ${transportCount}</span>
      ${transportCount > 1 ? `
        <button type="button" class="btn-remove-transport" onclick="removeTransportMethod(${transportCount})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      ` : ''}
    </div>
    
    <div class="transport-content">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo de Transporte <span class="required">*</span></label>
          <select class="form-select" id="tipoTransporte_${transportCount}" onchange="onTransportTypeChange(${transportCount})" required>
            <option value="">Selecionar...</option>
            ${tiposOptions}
          </select>
        </div>
        
        <!-- Fleet vehicle dropdown (RF4) -->
        <div class="form-group" id="viaturaFrotaGroup_${transportCount}" style="display: none;">
          <label class="form-label">Viatura da Frota <span class="required">*</span></label>
          <select class="form-select" id="viaturaFrota_${transportCount}">
            <option value="">Selecionar viatura...</option>
            ${frotaOptions}
          </select>
        </div>
        
        <!-- Public transport subtype (RF5) -->
        <div class="form-group" id="publicoSubtipoGroup_${transportCount}" style="display: none;">
          <label class="form-label">Tipo de Transporte Público</label>
          <select class="form-select" id="publicoSubtipo_${transportCount}">
            <option value="">Selecionar...</option>
            ${publicoOptions}
          </select>
        </div>
      </div>
      
      <!-- Driver selection (RF6) -->
      <div class="form-group" id="motoristaGroup_${transportCount}" style="display: none;">
        <label class="form-label">Motorista / Responsável pela Condução <span class="required">*</span></label>
        <select class="form-select" id="motorista_${transportCount}">
          <option value="">Selecionar motorista...</option>
        </select>
        <div class="form-hint" id="motoristaHint_${transportCount}"></div>
      </div>
      
      <!-- Own vehicle info -->
      <div class="form-group" id="viaturaPropriaGroup_${transportCount}" style="display: none;">
        <label class="form-label">Matrícula / Descrição da Viatura</label>
        <input type="text" class="form-input" id="viaturaPropria_${transportCount}" placeholder="Ex: 00-AA-00, VW Golf Cinzento">
      </div>
      
      <!-- Rental info -->
      <div class="form-group" id="aluguerGroup_${transportCount}" style="display: none;">
        <label class="form-label">Empresa de Aluguer / Observações</label>
        <input type="text" class="form-input" id="aluguerInfo_${transportCount}" placeholder="Ex: Europcar, Hertz...">
      </div>
    </div>
  `;
  
  container.appendChild(transportDiv);
  updateTransportNumbers();
}

function removeTransportMethod(id) {
  const element = document.getElementById(`transport_${id}`);
  if (element) {
    element.remove();
    updateTransportNumbers();
  }
}

function updateTransportNumbers() {
  const items = document.querySelectorAll('.transport-item');
  items.forEach((item, index) => {
    const numberSpan = item.querySelector('.transport-number');
    if (numberSpan) {
      numberSpan.textContent = `Transporte ${index + 1}`;
    }
  });
}

function onTransportTypeChange(id) {
  const select = document.getElementById(`tipoTransporte_${id}`);
  const selectedOption = select.options[select.selectedIndex];
  const codigo = selectedOption?.dataset?.codigo || '';
  const requerMotorista = selectedOption?.dataset?.requerMotorista === 'true';
  const requerViatura = selectedOption?.dataset?.requerViatura === 'true';
  
  // Hide all conditional fields first
  document.getElementById(`viaturaFrotaGroup_${id}`).style.display = 'none';
  document.getElementById(`publicoSubtipoGroup_${id}`).style.display = 'none';
  document.getElementById(`motoristaGroup_${id}`).style.display = 'none';
  document.getElementById(`viaturaPropriaGroup_${id}`).style.display = 'none';
  document.getElementById(`aluguerGroup_${id}`).style.display = 'none';
  
  if (!select.value) return;
  
  // Show relevant fields based on type
  switch(codigo) {
    case 'frota':
      document.getElementById(`viaturaFrotaGroup_${id}`).style.display = 'block';
      document.getElementById(`motoristaGroup_${id}`).style.display = 'block';
      break;
    case 'propria':
      document.getElementById(`viaturaPropriaGroup_${id}`).style.display = 'block';
      document.getElementById(`motoristaGroup_${id}`).style.display = 'block';
      break;
    case 'aluguer':
      document.getElementById(`aluguerGroup_${id}`).style.display = 'block';
      document.getElementById(`motoristaGroup_${id}`).style.display = 'block';
      break;
    case 'publico':
      document.getElementById(`publicoSubtipoGroup_${id}`).style.display = 'block';
      break;
  }
  
  if (requerMotorista) {
    updateDriverDropdown(id);
  }
}

function updateDriverDropdowns() {
  const transportItems = document.querySelectorAll('.transport-item');
  transportItems.forEach(item => {
    const id = item.id.replace('transport_', '');
    const select = document.getElementById(`tipoTransporte_${id}`);
    if (select && select.value) {
      const selectedOption = select.options[select.selectedIndex];
      const codigo = selectedOption?.dataset?.codigo || '';
      if (['frota', 'propria', 'aluguer'].includes(codigo)) {
        updateDriverDropdown(id);
      }
    }
  });
}

function updateDriverDropdown(transportId) {
  const select = document.getElementById(`motorista_${transportId}`);
  const hint = document.getElementById(`motoristaHint_${transportId}`);
  const selectedCollaborators = getSelectedCollaborators();
  
  if (!select) return;
  
  const currentValue = select.value;
  
  select.innerHTML = '<option value="">Selecionar motorista...</option>';
  
  if (selectedCollaborators.length === 0) {
    if (hint) {
      hint.textContent = 'Selecione primeiro os colaboradores';
      hint.style.color = 'var(--warning)';
    }
    return;
  }
  
  selectedCollaborators.forEach(colab => {
    const option = document.createElement('option');
    option.value = colab.id;
    option.textContent = colab.nome;
    select.appendChild(option);
  });
  
  // RF6: Auto-select if only 1 collaborator
  if (selectedCollaborators.length === 1) {
    select.value = selectedCollaborators[0].id;
    select.disabled = true;
    if (hint) {
      hint.textContent = 'Único colaborador selecionado automaticamente como motorista';
      hint.style.color = 'var(--text-secondary)';
    }
  } else {
    select.disabled = false;
    if (currentValue && selectedCollaborators.find(c => c.id === currentValue)) {
      select.value = currentValue;
    }
    if (hint) hint.textContent = '';
  }
}

// ==========================================
// FILE HANDLING
// ==========================================

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  files.forEach(file => {
    if (file.size > maxSize) {
      showToast(`Ficheiro ${file.name} excede 10MB`, 'danger');
      return;
    }
    
    if (!selectedFiles.find(f => f.name === file.name)) {
      selectedFiles.push(file);
    }
  });
  
  renderFileList();
}

function renderFileList() {
  const container = document.getElementById('fileList');
  if (!container) return;
  
  if (selectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = selectedFiles.map((file, index) => `
    <div class="file-item">
      <div class="file-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div class="file-info">
        <span class="file-name">${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
      </div>
      <button type="button" class="file-remove" onclick="removeFile(${index})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ==========================================
// DATE/TIME HELPERS
// ==========================================

function updateDayCounter() {
  const startDate = document.getElementById('dataPartida')?.value;
  const endDate = document.getElementById('dataChegada')?.value;
  const counter = document.getElementById('dayCounterValue');
  
  if (!counter) return;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    counter.textContent = diffDays;
  } else {
    counter.textContent = '0';
  }
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT');
}

// ==========================================
// FORM SUBMISSION
// ==========================================

async function handleSubmitRequest(event) {
  event.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    const formData = collectFormData('Pendente Aprovação');
    
    if (editingRequestId) {
      await DataService.updateDeslocacao(editingRequestId, formData);
    } else {
      await DataService.createDeslocacao(formData);
    }
    
    // Recarregar dados
    const deslocacoes = await DataService.getDeslocacoes();
    deslocacoesCache = transformDeslocacoes(deslocacoes);
    
    renderTable();
    updateStats();
    closeCreateRequestModal();
    showToast('Pedido submetido com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao submeter pedido:', error);
    showToast('Erro ao submeter pedido. Tente novamente.', 'danger');
  }
}

async function saveAsDraft() {
  try {
    const formData = collectFormData('Rascunho');
    
    if (editingRequestId) {
      await DataService.updateDeslocacao(editingRequestId, formData);
    } else {
      await DataService.createDeslocacao(formData);
    }
    
    const deslocacoes = await DataService.getDeslocacoes();
    deslocacoesCache = transformDeslocacoes(deslocacoes);
    
    renderTable();
    updateStats();
    closeCreateRequestModal();
    showToast('Rascunho guardado!', 'warning');
  } catch (error) {
    console.error('Erro ao guardar rascunho:', error);
    showToast('Erro ao guardar rascunho. Tente novamente.', 'danger');
  }
}

function validateForm() {
  const numColabs = parseInt(document.getElementById('numColaboradores')?.value) || 0;
  const selectedColabs = getSelectedCollaborators();
  
  if (selectedColabs.length < numColabs) {
    showToast('Selecione todos os colaboradores', 'danger');
    return false;
  }
  
  const transportItems = document.querySelectorAll('.transport-item');
  for (const item of transportItems) {
    const id = item.id.replace('transport_', '');
    const tipoSelect = document.getElementById(`tipoTransporte_${id}`);
    const tipo = tipoSelect?.value;
    
    if (!tipo) {
      showToast('Selecione o tipo de transporte', 'danger');
      return false;
    }
    
    const selectedOption = tipoSelect.options[tipoSelect.selectedIndex];
    const codigo = selectedOption?.dataset?.codigo || '';
    
    if (['frota', 'propria', 'aluguer'].includes(codigo)) {
      const motorista = document.getElementById(`motorista_${id}`)?.value;
      if (!motorista) {
        showToast('Selecione o motorista para cada transporte', 'danger');
        return false;
      }
    }
    
    if (codigo === 'frota') {
      const viatura = document.getElementById(`viaturaFrota_${id}`)?.value;
      if (!viatura) {
        showToast('Selecione a viatura da frota', 'danger');
        return false;
      }
    }
  }
  
  return true;
}

function collectFormData(estado) {
  const selectedColabs = getSelectedCollaborators();
  const transportes = collectTransportData();
  const pontoIntermedio = document.getElementById('localIntermedio')?.value?.trim() || null;
  
  const horaPartida = `${(document.getElementById('horaPartida')?.value || '09').padStart(2, '0')}:${(document.getElementById('minutoPartida')?.value || '00').padStart(2, '0')}`;
  const horaChegada = `${(document.getElementById('horaChegada')?.value || '18').padStart(2, '0')}:${(document.getElementById('minutoChegada')?.value || '00').padStart(2, '0')}`;
  
  return {
    motivo: document.getElementById('motivoDeslocacao')?.value || '',
    origem: document.getElementById('localOrigem')?.value || '',
    ponto_intermedio: pontoIntermedio,
    destino: document.getElementById('localDestino')?.value || '',
    data_partida: document.getElementById('dataPartida')?.value || null,
    hora_partida: horaPartida,
    data_chegada: document.getElementById('dataChegada')?.value || null,
    hora_chegada: horaChegada,
    observacoes: document.getElementById('observacoes')?.value || null,
    estado: estado,
    criado_por: currentUserId,
    colaboradores: selectedColabs.map(c => c.id),
    transportes: transportes
  };
}

function collectTransportData() {
  const transportes = [];
  const transportItems = document.querySelectorAll('.transport-item');
  
  transportItems.forEach((item, index) => {
    const id = item.id.replace('transport_', '');
    const tipoSelect = document.getElementById(`tipoTransporte_${id}`);
    const tipoId = tipoSelect?.value;
    
    if (!tipoId) return;
    
    const selectedOption = tipoSelect.options[tipoSelect.selectedIndex];
    const codigo = selectedOption?.dataset?.codigo || '';
    
    const transport = {
      tipo_transporte_id: tipoId,
      viatura_id: null,
      tipo_publico_id: null,
      motorista_id: null,
      observacoes: null
    };
    
    switch(codigo) {
      case 'frota':
        transport.viatura_id = document.getElementById(`viaturaFrota_${id}`)?.value || null;
        transport.motorista_id = document.getElementById(`motorista_${id}`)?.value || null;
        break;
      case 'propria':
        transport.observacoes = document.getElementById(`viaturaPropria_${id}`)?.value || null;
        transport.motorista_id = document.getElementById(`motorista_${id}`)?.value || null;
        break;
      case 'aluguer':
        transport.observacoes = document.getElementById(`aluguerInfo_${id}`)?.value || null;
        transport.motorista_id = document.getElementById(`motorista_${id}`)?.value || null;
        break;
      case 'publico':
        transport.tipo_publico_id = document.getElementById(`publicoSubtipo_${id}`)?.value || null;
        break;
    }
    
    transportes.push(transport);
  });
  
  return transportes;
}

// ==========================================
// VIEW MODAL
// ==========================================

function openViewRequestModal(id) {
  const request = deslocacoesCache.find(r => r.id === id);
  if (!request) return;
  
  currentViewingId = id;
  
  const detailsContainer = document.getElementById('viewRequestDetails');
  
  const percurso = request.pontoIntermedio 
    ? `${request.origem} → ${request.pontoIntermedio} → ${request.destino}`
    : `${request.origem} → ${request.destino}`;
  
  const transportesHtml = request.transportes.map(t => {
    let info = t.tipo;
    if (t.viatura) info += ` - ${t.viatura}`;
    if (t.subtipo) info += ` - ${t.subtipo}`;
    if (t.motorista) info += ` (Motorista: ${t.motorista})`;
    return `<div class="transport-detail-item">${info}</div>`;
  }).join('') || '<div class="transport-detail-item">Sem transportes definidos</div>';
  
  detailsContainer.innerHTML = `
    <div class="detail-card">
      <div class="detail-label">Motivo</div>
      <div class="detail-value">${request.motivo || '-'}</div>
    </div>
    <div class="detail-card">
      <div class="detail-label">Data</div>
      <div class="detail-value">${request.data}</div>
    </div>
    <div class="detail-card">
      <div class="detail-label">Duração</div>
      <div class="detail-value">${request.duracao}</div>
    </div>
    <div class="detail-card">
      <div class="detail-label">Horário</div>
      <div class="detail-value">${request.horaPartida} - ${request.horaChegada}</div>
    </div>
    <div class="detail-card detail-card-wide">
      <div class="detail-label">Colaboradores (${request.numColaboradores})</div>
      <div class="detail-value">${request.colaboradores.join(', ') || '-'}</div>
    </div>
    <div class="detail-card detail-card-wide">
      <div class="detail-label">Percurso</div>
      <div class="detail-value detail-percurso">${percurso}</div>
    </div>
    <div class="detail-card detail-card-wide">
      <div class="detail-label">Transportes</div>
      <div class="detail-value">${transportesHtml}</div>
    </div>
    <div class="detail-card">
      <div class="detail-label">Estado</div>
      <div class="detail-value"><span class="${getStatusClass(request.status)}">${request.status}</span></div>
    </div>
    <div class="detail-card detail-card-wide">
      <div class="detail-label">Observações</div>
      <div class="detail-value">${request.observacoes || '-'}</div>
    </div>
    ${request.anexos && request.anexos.length > 0 ? `
      <div class="detail-card detail-card-wide">
        <div class="detail-label">Anexos</div>
        <div class="detail-value">${request.anexos.join(', ')}</div>
      </div>
    ` : ''}
  `;
  
  updateViewTracker(request.status);
  
  const modal = document.getElementById('viewRequestModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function updateViewTracker(status) {
  const progress = document.getElementById('viewTrackerProgress');
  
  ['viewStep1', 'viewStep2', 'viewStep3'].forEach(step => {
    const circle = document.getElementById(`${step}Circle`);
    const label = document.getElementById(`${step}Label`);
    if (circle) circle.classList.remove('active', 'completed');
    if (label) label.classList.remove('active', 'completed');
  });
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('draft') || statusLower.includes('rascunho')) {
    if (progress) progress.style.width = '0%';
    const c1 = document.getElementById('viewStep1Circle');
    const l1 = document.getElementById('viewStep1Label');
    if (c1) c1.classList.add('active');
    if (l1) l1.classList.add('active');
  } else if (statusLower.includes('aprovação')) {
    if (progress) progress.style.width = '50%';
    const c1 = document.getElementById('viewStep1Circle');
    const l1 = document.getElementById('viewStep1Label');
    const c2 = document.getElementById('viewStep2Circle');
    const l2 = document.getElementById('viewStep2Label');
    if (c1) c1.classList.add('completed');
    if (l1) l1.classList.add('completed');
    if (c2) c2.classList.add('active');
    if (l2) l2.classList.add('active');
  } else if (statusLower.includes('aprovado') || statusLower.includes('aprovada') || statusLower.includes('concluído')) {
    if (progress) progress.style.width = '100%';
    ['viewStep1', 'viewStep2', 'viewStep3'].forEach(step => {
      const c = document.getElementById(`${step}Circle`);
      const l = document.getElementById(`${step}Label`);
      if (c) c.classList.add('completed');
      if (l) l.classList.add('completed');
    });
  }
}

function closeViewRequestModal() {
  const modal = document.getElementById('viewRequestModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
  currentViewingId = null;
}

function editCurrentRequest() {
  if (!currentViewingId) return;
  closeViewRequestModal();
  showToast('Funcionalidade de edição em desenvolvimento', 'warning');
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
    if (e.target.id === 'createRequestModal') {
      closeCreateRequestModal();
    } else if (e.target.id === 'viewRequestModal') {
      closeViewRequestModal();
    }
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCreateRequestModal();
    closeViewRequestModal();
  }
});

// Drag and drop for file upload
const fileUploadArea = document.getElementById('fileUploadArea');
if (fileUploadArea) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.add('dragover'), false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.remove('dragover'), false);
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    const input = document.getElementById('anexos');
    if (input) input.files = files;
    handleFileSelect({ target: { files: files } });
  }, false);
}
