// ============================================
// COAJ MADRID - ACTIVIDADES.JS
// CAMPOS CORRECTOS SEGÚN GAS ORIGINAL:
// Actividad, Centro Juvenil, Clase, Estado, Plazas,
// Del, Al, Días, ID Actividad, Imagen/URL Actividad
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let actividades = [];
let actividadVigente = [];
let actividadSeleccionada = null;
let claseActiva = 'Todas';
let vistaGrid = 'grid';
let busqueda = '';

// ============================================
// INICIALIZACIÓN
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
// TEMA CLARO/OSCURO
// ============================================
function initTheme() {
  const savedTheme = localStorage.getItem('coajTheme') || 'light';
  setTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('coajTheme', newTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  
  const menuThemeIcon = document.getElementById('menuThemeIcon');
  const menuThemeText = document.getElementById('menuThemeText');
  if (menuThemeIcon) menuThemeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  if (menuThemeText) menuThemeText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
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
  
  const headerGreeting = document.getElementById('headerGreeting');
  const avatarInitial = document.getElementById('avatarInitial');
  if (headerGreeting) headerGreeting.textContent = `¡Hola, ${nombre.split(' ')[0]}!`;
  if (avatarInitial) avatarInitial.textContent = inicial;
  
  const menuAvatarInitial = document.getElementById('menuAvatarInitial');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserEmail = document.getElementById('menuUserEmail');
  if (menuAvatarInitial) menuAvatarInitial.textContent = inicial;
  if (menuUserName) menuUserName.textContent = nombre;
  if (menuUserEmail) menuUserEmail.textContent = usuario.email || `${usuario.alias || 'usuario'}@coaj.es`;
}

function actualizarBottomNav(logueado, usuario) {
  const navGuest = document.getElementById('bottomNavGuest');
  const navUser = document.getElementById('bottomNavUser');
  
  if (logueado && usuario) {
    const nombre = usuario.nombre || usuario.alias || 'Usuario';
    const inicial = nombre.charAt(0).toUpperCase();
    const primerNombre = nombre.split(' ')[0];
    
    if (navGuest) navGuest.style.display = 'none';
    if (navUser) {
      navUser.style.display = 'flex';
      const bottomAvatarInitial = document.getElementById('bottomAvatarInitial');
      const bottomUserName = document.getElementById('bottomUserName');
      if (bottomAvatarInitial) bottomAvatarInitial.textContent = inicial;
      if (bottomUserName) bottomUserName.textContent = primerNombre;
    }
  } else {
    if (navGuest) navGuest.style.display = 'flex';
    if (navUser) navUser.style.display = 'none';
  }
}

function mostrarLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) loginModal.classList.remove('hidden');
}

// ============================================
// LOGIN
// ============================================
async function iniciarSesion(e) {
  e.preventDefault();
  
  const alias = document.getElementById('alias')?.value.trim();
  const contrasena = document.getElementById('contrasena')?.value;
  const errorDiv = document.getElementById('loginError');
  const btn = document.querySelector('.btn-login');
  
  if (!alias || !contrasena) {
    mostrarErrorLogin('Completa todos los campos');
    return;
  }
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Verificando...';
  }
  
  if (errorDiv) errorDiv.style.display = 'none';
  
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
    console.error('Login error:', err);
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
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
  }
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  window.location.href = '../index.html';
}

// ============================================
// UI HELPERS
// ============================================
function toggleUserMenu() {
  document.getElementById('userMenu')?.classList.toggle('active');
}

function toggleFiltros() {
  const panel = document.getElementById('filtrosPanel');
  const btn = document.querySelector('.filter-btn');
  panel?.classList.toggle('active');
  btn?.classList.toggle('active');
}

function cambiarVistaGrid(vista) {
  vistaGrid = vista;
  document.getElementById('btnGrid')?.classList.toggle('active', vista === 'grid');
  document.getElementById('btnList')?.classList.toggle('active', vista === 'list');
  
  const grid = document.getElementById('actividadesGrid');
  if (grid) grid.classList.toggle('list-view', vista === 'list');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('userMenu');
  const avatar = document.getElementById('headerAvatar');
  const bottomUser = document.querySelector('.bottom-nav-user');
  
  if (menu?.classList.contains('active')) {
    if (!menu.contains(e.target) && !avatar?.contains(e.target) && !bottomUser?.contains(e.target)) {
      menu.classList.remove('active');
    }
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
    
    console.log('✅ Actividades cargadas:', actividades.length);
    console.log('✅ ActividadVigente:', actividadVigente.length);
    
    if (actividades.length > 0) {
      console.log('📋 Campos disponibles:', Object.keys(actividades[0]));
      console.log('📋 Ejemplo:', actividades[0]);
    }
    
    if (loading) loading.classList.add('hidden');
    
    if (actividades.length === 0) {
      mostrarEmpty();
    } else {
      renderizarDestacadas();
      renderizarProximas();
      renderizarClases();
      renderizarFiltros();
      renderizarTodas();
      
      document.getElementById('seccionDestacadas')?.classList.remove('hidden');
      document.getElementById('seccionProximas')?.classList.remove('hidden');
      document.getElementById('seccionCategorias')?.classList.remove('hidden');
      document.getElementById('seccionTodas')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error('❌ Error cargando datos:', err);
    if (loading) loading.classList.add('hidden');
    mostrarEmpty();
  }
}

// ============================================
// ICONOS POR CLASE
// ============================================
function getIconoClase(clase) {
  const iconos = {
    'Deporte': '⚽',
    'Arte': '🎨',
    'Música': '🎵',
    'Tecnología': '💻',
    'Idiomas': '🌍',
    'Danza': '💃',
    'Teatro': '🎭',
    'Cocina': '👨‍🍳',
    'Fotografía': '📷',
    'Gaming': '🎮',
    'Formación': '📚',
    'Taller': '🔧',
    'Ocio': '🎉',
    'default': '🎯'
  };
  return iconos[clase] || iconos.default;
}

// ============================================
// OBTENER IMAGEN DE ACTIVIDAD
// ============================================
function getImagenActividad(a) {
  // Buscar en varios campos posibles
  if (a.Imagen && a.Imagen.trim()) return a.Imagen;
  if (a['URL Actividad'] && a['URL Actividad'].trim()) return a['URL Actividad'];
  if (a.Image && a.Image.trim()) return a.Image;
  
  // Buscar en actividadVigente por nombre
  const vigente = actividadVigente.find(v => v.Actividad === a.Actividad);
  if (vigente && vigente['URL Actividad']) return vigente['URL Actividad'];
  
  // Imagen por defecto según la clase
  const imagenesDefault = {
    'Deporte': 'https://images.unsplash.com/photo-1461896836934- voices-of-youth?w=400',
    'Arte': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    'Música': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    'Tecnología': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    'Danza': 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400',
    'Teatro': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400',
    'Formación': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
    'default': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
  };
  
  return imagenesDefault[a.Clase] || imagenesDefault.default;
}

// ============================================
// FORMATEAR DÍAS
// ============================================
function formatearDias(dias) {
  if (!dias) return 'Por definir';
  return dias;
}

// ============================================
// FORMATEAR FECHAS (Del - Al)
// ============================================
function formatearFechas(del, al) {
  if (!del && !al) return 'Por definir';
  
  const formatear = (fecha) => {
    if (!fecha) return '';
    // Formato: MM/DD/YYYY o similar
    const partes = fecha.split(' ')[0]; // Quitar hora si existe
    return partes;
  };
  
  const fechaDel = formatear(del);
  const fechaAl = formatear(al);
  
  if (fechaDel && fechaAl) {
    return `${fechaDel} - ${fechaAl}`;
  }
  return fechaDel || fechaAl || 'Por definir';
}

// ============================================
// RENDERIZADO
// ============================================
function renderizarDestacadas() {
  const container = document.getElementById('carouselDestacadas');
  if (!container) return;
  
  const destacadas = actividades.slice(0, 5);
  container.innerHTML = destacadas.map(a => crearCardCarousel(a, 'badge-semana', '')).join('');
}

function renderizarProximas() {
  const container = document.getElementById('carouselProximas');
  if (!container) return;
  
  const proximas = actividades.slice(0, 6);
  container.innerHTML = proximas.map((a, i) => {
    const badgeClass = i === 0 ? 'badge-hoy' : i === 1 ? 'badge-manana' : 'badge-semana';
    const badgeText = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : (a.Días?.split(',')[0]?.trim() || 'Próximo');
    return crearCardCarousel(a, badgeClass, badgeText);
  }).join('');
}

function crearCardCarousel(a, badgeClass, badgeText) {
  const img = getImagenActividad(a);
  const texto = badgeText || a.Días?.split(',')[0]?.trim() || 'Próximo';
  const id = a['ID Actividad'] || a.Actividad;
  
  return `
    <div class="activity-card" onclick="abrirModal('${id}')">
      <div class="activity-card-image" style="background-image: url('${img}')">
        <span class="activity-card-badge ${badgeClass}">${texto}</span>
      </div>
      <div class="activity-card-content">
        <h3 class="activity-card-title">${a.Actividad || 'Sin título'}</h3>
        <div class="activity-card-meta">
          <div class="activity-card-meta-item">
            <span class="material-symbols-outlined">calendar_today</span>
            ${formatearDias(a.Días || a.Dias)}
          </div>
          <div class="activity-card-meta-item">
            <span class="material-symbols-outlined">location_on</span>
            ${a['Centro Juvenil'] || 'COAJ Madrid'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderizarClases() {
  const container = document.getElementById('categoriasGrid');
  if (!container) return;
  
  // Contar por Clase (campo correcto del GAS)
  const clases = {};
  actividades.forEach(a => {
    const clase = a.Clase || 'Otros';
    clases[clase] = (clases[clase] || 0) + 1;
  });
  
  container.innerHTML = Object.entries(clases).map(([clase, count]) => `
    <div class="category-card ${claseActiva === clase ? 'active' : ''}" onclick="filtrarPorClase('${clase}')">
      <div class="category-icon">${getIconoClase(clase)}</div>
      <div class="category-name">${clase}</div>
      <div class="category-count">${count} actividad${count !== 1 ? 'es' : ''}</div>
    </div>
  `).join('');
}

function renderizarFiltros() {
  const catContainer = document.getElementById('filtrosCategorias');
  if (!catContainer) return;
  
  const clases = ['Todas', ...new Set(actividades.map(a => a.Clase).filter(Boolean))];
  
  catContainer.innerHTML = clases.map(clase => `
    <button class="chip ${claseActiva === clase ? 'active' : ''}" onclick="filtrarPorClase('${clase}')">${clase}</button>
  `).join('');
}

function renderizarTodas() {
  const container = document.getElementById('actividadesGrid');
  if (!container) return;
  
  let filtradas = actividades;
  
  // Filtrar por Clase
  if (claseActiva !== 'Todas') {
    filtradas = filtradas.filter(a => a.Clase === claseActiva);
  }
  
  // Filtrar por búsqueda
  if (busqueda) {
    const term = busqueda.toLowerCase();
    filtradas = filtradas.filter(a => 
      (a.Actividad || '').toLowerCase().includes(term) ||
      (a.Clase || '').toLowerCase().includes(term) ||
      (a['Centro Juvenil'] || '').toLowerCase().includes(term)
    );
  }
  
  if (filtradas.length === 0) {
    container.innerHTML = '';
    document.getElementById('emptyState')?.classList.add('active');
    return;
  }
  
  document.getElementById('emptyState')?.classList.remove('active');
  container.innerHTML = filtradas.map(a => crearCardGrid(a)).join('');
}

function crearCardGrid(a) {
  const img = getImagenActividad(a);
  const estado = a.Estado || 'Programado';
  const estadoClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                    : estado.toLowerCase().includes('final') ? 'finalizado' 
                    : 'programado';
  const id = a['ID Actividad'] || a.Actividad;
  
  return `
    <div class="activity-grid-card" onclick="abrirModal('${id}')">
      <div class="activity-grid-image" style="background-image: url('${img}')"></div>
      <div class="activity-grid-content">
        <div class="activity-grid-badges">
          ${a.Clase ? `<span class="activity-badge badge-categoria">${a.Clase}</span>` : ''}
          <span class="activity-badge badge-estado-${estadoClass}">${estado}</span>
        </div>
        <h3 class="activity-grid-title">${a.Actividad || 'Sin título'}</h3>
        <p class="activity-grid-description">${a['Centro Juvenil'] || 'Centro Juvenil COAJ Madrid'}</p>
        <div class="activity-grid-footer">
          <div class="activity-grid-info">
            <div class="activity-grid-info-item">
              <span class="material-symbols-outlined">calendar_today</span>
              ${formatearDias(a.Días || a.Dias)}
            </div>
            <div class="activity-grid-info-item">
              <span class="material-symbols-outlined">group</span>
              ${a.Plazas || '∞'} plazas
            </div>
          </div>
          <button class="activity-grid-btn">Ver más</button>
        </div>
      </div>
    </div>
  `;
}

function mostrarEmpty() {
  document.getElementById('emptyState')?.classList.add('active');
  document.getElementById('seccionDestacadas')?.classList.add('hidden');
  document.getElementById('seccionProximas')?.classList.add('hidden');
  document.getElementById('seccionCategorias')?.classList.add('hidden');
  document.getElementById('seccionTodas')?.classList.add('hidden');
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================
function filtrarPorClase(clase) {
  claseActiva = clase;
  
  document.querySelectorAll('.category-card').forEach(card => {
    const nombre = card.querySelector('.category-name')?.textContent;
    card.classList.toggle('active', nombre === clase);
  });
  
  document.querySelectorAll('#filtrosCategorias .chip').forEach(chip => {
    chip.classList.toggle('active', chip.textContent === clase);
  });
  
  renderizarTodas();
}

function buscarActividades() {
  busqueda = document.getElementById('searchInput')?.value.trim() || '';
  renderizarTodas();
}

function limpiarFiltros() {
  claseActiva = 'Todas';
  busqueda = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  renderizarClases();
  renderizarFiltros();
  renderizarTodas();
  document.getElementById('emptyState')?.classList.remove('active');
}

// ============================================
// MODAL DETALLE
// ============================================
function abrirModal(id) {
  // Buscar por ID Actividad o por nombre
  actividadSeleccionada = actividades.find(a => 
    (a['ID Actividad'] || a.Actividad) === id
  );
  
  if (!actividadSeleccionada) {
    console.error('Actividad no encontrada:', id);
    return;
  }
  
  const a = actividadSeleccionada;
  const modal = document.getElementById('modalDetalle');
  
  // Imagen
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    modalImage.style.backgroundImage = `url('${getImagenActividad(a)}')`;
  }
  
  // Badges
  const estado = a.Estado || 'Programado';
  const estadoClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                    : estado.toLowerCase().includes('final') ? 'finalizado' 
                    : 'programado';
  
  const modalBadges = document.getElementById('modalBadges');
  if (modalBadges) {
    modalBadges.innerHTML = `
      ${a.Clase ? `<span class="activity-badge badge-categoria">${a.Clase}</span>` : ''}
      <span class="activity-badge badge-estado-${estadoClass}">${estado}</span>
    `;
  }
  
  // Título
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) modalTitle.textContent = a.Actividad || 'Sin título';
  
  // Descripción
  const modalDescription = document.getElementById('modalDescription');
  if (modalDescription) {
    modalDescription.textContent = `Actividad de ${a.Clase || 'formación'} en ${a['Centro Juvenil'] || 'COAJ Madrid'}`;
  }
  
  // Info Grid - CAMPOS CORRECTOS DEL GAS
  const modalInfo = document.getElementById('modalInfo');
  if (modalInfo) {
    modalInfo.innerHTML = `
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">location_on</span> Centro</small>
        <strong>${a['Centro Juvenil'] || 'Por definir'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">event</span> Días</small>
        <strong>${formatearDias(a.Días || a.Dias)}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">date_range</span> Periodo</small>
        <strong>${formatearFechas(a.Del, a.Al)}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">group</span> Plazas</small>
        <strong>${a.Plazas || 'Ilimitadas'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">category</span> Clase</small>
        <strong>${a.Clase || 'General'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">info</span> Estado</small>
        <strong>${estado}</strong>
      </div>
    `;
  }
  
  // Botón inscripción
  const btnInscribirse = document.getElementById('btnInscribirse');
  if (btnInscribirse) {
    if (puedeInscribirse()) {
      btnInscribirse.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Inscribirme';
      btnInscribirse.onclick = inscribirse;
    } else {
      btnInscribirse.innerHTML = '<span class="material-symbols-outlined">login</span> Inicia sesión';
      btnInscribirse.onclick = () => { cerrarModal(); mostrarLoginModal(); };
    }
  }
  
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal(e) {
  if (e && e.target !== e.currentTarget) return;
  
  const modal = document.getElementById('modalDetalle');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  actividadSeleccionada = null;
}

function puedeInscribirse() {
  const sesion = localStorage.getItem('coajUsuario');
  if (!sesion) return false;
  const usuario = JSON.parse(sesion);
  return usuario.alias !== 'invitado';
}

// ============================================
// INSCRIPCIÓN
// ============================================
async function inscribirse() {
  if (!actividadSeleccionada) return;
  
  const sesion = localStorage.getItem('coajUsuario');
  if (!sesion) {
    mostrarToast('Debes iniciar sesión', 'error');
    return;
  }
  
  const usuario = JSON.parse(sesion);
  if (usuario.alias === 'invitado') {
    mostrarToast('Los invitados no pueden inscribirse', 'error');
    return;
  }
  
  const btn = document.getElementById('btnInscribirse');
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
      mostrarToast('✅ ¡Inscripción exitosa!', 'success');
      cerrarModal();
    } else {
      mostrarToast(data.message || 'Error al inscribirse', 'error');
    }
  } catch (err) {
    console.error('Error inscripción:', err);
    mostrarToast('Error de conexión', 'error');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Inscribirme';
  }
}

function compartirActividad() {
  if (!actividadSeleccionada) return;
  
  if (navigator.share) {
    navigator.share({
      title: actividadSeleccionada.Actividad,
      text: `¡Mira esta actividad en COAJ Madrid! ${actividadSeleccionada.Actividad}`,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    mostrarToast('Enlace copiado', 'success');
  }
}

// ============================================
// TOAST
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  if (!toast) return;
  
  if (icon) icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  if (msg) msg.textContent = mensaje;
  toast.className = `toast show ${tipo}`;
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// KEYBOARD
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModal();
    document.getElementById('userMenu')?.classList.remove('active');
  }
});
