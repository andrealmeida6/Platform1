// === DESLOCACOES PAGE JAVASCRIPT ===

// Sample data
let requestsData = [
  { id: 1, motivo: 'Reunião com Cliente ABC', partida: 'Lisboa', destino: 'Porto', data: '15/01/2026', duracao: '2 dias', viatura: 'Viatura Própria', status: 'Em Aprovação', horaPartida: '09:00', horaChegada: '18:00', numeroColaboradores: 2, justificacao: 'Apresentação de proposta comercial', locaisIntermedios: '-' },
  { id: 2, motivo: 'Formação Técnica', partida: 'Lisboa', destino: 'Coimbra', data: '20/01/2026', duracao: '1 dia', viatura: 'Transporte Público', status: 'Aprovado', horaPartida: '08:00', horaChegada: '19:00', numeroColaboradores: 1, justificacao: 'Curso de atualização profissional', locaisIntermedios: '-' },
  { id: 3, motivo: 'Visita a Obra', partida: 'Lisboa', destino: 'Faro', data: '25/01/2026', duracao: '3 dias', viatura: 'Viatura da Empresa', status: 'Draft', horaPartida: '07:00', horaChegada: '20:00', numeroColaboradores: 3, justificacao: 'Inspeção de qualidade', locaisIntermedios: 'Albufeira' },
  { id: 4, motivo: 'Conferência Anual', partida: 'Porto', destino: 'Braga', data: '10/02/2026', duracao: '1 dia', viatura: 'Viatura Própria', status: 'Em Aprovação', horaPartida: '09:30', horaChegada: '17:30', numeroColaboradores: 4, justificacao: 'Participação em evento do setor', locaisIntermedios: '-' },
  { id: 5, motivo: 'Auditoria Interna', partida: 'Lisboa', destino: 'Évora', data: '05/02/2026', duracao: '2 dias', viatura: 'Viatura da Empresa', status: 'Aprovado', horaPartida: '08:30', horaChegada: '18:30', numeroColaboradores: 2, justificacao: 'Revisão de processos', locaisIntermedios: '-' }
];

let currentSortField = null;
let currentSortOrder = 'asc';
let editingRequestId = null;
let intermediateLocationCount = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  renderTable();
  updateStats();
  
  // Check URL params for auto-open modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('novo') === 'true') {
    setTimeout(() => {
      openCreateRequestModal();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 300);
  }
});

// Update statistics
function updateStats() {
  const total = requestsData.length;
  const pending = requestsData.filter(r => r.status === 'Em Aprovação').length;
  const approved = requestsData.filter(r => r.status === 'Aprovado').length;
  const draft = requestsData.filter(r => r.status === 'Draft').length;
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statDraft').textContent = draft;
}

// Render table
function renderTable() {
  const container = document.getElementById('requestsTable');
  const noData = document.getElementById('requestsNoData');
  
  if (requestsData.length === 0) {
    container.innerHTML = '';
    noData.style.display = 'grid';
    return;
  }
  
  noData.style.display = 'none';
  
  container.innerHTML = requestsData.map((request, index) => `
    <div class="table-grid" style="animation-delay: ${index * 0.05}s; cursor: pointer;" onclick="openViewRequestModal(${request.id})">
      <div title="${request.motivo}">${request.motivo}</div>
      <div>${request.partida}</div>
      <div>${request.destino}</div>
      <div>${request.data}</div>
      <div>${request.duracao}</div>
      <div>${request.viatura}</div>
      <div><span class="${getStatusClass(request.status)}">${request.status}</span></div>
    </div>
  `).join('');
}

// Get status class
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

// Search table
function searchTable() {
  const searchTerm = document.getElementById('searchRequests').value.toLowerCase();
  const rows = document.querySelectorAll('#requestsTable .table-grid');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// Sort table
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

// Open create modal
function openCreateRequestModal() {
  editingRequestId = null;
  document.getElementById('modalTitle').textContent = 'Novo Pedido de Deslocação';
  document.getElementById('createRequestForm').reset();
  resetTracker();
  
  // Set default values
  document.getElementById('horaPartida').value = '09';
  document.getElementById('minutoPartida').value = '00';
  document.getElementById('horaChegada').value = '18';
  document.getElementById('minutoChegada').value = '00';
  document.getElementById('dayCounterValue').textContent = '0 dias';
  
  // Clear intermediate locations
  document.getElementById('intermediateLocations').innerHTML = '';
  intermediateLocationCount = 0;
  
  const modal = document.getElementById('createRequestModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Close create modal
function closeCreateRequestModal() {
  const modal = document.getElementById('createRequestModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
  editingRequestId = null;
}

// Reset tracker
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

// Update day counter
function updateDayCounter() {
  const startDate = document.getElementById('dataPartida').value;
  const endDate = document.getElementById('dataChegada').value;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    document.getElementById('dayCounterValue').textContent = diffDays + ' dia' + (diffDays > 1 ? 's' : '');
  }
}

// Add intermediate location
function addIntermediateLocation() {
  intermediateLocationCount++;
  const container = document.getElementById('intermediateLocations');
  const letter = String.fromCharCode(65 + intermediateLocationCount); // B, C, D...
  
  const locationDiv = document.createElement('div');
  locationDiv.className = 'location-item';
  locationDiv.id = `intermediate-${intermediateLocationCount}`;
  locationDiv.innerHTML = `
    <div class="location-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">${letter}</div>
    <div class="location-connector"></div>
    <div class="location-content">
      <label>Local Intermédio</label>
      <input type="text" placeholder="Ex: Coimbra">
    </div>
    <div class="location-actions">
      <button type="button" class="btn-remove-location" onclick="removeIntermediateLocation(${intermediateLocationCount})" title="Remover">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
  
  container.appendChild(locationDiv);
  updateLocationLetters();
}

// Remove intermediate location
function removeIntermediateLocation(id) {
  const element = document.getElementById(`intermediate-${id}`);
  if (element) {
    element.remove();
    updateLocationLetters();
  }
}

// Update location letters
function updateLocationLetters() {
  const container = document.getElementById('intermediateLocations');
  const items = container.querySelectorAll('.location-item');
  
  items.forEach((item, index) => {
    const icon = item.querySelector('.location-icon');
    if (icon) {
      icon.textContent = String.fromCharCode(66 + index); // B, C, D...
    }
  });
}

// Handle form submit
function handleSubmitRequest(event) {
  event.preventDefault();
  
  const formData = {
    id: editingRequestId || Date.now(),
    motivo: document.getElementById('motivoDeslocacao').value,
    partida: document.getElementById('localPartida').value,
    destino: document.getElementById('localChegada').value,
    data: formatDateDisplay(document.getElementById('dataPartida').value),
    duracao: document.getElementById('dayCounterValue').textContent,
    viatura: document.getElementById('meioTransporte').options[document.getElementById('meioTransporte').selectedIndex].text,
    status: 'Em Aprovação',
    horaPartida: `${document.getElementById('horaPartida').value.padStart(2, '0')}:${document.getElementById('minutoPartida').value.padStart(2, '0')}`,
    horaChegada: `${document.getElementById('horaChegada').value.padStart(2, '0')}:${document.getElementById('minutoChegada').value.padStart(2, '0')}`,
    numeroColaboradores: document.getElementById('numeroColaboradores').value,
    justificacao: document.getElementById('observacoes').value || '-',
    locaisIntermedios: getIntermediateLocations() || '-'
  };
  
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

// Save as draft
function saveAsDraft() {
  const formData = {
    id: editingRequestId || Date.now(),
    motivo: document.getElementById('motivoDeslocacao').value || 'Rascunho',
    partida: document.getElementById('localPartida').value || '-',
    destino: document.getElementById('localChegada').value || '-',
    data: document.getElementById('dataPartida').value ? formatDateDisplay(document.getElementById('dataPartida').value) : '-',
    duracao: document.getElementById('dayCounterValue').textContent || '-',
    viatura: document.getElementById('meioTransporte').options[document.getElementById('meioTransporte').selectedIndex].text,
    status: 'Draft',
    horaPartida: `${(document.getElementById('horaPartida').value || '09').padStart(2, '0')}:${(document.getElementById('minutoPartida').value || '00').padStart(2, '0')}`,
    horaChegada: `${(document.getElementById('horaChegada').value || '18').padStart(2, '0')}:${(document.getElementById('minutoChegada').value || '00').padStart(2, '0')}`,
    numeroColaboradores: document.getElementById('numeroColaboradores').value || 1,
    justificacao: document.getElementById('observacoes').value || '-',
    locaisIntermedios: getIntermediateLocations() || '-'
  };
  
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

// Get intermediate locations
function getIntermediateLocations() {
  const container = document.getElementById('intermediateLocations');
  const inputs = container.querySelectorAll('input');
  const locations = [];
  
  inputs.forEach(input => {
    if (input.value.trim()) {
      locations.push(input.value.trim());
    }
  });
  
  return locations.join(', ');
}

// Format date for display
function formatDateDisplay(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT');
}

// Open view modal
function openViewRequestModal(id) {
  const request = requestsData.find(r => r.id === id);
  if (!request) return;
  
  const detailsContainer = document.getElementById('viewRequestDetails');
  detailsContainer.innerHTML = `
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Motivo</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.motivo}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Data</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.data}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Duração</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.duracao}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Hora de Partida</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.horaPartida}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Hora de Chegada</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.horaChegada}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Nº Colaboradores</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.numeroColaboradores}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Local de Partida</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.partida}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Locais Intermédios</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.locaisIntermedios}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Local de Chegada</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.destino}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Meio de Transporte</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.viatura}</div>
    </div>
    <div class="detail-item">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Estado</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;"><span class="${getStatusClass(request.status)}">${request.status}</span></div>
    </div>
    <div class="detail-item" style="grid-column: 1 / -1;">
      <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Justificação</div>
      <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${request.justificacao}</div>
    </div>
  `;
  
  updateViewTracker(request.status);
  
  const modal = document.getElementById('viewRequestModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Update view tracker
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

// Close view modal
function closeViewRequestModal() {
  const modal = document.getElementById('viewRequestModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// Show toast
function showToast(message, type = 'success') {
  // Use existing toast system if available
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }
  
  // Fallback toast
  const container = document.querySelector('.toast-container') || createToastContainer();
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

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Close modals on outside click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    if (e.target.id === 'createRequestModal') {
      closeCreateRequestModal();
    } else if (e.target.id === 'viewRequestModal') {
      closeViewRequestModal();
    }
  }
});

// Close modals on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCreateRequestModal();
    closeViewRequestModal();
  }
});
