// ============================================
// COAJ MADRID - ACTIVIDADES.JS
// Dashboard moderno con campos correctos
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let actividades = [];
let actividadVigente = [];
let actividadSeleccionada = null;
let categoriaActiva = 'Todas';
let vistaGrid = 'grid';
let busqueda = '';

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  warmup();
});

function warmup() {
  fetch(`${API_BASE}/warmup`).catch(() => {});
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
    actualizarUIUsuario(usuario);
    cargarDatos();
  } else {
    if (loginModal) loginModal.classList.remove('hidden');
  }
}

function actualizarUIUsuario(usuario) {
  const nombre = usuario.nombre || usuario.alias || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  
  const headerGreeting = document.getElementById('headerGreeting');
  const avatarInitial = document.getElementById('avatarInitial');
  const menuAvatarInitial = document.getElementById('menuAvatarInitial');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserEmail = document.getElementById('menuUserEmail');
  
  if (headerGreeting) headerGreeting.textContent = `¡Hola, ${nombre.split(' ')[0]}!`;
  if (avatarInitial) avatarInitial.textContent = inicial;
  if (menuAvatarInitial) menuAvatarInitial.textContent = inicial;
  if (menuUserName) menuUserName.textContent = nombre;
  if (menuUserEmail) menuUserEmail.textContent = usuario.email || `${usuario.alias || 'usuario'}@coaj.es`;
}

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
      actualizarUIUsuario(data.usuario);
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
  localStorage.setItem('coajUsuario', JSON.stringify({ alias: 'invitado', nombre: 'Invitado' }));
  document.getElementById('loginModal')?.classList.add('hidden');
  actualizarUIUsuario({ nombre: 'Invitado' });
  cargarDatos();
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  window.location.href = '../index.html';
}

function mostrarErrorLogin(msg) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.add('show');
  }
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
  if (menu?.classList.contains('active') && !menu.contains(e.target) && !avatar?.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// ============================================
// CARGAR DATOS (IGUAL QUE APP.JS ORIGINAL)
// ============================================
async function cargarDatos() {
  const loading = document.getElementById('loading');
  
  try {
    const res = await fetch(`${API_BASE}/datos`);
    const data = await res.json();
    
    actividades = data.actividades || [];
    actividadVigente = data.actividadVigente || [];
    
    console.log('Actividades cargadas:', actividades.length);
    
    if (loading) loading.classList.add('hidden');
    
    if (actividades.length > 0) {
      renderizarDestacadas();
      renderizarProximas();
      renderizarCategorias();
      renderizarFiltros();
      renderizarTodas();
      
      // Mostrar secciones
      document.getElementById('seccionDestacadas')?.classList.remove('hidden');
      document.getElementById('seccionProximas')?.classList.remove('hidden');
      document.getElementById('seccionCategorias')?.classList.remove('hidden');
      document.getElementById('seccionTodas')?.classList.remove('hidden');
    } else {
      mostrarEmpty();
    }
  } catch (err) {
    console.error('Error cargando datos:', err);
    if (loading) loading.classList.add('hidden');
    mostrarEmpty();
  }
}

// ============================================
// ICONOS CATEGORÍA (DEL ORIGINAL)
// ============================================
function getIconoCategoria(cat) {
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
    'default': '🎯'
  };
  return iconos[cat] || iconos.default;
}

// ============================================
// RENDERIZADO
// ============================================
function renderizarDestacadas() {
  const container = document.getElementById('carouselDestacadas');
  if (!container) return;
  
  const destacadas = actividades.slice(0, 5);
  container.innerHTML = destacadas.map(a => crearCardCarousel(a)).join('');
}

function renderizarProximas() {
  const container = document.getElementById('carouselProximas');
  if (!container) return;
  
  const proximas = actividades.slice(0, 6);
  container.innerHTML = proximas.map((a, i) => {
    const badgeClass = i === 0 ? 'badge-hoy' : i === 1 ? 'badge-manana' : 'badge-semana';
    const badgeText = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : (a.Día?.split(',')[0]?.trim() || 'Próximo');
    return crearCardCarousel(a, badgeClass, badgeText);
  }).join('');
}

function crearCardCarousel(a, badgeClass = 'badge-semana', badgeText = '') {
  const img = a.Imagen || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400';
  const texto = badgeText || a.Día?.split(',')[0]?.trim() || 'Próximo';
  const id = a.Id || a.Actividad;
  
  return `
    <div class="activity-card" onclick="abrirModal('${id}')">
      <div class="activity-card-image" style="background-image: url('${img}')" onerror="this.style.backgroundImage='url(https://via.placeholder.com/400x200?text=COAJ)'">
        <span class="activity-card-badge ${badgeClass}">${texto}</span>
      </div>
      <div class="activity-card-content">
        <h3 class="activity-card-title">${a.Actividad || 'Sin título'}</h3>
        <div class="activity-card-meta">
          <div class="activity-card-meta-item">
            <span class="material-symbols-outlined">schedule</span>
            ${a.Horario || 'Por definir'}
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

function renderizarCategorias() {
  const container = document.getElementById('categoriasGrid');
  if (!container) return;
  
  const categorias = {};
  actividades.forEach(a => {
    const cat = a.Categoría || 'Otros';
    categorias[cat] = (categorias[cat] || 0) + 1;
  });
  
  container.innerHTML = Object.entries(categorias).map(([cat, count]) => `
    <div class="category-card ${categoriaActiva === cat ? 'active' : ''}" onclick="filtrarPorCategoria('${cat}')">
      <div class="category-icon">${getIconoCategoria(cat)}</div>
      <div class="category-name">${cat}</div>
      <div class="category-count">${count} actividad${count !== 1 ? 'es' : ''}</div>
    </div>
  `).join('');
}

function renderizarFiltros() {
  const catContainer = document.getElementById('filtrosCategorias');
  if (!catContainer) return;
  
  const categorias = ['Todas', ...new Set(actividades.map(a => a.Categoría).filter(Boolean))];
  
  catContainer.innerHTML = categorias.map(cat => `
    <button class="chip ${categoriaActiva === cat ? 'active' : ''}" onclick="filtrarPorCategoria('${cat}')">${cat}</button>
  `).join('');
}

function renderizarTodas() {
  const container = document.getElementById('actividadesGrid');
  if (!container) return;
  
  let filtradas = actividades;
  
  if (categoriaActiva !== 'Todas') {
    filtradas = filtradas.filter(a => a.Categoría === categoriaActiva);
  }
  
  if (busqueda) {
    const term = busqueda.toLowerCase();
    filtradas = filtradas.filter(a => 
      (a.Actividad || '').toLowerCase().includes(term) ||
      (a.Descripción || '').toLowerCase().includes(term) ||
      (a.Categoría || '').toLowerCase().includes(term) ||
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
  const img = a.Imagen || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400';
  const estado = a.Estado || 'Programado';
  const estadoClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                    : estado.toLowerCase().includes('final') ? 'finalizado' 
                    : 'programado';
  const id = a.Id || a.Actividad;
  
  return `
    <div class="activity-grid-card" onclick="abrirModal('${id}')">
      <div class="activity-grid-image" style="background-image: url('${img}')"></div>
      <div class="activity-grid-content">
        <div class="activity-grid-badges">
          ${a.Categoría ? `<span class="activity-badge badge-categoria">${a.Categoría}</span>` : ''}
          <span class="activity-badge badge-estado-${estadoClass}">${estado}</span>
        </div>
        <h3 class="activity-grid-title">${a.Actividad || 'Sin título'}</h3>
        <p class="activity-grid-description">${a.Descripción || 'Descubre esta actividad en COAJ Madrid.'}</p>
        <div class="activity-grid-footer">
          <div class="activity-grid-info">
            <div class="activity-grid-info-item">
              <span class="material-symbols-outlined">schedule</span>
              ${a.Horario || 'Por definir'}
            </div>
            <div class="activity-grid-info-item">
              <span class="material-symbols-outlined">calendar_today</span>
              ${a.Día?.split(',')[0]?.trim() || 'Por definir'}
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
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================
function filtrarPorCategoria(categoria) {
  categoriaActiva = categoria;
  
  document.querySelectorAll('.category-card').forEach(card => {
    const nombre = card.querySelector('.category-name')?.textContent;
    card.classList.toggle('active', nombre === categoria);
  });
  
  document.querySelectorAll('#filtrosCategorias .chip').forEach(chip => {
    chip.classList.toggle('active', chip.textContent === categoria);
  });
  
  renderizarTodas();
}

function buscarActividades() {
  busqueda = document.getElementById('searchInput')?.value.trim() || '';
  renderizarTodas();
}

function limpiarFiltros() {
  categoriaActiva = 'Todas';
  busqueda = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  renderizarCategorias();
  renderizarFiltros();
  renderizarTodas();
  document.getElementById('emptyState')?.classList.remove('active');
}

// ============================================
// MODAL DETALLE (CAMPOS DEL ORIGINAL)
// ============================================
function abrirModal(id) {
  actividadSeleccionada = actividades.find(a => (a.Id || a.Actividad) === id);
  if (!actividadSeleccionada) {
    console.error('Actividad no encontrada:', id);
    return;
  }
  
  const a = actividadSeleccionada;
  const modal = document.getElementById('modalDetalle');
  
  // Imagen
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    modalImage.style.backgroundImage = `url('${a.Imagen || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}')`;
  }
  
  // Badges
  const estado = a.Estado || 'Programado';
  const estadoClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                    : estado.toLowerCase().includes('final') ? 'finalizado' 
                    : 'programado';
  
  const modalBadges = document.getElementById('modalBadges');
  if (modalBadges) {
    modalBadges.innerHTML = `
      ${a.Categoría ? `<span class="activity-badge badge-categoria">${a.Categoría}</span>` : ''}
      <span class="activity-badge badge-estado-${estadoClass}">${estado}</span>
    `;
  }
  
  // Contenido
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  if (modalTitle) modalTitle.textContent = a.Actividad || 'Sin título';
  if (modalDescription) modalDescription.textContent = a.Descripción || 'Descubre esta actividad en COAJ Madrid. ¡Te esperamos!';
  
  // Info Grid (CAMPOS DEL ORIGINAL)
  const modalInfo = document.getElementById('modalInfo');
  if (modalInfo) {
    modalInfo.innerHTML = `
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">location_on</span> Centro</small>
        <strong>${a['Centro Juvenil'] || 'COAJ Madrid'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">calendar_today</span> Día</small>
        <strong>${a.Día || 'Por definir'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">schedule</span> Horario</small>
        <strong>${a.Horario || 'Por definir'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">group</span> Plazas</small>
        <strong>${a.Plazas || 'Ilimitadas'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">cake</span> Edad</small>
        <strong>${a.Edad || 'Todas las edades'}</strong>
      </div>
      <div class="modal-info-item">
        <small><span class="material-symbols-outlined">payments</span> Precio</small>
        <strong>${a.Precio || 'Gratis'}</strong>
      </div>
    `;
  }
  
  // Botón inscripción
  const btnInscribirse = document.getElementById('btnInscribirse');
  if (btnInscribirse) {
    const sesion = localStorage.getItem('coajUsuario');
    const usuario = sesion ? JSON.parse(sesion) : null;
    
    if (!usuario || usuario.alias === 'invitado') {
      btnInscribirse.innerHTML = '<span class="material-symbols-outlined">login</span> Inicia sesión';
      btnInscribirse.onclick = () => { window.location.href = '../index.html'; };
    } else {
      btnInscribirse.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span> Inscribirme';
      btnInscribirse.onclick = inscribirse;
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

// ============================================
// INSCRIPCIÓN (DEL ORIGINAL)
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
      mostrarToast('¡Inscripción exitosa!', 'success');
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

function abrirAsesoria() {
  mostrarToast('Asesoría próximamente', 'success');
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
