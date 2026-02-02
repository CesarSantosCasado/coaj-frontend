/**
 * COAJ Madrid - Espacios y Reservas
 * Listo para conectar a backend (reemplazar MOCK_DATA por API)
 */

// ============================================
// VERIFICAR DEPENDENCIAS
// ============================================
if (typeof COAJ_CONFIG === 'undefined') {
  console.error('❌ config.js debe cargarse antes de espacios.js');
}

// ============================================
// CONSTANTES
// ============================================
const API_BASE = COAJ_CONFIG?.api?.base || 'https://coajmadrid-8273afef0255.herokuapp.com/api';
const CACHE_KEY_ESP = 'coaj_espacios_cache';
const CACHE_TTL = 5 * 60 * 1000;

// ============================================
// DATOS MOCK (reemplazar por API después)
// ============================================
const MOCK_SALAS = [
  {id:1,nombre:'Oficina de Información Juvenil',tipo:'Otros',coaj:'COAJ Carabanchel Alto'},
  {id:2,nombre:'Psicología y coaching',tipo:'Otros',coaj:'COAJ Carabanchel Alto'},
  {id:3,nombre:'Otros',tipo:'Otros',coaj:'COAJ Carabanchel Alto'},
  {id:4,nombre:'Sala 3',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Chamberí'},
  {id:5,nombre:'Sala 4',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Chamberí'},
  {id:6,nombre:'Oficina de Información Juvenil',tipo:'Otros',coaj:'COAJ Chamberí'},
  {id:7,nombre:'Psicología y coaching',tipo:'Otros',coaj:'COAJ Chamberí'},
  {id:8,nombre:'Sala de dinamización',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Chamberí'},
  {id:9,nombre:'Hall',tipo:'Otros',coaj:'COAJ Chamberí'},
  {id:10,nombre:'Dinamización',tipo:'Ocio y Tiempo Libre',coaj:'COAJ El Aleph'},
  {id:11,nombre:'Coworking',tipo:'Estudio y formación',coaj:'COAJ El Aleph'},
  {id:12,nombre:'Sala de espejos',tipo:'Música y desarrollo',coaj:'COAJ El Aleph'},
  {id:13,nombre:'Cyber',tipo:'Ocio y Tiempo Libre',coaj:'COAJ El Aleph'},
  {id:14,nombre:'Sala de espejos',tipo:'Ocio y Tiempo Libre',coaj:'COAJ El Pardo'},
  {id:15,nombre:'Sala de ordenadores',tipo:'Estudio y formación',coaj:'COAJ El Pardo'},
  {id:16,nombre:'Despacho',tipo:'Otros',coaj:'COAJ El Pardo'},
  {id:17,nombre:'Sala de juegos',tipo:'Ocio y Tiempo Libre',coaj:'COAJ El Pardo'},
  {id:18,nombre:'Oficina de Información Juvenil',tipo:'Otros',coaj:'COAJ El Sitio de mi Recreo'},
  {id:19,nombre:'Psicología y coaching',tipo:'Otros',coaj:'COAJ El Sitio de mi Recreo'},
  {id:20,nombre:'Dinamización 1',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Hontalbilla'},
  {id:21,nombre:'Dinamización 2',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Hontalbilla'},
  {id:22,nombre:'Oficina de Información Juvenil',tipo:'Otros',coaj:'COAJ Hontalbilla'},
  {id:23,nombre:'Psicología y coaching',tipo:'Otros',coaj:'COAJ Hontalbilla'},
  {id:24,nombre:'Sala de espejos',tipo:'Música y desarrollo',coaj:'COAJ Hontalbilla'},
  {id:25,nombre:'Música',tipo:'Música y desarrollo',coaj:'COAJ Hontalbilla'},
  {id:26,nombre:'Office',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Hontalbilla'},
  {id:27,nombre:'Taller',tipo:'Otros',coaj:'COAJ Hontalbilla'},
  {id:28,nombre:'Área de estudio',tipo:'Estudio y formación',coaj:'COAJ Hontalbilla'},
  {id:29,nombre:'Sala de juegos',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Ouka Leele'},
  {id:30,nombre:'Sala de estudios',tipo:'Estudio y formación',coaj:'COAJ Ouka Leele'},
  {id:31,nombre:'Sala de reuniones',tipo:'Estudio y formación',coaj:'COAJ Ouka Leele'},
  {id:32,nombre:'Intercambiador cultural',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Ouka Leele'},
  {id:33,nombre:'Sala técnica',tipo:'Estudio y formación',coaj:'COAJ Ouka Leele'},
  {id:34,nombre:'Espacio de arte',tipo:'Música y desarrollo',coaj:'COAJ Ouka Leele'},
  {id:35,nombre:'Sala de ensayo',tipo:'Música y desarrollo',coaj:'COAJ Ouka Leele'},
  {id:36,nombre:'Exposiciones',tipo:'Otros',coaj:'COAJ Ouka Leele'},
  {id:37,nombre:'Terraza',tipo:'Otros',coaj:'COAJ Ouka Leele'},
  {id:38,nombre:'Visitas',tipo:'Otros',coaj:'COAJ Ouka Leele'},
  {id:39,nombre:'Despachos',tipo:'Otros',coaj:'COAJ Ouka Leele'},
  {id:40,nombre:'Oficina de Información Juvenil',tipo:'Otros',coaj:'COAJ Ouka Leele'},
  {id:41,nombre:'Psicología y coaching',tipo:'Otros',coaj:'COAJ Ouka Leele'},
  {id:42,nombre:'Recreativos',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:43,nombre:'Usos múltiples',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:44,nombre:'Juegos de Mesa',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:45,nombre:'Cantina',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:46,nombre:'Sala de Estudio A',tipo:'Estudio y formación',coaj:'COAJ Pipo Velasco'},
  {id:47,nombre:'Sala de Estudio B',tipo:'Estudio y formación',coaj:'COAJ Pipo Velasco'},
  {id:48,nombre:'Local 1',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:49,nombre:'Local 2',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:50,nombre:'Local 3 (diáfano)',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:51,nombre:'Local 4 (Estudio de grabación)',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:52,nombre:'Artes escénicas 1 (Espejos)',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:53,nombre:'Artes escénicas 2',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:54,nombre:'Danza',tipo:'Música y desarrollo',coaj:'COAJ Pipo Velasco'},
  {id:55,nombre:'Cineteca',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:56,nombre:'Oficina de Información Juvenil',tipo:'Otros',coaj:'COAJ Pipo Velasco'},
  {id:57,nombre:'Psicología y coaching',tipo:'Otros',coaj:'COAJ Pipo Velasco'},
  {id:58,nombre:'Terraza',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:59,nombre:'Patio/Huerto',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:60,nombre:'Terraza Exterior',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:61,nombre:'Fuera del centro',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Pipo Velasco'},
  {id:62,nombre:'Pasillo',tipo:'Otros',coaj:'COAJ Pipo Velasco'},
  {id:63,nombre:'Sala de espejos',tipo:'Ocio y Tiempo Libre',coaj:'COAJ Tetuán Punto Joven'},
];

const MOCK_PHOTOS = {
  'Ocio y Tiempo Libre': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&q=80',
    'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=900&q=80',
    'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=900&q=80',
  ],
  'Estudio y formación': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&q=80',
  ],
  'Música y desarrollo': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&q=80',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=80',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&q=80',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=900&q=80',
  ],
  'Otros': [
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=80',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&q=80',
  ],
};

const MOCK_DESC = {
  'Ocio y Tiempo Libre': [
    'Espacio dinámico para actividades recreativas, juegos cooperativos y talleres de ocio juvenil. Mobiliario modular, iluminación ambiental y sistema de sonido integrado.',
    'Zona de encuentro juvenil para torneos, proyecciones, cinefórum y entretenimiento. Consolas de última generación, juegos de mesa y material recreativo.',
    'Sala versátil con recursos lúdicos y tecnológicos. Dinámicas de grupo, talleres creativos y clubs de lectura. WiFi de alta velocidad y pantalla de proyección.',
  ],
  'Estudio y formación': [
    'Espacio silencioso y climatizado con puestos individuales, enchufes en cada mesa y WiFi de alta velocidad. Ideal para oposiciones y trabajo académico.',
    'Sala con iluminación regulable y aislamiento acústico. Zonas individual y grupal con pizarras magnéticas y pantallas colaborativas.',
    'Aula equipada con ordenadores, proyector 4K y material formativo. Cursos de formación profesional y talleres digitales.',
  ],
  'Música y desarrollo': [
    'Aislamiento acústico profesional y espejos de pared completa. Ensayos musicales, danza contemporánea, hip-hop y artes escénicas. Tarima flotante.',
    'Estudio con micrófonos condensador y dinámicos, mesa de mezclas de 16 canales, monitores de referencia y cabina insonorizada.',
    'Tarima elevada, iluminación escénica DMX y sonido envolvente. Ensayos coreográficos, performances, recitales y jam sessions.',
  ],
  'Otros': [
    'Despacho profesional para atención individualizada. Orientación laboral, asesoramiento jurídico, coaching personal y mediación.',
    'Punto de información juvenil. Empleo, educación, becas, vivienda, movilidad internacional y participación ciudadana.',
    'Espacio multiusos adaptable. Reuniones comunitarias, presentaciones, exposiciones temporales y networking.',
  ],
};

const MOCK_FEATURES = {
  'Ocio y Tiempo Libre': [
    {icon:'wifi',label:'WiFi',val:'Gratuito'},{icon:'tv',label:'Proyector',val:'Pantalla HD'},
    {icon:'sports_esports',label:'Consolas',val:'PS5 / Switch'},{icon:'ac_unit',label:'Clima',val:'Aire acond.'},
    {icon:'accessible',label:'Acceso',val:'Adaptado'},{icon:'schedule',label:'Horario',val:'L-V 10-21h'},
  ],
  'Estudio y formación': [
    {icon:'wifi',label:'WiFi',val:'Alta velocidad'},{icon:'power',label:'Enchufes',val:'En cada puesto'},
    {icon:'computer',label:'PCs',val:'Disponibles'},{icon:'ac_unit',label:'Clima',val:'Climatizado'},
    {icon:'volume_off',label:'Ruido',val:'Zona silencio'},{icon:'schedule',label:'Horario',val:'L-S 9-22h'},
  ],
  'Música y desarrollo': [
    {icon:'music_note',label:'Equipo',val:'Profesional'},{icon:'mic',label:'Micros',val:'Shure SM58'},
    {icon:'speaker',label:'Amplif.',val:'Monitor + PA'},{icon:'ac_unit',label:'Clima',val:'Climatizado'},
    {icon:'noise_aware',label:'Acústica',val:'Insonorizada'},{icon:'schedule',label:'Horario',val:'L-V 10-21h'},
  ],
  'Otros': [
    {icon:'wifi',label:'WiFi',val:'Gratuito'},{icon:'ac_unit',label:'Clima',val:'Climatizado'},
    {icon:'accessible',label:'Acceso',val:'Adaptado'},{icon:'schedule',label:'Horario',val:'L-V 10-14h'},
    {icon:'lock',label:'Privacidad',val:'Confidencial'},{icon:'support_agent',label:'Atención',val:'Profesional'},
  ],
};

const CAPACIDADES = {
  'Dinamización':25,'Dinamización 1':25,'Dinamización 2':20,'Sala 3':15,'Sala 4':12,
  'Sala de espejos':15,'Coworking':20,'Cyber':12,'Sala de ordenadores':18,
  'Sala de juegos':20,'Sala de estudios':30,'Sala de reuniones':10,'Sala técnica':8,
  'Espacio de arte':12,'Sala de ensayo':6,'Recreativos':25,'Usos múltiples':40,
  'Juegos de Mesa':16,'Cantina':30,'Sala de Estudio A':35,'Sala de Estudio B':25,
  'Local 1':4,'Local 2':4,'Local 3 (diáfano)':8,'Local 4 (Estudio de grabación)':3,
  'Artes escénicas 1 (Espejos)':20,'Artes escénicas 2':15,'Danza':20,'Cineteca':40,
  'Intercambiador cultural':50,'Terraza':30,'Office':12,'Taller':15,'Área de estudio':25,
  'Música':5,'Hall':20,'Pasillo':10,'Patio/Huerto':15,'Terraza Exterior':25,'Fuera del centro':50,
  'Sala de dinamización':20,'Despacho':3,'Despachos':4,'Exposiciones':40,'Visitas':30,
  'Oficina de Información Juvenil':5,'Psicología y coaching':2,'Otros':10,
};

const PRECIOS = {'Ocio y Tiempo Libre':'Gratuito','Estudio y formación':'Gratuito','Música y desarrollo':'5 €/hora','Otros':'Gratuito'};
const DURACIONES = {'Ocio y Tiempo Libre':'2 horas','Estudio y formación':'4 horas','Música y desarrollo':'1 hora','Otros':'30 min'};
const TIPO_ICONS = {
  'Ocio y Tiempo Libre':{icon:'sports_esports',cls:'ocio'},
  'Estudio y formación':{icon:'menu_book',cls:'estudio'},
  'Música y desarrollo':{icon:'music_note',cls:'musica'},
  'Otros':{icon:'info',cls:'otros'},
};

// ============================================
// ESTADO GLOBAL
// ============================================
let salas = [];
let centrosMap = new Map();
let centroNames = [];
let allTipos = [];
let openCentros = new Set();

let filterTipo = null;
let filterCentro = null;
let searchQ = '';
let activeSala = null;
let currentSlide = 0;
let calDate = new Date();
let selDate = null;
let selSlot = null;

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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
      if (activeSala) volverListado();
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
    mostrarErrorLogin('Error de conexión. Intenta de nuevo.');
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
// CARGAR DATOS
// ============================================
async function cargarDatos(forceRefresh = false) {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('active');

  // TODO: Reemplazar MOCK por API
  // try {
  //   const res = await fetch(`${API_BASE}/espacios`);
  //   const data = await res.json();
  //   salas = data.salas || [];
  // } catch(err) { ... }

  // Usar datos mock por ahora
  await new Promise(r => setTimeout(r, 400)); // Simular carga
  procesarDatos(MOCK_SALAS);
  if (loading) loading.classList.remove('active');
}

function refrescarDatos() {
  console.log('🔄 Refrescando datos...');
  cargarDatos(true);
  mostrarToast('Datos actualizados', 'success');
}
window.refrescarDatos = refrescarDatos;

function procesarDatos(rawSalas) {
  centrosMap = new Map();
  rawSalas.forEach((s) => {
    if (!centrosMap.has(s.coaj)) centrosMap.set(s.coaj, []);
    const ph = MOCK_PHOTOS[s.tipo] || MOCK_PHOTOS['Otros'];
    centrosMap.get(s.coaj).push({
      ...s,
      photos: [ph[s.id % ph.length], ph[(s.id+1) % ph.length], ph[(s.id+2) % ph.length], ph[(s.id+3) % ph.length]],
      desc: (MOCK_DESC[s.tipo] || MOCK_DESC['Otros'])[s.id % 3],
      capacidad: CAPACIDADES[s.nombre] || 10,
      precio: PRECIOS[s.tipo],
      duracion: DURACIONES[s.tipo],
      rating: (4 + Math.random() * 0.9).toFixed(1),
      reviews: Math.floor(Math.random() * 120) + 8,
      features: MOCK_FEATURES[s.tipo] || MOCK_FEATURES['Otros'],
    });
  });

  centroNames = [...centrosMap.keys()];
  allTipos = [...new Set(rawSalas.map(s => s.tipo))];
  salas = rawSalas;

  // Abrir todos por defecto
  centroNames.forEach(c => openCentros.add(c));

  renderStats();
  renderFilters();
  renderListado();
}

// ============================================
// STATS
// ============================================
function renderStats() {
  document.getElementById('statCentros').textContent = centrosMap.size;
  document.getElementById('statSalas').textContent = salas.length;
  document.getElementById('statTipos').textContent = allTipos.length;
  document.getElementById('statDisponibles').textContent = salas.length; // TODO: real availability
}

// ============================================
// FILTROS
// ============================================
function renderFilters() {
  // Chips de tipo
  const chipsEl = document.getElementById('filtersChips');
  const tipoCounts = {};
  allTipos.forEach(t => tipoCounts[t] = salas.filter(s => s.tipo === t).length);

  let h = `<button class="filter-chip ${!filterTipo ? 'active' : ''}" onclick="setFilterTipo(null)">
    <span class="material-symbols-outlined">apps</span> Todos <span class="chip-count">${salas.length}</span>
  </button>`;

  allTipos.forEach(t => {
    const ti = TIPO_ICONS[t] || TIPO_ICONS['Otros'];
    h += `<button class="filter-chip ${filterTipo === t ? 'active' : ''}" onclick="setFilterTipo('${t}')">
      <span class="material-symbols-outlined">${ti.icon}</span> ${t} <span class="chip-count">${tipoCounts[t]}</span>
    </button>`;
  });
  chipsEl.innerHTML = h;

  // Selects
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

  centrosMap.forEach((salasC, centroName) => {
    if (filterCentro && filterCentro !== centroName) return;
    let filtered = salasC;
    if (filterTipo) filtered = filtered.filter(s => s.tipo === filterTipo);
    if (searchQ) filtered = filtered.filter(s =>
      s.nombre.toLowerCase().includes(searchQ) ||
      s.tipo.toLowerCase().includes(searchQ) ||
      s.coaj.toLowerCase().includes(searchQ)
    );
    if (filtered.length === 0) return;
    totalVisible += filtered.length;

    const shortName = centroName.replace('COAJ ', '');
    const initials = shortName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isOpen = openCentros.has(centroName);
    const tiposInCentro = [...new Set(filtered.map(s => s.tipo))];

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
          ${filtered.map(s => {
            const ti = TIPO_ICONS[s.tipo] || TIPO_ICONS['Otros'];
            return `
            <div class="sala-card" onclick="abrirSala(${s.id})">
              <div class="sala-card-icon ${ti.cls}"><span class="material-symbols-outlined">${ti.icon}</span></div>
              <div class="sala-card-info">
                <div class="sala-card-name">${s.nombre}</div>
                <div class="sala-card-details">
                  <span class="sala-tipo-tag ${ti.cls}">${s.tipo}</span>
                  <span class="material-symbols-outlined">group</span> ${s.capacidad}
                  <span class="material-symbols-outlined">schedule</span> ${s.duracion}
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
// ABRIR SALA (DETALLE)
// ============================================
function abrirSala(id) {
  let sala = null;
  centrosMap.forEach(salasC => { const f = salasC.find(s => s.id === id); if (f) sala = f; });
  if (!sala) return;

  activeSala = sala;
  selDate = null; selSlot = null; currentSlide = 0;
  calDate = new Date();

  document.getElementById('vistaListado').style.display = 'none';
  document.querySelector('.filters-section').style.display = 'none';
  document.querySelector('.stats-bar').style.display = 'none';

  const detalle = document.getElementById('vistaDetalle');
  detalle.classList.add('active');
  detalle.innerHTML = buildDetalleHTML(sala);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  renderCalendar();
}

function volverListado() {
  document.getElementById('vistaDetalle').classList.remove('active');
  document.getElementById('vistaDetalle').innerHTML = '';
  document.getElementById('vistaListado').style.display = '';
  document.querySelector('.filters-section').style.display = '';
  document.querySelector('.stats-bar').style.display = '';
  activeSala = null;
}

function buildDetalleHTML(s) {
  const ti = TIPO_ICONS[s.tipo] || TIPO_ICONS['Otros'];
  return `
    <div class="detail-back-bar">
      <button class="btn-back" onclick="volverListado()">
        <span class="material-symbols-outlined">arrow_back</span> Volver
      </button>
      <div class="breadcrumb">
        ${s.coaj} <span class="material-symbols-outlined">chevron_right</span> <strong>${s.nombre}</strong>
      </div>
    </div>

    <div class="gallery" id="gallery">
      <div class="gallery-slides" id="gallerySlides">
        ${s.photos.map(p => `<div class="gallery-slide" style="background-image:url('${p}')"></div>`).join('')}
      </div>
      <div class="gallery-overlay-info">
        <h2>${s.nombre}</h2>
        <p><span class="material-symbols-outlined">location_on</span> ${s.coaj} · Madrid</p>
        <div class="gallery-tags">
          <span class="gallery-tag">${s.tipo}</span>
          <span class="gallery-tag">👥 ${s.capacidad} personas</span>
          <span class="gallery-tag">⏱ ${s.duracion}</span>
          <span class="gallery-tag">💰 ${s.precio}</span>
        </div>
      </div>
      <button class="gallery-nav-btn gallery-prev" onclick="galleryMove(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
      <button class="gallery-nav-btn gallery-next" onclick="galleryMove(1)"><span class="material-symbols-outlined">chevron_right</span></button>
      <div class="gallery-dots" id="galleryDots">
        ${s.photos.map((_, i) => `<button class="gallery-dot ${i === 0 ? 'active' : ''}" onclick="galleryGo(${i})"></button>`).join('')}
      </div>
      <div class="gallery-counter" id="galleryCounter">1 / ${s.photos.length}</div>
    </div>

    <div class="detail-grid">
      <div class="detail-left">
        <div class="detail-section">
          <div class="detail-section-title"><span class="material-symbols-outlined">description</span> Sobre este espacio</div>
          <p>${s.desc}</p>
        </div>
        <div class="detail-section">
          <div class="detail-section-title"><span class="material-symbols-outlined">star</span> Características</div>
          <div class="features-grid">
            ${s.features.map(f => `
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
  if (!activeSala) return;
  const total = activeSala.photos.length;
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
// SLOTS
// ============================================
function renderSlots() {
  const container = document.getElementById('slotsArea');
  if (!selDate || !container) return;

  const dayStr = selDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  // TODO: Reemplazar por disponibilidad real del API
  const times = ['10:00','11:00','12:00','13:00','14:00','16:00','17:00','18:00','19:00','20:00'];
  const slots = times.map(t => ({ time: t, off: Math.random() < 0.25 }));

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
}

function pickSlot(t) { selSlot = t; renderSlots(); updateBookingCta(); }

function updateBookingCta() {
  const cta = document.getElementById('bookingCta');
  if (!cta) return;
  if (selDate && selSlot) {
    cta.style.display = '';
    const ds = selDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    document.getElementById('bookingSummary').textContent = `${activeSala.nombre} · ${ds} · ${selSlot}h`;
  } else {
    cta.style.display = 'none';
  }
}

// ============================================
// CONFIRMAR RESERVA
// ============================================
async function confirmarReserva() {
  if (!activeSala || !selDate || !selSlot) return;

  if (!esUsuarioLogueado()) {
    mostrarToast('Inicia sesión para reservar', 'error');
    return;
  }

  const sesion = JSON.parse(localStorage.getItem(COAJ_CONFIG?.cache?.userKey || 'coajUsuario'));

  // TODO: Enviar al backend
  // try {
  //   const res = await fetch(`${API_BASE}/reservar`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       salaId: activeSala.id,
  //       salaNombre: activeSala.nombre,
  //       centro: activeSala.coaj,
  //       fecha: selDate.toISOString().split('T')[0],
  //       hora: selSlot,
  //       usuario: sesion.alias
  //     })
  //   });
  //   const data = await res.json();
  //   if (data.success) { ... }
  // } catch(err) { ... }

  // Mock success
  mostrarToast('✅ ¡Reserva confirmada exitosamente!', 'success');
  selDate = null; selSlot = null;
  const slotsArea = document.getElementById('slotsArea');
  if (slotsArea) slotsArea.innerHTML = '';
  const cta = document.getElementById('bookingCta');
  if (cta) cta.style.display = 'none';
  renderCalendar();
}

// ============================================
// MODAL RESERVA (para flujo futuro)
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
