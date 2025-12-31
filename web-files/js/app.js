// === MODAL FUNCTIONS ===
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// === TOAST FUNCTION ===
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  const messageEl = toast.querySelector('.toast-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// === SUBMIT FUNCTIONS ===
function submitInventario() {
  closeModal('modalInventario');
  showToast('✅ Pedido de inventário submetido com sucesso! Será notificado quando for processado.', 'success');
}

function submitDeslocacao() {
  closeModal('modalDeslocacao');
  showToast('✅ Boletim de itinerário submetido com sucesso! Aguarda aprovação.', 'success');
}

function submitReembolso() {
  closeModal('modalReembolso');
  showToast('✅ Pedido de reembolso submetido com sucesso! Será processado nos próximos 5 dias úteis.', 'success');
}

function submitMedicina() {
  closeModal('modalMedicina');
  showToast('✅ Consulta agendada com sucesso! Receberá confirmação por email.', 'success');
}

function inscreverFormacao(nomeFormacao) {
  closeModal('modalFormacao');
  showToast(`✅ Inscrição na formação "${nomeFormacao}" efetuada com sucesso!`, 'success');
}

function verTodoInventario() {
  alert('📦 Ver Todo o Inventário\n\nSerá redirecionado para a página de Inventário com a lista completa de artigos atribuídos.\n\n(Será implementado na próxima fase)');
}

function verTodasDeslocacoes() {
  alert('🧭 Ver Todas as Deslocações\n\nSerá redirecionado para a página de Deslocações com o histórico completo de boletins de itinerário.\n\n(Será implementado na próxima fase)');
}

// Close modal with ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const openModalEl = document.querySelector('.modal-overlay.show');
    if (openModalEl) {
      closeModal(openModalEl.id);
    }
  }
});

// Close modal by clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
});
