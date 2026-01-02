/**
 * novo-pedido-deslocacao.js
 * Lógica para a página de criação/edição de pedidos de deslocação
 * Compatível com Power Pages
 */

// ====================
// CONFIGURAÇÃO GLOBAL
// ====================
let pontoIntermedioCount = 0;
let transportCount = 0;
let uploadedFiles = [];
let lastSavedData = null;
let autoSaveTimer = null;
let currentUser = null;
let colaboradoresList = [];
let selectedColaboradores = []; // Colaboradores escolhidos na secção Colaboradores

// Tipos de transporte permitidos (sem Comboio - está dentro de Transporte Público)
const TIPOS_TRANSPORTE_PERMITIDOS = [
  { id: 'frota', codigo: 'frota', nome: 'Viatura EMRP (Frota)', requer_motorista: true },
  { id: 'publico', codigo: 'publico', nome: 'Transporte Público (Metro, Autocarro, Comboio, etc.)' },
  { id: 'aviao', codigo: 'aviao', nome: 'Avião' },
  { id: 'taxi', codigo: 'taxi', nome: 'Táxi / TVDE' }
];

// ====================
// INICIALIZAÇÃO
// ====================
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
});

async function initializePage() {
  try {
    // Inicializar AuthService e obter utilizador atual
    await AuthService.init();
    currentUser = await AuthService.getCurrentUser();
    
    // Carregar lista de colaboradores
    await loadColaboradores();
    
    // Configurar visibilidade baseada em roles
    setupRoleBasedVisibility();
    
    // Configurar search selects
    setupSearchSelects();
    
    // Verificar se é edição
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('id');
    
    if (pedidoId) {
      await loadPedido(pedidoId);
    } else {
      // Novo pedido - inicializar estado padrão
      document.getElementById('pedidoEstado').value = 'Rascunho';
      updateProcessTracker('Rascunho');
      updateCollaboratorsList();
      addTransportMethod(); // Adicionar um meio de transporte por defeito
    }
    
    // Configurar auto-save
    setupAutoSave();
    
    // Event listeners para atualização de alojamento
    document.getElementById('localOrigem')?.addEventListener('input', updateAlojamentoOptions);
    document.getElementById('localDestino')?.addEventListener('input', updateAlojamentoOptions);
    
    // Atualizar alojamento inicial
    updateAlojamentoOptions();
    
    // Form submit handler
    document.getElementById('pedidoForm')?.addEventListener('submit', handleSubmit);
    
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.search-select-wrapper')) {
        document.querySelectorAll('.search-dropdown').forEach(d => d.classList.remove('active'));
      }
    });
    
  } catch (error) {
    console.error('[novo-pedido-deslocacao] Erro na inicialização:', error);
  }
}

// ====================
// CARREGAR COLABORADORES
// ====================
async function loadColaboradores() {
  try {
    colaboradoresList = await AuthService.getColaboradoresComRoles();
  } catch (error) {
    console.error('[novo-pedido-deslocacao] Erro ao carregar colaboradores:', error);
  }
}

// ====================
// SEARCH SELECT (Dropdowns com pesquisa)
// ====================
function setupSearchSelects() {
  // Setup para "Submeter em nome de"
  const submitOnBehalfSearch = document.getElementById('submitOnBehalfSearch');
  const submitOnBehalfDropdown = document.getElementById('submitOnBehalfDropdown');
  const submitOnBehalfHidden = document.getElementById('submitOnBehalf');
  
  if (submitOnBehalfSearch && submitOnBehalfDropdown) {
    setupSearchSelect(submitOnBehalfSearch, submitOnBehalfDropdown, submitOnBehalfHidden, colaboradoresList);
  }
}

function setupSearchSelect(searchInput, dropdown, hiddenInput, items) {
  // Mostrar dropdown ao focar
  searchInput.addEventListener('focus', function() {
    renderSearchDropdown(dropdown, items, searchInput.value, hiddenInput);
    dropdown.classList.add('active');
  });
  
  // Filtrar ao digitar
  searchInput.addEventListener('input', function() {
    renderSearchDropdown(dropdown, items, searchInput.value, hiddenInput);
    dropdown.classList.add('active');
  });
}

function renderSearchDropdown(dropdown, items, filter, hiddenInput) {
  const filterLower = (filter || '').toLowerCase();
  const filtered = items.filter(item => 
    item.nome.toLowerCase().includes(filterLower)
  );
  
  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="search-dropdown-empty">Nenhum colaborador encontrado</div>';
    return;
  }
  
  dropdown.innerHTML = filtered.map(item => `
    <div class="search-dropdown-item ${hiddenInput.value === item.id ? 'selected' : ''}" 
         data-id="${item.id}" data-nome="${item.nome}">
      ${item.nome}
    </div>
  `).join('');
  
  // Click handlers
  dropdown.querySelectorAll('.search-dropdown-item').forEach(el => {
    el.addEventListener('click', function() {
      const id = this.dataset.id;
      const nome = this.dataset.nome;
      
      hiddenInput.value = id;
      const searchInput = dropdown.previousElementSibling.previousElementSibling || 
                          dropdown.parentElement.querySelector('.search-input');
      if (searchInput) searchInput.value = nome;
      
      dropdown.classList.remove('active');
    });
  });
}

// ====================
// VISIBILIDADE BASEADA EM ROLES
// ====================
function setupRoleBasedVisibility() {
  // "Submeter em nome de" - só visível para AFR-RH ou Secretariado
  const submitOnBehalfContainer = document.getElementById('submitOnBehalfContainer');
  if (submitOnBehalfContainer && currentUser) {
    const canSubmitOnBehalf = AuthService.isAFRRH(currentUser) || AuthService.isSecretariado(currentUser) || AuthService.isAdmin(currentUser);
    submitOnBehalfContainer.style.display = canSubmitOnBehalf ? 'block' : 'none';
  }
}

// ====================
// CONTADOR DE DIAS
// ====================
function updateDayCounter() {
  const dataPartida = document.getElementById('dataPartida')?.value;
  const dataChegada = document.getElementById('dataChegada')?.value;
  
  if (dataPartida && dataChegada) {
    const partida = new Date(dataPartida);
    const chegada = new Date(dataChegada);
    
    const diffTime = Math.abs(chegada - partida);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    document.getElementById('dayCounterValue').textContent = diffDays > 0 ? diffDays : 0;
  }
}

// ====================
// COLABORADORES
// ====================
function adjustCollaborators(delta) {
  const input = document.getElementById('numColaboradores');
  let value = parseInt(input.value) || 1;
  value = Math.max(1, Math.min(20, value + delta));
  input.value = value;
  updateCollaboratorsList();
}

function updateCollaboratorsList() {
  const count = parseInt(document.getElementById('numColaboradores').value) || 1;
  const container = document.getElementById('colaboradoresContainer');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'colaborador-item';
    div.innerHTML = `
      <div class="colaborador-header">
        <span class="colaborador-number">${i + 1}</span>
        <span class="colaborador-label">Colaborador ${i === 0 ? '(Responsável)' : ''}</span>
      </div>
      <div class="search-select-wrapper">
        <input type="text" class="form-input search-input colaborador-search" 
               id="colaboradorSearch_${i}" 
               placeholder="Pesquisar colaborador..." 
               autocomplete="off"
               ${i === 0 ? 'required' : ''}>
        <input type="hidden" class="colaborador-hidden" id="colaborador_${i}" value="">
        <div class="search-dropdown" id="colaboradorDropdown_${i}"></div>
      </div>
    `;
    container.appendChild(div);
    
    // Setup search select para este colaborador
    const searchInput = document.getElementById(`colaboradorSearch_${i}`);
    const dropdown = document.getElementById(`colaboradorDropdown_${i}`);
    const hiddenInput = document.getElementById(`colaborador_${i}`);
    
    setupSearchSelect(searchInput, dropdown, hiddenInput, colaboradoresList);
    
    // Ao selecionar, atualizar lista de colaboradores selecionados
    hiddenInput.addEventListener('change', updateSelectedColaboradores);
    searchInput.addEventListener('blur', () => {
      setTimeout(updateSelectedColaboradores, 200);
    });
  }
}

function updateSelectedColaboradores() {
  selectedColaboradores = [];
  const hiddenInputs = document.querySelectorAll('.colaborador-hidden');
  hiddenInputs.forEach(input => {
    if (input.value) {
      const colab = colaboradoresList.find(c => c.id === input.value);
      if (colab) {
        selectedColaboradores.push(colab);
      }
    }
  });
  
  // Atualizar dropdowns de condutores nos transportes
  updateCondutorDropdowns();
}

function updateCondutorDropdowns() {
  // Atualizar todos os dropdowns de condutor para mostrar apenas colaboradores selecionados
  const condutorSelects = document.querySelectorAll('[id^="frotaCondutor_"]');
  condutorSelects.forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Selecionar Condutor --</option>';
    
    selectedColaboradores.forEach(colab => {
      const option = document.createElement('option');
      option.value = colab.id;
      option.textContent = colab.nome;
      if (colab.id === currentValue) option.selected = true;
      select.appendChild(option);
    });
  });
}

// ====================
// PONTOS INTERMÉDIOS
// ====================
function addPontoIntermedio() {
  pontoIntermedioCount++;
  const container = document.getElementById('pontosIntermediosContainer');
  
  const div = document.createElement('div');
  div.className = 'route-point route-intermediate';
  div.id = `pontoIntermedio_${pontoIntermedioCount}`;
  div.innerHTML = `
    <div class="route-marker">
      <div class="route-marker-icon intermediate">${pontoIntermedioCount}</div>
      <div class="route-connector"></div>
    </div>
    <div class="route-content">
      <div class="route-header">
        <label class="form-label">Ponto Intermédio ${pontoIntermedioCount}</label>
        <button type="button" class="btn-remove-point" onclick="removePontoIntermedio(${pontoIntermedioCount})" title="Remover ponto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <input type="text" class="form-input ponto-intermedio-input" id="pontoIntermedio_input_${pontoIntermedioCount}" placeholder="Ex: Coimbra, Paragem técnica" onchange="updateAlojamentoOptions()">
    </div>
  `;
  
  container.appendChild(div);
  updateIntermediateMarkers();
  updateAlojamentoOptions();
}

function removePontoIntermedio(id) {
  const element = document.getElementById(`pontoIntermedio_${id}`);
  if (element) {
    element.remove();
    updateIntermediateMarkers();
    updateAlojamentoOptions();
  }
}

function updateIntermediateMarkers() {
  const container = document.getElementById('pontosIntermediosContainer');
  const points = container.querySelectorAll('.route-point');
  
  points.forEach((point, index) => {
    const marker = point.querySelector('.route-marker-icon');
    const label = point.querySelector('.form-label');
    if (marker) marker.textContent = index + 1;
    if (label) label.textContent = `Ponto Intermédio ${index + 1}`;
  });
}

function getPontosIntermedios() {
  const container = document.getElementById('pontosIntermediosContainer');
  const inputs = container.querySelectorAll('.ponto-intermedio-input');
  const pontos = [];
  
  inputs.forEach(input => {
    const value = input.value.trim();
    if (value) {
      pontos.push(value);
    }
  });
  
  return pontos;
}

// ====================
// MEIOS DE TRANSPORTE
// ====================
function addTransportMethod() {
  transportCount++;
  const container = document.getElementById('transportesContainer');
  
  const div = document.createElement('div');
  div.className = 'transport-item';
  div.id = `transport_${transportCount}`;
  
  let optionsHtml = '<option value="">-- Selecionar --</option>';
  TIPOS_TRANSPORTE_PERMITIDOS.forEach(tipo => {
    optionsHtml += `<option value="${tipo.codigo}">${tipo.nome}</option>`;
  });
  
  div.innerHTML = `
    <div class="transport-header">
      <span class="transport-number">${transportCount}</span>
      <span class="transport-title">Meio de Transporte</span>
      <button type="button" class="btn-remove-transport" onclick="removeTransportMethod(${transportCount})" title="Remover">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="transport-body">
      <div class="form-group">
        <label class="form-label">Tipo de Transporte <span class="required">*</span></label>
        <select class="form-select transport-tipo-select" id="transportTipo_${transportCount}" required onchange="onTransportTypeChange(${transportCount})">
          ${optionsHtml}
        </select>
      </div>
      
      <!-- Campos específicos para Viatura EMRP (Frota) -->
      <div class="frota-fields" id="frotaFields_${transportCount}" style="display: none;">
        <!-- Responsável pela Condução - esconde quando motorista é selecionado -->
        <div class="form-group" id="condutorGroup_${transportCount}">
          <label class="form-label">Responsável pela Condução <span class="required">*</span></label>
          <select class="form-select" id="frotaCondutor_${transportCount}">
            <option value="">-- Selecionar Condutor --</option>
          </select>
          <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">Apenas colaboradores selecionados acima</small>
        </div>
        
        <!-- Opção de Motorista - só para Viatura EMRP (Frota) -->
        <div class="motorista-trajeto-section">
          <label class="checkbox-label">
            <input type="checkbox" id="solicitarMotorista_${transportCount}" onchange="onMotoristaChange(${transportCount})">
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">Solicitar motorista para este trajeto</span>
          </label>
          <div class="form-group motorista-obs-group" id="motoristaObsGroup_${transportCount}" style="margin-top: 8px; display: none;">
            <textarea class="form-textarea" id="motoristaObs_${transportCount}" rows="2" placeholder="Observações para o motorista neste trajeto..."></textarea>
          </div>
        </div>
      </div>
      
      <!-- Campo de Observações (sempre visível quando tipo selecionado) -->
      <div class="transport-observacoes-section" id="transportObservacoes_${transportCount}" style="display: none;">
        <div class="form-group">
          <label class="form-label">Observações do Transporte</label>
          <textarea class="form-textarea transport-obs" id="transportObs_${transportCount}" rows="2" placeholder="Detalhes adicionais sobre este meio de transporte (ex: número de voo, bilhete, horário)..."></textarea>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(div);
  updateTransportNumbers();
  updateCondutorDropdowns();
}

function removeTransportMethod(id) {
  const element = document.getElementById(`transport_${id}`);
  if (element) {
    element.remove();
    updateTransportNumbers();
  }
}

function updateTransportNumbers() {
  const container = document.getElementById('transportesContainer');
  const items = container.querySelectorAll('.transport-item');
  
  items.forEach((item, index) => {
    const number = item.querySelector('.transport-number');
    if (number) number.textContent = index + 1;
  });
}

function onTransportTypeChange(id) {
  const select = document.getElementById(`transportTipo_${id}`);
  const tipo = select.value;
  
  const frotaFields = document.getElementById(`frotaFields_${id}`);
  const observacoesSection = document.getElementById(`transportObservacoes_${id}`);
  
  // Mostrar/esconder campos específicos para Viatura EMRP (Frota)
  if (frotaFields) {
    frotaFields.style.display = tipo === 'frota' ? 'block' : 'none';
  }
  
  // Mostrar observações quando tipo selecionado
  if (observacoesSection) {
    observacoesSection.style.display = tipo ? 'block' : 'none';
  }
  
  // Reset motorista checkbox
  const motoristaCheckbox = document.getElementById(`solicitarMotorista_${id}`);
  if (motoristaCheckbox) {
    motoristaCheckbox.checked = false;
    onMotoristaChange(id);
  }
}

function onMotoristaChange(id) {
  const motoristaCheckbox = document.getElementById(`solicitarMotorista_${id}`);
  const condutorGroup = document.getElementById(`condutorGroup_${id}`);
  const motoristaObsGroup = document.getElementById(`motoristaObsGroup_${id}`);
  
  if (motoristaCheckbox.checked) {
    // Esconder campo de condutor quando motorista é selecionado
    if (condutorGroup) condutorGroup.style.display = 'none';
    if (motoristaObsGroup) motoristaObsGroup.style.display = 'block';
  } else {
    // Mostrar campo de condutor
    if (condutorGroup) condutorGroup.style.display = 'block';
    if (motoristaObsGroup) motoristaObsGroup.style.display = 'none';
  }
}

// ====================
// NECESSIDADE DE ALOJAMENTO
// ====================
function updateAlojamentoOptions() {
  const container = document.getElementById('alojamentoContainer');
  if (!container) return;
  
  // Obter todos os pontos do percurso
  const pontosIntermedios = getPontosIntermedios();
  const destino = document.getElementById('localDestino')?.value?.trim() || '';
  
  // Criar lista de pontos que podem ter alojamento (intermédios + destino)
  const pontosAlojamento = [...pontosIntermedios];
  if (destino) pontosAlojamento.push(destino);
  
  if (pontosAlojamento.length === 0) {
    container.innerHTML = '<p class="alojamento-hint">As opções de alojamento serão mostradas com base nos pontos do percurso definidos.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  pontosAlojamento.forEach((ponto, index) => {
    const isDestino = destino && index === pontosAlojamento.length - 1 && ponto === destino;
    const tipo = isDestino ? 'Destino' : `Ponto Intermédio ${index + 1}`;
    
    const div = document.createElement('div');
    div.className = 'alojamento-item';
    div.innerHTML = `
      <div class="alojamento-header">
        <label class="checkbox-label">
          <input type="checkbox" class="alojamento-checkbox" id="alojamento_${index}" onchange="toggleAlojamentoFields(${index})">
          <span class="checkbox-custom"></span>
          <span class="checkbox-text">
            <span class="alojamento-local">${ponto}</span>
            <span class="alojamento-tipo">(${tipo})</span>
          </span>
        </label>
      </div>
      <div class="alojamento-fields" id="alojamentoFields_${index}" style="display: none;">
        <div class="alojamento-dates">
          <div class="form-group">
            <label class="form-label">Data Check-in</label>
            <input type="date" class="form-input" id="alojamentoCheckin_${index}">
          </div>
          <div class="form-group">
            <label class="form-label">Data Check-out</label>
            <input type="date" class="form-input" id="alojamentoCheckout_${index}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observações sobre alojamento</label>
          <textarea class="form-textarea" id="alojamentoObs_${index}" rows="2" placeholder="Preferências de hotel, número de noites, etc..."></textarea>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function toggleAlojamentoFields(index) {
  const checkbox = document.getElementById(`alojamento_${index}`);
  const fieldsContainer = document.getElementById(`alojamentoFields_${index}`);
  
  if (fieldsContainer) {
    fieldsContainer.style.display = checkbox.checked ? 'block' : 'none';
  }
}

// ====================
// UPLOAD DE FICHEIROS
// ====================
function handleFileSelect(event) {
  const files = event.target.files;
  
  Array.from(files).forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`Ficheiro "${file.name}" excede o limite de tamanho`, 'error');
      return;
    }
    
    if (!uploadedFiles.find(f => f.name === file.name)) {
      uploadedFiles.push(file);
      renderFileList();
    }
  });
  
  event.target.value = '';
}

function renderFileList() {
  const fileList = document.getElementById('fileList');
  if (!fileList) return;
  
  if (uploadedFiles.length === 0) {
    fileList.innerHTML = '';
    return;
  }
  
  fileList.innerHTML = uploadedFiles.map((file, index) => `
    <div class="file-item">
      <div class="file-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span class="file-name">${file.name}</span>
        <span class="file-size">(${formatFileSize(file.size)})</span>
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
  uploadedFiles.splice(index, 1);
  renderFileList();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ====================
// PROCESS TRACKER
// ====================
function updateProcessTracker(estado) {
  const step1 = document.getElementById('processStep1');
  const step2 = document.getElementById('processStep2');
  const step3 = document.getElementById('processStep3');
  
  [step1, step2, step3].forEach(step => {
    if (step) {
      step.querySelector('.step-circle')?.classList.remove('active', 'completed', 'rejected');
    }
  });
  
  switch (estado) {
    case 'Rascunho':
      step1?.querySelector('.step-circle')?.classList.add('active');
      break;
    case 'Submetido':
    case 'Em Aprovação':
    case 'Pendente Aprovação':
      step1?.querySelector('.step-circle')?.classList.add('completed');
      step2?.querySelector('.step-circle')?.classList.add('active');
      break;
    case 'Aprovado':
    case 'Aprovada':
      step1?.querySelector('.step-circle')?.classList.add('completed');
      step2?.querySelector('.step-circle')?.classList.add('completed');
      step3?.querySelector('.step-circle')?.classList.add('completed');
      break;
    case 'Rejeitado':
    case 'Rejeitada':
      step1?.querySelector('.step-circle')?.classList.add('completed');
      step2?.querySelector('.step-circle')?.classList.add('rejected');
      break;
  }
  
  const badge = document.getElementById('estadoBadge');
  if (badge) {
    badge.textContent = estado;
    badge.className = 'estado-badge estado-' + estado.toLowerCase().replace(/\s/g, '-');
  }
}

// ====================
// AUTO-SAVE
// ====================
function setupAutoSave() {
  const form = document.getElementById('pedidoForm');
  if (!form) return;
  
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('change', scheduleAutoSave);
    input.addEventListener('input', scheduleAutoSave);
  });
}

function scheduleAutoSave() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  autoSaveTimer = setTimeout(() => {
    const pedidoId = document.getElementById('pedidoId')?.value;
    if (pedidoId) {
      autoSaveDraft();
    }
  }, 30000);
}

async function autoSaveDraft() {
  const currentData = collectFormData();
  
  if (JSON.stringify(currentData) === JSON.stringify(lastSavedData)) {
    return;
  }
  
  try {
    await saveDraft(currentData, true);
  } catch (error) {
    console.error('Erro no auto-save:', error);
  }
}

// ====================
// GUARDAR RASCUNHO
// ====================
async function gravarRascunho() {
  const formData = collectFormData();
  await saveDraft(formData, false);
}

async function saveDraft(formData, isAutoSave = false) {
  try {
    showLoadingOverlay(isAutoSave ? '' : 'A guardar rascunho...');
    
    formData.estado = 'Rascunho';
    
    const pedidoId = document.getElementById('pedidoId')?.value;
    
    let result;
    if (pedidoId) {
      result = await saveDeslocacao(pedidoId, formData);
    } else {
      result = await createDeslocacao(formData);
      if (result && result.id) {
        document.getElementById('pedidoId').value = result.id;
        const newUrl = `${window.location.pathname}?id=${result.id}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
    
    lastSavedData = formData;
    updateUltimaGravacao();
    
    hideLoadingOverlay();
    if (!isAutoSave) {
      showToast('Rascunho guardado com sucesso', 'success');
    }
    
    return result;
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('Erro ao guardar rascunho:', error);
    if (!isAutoSave) {
      showToast('Erro ao guardar rascunho: ' + error.message, 'error');
    }
    throw error;
  }
}

function updateUltimaGravacao() {
  const elemento = document.getElementById('ultimaGravacao');
  if (elemento) {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    elemento.textContent = `Última gravação: ${horas}:${minutos}`;
  }
}

// ====================
// FUNÇÕES DE PERSISTÊNCIA (Supabase)
// ====================
async function createDeslocacao(data) {
  const deslocacaoData = {
    motivo: data.motivo,
    origem: data.local_origem,
    destino: data.local_destino,
    ponto_intermedio: data.pontos_intermedios.length > 0 ? data.pontos_intermedios[0] : null,
    pontos_intermedios: data.pontos_intermedios,
    data_partida: data.data_partida,
    hora_partida: data.hora_partida,
    data_chegada: data.data_chegada,
    hora_chegada: data.hora_chegada,
    observacoes: data.observacoes,
    estado: data.estado || 'Rascunho',
    criado_por: currentUser?.id || null,
    submetido_em_nome_de: data.submit_on_behalf || null,
    num_colaboradores: data.num_colaboradores,
    transportes: data.transportes
  };
  
  const url = `${DataService.getBaseUrl()}/rest/v1/deslocacoes`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...DataService.getHeaders(),
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(deslocacaoData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  
  const results = await response.json();
  const deslocacao = Array.isArray(results) ? results[0] : results;
  
  // Guardar colaboradores
  if (data.colaboradores && data.colaboradores.length > 0) {
    await saveDeslocacaoColaboradores(deslocacao.id, data.colaboradores);
  }
  
  // Guardar alojamentos
  if (data.alojamentos && data.alojamentos.length > 0) {
    await saveDeslocacaoAlojamentos(deslocacao.id, data.alojamentos);
  }
  
  return deslocacao;
}

async function saveDeslocacao(id, data) {
  const deslocacaoData = {
    motivo: data.motivo,
    origem: data.local_origem,
    destino: data.local_destino,
    ponto_intermedio: data.pontos_intermedios.length > 0 ? data.pontos_intermedios[0] : null,
    pontos_intermedios: data.pontos_intermedios,
    data_partida: data.data_partida,
    hora_partida: data.hora_partida,
    data_chegada: data.data_chegada,
    hora_chegada: data.hora_chegada,
    observacoes: data.observacoes,
    estado: data.estado || 'Rascunho',
    submetido_em_nome_de: data.submit_on_behalf || null,
    num_colaboradores: data.num_colaboradores,
    transportes: data.transportes,
    updated_at: new Date().toISOString()
  };
  
  const url = `${DataService.getBaseUrl()}/rest/v1/deslocacoes?id=eq.${id}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...DataService.getHeaders(),
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(deslocacaoData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  
  // Atualizar colaboradores
  await saveDeslocacaoColaboradores(id, data.colaboradores);
  
  // Atualizar alojamentos
  await saveDeslocacaoAlojamentos(id, data.alojamentos);
  
  const results = await response.json();
  return Array.isArray(results) ? results[0] : results;
}

async function saveDeslocacaoColaboradores(deslocacaoId, colaboradores) {
  // Apagar existentes
  const deleteUrl = `${DataService.getBaseUrl()}/rest/v1/deslocacao_colaboradores?deslocacao_id=eq.${deslocacaoId}`;
  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: DataService.getHeaders()
  });
  
  // Inserir novos
  if (colaboradores && colaboradores.length > 0) {
    const insertUrl = `${DataService.getBaseUrl()}/rest/v1/deslocacao_colaboradores`;
    const records = colaboradores.map((colabId, index) => ({
      deslocacao_id: deslocacaoId,
      colaborador_id: colabId,
      ordem: index + 1
    }));
    
    await fetch(insertUrl, {
      method: 'POST',
      headers: DataService.getHeaders(),
      body: JSON.stringify(records)
    });
  }
}

async function saveDeslocacaoAlojamentos(deslocacaoId, alojamentos) {
  // Apagar existentes
  const deleteUrl = `${DataService.getBaseUrl()}/rest/v1/deslocacao_alojamentos?deslocacao_id=eq.${deslocacaoId}`;
  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: DataService.getHeaders()
  });
  
  // Inserir novos
  if (alojamentos && alojamentos.length > 0) {
    const insertUrl = `${DataService.getBaseUrl()}/rest/v1/deslocacao_alojamentos`;
    const records = alojamentos.map(aloj => ({
      deslocacao_id: deslocacaoId,
      local: aloj.local,
      data_checkin: aloj.data_checkin || null,
      data_checkout: aloj.data_checkout || null,
      observacoes: aloj.observacoes || null
    }));
    
    await fetch(insertUrl, {
      method: 'POST',
      headers: DataService.getHeaders(),
      body: JSON.stringify(records)
    });
  }
}

// ====================
// SUBMETER PEDIDO
// ====================
async function handleSubmit(event) {
  event.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  try {
    showLoadingOverlay('A submeter pedido...');
    
    const formData = collectFormData();
    formData.estado = 'Pendente Aprovação';
    
    const pedidoId = document.getElementById('pedidoId')?.value;
    
    if (pedidoId) {
      await saveDeslocacao(pedidoId, formData);
    } else {
      await createDeslocacao(formData);
    }
    
    hideLoadingOverlay();
    showToast('Pedido submetido com sucesso!', 'success');
    
    setTimeout(() => {
      window.location.href = document.querySelector('a.btn-voltar')?.href || '/deslocacoes';
    }, 1500);
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('Erro ao submeter:', error);
    showToast('Erro ao submeter pedido: ' + error.message, 'error');
  }
}

function validateForm() {
  const form = document.getElementById('pedidoForm');
  let isValid = true;
  
  // Validar campos obrigatórios de texto
  const requiredInputs = form.querySelectorAll('input[required]:not([type="hidden"]), textarea[required]');
  requiredInputs.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  // Validar datas
  const dataPartida = document.getElementById('dataPartida');
  const dataChegada = document.getElementById('dataChegada');
  
  if (dataPartida.value && dataChegada.value) {
    if (new Date(dataChegada.value) < new Date(dataPartida.value)) {
      showToast('Data de chegada não pode ser anterior à data de partida', 'error');
      isValid = false;
    }
  }
  
  // Validar pelo menos um meio de transporte
  const transportContainer = document.getElementById('transportesContainer');
  const transportItems = transportContainer.querySelectorAll('.transport-item');
  
  if (transportItems.length === 0) {
    showToast('Deve adicionar pelo menos um meio de transporte', 'error');
    isValid = false;
  }
  
  let hasTransportSelected = false;
  transportItems.forEach(item => {
    const select = item.querySelector('.transport-tipo-select');
    if (select && select.value) {
      hasTransportSelected = true;
    }
  });
  
  if (!hasTransportSelected) {
    showToast('Deve selecionar o tipo de pelo menos um meio de transporte', 'error');
    isValid = false;
  }
  
  if (!isValid) {
    showToast('Por favor, preencha todos os campos obrigatórios', 'error');
  }
  
  return isValid;
}

// ====================
// RECOLHER DADOS DO FORMULÁRIO
// ====================
function collectFormData() {
  const data = {
    num_colaboradores: parseInt(document.getElementById('numColaboradores')?.value) || 1,
    submit_on_behalf: document.getElementById('submitOnBehalf')?.value || null,
    colaboradores: [],
    
    motivo: document.getElementById('motivoDeslocacao')?.value || '',
    data_partida: document.getElementById('dataPartida')?.value || null,
    data_chegada: document.getElementById('dataChegada')?.value || null,
    hora_partida: `${document.getElementById('horaPartida')?.value || '09'}:${document.getElementById('minutoPartida')?.value || '00'}`,
    hora_chegada: `${document.getElementById('horaChegada')?.value || '18'}:${document.getElementById('minutoChegada')?.value || '00'}`,
    
    local_origem: document.getElementById('localOrigem')?.value || '',
    local_destino: document.getElementById('localDestino')?.value || '',
    pontos_intermedios: getPontosIntermedios(),
    
    transportes: [],
    alojamentos: [],
    observacoes: document.getElementById('observacoes')?.value || '',
    estado: document.getElementById('pedidoEstado')?.value || 'Rascunho'
  };
  
  // Recolher colaboradores
  const numColab = data.num_colaboradores;
  for (let i = 0; i < numColab; i++) {
    const hiddenInput = document.getElementById(`colaborador_${i}`);
    if (hiddenInput && hiddenInput.value) {
      data.colaboradores.push(hiddenInput.value);
    }
  }
  
  // Recolher transportes
  const transportContainer = document.getElementById('transportesContainer');
  const transportItems = transportContainer.querySelectorAll('.transport-item');
  
  transportItems.forEach((item) => {
    const id = item.id.replace('transport_', '');
    const tipo = document.getElementById(`transportTipo_${id}`)?.value;
    
    if (tipo) {
      const transportData = {
        tipo_codigo: tipo,
        observacoes: document.getElementById(`transportObs_${id}`)?.value || ''
      };
      
      if (tipo === 'frota') {
        const solicitarMotorista = document.getElementById(`solicitarMotorista_${id}`)?.checked || false;
        transportData.solicitar_motorista = solicitarMotorista;
        
        if (solicitarMotorista) {
          transportData.motorista_obs = document.getElementById(`motoristaObs_${id}`)?.value || '';
        } else {
          transportData.condutor = document.getElementById(`frotaCondutor_${id}`)?.value || '';
        }
      }
      
      data.transportes.push(transportData);
    }
  });
  
  // Recolher alojamentos
  const alojamentoContainer = document.getElementById('alojamentoContainer');
  const alojamentoItems = alojamentoContainer.querySelectorAll('.alojamento-item');
  
  alojamentoItems.forEach((item, index) => {
    const checkbox = item.querySelector('.alojamento-checkbox');
    if (checkbox && checkbox.checked) {
      const local = item.querySelector('.alojamento-local')?.textContent || '';
      const checkin = document.getElementById(`alojamentoCheckin_${index}`)?.value || null;
      const checkout = document.getElementById(`alojamentoCheckout_${index}`)?.value || null;
      const obs = document.getElementById(`alojamentoObs_${index}`)?.value || '';
      
      data.alojamentos.push({
        local: local,
        data_checkin: checkin,
        data_checkout: checkout,
        observacoes: obs
      });
    }
  });
  
  return data;
}

// ====================
// CARREGAR PEDIDO (EDIÇÃO)
// ====================
async function loadPedido(pedidoId) {
  try {
    showLoadingOverlay('A carregar pedido...');
    
    // Carregar deslocação
    const url = `${DataService.getBaseUrl()}/rest/v1/deslocacoes?id=eq.${pedidoId}`;
    const response = await fetch(url, { headers: DataService.getHeaders() });
    const results = await response.json();
    const pedido = results[0];
    
    if (!pedido) {
      throw new Error('Pedido não encontrado');
    }
    
    // Preencher campos
    document.getElementById('pedidoId').value = pedidoId;
    document.getElementById('pedidoEstado').value = pedido.estado || 'Rascunho';
    
    const titulo = document.getElementById('pedidoTitulo');
    if (titulo) {
      titulo.textContent = pedido.estado === 'Rascunho' ? 'Editar Rascunho' : 'Visualizar Pedido';
    }
    
    const numeroContainer = document.getElementById('pedidoNumero');
    const numeroValor = document.getElementById('numeroValor');
    if (numeroContainer && numeroValor) {
      numeroContainer.style.display = 'flex';
      numeroValor.textContent = pedidoId.substring(0, 8).toUpperCase();
    }
    
    document.getElementById('motivoDeslocacao').value = pedido.motivo || '';
    document.getElementById('dataPartida').value = pedido.data_partida || '';
    document.getElementById('dataChegada').value = pedido.data_chegada || '';
    
    if (pedido.hora_partida) {
      const [h, m] = pedido.hora_partida.split(':');
      document.getElementById('horaPartida').value = h;
      document.getElementById('minutoPartida').value = m;
    }
    
    if (pedido.hora_chegada) {
      const [h, m] = pedido.hora_chegada.split(':');
      document.getElementById('horaChegada').value = h;
      document.getElementById('minutoChegada').value = m;
    }
    
    document.getElementById('localOrigem').value = pedido.origem || '';
    document.getElementById('localDestino').value = pedido.destino || '';
    
    // Pontos intermédios
    const pontosIntermedios = pedido.pontos_intermedios || [];
    pontosIntermedios.forEach((ponto) => {
      addPontoIntermedio();
      const input = document.getElementById(`pontoIntermedio_input_${pontoIntermedioCount}`);
      if (input) input.value = ponto;
    });
    
    // Colaboradores
    if (pedido.num_colaboradores) {
      document.getElementById('numColaboradores').value = pedido.num_colaboradores;
    }
    updateCollaboratorsList();
    
    // Carregar colaboradores da deslocação
    const colabUrl = `${DataService.getBaseUrl()}/rest/v1/deslocacao_colaboradores?deslocacao_id=eq.${pedidoId}&order=ordem`;
    const colabResponse = await fetch(colabUrl, { headers: DataService.getHeaders() });
    const colabResults = await colabResponse.json();
    
    colabResults.forEach((dc, index) => {
      const hiddenInput = document.getElementById(`colaborador_${index}`);
      const searchInput = document.getElementById(`colaboradorSearch_${index}`);
      if (hiddenInput) {
        hiddenInput.value = dc.colaborador_id;
        const colab = colaboradoresList.find(c => c.id === dc.colaborador_id);
        if (colab && searchInput) {
          searchInput.value = colab.nome;
        }
      }
    });
    
    updateSelectedColaboradores();
    
    // Transportes
    const transportesContainer = document.getElementById('transportesContainer');
    transportesContainer.innerHTML = '';
    transportCount = 0;
    
    const transportes = pedido.transportes || [];
    if (transportes.length > 0) {
      transportes.forEach(transporte => {
        addTransportMethod();
        const id = transportCount;
        document.getElementById(`transportTipo_${id}`).value = transporte.tipo_codigo;
        onTransportTypeChange(id);
        
        if (transporte.tipo_codigo === 'frota') {
          if (transporte.solicitar_motorista) {
            document.getElementById(`solicitarMotorista_${id}`).checked = true;
            onMotoristaChange(id);
            document.getElementById(`motoristaObs_${id}`).value = transporte.motorista_obs || '';
          } else {
            document.getElementById(`frotaCondutor_${id}`).value = transporte.condutor || '';
          }
        }
        
        document.getElementById(`transportObs_${id}`).value = transporte.observacoes || '';
      });
    } else {
      addTransportMethod();
    }
    
    document.getElementById('observacoes').value = pedido.observacoes || '';
    
    updateDayCounter();
    updateProcessTracker(pedido.estado || 'Rascunho');
    updateAlojamentoOptions();
    
    // Carregar alojamentos
    const alojUrl = `${DataService.getBaseUrl()}/rest/v1/deslocacao_alojamentos?deslocacao_id=eq.${pedidoId}`;
    const alojResponse = await fetch(alojUrl, { headers: DataService.getHeaders() });
    const alojResults = await alojResponse.json();
    
    setTimeout(() => {
      alojResults.forEach(aloj => {
        const items = document.querySelectorAll('.alojamento-item');
        items.forEach((item, index) => {
          const localText = item.querySelector('.alojamento-local')?.textContent;
          if (localText === aloj.local) {
            const checkbox = document.getElementById(`alojamento_${index}`);
            if (checkbox) {
              checkbox.checked = true;
              toggleAlojamentoFields(index);
              document.getElementById(`alojamentoCheckin_${index}`).value = aloj.data_checkin || '';
              document.getElementById(`alojamentoCheckout_${index}`).value = aloj.data_checkout || '';
              document.getElementById(`alojamentoObs_${index}`).value = aloj.observacoes || '';
            }
          }
        });
      });
    }, 100);
    
    lastSavedData = collectFormData();
    
    hideLoadingOverlay();
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('Erro ao carregar pedido:', error);
    showToast('Erro ao carregar pedido: ' + error.message, 'error');
  }
}

// ====================
// UTILITÁRIOS UI
// ====================
function showLoadingOverlay(message = 'A processar...') {
  let overlay = document.getElementById('loadingOverlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span class="loading-message">${message}</span>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector('.loading-message').textContent = message;
  }
  
  if (message) {
    overlay.style.display = 'flex';
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
