/**
 * COAJ MADRID - EVENTOS
 * Versión corregida con manejo de errores
 */

// ============================================
// Verificar config.js
// ============================================
if (typeof COAJ_CONFIG === 'undefined') {
  console.error('❌ COAJ_CONFIG no definido. Verifica que config.js cargue primero.');
  alert('Error: config.js no cargado');
}

// ============================================
// Configuración con valores por defecto
// ============================================
const API_BASE = COAJ_CONFIG?.api?.base || '';
const CACHE_KEY = COAJ_CONFIG?.cache?.eventosKey || 'coaj_eventos_cache';
const CACHE_TTL = COAJ_CONFIG?.cache?.ttl || 300000;

// Iconos con fallback
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

// Verificar CoajCache
if (typeof CoajCache === 'undefined') {
  console.warn('⚠️ CoajCache no definido, creando versión básica');
  window.CoajCache = {
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.data;
      } catch { return null; }
    },
    set: (key, data, ttl = 300000) => {
      try {
        localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }));
      } catch (e) { console.warn('Cache write error:', e); }
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
// CARGAR EVENTOS
// ============================================
async function cargarEventos(forceRefresh = false) {
  console.log('📅 cargarEventos() - forceRefresh:', forceRefresh);
  
  if (!API_BASE) {
    console.error('❌ API_BASE no configurado');
    mostrarToast('Error: API no configurada', 'error');
    return;
  }
  
  // Cache
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
  
  // Loading
  const loadingEl = document.getElementById('loading');
  const emptyEl = document.getElementById('empty');
  
  if (loadingEl) loadingEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';
  
  const vistaTarjetas = document.getElementById('vistaTarjetas');
  const vistaCalendario = document.getElementById('vistaCalendario');
  if (vistaTarjetas) vistaTarjetas.innerHTML = '';
  if (vistaCalendario) vistaCalendario.innerHTML = '';
  
  try {
    console.log('🌐 Fetch:', `${API_BASE}/eventos`);
    const response = await fetch(`${API_BASE}/eventos`);
    
    console.log('📡 Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Data recibida:', data);
    
    if (data.eventos && Array.isArray(data.eventos)) {
      eventos = filtrarEventosFinalizados(data.eventos);
      eventos = ordenarEventosPorFecha(eventos);
      
      console.log(`✅ ${eventos.length} eventos procesados`);
      
      CoajCache.set(CACHE_KEY, eventos, CACHE_TTL);
      
      generarFiltros(eventos);
      generarFiltrosCentros(eventos);
      render(eventos);
      actualizarFecha();
    } else {
      console.warn('⚠️ Sin eventos en respuesta:', data);
      eventos = [];
      render(eventos);
    }
    
  } catch (error) {
    console.error('❌ Error cargando eventos:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    mostrarToast(`Error: ${error.message}`, 'error');
  }
}

function refrescarEventos() {
  console.log('🔄 Refrescando...');
  CoajCache.remove(CACHE_KEY);
  categoriaActual = 'todas';
  centroActual = 'todos';
  cargarEventos(true);
  mostrarToast('Actualizando...', 'success');
}

// ============================================
// FILTRAR Y ORDENAR
// ============================================
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
    return fechaB - fechaA;
  });
}

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

function formatearFecha(str) {
  if (!str) return 'Por confirmar';
  try {
    if (str.includes('/')) {
      const partes = str.split(' ');
      const fecha = partes[0].split('/');
      const fechaObj = new Date(parseInt(fecha[2]), parseInt(fecha[0]) - 1, parseInt(fecha[1]));
      let resultado = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      if (partes[1]) {
        const hora = partes[1].split(':');
        resultado += ' • ' + hora[0] + ':' + hora[1];
      }
      return resultado;
    }
    return str;
  } catch { return str; }
}

function formatearFechaCorta(str) {
  if (!str) return 'Por confirmar';
  try {
    if (str.includes('/')) {
      const fecha = str.split(' ')[0].split('/');
      const fechaObj = new Date(2024, parseInt(fecha[0]) - 1, parseInt(fecha[1]));
      return fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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

// ============================================
// FILTROS
// ============================================
function agrupar(evts) {
  const grupos = {};
  evts.forEach(ev => {
    const cat = ev.Categoría || ev.Categoria || 'Sin Categoría';
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(ev);
  });
  return grupos;
}

function filtrarEventos(evts) {
  let resultado = evts;
  
  if (categoriaActual !== 'todas') {
    resultado = resultado.filter(ev => {
      const cat = ev.Categoría || ev.Categoria || 'Sin Categoría';
      return cat === categoriaActual;
    });
  }
  
  if (centroActual !== 'todos') {
    resultado = resultado.filter(ev => ev["Centro Juvenil"] === centroActual);
  }
  
  return resultado;
}

function generarFiltros(evts) {
  const container = document.getElementById('filtros');
  if (!container) {
    console.warn('⚠️ #filtros no encontrado');
    return;
  }
  container.innerHTML = '';
  
  const btnTodas = document.createElement('button');
  btnTodas.className = 'filtro-btn active';
  btnTodas.setAttribute('data-categoria', 'todas');
  btnTodas.innerHTML = `📌 Todas (${evts.length})`;
  btnTodas.onclick = () => filtrarCategoria('todas');
  container.appendChild(btnTodas);
  
  const grupos = agrupar(evts);
  Object.keys(grupos).sort().forEach(cat => {
    const icono = ICONOS[cat] || ICONOS.default;
    const btn = document.createElement('button');
    btn.className = 'filtro-btn';
    btn.setAttribute('data-categoria', cat);
    btn.innerHTML = `${icono} ${cat} (${grupos[cat].length})`;
    btn.onclick = () => filtrarCategoria(cat);
    container.appendChild(btn);
  });
}

function generarFiltrosCentros(evts) {
  const container = document.getElementById('filtrosCentros');
  if (!container) {
    console.warn('⚠️ #filtrosCentros no encontrado');
    return;
  }
  container.innerHTML = '';
  
  const centrosSet = new Set();
  evts.forEach(ev => {
    const centro = ev["Centro Juvenil"];
    if (centro && centro.trim()) centrosSet.add(centro.trim());
  });
  
  const centros = Array.from(centrosSet).sort();
  
  if (centros.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  
  const btnTodos = document.createElement('button');
  btnTodos.className = 'filtro-centro-btn active';
  btnTodos.setAttribute('data-centro', 'todos');
  btnTodos.innerHTML = `🏢 Todos (${evts.length})`;
  btnTodos.onclick = () => filtrarCentro('todos');
  container.appendChild(btnTodos);
  
  centros.forEach(centro => {
    const count = evts.filter(ev => ev["Centro Juvenil"] === centro).length;
    const btn = document.createElement('button');
    btn.className = 'filtro-centro-btn';
    btn.setAttribute('data-centro', centro);
    btn.innerHTML = `📍 ${centro} (${count})`;
    btn.onclick = () => filtrarCentro(centro);
    container.appendChild(btn);
  });
}

function filtrarCategoria(categoria) {
  categoriaActual = categoria;
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-categoria') === categoria);
  });
  cerrarEventosDia();
  render(eventos);
}

function filtrarCentro(centro) {
  centroActual = centro;
  document.querySelectorAll('.filtro-centro-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-centro') === centro);
  });
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// RENDERIZAR
// ============================================
function render(evts) {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  const eventosFiltrados = filtrarEventos(evts);

  if (!eventosFiltrados || eventosFiltrados.length === 0) {
    if (loading) loading.style.display = 'none';
    if (empty) empty.style.display = 'block';
    const vt = document.getElementById('vistaTarjetas');
    const vc = document.getElementById('vistaCalendario');
    if (vt) vt.innerHTML = '';
    if (vc) vc.innerHTML = '';
    return;
  }

  if (loading) loading.style.display = 'none';
  if (empty) empty.style.display = 'none';
  
  if (vistaActual === 'tarjetas') {
    renderTarjetas(eventosFiltrados);
  } else {
    renderCalendario(evts);
  }
}

function crearCard(ev) {
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const fecha = formatearFechaCorta(ev["Fecha inicio"]);
  const centro = ev["Centro Juvenil"] || 'Sin centro';
  const estado = calcularEstado(ev) || '';
  const imgUrl = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel);
  const img = imgUrl || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';

  let badgeHtml = '';
  if (estado === 'Desarrollo') badgeHtml = '<span class="badge badge-desarrollo">En curso</span>';
  else if (estado === 'Finalizado') badgeHtml = '<span class="badge badge-finalizado">Finalizado</span>';
  else if (estado === 'Programado') badgeHtml = '<span class="badge badge-programado">Próximo</span>';

  const card = document.createElement('div');
  card.className = 'evento-card';
  
  card.innerHTML = `
    <img class="evento-img" src="${img}" alt="${nombre}" onerror="this.src='https://placehold.co/600x400/032845/ffffff?text=COAJ'">
    <div class="evento-content">
      <div class="evento-nombre">${nombre}</div>
      <div class="evento-info">
        ${badgeHtml}
        <div class="info-item">
          <div class="info-icon">📅</div>
          <div class="info-text">${fecha}</div>
        </div>
        <div class="info-item">
          <div class="info-icon">🏢</div>
          <div class="info-text">${centro}</div>
        </div>
      </div>
      <button class="btn-ver-mas">Ver más</button>
    </div>
  `;
  
  card.querySelector('.btn-ver-mas').onclick = () => abrirModal(ev);
  
  return card;
}

function renderTarjetas(evts) {
  const container = document.getElementById('vistaTarjetas');
  if (!container) return;
  container.innerHTML = '';
  
  const grupos = agrupar(evts);
  
  if (categoriaActual !== 'todas') {
    const items = grupos[categoriaActual] || [];
    if (items.length === 0) return;
    
    const grid = document.createElement('div');
    grid.className = 'eventos-grid';
    items.forEach(item => grid.appendChild(crearCard(item)));
    container.appendChild(grid);
  } else {
    Object.keys(grupos).sort().forEach(cat => {
      const items = grupos[cat];
      const icono = ICONOS[cat] || ICONOS.default;

      const banner = document.createElement('div');
      banner.className = 'category-banner';
      banner.innerHTML = `
        <div class="category-content">
          <div class="category-info">
            <div class="category-icon">${icono}</div>
            <div class="category-title">${cat}</div>
          </div>
          <div class="category-count">${items.length}</div>
        </div>`;
      container.appendChild(banner);

      const grid = document.createElement('div');
      grid.className = 'eventos-grid';
      items.forEach(item => grid.appendChild(crearCard(item)));
      container.appendChild(grid);
    });
  }
}

// ============================================
// CALENDARIO
// ============================================
function renderCalendario(evts) {
  const container = document.getElementById('vistaCalendario');
  if (!container) return;
  container.innerHTML = generarCalendario(evts);
}

function generarCalendario(evts) {
  const evsFiltrados = filtrarEventos(evts);
  const primerDia = new Date(añoActual, mesActual, 1);
  const ultimoDia = new Date(añoActual, mesActual + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;
  const hoy = new Date();
  
  let html = `
    <div class="calendario-container">
      <div class="calendario-header">
        <div class="calendario-nav">
          <button class="btn-nav" onclick="cambiarMes(-1)">←</button>
          <div class="mes-actual">${mesesNombres[mesActual]} ${añoActual}</div>
          <button class="btn-nav" onclick="cambiarMes(1)">→</button>
        </div>
        <button class="btn-hoy" onclick="irHoy()">Hoy</button>
      </div>
      <div class="calendario-grid">
  `;
  
  diasSemana.forEach(d => html += `<div class="dia-semana">${d}</div>`);
  
  for (let i = 0; i < primerDiaSemana; i++) {
    const diaAnterior = new Date(añoActual, mesActual, -(primerDiaSemana - i - 1));
    html += `<div class="dia-celda otro-mes"><div class="dia-numero">${diaAnterior.getDate()}</div></div>`;
  }
  
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const eventosDia = evsFiltrados.filter(ev => {
      const fechaInicio = parsearFecha(ev["Fecha inicio"]);
      const fechaFin = parsearFecha(ev["Fecha finalización"]);
      if (!fechaInicio) return false;
      
      const fechaDia = new Date(añoActual, mesActual, dia);
      fechaDia.setHours(0,0,0,0);
      
      const inicio = new Date(fechaInicio);
      inicio.setHours(0,0,0,0);
      
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(0,0,0,0);
        return fechaDia >= inicio && fechaDia <= fin;
      }
      return fechaDia.getTime() === inicio.getTime();
    });
    
    let clases = 'dia-celda';
    if (hoy.getDate() === dia && hoy.getMonth() === mesActual && hoy.getFullYear() === añoActual) clases += ' hoy';
    if (eventosDia.length > 0) clases += ' con-eventos';
    
    html += `
      <div class="${clases}" onclick="verEventosDia(${dia})">
        <div class="dia-numero">${dia}</div>
        ${eventosDia.length > 0 ? `<div class="dia-contador">${eventosDia.length}</div>` : ''}
      </div>
    `;
  }
  
  const diasRestantes = (7 - ((primerDiaSemana + diasEnMes) % 7)) % 7;
  for (let i = 1; i <= diasRestantes; i++) {
    html += `<div class="dia-celda otro-mes"><div class="dia-numero">${i}</div></div>`;
  }
  
  html += '</div></div>';
  return html;
}

function verEventosDia(dia) {
  diaSeleccionado = dia;
  const evsFiltrados = filtrarEventos(eventos);
  
  const eventosDia = evsFiltrados.filter(ev => {
    const fechaInicio = parsearFecha(ev["Fecha inicio"]);
    const fechaFin = parsearFecha(ev["Fecha finalización"]);
    if (!fechaInicio) return false;
    
    const fechaDia = new Date(añoActual, mesActual, dia);
    fechaDia.setHours(0,0,0,0);
    
    const inicio = new Date(fechaInicio);
    inicio.setHours(0,0,0,0);
    
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(0,0,0,0);
      return fechaDia >= inicio && fechaDia <= fin;
    }
    return fechaDia.getTime() === inicio.getTime();
  });
  
  if (eventosDia.length === 0) return;
  
  const container = document.getElementById('vistaCalendario');
  const existente = document.getElementById('eventosDia');
  if (existente) existente.remove();
  
  const fecha = new Date(añoActual, mesActual, dia);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const div = document.createElement('div');
  div.className = 'eventos-dia-container';
  div.id = 'eventosDia';
  div.innerHTML = `
    <div class="eventos-dia-header">
      <div class="eventos-dia-titulo">📅 ${fechaFormateada} (${eventosDia.length})</div>
      <button class="btn-cerrar-dia" onclick="cerrarEventosDia()">✕</button>
    </div>
    <div class="eventos-dia-body">
      <div class="eventos-grid" id="gridEventosDia"></div>
    </div>
  `;
  
  container.appendChild(div);
  
  const grid = document.getElementById('gridEventosDia');
  eventosDia.forEach(ev => grid.appendChild(crearCard(ev)));
  
  div.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarEventosDia() {
  const div = document.getElementById('eventosDia');
  if (div) div.remove();
  diaSeleccionado = null;
}

function cambiarMes(direccion) {
  mesActual += direccion;
  if (mesActual < 0) { mesActual = 11; añoActual--; }
  else if (mesActual > 11) { mesActual = 0; añoActual++; }
  cerrarEventosDia();
  render(eventos);
}

function irHoy() {
  const hoy = new Date();
  mesActual = hoy.getMonth();
  añoActual = hoy.getFullYear();
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// CAMBIAR VISTA
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  
  document.querySelectorAll('.view-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (vista === 'tarjetas' && i === 0) || (vista === 'calendario' && i === 1));
  });
  
  const vt = document.getElementById('vistaTarjetas');
  const vc = document.getElementById('vistaCalendario');
  
  if (vista === 'tarjetas') {
    if (vt) vt.style.display = 'block';
    if (vc) vc.style.display = 'none';
  } else {
    if (vt) vt.style.display = 'none';
    if (vc) vc.style.display = 'block';
  }
  
  render(eventos);
}

// ============================================
// MODAL
// ============================================
function abrirModal(ev) {
  const modal = document.getElementById('modal');
  if (!modal) {
    console.warn('⚠️ #modal no encontrado');
    return;
  }
  
  const nombre = ev.Evento || ev["ID Eventos"] || 'Sin nombre';
  const desc = ev.Descripción || ev.Descripcion || 'Sin descripción.';
  const imgUrl = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel);
  const img = imgUrl || 'https://placehold.co/600x400/032845/ffffff?text=COAJ';

  const modalImg = document.getElementById('modalImg');
  const modalTitulo = document.getElementById('modalTitulo');
  const modalDescripcion = document.getElementById('modalDescripcion');
  const badges = document.getElementById('modalBadges');
  const info = document.getElementById('modalInfo');
  
  if (modalImg) modalImg.src = img;
  if (modalTitulo) modalTitulo.textContent = nombre;
  if (modalDescripcion) modalDescripcion.textContent = desc;

  if (badges) {
    badges.innerHTML = '';
    const estado = calcularEstado(ev);
    if (estado === 'Desarrollo') badges.innerHTML += '<span class="modal-badge badge-desarrollo">En curso</span>';
    else if (estado === 'Finalizado') badges.innerHTML += '<span class="modal-badge badge-finalizado">Finalizado</span>';
    else if (estado === 'Programado') badges.innerHTML += '<span class="modal-badge badge-programado">Próximo</span>';
    
    const cat = ev.Categoría || ev.Categoria;
    if (cat) badges.innerHTML += `<span class="modal-badge" style="background:#e8552a;color:white;">${cat}</span>`;
  }

  if (info) {
    info.innerHTML = `
      <div class="modal-info-card"><small>📅 Del</small><strong>${formatearFecha(ev["Fecha inicio"])}</strong></div>
      <div class="modal-info-card"><small>⏰ Al</small><strong>${formatearFecha(ev["Fecha finalización"])}</strong></div>
      <div class="modal-info-card"><small>🏢 Centro</small><strong>${ev["Centro Juvenil"] || 'N/A'}</strong></div>
      <div class="modal-info-card"><small>📚 Programa</small><strong>${ev.Programa || 'N/A'}</strong></div>
      <div class="modal-info-card"><small>👥 Plazas</small><strong>${ev.Plazas || 'N/A'}</strong></div>
    `;
  }

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function cerrarModal(e) {
  if (!e || e.target.id === 'modal') {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// ============================================
// TOAST
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.log(`Toast [${tipo}]: ${mensaje}`);
    return;
  }
  
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  if (msg) msg.textContent = mensaje;
  if (icon) icon.textContent = tipo === 'success' ? '✓' : '✕';
  
  toast.className = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// FECHA HEADER
// ============================================
function actualizarFecha() {
  const el = document.getElementById('fecha');
  if (el) {
    el.textContent = new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Iniciando Eventos COAJ...');
  console.log('📡 API_BASE:', API_BASE);
  
  actualizarFecha();
  cargarEventos();
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal();
  });
});
