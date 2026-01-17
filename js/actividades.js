// ============================================
// COAJ MADRID - ACTIVIDADES v3
// Chips + Modal categoría + Vista lista
// Campos GAS: Actividad, Centro Juvenil, Clase, Estado, 
// Plazas, Días, Del, Al, ID Actividad, URL Actividad
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let actividades = [];
let actividadVigente = [];
let actividadSeleccionada = null;
let categoriaSeleccionada = null;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  verificarSesion();
  warmup();
});

function warmup() {
  fetch(`${API_BASE}/warmup`).catch(() => {});
}

// ============================================
// TEMA
// ============================================
function initTheme() {
  const saved = localStorage.getItem('coajTheme') || 'light';
  setTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('coajTheme', next);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  
  const menuIcon = document.getElementById('menuThemeIcon');
  const menuText = document.getElementById('menuThemeText');
  if (menuIcon) menuIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  if (menuText) menuText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
}

// ============================================
// SESIÓN
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem('coajUsuario');
  const loginModal = document.getElementById('loginModal');
  
  if (sesion) {
    const usuario = JSON.parse(sesion);
    if (loginModal) loginModal.classList.add('hidden');
    mostrarUsuario(usuario);
    actualizarBottomNav(true, usuario);
    cargarDatos();
  } else {
    if (loginModal) loginModal.classList.remove('hidden');
    actualizarBottomNav(false, null);
  }
}

function mostrarUsuario(usuario) {
  const nombre = usuario.nombre || usuario.alias || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  
  const els = {
    headerGreeting: document.getElementById('headerGreeting'),
    avatarInitial: document.getElementById('avatarInitial'),
    menuAvatarInitial: document.getElementById('menuAvatarInitial'),
    menuUserName: document.getElementById('menuUserName'),
    bottomAvatarInitial: document.getElementById('bottomAvatarInitial'),
    bottomUserName: document.getElementById('bottomUserName')
  };
  
  if (els.headerGreeting) els.headerGreeting.textContent = `¡Hola, ${nombre.split(' ')[0]}!`;
  if (els.avatarInitial) els.avatarInitial.textContent = inicial;
  if (els.menuAvatarInitial) els.menuAvatarInitial.textContent = inicial;
  if (els.menuUserName) els.menuUserName.textContent = nombre;
  if (els.bottomAvatarInitial) els.bottomAvatarInitial.textContent = inicial;
  if (els.bottomUserName) els.bottomUserName.textContent = nombre.split(' ')[0];
}

function actualizarBottomNav(logueado, usuario) {
  const navGuest = document.getElementById('bottomNavGuest');
  const navUser = document.getElementById('bottomNavUser');
  
  if (logueado) {
    if (navGuest) navGuest.style.display = 'none';
    if (navUser) navUser.style.display = 'flex';
  } else {
    if (navGuest) navGuest.style.display = 'flex';
    if (navUser) navUser.style.display = 'none';
  }
}

function mostrarLoginModal() {
  document.getElementById('loginModal')?.classList.remove('hidden');
}

async function iniciarSesion(e) {
  e.preventDefault();
  
  const alias = document.getElementById('alias')?.value.trim();
  const contrasena = document.getElementById('contrasena')?.value;
  const btn = document.querySelector('.btn-login');
  
  if (!alias || !contrasena) {
    mostrarErrorLogin('Completa todos los campos');
    return;
  }
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...';
  }
  
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, contrasena })
    });
    
    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('coajUsuario', JSON.stringify(data.usuario));
      document.getElementById('loginModal')?.classList.add('hidden');
      mostrarUsuario(data.usuario);
      actualizarBottomNav(true, data.usuario);
      cargarDatos();
      mostrarToast('¡Bienvenido!', 'success');
    } else {
      mostrarErrorLogin(data.message || 'Credenciales incorrectas');
    }
  } catch (err) {
    mostrarErrorLogin('Error de conexión');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión';
  }
}

function entrarComoInvitado() {
  const usuario = { alias: 'invitado', nombre: 'Invitado' };
  localStorage.setItem('coajUsuario', JSON.stringify(usuario));
  document.getElementById('loginModal')?.classList.add('hidden');
  mostrarUsuario(usuario);
  actualizarBottomNav(true, usuario);
  cargarDatos();
}

function mostrarErrorLogin(msg) {
  const el = document.getElementById('loginError');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  window.location.href = '../index.html';
}

// ============================================
// UI
// ============================================
function toggleUserMenu() {
  document.getElementById('userMenu')?.classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('userMenu');
  const avatar = document.getElementById('headerAvatar');
  if (menu?.classList.contains('active') && !menu.contains(e.target) && !avatar?.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// ============================================
// CARGAR DATOS
// ============================================
async function cargarDatos() {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.remove('hidden');
  
  try {
    const res = await fetch(`${API_BASE}/datos`);
    const data = await res.json();
    
    actividades = data.actividades || [];
    actividadVigente = data.actividadVigente || [];
    
    console.log('✅ Actividades:', actividades.length);
    console.log('✅ ActividadVigente:', actividadVigente.length);
    
    if (actividades.length > 0) {
      console.log('📋 Campos:', Object.keys(actividades[0]));
    }
    
    if (loading) loading.classList.add('hidden');
    
    if (actividades.length === 0) {
      document.getElementById('emptyState')?.classList.add('active');
    } else {
      renderizarProximas();
      renderizarChipsCategorias();
      
      document.getElementById('seccionProximas')?.classList.remove('hidden');
      document.getElementById('seccionCategorias')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Error:', err);
    if (loading) loading.classList.add('hidden');
    document.getElementById('emptyState')?.classList.add('active');
  }
}

// ============================================
// IMAGEN - Busca en actividadVigente
// ============================================
function getImagenActividad(a) {
  const nombre = a.Actividad;
  const vigente = actividadVigente.find(v => v.Actividad === nombre);
  
  if (vigente?.['URL Actividad']) return vigente['URL Actividad'];
  
  const imgs = {
    'Deporte': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    'Arte': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    'Música': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    'Tecnología': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    'Danza': 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400',
    'Teatro': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400',
    'Formación': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
    'Idiomas': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400',
    'default': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
  };
  
  return imgs[a.Clase] || imgs.default;
}

function getIconoClase(clase) {
  const iconos = {
    'Deporte': '⚽', 'Arte': '🎨', 'Música': '🎵', 'Tecnología': '💻',
    'Idiomas': '🌍', 'Danza': '💃', 'Teatro': '🎭', 'Cocina': '👨‍🍳',
    'Fotografía': '📷', 'Gaming': '🎮', 'Formación': '📚', 'Taller': '🔧',
    'Ocio': '🎉', 'default': '🎯'
  };
  return iconos[clase] || iconos.default;
}

// ============================================
// RENDERIZAR PRÓXIMAS (Carousel)
// ============================================
function renderizarProximas() {
  const container = document.getElementById('carouselProximas');
  if (!container) return;
  
  const proximas = actividades.slice(0, 10);
  container.innerHTML = proximas.map((a, i) => {
    const badge = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : (a.Días?.split(',')[0]?.trim() || 'Próximo');
    const badgeClass = i === 0 ? 'badge-hoy' : i === 1 ? 'badge-manana' : 'badge-semana';
    return crearCardCarousel(a, badgeClass, badge);
  }).join('');
}

function crearCardCarousel(a, badgeClass, badgeText) {
  const img = getImagenActividad(a);
  const id = a['ID Actividad'] || a.Actividad;
  
  return `
    <div class="activity-card" onclick="abrirModalActividad('${id}')">
      <div class="card-img" style="background-image:url('${img}')">
        <span class="card-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${a.Actividad || 'Sin título'}</h3>
        <div class="card-meta">
          <span><i class="material-symbols-outlined">event</i>${a.Días || 'Por definir'}</span>
          <span><i class="material-symbols-outlined">location_on</i>${a['Centro Juvenil'] || 'COAJ'}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// CHIPS DE CATEGORÍAS (horizontal scroll)
// ============================================
function renderizarChipsCategorias() {
  const container = document.getElementById('chipsCategorias');
  if (!container) return;
  
  // Contar por Clase
  const clases = {};
  actividades.forEach(a => {
    const clase = a.Clase || 'Otros';
    clases[clase] = (clases[clase] || 0) + 1;
  });
  
  // Ordenar por cantidad
  const sorted = Object.entries(clases).sort((a, b) => b[1] - a[1]);
  
  container.innerHTML = sorted.map(([clase, count]) => `
    <button class="chip-categoria" onclick="abrirModalCategoria('${clase}')">
      <span class="chip-icon">${getIconoClase(clase)}</span>
      <span class="chip-name">${clase}</span>
      <span class="chip-count">${count}</span>
    </button>
  `).join('');
}

// ============================================
// MODAL CATEGORÍA (lista de actividades)
// ============================================
function abrirModalCategoria(clase) {
  categoriaSeleccionada = clase;
  
  const filtradas = actividades.filter(a => (a.Clase || 'Otros') === clase);
  
  const modal = document.getElementById('modalCategoria');
  const titulo = document.getElementById('modalCategoriaTitulo');
  const lista = document.getElementById('modalCategoriaLista');
  
  if (titulo) titulo.innerHTML = `${getIconoClase(clase)} ${clase} <span class="count">${filtradas.length}</span>`;
  
  if (lista) {
    lista.innerHTML = filtradas.map(a => crearItemLista(a)).join('');
  }
  
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function crearItemLista(a) {
  const img = getImagenActividad(a);
  const estado = a.Estado || 'Programado';
  const estadoClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                    : estado.toLowerCase().includes('final') ? 'finalizado' 
                    : 'programado';
  const id = a['ID Actividad'] || a.Actividad;
  const dias = a.Días || a.Dias || 'Por definir';
  
  return `
    <div class="list-item" onclick="abrirModalActividad('${id}')">
      <div class="list-img" style="background-image:url('${img}')"></div>
      <div class="list-content">
        <h4 class="list-title">${a.Actividad}</h4>
        <div class="list-info">
          <span class="list-badge badge-${estadoClass}">${estado}</span>
          <span class="list-meta"><i class="material-symbols-outlined">event</i>${dias}</span>
        </div>
        <div class="list-details">
          <span><i class="material-symbols-outlined">location_on</i>${a['Centro Juvenil'] || 'COAJ'}</span>
          <span><i class="material-symbols-outlined">group</i>${a.Plazas || '∞'} plazas</span>
        </div>
      </div>
      <i class="material-symbols-outlined list-arrow">chevron_right</i>
    </div>
  `;
}

function cerrarModalCategoria() {
  const modal = document.getElementById('modalCategoria');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  categoriaSeleccionada = null;
}

// ============================================
// MODAL ACTIVIDAD (detalle)
// ============================================
function abrirModalActividad(id) {
  actividadSeleccionada = actividades.find(a => (a['ID Actividad'] || a.Actividad) === id);
  
  if (!actividadSeleccionada) return;
  
  const a = actividadSeleccionada;
  const modal = document.getElementById('modalActividad');
  
  // Imagen
  document.getElementById('modalActividadImg').style.backgroundImage = `url('${getImagenActividad(a)}')`;
  
  // Badges
  const estado = a.Estado || 'Programado';
  const estadoClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                    : estado.toLowerCase().includes('final') ? 'finalizado' 
                    : 'programado';
  
  document.getElementById('modalActividadBadges').innerHTML = `
    ${a.Clase ? `<span class="badge-categoria">${getIconoClase(a.Clase)} ${a.Clase}</span>` : ''}
    <span class="badge-estado badge-${estadoClass}">${estado}</span>
  `;
  
  // Contenido
  document.getElementById('modalActividadTitulo').textContent = a.Actividad;
  document.getElementById('modalActividadDesc').textContent = `Actividad de ${a.Clase || 'formación'} en ${a['Centro Juvenil'] || 'COAJ Madrid'}`;
  
  // Info
  const dias = a.Días || a.Dias || 'Por definir';
  const periodo = formatearPeriodo(a.Del, a.Al);
  
  document.getElementById('modalActividadInfo').innerHTML = `
    <div class="info-item"><i class="material-symbols-outlined">location_on</i><div><small>Centro</small><strong>${a['Centro Juvenil'] || 'Por definir'}</strong></div></div>
    <div class="info-item"><i class="material-symbols-outlined">event</i><div><small>Días</small><strong>${dias}</strong></div></div>
    <div class="info-item"><i class="material-symbols-outlined">date_range</i><div><small>Periodo</small><strong>${periodo}</strong></div></div>
    <div class="info-item"><i class="material-symbols-outlined">group</i><div><small>Plazas</small><strong>${a.Plazas || 'Ilimitadas'}</strong></div></div>
  `;
  
  // Botón inscripción
  const btn = document.getElementById('btnInscribirseActividad');
  if (puedeInscribirse()) {
    btn.innerHTML = '<i class="material-symbols-outlined">how_to_reg</i> Inscribirme';
    btn.onclick = inscribirse;
  } else {
    btn.innerHTML = '<i class="material-symbols-outlined">login</i> Inicia sesión';
    btn.onclick = () => { cerrarModalActividad(); mostrarLoginModal(); };
  }
  
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModalActividad() {
  const modal = document.getElementById('modalActividad');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  actividadSeleccionada = null;
}

function formatearPeriodo(del, al) {
  if (!del && !al) return 'Por definir';
  const f = (d) => d ? d.split(' ')[0] : '';
  return [f(del), f(al)].filter(Boolean).join(' - ') || 'Por definir';
}

function puedeInscribirse() {
  const s = localStorage.getItem('coajUsuario');
  if (!s) return false;
  return JSON.parse(s).alias !== 'invitado';
}

// ============================================
// INSCRIPCIÓN
// ============================================
async function inscribirse() {
  if (!actividadSeleccionada) return;
  
  const sesion = localStorage.getItem('coajUsuario');
  if (!sesion) return mostrarToast('Inicia sesión', 'error');
  
  const usuario = JSON.parse(sesion);
  if (usuario.alias === 'invitado') return mostrarToast('Invitados no pueden inscribirse', 'error');
  
  const btn = document.getElementById('btnInscribirseActividad');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="material-symbols-outlined">hourglass_empty</i> Procesando...';
  }
  
  try {
    const res = await fetch(`${API_BASE}/inscribir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actividad: actividadSeleccionada.Actividad, usuario: usuario.alias })
    });
    
    const data = await res.json();
    
    if (data.success) {
      mostrarToast('¡Inscripción exitosa!', 'success');
      cerrarModalActividad();
    } else {
      mostrarToast(data.message || 'Error', 'error');
    }
  } catch (err) {
    mostrarToast('Error de conexión', 'error');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="material-symbols-outlined">how_to_reg</i> Inscribirme';
  }
}

function compartirActividad() {
  if (!actividadSeleccionada) return;
  
  if (navigator.share) {
    navigator.share({ title: actividadSeleccionada.Actividad, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    mostrarToast('Enlace copiado', 'success');
  }
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
  
  const container = document.getElementById('resultadosBusqueda');
  const section = document.getElementById('seccionBusqueda');
  
  if (filtradas.length === 0) {
    container.innerHTML = `<div class="empty-search"><i class="material-symbols-outlined">search_off</i><p>Sin resultados para "${term}"</p></div>`;
  } else {
    container.innerHTML = filtradas.map(a => crearItemLista(a)).join('');
  }
  
  section?.classList.remove('hidden');
  document.getElementById('seccionProximas')?.classList.add('hidden');
  document.getElementById('seccionCategorias')?.classList.add('hidden');
}

function cerrarBusqueda() {
  document.getElementById('searchInput').value = '';
  document.getElementById('seccionBusqueda')?.classList.add('hidden');
  document.getElementById('seccionProximas')?.classList.remove('hidden');
  document.getElementById('seccionCategorias')?.classList.remove('hidden');
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
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// KEYBOARD
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModalActividad();
    cerrarModalCategoria();
    document.getElementById('userMenu')?.classList.remove('active');
  }
});

// Back button en móvil
window.addEventListener('popstate', () => {
  if (document.getElementById('modalActividad')?.classList.contains('active')) {
    cerrarModalActividad();
  } else if (document.getElementById('modalCategoria')?.classList.contains('active')) {
    cerrarModalCategoria();
  }
});
