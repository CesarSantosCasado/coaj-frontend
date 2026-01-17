/**
 * COAJ Madrid - Actividades v5
 * 
 * MEJORAS IMPLEMENTADAS:
 * - Persistencia de datos con sessionStorage (no recarga si hay cache válido)
 * - Configuración centralizada desde config.js
 * - Navegación homologada
 * 
 * DEPENDENCIAS: config.js debe cargarse antes
 */

// ============================================
// VERIFICAR DEPENDENCIAS
// ============================================
if (typeof COAJ_CONFIG === 'undefined') {
  console.error('❌ config.js debe cargarse antes de actividades.js');
}

// ============================================
// CONSTANTES (desde config)
// ============================================
const API_BASE = COAJ_CONFIG?.api?.base || 'https://coajmadrid-8273afef0255.herokuapp.com/api';
const CACHE_KEY = COAJ_CONFIG?.cache?.key || 'coaj_actividades_cache';
const CACHE_TTL = COAJ_CONFIG?.cache?.ttl || 5 * 60 * 1000;

// ============================================
// ESTADO GLOBAL
// ============================================
let actividades = [];
let actividadVigente = [];
let actividadSeleccionada = null;
let categoriaSeleccionada = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('🚀 Inicializando COAJ Actividades...');
  initTheme();
  verificarSesion();
  warmup();
  setupEventListeners();
}

function warmup() {
  fetch(`${API_BASE}/warmup`).catch(() => {});
}

function setupEventListeners() {
  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const avatar = document.getElementById('headerAvatar');
    if (menu?.classList.contains('active') && 
        !menu.contains(e.target) && 
        !avatar?.contains(e.target)) {
      menu.classList.remove('active');
    }
  });

  // Tecla ESC para cerrar modales
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
    cargarDatos(); // Cargará desde cache si existe
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
    menuUserName: nombre,
    bottomAvatarInitial: inicial,
    bottomUserName: primerNombre
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
  // Limpiar cache al cerrar sesión
  if (typeof CoajCache !== 'undefined') {
    CoajCache.remove(CACHE_KEY);
  }
  window.location.href = '../index.html';
}

// ============================================
// CARGAR DATOS - CON PERSISTENCIA
// ============================================
async function cargarDatos(forceRefresh = false) {
  const loading = document.getElementById('loading');
  
  // ========================================
  // 1. VERIFICAR CACHE (si no es refresh forzado)
  // ========================================
  if (!forceRefresh && typeof CoajCache !== 'undefined') {
    const cached = CoajCache.get(CACHE_KEY, CACHE_TTL);
    
    if (cached) {
      console.log('📦 Usando datos desde cache');
      actividades = cached.actividades || [];
      actividadVigente = cached.actividadVigente || [];
      
      if (loading) loading.classList.add('hidden');
      
      if (actividades.length === 0) {
        document.getElementById('emptyState')?.classList.add('active');
      } else {
        renderizarTodo();
      }
      return; // No hacer petición al servidor
    }
  }

  // ========================================
  // 2. CARGAR DESDE API (cache vacío o expirado)
  // ========================================
  console.log('🌐 Cargando datos desde API...');
  if (loading) loading.classList.remove('hidden');
  
  try {
    const res = await fetch(`${API_BASE}/datos`);
    const data = await res.json();
    
    actividades = data.actividades || [];
    actividadVigente = data.actividadVigente || [];
    
    console.log('✅ Actividades cargadas:', actividades.length);
    
    // ========================================
    // 3. GUARDAR EN CACHE
    // ========================================
    if (typeof CoajCache !== 'undefined') {
      CoajCache.set(CACHE_KEY, {
        actividades,
        actividadVigente
      });
    }
    
    if (loading) loading.classList.add('hidden');
    
    if (actividades.length === 0) {
      document.getElementById('emptyState')?.classList.add('active');
    } else {
      renderizarTodo();
    }
  } catch (err) {
    console.error('Error cargando datos:', err);
    if (loading) loading.classList.add('hidden');
    document.getElementById('emptyState')?.classList.add('active');
    mostrarToast('Error al cargar actividades', 'error');
  }
}

/**
 * Fuerza recarga de datos desde el servidor
 * Llamar cuando el usuario solicite explícitamente actualizar
 */
function refrescarDatos() {
  console.log('🔄 Refrescando datos...');
  if (typeof CoajCache !== 'undefined') {
    CoajCache.remove(CACHE_KEY);
  }
  cargarDatos(true);
  mostrarToast('Actualizando actividades...', 'success');
}

// Exponer para uso externo (botón de refresh, etc.)
window.refrescarDatos = refrescarDatos;

function renderizarTodo() {
  renderizarProximas();
  renderizarCategorias();
  renderizarTodasLasActividades();
  
  ['upcomingSection', 'categoriesSection', 'allActivitiesSection'].forEach(id => {
    document.getElementById(id)?.classList.remove('hidden');
  });
}

// ============================================
// UTILIDADES (usando config si está disponible)
// ============================================
function getImagenActividad(actividad) {
  const nombre = actividad.Actividad;
  const vigente = actividadVigente.find(v => v.Actividad === nombre);
  
  if (vigente?.['URL Actividad']) return vigente['URL Actividad'];
  
  // Usar imágenes de config o fallback
  const imagenes = COAJ_CONFIG?.categories?.images || {
    'default': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
  };
  
  return imagenes[actividad.Clase] || imagenes.default;
}

function getIconoCategoria(clase) {
  const iconos = COAJ_CONFIG?.categories?.icons || { 'default': '🎯' };
  return iconos[clase] || iconos.default;
}

function getEstadoClass(estado) {
  if (!estado) return 'programado';
  const e = estado.toLowerCase();
  if (e.includes('desarrollo')) return 'desarrollo';
  if (e.includes('final')) return 'finalizado';
  return 'programado';
}

function formatearPeriodo(del, al) {
  if (!del && !al) return 'Por definir';
  const formatear = d => d ? d.split(' ')[0] : '';
  return [formatear(del), formatear(al)].filter(Boolean).join(' - ') || 'Por definir';
}

// ============================================
// RENDERIZADO - PRÓXIMAS
// ============================================
function renderizarProximas() {
  const container = document.getElementById('upcomingCarousel');
  if (!container) return;
  
  const proximas = actividades.slice(0, 10);
  
  container.innerHTML = proximas.map((a, i) => {
    const badgeText = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : (a.Días?.split(',')[0]?.trim() || 'Próximo');
    const badgeClass = i === 0 ? 'badge-today' : i === 1 ? 'badge-tomorrow' : 'badge-upcoming';
    
    return `
      <article class="activity-card" onclick="abrirModalDetalle('${a['ID Actividad'] || a.Actividad}')">
        <div class="activity-card-image" style="background-image: url('${getImagenActividad(a)}')">
          <span class="activity-card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="activity-card-body">
          <h3 class="activity-card-title">${a.Actividad || 'Sin título'}</h3>
          <div class="activity-card-meta">
            <div class="activity-card-meta-item">
              <span class="material-symbols-outlined">event</span>
              ${a.Días || 'Por definir'}
            </div>
            <div class="activity-card-meta-item">
              <span class="material-symbols-outlined">location_on</span>
              ${a['Centro Juvenil'] || 'COAJ Madrid'}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ============================================
// RENDERIZADO - CATEGORÍAS (Chips)
// ============================================
function renderizarCategorias() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;
  
  const categorias = {};
  actividades.forEach(a => {
    const cat = a.Clase || 'Otros';
    categorias[cat] = (categorias[cat] || 0) + 1;
  });
  
  const sorted = Object.entries(categorias).sort((a, b) => b[1] - a[1]);
  
  container.innerHTML = sorted.map(([cat, count]) => `
    <button class="category-chip" onclick="abrirModalCategoria('${cat}')">
      <span class="category-icon">${getIconoCategoria(cat)}</span>
      <span class="category-name">${cat}</span>
      <span class="category-count">${count}</span>
    </button>
  `).join('');
}

// ============================================
// RENDERIZADO - TODAS LAS ACTIVIDADES
// ============================================
function renderizarTodasLasActividades() {
  const container = document.getElementById('allActivitiesList');
  const countEl = document.getElementById('totalCount');
  
  if (!container) return;
  
  if (countEl) countEl.textContent = `${actividades.length} actividades`;
  
  container.innerHTML = actividades.map(a => crearItemLista(a)).join('');
}

function crearItemLista(a) {
  const img = getImagenActividad(a);
  const estado = a.Estado || 'Programado';
  const estadoClass = getEstadoClass(estado);
  const id = a['ID Actividad'] || a.Actividad;
  
  return `
    <article class="activity-list-item" onclick="abrirModalDetalle('${id}')">
      <div class="activity-list-image" style="background-image: url('${img}')"></div>
      <div class="activity-list-content">
        <h3 class="activity-list-title">${a.Actividad || 'Sin título'}</h3>
        <div class="activity-list-badges">
          <span class="status-badge status-${estadoClass}">${estado}</span>
        </div>
        <div class="activity-list-info">
          <span class="activity-list-info-item">
            <span class="material-symbols-outlined">event</span>
            ${a.Días || 'Por definir'}
          </span>
          <span class="activity-list-info-item">
            <span class="material-symbols-outlined">location_on</span>
            ${a['Centro Juvenil'] || 'COAJ'}
          </span>
          <span class="activity-list-info-item">
            <span class="material-symbols-outlined">group</span>
            ${a.Plazas || '∞'}
          </span>
        </div>
      </div>
      <span class="material-symbols-outlined activity-list-arrow">chevron_right</span>
    </article>
  `;
}

// ============================================
// BÚSQUEDA
// ============================================
function buscarActividades() {
  const term = document.getElementById('searchInput')?.value.trim().toLowerCase();
  
  if (!term) {
    cerrarBusqueda();
    return;
  }
  
  const filtradas = actividades.filter(a => 
    (a.Actividad || '').toLowerCase().includes(term) ||
    (a.Clase || '').toLowerCase().includes(term) ||
    (a['Centro Juvenil'] || '').toLowerCase().includes(term)
  );
  
  const container = document.getElementById('searchResultsList');
  const section = document.getElementById('searchResults');
  
  if (!container || !section) return;
  
  if (filtradas.length === 0) {
    container.innerHTML = `
      <div class="empty-state active">
        <span class="material-symbols-outlined">search_off</span>
        <h3>Sin resultados</h3>
        <p>No encontramos actividades para "${term}"</p>
      </div>
    `;
  } else {
    container.innerHTML = filtradas.map(a => crearItemLista(a)).join('');
  }
  
  section.classList.remove('hidden');
  
  ['upcomingSection', 'categoriesSection', 'allActivitiesSection'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

function cerrarBusqueda() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  document.getElementById('searchResults')?.classList.add('hidden');
  
  ['upcomingSection', 'categoriesSection', 'allActivitiesSection'].forEach(id => {
    document.getElementById(id)?.classList.remove('hidden');
  });
}

// ============================================
// MODAL CATEGORÍA
// ============================================
function abrirModalCategoria(categoria) {
  categoriaSeleccionada = categoria;
  
  const filtradas = actividades.filter(a => (a.Clase || 'Otros') === categoria);
  
  document.getElementById('categoryModalIcon').textContent = getIconoCategoria(categoria);
  document.getElementById('categoryModalName').textContent = categoria;
  document.getElementById('categoryModalCount').textContent = filtradas.length;
  
  const lista = document.getElementById('categoryActivitiesList');
  if (lista) {
    lista.innerHTML = filtradas.map(a => crearItemLista(a)).join('');
  }
  
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
  actividadSeleccionada = actividades.find(a => 
    (a['ID Actividad'] || a.Actividad) === id
  );
  
  if (!actividadSeleccionada) return;
  
  const a = actividadSeleccionada;
  const modal = document.getElementById('detailModal');
  
  document.getElementById('detailImage').style.backgroundImage = `url('${getImagenActividad(a)}')`;
  
  const estado = a.Estado || 'Programado';
  const estadoClass = getEstadoClass(estado);
  
  document.getElementById('detailBadges').innerHTML = `
    ${a.Clase ? `<span class="detail-category-badge">${getIconoCategoria(a.Clase)} ${a.Clase}</span>` : ''}
    <span class="detail-status-badge status-${estadoClass}">${estado}</span>
  `;
  
  document.getElementById('detailTitle').textContent = a.Actividad || 'Sin título';
  document.getElementById('detailDescription').textContent = 
    `Actividad de ${a.Clase || 'formación'} en ${a['Centro Juvenil'] || 'COAJ Madrid'}. Únete y participa en esta experiencia única.`;
  
  document.getElementById('detailInfo').innerHTML = `
    <div class="detail-info-item">
      <span class="material-symbols-outlined">location_on</span>
      <div>
        <small>Centro</small>
        <strong>${a['Centro Juvenil'] || 'Por definir'}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">event</span>
      <div>
        <small>Días</small>
        <strong>${a.Días || a.Dias || 'Por definir'}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">date_range</span>
      <div>
        <small>Periodo</small>
        <strong>${formatearPeriodo(a.Del, a.Al)}</strong>
      </div>
    </div>
    <div class="detail-info-item">
      <span class="material-symbols-outlined">group</span>
      <div>
        <small>Plazas</small>
        <strong>${a.Plazas || 'Ilimitadas'}</strong>
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
  actividadSeleccionada = null;
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
  if (!actividadSeleccionada) return;
  
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
        actividad: actividadSeleccionada.Actividad, 
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

function compartirActividad() {
  if (!actividadSeleccionada) return;
  
  const texto = `¡Mira esta actividad en COAJ Madrid! ${actividadSeleccionada.Actividad}`;
  
  if (navigator.share) {
    navigator.share({
      title: actividadSeleccionada.Actividad,
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
