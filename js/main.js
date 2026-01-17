/* ========================================
   COAJ MADRID - MAIN.JS
   Auth, Tema, Navegación
   ======================================== */

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  cargarSelectsRegistro();
});

// ========================================
// TEMA CLARO/OSCURO
// ========================================
function initTheme() {
  const saved = localStorage.getItem(COAJ_CONFIG.cache.themeKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(COAJ_CONFIG.cache.themeKey, theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  }
}

// ========================================
// AUTENTICACIÓN
// ========================================
function checkAuth() {
  const user = getUsuarioGuardado();
  if (user) {
    mostrarUsuarioLogueado(user);
  } else {
    mostrarUIGuest();
  }
}

function getUsuarioGuardado() {
  try {
    const data = localStorage.getItem(COAJ_CONFIG.cache.userKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function guardarUsuario(user) {
  localStorage.setItem(COAJ_CONFIG.cache.userKey, JSON.stringify(user));
}

function mostrarUsuarioLogueado(user) {
  const initial = (user.nombre || user.alias || 'U').charAt(0).toUpperCase();
  const nombre = user.nombre || user.alias || 'Usuario';

  // Desktop
  const headerAuth = document.getElementById('headerAuth');
  const headerUser = document.getElementById('headerUser');
  const userInitial = document.getElementById('userInitial');
  const userName = document.getElementById('userName');

  if (headerAuth) headerAuth.style.display = 'none';
  if (headerUser) headerUser.style.display = 'flex';
  if (userInitial) userInitial.textContent = initial;
  if (userName) userName.textContent = nombre;

  // Mobile
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');
  const bottomUserInitial = document.getElementById('bottomUserInitial');
  const bottomUserName = document.getElementById('bottomUserName');

  if (bottomNavGuest) bottomNavGuest.style.display = 'none';
  if (bottomNavUser) bottomNavUser.style.display = 'flex';
  if (bottomUserInitial) bottomUserInitial.textContent = initial;
  if (bottomUserName) bottomUserName.textContent = nombre.split(' ')[0];
}

function mostrarUIGuest() {
  // Desktop
  const headerAuth = document.getElementById('headerAuth');
  const headerUser = document.getElementById('headerUser');

  if (headerAuth) headerAuth.style.display = 'flex';
  if (headerUser) headerUser.style.display = 'none';

  // Mobile
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');

  if (bottomNavGuest) bottomNavGuest.style.display = 'flex';
  if (bottomNavUser) bottomNavUser.style.display = 'none';
}

function cerrarSesion() {
  localStorage.removeItem(COAJ_CONFIG.cache.userKey);
  mostrarUIGuest();
  showToast('Sesión cerrada', 'success');
}

// ========================================
// MODAL AUTH
// ========================================
function abrirModal(tipo) {
  const modal = document.getElementById('modalAuth');
  if (modal) {
    modal.classList.add('active');
    cambiarTab(tipo);
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal() {
  const modal = document.getElementById('modalAuth');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    limpiarForms();
  }
}

function cerrarModalClick(e) {
  if (e.target === e.currentTarget) {
    cerrarModal();
  }
}

function cambiarTab(tab) {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegistro = document.getElementById('tabRegistro');
  const formLogin = document.getElementById('formLogin');
  const formRegistro = document.getElementById('formRegistro');

  if (tab === 'login') {
    tabLogin?.classList.add('active');
    tabRegistro?.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formRegistro) formRegistro.style.display = 'none';
  } else {
    tabLogin?.classList.remove('active');
    tabRegistro?.classList.add('active');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegistro) formRegistro.style.display = 'block';
  }
}

function limpiarForms() {
  document.getElementById('formLogin')?.reset();
  document.getElementById('formRegistro')?.reset();
  document.getElementById('loginError')?.classList.remove('show');
  document.getElementById('registroError')?.classList.remove('show');
  const aliasStatus = document.getElementById('aliasStatus');
  if (aliasStatus) aliasStatus.textContent = '';
}

// ========================================
// LOGIN
// ========================================
async function hacerLogin(e) {
  e.preventDefault();
  
  const btn = document.getElementById('btnLogin');
  const errorDiv = document.getElementById('loginError');
  const alias = document.getElementById('loginAlias')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!alias || !password) {
    mostrarError(errorDiv, 'Completa todos los campos');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Entrando...';

  try {
    const res = await fetch(`${COAJ_CONFIG.api.base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Credenciales incorrectas');
    }

    guardarUsuario(data.usuario);
    mostrarUsuarioLogueado(data.usuario);
    cerrarModal();
    showToast(`¡Bienvenido, ${data.usuario.nombre || data.usuario.alias}!`, 'success');

  } catch (err) {
    mostrarError(errorDiv, err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión';
  }
}

// ========================================
// REGISTRO
// ========================================
async function hacerRegistro(e) {
  e.preventDefault();

  const btn = document.getElementById('btnRegistro');
  const errorDiv = document.getElementById('registroError');

  const datos = {
    nombre: document.getElementById('regNombre')?.value.trim(),
    email: document.getElementById('regEmail')?.value.trim(),
    alias: document.getElementById('regAlias')?.value.trim(),
    password: document.getElementById('regPassword')?.value,
    fecha_nacimiento: document.getElementById('regFecha')?.value || null,
    sexo: document.getElementById('regSexo')?.value || null,
    movil: document.getElementById('regMovil')?.value.trim() || null,
    municipio: document.getElementById('regMunicipio')?.value || null,
    distrito: document.getElementById('regDistrito')?.value || null,
    barrio: document.getElementById('regBarrio')?.value || null
  };

  if (!datos.nombre || !datos.email || !datos.alias || !datos.password) {
    mostrarError(errorDiv, 'Completa los campos obligatorios');
    return;
  }

  if (datos.password.length < 6) {
    mostrarError(errorDiv, 'La contraseña debe tener al menos 6 caracteres');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Creando...';

  try {
    const res = await fetch(`${COAJ_CONFIG.api.base}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al crear cuenta');
    }

    guardarUsuario(data.usuario);
    mostrarUsuarioLogueado(data.usuario);
    cerrarModal();
    showToast('¡Cuenta creada con éxito!', 'success');

  } catch (err) {
    mostrarError(errorDiv, err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> Crear Cuenta';
  }
}

// ========================================
// SELECTS DINÁMICOS
// ========================================
let municipiosData = [];
let distritosData = [];
let barriosData = [];

async function cargarSelectsRegistro() {
  try {
    const [munRes, disRes, barRes] = await Promise.all([
      fetch(`${COAJ_CONFIG.api.base}/municipios`),
      fetch(`${COAJ_CONFIG.api.base}/distritos`),
      fetch(`${COAJ_CONFIG.api.base}/barrios`)
    ]);

    municipiosData = await munRes.json();
    distritosData = await disRes.json();
    barriosData = await barRes.json();

    poblarSelect('regMunicipio', municipiosData, 'municipio');
    poblarSelect('regDistrito', distritosData, 'distrito');

  } catch (err) {
    console.warn('Error cargando selects:', err);
  }
}

function poblarSelect(id, data, campo) {
  const select = document.getElementById(id);
  if (!select) return;

  const opciones = [...new Set(data.map(d => d[campo]).filter(Boolean))].sort();
  
  opciones.forEach(op => {
    const option = document.createElement('option');
    option.value = op;
    option.textContent = op;
    select.appendChild(option);
  });
}

function filtrarBarrios() {
  const distritoSel = document.getElementById('regDistrito')?.value;
  const barrioSelect = document.getElementById('regBarrio');
  
  if (!barrioSelect) return;

  barrioSelect.innerHTML = '<option value="">Selecciona</option>';

  if (!distritoSel) {
    barrioSelect.disabled = true;
    barrioSelect.innerHTML = '<option value="">Primero selecciona distrito</option>';
    return;
  }

  barrioSelect.disabled = false;
  
  const filtrados = barriosData
    .filter(b => b.distrito === distritoSel)
    .map(b => b.barrio)
    .filter(Boolean)
    .sort();

  filtrados.forEach(barrio => {
    const option = document.createElement('option');
    option.value = barrio;
    option.textContent = barrio;
    barrioSelect.appendChild(option);
  });
}

// ========================================
// ALIAS SUGERIDO
// ========================================
let aliasTimeout = null;

function generarAliasSugerido() {
  const nombre = document.getElementById('regNombre')?.value.trim();
  const aliasInput = document.getElementById('regAlias');
  
  if (!nombre || !aliasInput) return;
  
  // Solo sugerir si el alias está vacío
  if (aliasInput.value.trim()) return;

  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);

  if (base.length >= 3) {
    const sugerido = base + Math.floor(Math.random() * 100);
    aliasInput.value = sugerido;
    verificarAliasDisponible(sugerido);
  }
}

function verificarAliasDisponible(alias) {
  const statusEl = document.getElementById('aliasStatus');
  if (!statusEl) return;

  clearTimeout(aliasTimeout);

  if (!alias || alias.length < 3) {
    statusEl.textContent = '';
    statusEl.className = 'input-hint';
    return;
  }

  statusEl.textContent = 'Verificando...';
  statusEl.className = 'input-hint verificando';

  aliasTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${COAJ_CONFIG.api.base}/check-alias/${encodeURIComponent(alias)}`);
      const data = await res.json();

      if (data.disponible) {
        statusEl.textContent = '✓ Disponible';
        statusEl.className = 'input-hint disponible';
      } else {
        statusEl.textContent = '✗ Ya está en uso';
        statusEl.className = 'input-hint ocupado';
      }
    } catch {
      statusEl.textContent = '';
      statusEl.className = 'input-hint';
    }
  }, 500);
}

// Verificar alias al escribir
document.addEventListener('DOMContentLoaded', () => {
  const aliasInput = document.getElementById('regAlias');
  if (aliasInput) {
    aliasInput.addEventListener('input', (e) => {
      verificarAliasDisponible(e.target.value.trim());
    });
  }
});

// ========================================
// PASSWORD TOGGLE
// ========================================
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const icon = btn.querySelector('.material-symbols-outlined');
  
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    if (icon) icon.textContent = 'visibility';
  }
}

// ========================================
// UTILIDADES
// ========================================
function mostrarError(el, msg) {
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  }
}

function showToast(msg, tipo = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');
  
  if (!toast) return;

  toast.className = `toast ${tipo}`;
  if (toastMsg) toastMsg.textContent = msg;
  if (toastIcon) toastIcon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModal();
  }
});

// ========================================
// NAVEGACIÓN ACTIVA
// ========================================
function setActiveNav() {
  const path = window.location.pathname;
  const navItems = document.querySelectorAll('.bottom-nav-item, .header-nav a');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (!href) return;
    
    item.classList.remove('active');
    
    if (path === '/' && (href === '/' || href === 'index.html')) {
      item.classList.add('active');
    } else if (href !== '/' && path.includes(href.replace('pages/', '').replace('.html', ''))) {
      item.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', setActiveNav);
