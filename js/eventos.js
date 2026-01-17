/**
 * ========================================
 * COAJ MADRID - EVENTOS v4
 * ========================================
 * Diseño y lógica igual a actividades.js
 * Filtros: Categoría + Centro COAJ
 */

// ============================================
// Verificar config.js
// ============================================
if (typeof COAJ_CONFIG === 'undefined') {
  console.error('❌ COAJ_CONFIG no definido');
}

// ============================================
// Configuración
// ============================================
const API_BASE = COAJ_CONFIG.api.base;
const CACHE_KEY = COAJ_CONFIG.cache.eventosKey;
const CACHE_TTL = COAJ_CONFIG.cache.ttl;
const ICONOS = COAJ_CONFIG.eventos?.icons || {
  'Formación': '📚',
  'Cultura': '🎭',
  'Deportes': '⚽',
  'Ocio': '🎮',
  'Voluntariado': '🤝',
  'Empleo': '💼',
  'Salud': '❤️',
  'Medio Ambiente': '🌱',
  'default': '📅'
};

// ============================================
// Estado Global
// ============================================
let eventos = [];
let eventosFiltrados = [];
let vistaActual = 'tarjetas';
let categoriaActual = 'todas';
let centroActual = 'todos';
let busquedaActiva = false;
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();
let eventoSeleccionado = null;

const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ============================================
// SESIÓN Y LOGIN
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem('coaj_sesion');
  if (sesion) {
    const usuario = JSON.parse(sesion);
    actualizarUIUsuario(usuario);
    ocultarLoginModal();
  } else {
    mostrarLoginModal();
  }
}

function actualizarUIUsuario(usuario) {
  const nombre = usuario.nombre || usuario.alias || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  
  document.getElementById('headerGreeting').textContent = `Hola, ${nombre}`;
  document.getElementById('avatarInitial').textContent = inicial;
  document.getElementById('menuAvatarInitial').textContent = inicial;
  document.getElementById('menuUserName').textContent = nombre;
  
  document.getElementById('bottomNavGuest').style.display = 'none';
  document.getElementById('bottomNavUser').style.display = 'flex';
}

function entrarComoInvitado() {
  const invitado = { tipo: 'invitado', nombre: 'Invitado' };
  localStorage.setItem('coaj_sesion', JSON.stringify(invitado));
  actualizarUIUsuario(invitado);
  ocultarLoginModal();
  cargarEventos();
}

async function iniciarSesion(e) {
  e.preventDefault();
  const alias = document.getElementById('alias').value.trim();
  const contrasena = document.getElementById('contrasena').value;
  const errorEl = document.getElementById('loginError');
  const btnLogin = document.querySelector('.btn-login');
  
  if (!alias || !contrasena) {
    errorEl.textContent = 'Completa todos los campos';
    errorEl.style.display = 'block';
    return;
  }
  
  btnLogin.disabled = true;
  btnLogin.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...';
  
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, contrasena })
    });
    
    const data = await response.json();
    
    if (data.success && data.usuario) {
      localStorage.setItem('coaj_sesion', JSON.stringify(data.usuario));
      actualizarUIUsuario(data.usuario);
      ocultarLoginModal();
      cargarEventos();
      mostrarToast(`Bienvenido, ${data.usuario.nombre || alias}`, 'success');
    } else {
      errorEl.textContent = data.error || 'Credenciales incorrectas';
      errorEl.style.display = 'block';
    }
  } catch (error) {
    console.error('Error login:', error);
    errorEl.textContent = 'Error de conexión';
    errorEl.style.display = 'block';
  } finally {
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión';
  }
}

function cerrarSesion() {
  localStorage.removeItem('coaj_sesion');
  document.getElementById('bottomNavGuest').style.display = 'flex';
  document.getElementById('bottomNavUser').style.display = 'none';
  document.getElementById('headerGreeting').textContent = 'Bienvenido';
  document.getElementById('avatarInitial').textContent = 'U';
  cerrarUserMenu();
  mostrarLoginModal();
}

function mostrarLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
}

function ocultarLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

// ============================================
// USER MENU
// ============================================
function toggleUserMenu() {
  document.getElementById('userMenu').classList.toggle('active');
}

function cerrarUserMenu() {
  document.getElementById('userMenu').classList.remove('active');
}

// ============================================
// TEMA
// ============================================
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  
  html.setAttribute('data-theme', next);
  localStorage.setItem('coaj_theme', next);
  
  const icon = next === 'dark' ? 'light_mode' : 'dark_mode';
  const text = next === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  
  document.getElementById('themeIcon').textContent = icon;
  document.getElementById('menuThemeIcon').textContent = icon;
  document.getElementById('menuThemeText').textContent = text;
}

function cargarTema() {
  const tema = localStorage.getItem('coaj_theme') || 'light';
  document.documentElement.setAttribute('data-theme', tema);
  
  const icon = tema === 'dark' ? 'light_mode' : 'dark_mode';
  const text = tema === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  
  document.getElementById('themeIcon').textContent = icon;
  document.getElementById('menuThemeIcon').textContent = icon;
  document.getElementById('menuThemeText').textContent = text;
}

// ============================================
// CARGAR EVENTOS
// ============================================
async function cargarEventos(forceRefresh = false) {
  console.log('📅 cargarEventos()', forceRefresh ? '(forzado)' : '');
  
  if (!forceRefresh) {
    const cached = CoajCache.get(CACHE_KEY, CACHE_TTL);
    if (cached) {
      console.log('📦 Usando cache');
      eventos = cached;
      procesarEventos();
      return;
    }
  }
  
  mostrarLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/eventos`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.eventos && Array.isArray(data.eventos)) {
      eventos = filtrarEventosFinalizados(data.eventos);
      eventos = ordenarEventosPorFecha(eventos);
      console.log(`✅ ${eventos.length} eventos cargados`);
      
      CoajCache.set(CACHE_KEY, eventos);
      procesarEventos();
    } else {
      eventos = [];
      procesarEventos();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    mostrarLoading(false);
    mostrarEmpty(true);
    mostrarToast('Error al cargar eventos', 'error');
  }
}

function refrescarDatos() {
  CoajCache.remove(CACHE_KEY);
  categoriaActual = 'todas';
  centroActual = 'todos';
  actualizarFiltrosUI();
  cargarEventos(true);
  mostrarToast('Actualizando...', 'success');
}

// ============================================
// PROCESAR EVENTOS
// ============================================
function procesarEventos() {
  mostrarLoading(false);
  
  if (eventos.length === 0) {
    mostrarEmpty(true);
    return;
  }
  
  mostrarEmpty(false);
  generarFiltros();
  aplicarFiltros();
}

function filtrarEventosFinalizados(evts) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return evts.filter(ev => {
    const fechaFin = parsearFecha(ev["Fecha finalización"]) || parsearFecha(ev["Fecha inicio"]);
    if (!fechaFin) return true;
    const diffDias = Math.floor((hoy - fechaFin) / (1000 * 60 * 60 * 24));
    return diffDias <= 5;
  });
}

function ordenarEventosPorFecha(evts) {
  return evts.sort((a, b) => {
    const fechaA = parsearFecha(a["Fecha inicio"]) || new Date(0);
    const fechaB = parsearFecha(b["Fecha inicio"]) || new Date(0);
    return fechaA - fechaB;
  });
}

// ============================================
// FILTROS
// ============================================
function generarFiltros() {
  generarFiltrosCategorias();
  generarFiltrosCentros();
}

function generarFiltrosCategorias() {
  const container = document.getElementById('filtrosCategoria');
  container.innerHTML = '';
  
  const categorias = {};
  eventos.forEach(ev => {
    const cat = ev.Categoría || ev.Categoria || 'Sin Categoría';
    categorias[cat] = (categorias[cat] || 0) + 1;
  });
  
  // Todas
  const btnTodas = crearChipFiltro('todas', '📌', 'Todas', eventos.length, categoriaActual === 'todas');
  btnTodas.onclick = () => seleccionarCategoria('todas');
  container.appendChild(btnTodas);
  
  // Por categoría
  Object.keys(categorias).sort().forEach(cat => {
    const icono = ICONOS[cat] || ICONOS.default;
    const chip = crearChipFiltro(cat, icono, cat, categorias[cat], categoriaActual === cat);
    chip.onclick = () => seleccionarCategoria(cat);
    container.appendChild(chip);
  });
}

function generarFiltrosCentros() {
  const container = document.getElementById('filtrosCentro');
  container.innerHTML = '';
  
  const centros = {};
  eventos.forEach(ev => {
    const centro = ev["Centro Juvenil"];
    if (centro && centro.trim()) {
      centros[centro.trim()] = (centros[centro.trim()] || 0) + 1;
    }
  });
  
  if (Object.keys(centros).length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  
  // Todos
  const btnTodos = crearChipFiltro('todos', '🏢', 'Todos', eventos.length, centroActual === 'todos', true);
  btnTodos.onclick = () => seleccionarCentro('todos');
  container.appendChild(btnTodos);
  
  // Por centro
  Object.keys(centros).sort().forEach(centro => {
    const chip = crearChipFiltro(centro, '📍', centro, centros[centro], centroActual === centro, true);
    chip.onclick = () => seleccionarCentro(centro);
    container.appendChild(chip);
  });
}

function crearChipFiltro(id, icono, nombre, count, activo, esCentro = false) {
  const chip = document.createElement('button');
  chip.className = 'filter-chip';
  if (activo) chip.classList.add(esCentro ? 'active-secondary' : 'active');
  chip.setAttribute('data-id', id);
  chip.innerHTML = `
    <span class="icon">${icono}</span>
    <span>${nombre}</span>
    <span class="count">${count}</span>
  `;
  return chip;
}

function seleccionarCategoria(cat) {
  categoriaActual = cat;
  actualizarFiltrosUI();
  aplicarFiltros();
}

function seleccionarCentro(centro) {
  centroActual = centro;
  actualizarFiltrosUI();
  aplicarFiltros();
}

function actualizarFiltrosUI() {
  // Categorías
  document.querySelectorAll('#filtrosCategoria .filter-chip').forEach(chip => {
    chip.classList.remove('active');
    if (chip.getAttribute('data-id') === categoriaActual) {
      chip.classList.add('active');
    }
  });
  
  // Centros
  document.querySelectorAll('#filtrosCentro .filter-chip').forEach(chip => {
    chip.classList.remove('active-secondary');
    if (chip.getAttribute('data-id') === centroActual) {
      chip.classList.add('active-secondary');
    }
  });
}

function aplicarFiltros() {
  eventosFiltrados = eventos.filter(ev => {
    const cat = ev.Categoría || ev.Categoria || 'Sin Categoría';
    const centro = ev["Centro Juvenil"] || '';
    
    const pasaCategoria = categoriaActual === 'todas' || cat === categoriaActual;
    const pasaCentro = centroActual === 'todos' || centro === centroActual;
    
    return pasaCategoria && pasaCentro;
  });
  
  renderizar();
}

// ============================================
// BÚSQUEDA
// ============================================
function buscarEventos() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  
  if (!query) {
    cerrarBusqueda();
    return;
  }
  
  busquedaActiva = true;
  
  const resultados = eventos.filter(ev => {
    const nombre = (ev.Evento || ev["ID Eventos"] || '').toLowerCase();
    const categoria = (ev.Categoría || ev.Categoria || '').toLowerCase();
    const centro = (ev["Centro Juvenil"] || '').toLowerCase();
    const descripcion = (ev.Descripción || ev.Descripcion || '').toLowerCase();
    
    return nombre.includes(query) || categoria.includes(query) || centro.includes(query) || descripcion.includes(query);
  });
  
  mostrarResultadosBusqueda(resultados);
}

function mostrarResultadosBusqueda(resultados) {
  document.getElementById('vistaTarjetas').style.display = 'none';
  document.getElementById('vistaCalendario').style.display = 'none';
  document.getElementById('searchResults').classList.remove('hidden');
  
  const lista = document.getElementById('searchResultsList');
  lista.innerHTML = '';
  
  if (resultados.length === 0) {
    lista.innerHTML = '<div class="empty-state active"><span class="material-symbols-outlined">search_off</span><h3>Sin resultados</h3><p>Intenta con otros términos</p></div>';
    return;
  }
  
  resultados.forEach(ev => {
    lista.appendChild(crearEventoListItem(ev));
  });
}

function cerrarBusqueda() {
  busquedaActiva = false;
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').classList.add('hidden');
  
  if (vistaActual === 'tarjetas') {
    document.getElementById('vistaTarjetas').style.display = 'block';
  } else {
    document.getElementById('vistaCalendario').style.display = 'block';
  }
}

// ============================================
// CAMBIAR VISTA
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  
  document.getElementById('btnVistaTarjetas').classList.toggle('active', vista === 'tarjetas');
  document.getElementById('btnVistaCalendario').classList.toggle('active', vista === 'calendario');
  
  if (vista === 'tarjetas') {
    document.getElementById('vistaTarjetas').style.display = 'block';
    document.getElementById('vistaCalendario').style.display = 'none';
  } else {
    document.getElementById('vistaTarjetas').style.display = 'none';
    document.getElementById('vistaCalendario').style.display = 'block';
  }
  
  renderizar();
}

// ============================================
// RENDERIZAR
// ============================================
function renderizar() {
  if (busquedaActiva) return;
  
  if (eventosFiltrados.length === 0) {
    mostrarEmpty(true);
    document.getElementById('upcomingSection').classList.add('hidden');
    document.getElementById('allEventsSection').classList.add('hidden');
    return;
  }
  
  mostrarEmpty(false);
  
  if (vistaActual === 'tarjetas') {
    renderizarTarjetas();
  } else {
    renderizarCalendario();
  }
}

function renderizarTarjetas() {
  // Próximos eventos (carrusel)
  const proximos = obtenerProximosEventos(eventosFiltrados, 10);
  const carouselContainer = document.getElementById('upcomingCarousel');
  carouselContainer.innerHTML = '';
  
  if (proximos.length > 0) {
    document.getElementById('upcomingSection').classList.remove('hidden');
    proximos.forEach(ev => {
      carouselContainer.appendChild(crearEventoCard(ev));
    });
  } else {
    document.getElementById('upcomingSection').classList.add('hidden');
  }
  
  // Todos los eventos (lista)
  const listaContainer = document.getElementById('allEventsList');
  listaContainer.innerHTML = '';
  
  document.getElementById('allEventsSection').classList.remove('hidden');
  document.getElementById('totalCount').textContent = `${eventosFiltrados.length} eventos`;
  
  eventosFiltrados.forEach(ev => {
    listaContainer.appendChild(crearEventoListItem(ev));
  });
}

function renderizarCalendario() {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = generarCalendarioHTML();
}

// ============================================
// CREAR ELEMENTOS
// ============================================
function crearEventoCard(ev) {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.onclick = () => abrirModalDetalle(ev);
  
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const fecha = formatearFechaCorta(ev["Fecha inicio"]);
  const centro = ev["Centro Juvenil"] || 'Sin centro';
  const estado = calcularEstado(ev);
  const img = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel) || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';
  
  let badgeClass = '';
  let badgeText = '';
  if (estado === 'Desarrollo') { badgeClass = 'badge-desarrollo'; badgeText = 'En curso'; }
  else if (estado === 'Programado') { badgeClass = 'badge-programado'; badgeText = 'Próximo'; }
  else if (estado === 'Finalizado') { badgeClass = 'badge-finalizado'; badgeText = 'Finalizado'; }
  
  card.innerHTML = `
    <div class="event-card-image" style="background-image: url('${img}')">
      ${badgeText ? `<span class="event-card-badge ${badgeClass}">${badgeText}</span>` : ''}
    </div>
    <div class="event-card-body">
      <h3 class="event-card-title">${nombre}</h3>
      <div class="event-card-meta">
        <div class="event-card-meta-item">
          <span class="material-symbols-outlined">event</span>
          <span>${fecha}</span>
        </div>
        <div class="event-card-meta-item">
          <span class="material-symbols-outlined">location_on</span>
          <span>${centro}</span>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

function crearEventoListItem(ev) {
  const item = document.createElement('div');
  item.className = 'event-list-item';
  item.onclick = () => abrirModalDetalle(ev);
  
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const fecha = formatearFechaCorta(ev["Fecha inicio"]);
  const centro = ev["Centro Juvenil"] || 'Sin centro';
  const categoria = ev.Categoría || ev.Categoria || '';
  const estado = calcularEstado(ev);
  const img = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel) || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';
  
  let statusClass = '';
  let statusText = '';
  if (estado === 'Desarrollo') { statusClass = 'status-desarrollo'; statusText = 'En curso'; }
  else if (estado === 'Programado') { statusClass = 'status-programado'; statusText = 'Próximo'; }
  else if (estado === 'Finalizado') { statusClass = 'status-finalizado'; statusText = 'Finalizado'; }
  
  item.innerHTML = `
    <div class="event-list-image" style="background-image: url('${img}')"></div>
    <div class="event-list-content">
      <h3 class="event-list-title">${nombre}</h3>
      <div class="event-list-badges">
        ${statusText ? `<span class="status-badge ${statusClass}">${statusText}</span>` : ''}
        ${categoria ? `<span class="status-badge" style="background: rgba(232, 85, 42, 0.1); color: #E8552A;">${categoria}</span>` : ''}
      </div>
      <div class="event-list-info">
        <span class="event-list-info-item">
          <span class="material-symbols-outlined">event</span>
          ${fecha}
        </span>
        <span class="event-list-info-item">
          <span class="material-symbols-outlined">location_on</span>
          ${centro}
        </span>
      </div>
    </div>
    <span class="event-list-arrow material-symbols-outlined">chevron_right</span>
  `;
  
  return item;
}

// ============================================
// CALENDARIO
// ============================================
function generarCalendarioHTML() {
  const primerDia = new Date(añoActual, mesActual, 1);
  const ultimoDia = new Date(añoActual, mesActual + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;
  const hoy = new Date();
  
  let html = `
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="calendar-nav-btn" onclick="cambiarMes(-1)">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="calendar-month">${mesesNombres[mesActual]} ${añoActual}</span>
        <button class="calendar-nav-btn" onclick="cambiarMes(1)">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <button class="btn-today" onclick="irHoy()">Hoy</button>
    </div>
    <div class="calendar-grid">
  `;
  
  diasSemana.forEach(d => {
    html += `<div class="calendar-weekday">${d}</div>`;
  });
  
  // Días anteriores
  for (let i = 0; i < primerDiaSemana; i++) {
    const diaAnterior = new Date(añoActual, mesActual, -(primerDiaSemana - i - 1));
    html += `<div class="calendar-day other-month"><span class="calendar-day-number">${diaAnterior.getDate()}</span></div>`;
  }
  
  // Días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const eventosDia = obtenerEventosDia(dia);
    let clases = 'calendar-day';
    
    if (hoy.getDate() === dia && hoy.getMonth() === mesActual && hoy.getFullYear() === añoActual) {
      clases += ' today';
    }
    if (eventosDia.length > 0) {
      clases += ' has-events';
    }
    
    html += `
      <div class="${clases}" onclick="verEventosDia(${dia})">
        <span class="calendar-day-number">${dia}</span>
        ${eventosDia.length > 0 ? `<span class="calendar-day-count">${eventosDia.length}</span>` : ''}
      </div>
    `;
  }
  
  // Días siguientes
  const diasRestantes = (7 - ((primerDiaSemana + diasEnMes) % 7)) % 7;
  for (let i = 1; i <= diasRestantes; i++) {
    html += `<div class="calendar-day other-month"><span class="calendar-day-number">${i}</span></div>`;
  }
  
  html += '</div>';
  
  return html;
}

function obtenerEventosDia(dia) {
  return eventosFiltrados.filter(ev => {
    const fechaInicio = parsearFecha(ev["Fecha inicio"]);
    const fechaFin = parsearFecha(ev["Fecha finalización"]);
    if (!fechaInicio) return false;
    
    const fechaDia = new Date(añoActual, mesActual, dia);
    fechaDia.setHours(0, 0, 0, 0);
    
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(0, 0, 0, 0);
      return fechaDia >= inicio && fechaDia <= fin;
    }
    
    return fechaDia.getTime() === inicio.getTime();
  });
}

function verEventosDia(dia) {
  const eventosDia = obtenerEventosDia(dia);
  if (eventosDia.length === 0) return;
  
  const fecha = new Date(añoActual, mesActual, dia);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  // Mostrar en modal drawer
  document.getElementById('categoryModalIcon').textContent = '📅';
  document.getElementById('categoryModalName').textContent = fechaFormateada;
  document.getElementById('categoryModalCount').textContent = eventosDia.length;
  
  const lista = document.getElementById('categoryEventsList');
  lista.innerHTML = '';
  eventosDia.forEach(ev => lista.appendChild(crearEventoListItem(ev)));
  
  document.getElementById('categoryOverlay').classList.add('active');
  document.getElementById('categoryModal').classList.add('active');
}

function cambiarMes(direccion) {
  mesActual += direccion;
  if (mesActual < 0) { mesActual = 11; añoActual--; }
  else if (mesActual > 11) { mesActual = 0; añoActual++; }
  renderizarCalendario();
}

function irHoy() {
  const hoy = new Date();
  mesActual = hoy.getMonth();
  añoActual = hoy.getFullYear();
  renderizarCalendario();
}

// ============================================
// MODAL DETALLE
// ============================================
function abrirModalDetalle(ev) {
  eventoSeleccionado = ev;
  
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const descripcion = ev.Descripción || ev.Descripcion || 'Sin descripción disponible.';
  const categoria = ev.Categoría || ev.Categoria || '';
  const centro = ev["Centro Juvenil"] || 'N/A';
  const programa = ev.Programa || 'N/A';
  const plazas = ev.Plazas || 'N/A';
  const estado = calcularEstado(ev);
  const img = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel) || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';
  
  document.getElementById('detailImage').style.backgroundImage = `url('${img}')`;
  document.getElementById('detailTitle').textContent = nombre;
  document.getElementById('detailDescription').textContent = descripcion;
  
  // Badges
  const badgesContainer = document.getElementById('detailBadges');
  badgesContainer.innerHTML = '';
  
  if (categoria) {
    badgesContainer.innerHTML += `<span class="detail-category-badge">${ICONOS[categoria] || '📅'} ${categoria}</span>`;
  }
  
  if (estado) {
    let statusClass = '';
    let statusText = '';
    if (estado === 'Desarrollo') { statusClass = 'status-desarrollo'; statusText = 'En curso'; }
    else if (estado === 'Programado') { statusClass = 'status-programado'; statusText = 'Próximo'; }
    else if (estado === 'Finalizado') { statusClass = 'status-finalizado'; statusText = 'Finalizado'; }
    badgesContainer.innerHTML += `<span class="detail-status-badge ${statusClass}">${statusText}</span>`;
  }
  
  // Info grid
  document.getElementById('detailInfo').innerHTML = `
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event</span>
      <div>
        <small>Fecha inicio</small>
        <strong>${formatearFechaCompleta(ev["Fecha inicio"])}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event_available</span>
      <div>
        <small>Fecha fin</small>
        <strong>${formatearFechaCompleta(ev["Fecha finalización"])}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">location_on</span>
      <div>
        <small>Centro COAJ</small>
        <strong>${centro}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">folder</span>
      <div>
        <small>Programa</small>
        <strong>${programa}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">groups</span>
      <div>
        <small>Plazas</small>
        <strong>${plazas}</strong>
      </div>
    </div>
  `;
  
  // Botón acción
  const btnAccion = document.getElementById('detailActionBtn');
  if (estado === 'Finalizado') {
    btnAccion.disabled = true;
    btnAccion.innerHTML = '<span class="material-symbols-outlined">event_busy</span> Finalizado';
  } else {
    btnAccion.disabled = false;
    btnAccion.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Inscribirme';
  }
  
  document.getElementById('detailModal').classList.add('active');
  cerrarModalCategoria();
}

function cerrarModalDetalle() {
  document.getElementById('detailModal').classList.remove('active');
  eventoSeleccionado = null;
}

function cerrarModalCategoria() {
  document.getElementById('categoryOverlay').classList.remove('active');
  document.getElementById('categoryModal').classList.remove('active');
}

function compartirEvento() {
  if (!eventoSeleccionado) return;
  
  const nombre = eventoSeleccionado.Evento || 'Evento COAJ';
  const texto = `¡Mira este evento de COAJ Madrid! ${nombre}`;
  
  if (navigator.share) {
    navigator.share({ title: nombre, text: texto, url: window.location.href });
  } else {
    navigator.clipboard.writeText(texto);
    mostrarToast('Enlace copiado', 'success');
  }
}

// ============================================
// UTILIDADES
// ============================================
function parsearFecha(fechaStr) {
  if (!fechaStr) return null;
  try {
    if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
      const partes = fechaStr.split(' ')[0].split('/');
      return new Date(parseInt(partes[2]), parseInt(partes[0]) - 1, parseInt(partes[1]));
    }
    const fecha = new Date(fechaStr);
    return isNaN(fecha.getTime()) ? null : fecha;
  } catch { return null; }
}

function formatearFechaCorta(str) {
  if (!str) return 'Por confirmar';
  try {
    if (str.includes('/')) {
      const partes = str.split(' ')[0].split('/');
      const fecha = new Date(2024, parseInt(partes[0]) - 1, parseInt(partes[1]));
      return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return str;
  } catch { return str; }
}

function formatearFechaCompleta(str) {
  if (!str) return 'Por confirmar';
  try {
    if (str.includes('/')) {
      const partes = str.split(' ');
      const fecha = partes[0].split('/');
      const fechaObj = new Date(parseInt(fecha[2]), parseInt(fecha[0]) - 1, parseInt(fecha[1]));
      let resultado = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      if (partes[1]) {
        const hora = partes[1].split(':');
        resultado += ` • ${hora[0]}:${hora[1]}`;
      }
      return resultado;
    }
    return str;
  } catch { return str; }
}

function calcularEstado(ev) {
  const fechaInicio = parsearFecha(ev["Fecha inicio"]);
  const fechaFin = parsearFecha(ev["Fecha finalización"]);
  if (!fechaInicio) return null;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  
  const fin = fechaFin ? new Date(fechaFin) : new Date(inicio);
  fin.setHours(0, 0, 0, 0);
  
  const diffInicio = Math.floor((inicio - hoy) / (1000 * 60 * 60 * 24));
  const diffFin = Math.floor((fin - hoy) / (1000 * 60 * 60 * 24));
  
  if (diffInicio > 5) return 'Programado';
  if (diffInicio <= 5 && diffFin >= 0) return 'Desarrollo';
  if (diffFin < 0) return 'Finalizado';
  
  return 'Programado';
}

function extraerImg(url) {
  if (!url) return null;
  if (url.includes('gettablefileurl')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const fileName = params.get('fileName');
    if (!fileName || !fileName.trim()) return null;
  }
  return url;
}

function obtenerProximosEventos(evts, limite) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return evts
    .filter(ev => {
      const fecha = parsearFecha(ev["Fecha inicio"]);
      if (!fecha) return false;
      return fecha >= hoy;
    })
    .slice(0, limite);
}

function mostrarLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
}

function mostrarEmpty(show) {
  document.getElementById('emptyState').classList.toggle('active', show);
}

function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  msg.textContent = mensaje;
  icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  toast.className = `toast ${tipo} show`;
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Iniciando Eventos COAJ v4...');
  
  cargarTema();
  verificarSesion();
  
  const sesion = localStorage.getItem('coaj_sesion');
  if (sesion) {
    cargarEventos();
  }
  
  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.avatar-btn') && !e.target.closest('.user-menu')) {
      cerrarUserMenu();
    }
  });
  
  // ESC para cerrar modales
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalDetalle();
      cerrarModalCategoria();
    }
  });
});
