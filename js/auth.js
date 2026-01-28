// ============================================
// COAJ MADRID - AUTH.JS
// Sistema de autenticación + Tema + Bottom Nav
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let catalogos = { municipios: [], distritos: [], barrios: [], centros: [] };
let aliasTimeout = null;
let bannerDNIActivo = false;

// ============================================
// TEMA - Index siempre inicia en claro
// ============================================
function aplicarTema() {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.setItem('coajTheme', 'light');
  actualizarIconosTema('light');
}

function toggleTheme() {
  const actual = document.documentElement.getAttribute('data-theme');
  const nuevo = actual === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', nuevo);
  localStorage.setItem('coajTheme', nuevo);
  actualizarIconosTema(nuevo);
}

function actualizarIconosTema(tema) {
  const themeIcon = document.getElementById('themeIcon');
  const menuThemeIcon = document.getElementById('menuThemeIcon');
  const menuThemeText = document.getElementById('menuThemeText');
  
  const icono = tema === 'dark' ? 'light_mode' : 'dark_mode';
  const texto = tema === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  
  if (themeIcon) themeIcon.textContent = icono;
  if (menuThemeIcon) menuThemeIcon.textContent = icono;
  if (menuThemeText) menuThemeText.textContent = texto;
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.classList.toggle('active');
}

// ============================================
// SESIÓN
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem('coajUsuario');
  if (sesion) {
    const usuario = JSON.parse(sesion);
    mostrarUsuarioLogueado(usuario);
  }
}

function mostrarUsuarioLogueado(usuario) {
  const inicial = (usuario.nombre || usuario.alias || 'U').charAt(0).toUpperCase();
  const nombre = usuario.nombre || usuario.alias;
  const nombreCorto = nombre.split(' ')[0];

  // Desktop
  const headerAuth = document.getElementById('headerAuth');
  const headerUser = document.getElementById('headerUser');
  const nombreUsuario = document.getElementById('nombreUsuario');
  const userInitial = document.getElementById('userInitial');
  const menuUserInitial = document.getElementById('menuUserInitial');
  const menuUserName = document.getElementById('menuUserName');
  
  if (headerAuth) headerAuth.style.display = 'none';
  if (headerUser) headerUser.style.display = 'flex';
  if (nombreUsuario) nombreUsuario.textContent = nombre;
  if (userInitial) userInitial.textContent = inicial;
  if (menuUserInitial) menuUserInitial.textContent = inicial;
  if (menuUserName) menuUserName.textContent = nombre;

  // Móvil
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');
  const bottomUserInitial = document.getElementById('bottomUserInitial');
  const bottomUserName = document.getElementById('bottomUserName');

  if (bottomNavGuest) bottomNavGuest.style.display = 'none';
  if (bottomNavUser) bottomNavUser.style.display = 'flex';
  if (bottomUserInitial) bottomUserInitial.textContent = inicial;
  if (bottomUserName) bottomUserName.textContent = nombreCorto;

  // Verificar DNI
  verificarDNI(usuario);
}

// ============================================
// VERIFICACIÓN DNI OBLIGATORIO
// ============================================
function verificarDNI(usuario) {
  if (!usuario.foto) {
    setTimeout(() => mostrarBannerDNI(), 300);
  }
}

function mostrarBannerDNI() {
  document.getElementById('bannerDNI')?.remove();
  
  const banner = document.createElement('div');
  banner.id = 'bannerDNI';
  banner.innerHTML = `
    <div class="dni-overlay"></div>
    <div class="dni-modal">
      <div class="dni-icon">
        <span class="material-symbols-outlined">badge</span>
      </div>
      <h2>Actualiza tu DNI</h2>
      <p>Para continuar usando COAJ Madrid, necesitas subir una foto de tu documento de identidad.</p>
      <button class="btn-dni" onclick="irAPerfil()">
        <span class="material-symbols-outlined">person</span>
        Ir a mi perfil
      </button>
    </div>
  `;
  document.body.appendChild(banner);
  document.body.style.overflow = 'hidden';
  bannerDNIActivo = true;
  
  // Bloquear click en overlay
  banner.querySelector('.dni-overlay').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sacudirModal();
  });
}

function sacudirModal() {
  const modal = document.querySelector('.dni-modal');
  if (!modal) return;
  
  modal.classList.remove('shake');
  void modal.offsetWidth; // Forzar reflow
  modal.classList.add('shake');
}

function irAPerfil() {
  window.location.href = 'pages/perfil.html';
}

function cerrarBannerDNI() {
  document.getElementById('bannerDNI')?.remove();
  document.body.style.overflow = '';
  bannerDNIActivo = false;
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  cerrarBannerDNI();
  
  // Desktop
  const headerAuth = document.getElementById('headerAuth');
  const headerUser = document.getElementById('headerUser');
  
  if (headerAuth) headerAuth.style.display = 'flex';
  if (headerUser) headerUser.style.display = 'none';

  // Móvil
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');

  if (bottomNavGuest) bottomNavGuest.style.display = 'flex';
  if (bottomNavUser) bottomNavUser.style.display = 'none';

  // Cerrar menú usuario
  const userMenu = document.getElementById('userMenu');
  if (userMenu) userMenu.classList.remove('active');
  
  toast('Sesión cerrada correctamente', 'success');
}

// ============================================
// MODAL
// ============================================
function abrirModal(tipo) {
  if (bannerDNIActivo) return; // No abrir si banner DNI está activo
  
  const modal = document.getElementById('modalAuth');
  if (!modal) return;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  cambiarTab(tipo);
  
  if (tipo === 'registro') {
    cargarCatalogos();
  }
}

function cerrarModalAuth(e) {
  if (e && e.target !== e.currentTarget) return;
  if (bannerDNIActivo) return; // No cerrar si banner DNI está activo
  
  const modal = document.getElementById('modalAuth');
  if (!modal) return;
  
  modal.classList.remove('active');
  document.body.style.overflow = '';
  limpiarForms();
}

function cambiarTab(tab) {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegistro = document.getElementById('tabRegistro');
  const formLogin = document.getElementById('formLogin');
  const formRegistro = document.getElementById('formRegistro');
  
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
  if (tabRegistro) tabRegistro.classList.toggle('active', tab === 'registro');
  if (formLogin) formLogin.style.display = tab === 'login' ? 'block' : 'none';
  if (formRegistro) formRegistro.style.display = tab === 'registro' ? 'block' : 'none';
  
  if (tab === 'registro') {
    cargarCatalogos();
  }
}

function limpiarForms() {
  const formLogin = document.getElementById('formLogin');
  const formRegistro = document.getElementById('formRegistro');
  const loginError = document.getElementById('loginError');
  const registroError = document.getElementById('registroError');
  const aliasStatus = document.getElementById('aliasStatus');
  const regBarrio = document.getElementById('regBarrio');
  
  if (formLogin) formLogin.reset();
  if (formRegistro) formRegistro.reset();
  if (loginError) loginError.classList.remove('show');
  if (registroError) registroError.classList.remove('show');
  if (aliasStatus) aliasStatus.textContent = '';
  
  if (regBarrio) {
    regBarrio.disabled = true;
    regBarrio.innerHTML = '<option value="">Primero selecciona distrito</option>';
  }
}

// ============================================
// LOGIN
// ============================================
async function hacerLogin(e) {
  e.preventDefault();
  
  const alias = document.getElementById('loginAlias')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const btn = document.getElementById('btnLogin');
  const errorDiv = document.getElementById('loginError');
  
  if (!alias || !password) {
    mostrarError(errorDiv, 'Completa todos los campos');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verificando...';
  }
  
  if (errorDiv) errorDiv.classList.remove('show');

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, contrasena: password })
    });
    
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('coajUsuario', JSON.stringify(data.usuario));
      mostrarUsuarioLogueado(data.usuario);
      cerrarModalAuth();
      toast(`¡Bienvenido, ${data.usuario.nombre || data.usuario.alias}!`, 'success');
    } else {
      mostrarError(errorDiv, data.message || 'Credenciales incorrectas');
    }
  } catch (err) {
    console.error('Login error:', err);
    mostrarError(errorDiv, 'Error de conexión. Intenta de nuevo.');
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Iniciar Sesión';
  }
}

// ============================================
// REGISTRO
// ============================================
async function hacerRegistro(e) {
  e.preventDefault();
  
  const btn = document.getElementById('btnRegistro');
  const errorDiv = document.getElementById('registroError');
  
  const datos = {
    usuario: document.getElementById('regNombre')?.value.trim(),
    email: document.getElementById('regEmail')?.value.trim(),
    alias: document.getElementById('regAlias')?.value.trim(),
    contrasena: document.getElementById('regPassword')?.value,
    fechaNacimiento: document.getElementById('regFecha')?.value || '',
    sexo: document.getElementById('regSexo')?.value || '',
    movil: document.getElementById('regMovil')?.value.trim() || '',
    municipio: document.getElementById('regMunicipio')?.value || '',
    distrito: document.getElementById('regDistrito')?.value || '',
    direccion: document.getElementById('regBarrio')?.value || '',
    centroJuvenil: document.getElementById('regCentro')?.value || ''
  };

  if (!datos.usuario || !datos.email || !datos.alias || !datos.contrasena) {
    mostrarError(errorDiv, 'Completa los campos obligatorios');
    return;
  }

  if (datos.contrasena.length < 6) {
    mostrarError(errorDiv, 'La contraseña debe tener al menos 6 caracteres');
    return;
  }

  if (!datos.fechaNacimiento) {
    mostrarError(errorDiv, 'La fecha de nacimiento es obligatoria');
    return;
  }

  if (!datos.sexo) {
    mostrarError(errorDiv, 'El sexo es obligatorio');
    return;
  }

  if (!datos.municipio) {
    mostrarError(errorDiv, 'El municipio es obligatorio');
    return;
  }

  if (!datos.centroJuvenil) {
    mostrarError(errorDiv, 'El centro juvenil es obligatorio');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
  }
  
  if (errorDiv) errorDiv.classList.remove('show');

  try {
    const res = await fetch(`${API_BASE}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('coajUsuario', JSON.stringify({ 
        alias: datos.alias, 
        nombre: datos.usuario,
        foto: ''
      }));
      mostrarUsuarioLogueado({ alias: datos.alias, nombre: datos.usuario, foto: '' });
      cerrarModalAuth();
      toast('¡Cuenta creada exitosamente!', 'success');
    } else {
      mostrarError(errorDiv, data.message || 'Error al registrar');
    }
  } catch (err) {
    console.error('Registro error:', err);
    mostrarError(errorDiv, 'Error de conexión. Intenta de nuevo.');
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Crear Cuenta';
  }
}

// ============================================
// ALIAS SUGERIDO
// ============================================
function generarAliasSugerido() {
  const nombre = document.getElementById('regNombre')?.value.trim();
  if (!nombre || nombre.length < 3) return;

  const partes = nombre.toLowerCase().split(' ').filter(p => p.length > 0);
  let alias = '';

  if (partes.length >= 2) {
    alias = partes[0] + '.' + partes[partes.length - 1];
  } else if (partes.length === 1) {
    alias = partes[0] + Math.floor(Math.random() * 99);
  }

  alias = alias
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '');
  
  const regAlias = document.getElementById('regAlias');
  if (alias && regAlias) {
    regAlias.value = alias;
    verificarAliasDisponible(alias);
  }
}

function verificarAliasDisponible(alias) {
  clearTimeout(aliasTimeout);
  const statusDiv = document.getElementById('aliasStatus');
  
  if (!alias || alias.length < 3) {
    if (statusDiv) statusDiv.textContent = '';
    return;
  }

  if (statusDiv) {
    statusDiv.textContent = 'Verificando...';
    statusDiv.className = 'input-hint verificando';
  }

  aliasTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/verificar-alias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias })
      });
      
      const data = await res.json();

      if (statusDiv) {
        if (data.disponible) {
          statusDiv.textContent = '✓ Disponible';
          statusDiv.className = 'input-hint disponible';
        } else {
          statusDiv.textContent = '✗ Ya está en uso';
          statusDiv.className = 'input-hint ocupado';
        }
      }
    } catch {
      if (statusDiv) statusDiv.textContent = '';
    }
  }, 500);
}

// ============================================
// CATÁLOGOS
// ============================================
async function cargarCatalogos() {
  if (catalogos.municipios.length > 0) return;

  try {
    const [resCat, resCentros] = await Promise.all([
      fetch(`${API_BASE}/catalogos`),
      fetch(`${API_BASE}/centros`)
    ]);
    
    const data = await resCat.json();
    const dataCentros = await resCentros.json();
    
    catalogos = { ...data, centros: dataCentros.centros || [] };

    const selMun = document.getElementById('regMunicipio');
    const selDis = document.getElementById('regDistrito');
    const selCentro = document.getElementById('regCentro');

    if (selMun) {
      selMun.innerHTML = '<option value="">Selecciona</option>' + 
        catalogos.municipios.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
    }

    if (selDis) {
      selDis.innerHTML = '<option value="">Selecciona</option>' + 
        catalogos.distritos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
    }

    if (selCentro && catalogos.centros.length > 0) {
      selCentro.innerHTML = '<option value="">Selecciona tu centro</option>' + 
        catalogos.centros.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    }
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  }
}

function filtrarBarrios() {
  const distrito = document.getElementById('regDistrito')?.value;
  const selBarrio = document.getElementById('regBarrio');

  if (!selBarrio) return;

  if (!distrito) {
    selBarrio.disabled = true;
    selBarrio.innerHTML = '<option value="">Primero selecciona distrito</option>';
    return;
  }

  const barriosFiltrados = catalogos.barrios.filter(b => b.distrito === distrito);
  selBarrio.disabled = false;
  selBarrio.innerHTML = '<option value="">Selecciona</option>' + 
    barriosFiltrados.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
}

// ============================================
// UTILS
// ============================================
function mostrarError(div, msg) {
  if (!div) return;
  div.textContent = msg;
  div.classList.add('show');
}

function toast(msg, tipo = 'success') {
  const t = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const message = document.getElementById('toastMessage');
  
  if (!t) return;
  
  if (icon) icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  if (message) message.textContent = msg;
  
  t.className = 'toast show ' + tipo;
  
  setTimeout(() => t.classList.remove('show'), 3000);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  
  const icon = btn?.querySelector('.material-symbols-outlined');
  if (icon) {
    icon.textContent = isPassword ? 'visibility_off' : 'visibility';
  }
}

// ============================================
// WARMUP
// ============================================
function warmup() {
  fetch(`${API_BASE}/warmup`).catch(() => {});
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  aplicarTema();
  verificarSesion();
  warmup();
  setInterval(warmup, 840000);
  
  const aliasInput = document.getElementById('regAlias');
  if (aliasInput) {
    aliasInput.addEventListener('input', (e) => verificarAliasDisponible(e.target.value.trim()));
  }

  document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    if (userMenu?.classList.contains('active') && 
        !e.target.closest('.avatar-btn') && 
        !e.target.closest('.user-menu')) {
      userMenu.classList.remove('active');
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Si banner DNI activo, sacudir y bloquear
    if (bannerDNIActivo) {
      e.preventDefault();
      e.stopPropagation();
      sacudirModal();
      return;
    }
    
    // Cerrar otros modales
    cerrarModalAuth();
    const userMenu = document.getElementById('userMenu');
    if (userMenu) userMenu.classList.remove('active');
  }
});
