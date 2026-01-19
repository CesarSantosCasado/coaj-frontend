/**
 * COAJ Madrid - Exposiciones JS
 * Funcionalidad completa para página de exposiciones
 */

// ============================================
// VARIABLES GLOBALES
// ============================================
let exposiciones = [];
let exposicionesFiltradas = [];
let vistaActual = 'tarjetas';
let mesActual = new Date();
let exposicionActual = null;

const API_BASE = COAJ_CONFIG?.api?.base || 'https://coajmadrid-8273afef0255.herokuapp.com/api';
const CACHE_KEY = 'coaj_exposiciones_cache';
const CACHE_TTL = 5 * 60 * 1000;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  aplicarTema();
  cargarDatos();
  
  document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    if (userMenu?.classList.contains('active') && !e.target.closest('.avatar-btn') && !e.target.closest('.user-menu')) {
      userMenu.classList.remove('active');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalDetalle();
      cerrarModalCentro();
      cerrarExposicionesDia();
    }
  });
});

// ============================================
// SESIÓN Y AUTENTICACIÓN
// ============================================
function verificarSesion() {
  const usuario = localStorage.getItem('coajUsuario');
  if (usuario) {
    const user = JSON.parse(usuario);
    actualizarUIUsuario(user);
    document.getElementById('loginModal').classList.add('hidden');
  }
}

function actualizarUIUsuario(user) {
  const inicial = user.nombre?.charAt(0).toUpperCase() || 'U';
  const nombre = user.nombre || 'Usuario';
  
  document.getElementById('avatarInitial').textContent = inicial;
  document.getElementById('menuAvatarInitial').textContent = inicial;
  document.getElementById('menuUserName').textContent = nombre;
  document.getElementById('headerGreeting').textContent = `Hola, ${nombre.split(' ')[0]}`;
  
  document.getElementById('bottomNavGuest').style.display = 'none';
  document.getElementById('bottomNavUser').style.display = 'flex';
}

function entrarComoInvitado() {
  const invitado = { alias: 'invitado', nombre: 'Invitado' };
  localStorage.setItem('coajUsuario', JSON.stringify(invitado));
  actualizarUIUsuario(invitado);
  document.getElementById('loginModal').classList.add('hidden');
  mostrarToast('Bienvenido a COAJ', 'success');
}

async function iniciarSesion(event) {
  event.preventDefault();
  
  const alias = document.getElementById('alias').value.trim();
  const contrasena = document.getElementById('contrasena').value;
  const errorDiv = document.getElementById('loginError');
  const btn = event.target.querySelector('button[type="submit"]');
  
  if (!alias || !contrasena) {
    errorDiv.textContent = 'Completa todos los campos';
    errorDiv.style.display = 'block';
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...';
  
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, contrasena })
    });
    
    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('coajUsuario', JSON.stringify(data.usuario));
      actualizarUIUsuario(data.usuario);
      document.getElementById('loginModal').classList.add('hidden');
      mostrarToast(`¡Bienvenido, ${data.usuario.nombre}!`, 'success');
    } else {
      errorDiv.textContent = data.message || 'Credenciales incorrectas';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Error de conexión';
    errorDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión';
  }
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  sessionStorage.removeItem(CACHE_KEY);
  location.reload();
}

function mostrarLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
}

// ============================================
// TEMA
// ============================================
function aplicarTema() {
  const tema = localStorage.getItem('coajTheme') || 'light';
  document.documentElement.setAttribute('data-theme', tema);
  actualizarIconosTema(tema);
}

function toggleTheme() {
  const actual = document.documentElement.getAttribute('data-theme');
  const nuevo = actual === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nuevo);
  localStorage.setItem('coajTheme', nuevo);
  actualizarIconosTema(nuevo);
}

function actualizarIconosTema(tema) {
  const iconos = ['themeIcon', 'menuThemeIcon'];
  const textoMenu = document.getElementById('menuThemeText');
  
  iconos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = tema === 'dark' ? 'light_mode' : 'dark_mode';
  });
  
  if (textoMenu) textoMenu.textContent = tema === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
}

function toggleUserMenu() {
  document.getElementById('userMenu').classList.toggle('active');
}

// ============================================
// CARGA DE DATOS
// ============================================
async function cargarDatos(forzar = false) {
  mostrarLoading(true);
  
  if (!forzar) {
    const cache = obtenerCache();
    if (cache) {
      exposiciones = cache;
      procesarDatos();
      return;
    }
  }
  
  try {
    const res = await fetch(`${API_BASE}/exposiciones`);
    const data = await res.json();
    
    exposiciones = data.exposiciones || [];
    guardarCache(exposiciones);
    procesarDatos();
  } catch (error) {
    console.error('Error cargando exposiciones:', error);
    mostrarToast('Error al cargar exposiciones', 'error');
    mostrarLoading(false);
    document.getElementById('emptyState').classList.add('active');
  }
}

function refrescarDatos() {
  sessionStorage.removeItem(CACHE_KEY);
  cargarDatos(true);
  mostrarToast('Actualizando...', 'success');
}

function obtenerCache() {
  try {
    const item = sessionStorage.getItem(CACHE_KEY);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function guardarCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Error guardando cache');
  }
}

// ============================================
// PROCESAMIENTO DE DATOS
// ============================================
function procesarDatos() {
  mostrarLoading(false);
  
  if (!exposiciones.length) {
    document.getElementById('emptyState').classList.add('active');
    return;
  }
  
  exposicionesFiltradas = [...exposiciones];
  
  renderCarouselActivas();
  renderCentros();
  renderListaCompleta();
  renderCalendario();
  
  document.getElementById('activasSection').classList.remove('hidden');
  document.getElementById('centrosSection').classList.remove('hidden');
  document.getElementById('allExposicionesSection').classList.remove('hidden');
}

function mostrarLoading(show) {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('emptyState');
  
  if (show) {
    loading.classList.remove('hidden');
    empty.classList.remove('active');
  } else {
    loading.classList.add('hidden');
  }
}

// ============================================
// UTILIDADES DE FECHA
// ============================================
function parsearFecha(fechaStr) {
  if (!fechaStr) return null;
  try {
    if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
      const partes = fechaStr.split('/');
      return new Date(parseInt(partes[2]), parseInt(partes[0]) - 1, parseInt(partes[1]));
    }
    const fecha = new Date(fechaStr);
    return isNaN(fecha.getTime()) ? null : fecha;
  } catch (e) {
    return null;
  }
}

function formatearFecha(fechaStr) {
  const fecha = parsearFecha(fechaStr);
  if (!fecha) return fechaStr || '';
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatearRangoFechas(desde, hasta) {
  return `${formatearFecha(desde)} - ${formatearFecha(hasta)}`;
}

// ============================================
// RENDER CAROUSEL ACTIVAS
// ============================================
function renderCarouselActivas() {
  const container = document.getElementById('activasCarousel');
  const activas = exposiciones.filter(e => e.Estado === 'En activo');
  
  if (!activas.length) {
    document.getElementById('activasSection').classList.add('hidden');
    return;
  }
  
  container.innerHTML = activas.map(expo => crearCardHTML(expo)).join('');
}

function crearCardHTML(expo) {
  const imagen = expo.URL_Imagen_Exposicion || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';
  const estado = expo.Estado || '';
  const badgeClass = estado === 'En activo' ? 'badge-activo' : 
                     estado === 'Montaje' ? 'badge-montaje' : 'badge-finalizado';
  
  return `
    <div class="expo-card" onclick="abrirDetalle('${expo._RowNumber || expo.Id}')">
      <div class="expo-card-image" style="background-image: url('${imagen}')">
        ${estado ? `<span class="expo-card-badge ${badgeClass}">${estado}</span>` : ''}
      </div>
      <div class="expo-card-body">
        <h3 class="expo-card-title">${expo.NombreExpo || 'Sin nombre'}</h3>
        <div class="expo-card-meta">
          <div class="expo-card-meta-item">
            <span class="material-symbols-outlined">calendar_month</span>
            <span>${formatearRangoFechas(expo.Desde, expo.Hasta)}</span>
          </div>
          <div class="expo-card-meta-item">
            <span class="material-symbols-outlined">location_on</span>
            <span>${expo['Centro Juvenil'] || 'Sin centro'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// RENDER CENTROS
// ============================================
function renderCentros() {
  const container = document.getElementById('centrosGrid');
  const centrosMap = {};
  
  exposiciones.forEach(expo => {
    const centro = expo['Centro Juvenil'];
    if (centro) {
      centrosMap[centro] = (centrosMap[centro] || 0) + 1;
    }
  });
  
  const centros = Object.entries(centrosMap).sort((a, b) => b[1] - a[1]);
  
  if (!centros.length) {
    document.getElementById('centrosSection').classList.add('hidden');
    return;
  }
  
  container.innerHTML = centros.map(([nombre, count]) => `
    <div class="centro-chip" onclick="abrirModalCentro('${nombre}')">
      <span class="centro-icon">🏢</span>
      <span class="centro-name">${nombre}</span>
      <span class="centro-count">${count}</span>
    </div>
  `).join('');
}

// ============================================
// RENDER LISTA COMPLETA
// ============================================
function renderListaCompleta() {
  const container = document.getElementById('allExposicionesList');
  const countEl = document.getElementById('totalCount');
  
  countEl.textContent = `${exposicionesFiltradas.length} exposiciones`;
  container.innerHTML = exposicionesFiltradas.map(expo => crearListItemHTML(expo)).join('');
}

function crearListItemHTML(expo) {
  const imagen = expo.URL_Imagen_Exposicion || 'https://placehold.co/200x200/032845/ffffff?text=COAJ';
  const estado = expo.Estado || '';
  const statusClass = estado === 'En activo' ? 'status-activo' : 
                      estado === 'Montaje' ? 'status-montaje' : 'status-finalizado';
  
  return `
    <div class="expo-list-item" onclick="abrirDetalle('${expo._RowNumber || expo.Id}')">
      <div class="expo-list-image" style="background-image: url('${imagen}')"></div>
      <div class="expo-list-content">
        <h3 class="expo-list-title">${expo.NombreExpo || 'Sin nombre'}</h3>
        <div class="expo-list-badges">
          ${estado ? `<span class="status-badge ${statusClass}">${estado}</span>` : ''}
        </div>
        <div class="expo-list-info">
          <span class="expo-list-info-item">
            <span class="material-symbols-outlined">calendar_month</span>
            ${formatearRangoFechas(expo.Desde, expo.Hasta)}
          </span>
          <span class="expo-list-info-item">
            <span class="material-symbols-outlined">location_on</span>
            ${expo['Centro Juvenil'] || ''}
          </span>
        </div>
      </div>
      <span class="material-symbols-outlined expo-list-arrow">chevron_right</span>
    </div>
  `;
}

// ============================================
// BÚSQUEDA
// ============================================
function buscarExposiciones() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const resultsSection = document.getElementById('searchResults');
  const resultsList = document.getElementById('searchResultsList');
  const vistaTarjetas = document.getElementById('vistaTarjetas');
  const vistaCalendario = document.getElementById('vistaCalendario');
  
  if (!query) {
    cerrarBusqueda();
    return;
  }
  
  const resultados = exposiciones.filter(expo => {
    const nombre = (expo.NombreExpo || '').toLowerCase();
    const centro = (expo['Centro Juvenil'] || '').toLowerCase();
    const espacio = (expo.EspacioActual || '').toLowerCase();
    const descripcion = (expo.Descripcion || expo.Descripción || '').toLowerCase();
    
    return nombre.includes(query) || centro.includes(query) || 
           espacio.includes(query) || descripcion.includes(query);
  });
  
  vistaTarjetas.style.display = 'none';
  vistaCalendario.style.display = 'none';
  resultsSection.classList.remove('hidden');
  
  if (resultados.length) {
    resultsList.innerHTML = resultados.map(expo => crearListItemHTML(expo)).join('');
  } else {
    resultsList.innerHTML = `
      <div class="empty-state active">
        <span class="material-symbols-outlined">search_off</span>
        <h3>Sin resultados</h3>
        <p>No se encontraron exposiciones para "${query}"</p>
      </div>
    `;
  }
}

function cerrarBusqueda() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').classList.add('hidden');
  
  if (vistaActual === 'tarjetas') {
    document.getElementById('vistaTarjetas').style.display = 'block';
  } else {
    document.getElementById('vistaCalendario').style.display = 'block';
  }
}

// ============================================
// VISTAS
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  event.target.closest('.view-btn').classList.add('active');
  
  const vistaTarjetas = document.getElementById('vistaTarjetas');
  const vistaCalendario = document.getElementById('vistaCalendario');
  const searchResults = document.getElementById('searchResults');
  
  searchResults.classList.add('hidden');
  document.getElementById('searchInput').value = '';
  
  if (vista === 'tarjetas') {
    vistaTarjetas.style.display = 'block';
    vistaCalendario.style.display = 'none';
  } else {
    vistaTarjetas.style.display = 'none';
    vistaCalendario.style.display = 'block';
    renderCalendario();
  }
}

// ============================================
// CALENDARIO
// ============================================
function renderCalendario() {
  const container = document.getElementById('calendarioContainer');
  const año = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = primerDia.getDay();
  
  const nombreMes = mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Contar exposiciones por día
  const exposicionesPorDia = {};
  exposiciones.forEach(expo => {
    const desde = parsearFecha(expo.Desde);
    const hasta = parsearFecha(expo.Hasta);
    
    if (desde && hasta) {
      const current = new Date(desde);
      while (current <= hasta) {
        if (current.getMonth() === mes && current.getFullYear() === año) {
          const key = current.getDate();
          exposicionesPorDia[key] = (exposicionesPorDia[key] || 0) + 1;
        }
        current.setDate(current.getDate() + 1);
      }
    }
  });
  
  let html = `
    <div class="calendario-header">
      <div class="calendario-nav">
        <button onclick="cambiarMes(-1)">‹</button>
        <span class="calendario-mes">${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</span>
        <button onclick="cambiarMes(1)">›</button>
      </div>
      <button class="btn-hoy" onclick="irAHoy()">Hoy</button>
    </div>
    <div class="calendario-grid">
      ${diasSemana.map(d => `<div class="calendario-dia-semana">${d}</div>`).join('')}
  `;
  
  // Días del mes anterior
  const diasMesAnterior = new Date(año, mes, 0).getDate();
  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    html += `<div class="calendario-dia otro-mes"><span class="calendario-dia-numero">${diasMesAnterior - i}</span></div>`;
  }
  
  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(año, mes, dia);
    fecha.setHours(0, 0, 0, 0);
    
    const esHoy = fecha.getTime() === hoy.getTime();
    const count = exposicionesPorDia[dia] || 0;
    
    let clases = 'calendario-dia';
    if (esHoy) clases += ' hoy';
    if (count > 0) clases += ' con-eventos';
    
    html += `
      <div class="${clases}" onclick="mostrarExposicionesDia(${año}, ${mes}, ${dia})">
        <span class="calendario-dia-numero">${dia}</span>
        ${count > 0 ? `<span class="calendario-dia-contador">${count}</span>` : ''}
      </div>
    `;
  }
  
  // Días del mes siguiente
  const diasRestantes = 42 - (primerDiaSemana + diasEnMes);
  for (let i = 1; i <= diasRestantes; i++) {
    html += `<div class="calendario-dia otro-mes"><span class="calendario-dia-numero">${i}</span></div>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function cambiarMes(delta) {
  mesActual.setMonth(mesActual.getMonth() + delta);
  renderCalendario();
}

function irAHoy() {
  mesActual = new Date();
  renderCalendario();
}

function mostrarExposicionesDia(año, mes, dia) {
  const fecha = new Date(año, mes, dia);
  
  const exposicionesDia = exposiciones.filter(expo => {
    const desde = parsearFecha(expo.Desde);
    const hasta = parsearFecha(expo.Hasta);
    
    if (!desde || !hasta) return false;
    
    desde.setHours(0, 0, 0, 0);
    hasta.setHours(23, 59, 59, 999);
    fecha.setHours(12, 0, 0, 0);
    
    return fecha >= desde && fecha <= hasta;
  });
  
  if (!exposicionesDia.length) {
    mostrarToast('No hay exposiciones este día', 'error');
    return;
  }
  
  const section = document.getElementById('exposicionesDiaSection');
  const titulo = document.getElementById('exposicionesDiaTitulo');
  const lista = document.getElementById('exposicionesDiaList');
  
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  titulo.innerHTML = `<span class="icon">📅</span> ${fechaFormateada}`;
  lista.innerHTML = exposicionesDia.map(expo => crearListItemHTML(expo)).join('');
  
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth' });
}

function cerrarExposicionesDia() {
  document.getElementById('exposicionesDiaSection').classList.add('hidden');
}

// ============================================
// MODAL CENTRO
// ============================================
function abrirModalCentro(centro) {
  const overlay = document.getElementById('centroOverlay');
  const modal = document.getElementById('centroModal');
  const lista = document.getElementById('centroExposicionesList');
  
  const exposicionesCentro = exposiciones.filter(e => e['Centro Juvenil'] === centro);
  
  document.getElementById('centroModalName').textContent = centro;
  document.getElementById('centroModalCount').textContent = exposicionesCentro.length;
  
  lista.innerHTML = exposicionesCentro.map(expo => crearListItemHTML(expo)).join('');
  
  overlay.classList.add('active');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModalCentro() {
  document.getElementById('centroOverlay').classList.remove('active');
  document.getElementById('centroModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================
// MODAL DETALLE
// ============================================
function abrirDetalle(id) {
  const expo = exposiciones.find(e => (e._RowNumber || e.Id) == id);
  if (!expo) return;
  
  exposicionActual = expo;
  
  const modal = document.getElementById('detailModal');
  const imagen = expo.URL_Imagen_Exposicion || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';
  
  document.getElementById('detailImage').style.backgroundImage = `url('${imagen}')`;
  document.getElementById('detailTitle').textContent = expo.NombreExpo || 'Sin nombre';
  
  const descripcion = expo.Descripcion || expo.Descripción || '';
  const descEl = document.getElementById('detailDescription');
  descEl.textContent = descripcion || 'Sin descripción disponible';
  descEl.style.display = descripcion ? 'block' : 'none';
  
  // Badges
  const badgesContainer = document.getElementById('detailBadges');
  let badgesHTML = '';
  
  if (expo.Estado) {
    const statusClass = expo.Estado === 'En activo' ? 'status-activo' : 
                        expo.Estado === 'Montaje' ? 'status-montaje' : 'status-finalizado';
    badgesHTML += `<span class="detail-status-badge ${statusClass}">${expo.Estado}</span>`;
  }
  
  if (expo.Programa) {
    badgesHTML += `<span class="detail-category-badge">🎯 ${expo.Programa}</span>`;
  }
  
  badgesContainer.innerHTML = badgesHTML;
  
  // Info grid
  let infoHTML = `
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event</span>
      <div>
        <small>Desde</small>
        <strong>${formatearFecha(expo.Desde) || 'N/A'}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event</span>
      <div>
        <small>Hasta</small>
        <strong>${formatearFecha(expo.Hasta) || 'N/A'}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">business</span>
      <div>
        <small>Centro</small>
        <strong>${expo['Centro Juvenil'] || 'N/A'}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">location_on</span>
      <div>
        <small>Espacio</small>
        <strong>${expo.EspacioActual || 'N/A'}</strong>
      </div>
    </div>
  `;
  
  if (expo['Inaguración?'] === 'Y' && expo['Día inauguración']) {
    infoHTML += `
      <div class="detail-info-item full-width">
        <span class="material-symbols-outlined">celebration</span>
        <div>
          <small>Inauguración</small>
          <strong>${expo['Día inauguración']}</strong>
        </div>
      </div>
    `;
  }
  
  if (expo.Observaciones) {
    infoHTML += `
      <div class="detail-info-item full-width">
        <span class="material-symbols-outlined">info</span>
        <div>
          <small>Observaciones</small>
          <strong>${expo.Observaciones}</strong>
        </div>
      </div>
    `;
  }
  
  document.getElementById('detailInfo').innerHTML = infoHTML;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  cerrarModalCentro();
}

function cerrarModalDetalle() {
  document.getElementById('detailModal').classList.remove('active');
  document.body.style.overflow = '';
  exposicionActual = null;
}

function compartirExposicion() {
  if (!exposicionActual) return;
  
  const texto = `🖼️ ${exposicionActual.NombreExpo}\n📍 ${exposicionActual['Centro Juvenil']}\n📅 ${formatearRangoFechas(exposicionActual.Desde, exposicionActual.Hasta)}`;
  
  if (navigator.share) {
    navigator.share({
      title: exposicionActual.NombreExpo,
      text: texto,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(texto).then(() => {
      mostrarToast('Copiado al portapapeles', 'success');
    });
  }
}

function abrirUbicacion() {
  if (!exposicionActual) return;
  
  const centro = exposicionActual['Centro Juvenil'] || '';
  if (centro) {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(centro + ' Madrid')}`;
    window.open(url, '_blank');
  } else {
    mostrarToast('Ubicación no disponible', 'error');
  }
}

// ============================================
// TOAST
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  toast.className = 'toast';
  toast.classList.add(tipo);
  
  icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  msg.textContent = mensaje;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
