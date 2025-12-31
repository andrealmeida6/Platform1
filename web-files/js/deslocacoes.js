// === DESLOCAÇÕES PAGE - COMPLETE REWRITE ===
// Implements RF1-RF6 requirements

// ==========================================
// DATA & STATE
// ==========================================

// Sample collaborators database
const colaboradoresDB = [
  { id: 1, nome: 'Ana Silva', email: 'ana.silva@empresa.pt', departamento: 'Recursos Humanos' },
  { id: 2, nome: 'Bruno Costa', email: 'bruno.costa@empresa.pt', departamento: 'Financeiro' },
  { id: 3, nome: 'Carla Santos', email: 'carla.santos@empresa.pt', departamento: 'IT' },
  { id: 4, nome: 'David Ferreira', email: 'david.ferreira@empresa.pt', departamento: 'Comercial' },
  { id: 5, nome: 'Eva Rodrigues', email: 'eva.rodrigues@empresa.pt', departamento: 'Marketing' },
  { id: 6, nome: 'Fernando Almeida', email: 'fernando.almeida@empresa.pt', departamento: 'Operações' },
  { id: 7, nome: 'Gabriela Martins', email: 'gabriela.martins@empresa.pt', departamento: 'Qualidade' },
  { id: 8, nome: 'Hugo Pereira', email: 'hugo.pereira@empresa.pt', departamento: 'Logística' }
];

// Sample fleet database (RF4)
const frotaDB = [
  { id: 1, matricula: '00-AA-00', modelo: 'VW Golf', tipo: 'Ligeiro', lugares: 5, disponivel: true },
  { id: 2, matricula: '11-BB-11', modelo: 'Renault Megane', tipo: 'Ligeiro', lugares: 5, disponivel: true },
  { id: 3, matricula: '22-CC-22', modelo: 'Ford Transit', tipo: 'Comercial', lugares: 9, disponivel: true },
  { id: 4, matricula: '33-DD-33', modelo: 'Peugeot 308', tipo: 'Ligeiro', lugares: 5, disponivel: false },
  { id: 5, matricula: '44-EE-44', modelo: 'Mercedes Vito', tipo: 'Comercial', lugares: 8, disponivel: true },
  { id: 6, matricula: '55-FF-55', modelo: 'BMW Serie 3', tipo: 'Executivo', lugares: 5, disponivel: true }
];

// Transport types (RF4, RF5)
const transportTypes = [
  { id: 'frota', label: 'Viatura EMRP (Frota)', requiresDriver: true, requiresVehicle: true },
  { id: 'propria', label: 'Viatura Própria', requiresDriver: true, requiresVehicle: false },
  { id: 'aluguer', label: 'Viatura de Aluguer', requiresDriver: true, requiresVehicle: false },
  { id: 'publico', label: 'Transporte Público', requiresDriver: false, requiresVehicle: false }
];

// Public transport subtypes (RF5)
const publicTransportTypes = [
  { id: 'uber', label: 'Uber / TVDE' },
  { id: 'taxi', label: 'Táxi' },
  { id: 'comboio', label: 'Comboio' },
  { id: 'autocarro', label: 'Autocarro' },
  { id: 'metro', label: 'Metro' },
  { id: 'aviao', label: 'Avião' },
  { id: 'outro', label: 'Outro' }
];

// Sample requests data
let requestsData = [
  { 
    id: 1, 
    motivo: 'Reunião com Cliente ABC', 
    colaboradores: ['Ana Silva', 'Bruno Costa'],
    numColaboradores: 2,
    origem: 'Lisboa',
    pontoIntermedio: '',
    destino: 'Porto', 
    data: '15/01/2026', 
    duracao: '2 dias', 
    transportes: [{ tipo: 'Viatura EMRP', viatura: 'VW Golf (00-AA-00)', motorista: 'Bruno Costa' }],
    status: 'Em Aprovação', 
    horaPartida: '09:00', 
    horaChegada: '18:00',
    justificacao: 'Apresentação de proposta comercial'
  },
  { 
    id: 2, 
    motivo: 'Formação Técnica', 
    colaboradores: ['Carla Santos'],
    numColaboradores: 1,
    origem: 'Lisboa',
    pontoIntermedio: '',
    destino: 'Coimbra', 
    data: '20/01/2026', 
    duracao: '1 dia', 
    transportes: [{ tipo: 'Transporte Público', subtipo: 'Comboio' }],
    status: 'Aprovado', 
    horaPartida: '08:00', 
    horaChegada: '19:00',
    justificacao: 'Curso de atualização profissional'
  },
  { 
    id: 3, 
    motivo: 'Visita a Obra', 
    colaboradores: ['David Ferreira', 'Eva Rodrigues', 'Fernando Almeida'],
    numColaboradores: 3,
    origem: 'Lisboa',
    pontoIntermedio: 'Albufeira',
    destino: 'Faro', 
    data: '25/01/2026', 
    duracao: '3 dias', 
    transportes: [
      { tipo: 'Viatura EMRP', viatura: 'Ford Transit (22-CC-22)', motorista: 'Fernando Almeida' },
      { tipo: 'Transporte Público', subtipo: 'Táxi' }
    ],
    status: 'Draft', 
    horaPartida: '07:00', 
    horaChegada: '20:00',
    justificacao: 'Inspeção de qualidade'
  }
];

let currentSortField = null;
let currentSortOrder = 'asc';
let editingRequestId = null;
let currentViewingId = null;
let transportCount = 0;
let selectedFiles = [];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  renderTable();
  updateStats();
  initializeCollaboratorsList();
  addTransportMethod(); // Add first transport by default
  
  // Check URL params for auto-open modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('novo') === 'true') {
    setTimeout(() => {
      openCreateRequestModal();
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 300);
  }
  
  // Populate "submit on behalf" dropdown
  populateOnBehalfDropdown();
});

// ==========================================
// STATISTICS
// ==========================================

function updateStats() {
  const total = requestsData.length;
  const pending = requestsData.filter(r => r.status === 'Em Aprovação').length;
  const approved = requestsData.filter(r => r.status === 'Aprovado').length;
  const draft = requestsData.filter(r => r.status === 'Draft').length;
  
  animateCounter('statTotal', total);
  animateCounter('statPending', pending);
  animateCounter('statApproved', approved);
  animateCounter('statDraft', draft);
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
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
  
  if (requestsData.length === 0) {
    container.innerHTML = '';
    noData.style.display = 'grid';
    return;
  }
  
  noData.style.display = 'none';
  
  container.innerHTML = requestsData.map((request, index) => {
    const percurso = request.pontoIntermedio 
      ? `${request.origem} → ${request.pontoIntermedio} → ${request.destino}`
      : `${request.origem} → ${request.destino}`;
    
    const transporteDisplay = request.transportes.map(t => t.tipo).join(', ');
    
    return `
      <div class="table-grid table-grid-deslocacoes" style="animation-delay: ${index * 0.05}s; cursor: pointer;" onclick="openViewRequestModal(${request.id})">
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
  switch(status.toLowerCase()) {
    case 'draft':
    case 'rascunho':
      return 'table-status-draft';
    case 'em aprovação':
      return 'table-status-em-aprovacao';
    case 'aprovado':
      return 'table-status-aprovado';
    default:
      return 'table-status-draft';
  }
}

function searchTable() {
  const searchTerm = document.getElementById('searchRequests').value.toLowerCase();
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
  
  requestsData.sort((a, b) => {
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
  // Reset collaborators
  document.getElementById('numColaboradores').value = 1;
  initializeCollaboratorsList();
  
  // Reset times
  document.getElementById('horaPartida').value = '09';
  document.getElementById('minutoPartida').value = '00';
  document.getElementById('horaChegada').value = '18';
  document.getElementById('minutoChegada').value = '00';
  document.getElementById('dayCounterValue').textContent = '0';
  
  // Reset intermediate point
  removeIntermediatePoint();
  
  // Reset transport
  document.getElementById('transportesContainer').innerHTML = '';
  transportCount = 0;
  addTransportMethod();
  
  // Reset files
  selectedFiles = [];
  document.getElementById('fileList').innerHTML = '';
}

function resetTracker() {
  document.getElementById('trackerProgress').style.width = '0%';
  
  ['step1', 'step2', 'step3'].forEach((step, index) => {
    const circle = document.getElementById(`${step}Circle`);
    const label = document.getElementById(`${step}Label`);
    
    circle.classList.remove('active', 'completed');
    label.classList.remove('active', 'completed');
    
    if (index === 0) {
      circle.classList.add('active');
      label.classList.add('active');
    }
  });
}

// ==========================================
// RF1: COLLABORATORS MANAGEMENT
// ==========================================

function populateOnBehalfDropdown() {
  const select = document.getElementById('submitOnBehalf');
  colaboradoresDB.forEach(colab => {
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
  const num = parseInt(document.getElementById('numColaboradores').value) || 1;
  const container = document.getElementById('colaboradoresContainer');
  const currentSelections = getCurrentCollaboratorSelections();
  
  let html = '';
  for (let i = 0; i < num; i++) {
    const selectedValue = currentSelections[i] || '';
    html += `
      <div class="colaborador-item">
        <div class="colaborador-number">${i + 1}</div>
        <select class="form-select colaborador-select" id="colaborador_${i}" onchange="onCollaboratorChange()" required>
          <option value="">Selecionar colaborador...</option>
          ${colaboradoresDB.map(c => `
            <option value="${c.id}" ${selectedValue == c.id ? 'selected' : ''}>${c.nome} - ${c.departamento}</option>
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
      const colab = colaboradoresDB.find(c => c.id == select.value);
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
  
  if (fields.style.display === 'none') {
    fields.style.display = 'flex';
    btn.style.display = 'none';
  }
}

function removeIntermediatePoint() {
  const fields = document.getElementById('intermediatePointFields');
  const btn = document.getElementById('btnToggleIntermediate');
  const input = document.getElementById('localIntermedio');
  
  fields.style.display = 'none';
  btn.style.display = 'inline-flex';
  input.value = '';
}

// ==========================================
// RF3, RF4, RF5, RF6: TRANSPORT MANAGEMENT
// ==========================================

function addTransportMethod() {
  transportCount++;
  const container = document.getElementById('transportesContainer');
  
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
            ${transportTypes.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>
        
        <!-- Fleet vehicle dropdown (RF4) -->
        <div class="form-group" id="viaturaFrotaGroup_${transportCount}" style="display: none;">
          <label class="form-label">Viatura da Frota <span class="required">*</span></label>
          <select class="form-select" id="viaturaFrota_${transportCount}">
            <option value="">Selecionar viatura...</option>
            ${frotaDB.filter(v => v.disponivel).map(v => `
              <option value="${v.id}">${v.modelo} (${v.matricula}) - ${v.tipo}, ${v.lugares} lugares</option>
            `).join('')}
          </select>
        </div>
        
        <!-- Public transport subtype (RF5) -->
        <div class="form-group" id="publicoSubtipoGroup_${transportCount}" style="display: none;">
          <label class="form-label">Tipo de Transporte Público</label>
          <select class="form-select" id="publicoSubtipo_${transportCount}">
            <option value="">Selecionar...</option>
            ${publicTransportTypes.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
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
  const tipo = document.getElementById(`tipoTransporte_${id}`).value;
  const transportType = transportTypes.find(t => t.id === tipo);
  
  // Hide all conditional fields first
  document.getElementById(`viaturaFrotaGroup_${id}`).style.display = 'none';
  document.getElementById(`publicoSubtipoGroup_${id}`).style.display = 'none';
  document.getElementById(`motoristaGroup_${id}`).style.display = 'none';
  document.getElementById(`viaturaPropriaGroup_${id}`).style.display = 'none';
  document.getElementById(`aluguerGroup_${id}`).style.display = 'none';
  
  if (!tipo) return;
  
  // Show relevant fields based on type
  switch(tipo) {
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
  
  if (transportType && transportType.requiresDriver) {
    updateDriverDropdown(id);
  }
}

function updateDriverDropdowns() {
  const transportItems = document.querySelectorAll('.transport-item');
  transportItems.forEach(item => {
    const id = item.id.replace('transport_', '');
    const tipo = document.getElementById(`tipoTransporte_${id}`)?.value;
    if (tipo && ['frota', 'propria', 'aluguer'].includes(tipo)) {
      updateDriverDropdown(id);
    }
  });
}

function updateDriverDropdown(transportId) {
  const select = document.getElementById(`motorista_${transportId}`);
  const hint = document.getElementById(`motoristaHint_${transportId}`);
  const selectedCollaborators = getSelectedCollaborators();
  
  if (!select) return;
  
  // Save current selection
  const currentValue = select.value;
  
  // Clear and rebuild options
  select.innerHTML = '<option value="">Selecionar motorista...</option>';
  
  if (selectedCollaborators.length === 0) {
    hint.textContent = 'Selecione primeiro os colaboradores';
    hint.style.color = 'var(--warning)';
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
    hint.textContent = 'Único colaborador selecionado automaticamente como motorista';
    hint.style.color = 'var(--text-secondary)';
  } else {
    select.disabled = false;
    // Restore previous selection if still valid
    if (currentValue && selectedCollaborators.find(c => c.id == currentValue)) {
      select.value = currentValue;
    }
    hint.textContent = '';
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
  const startDate = document.getElementById('dataPartida').value;
  const endDate = document.getElementById('dataChegada').value;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    document.getElementById('dayCounterValue').textContent = diffDays;
  } else {
    document.getElementById('dayCounterValue').textContent = '0';
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

function handleSubmitRequest(event) {
  event.preventDefault();
  
  if (!validateForm()) return;
  
  const formData = collectFormData('Em Aprovação');
  
  if (editingRequestId) {
    const index = requestsData.findIndex(r => r.id === editingRequestId);
    if (index !== -1) {
      requestsData[index] = formData;
    }
  } else {
    requestsData.unshift(formData);
  }
  
  renderTable();
  updateStats();
  closeCreateRequestModal();
  showToast('Pedido submetido com sucesso!', 'success');
}

function saveAsDraft() {
  const formData = collectFormData('Draft');
  
  if (editingRequestId) {
    const index = requestsData.findIndex(r => r.id === editingRequestId);
    if (index !== -1) {
      requestsData[index] = formData;
    }
  } else {
    requestsData.unshift(formData);
  }
  
  renderTable();
  updateStats();
  closeCreateRequestModal();
  showToast('Rascunho guardado!', 'warning');
}

function validateForm() {
  const numColabs = parseInt(document.getElementById('numColaboradores').value);
  const selectedColabs = getSelectedCollaborators();
  
  if (selectedColabs.length < numColabs) {
    showToast('Selecione todos os colaboradores', 'danger');
    return false;
  }
  
  // Validate transports
  const transportItems = document.querySelectorAll('.transport-item');
  for (const item of transportItems) {
    const id = item.id.replace('transport_', '');
    const tipo = document.getElementById(`tipoTransporte_${id}`).value;
    
    if (!tipo) {
      showToast('Selecione o tipo de transporte', 'danger');
      return false;
    }
    
    if (['frota', 'propria', 'aluguer'].includes(tipo)) {
      const motorista = document.getElementById(`motorista_${id}`).value;
      if (!motorista) {
        showToast('Selecione o motorista para cada transporte', 'danger');
        return false;
      }
    }
    
    if (tipo === 'frota') {
      const viatura = document.getElementById(`viaturaFrota_${id}`).value;
      if (!viatura) {
        showToast('Selecione a viatura da frota', 'danger');
        return false;
      }
    }
  }
  
  return true;
}

function collectFormData(status) {
  const selectedColabs = getSelectedCollaborators();
  const transportes = collectTransportData();
  const pontoIntermedio = document.getElementById('localIntermedio').value.trim();
  
  return {
    id: editingRequestId || Date.now(),
    motivo: document.getElementById('motivoDeslocacao').value,
    colaboradores: selectedColabs.map(c => c.nome),
    numColaboradores: selectedColabs.length,
    origem: document.getElementById('localOrigem').value,
    pontoIntermedio: pontoIntermedio,
    destino: document.getElementById('localDestino').value,
    data: formatDateDisplay(document.getElementById('dataPartida').value),
    duracao: document.getElementById('dayCounterValue').textContent + ' dia(s)',
    transportes: transportes,
    status: status,
    horaPartida: `${(document.getElementById('horaPartida').value || '09').padStart(2, '0')}:${(document.getElementById('minutoPartida').value || '00').padStart(2, '0')}`,
    horaChegada: `${(document.getElementById('horaChegada').value || '18').padStart(2, '0')}:${(document.getElementById('minutoChegada').value || '00').padStart(2, '0')}`,
    justificacao: document.getElementById('observacoes').value || '-',
    anexos: selectedFiles.map(f => f.name)
  };
}

function collectTransportData() {
  const transportes = [];
  const transportItems = document.querySelectorAll('.transport-item');
  
  transportItems.forEach(item => {
    const id = item.id.replace('transport_', '');
    const tipo = document.getElementById(`tipoTransporte_${id}`).value;
    
    if (!tipo) return;
    
    const transport = {
      tipo: transportTypes.find(t => t.id === tipo)?.label || tipo
    };
    
    switch(tipo) {
      case 'frota':
        const viaturaId = document.getElementById(`viaturaFrota_${id}`).value;
        const viatura = frotaDB.find(v => v.id == viaturaId);
        transport.viatura = viatura ? `${viatura.modelo} (${viatura.matricula})` : '';
        break;
      case 'propria':
        transport.viatura = document.getElementById(`viaturaPropria_${id}`).value;
        break;
      case 'aluguer':
        transport.aluguer = document.getElementById(`aluguerInfo_${id}`).value;
        break;
      case 'publico':
        const subtipo = document.getElementById(`publicoSubtipo_${id}`).value;
        transport.subtipo = publicTransportTypes.find(t => t.id === subtipo)?.label || '';
        break;
    }
    
    if (['frota', 'propria', 'aluguer'].includes(tipo)) {
      const motoristaId = document.getElementById(`motorista_${id}`).value;
      const motorista = colaboradoresDB.find(c => c.id == motoristaId);
      transport.motorista = motorista?.nome || '';
    }
    
    transportes.push(transport);
  });
  
  return transportes;
}

// ==========================================
// VIEW MODAL
// ==========================================

function openViewRequestModal(id) {
  const request = requestsData.find(r => r.id === id);
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
  }).join('');
  
  detailsContainer.innerHTML = `
    <div class="detail-card">
      <div class="detail-label">Motivo</div>
      <div class="detail-value">${request.motivo}</div>
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
      <div class="detail-value">${request.colaboradores.join(', ')}</div>
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
      <div class="detail-label">Justificação</div>
      <div class="detail-value">${request.justificacao}</div>
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
    circle.classList.remove('active', 'completed');
    label.classList.remove('active', 'completed');
  });
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('draft') || statusLower.includes('rascunho')) {
    progress.style.width = '0%';
    document.getElementById('viewStep1Circle').classList.add('active');
    document.getElementById('viewStep1Label').classList.add('active');
  } else if (statusLower.includes('aprovação')) {
    progress.style.width = '50%';
    document.getElementById('viewStep1Circle').classList.add('completed');
    document.getElementById('viewStep1Label').classList.add('completed');
    document.getElementById('viewStep2Circle').classList.add('active');
    document.getElementById('viewStep2Label').classList.add('active');
  } else if (statusLower.includes('aprovado') || statusLower.includes('concluído')) {
    progress.style.width = '100%';
    ['viewStep1', 'viewStep2', 'viewStep3'].forEach(step => {
      document.getElementById(`${step}Circle`).classList.add('completed');
      document.getElementById(`${step}Label`).classList.add('completed');
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
  // TODO: Implement edit functionality
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
    document.getElementById('anexos').files = files;
    handleFileSelect({ target: { files: files } });
  }, false);
}
