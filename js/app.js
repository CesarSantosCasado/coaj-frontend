// ============================================
// COAJ MADRID - APP.JS (Actividades)
// Conectado al sistema de login unificado
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let actividades = [];
let actividadVigente = [];
let categoriaActiva = 'Todas';
let centroActivo = 'Todos';
let vistaActual = 'tarjetas';
let mesActual = new Date();

// ============================================
// VERIFICAR SESIÓN AL CARGAR
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem('coajUsuario');
  const loginModal = document.getElementById('loginModal');
  
  if (sesion) {
    // Ya está logueado, ocultar modal y mostrar datos
    const usuario = JSON.parse(sesion);
    if (loginModal) loginModal.classList.add('hidden');
    mostrarUsuario(usuario);
    cargarDatos();
  } else {
    // No hay sesión, mostrar modal de login
    if (loginModal) loginModal.classList.remove('hidden');
  }
}

function mostrarUsuario(usuario) {
  const nombreEl = document.getElementById('nombreUsuario');
  if (nombreEl) {
    nombreEl.textContent = usuario.nombre || usuario.alias || 'Usuario';
  }
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
    btn.textContent = '⏳ Verificando...';
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
      // Guardar sesión (mismo key que home)
      localStorage.setItem('coajUsuario', JSON.stringify(data.usuario));
      
      // Ocultar modal y cargar datos
      document.getElementById('loginModal')?.classList.add('hidden');
      mostrarUsuario(data.usuario);
      cargarDatos();
    } else {
      mostrarErrorLogin(data.message || 'Credenciales incorrectas');
    }
  } catch (err) {
    console.error('Login error:', err);
    mostrarErrorLogin('Error de conexión. Intenta de nuevo.');
  }
  
  if (btn) {
    btn.disabled = false;
    btn.textContent = '🔐 Iniciar Sesión';
  }
}

function entrarComoInvitado() {
  // Guardar sesión de invitado
  localStorage.setItem('coajUsuario', JSON.stringify({ 
    alias: 'invitado', 
    nombre: 'Invitado' 
  }));
  
  document.getElementById('loginModal')?.classList.add('hidden');
  mostrarUsuario({ nombre: 'Invitado' });
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
  // Redirigir al home o mostrar login
  window.location.href = '../index.html';
}

// ============================================
// CARGAR DATOS
// ============================================
async function cargarDatos() {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  
  if (loading) loading.style.display = 'block';
  if (empty) empty.style.display = 'none';
  
  try {
    const res = await fetch(`${API_BASE}/datos`);
    const data = await res.json();
    
    actividades = data.actividades || [];
    actividadVigente = data.actividadVigente || [];
    
    if (loading) loading.style.display = 'none';
    
    if (actividades.length === 0) {
      if (empty) empty.style.display = 'block';
    } else {
      generarFiltros();
      renderizarVista();
    }
  } catch (err) {
    console.error('Error cargando datos:', err);
    if (loading) loading.style.display = 'none';
    if (empty) {
      empty.querySelector('.empty-title').textContent = 'Error de conexión';
      empty.querySelector('.empty-text').textContent = 'No se pudieron cargar las actividades';
      empty.style.display = 'block';
    }
  }
}

// ============================================
// FILTROS
// ============================================
function generarFiltros() {
  const categorias = ['Todas', ...new Set(actividades.map(a => a.Categoría).filter(Boolean))];
  const container = document.getElementById('filtros');
  
  if (!container) return;
  
  container.innerHTML = categorias.map(cat => `
    <button class="view-btn ${cat === categoriaActiva ? 'active' : ''}" 
            onclick="filtrarCategoria('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function filtrarCategoria(categoria) {
  categoriaActiva = categoria;
  
  document.querySelectorAll('#filtros .view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === categoria);
  });
  
  renderizarVista();
}

// ============================================
// VISTAS
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  
  document.querySelectorAll('.view-toggle .view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  document.getElementById('vistaTarjetas').style.display = vista === 'tarjetas' ? 'block' : 'none';
  document.getElementById('vistaCalendario').style.display = vista === 'calendario' ? 'block' : 'none';
  
  renderizarVista();
}

function renderizarVista() {
  const filtradas = categoriaActiva === 'Todas' 
    ? actividades 
    : actividades.filter(a => a.Categoría === categoriaActiva);
  
  if (vistaActual === 'tarjetas') {
    renderizarTarjetas(filtradas);
  } else {
    renderizarCalendario(filtradas);
  }
}

function renderizarTarjetas(lista) {
  const container = document.getElementById('vistaTarjetas');
  if (!container) return;
  
  if (lista.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Sin resultados</div>
        <div class="empty-text">No hay actividades en esta categoría</div>
      </div>
    `;
    return;
  }
  
  // Agrupar por categoría
  const grupos = {};
  lista.forEach(a => {
    const cat = a.Categoría || 'Sin categoría';
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(a);
  });
  
  let html = '';
  
  for (const [categoria, items] of Object.entries(grupos)) {
    html += `
      <div class="category-banner">
        <div class="category-content">
          <div class="category-info">
            <div class="category-icon">${getIconoCategoria(categoria)}</div>
            <div class="category-title">${categoria}</div>
          </div>
          <div class="category-count">${items.length} actividad${items.length !== 1 ? 'es' : ''}</div>
        </div>
      </div>
      <div class="eventos-grid">
        ${items.map(a => crearTarjeta(a)).join('')}
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function crearTarjeta(a) {
  const img = a.Imagen || 'https://via.placeholder.com/400x200?text=COAJ';
  const estado = a.Estado || 'Programado';
  const badgeClass = estado.toLowerCase().includes('desarrollo') ? 'desarrollo' 
                   : estado.toLowerCase().includes('final') ? 'finalizado' 
                   : 'programado';
  
  return `
    <div class="evento-card" onclick="abrirModal('${a.Id || a.Actividad}')">
      <img class="evento-img" src="${img}" alt="${a.Actividad}" onerror="this.src='https://via.placeholder.com/400x200?text=COAJ'">
      <div class="evento-content">
        <h3 class="evento-nombre">${a.Actividad}</h3>
        <div class="evento-info">
          <div class="info-item">
            <span class="info-icon">📍</span>
            <span class="info-text">${a['Centro Juvenil'] || 'Por definir'}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">📅</span>
            <span class="info-text">${a.Día || 'Por definir'}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🕐</span>
            <span class="info-text">${a.Horario || 'Por definir'}</span>
          </div>
        </div>
        <span class="badge badge-${badgeClass}">${estado}</span>
        <button class="btn-ver-mas">Ver detalles</button>
      </div>
    </div>
  `;
}

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
    'default': '🎯'
  };
  return iconos[cat] || iconos.default;
}

// ============================================
// CALENDARIO
// ============================================
function renderizarCalendario(lista) {
  const container = document.getElementById('vistaCalendario');
  if (!container) return;
  
  const año = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = primerDia.getDay();
  
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  let html = `
    <div class="calendario-container">
      <div class="calendario-header">
        <div class="calendario-nav">
          <button class="btn-nav" onclick="cambiarMes(-1)">◀</button>
          <span class="mes-actual">${meses[mes]} ${año}</span>
          <button class="btn-nav" onclick="cambiarMes(1)">▶</button>
        </div>
        <button class="btn-hoy" onclick="irAHoy()">Hoy</button>
      </div>
      <div class="calendario-grid">
        <div class="dia-semana">Dom</div>
        <div class="dia-semana">Lun</div>
        <div class="dia-semana">Mar</div>
        <div class="dia-semana">Mié</div>
        <div class="dia-semana">Jue</div>
        <div class="dia-semana">Vie</div>
        <div class="dia-semana">Sáb</div>
  `;
  
  // Días vacíos al inicio
  for (let i = 0; i < primerDiaSemana; i++) {
    html += '<div class="dia-celda otro-mes"></div>';
  }
  
  const hoy = new Date();
  
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(año, mes, dia);
    const esHoy = fecha.toDateString() === hoy.toDateString();
    const actividadesDia = contarActividadesDia(lista, fecha);
    
    html += `
      <div class="dia-celda ${esHoy ? 'hoy' : ''} ${actividadesDia > 0 ? 'con-actividades' : ''}"
           onclick="verActividadesDia(${año}, ${mes}, ${dia})">
        <span class="dia-numero">${dia}</span>
        ${actividadesDia > 0 ? `<span class="dia-contador">${actividadesDia}</span>` : ''}
      </div>
    `;
  }
  
  html += `
      </div>
      <div id="actividadesDiaContainer"></div>
    </div>
  `;
  
  container.innerHTML = html;
}

function contarActividadesDia(lista, fecha) {
  const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
  return lista.filter(a => a.Día && a.Día.includes(diaSemana)).length;
}

function cambiarMes(delta) {
  mesActual.setMonth(mesActual.getMonth() + delta);
  renderizarVista();
}

function irAHoy() {
  mesActual = new Date();
  renderizarVista();
}

function verActividadesDia(año, mes, dia) {
  const fecha = new Date(año, mes, dia);
  const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
  
  const filtradas = categoriaActiva === 'Todas' ? actividades : actividades.filter(a => a.Categoría === categoriaActiva);
  const actividadesDia = filtradas.filter(a => a.Día && a.Día.includes(diaSemana));
  
  const container = document.getElementById('actividadesDiaContainer');
  if (!container) return;
  
  if (actividadesDia.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <div class="actividades-dia-container">
      <div class="actividades-dia-header">
        <span class="actividades-dia-titulo">${diaSemana} ${dia}</span>
        <button class="btn-cerrar-dia" onclick="document.getElementById('actividadesDiaContainer').innerHTML=''">✕</button>
      </div>
      <div class="actividades-dia-body">
        <div class="eventos-grid">
          ${actividadesDia.map(a => crearTarjeta(a)).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// MODAL DETALLE
// ============================================
function abrirModal(id) {
  const actividad = actividades.find(a => (a.Id || a.Actividad) === id);
  if (!actividad) return;
  
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalTitulo = document.getElementById('modalTitulo');
  const modalBadges = document.getElementById('modalBadges');
  const modalDescripcion = document.getElementById('modalDescripcion');
  const modalInfo = document.getElementById('modalInfo');
  
  if (modalImg) modalImg.src = actividad.Imagen || 'https://via.placeholder.com/700x400?text=COAJ';
  if (modalTitulo) modalTitulo.textContent = actividad.Actividad;
  
  if (modalBadges) {
    const estado = actividad.Estado || 'Programado';
    const badgeClass = estado.toLowerCase().includes('desarrollo') ? 'badge-desarrollo' 
                     : estado.toLowerCase().includes('final') ? 'badge-finalizado' 
                     : 'badge-programado';
    modalBadges.innerHTML = `
      <span class="modal-badge ${badgeClass}">${estado}</span>
      ${actividad.Categoría ? `<span class="modal-badge" style="background:#0a3d5c;color:white;">${actividad.Categoría}</span>` : ''}
    `;
  }
  
  if (modalDescripcion) {
    modalDescripcion.textContent = actividad.Descripción || 'Sin descripción disponible.';
  }
  
  if (modalInfo) {
    modalInfo.innerHTML = `
      <div class="modal-info-card"><small>📍 Centro</small><strong>${actividad['Centro Juvenil'] || 'Por definir'}</strong></div>
      <div class="modal-info-card"><small>📅 Día</small><strong>${actividad.Día || 'Por definir'}</strong></div>
      <div class="modal-info-card"><small>🕐 Horario</small><strong>${actividad.Horario || 'Por definir'}</strong></div>
      <div class="modal-info-card"><small>👥 Plazas</small><strong>${actividad.Plazas || 'Ilimitadas'}</strong></div>
      <div class="modal-info-card"><small>🎯 Edad</small><strong>${actividad.Edad || 'Todas'}</strong></div>
      <div class="modal-info-card"><small>💰 Precio</small><strong>${actividad.Precio || 'Gratis'}</strong></div>
      ${puedeInscribirse() ? `<button class="btn-inscribirse" onclick="inscribirse('${actividad.Actividad}')">📝 Inscribirse</button>` : ''}
    `;
  }
  
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }
}

function cerrarModal(e) {
  if (e && e.target !== e.currentTarget) return;
  
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
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
async function inscribirse(actividad) {
  const sesion = localStorage.getItem('coajUsuario');
  if (!sesion) {
    alert('Debes iniciar sesión para inscribirte');
    return;
  }
  
  const usuario = JSON.parse(sesion);
  if (usuario.alias === 'invitado') {
    alert('Los invitados no pueden inscribirse. Inicia sesión con tu cuenta.');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/inscribir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        actividad, 
        usuario: usuario.alias 
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert('✅ ¡Inscripción exitosa!');
      cerrarModal();
    } else {
      alert(data.message || 'Error al inscribirse');
    }
  } catch (err) {
    console.error('Error inscripción:', err);
    alert('Error de conexión');
  }
}

// ============================================
// FECHA HEADER
// ============================================
function actualizarFecha() {
  const fechaEl = document.getElementById('fecha');
  if (fechaEl) {
    const hoy = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    fechaEl.textContent = hoy.toLocaleDateString('es-ES', opciones);
  }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  actualizarFecha();
  verificarSesion();
});

// ESC para cerrar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModal();
});
