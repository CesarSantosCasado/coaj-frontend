/**
 * ========================================
 * 🎯 COAJ MADRID - EVENTOS
 * ========================================
 * Frontend con fetch al backend Heroku + Cache
 * Misma arquitectura que actividades.js
 */

// ============================================
// 📌 Verificar config.js
// ============================================
if (typeof COAJ_CONFIG === 'undefined') {
  console.error('❌ COAJ_CONFIG no está definido. Asegúrate de cargar config.js primero.');
}

// ============================================
// 📌 Configuración desde config.js
// ============================================
const API_BASE = COAJ_CONFIG.api.base;
const CACHE_KEY = COAJ_CONFIG.cache.eventosKey;
const CACHE_TTL = COAJ_CONFIG.cache.ttl;
const ICONOS = COAJ_CONFIG.eventos.icons;

// ============================================
// 📌 Estado Global
// ============================================
let eventos = [];
let vistaActual = 'tarjetas';
let categoriaActual = 'todas';
let centroActual = 'todos';
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();
let diaSeleccionado = null;

const mesesNombres = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ============================================
// 🌐 CARGAR EVENTOS (con Cache)
// ============================================
async function cargarEventos(forceRefresh = false) {
  console.log('📅 cargarEventos() - forceRefresh:', forceRefresh);
  
  // 1. Verificar cache (si no es refresh forzado)
  if (!forceRefresh) {
    const cached = CoajCache.get(CACHE_KEY, CACHE_TTL);
    if (cached) {
      console.log('📦 Usando eventos desde cache');
      eventos = cached;
      generarFiltros(eventos);
      generarFiltrosCentros(eventos);
      render(eventos);
      actualizarFecha();
      return;
    }
  }
  
  // 2. Mostrar loading
  document.getElementById('loading').style.display = 'block';
  document.getElementById('vistaTarjetas').innerHTML = '';
  document.getElementById('vistaCalendario').innerHTML = '';
  
  try {
    console.log('🌐 Cargando eventos desde API...');
    const response = await fetch(`${API_BASE}/eventos`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.eventos && Array.isArray(data.eventos)) {
      // Filtrar finalizados hace más de 5 días
      eventos = filtrarEventosFinalizados(data.eventos);
      // Ordenar por fecha
      eventos = ordenarEventosPorFecha(eventos);
      
      console.log(`✅ Eventos cargados: ${eventos.length}`);
      
      // 3. Guardar en cache
      CoajCache.set(CACHE_KEY, eventos);
      
      // 4. Renderizar
      generarFiltros(eventos);
      generarFiltrosCentros(eventos);
      render(eventos);
      actualizarFecha();
    } else {
      console.warn('⚠️ Respuesta sin eventos');
      eventos = [];
      render(eventos);
    }
    
  } catch (error) {
    console.error('❌ Error cargando eventos:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('empty').style.display = 'block';
    mostrarToast('Error al cargar eventos', 'error');
  }
}

// ============================================
// 🔄 Refrescar eventos (forzar)
// ============================================
function refrescarEventos() {
  console.log('🔄 Refrescando eventos...');
  CoajCache.remove(CACHE_KEY);
  categoriaActual = 'todas';
  centroActual = 'todos';
  cargarEventos(true);
  mostrarToast('Actualizando eventos...', 'success');
}

// ============================================
// 🗑️ Filtrar eventos finalizados (>5 días)
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

// ============================================
// 📅 Ordenar por fecha
// ============================================
function ordenarEventosPorFecha(evts) {
  return evts.sort((a, b) => {
    const fechaA = parsearFecha(a["Fecha inicio"]);
    const fechaB = parsearFecha(b["Fecha inicio"]);
    return fechaB - fechaA;
  });
}

// ============================================
// 🔄 Parsear fecha AppSheet (MM/DD/YYYY)
// ============================================
function parsearFecha(fechaStr) {
  if (!fechaStr) return null;
  
  try {
    if (typeof fechaStr === 'string' && fechaStr.includes("/")) {
      const fecha = fechaStr.split(" ")[0].split("/");
      const mes = parseInt(fecha[0]) - 1;
      const dia = parseInt(fecha[1]);
      const año = parseInt(fecha[2]);
      return new Date(año, mes, dia);
    }
    
    const fechaObj = new Date(fechaStr);
    return !isNaN(fechaObj.getTime()) ? fechaObj : null;
  } catch (e) {
    return null;
  }
}

// ============================================
// 📅 Formatear fecha completa
// ============================================
function formatearFecha(str) {
  if (!str) return "Por confirmar";
  
  try {
    if (str.indexOf("/") > -1) {
      const partes = str.split(" ");
      const fecha = partes[0].split("/");
      const mes = parseInt(fecha[0]) - 1;
      const dia = parseInt(fecha[1]);
      const anio = parseInt(fecha[2]);
      const fechaObj = new Date(anio, mes, dia);
      let resultado = fechaObj.toLocaleDateString("es-ES", { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      
      if (partes[1]) {
        const hora = partes[1].split(":");
        resultado += " • " + hora[0] + ":" + hora[1];
      }
      
      return resultado;
    }
    return str;
  } catch (e) {
    return str;
  }
}

// ============================================
// 📅 Formatear fecha corta
// ============================================
function formatearFechaCorta(str) {
  if (!str) return "Por confirmar";
  
  try {
    if (str.indexOf("/") > -1) {
      const fecha = str.split(" ")[0].split("/");
      const mes = parseInt(fecha[0]) - 1;
      const dia = parseInt(fecha[1]);
      const fechaObj = new Date(2024, mes, dia);
      return fechaObj.toLocaleDateString("es-ES", { day: 'numeric', month: 'short' });
    }
    return str;
  } catch (e) {
    return str;
  }
}

// ============================================
// 🔄 Calcular estado automático
// ============================================
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

// ============================================
// 🖼️ Extraer URL de imagen
// ============================================
function extraerImg(url) {
  if (!url) return null;
  
  if (url.includes('gettablefileurl')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const fileName = params.get('fileName');
    if (!fileName || fileName.trim() === '') return null;
  }
  
  return url;
}

// ============================================
// 📂 Agrupar por categoría
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

// ============================================
// 🔍 Filtrar eventos
// ============================================
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

// ============================================
// 🏷️ Generar filtros de categoría
// ============================================
function generarFiltros(evts) {
  const container = document.getElementById('filtros');
  container.innerHTML = '';
  
  // Botón "Todas"
  const btnTodas = document.createElement('button');
  btnTodas.className = 'filtro-btn active';
  btnTodas.setAttribute('data-categoria', 'todas');
  btnTodas.innerHTML = '📌 Todas (' + evts.length + ')';
  btnTodas.onclick = () => filtrarCategoria('todas');
  container.appendChild(btnTodas);
  
  // Botones por categoría
  const grupos = agrupar(evts);
  Object.keys(grupos).sort().forEach(cat => {
    const icono = ICONOS[cat] || ICONOS.default;
    const count = grupos[cat].length;
    
    const btn = document.createElement('button');
    btn.className = 'filtro-btn';
    btn.setAttribute('data-categoria', cat);
    btn.innerHTML = `${icono} ${cat} (${count})`;
    btn.onclick = () => filtrarCategoria(cat);
    container.appendChild(btn);
  });
}

// ============================================
// 🏢 Generar filtros de centros
// ============================================
function generarFiltrosCentros(evts) {
  const container = document.getElementById('filtrosCentros');
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
  
  // Botón "Todos"
  const btnTodos = document.createElement('button');
  btnTodos.className = 'filtro-centro-btn active';
  btnTodos.setAttribute('data-centro', 'todos');
  btnTodos.innerHTML = '🏢 Todos los Centros (' + evts.length + ')';
  btnTodos.onclick = () => filtrarCentro('todos');
  container.appendChild(btnTodos);
  
  // Botones por centro
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

// ============================================
// 🎴 Crear tarjeta de evento
// ============================================
function crearCard(ev) {
  const nombre = ev.Evento || ev["ID Eventos"] || "Sin nombre";
  const fecha = formatearFechaCorta(ev["Fecha inicio"]);
  const centro = ev["Centro Juvenil"] || "Sin centro";
  const estado = calcularEstado(ev) || "";
  const imgUrl = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel);
  const img = imgUrl || "https://placehold.co/600x400/032845/ffffff?text=COAJ";

  let badgeHtml = '';
  if (estado === 'Desarrollo') {
    badgeHtml = '<span class="badge badge-desarrollo">En curso</span>';
  } else if (estado === 'Finalizado') {
    badgeHtml = '<span class="badge badge-finalizado">Finalizado</span>';
  } else if (estado === 'Programado') {
    badgeHtml = '<span class="badge badge-programado">Próximo</span>';
  }

  const card = document.createElement('div');
  card.className = 'evento-card';
  
  const imgElement = document.createElement('img');
  imgElement.className = 'evento-img';
  imgElement.src = img;
  imgElement.alt = nombre;
  imgElement.onerror = function() {
    this.src = 'https://placehold.co/600x400/032845/ffffff?text=COAJ';
  };

  const content = document.createElement('div');
  content.className = 'evento-content';

  const nombreDiv = document.createElement('div');
  nombreDiv.className = 'evento-nombre';
  nombreDiv.textContent = nombre;

  const infoDiv = document.createElement('div');
  infoDiv.className = 'evento-info';
  infoDiv.innerHTML = badgeHtml +
    `<div class="info-item">
      <div class="info-icon">📅</div>
      <div class="info-text">${fecha}</div>
    </div>
    <div class="info-item">
      <div class="info-icon">🏢</div>
      <div class="info-text">${centro}</div>
    </div>`;

  const btn = document.createElement('button');
  btn.className = 'btn-ver-mas';
  btn.textContent = 'Ver más';
  btn.onclick = () => abrirModal(ev);

  content.appendChild(nombreDiv);
  content.appendChild(infoDiv);
  content.appendChild(btn);
  card.appendChild(imgElement);
  card.appendChild(content);

  return card;
}

// ============================================
// 🎨 RENDERIZAR
// ============================================
function render(evts) {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  const eventosFiltrados = filtrarEventos(evts);

  if (!eventosFiltrados || eventosFiltrados.length === 0) {
    loading.style.display = 'none';
    empty.style.display = 'block';
    document.getElementById('vistaTarjetas').innerHTML = '';
    document.getElementById('vistaCalendario').innerHTML = '';
    return;
  }

  loading.style.display = 'none';
  empty.style.display = 'none';
  
  if (vistaActual === 'tarjetas') {
    renderTarjetas(eventosFiltrados);
  } else {
    renderCalendario(evts);
  }
}

// ============================================
// 🎴 Renderizar vista tarjetas
// ============================================
function renderTarjetas(evts) {
  const container = document.getElementById('vistaTarjetas');
  container.innerHTML = '';
  
  const grupos = agrupar(evts);
  const categorias = Object.keys(grupos).sort();
  
  if (categoriaActual !== 'todas') {
    const items = grupos[categoriaActual] || [];
    if (items.length === 0) return;
    
    const grid = document.createElement('div');
    grid.className = 'eventos-grid';
    items.forEach(item => grid.appendChild(crearCard(item)));
    container.appendChild(grid);
  } else {
    categorias.forEach(cat => {
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
// 📅 Renderizar calendario
// ============================================
function renderCalendario(evts) {
  const container = document.getElementById('vistaCalendario');
  container.innerHTML = generarCalendario(evts);
}

// ============================================
// 📅 Generar calendario HTML
// ============================================
function generarCalendario(evts) {
  const evsFiltrados = filtrarEventos(evts);
  
  const primerDia = new Date(añoActual, mesActual, 1);
  const ultimoDia = new Date(añoActual, mesActual + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;
  
  let html = '<div class="calendario-container">';
  
  // Header
  html += `
    <div class="calendario-header">
      <div class="calendario-nav">
        <button class="btn-nav" onclick="cambiarMes(-1)">←</button>
        <div class="mes-actual">${mesesNombres[mesActual]} ${añoActual}</div>
        <button class="btn-nav" onclick="cambiarMes(1)">→</button>
      </div>
      <button class="btn-hoy" onclick="irHoy()">Hoy</button>
    </div>`;
  
  // Grid
  html += '<div class="calendario-grid">';
  
  // Días de la semana
  diasSemana.forEach(d => {
    html += `<div class="dia-semana">${d}</div>`;
  });
  
  // Días vacíos antes
  for (let i = 0; i < primerDiaSemana; i++) {
    const diaAnterior = new Date(añoActual, mesActual, -(primerDiaSemana - i - 1));
    html += `<div class="dia-celda otro-mes"><div class="dia-numero">${diaAnterior.getDate()}</div></div>`;
  }
  
  // Días del mes
  const hoy = new Date();
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const eventosDia = evsFiltrados.filter(ev => {
      if (!ev["Fecha inicio"]) return false;
      
      const fechaInicio = parsearFecha(ev["Fecha inicio"]);
      const fechaFin = parsearFecha(ev["Fecha finalización"]);
      if (!fechaInicio) return false;
      
      const fechaDia = new Date(añoActual, mesActual, dia);
      
      if (fechaFin) {
        return fechaDia >= fechaInicio && fechaDia <= fechaFin;
      }
      return fechaDia.getTime() === fechaInicio.getTime();
    });
    
    let clases = 'dia-celda';
    if (hoy.getDate() === dia && hoy.getMonth() === mesActual && hoy.getFullYear() === añoActual) {
      clases += ' hoy';
    }
    if (eventosDia.length > 0) {
      clases += ' con-eventos';
    }
    
    html += `<div class="${clases}" onclick="verEventosDia(${dia})">
      <div class="dia-numero">${dia}</div>
      ${eventosDia.length > 0 ? `<div class="dia-contador">${eventosDia.length} ev.</div>` : ''}
    </div>`;
  }
  
  // Días vacíos después
  const diasRestantes = (7 - ((primerDiaSemana + diasEnMes) % 7)) % 7;
  for (let i = 1; i <= diasRestantes; i++) {
    html += `<div class="dia-celda otro-mes"><div class="dia-numero">${i}</div></div>`;
  }
  
  html += '</div></div>';
  
  return html;
}

// ============================================
// 📅 Ver eventos del día
// ============================================
function verEventosDia(dia) {
  diaSeleccionado = dia;
  
  const evsFiltrados = filtrarEventos(eventos);
  const eventosDia = evsFiltrados.filter(ev => {
    if (!ev["Fecha inicio"]) return false;
    
    const fechaInicio = parsearFecha(ev["Fecha inicio"]);
    const fechaFin = parsearFecha(ev["Fecha finalización"]);
    if (!fechaInicio) return false;
    
    const fechaDia = new Date(añoActual, mesActual, dia);
    
    if (fechaFin) {
      return fechaDia >= fechaInicio && fechaDia <= fechaFin;
    }
    return fechaDia.getTime() === fechaInicio.getTime();
  });
  
  if (eventosDia.length === 0) return;
  
  const container = document.getElementById('vistaCalendario');
  
  const existente = document.getElementById('eventosDia');
  if (existente) existente.remove();
  
  const fecha = new Date(añoActual, mesActual, dia);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  const textoEventos = eventosDia.length === 1 ? '1 evento' : `${eventosDia.length} eventos`;
  
  const html = `
    <div class="eventos-dia-container" id="eventosDia">
      <div class="eventos-dia-header">
        <div class="eventos-dia-titulo">📅 ${fechaFormateada} (${textoEventos})</div>
        <button class="btn-cerrar-dia" onclick="cerrarEventosDia()">✕</button>
      </div>
      <div class="eventos-dia-body">
        <div class="eventos-grid" id="gridEventosDia"></div>
      </div>
    </div>`;
  
  container.insertAdjacentHTML('beforeend', html);
  
  const grid = document.getElementById('gridEventosDia');
  eventosDia.forEach(ev => grid.appendChild(crearCard(ev)));
  
  document.getElementById('eventosDia').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// 📅 Cerrar eventos del día
// ============================================
function cerrarEventosDia() {
  const div = document.getElementById('eventosDia');
  if (div) div.remove();
  diaSeleccionado = null;
}

// ============================================
// 📅 Cambiar mes
// ============================================
function cambiarMes(direccion) {
  mesActual += direccion;
  
  if (mesActual < 0) {
    mesActual = 11;
    añoActual--;
  } else if (mesActual > 11) {
    mesActual = 0;
    añoActual++;
  }
  
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// 📅 Ir a hoy
// ============================================
function irHoy() {
  const hoy = new Date();
  mesActual = hoy.getMonth();
  añoActual = hoy.getFullYear();
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// 🔀 Cambiar vista
// ============================================
function cambiarVista(vista) {
  vistaActual = vista;
  
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  
  if (vista === 'tarjetas') {
    document.querySelectorAll('.view-btn')[0].classList.add('active');
    document.getElementById('vistaTarjetas').style.display = 'block';
    document.getElementById('vistaCalendario').style.display = 'none';
  } else {
    document.querySelectorAll('.view-btn')[1].classList.add('active');
    document.getElementById('vistaTarjetas').style.display = 'none';
    document.getElementById('vistaCalendario').style.display = 'block';
  }
  
  render(eventos);
}

// ============================================
// 🏷️ Filtrar por categoría
// ============================================
function filtrarCategoria(categoria) {
  categoriaActual = categoria;
  
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-categoria') === categoria) {
      btn.classList.add('active');
    }
  });
  
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// 🏢 Filtrar por centro
// ============================================
function filtrarCentro(centro) {
  centroActual = centro;
  
  document.querySelectorAll('.filtro-centro-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-centro') === centro) {
      btn.classList.add('active');
    }
  });
  
  cerrarEventosDia();
  render(eventos);
}

// ============================================
// 🔲 Abrir modal
// ============================================
function abrirModal(ev) {
  const modal = document.getElementById('modal');
  const nombre = ev.Evento || ev["ID Eventos"] || "Sin nombre";
  const desc = ev.Descripción || ev.Descripcion || "Sin descripción disponible.";
  const imgUrl = extraerImg(ev["Imagen URL"]) || extraerImg(ev.Cartel);
  const img = imgUrl || "https://placehold.co/600x400/032845/ffffff?text=COAJ";

  document.getElementById('modalImg').src = img;
  document.getElementById('modalTitulo').textContent = nombre;
  document.getElementById('modalDescripcion').textContent = desc;

  const badges = document.getElementById('modalBadges');
  badges.innerHTML = '';

  const estado = calcularEstado(ev) || '';
  if (estado === 'Desarrollo') {
    badges.innerHTML += '<span class="modal-badge badge-desarrollo">En curso</span>';
  } else if (estado === 'Finalizado') {
    badges.innerHTML += '<span class="modal-badge badge-finalizado">Finalizado</span>';
  } else if (estado === 'Programado') {
    badges.innerHTML += '<span class="modal-badge badge-programado">Próximo</span>';
  }

  const cat = ev.Categoría || ev.Categoria;
  if (cat) {
    badges.innerHTML += `<span class="modal-badge" style="background: #e8552a; color: white;">${cat}</span>`;
  }

  const info = document.getElementById('modalInfo');
  info.innerHTML = `
    <div class="modal-info-card">
      <small>📅 Del</small>
      <strong>${formatearFecha(ev["Fecha inicio"])}</strong>
    </div>
    <div class="modal-info-card">
      <small>⏰ Al</small>
      <strong>${formatearFecha(ev["Fecha finalización"])}</strong>
    </div>
    <div class="modal-info-card">
      <small>🏢 Centro</small>
      <strong>${ev["Centro Juvenil"] || 'N/A'}</strong>
    </div>
    <div class="modal-info-card">
      <small>📚 Programa</small>
      <strong>${ev.Programa || 'N/A'}</strong>
    </div>
    <div class="modal-info-card">
      <small>👥 Plazas</small>
      <strong>${ev.Plazas || 'N/A'}</strong>
    </div>`;

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

// ============================================
// ❌ Cerrar modal
// ============================================
function cerrarModal(e) {
  if (!e || e.target.id === 'modal') {
    document.getElementById('modal').classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// ============================================
// 🔔 Toast
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  msg.textContent = mensaje;
  icon.textContent = tipo === 'success' ? '✓' : '✕';
  toast.className = `toast ${tipo} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// 📅 Actualizar fecha header
// ============================================
function actualizarFecha() {
  const f = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('fecha').textContent = f;
}

// ============================================
// 🚀 Inicializar
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Inicializando Eventos COAJ...');
  actualizarFecha();
  cargarEventos();
  
  // ESC para cerrar modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal();
  });
});
