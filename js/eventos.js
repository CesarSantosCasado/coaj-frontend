/**
 * COAJ Madrid - Eventos v5
 * HOMOLOGADO 100% CON ACTIVIDADES
 * Sesión compartida con actividades
 */

// ============================================
// VERIFICAR DEPENDENCIAS
// ============================================
if (typeof COAJ_CONFIG === 'undefined') {
  console.error('❌ config.js debe cargarse antes de eventos.js');
}

// ============================================
// CONSTANTES
// ============================================
const API_BASE = COAJ_CONFIG?.api?.base || 'https://coajmadrid-8273afef0255.herokuapp.com/api';
const CACHE_KEY = COAJ_CONFIG?.cache?.eventosKey || 'coaj_eventos_cache';
const CACHE_TTL = COAJ_CONFIG?.cache?.ttl || 5 * 60 * 1000;

// Iconos categorías
const ICONOS = COAJ_CONFIG?.eventos?.icons || {
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
// ESTADO GLOBAL
// ============================================
let eventos = [];
let eventoSeleccionado = null;
let categoriaSeleccionada = null;
let vistaActual = 'tarjetas';
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();

const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('🚀 Inicializando COAJ Eventos...');
  initTheme();
  verificarSesion();
  warmup();
  setupEventListeners();
}

function warmup() {
  fetch(`${API_BASE}/warmup`).catch(() => {});
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const avatar = document.getElementById('headerAvatar');
    if (menu?.classList.contains('active') && !menu.contains(e.target) && !avatar?.contains(e.target)) {
      menu.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalDetalle();
      cerrarModalCategoria();
      document.getElementById('userMenu')?.classList.remove('active');
    }
  });
}

// ============================================
// TEMA CLARO/OSCURO
// ============================================
function initTheme() {
  const saved = localStorage.getItem(COAJ_CONFIG?.cache?.themeKey || 'coajTheme') || 'light';
  setTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem(COAJ_CONFIG?.cache?.themeKey || 'coajTheme', next);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  
  const updates = {
    themeIcon: isDark ? 'light_mode' : 'dark_mode',
    menuThemeIcon: isDark ? 'light_mode' : 'dark_mode',
    menuThemeText: isDark ? 'Modo Claro' : 'Modo Oscuro'
  };
  
  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// ============================================
// AUTENTICACIÓN (Sesión compartida)
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario');
  const loginModal = document.getElementById('loginModal');
  
  if (sesion) {
    const usuario = JSON.parse(sesion);
    loginModal?.classList.add('hidden');
    actualizarUIUsuario(usuario);
    actualizarBottomNav(true);
    cargarDatos();
  } else {
    loginModal?.classList.remove('hidden');
    actualizarBottomNav(false);
  }
}

function actualizarUIUsuario(usuario) {
  const nombre = usuario.nombre || usuario.alias || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  const primerNombre = nombre.split(' ')[0];
  
  const updates = {
    headerGreeting: `¡Hola, ${primerNombre}!`,
    avatarInitial: inicial,
    menuAvatarInitial: inicial,
    menuUserName: nombre
  };
  
  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function actualizarBottomNav(logueado) {
  const navGuest = document.getElementById('bottomNavGuest');
  const navUser = document.getElementById('bottomNavUser');
  
  if (navGuest) navGuest.style.display = logueado ? 'none' : 'flex';
  if (navUser) navUser.style.display = logueado ? 'flex' : 'none';
}

function toggleUserMenu() {
  document.getElementById('userMenu')?.classList.toggle('active');
}

function mostrarLoginModal() {
  document.getElementById('loginModal')?.classList.remove('hidden');
}

async function iniciarSesion(e) {
  e.preventDefault();
  
  const alias = document.getElementById('alias')?.value.trim();
  const contrasena = document.getElementById('contrasena')?.value;
  const btn = document.querySelector('.btn-login');
  const errorEl = document.getElementById('loginError');
  
  if (!alias || !contrasena) {
    mostrarErrorLogin('Por favor completa todos los campos');
    return;
  }
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...';
  }
  if (errorEl) errorEl.style.display = 'none';
  
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, contrasena })
    });
    
    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario', JSON.stringify(data.usuario));
      document.getElementById('loginModal')?.classList.add('hidden');
      actualizarUIUsuario(data.usuario);
      actualizarBottomNav(true);
      cargarDatos();
      mostrarToast('¡Bienvenido!', 'success');
    } else {
      mostrarErrorLogin(data.message || 'Credenciales incorrectas');
    }
  } catch (err) {
    mostrarErrorLogin('Error de conexión. Intenta de nuevo.');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión';
  }
}

function entrarComoInvitado() {
  const usuario = { alias: 'invitado', nombre: 'Invitado' };
  localStorage.setItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario', JSON.stringify(usuario));
  document.getElementById('loginModal')?.classList.add('hidden');
  actualizarUIUsuario(usuario);
  actualizarBottomNav(true);
  cargarDatos();
}

function mostrarErrorLogin(mensaje) {
  const el = document.getElementById('loginError');
  if (el) {
    el.textContent = mensaje;
    el.style.display = 'block';
  }
}

function cerrarSesion() {
  localStorage.removeItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario');
  if (typeof CoajCache !== 'undefined') {
    CoajCache.remove(CACHE_KEY);
  }
  window.location.href = '../index.html';
}

// ============================================
// CARGAR DATOS
// ============================================
async function cargarDatos(forceRefresh = false) {
  const loading = document.getElementById('loading');
  
  // Cache
  if (!forceRefresh && typeof CoajCache !== 'undefined') {
    const cached = CoajCache.get(CACHE_KEY, CACHE_TTL);
    if (cached) {
      console.log('📦 Usando eventos desde cache');
      eventos = cached;
      if (loading) loading.classList.add('hidden');
      if (eventos.length === 0) {
        document.getElementById('emptyState')?.classList.add('active');
      } else {
        renderizarTodo();
      }
      return;
    }
  }

  console.log('🌐 Cargando eventos desde API...');
  if (loading) loading.classList.remove('hidden');
  
  try {
    const res = await fetch(`${API_BASE}/eventos`);
    const data = await res.json();
    
    eventos = data.eventos || [];
    eventos = filtrarEventosFinalizados(eventos);
    eventos = ordenarEventosPorFecha(eventos);
    
    console.log('✅ Eventos cargados:', eventos.length);
    
    if (typeof CoajCache !== 'undefined') {
      CoajCache.set(CACHE_KEY, eventos);
    }
    
    if (loading) loading.classList.add('hidden');
    
    if (eventos.length === 0) {
      document.getElementById('emptyState')?.classList.add('active');
    } else {
      renderizarTodo();
    }
  } catch (err) {
    console.error('Error cargando eventos:', err);
    if (loading) loading.classList.add('hidden');
    document.getElementById('emptyState')?.classList.add('active');
    mostrarToast('Error al cargar eventos', 'error');
  }
}

function refrescarDatos() {
  console.log('🔄 Refrescando eventos...');
  if (typeof CoajCache !== 'undefined') {
    CoajCache.remove(CACHE_KEY);
  }
  cargarDatos(true);
  mostrarToast('Actualizando eventos...', 'success');
}

window.refrescarDatos = refrescarDatos;

// ============================================
// UTILIDADES
// ============================================
function filtrarEventosFinalizados(evts) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return evts.filter(ev => {
    const fechaFin = parsearFecha(ev["Fecha finalización"]) || parsearFecha(ev["Fecha inicio"]);
    if (!fechaFin) return true;
    return Math.floor((hoy - fechaFin) / 86400000) <= 5;
  });
}

function ordenarEventosPorFecha(evts) {
  return evts.sort((a, b) => {
    const fA = parsearFecha(a["Fecha inicio"]) || new Date(0);
    const fB = parsearFecha(b["Fecha inicio"]) || new Date(0);
    return fA - fB;
  });
}

function parsearFecha(str) {
  if (!str) return null;
  try {
    if (str.includes('/')) {
      const p = str.split(' ')[0].split('/');
      return new Date(+p[2], +p[0] - 1, +p[1]);
    }
    const d = new Date(str);
    return isNaN(d) ? null : d;
  } catch { return null; }
}

function formatearFecha(str) {
  if (!str) return 'Por confirmar';
  const fecha = parsearFecha(str);
  if (!fecha) return str;
  return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
}

function formatearFechaCorta(str) {
  if (!str) return 'Por confirmar';
  const fecha = parsearFecha(str);
  if (!fecha) return str;
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
}

function calcularEstado(ev) {
  const inicio = parsearFecha(ev["Fecha inicio"]);
  const fin = parsearFecha(ev["Fecha finalización"]);
  if (!inicio) return 'programado';
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const i = new Date(inicio); i.setHours(0, 0, 0, 0);
  const f = fin ? new Date(fin) : new Date(i); f.setHours(0, 0, 0, 0);
  
  const diffI = Math.floor((i - hoy) / 86400000);
  const diffF = Math.floor((f - hoy) / 86400000);
  
  if (diffF < 0) return 'finalizado';
  if (diffI <= 0 && diffF >= 0) return 'desarrollo';
  return 'programado';
}

function getEstadoTexto(estado) {
  const map = {
    'desarrollo': 'En curso',
    'finalizado': 'Finalizado',
    'programado': 'Próximo'
  };
  return map[estado] || 'Próximo';
}

function getIconoCategoria(cat) {
  return ICONOS[cat] || ICONOS.default;
}

function getImagenEvento(ev) {
  const url = ev["Imagen URL"] || ev.Cartel;
  if (!url) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400';
  if (url.includes('gettablefileurl')) {
    const p = new URLSearchParams(url.split('?')[1] || '');
    if (!p.get('fileName')?.trim()) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400';
  }
  return url;
}

// ============================================
// RENDERIZADO
// ============================================
function renderizarTodo() {
  renderizarProximos();
  renderizarCategorias();
  renderizarCentros();
  renderizarTodosLosEventos();
  renderizarCalendario();
  
  ['upcomingSection', 'categoriesSection', 'centrosSection', 'allEventsSection'].forEach(id => {
    document.getElementById(id)?.classList.remove('hidden');
  });
}

// Próximos eventos (carousel)
function renderizarProximos() {
  const container = document.getElementById('upcomingCarousel');
  if (!container) return;
  
  const proximos = eventos.filter(ev => calcularEstado(ev) !== 'finalizado').slice(0, 10);
  
  container.innerHTML = proximos.map((ev, i) => {
    const estado = calcularEstado(ev);
    const badgeText = estado === 'desarrollo' ? 'Hoy' : i < 2 ? 'Pronto' : 'Próximo';
    const badgeClass = estado === 'desarrollo' ? 'badge-today' : i < 2 ? 'badge-tomorrow' : 'badge-upcoming';
    
    return `
      <article class="event-card" onclick="abrirModalDetalle('${ev['ID Eventos'] || ev.Evento}')">
        <div class="event-card-image" style="background-image: url('${getImagenEvento(ev)}')">
          <span class="event-card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="event-card-body">
          <h3 class="event-card-title">${ev.Evento || 'Sin título'}</h3>
          <div class="event-card-meta">
            <div class="event-card-meta-item">
              <span class="material-symbols-outlined">event</span>
              ${formatearFechaCorta(ev["Fecha inicio"])}
            </div>
            <div class="event-card-meta-item">
              <span class="material-symbols-outlined">location_on</span>
              ${ev['Centro Juvenil'] || 'COAJ Madrid'}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Categorías (chips)
function renderizarCategorias() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;
  
  const categorias = {};
  eventos.forEach(ev => {
    const cat = ev.Categoría || ev.Categoria || 'Otros';
    categorias[cat] = (categorias[cat] || 0) + 1;
  });
  
  const sorted = Object.entries(categorias).sort((a, b) => b[1] - a[1]);
  
  container.innerHTML = sorted.map(([cat, count]) => `
    <button class="category-chip" onclick="abrirModalCategoria('${cat}', 'categoria')">
      <span class="category-icon">${getIconoCategoria(cat)}</span>
      <span class="category-name">${cat}</span>
      <span class="category-count">${count}</span>
    </button>
  `).join('');
}

// Centros (chips)
function renderizarCentros() {
  const container = document.getElementById('centrosGrid');
  if (!container) return;
  
  const centros = {};
  eventos.forEach(ev => {
    const centro = ev['Centro Juvenil'];
    if (centro?.trim()) {
      centros[centro] = (centros[centro] || 0) + 1;
    }
  });
  
  if (Object.keys(centros).length === 0) {
    document.getElementById('centrosSection')?.classList.add('hidden');
    return;
  }
  
  const sorted = Object.entries(centros).sort((a, b) => b[1] - a[1]);
  
  container.innerHTML = sorted.map(([centro, count]) => `
    <button class="category-chip" onclick="abrirModalCategoria('${centro}', 'centro')">
      <span class="category-icon">🏢</span>
      <span class="category-name">${centro}</span>
      <span class="category-count">${count}</span>
    </button>
  `).join('');
}

// Todos los eventos (lista)
function renderizarTodosLosEventos() {
  const container = document.getElementById('allEventsList');
  const countEl = document.getElementById('totalCount');
  
  if (!container) return;
  if (countEl) countEl.textContent = `${eventos.length} eventos`;
  
  container.innerHTML = eventos.map(ev => crearItemLista(ev)).join('');
}

function crearItemLista(ev) {
  const img = getImagenEvento(ev);
  const estado = calcularEstado(ev);
  const id = ev['ID Eventos'] || ev.Evento;
  
  return `
    <article class="event-list-item" onclick="abrirModalDetalle('${id}')">
      <div class="event-list-image" style="background-image: url('${img}')"></div>
      <div class="event-list-content">
        <h3 class="event-list-title">${ev.Evento || 'Sin título'}</h3>
        <div class="event-list-badges">
          <span class="status-badge status-${estado}">${getEstadoTexto(estado)}</span>
        </div>
        <div class="event-list-info">
          <span class="event-list-info-item">
            <span class="material-symbols-outlined">event</span>
            ${formatearFechaCorta(ev["Fecha inicio"])}
          </span>
          <span class="event-list-info-item">
            <span class="material-symbols-outlined">location_on</span>
            ${ev['Centro Juvenil'] || 'COAJ'}
          </span>
          <span class="event-list-info-item">
            <span class="material-symbols-outlined">group</span>
            ${ev.Plazas || '∞'}
          </span>
        </div>
      </div>
      <span class="material-symbols-outlined event-list-arrow">chevron_right</span>
    </article>
  `;
}

// ============================================
// CALENDARIO
// ============================================
function renderizarCalendario() {
  const container = document.getElementById('calendarioContainer');
  if (!container) return;
  
  const primerDia = new Date(añoActual, mesActual, 1);
  const ultimoDia = new Date(añoActual, mesActual + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;
  const hoy = new Date();
  
  let html = `
    <div class="calendario-header">
      <div class="calendario-nav">
        <button onclick="cambiarMes(-1)">←</button>
        <span class="calendario-mes">${mesesNombres[mesActual]} ${añoActual}</span>
        <button onclick="cambiarMes(1)">→</button>
      </div>
      <button class="btn-hoy" onclick="irHoy()">Hoy</button>
    </div>
    <div class="calendario-grid">
  `;
  
  diasSemana.forEach(d => html += `<div class="calendario-dia-semana">${d}</div>`);
  
  // Días del mes anterior
  for (let i = 0; i < primerDiaSemana; i++) {
    const d = new Date(añoActual, mesActual, -(primerDiaSemana - i - 1));
    html += `<div class="calendario-dia otro-mes"><span class="calendario-dia-numero">${d.getDate()}</span></div>`;
  }
  
  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const eventosDia = getEventosDia(dia);
    let clases = 'calendario-dia';
    
    if (hoy.getDate() === dia && hoy.getMonth() === mesActual && hoy.getFullYear() === añoActual) {
      clases += ' hoy';
    }
    if (eventosDia.length > 0) {
      clases += ' con-eventos';
    }
    
    html += `
      <div class="${clases}" onclick="verEventosDia(${dia})">
        <span class="calendario-dia-numero">${dia}</span>
        ${eventosDia.length > 0 ? `<span class="calendario-dia-contador">${eventosDia.length}</span>` : ''}
      </div>
    `;
  }
  
  // Días del mes siguiente
  const diasRestantes = (7 - ((primerDiaSemana + diasEnMes) % 7)) % 7;
  for (let i = 1; i <= diasRestantes; i++) {
    html += `<div class="calendario-dia otro-mes"><span class="calendario-dia-numero">${i}</span></div>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function getEventosDia(dia) {
  return eventos.filter(ev => {
    const fi = parsearFecha(ev["Fecha inicio"]);
    const ff = parsearFecha(ev["Fecha finalización"]);
    if (!fi) return false;
    
    const fechaDia = new Date(añoActual, mesActual, dia);
    fechaDia.setHours(0,0,0,0);
    
    const inicio = new Date(fi); inicio.setHours(0,0,0,0);
    
    if (ff) {
      const fin = new Date(ff); fin.setHours(0,0,0,0);
      return fechaDia >= inicio && fechaDia <= fin;
    }
    return fechaDia.getTime() === inicio.getTime();
  });
}

function cambiarMes(dir) {
  mesActual += dir;
  if (mesActual < 0) { mesActual = 11; añoActual--; }
  else if (mesActual > 11) { mesActual = 0; añoActual++; }
  cerrarEventosDia();
  renderizarCalendario();
}

function irHoy() {
  const hoy = new Date();
  mesActual = hoy.getMonth();
  añoActual = hoy.getFullYear();
  cerrarEventosDia();
  renderizarCalendario();
}

function verEventosDia(dia) {
  const eventosDia = getEventosDia(dia);
  if (eventosDia.length === 0) return;
  
  const fecha = new Date(añoActual, mesActual, dia);
  const fechaTexto = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const tituloEl = document.getElementById('eventosDiaTitulo');
  if (tituloEl) tituloEl.innerHTML = `<span class="icon">📅</span> ${fechaTexto} (${eventosDia.length})`;
  
  const listaEl = document.getElementById('eventosDiaList');
  if (listaEl) listaEl.innerHTML = eventosDia.map(ev => crearItemLista(ev)).join('');
  
  document.getElementById('eventosDiaSection')?.classList.remove('hidden');
}

function cerrarEventosDia() {
  document.getElementById('eventosDiaSection')?.classList.add('hidden');
}

// ============================================
// CAMBIAR VISTA
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(vista));
  });
  
  const vistaTarjetas = document.getElementById('vistaTarjetas');
  const vistaCalendario = document.getElementById('vistaCalendario');
  
  if (vista === 'tarjetas') {
    if (vistaTarjetas) vistaTarjetas.style.display = 'block';
    if (vistaCalendario) vistaCalendario.style.display = 'none';
  } else {
    if (vistaTarjetas) vistaTarjetas.style.display = 'none';
    if (vistaCalendario) vistaCalendario.style.display = 'block';
    renderizarCalendario();
  }
}

// ============================================
// BÚSQUEDA
// ============================================
function buscarEventos() {
  const term = document.getElementById('searchInput')?.value.trim().toLowerCase();
  
  if (!term) {
    cerrarBusqueda();
    return;
  }
  
  const filtrados = eventos.filter(ev => 
    (ev.Evento || '').toLowerCase().includes(term) ||
    (ev.Categoría || ev.Categoria || '').toLowerCase().includes(term) ||
    (ev['Centro Juvenil'] || '').toLowerCase().includes(term) ||
    (ev.Descripción || '').toLowerCase().includes(term)
  );
  
  const container = document.getElementById('searchResultsList');
  const section = document.getElementById('searchResults');
  
  if (!container || !section) return;
  
  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="empty-state active">
        <span class="material-symbols-outlined">search_off</span>
        <h3>Sin resultados</h3>
        <p>No encontramos eventos para "${term}"</p>
      </div>
    `;
  } else {
    container.innerHTML = filtrados.map(ev => crearItemLista(ev)).join('');
  }
  
  section.classList.remove('hidden');
  document.getElementById('vistaTarjetas')?.style.setProperty('display', 'none');
  document.getElementById('vistaCalendario')?.style.setProperty('display', 'none');
}

function cerrarBusqueda() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  document.getElementById('searchResults')?.classList.add('hidden');
  
  if (vistaActual === 'tarjetas') {
    document.getElementById('vistaTarjetas')?.style.setProperty('display', 'block');
  } else {
    document.getElementById('vistaCalendario')?.style.setProperty('display', 'block');
  }
}

// ============================================
// MODAL CATEGORÍA/CENTRO
// ============================================
function abrirModalCategoria(valor, tipo) {
  categoriaSeleccionada = { valor, tipo };
  
  let filtrados;
  let icono;
  
  if (tipo === 'centro') {
    filtrados = eventos.filter(ev => ev['Centro Juvenil'] === valor);
    icono = '🏢';
  } else {
    filtrados = eventos.filter(ev => (ev.Categoría || ev.Categoria || 'Otros') === valor);
    icono = getIconoCategoria(valor);
  }
  
  document.getElementById('categoryModalIcon').textContent = icono;
  document.getElementById('categoryModalName').textContent = valor;
  document.getElementById('categoryModalCount').textContent = filtrados.length;
  
  const lista = document.getElementById('categoryEventsList');
  if (lista) lista.innerHTML = filtrados.map(ev => crearItemLista(ev)).join('');
  
  document.getElementById('categoryOverlay')?.classList.add('active');
  document.getElementById('categoryModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalCategoria() {
  document.getElementById('categoryOverlay')?.classList.remove('active');
  document.getElementById('categoryModal')?.classList.remove('active');
  document.body.style.overflow = '';
  categoriaSeleccionada = null;
}

// ============================================
// MODAL DETALLE
// ============================================
function abrirModalDetalle(id) {
  eventoSeleccionado = eventos.find(ev => (ev['ID Eventos'] || ev.Evento) === id);
  if (!eventoSeleccionado) return;
  
  const ev = eventoSeleccionado;
  const modal = document.getElementById('detailModal');
  
  document.getElementById('detailImage').style.backgroundImage = `url('${getImagenEvento(ev)}')`;
  
  const estado = calcularEstado(ev);
  const cat = ev.Categoría || ev.Categoria;
  
  document.getElementById('detailBadges').innerHTML = `
    ${cat ? `<span class="detail-category-badge">${getIconoCategoria(cat)} ${cat}</span>` : ''}
    <span class="detail-status-badge status-${estado}">${getEstadoTexto(estado)}</span>
  `;
  
  document.getElementById('detailTitle').textContent = ev.Evento || 'Sin título';
  document.getElementById('detailDescription').textContent = ev.Descripción || ev.Descripcion || 'Evento organizado por COAJ Madrid. ¡No te lo pierdas!';
  
  document.getElementById('detailInfo').innerHTML = `
    <div class="detail-info-item">
      <span class="material-symbols-outlined">location_on</span>
      <div>
        <small>Centro</small>
        <strong>${ev['Centro Juvenil'] || 'Por definir'}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event</span>
      <div>
        <small>Inicio</small>
        <strong>${formatearFecha(ev["Fecha inicio"])}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event_available</span>
      <div>
        <small>Fin</small>
        <strong>${formatearFecha(ev["Fecha finalización"])}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">group</span>
      <div>
        <small>Plazas</small>
        <strong>${ev.Plazas || 'Ilimitadas'}</strong>
      </div>
    </div>
  `;
  
  const btn = document.getElementById('detailActionBtn');
  if (puedeInscribirse()) {
    btn.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Inscribirme';
    btn.onclick = inscribirse;
  } else {
    btn.innerHTML = '<span class="material-symbols-outlined">login</span> Inicia sesión';
    btn.onclick = () => { cerrarModalDetalle(); mostrarLoginModal(); };
  }
  
  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalDetalle() {
  document.getElementById('detailModal')?.classList.remove('active');
  document.body.style.overflow = '';
  eventoSeleccionado = null;
}

function puedeInscribirse() {
  const sesion = localStorage.getItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario');
  if (!sesion) return false;
  return JSON.parse(sesion).alias !== 'invitado';
}

// ============================================
// ACCIONES
// ============================================
async function inscribirse() {
  if (!eventoSeleccionado) return;
  
  const sesion = localStorage.getItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario');
  if (!sesion) {
    mostrarToast('Inicia sesión para inscribirte', 'error');
    return;
  }
  
  const usuario = JSON.parse(sesion);
  if (usuario.alias === 'invitado') {
    mostrarToast('Los invitados no pueden inscribirse', 'error');
    return;
  }
  
  const btn = document.getElementById('detailActionBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Procesando...';
  }
  
  try {
    const res = await fetch(`${API_BASE}/inscribir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        actividad: eventoSeleccionado.Evento, 
        usuario: usuario.alias 
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      mostrarToast('¡Inscripción exitosa!', 'success');
      cerrarModalDetalle();
    } else {
      mostrarToast(data.message || 'Error al inscribirse', 'error');
    }
  } catch (err) {
    mostrarToast('Error de conexión', 'error');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Inscribirme';
  }
}

function compartirEvento() {
  if (!eventoSeleccionado) return;
  
  const texto = `¡Mira este evento en COAJ Madrid! ${eventoSeleccionado.Evento}`;
  
  if (navigator.share) {
    navigator.share({
      title: eventoSeleccionado.Evento,
      text: texto,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(texto);
    mostrarToast('Enlace copiado al portapapeles', 'success');
  }
}

// ============================================
// TOAST
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const text = document.getElementById('toastMessage');
  
  if (!toast) return;
  
  if (icon) icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  if (text) text.textContent = mensaje;
  
  toast.className = `toast show ${tipo}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
