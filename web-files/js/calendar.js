// === CALENDAR FUNCTIONALITY ===
let currentDate = new Date(2025, 11, 1); // December 2025
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Selected date for filtering
let selectedDate = null;

// Define events by type
const calendarEvents = {
  // Deslocações (green)
  '5-10-2025': 'deslocacao', '15-10-2025': 'deslocacao', '16-10-2025': 'deslocacao', '22-10-2025': 'deslocacao',
  '10-11-2025': 'deslocacao', '20-11-2025': 'deslocacao',
  
  // Medicina no Trabalho (blue)
  '28-11-2025': 'medicina', '10-0-2026': 'medicina',
  
  // Formações (orange)
  '15-0-2026': 'formacao', '16-0-2026': 'formacao', '17-0-2026': 'formacao',
  '22-0-2026': 'formacao', '23-0-2026': 'formacao',
  
  // Feriados (red)
  '1-0-2025': 'holiday', '25-11-2025': 'holiday', '1-0-2026': 'holiday'
};

// Define event details for the events panel
const eventDetails = [
  { date: '2025-10-24', day: 24, month: 'OUT', title: 'Entrevistas - Eng. Software', meta: '14:00 - 17:00 • 3 candidatos', color: '#3b82f6' },
  { date: '2025-10-25', day: 25, month: 'OUT', title: 'Onboarding - Marketing Team', meta: '09:00 - 12:00 • 2 novos colaboradores', color: '#10b981' },
  { date: '2025-10-28', day: 28, month: 'OUT', title: 'Revisão de Probatório', meta: '10:00 • Ana Silva - Financeiro', color: '#f59e0b' },
  { date: '2025-10-30', day: 30, month: 'OUT', title: 'Final - Designer UX/UI', meta: '15:00 • Decisão final', color: '#8b5cf6' },
  { date: '2025-11-02', day: 2, month: 'NOV', title: 'Triagem CVs - Gestor Produto', meta: 'Toda a manhã • 12 candidaturas', color: '#ec4899' },
  { date: '2025-11-05', day: 5, month: 'NOV', title: 'Fim de Probatório - Dev Team', meta: '16:00 • 2 colaboradores', color: '#06b6d4' },
  { date: '2025-11-15', day: 15, month: 'NOV', title: 'Formação Porto', meta: 'Deslocação • 640 km', color: '#00b276' },
  { date: '2025-11-16', day: 16, month: 'NOV', title: 'Formação Porto (cont.)', meta: 'Deslocação • Regresso', color: '#00b276' },
  { date: '2025-11-22', day: 22, month: 'NOV', title: 'Reunião Cliente - Coimbra', meta: 'Deslocação • 420 km', color: '#00b276' },
  { date: '2025-11-28', day: 28, month: 'NOV', title: 'Exame Medicina Trabalho', meta: '10:00 • Consulta periódica', color: '#3b82f6' },
  { date: '2025-12-10', day: 10, month: 'DEZ', title: 'Check-up Medicina Trabalho', meta: '14:30 • Exames periódicos', color: '#3b82f6' },
  { date: '2025-12-25', day: 25, month: 'DEZ', title: 'Natal', meta: 'Feriado Nacional', color: '#ef4444' },
  { date: '2026-01-01', day: 1, month: 'JAN', title: 'Ano Novo', meta: 'Feriado Nacional', color: '#ef4444' },
  { date: '2026-01-15', day: 15, month: 'JAN', title: 'Gestão de Projetos', meta: 'Formação • 3 dias', color: '#f59e0b' },
  { date: '2026-01-22', day: 22, month: 'JAN', title: 'Excel Avançado', meta: 'Formação • 2 dias', color: '#f59e0b' }
];

function generateCalendar(date, container) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  container.innerHTML = '';
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    container.appendChild(createDayElement(daysInPrevMonth - i, 'other-month', month - 1, year));
  }
  
  // Current month days
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const classes = [];
    const dateKey = `${day}-${month}-${year}`;
    
    // Check if today
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      classes.push('today');
    }
    
    // Check for events
    if (calendarEvents[dateKey]) {
      classes.push(calendarEvents[dateKey]);
    }
    
    // Check if selected
    if (selectedDate) {
      const selDate = new Date(selectedDate);
      if (day === selDate.getDate() && month === selDate.getMonth() && year === selDate.getFullYear()) {
        classes.push('selected');
      }
    }
    
    container.appendChild(createDayElement(day, classes.join(' '), month, year));
  }
  
  // Next month days
  const totalCells = container.children.length;
  const remainingCells = 42 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    container.appendChild(createDayElement(day, 'other-month', month + 1, year));
  }
}

function createDayElement(day, classes, month, year) {
  const p = document.createElement('p');
  p.textContent = day;
  p.className = `day-number ${classes}`;
  
  // Add click handler for non-other-month days
  if (!classes.includes('other-month')) {
    p.addEventListener('click', function() {
      handleDayClick(day, month, year);
    });
  }
  
  return p;
}

function handleDayClick(day, month, year) {
  // Create date string
  const clickedDate = new Date(year, month, day);
  const dateStr = clickedDate.toISOString().split('T')[0];
  
  // Toggle selection
  if (selectedDate === dateStr) {
    selectedDate = null;
    clearFilter();
  } else {
    selectedDate = dateStr;
    filterEventsByDate(dateStr);
  }
  
  // Update calendars to show selection
  updateCalendars();
}

function filterEventsByDate(dateStr) {
  const eventsContainer = document.getElementById('eventsContainer');
  const eventsTitle = document.getElementById('eventsTitle');
  const selectedDateInfo = document.getElementById('selectedDateInfo');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  
  if (!eventsContainer) return;
  
  // Filter events
  const filteredEvents = eventDetails.filter(e => e.date === dateStr);
  
  // Update UI
  if (eventsTitle) eventsTitle.textContent = 'Eventos do Dia';
  if (selectedDateInfo) {
    const date = new Date(dateStr);
    selectedDateInfo.textContent = `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
    selectedDateInfo.style.display = 'block';
  }
  if (clearFilterBtn) clearFilterBtn.classList.add('show');
  
  // Render filtered events
  renderEvents(filteredEvents.length > 0 ? filteredEvents : null, 'Nenhum evento neste dia');
}

function clearFilter() {
  selectedDate = null;
  
  const eventsTitle = document.getElementById('eventsTitle');
  const selectedDateInfo = document.getElementById('selectedDateInfo');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  
  if (eventsTitle) eventsTitle.textContent = 'Próximos Eventos';
  if (selectedDateInfo) selectedDateInfo.style.display = 'none';
  if (clearFilterBtn) clearFilterBtn.classList.remove('show');
  
  // Render all events
  renderEvents(eventDetails);
  updateCalendars();
}

function renderEvents(events, emptyMessage = 'Nenhum evento encontrado') {
  const eventsContainer = document.getElementById('eventsContainer');
  if (!eventsContainer) return;
  
  if (!events || events.length === 0) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="empty-state-title">${emptyMessage}</div>
        <div class="empty-state-description">Selecione outra data no calendário</div>
      </div>
    `;
    return;
  }
  
  eventsContainer.innerHTML = events.map(event => `
    <div class="event-item" data-date="${event.date}" style="--event-color: ${event.color};">
      <div class="event-date">
        <div class="event-day">${event.day}</div>
        <div class="event-month">${event.month}</div>
      </div>
      <div class="event-details">
        <div class="event-title">${event.title}</div>
        <div class="event-meta">${event.meta}</div>
      </div>
    </div>
  `).join('');
}

function updateCalendars() {
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  
  const currentMonthName = document.getElementById('currentMonthName');
  const nextMonthName = document.getElementById('nextMonthName');
  const currentGrid = document.getElementById('currentMonthGrid');
  const nextGrid = document.getElementById('nextMonthGrid');
  
  if (currentMonthName && nextMonthName && currentGrid && nextGrid) {
    currentMonthName.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    nextMonthName.textContent = `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
    generateCalendar(currentDate, currentGrid);
    generateCalendar(nextMonth, nextGrid);
  }
}

function toggleCalendar() {
  const collapsible = document.getElementById('calendarCollapsible');
  const toggleBtn = document.getElementById('calendarToggleBtn');
  
  if (collapsible && toggleBtn) {
    const isExpanded = collapsible.classList.contains('expanded');
    
    if (isExpanded) {
      collapsible.classList.remove('expanded');
      toggleBtn.classList.remove('expanded');
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        Ver Calendário
      `;
    } else {
      collapsible.classList.add('expanded');
      toggleBtn.classList.add('expanded');
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        Ocultar Calendário
      `;
      // Update calendars and render events when expanding
      updateCalendars();
      renderEvents(eventDetails);
    }
  }
}

function verCalendario() {
  toggleCalendar();
}

// Initialize calendar navigation
document.addEventListener('DOMContentLoaded', function() {
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const clearBtn = document.getElementById('clearFilterBtn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      updateCalendars();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      updateCalendars();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', clearFilter);
  }
});
