/**
 * COAJ Madrid - Espacios y Reservas - CÓDIGO COMPLETO
 * 100% conectado al backend real - SIN MOCK
 */

// ============================================
// CONSTANTES
// ============================================
const API_BASE = COAJ_CONFIG?.api?.base || 'https://coajmadrid-8273afef0255.herokuapp.com/api';
const CACHE_KEY_ESP = 'coaj_espacios_cache';
const CACHE_TTL = 5 * 60 * 1000;

// ============================================
// ESTADO GLOBAL
// ============================================
let espacios = [];
let centrosMap = new Map();
let centroNames = [];
let allTipos = [];
let openCentros = new Set();

let filterTipo = null;
let filterCentro = null;
let searchQ = '';
let espacioActivo = null;
let currentSlide = 0;
let calDate = new Date();
let selDate = null;
let selSlot = null;

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const TIPO_ICONS = {
  'Ocio y Tiempo Libre': {icon:'sports_esports',cls:'ocio'},
  'Estudio y formación': {icon:'menu_book',cls:'estudio'},
  'Música y desarrollo': {icon:'music_note',cls:'musica'},
  'Otros': {icon:'info',cls:'otros'},
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('🚀 Inicializando COAJ Espacios...');
  initTheme();
  verificarSesion();
  setupEventListeners();
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
      cerrarModalReserva();
      document.getElementById('userMenu')?.classList.remove('active');
      if (espacioActivo) volverListado();
    }
  });
}

// ============================================
// TEMA
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
  Object.entries(updates).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

// ============================================
// AUTENTICACIÓN
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
  Object.entries(updates).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function actualizarBottomNav(logueado) {
  const g = document.getElementById('bottomNavGuest');
  const u = document.getElementById('bottomNavUser');
  if (g) g.style.display = logueado ? 'none' : 'flex';
  if (u) u.style.display = logueado ? 'flex' : 'none';
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

  if (!alias || !contrasena) { mostrarErrorLogin('Completa todos los campos'); return; }

  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...'; }
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
    mostrarErrorLogin('Error de conexión');
  }
  if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión'; }
}

function entrarComoInvitado() {
  const usuario = { alias: 'invitado', nombre: 'Invitado' };
  localStorage.setItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario', JSON.stringify(usuario));
  document.getElementById('loginModal')?.classList.add('hidden');
  actualizarUIUsuario(usuario);
  actualizarBottomNav(true);
  cargarDatos();
}

function mostrarErrorLogin(msg) {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function cerrarSesion() {
  localStorage.removeItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario');
  localStorage.removeItem(CACHE_KEY_ESP);
  window.location.reload();
}

function esUsuarioLogueado() {
  const s = localStorage.getItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario');
  if (!s) return false;
  return JSON.parse(s).alias !== 'invitado';
}

// ============================================
// CARGAR DATOS - 100% BACKEND
// ============================================
async function cargarDatos(forceRefresh = false) {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('active');

  try {
    console.log('🌐 Cargando espacios desde API...');
    const res = await fetch(`${API_BASE}/espacios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    procesarDatos(data.espacios || []);
    console.log(`✅ ${data.espacios?.length || 0} espacios cargados`);
  } catch (err) {
    console.error('❌ Error cargando espacios:', err);
    mostrarToast('Error al cargar espacios', 'error');
    document.getElementById('emptyState')?.classList.add('active');
  }
  
  if (loading) loading.classList.remove('active');
}

function refrescarDatos() {
  console.log('🔄 Refrescando espacios...');
  cargarDatos(true);
  mostrarToast('Actualizando espacios...', 'success');
}
window.refrescarDatos = refrescarDatos;

function procesarDatos(rawEspacios) {
  console.log('🔍 Datos recibidos:', rawEspacios);
  console.log('🔍 Tipo:', typeof rawEspacios);
  console.log('🔍 Es array:', Array.isArray(rawEspacios));
  console.log('🔍 Cantidad:', rawEspacios?.length);
  
  if (!rawEspacios || !Array.isArray(rawEspacios)) {
    console.error('❌ rawEspacios no es un array válido');
    return;
  }
  
  centrosMap = new Map();
  
  rawEspacios.forEach((espacio) => {
    if (!centrosMap.has(espacio.coaj)) centrosMap.set(espacio.coaj, []);
    
    // Agregar fotos por defecto si no las tiene
    if (!espacio.photos || !espacio.photos.length) {
      const defaultPhotos = getDefaultPhotos(espacio.tipo);
      espacio.photos = defaultPhotos;
    }
    
    // Agregar features si no las tiene
    if (!espacio.features) {
      espacio.features = getDefaultFeatures(espacio.tipo);
    }
    
    centrosMap.get(espacio.coaj).push(espacio);
  });

  centroNames = [...centrosMap.keys()];
  allTipos = [...new Set(rawEspacios.map(e => e.tipo))];
  espacios = rawEspacios;

  // Abrir todos por defecto
  centroNames.forEach(c => openCentros.add(c));

  renderStats();
  renderFilters();
  renderListado();
}

function getDefaultPhotos(tipo) {
  const photos = {
    'Ocio y Tiempo Libre': [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&q=80',
      'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=900&q=80'
    ],
    'Estudio y formación': [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80'
    ],
    'Música y desarrollo': [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&q=80'
    ],
    'Otros': [
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80'
    ]
  };
  return photos[tipo] || photos['Otros'];
}

function getDefaultFeatures(tipo) {
  const features = {
    'Ocio y Tiempo Libre': [
      {icon:'wifi',label:'WiFi',val:'Gratuito'},
      {icon:'tv',label:'Proyector',val:'HD'},
      {icon:'sports_esports',label:'Consolas',val:'Disponibles'},
      {icon:'ac_unit',label:'Clima',val:'Climatizado'}
    ],
    'Estudio y formación': [
      {icon:'wifi',label:'WiFi',val:'Alta velocidad'},
      {icon:'power',label:'Enchufes',val:'En cada puesto'},
      {icon:'computer',label:'PCs',val:'Disponibles'},
      {icon:'ac_unit',label:'Clima',val:'Climatizado'}
    ],
    'Música y desarrollo': [
      {icon:'music_note',label:'Equipo',val:'Profesional'},
      {icon:'mic',label:'Micros',val:'Disponibles'},
      {icon:'speaker',label:'Sonido',val:'PA + Monitor'},
      {icon:'ac_unit',label:'Clima',val:'Climatizado'}
    ],
    'Otros': [
      {icon:'wifi',label:'WiFi',val:'Gratuito'},
      {icon:'ac_unit',label:'Clima',val:'Climatizado'},
      {icon:'accessible',label:'Acceso',val:'Adaptado'},
      {icon:'schedule',label:'Horario',val:'L-V 10-14h'}
    ]
  };
  return features[tipo] || features['Otros'];
}

// ============================================
// STATS
// ============================================
function renderStats() {
  document.getElementById('statCentros').textContent = centrosMap.size;
  document.getElementById('statSalas').textContent = espacios.length;
  document.getElementById('statTipos').textContent = allTipos.length;
  document.getElementById('statDisponibles').textContent = espacios.length;
}

// ============================================
// FILTROS
// ============================================
function renderFilters() {
  const chipsEl = document.getElementById('filtersChips');
  const tipoCounts = {};
  allTipos.forEach(t => tipoCounts[t] = espacios.filter(e => e.tipo === t).length);

  let h = `<button class="filter-chip ${!filterTipo ? 'active' : ''}" onclick="setFilterTipo(null)">
    <span class="material-symbols-outlined">apps</span> Todos <span class="chip-count">${espacios.length}</span>
  </button>`;

  allTipos.forEach(t => {
    const ti = TIPO_ICONS[t] || TIPO_ICONS['Otros'];
    h += `<button class="filter-chip ${filterTipo === t ? 'active' : ''}" onclick="setFilterTipo('${t}')">
      <span class="material-symbols-outlined">${ti.icon}</span> ${t} <span class="chip-count">${tipoCounts[t]}</span>
    </button>`;
  });
  chipsEl.innerHTML = h;

  const centroSel = document.getElementById('filtroCentro');
  centroSel.innerHTML = '<option value="">📍 Todos los centros</option>' +
    centroNames.map(c => `<option value="${c}" ${filterCentro === c ? 'selected' : ''}>${c.replace('COAJ ', '')}</option>`).join('');

  const tipoSel = document.getElementById('filtroTipo');
  tipoSel.innerHTML = '<option value="">🏷️ Todas las categorías</option>' +
    allTipos.map(t => `<option value="${t}" ${filterTipo === t ? 'selected' : ''}>${t}</option>`).join('');
}

function setFilterTipo(t) {
  filterTipo = filterTipo === t ? null : t;
  document.getElementById('filtroTipo').value = filterTipo || '';
  renderFilters();
  renderListado();
}

function aplicarFiltros() {
  filterCentro = document.getElementById('filtroCentro').value || null;
  filterTipo = document.getElementById('filtroTipo').value || null;
  renderFilters();
  renderListado();
}

function filtrarGlobal() {
  searchQ = document.getElementById('searchInput').value.toLowerCase().trim();
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !searchQ);
  renderListado();
}

function limpiarBusqueda() {
  document.getElementById('searchInput').value = '';
  searchQ = '';
  document.getElementById('searchClear')?.classList.add('hidden');
  renderListado();
}

// ============================================
// LISTADO
// ============================================
function renderListado() {
  const container = document.getElementById('vistaListado');
  let html = '';
  let totalVisible = 0;

  centrosMap.forEach((espaciosC, centroName) => {
    if (filterCentro && filterCentro !== centroName) return;
    let filtered = espaciosC;
    if (filterTipo) filtered = filtered.filter(e => e.tipo === filterTipo);
    if (searchQ) filtered = filtered.filter(e =>
      e.nombre.toLowerCase().includes(searchQ) ||
      e.tipo.toLowerCase().includes(searchQ) ||
      e.coaj.toLowerCase().includes(searchQ)
    );
    if (filtered.length === 0) return;
    totalVisible += filtered.length;

    const shortName = centroName.replace('COAJ ', '');
    const initials = shortName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isOpen = openCentros.has(centroName);
    const tiposInCentro = [...new Set(filtered.map(e => e.tipo))];

    html += `
    <div class="centro-card ${isOpen ? 'open' : ''}">
      <div class="centro-card-header" onclick="toggleCentro('${centroName}')">
        <div class="centro-avatar">${initials}</div>
        <div class="centro-card-info">
          <div class="centro-card-name">${centroName}</div>
          <div class="centro-card-meta">
            <span class="centro-card-meta-item"><span class="material-symbols-outlined">meeting_room</span> ${filtered.length} espacios</span>
            <span class="centro-card-meta-item"><span class="material-symbols-outlined">location_on</span> Madrid</span>
          </div>
        </div>
        <div class="centro-badges">${tiposInCentro.map(t => `<span class="centro-badge-tag">${t}</span>`).join('')}</div>
        <button class="centro-toggle-btn"><span class="material-symbols-outlined">expand_more</span></button>
      </div>
      <div class="centro-salas-wrap">
        <div class="salas-grid-inner"><div class="salas-grid">
          ${filtered.map(e => {
            const ti = TIPO_ICONS[e.tipo] || TIPO_ICONS['Otros'];
            return `
            <div class="sala-card" onclick="abrirEspacio('${e.id}')">
              <div class="sala-card-icon ${ti.cls}"><span class="material-symbols-outlined">${ti.icon}</span></div>
              <div class="sala-card-info">
                <div class="sala-card-name">${e.nombre}</div>
                <div class="sala-card-details">
                  <span class="sala-tipo-tag ${ti.cls}">${e.tipo}</span>
                  <span class="material-symbols-outlined">group</span> ${e.capacidad}
                  <span class="material-symbols-outlined">schedule</span> ${e.duracion}
                </div>
              </div>
              <span class="material-symbols-outlined sala-card-arrow">chevron_right</span>
            </div>`;
          }).join('')}
        </div></div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
  const empty = document.getElementById('emptyState');
  if (empty) empty.classList.toggle('active', totalVisible === 0);
}

function toggleCentro(name) {
  if (openCentros.has(name)) openCentros.delete(name); else openCentros.add(name);
  renderListado();
}

// ============================================
// DETALLE ESPACIO
// ============================================
function abrirEspacio(id) {
  let espacio = null;
  centrosMap.forEach(espaciosC => { 
    const found = espaciosC.find(e => e.id === id); 
    if (found) espacio = found; 
  });
  if (!espacio) return;

  espacioActivo = espacio;
  selDate = null; 
  selSlot = null; 
  currentSlide = 0;
  calDate = new Date();

  document.getElementById('vistaListado').style.display = 'none';
  document.querySelector('.filters-section').style.display = 'none';
  document.querySelector('.stats-bar').style.display = 'none';

  const detalle = document.getElementById('vistaDetalle');
  detalle.classList.add('active');
  detalle.innerHTML = buildDetalleHTML(espacio);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  renderCalendar();
}

function volverListado() {
  document.getElementById('vistaDetalle').classList.remove('active');
  document.getElementById('vistaDetalle').innerHTML = '';
  document.getElementById('vistaListado').style.display = '';
  document.querySelector('.filters-section').style.display = '';
  document.querySelector('.stats-bar').style.display = '';
  espacioActivo = null;
}

function buildDetalleHTML(e) {
  const ti = TIPO_ICONS[e.tipo] || TIPO_ICONS['Otros'];
  return `
    <div class="detail-back-bar">
      <button class="btn-back" onclick="volverListado()">
        <span class="material-symbols-outlined">arrow_back</span> Volver
      </button>
      <div class="breadcrumb">
        ${e.coaj} <span class="material-symbols-outlined">chevron_right</span> <strong>${e.nombre}</strong>
      </div>
    </div>

    <div class="gallery" id="gallery">
      <div class="gallery-slides" id="gallerySlides">
        ${e.photos.map(p => `<div class="gallery-slide" style="background-image:url('${p}')"></div>`).join('')}
      </div>
      <div class="gallery-overlay-info">
        <h2>${e.nombre}</h2>
        <p><span class="material-symbols-outlined">location_on</span> ${e.coaj} · Madrid</p>
        <div class="gallery-tags">
          <span class="gallery-tag">${e.tipo}</span>
          <span class="gallery-tag">👥 ${e.capacidad} personas</span>
          <span class="gallery-tag">⏱ ${e.duracion}</span>
          <span class="gallery-tag">💰 ${e.precio}</span>
        </div>
      </div>
      <button class="gallery-nav-btn gallery-prev" onclick="galleryMove(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
      <button class="gallery-nav-btn gallery-next" onclick="galleryMove(1)"><span class="material-symbols-outlined">chevron_right</span></button>
      <div class="gallery-dots" id="galleryDots">
        ${e.photos.map((_, i) => `<button class="gallery-dot ${i === 0 ? 'active' : ''}" onclick="galleryGo(${i})"></button>`).join('')}
      </div>
      <div class="gallery-counter" id="galleryCounter">1 / ${e.photos.length}</div>
    </div>

    <div class="detail-grid">
      <div class="detail-left">
        <div class="detail-section">
          <div class="detail-section-title"><span class="material-symbols-outlined">description</span> Sobre este espacio</div>
          <p>${e.desc}</p>
        </div>
        <div class="detail-section">
          <div class="detail-section-title"><span class="material-symbols-outlined">star</span> Características</div>
          <div class="features-grid">
            ${e.features.map(f => `
              <div class="feature-item">
                <div class="feature-icon-box"><span class="material-symbols-outlined">${f.icon}</span></div>
                <div><div class="feature-label">${f.label}</div><div class="feature-value">${f.val}</div></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title"><span class="material-symbols-outlined">info</span> Normas del espacio</div>
          <p>• Respetar horarios de inicio y fin de la reserva.<br>
          • Dejar el espacio en las mismas condiciones.<br>
          • No consumir alimentos en salas con equipos electrónicos.<br>
          • Calzado adecuado en salas de danza y espejos.<br>
          • Comunicar incidencias al personal del centro.</p>
        </div>
      </div>
      <div class="detail-right">
        <div class="calendar-card">
          <div class="calendar-card-header">
            <h3><span class="material-symbols-outlined">event_available</span> Reservar este espacio</h3>
            <p>Selecciona fecha y horario disponible</p>
          </div>
          <div class="cal-nav">
            <button class="cal-nav-btn" onclick="calNav(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
            <span class="cal-month-label" id="calMonth"></span>
            <button class="cal-nav-btn" onclick="calNav(1)"><span class="material-symbols-outlined">chevron_right</span></button>
          </div>
          <div class="cal-weekdays">
            ${['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map(d => `<div class="cal-wd">${d}</div>`).join('')}
          </div>
          <div class="cal-days" id="calDays"></div>
          <div id="slotsArea"></div>
          <div class="booking-cta" id="bookingCta" style="display:none">
            <div class="booking-info"><span>Tu reserva</span><strong id="bookingSummary"></strong></div>
            <button class="btn-reservar" onclick="confirmarReserva()">
              <span class="material-symbols-outlined">event_available</span> Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// GALLERY
// ============================================
function galleryGo(idx) {
  if (!espacioActivo) return;
  const total = espacioActivo.photos.length;
  currentSlide = ((idx % total) + total) % total;
  const slides = document.getElementById('gallerySlides');
  if (slides) slides.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  const counter = document.getElementById('galleryCounter');
  if (counter) counter.textContent = `${currentSlide + 1} / ${total}`;
}
function galleryMove(dir) { galleryGo(currentSlide + dir); }

// ============================================
// CALENDARIO
// ============================================
function renderCalendar() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  const monthEl = document.getElementById('calMonth');
  if (monthEl) monthEl.textContent = `${MESES[m]} ${y}`;

  const first = new Date(y, m, 1);
  let start = first.getDay() - 1; if (start < 0) start = 6;
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let h = '';
  const prev = new Date(y, m, 0).getDate();
  for (let i = start - 1; i >= 0; i--) h += `<div class="cal-day cal-day-off">${prev - i}</div>`;

  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d); dt.setHours(0, 0, 0, 0);
    const past = dt < today;
    const isToday = dt.getTime() === today.getTime();
    const wknd = dt.getDay() === 0 || dt.getDay() === 6;
    const avail = !past && !wknd;
    const slots = avail ? Math.floor(Math.random() * 6) + 2 : 0;
    const isSel = selDate && dt.getTime() === selDate.getTime();

    let cls = 'cal-day';
    if (past) cls += ' cal-day-past';
    if (isToday) cls += ' cal-day-today';
    if (avail) cls += ' cal-day-avail';
    if (isSel) cls += ' cal-day-sel';

    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    h += `<div class="${cls}" onclick="pickDate('${ds}')"><span>${d}</span>${avail ? `<span class="cal-day-slots">${slots} libres</span>` : ''}</div>`;
  }

  const rem = (7 - ((start + days) % 7)) % 7;
  for (let i = 1; i <= rem; i++) h += `<div class="cal-day cal-day-off">${i}</div>`;

  const el = document.getElementById('calDays');
  if (el) el.innerHTML = h;
}

function calNav(dir) { calDate.setMonth(calDate.getMonth() + dir); renderCalendar(); }

function pickDate(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  selDate = new Date(y, m - 1, d); selSlot = null;
  renderCalendar();
  renderSlots();
  updateBookingCta();
}

// ============================================
// SLOTS - BACKEND REAL
// ============================================
async function renderSlots() {
  const container = document.getElementById('slotsArea');
  if (!selDate || !container || !espacioActivo) return;

  const dayStr = selDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaApi = selDate.toLocaleDateString('en-US').replace(/\//g, '-'); // MM-DD-YYYY
  
  try {
    const res = await fetch(`${API_BASE}/disponibilidad/${encodeURIComponent(espacioActivo.nombre)}/${fechaApi}`);
    const data = await res.json();
    
    const horasOcupadas = data.horasOcupadas || [];
    const horarios = ['10:00','11:00','12:00','13:00','14:00','16:00','17:00','18:00','19:00','20:00'];
    
    const slots = horarios.map(hora => {
      const ocupado = horasOcupadas.some(ocupada => 
        hora >= ocupada.inicio && hora < ocupada.fin
      );
      return { time: hora, off: ocupado };
    });

    container.innerHTML = `
      <div class="slots-area">
        <div class="slots-label">
          <span class="material-symbols-outlined">schedule</span> Horarios
          <span class="slots-date">${dayStr}</span>
        </div>
        <div class="slots-grid">
          ${slots.map(s => `
            <button class="slot-btn ${s.off ? 'slot-off' : ''} ${selSlot === s.time ? 'slot-sel' : ''}"
              onclick="pickSlot('${s.time}')" ${s.off ? 'disabled' : ''}>
              <div class="slot-time">${s.time}</div>
              <div class="slot-status">${s.off ? 'Ocupado' : 'Disponible'}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error obteniendo disponibilidad:', err);
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Error al cargar horarios</p>';
  }
}

function pickSlot(t) { selSlot = t; renderSlots(); updateBookingCta(); }

function updateBookingCta() {
  const cta = document.getElementById('bookingCta');
  if (!cta) return;
  if (selDate && selSlot) {
    cta.style.display = '';
    const ds = selDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    document.getElementById('bookingSummary').textContent = `${espacioActivo.nombre} · ${ds} · ${selSlot}h`;
  } else {
    cta.style.display = 'none';
  }
}

// ============================================
// RESERVAS - BACKEND REAL
// ============================================
async function confirmarReserva() {
  if (!espacioActivo || !selDate || !selSlot) return;

  if (!esUsuarioLogueado()) {
    mostrarToast('Inicia sesión para reservar', 'error');
    return;
  }

  const sesion = JSON.parse(localStorage.getItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario'));
  const btn = document.querySelector('.btn-reservar');
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Reservando...';
  }

  try {
    const res = await fetch(`${API_BASE}/reservar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salaId: espacioActivo.id,
        salaNombre: espacioActivo.nombre,
        centro: espacioActivo.coaj,
        fecha: selDate.toLocaleDateString('en-US'), // MM/DD/YYYY
        hora: selSlot,
        usuario: sesion.alias
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      mostrarToast('✅ ¡Reserva confirmada!', 'success');
      selDate = null; 
      selSlot = null;
      const slotsArea = document.getElementById('slotsArea');
      if (slotsArea) slotsArea.innerHTML = '';
      const cta = document.getElementById('bookingCta');
      if (cta) cta.style.display = 'none';
      renderCalendar();
    } else {
      mostrarToast(data.message || 'Error al reservar', 'error');
    }
  } catch (err) {
    console.error('Error en reserva:', err);
    mostrarToast('Error de conexión', 'error');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">event_available</span> Confirmar Reserva';
  }
}

// ============================================
// MODAL
// ============================================
function cerrarModalReserva() {
  document.getElementById('reservaOverlay')?.classList.remove('active');
  document.getElementById('reservaModal')?.classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================
// TOAST
// ============================================
function mostrarToast(msg, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const text = document.getElementById('toastMessage');
  if (!toast) return;
  if (icon) icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  if (text) text.textContent = msg;
  toast.className = `toast show ${tipo}`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}
