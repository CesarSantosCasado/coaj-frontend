/**
 * COAJ MADRID - EVENTOS
 * Con sesión compartida desde actividades
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
const API_BASE = COAJ_CONFIG?.api?.base || '';
const CACHE_KEY = COAJ_CONFIG?.cache?.eventosKey || 'coaj_eventos_cache';
const CACHE_TTL = COAJ_CONFIG?.cache?.ttl || 300000;

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

// CoajCache fallback
if (typeof CoajCache === 'undefined') {
  window.CoajCache = {
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) { localStorage.removeItem(key); return null; }
        return parsed.data;
      } catch { return null; }
    },
    set: (key, data, ttl = 300000) => {
      try { localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl })); } catch {}
    },
    remove: (key) => localStorage.removeItem(key)
  };
}

// ============================================
// Estado Global
// ============================================
let eventos = [];
let vistaActual = 'tarjetas';
let categoriaActual = 'todas';
let centroActual = 'todos';
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();
let diaSeleccionado = null;

const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ============================================
// SESIÓN (compartida con actividades)
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem('coaj_sesion');
  console.log('🔐 Verificando sesión:', sesion ? 'encontrada' : 'no encontrada');
  
  if (sesion) {
    try {
      const usuario = JSON.parse(sesion);
      actualizarUIUsuario(usuario);
      ocultarLoginModal();
      cargarEventos();
    } catch (e) {
      console.error('Error parseando sesión:', e);
      mostrarLoginModal();
    }
  } else {
    mostrarLoginModal();
  }
}

function actualizarUIUsuario(usuario) {
  const nombre = usuario.nombre || usuario.alias || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  
  const headerGreeting = document.getElementById('headerGreeting');
  const avatarInitial = document.getElementById('avatarInitial');
  const menuAvatarInitial = document.getElementById('menuAvatarInitial');
  const menuUserName = document.getElementById('menuUserName');
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');
  
  if (headerGreeting) headerGreeting.textContent = `Hola, ${nombre}`;
  if (avatarInitial) avatarInitial.textContent = inicial;
  if (menuAvatarInitial) menuAvatarInitial.textContent = inicial;
  if (menuUserName) menuUserName.textContent = nombre;
  if (bottomNavGuest) bottomNavGuest.style.display = 'none';
  if (bottomNavUser) bottomNavUser.style.display = 'flex';
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
  
  const aliasEl = document.getElementById('alias');
  const contrasenaEl = document.getElementById('contrasena');
  const errorEl = document.getElementById('loginError');
  const btnLogin = document.querySelector('.btn-login');
  
  const alias = aliasEl?.value?.trim();
  const contrasena = contrasenaEl?.value;
  
  if (!alias || !contrasena) {
    if (errorEl) { errorEl.textContent = 'Completa todos los campos'; errorEl.style.display = 'block'; }
    return;
  }
  
  if (btnLogin) { btnLogin.disabled = true; btnLogin.innerHTML = '⏳ Verificando...'; }
  
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
      if (errorEl) { errorEl.textContent = data.error || 'Credenciales incorrectas'; errorEl.style.display = 'block'; }
    }
  } catch (error) {
    console.error('Error login:', error);
    if (errorEl) { errorEl.textContent = 'Error de conexión'; errorEl.style.display = 'block'; }
  } finally {
    if (btnLogin) { btnLogin.disabled = false; btnLogin.innerHTML = '🔐 Iniciar Sesión'; }
  }
}

function cerrarSesion() {
  localStorage.removeItem('coaj_sesion');
  
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');
  const headerGreeting = document.getElementById('headerGreeting');
  const avatarInitial = document.getElementById('avatarInitial');
  
  if (bottomNavGuest) bottomNavGuest.style.display = 'flex';
  if (bottomNavUser) bottomNavUser.style.display = 'none';
  if (headerGreeting) headerGreeting.textContent = 'Bienvenido';
  if (avatarInitial) avatarInitial.textContent = 'U';
  
  cerrarUserMenu();
  mostrarLoginModal();
}

function mostrarLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('hidden');
}

function ocultarLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('hidden');
}

// ============================================
// USER MENU
// ============================================
function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.classList.toggle('active');
}

function cerrarUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.classList.remove('active');
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
  
  const themeIcon = document.getElementById('themeIcon');
  const menuThemeIcon = document.getElementById('menuThemeIcon');
  const menuThemeText = document.getElementById('menuThemeText');
  
  if (themeIcon) themeIcon.textContent = icon;
  if (menuThemeIcon) menuThemeIcon.textContent = icon;
  if (menuThemeText) menuThemeText.textContent = text;
}

function cargarTema() {
  const tema = localStorage.getItem('coaj_theme') || 'light';
  document.documentElement.setAttribute('data-theme', tema);
  
  const icon = tema === 'dark' ? 'light_mode' : 'dark_mode';
  const text = tema === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  
  const themeIcon = document.getElementById('themeIcon');
  const menuThemeIcon = document.getElementById('menuThemeIcon');
  const menuThemeText = document.getElementById('menuThemeText');
  
  if (themeIcon) themeIcon.textContent = icon;
  if (menuThemeIcon) menuThemeIcon.textContent = icon;
  if (menuThemeText) menuThemeText.textContent = text;
}

// ============================================
// CARGAR EVENTOS
// ============================================
async function cargarEventos(forceRefresh = false) {
  console.log('📅 cargarEventos()', forceRefresh ? '(forzado)' : '');
  
  if (!forceRefresh) {
    const cached = CoajCache.get(CACHE_KEY);
    if (cached) {
      console.log('📦 Usando cache');
      eventos = cached;
      generarFiltros(eventos);
      generarFiltrosCentros(eventos);
      render(eventos);
      actualizarFecha();
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
      console.log(`✅ ${eventos.length} eventos`);
      
      CoajCache.set(CACHE_KEY, eventos, CACHE_TTL);
      generarFiltros(eventos);
      generarFiltrosCentros(eventos);
      render(eventos);
      actualizarFecha();
    } else {
      eventos = [];
      render(eventos);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    mostrarLoading(false);
    mostrarEmpty(true);
    mostrarToast('Error al cargar eventos', 'error');
  }
}

function refrescarEventos() {
  CoajCache.remove(CACHE_KEY);
  categoriaActual = 'todas';
  centroActual = 'todos';
  cargarEventos(true);
  mostrarToast('Actualizando...', 'success');
}

function mostrarLoading(show) {
  const el = document.getElementById('loading');
  if (el) el.style.display = show ? 'block' : 'none';
}

function mostrarEmpty(show) {
  const el = document.getElementById('empty');
  if (el) el.style.display = show ? 'block' : 'none';
}

// ============================================
// UTILIDADES FECHA
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
    return fB - fA;
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
  try {
    if (str.includes('/')) {
      const p = str.split(' ');
      const f = p[0].split('/');
      const d = new Date(+f[2], +f[0] - 1, +f[1]);
      let r = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      if (p[1]) r += ' • ' + p[1].substring(0, 5);
      return r;
    }
    return str;
  } catch { return str; }
}

function formatearFechaCorta(str) {
  if (!str) return 'Por confirmar';
  try {
    if (str.includes('/')) {
      const f = str.split(' ')[0].split('/');
      return new Date(2024, +f[0] - 1, +f[1]).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return str;
  } catch { return str; }
}

function calcularEstado(ev) {
  const inicio = parsearFecha(ev["Fecha inicio"]);
  const fin = parsearFecha(ev["Fecha finalización"]);
  if (!inicio) return null;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const i = new Date(inicio); i.setHours(0, 0, 0, 0);
  const f = fin ? new Date(fin) : new Date(i); f.setHours(0, 0, 0, 0);
  
  const diffI = Math.floor((i - hoy) / 86400000);
  const diffF = Math.floor((f - hoy) / 86400000);
  
  if (diffI > 5) return 'Programado';
  if (diffI <= 5 && diffF >= 0) return 'Desarrollo';
  if (diffF < 0) return 'Finalizado';
  return 'Programado';
}

function extraerImg(url) {
  if (!url) return null;
  if (url.includes('gettablefileurl')) {
    const p = new URLSearchParams(url.split('?')[1] || '');
    if (!p.get('fileName')?.trim()) return null;
  }
  return url;
}

// ============================================
// FILTROS
// ============================================
function agrupar(evts) {
  const g = {};
  evts.forEach(ev => {
    const c = ev.Categoría || ev.Categoria || 'Sin Categoría';
    if (!g[c]) g[c] = [];
    g[c].push(ev);
  });
  return g;
}

function filtrarEventos(evts) {
  let r = evts;
  if (categoriaActual !== 'todas') {
    r = r.filter(ev => (ev.Categoría || ev.Categoria || 'Sin Categoría') === categoriaActual);
  }
  if (centroActual !== 'todos') {
    r = r.filter(ev => ev["Centro Juvenil"] === centroActual);
  }
  return r;
}

function generarFiltros(evts) {
  const c = document.getElementById('filtros');
  if (!c) return;
  c.innerHTML = '';
  
  const btn = document.createElement('button');
  btn.className = 'filtro-btn active';
  btn.setAttribute('data-categoria', 'todas');
  btn.innerHTML = `📌 Todas (${evts.length})`;
  btn.onclick = () => filtrarCategoria('todas');
  c.appendChild(btn);
  
  const g = agrupar(evts);
  Object.keys(g).sort().forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filtro-btn';
    b.setAttribute('data-categoria', cat);
    b.innerHTML = `${ICONOS[cat] || ICONOS.default} ${cat} (${g[cat].length})`;
    b.onclick = () => filtrarCategoria(cat);
    c.appendChild(b);
  });
}

function generarFiltrosCentros(evts) {
  const c = document.getElementById('filtrosCentros');
  if (!c) return;
  c.innerHTML = '';
  
  const set = new Set();
  evts.forEach(ev => {
    const centro = ev["Centro Juvenil"];
    if (centro?.trim()) set.add(centro.trim());
  });
  
  if (set.size === 0) { c.style.display = 'none'; return; }
  c.style.display = 'flex';
  
  const btn = document.createElement('button');
  btn.className = 'filtro-centro-btn active';
  btn.setAttribute('data-centro', 'todos');
  btn.innerHTML = `🏢 Todos (${evts.length})`;
  btn.onclick = () => filtrarCentro('todos');
  c.appendChild(btn);
  
  Array.from(set).sort().forEach(centro => {
    const count = evts.filter(ev => ev["Centro Juvenil"] === centro).length;
    const b = document.createElement('button');
    b.className = 'filtro-centro-btn';
    b.setAttribute('data-centro', centro);
    b.innerHTML = `📍 ${centro} (${count})`;
    b.onclick = () => filtrarCentro(centro);
    c.appendChild(b);
  });
}

function filtrarCategoria(cat) {
  categoriaActual = cat;
  document.querySelectorAll('.filtro-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-categoria') === cat);
  });
  cerrarEventosDia();
  render(eventos);
}

function filtrarCentro(centro) {
  centroActual = centro;
  document.querySelectorAll('.filtro-centro-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-centro') === centro);
  });
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// RENDER
// ============================================
function render(evts) {
  const filtered = filtrarEventos(evts);
  
  if (!filtered.length) {
    mostrarLoading(false);
    mostrarEmpty(true);
    const vt = document.getElementById('vistaTarjetas');
    const vc = document.getElementById('vistaCalendario');
    if (vt) vt.innerHTML = '';
    if (vc) vc.innerHTML = '';
    return;
  }
  
  mostrarLoading(false);
  mostrarEmpty(false);
  
  if (vistaActual === 'tarjetas') renderTarjetas(filtered);
  else renderCalendario(evts);
}

function crearCard(ev) {
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const fecha = formatearFechaCorta(ev["Fecha inicio"]);
  const centro = ev["Centro Juvenil"] || 'Sin centro';
  const estado = calcularEstado(ev);
  const img = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel) || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';

  let badge = '';
  if (estado === 'Desarrollo') badge = '<span class="badge badge-desarrollo">En curso</span>';
  else if (estado === 'Finalizado') badge = '<span class="badge badge-finalizado">Finalizado</span>';
  else if (estado === 'Programado') badge = '<span class="badge badge-programado">Próximo</span>';

  const card = document.createElement('div');
  card.className = 'evento-card';
  card.innerHTML = `
    <img class="evento-img" src="${img}" alt="${nombre}" onerror="this.src='https://placehold.co/600x400/032845/ffffff?text=COAJ'">
    <div class="evento-content">
      <div class="evento-nombre">${nombre}</div>
      <div class="evento-info">
        ${badge}
        <div class="info-item"><div class="info-icon">📅</div><div class="info-text">${fecha}</div></div>
        <div class="info-item"><div class="info-icon">🏢</div><div class="info-text">${centro}</div></div>
      </div>
      <button class="btn-ver-mas">Ver más</button>
    </div>
  `;
  card.querySelector('.btn-ver-mas').onclick = () => abrirModal(ev);
  return card;
}

function renderTarjetas(evts) {
  const c = document.getElementById('vistaTarjetas');
  if (!c) return;
  c.innerHTML = '';
  
  const g = agrupar(evts);
  
  if (categoriaActual !== 'todas') {
    const items = g[categoriaActual] || [];
    const grid = document.createElement('div');
    grid.className = 'eventos-grid';
    items.forEach(i => grid.appendChild(crearCard(i)));
    c.appendChild(grid);
  } else {
    Object.keys(g).sort().forEach(cat => {
      const items = g[cat];
      const banner = document.createElement('div');
      banner.className = 'category-banner';
      banner.innerHTML = `<div class="category-content"><div class="category-info"><div class="category-icon">${ICONOS[cat] || ICONOS.default}</div><div class="category-title">${cat}</div></div><div class="category-count">${items.length}</div></div>`;
      c.appendChild(banner);
      
      const grid = document.createElement('div');
      grid.className = 'eventos-grid';
      items.forEach(i => grid.appendChild(crearCard(i)));
      c.appendChild(grid);
    });
  }
}

// ============================================
// CALENDARIO
// ============================================
function renderCalendario(evts) {
  const c = document.getElementById('vistaCalendario');
  if (c) c.innerHTML = generarCalendario(evts);
}

function generarCalendario(evts) {
  const filtered = filtrarEventos(evts);
  const primer = new Date(añoActual, mesActual, 1);
  const ultimo = new Date(añoActual, mesActual + 1, 0);
  const dias = ultimo.getDate();
  const primerDia = (primer.getDay() + 6) % 7;
  const hoy = new Date();
  
  let html = `<div class="calendario-container">
    <div class="calendario-header">
      <div class="calendario-nav">
        <button class="btn-nav" onclick="cambiarMes(-1)">←</button>
        <div class="mes-actual">${mesesNombres[mesActual]} ${añoActual}</div>
        <button class="btn-nav" onclick="cambiarMes(1)">→</button>
      </div>
      <button class="btn-hoy" onclick="irHoy()">Hoy</button>
    </div>
    <div class="calendario-grid">`;
  
  diasSemana.forEach(d => html += `<div class="dia-semana">${d}</div>`);
  
  for (let i = 0; i < primerDia; i++) {
    const d = new Date(añoActual, mesActual, -(primerDia - i - 1));
    html += `<div class="dia-celda otro-mes"><div class="dia-numero">${d.getDate()}</div></div>`;
  }
  
  for (let dia = 1; dia <= dias; dia++) {
    const evsDia = filtered.filter(ev => {
      const fi = parsearFecha(ev["Fecha inicio"]);
      const ff = parsearFecha(ev["Fecha finalización"]);
      if (!fi) return false;
      const fd = new Date(añoActual, mesActual, dia); fd.setHours(0,0,0,0);
      const i = new Date(fi); i.setHours(0,0,0,0);
      if (ff) { const f = new Date(ff); f.setHours(0,0,0,0); return fd >= i && fd <= f; }
      return fd.getTime() === i.getTime();
    });
    
    let cls = 'dia-celda';
    if (hoy.getDate() === dia && hoy.getMonth() === mesActual && hoy.getFullYear() === añoActual) cls += ' hoy';
    if (evsDia.length) cls += ' con-eventos';
    
    html += `<div class="${cls}" onclick="verEventosDia(${dia})">
      <div class="dia-numero">${dia}</div>
      ${evsDia.length ? `<div class="dia-contador">${evsDia.length}</div>` : ''}
    </div>`;
  }
  
  const rest = (7 - ((primerDia + dias) % 7)) % 7;
  for (let i = 1; i <= rest; i++) {
    html += `<div class="dia-celda otro-mes"><div class="dia-numero">${i}</div></div>`;
  }
  
  return html + '</div></div>';
}

function verEventosDia(dia) {
  diaSeleccionado = dia;
  const filtered = filtrarEventos(eventos);
  
  const evsDia = filtered.filter(ev => {
    const fi = parsearFecha(ev["Fecha inicio"]);
    const ff = parsearFecha(ev["Fecha finalización"]);
    if (!fi) return false;
    const fd = new Date(añoActual, mesActual, dia); fd.setHours(0,0,0,0);
    const i = new Date(fi); i.setHours(0,0,0,0);
    if (ff) { const f = new Date(ff); f.setHours(0,0,0,0); return fd >= i && fd <= f; }
    return fd.getTime() === i.getTime();
  });
  
  if (!evsDia.length) return;
  
  const c = document.getElementById('vistaCalendario');
  document.getElementById('eventosDia')?.remove();
  
  const fecha = new Date(añoActual, mesActual, dia).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const div = document.createElement('div');
  div.className = 'eventos-dia-container';
  div.id = 'eventosDia';
  div.innerHTML = `
    <div class="eventos-dia-header">
      <div class="eventos-dia-titulo">📅 ${fecha} (${evsDia.length})</div>
      <button class="btn-cerrar-dia" onclick="cerrarEventosDia()">✕</button>
    </div>
    <div class="eventos-dia-body"><div class="eventos-grid" id="gridEventosDia"></div></div>
  `;
  c.appendChild(div);
  
  const grid = document.getElementById('gridEventosDia');
  evsDia.forEach(ev => grid.appendChild(crearCard(ev)));
  div.scrollIntoView({ behavior: 'smooth' });
}

function cerrarEventosDia() {
  document.getElementById('eventosDia')?.remove();
  diaSeleccionado = null;
}

function cambiarMes(dir) {
  mesActual += dir;
  if (mesActual < 0) { mesActual = 11; añoActual--; }
  else if (mesActual > 11) { mesActual = 0; añoActual++; }
  cerrarEventosDia();
  render(eventos);
}

function irHoy() {
  const h = new Date();
  mesActual = h.getMonth();
  añoActual = h.getFullYear();
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// CAMBIAR VISTA
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  document.querySelectorAll('.view-btn').forEach((b, i) => {
    b.classList.toggle('active', (vista === 'tarjetas' && i === 0) || (vista === 'calendario' && i === 1));
  });
  
  const vt = document.getElementById('vistaTarjetas');
  const vc = document.getElementById('vistaCalendario');
  if (vt) vt.style.display = vista === 'tarjetas' ? 'block' : 'none';
  if (vc) vc.style.display = vista === 'calendario' ? 'block' : 'none';
  render(eventos);
}

// ============================================
// MODAL
// ============================================
function abrirModal(ev) {
  const modal = document.getElementById('modal');
  if (!modal) return;
  
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const desc = ev.Descripción || ev.Descripcion || 'Sin descripción.';
  const img = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel) || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';

  document.getElementById('modalImg').src = img;
  document.getElementById('modalTitulo').textContent = nombre;
  document.getElementById('modalDescripcion').textContent = desc;

  const badges = document.getElementById('modalBadges');
  badges.innerHTML = '';
  const estado = calcularEstado(ev);
  if (estado === 'Desarrollo') badges.innerHTML += '<span class="modal-badge badge-desarrollo">En curso</span>';
  else if (estado === 'Finalizado') badges.innerHTML += '<span class="modal-badge badge-finalizado">Finalizado</span>';
  else if (estado === 'Programado') badges.innerHTML += '<span class="modal-badge badge-programado">Próximo</span>';
  
  const cat = ev.Categoría || ev.Categoria;
  if (cat) badges.innerHTML += `<span class="modal-badge" style="background:#e8552a;color:white;">${cat}</span>`;

  document.getElementById('modalInfo').innerHTML = `
    <div class="modal-info-card"><small>📅 Del</small><strong>${formatearFecha(ev["Fecha inicio"])}</strong></div>
    <div class="modal-info-card"><small>⏰ Al</small><strong>${formatearFecha(ev["Fecha finalización"])}</strong></div>
    <div class="modal-info-card"><small>🏢 Centro</small><strong>${ev["Centro Juvenil"] || 'N/A'}</strong></div>
    <div class="modal-info-card"><small>📚 Programa</small><strong>${ev.Programa || 'N/A'}</strong></div>
    <div class="modal-info-card"><small>👥 Plazas</small><strong>${ev.Plazas || 'N/A'}</strong></div>
  `;

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function cerrarModal(e) {
  if (!e || e.target.id === 'modal') {
    document.getElementById('modal')?.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// ============================================
// TOAST
// ============================================
function mostrarToast(msg, tipo = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toastMessage').textContent = msg;
  document.getElementById('toastIcon').textContent = tipo === 'success' ? '✓' : '✕';
  toast.className = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// FECHA HEADER
// ============================================
function actualizarFecha() {
  const el = document.getElementById('fecha');
  if (el) el.textContent = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Iniciando Eventos COAJ...');
  cargarTema();
  actualizarFecha();
  verificarSesion(); // ← Verifica sesión guardada de actividades
  
  document.addEventListener('click', e => {
    if (!e.target.closest('.avatar-btn') && !e.target.closest('.user-menu')) cerrarUserMenu();
  });
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal();
  });
});
