// ============================================
// COAJ MADRID - AUTH.JS
// Sistema de autenticación + Bottom Nav Móvil
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let catalogos = { municipios: [], distritos: [], barrios: [] };
let aliasTimeout = null;

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
  
  if (headerAuth) headerAuth.style.display = 'none';
  if (headerUser) headerUser.style.display = 'flex';
  if (nombreUsuario) nombreUsuario.textContent = nombre;
  if (userInitial) userInitial.textContent = inicial;

  // Móvil - Bottom Nav
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');
  const bottomUserInitial = document.getElementById('bottomUserInitial');
  const bottomUserName = document.getElementById('bottomUserName');

  if (bottomNavGuest) bottomNavGuest.style.display = 'none';
  if (bottomNavUser) bottomNavUser.style.display = 'flex';
  if (bottomUserInitial) bottomUserInitial.textContent = inicial;
  if (bottomUserName) bottomUserName.textContent = nombreCorto;
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  
  // Desktop
  const headerAuth = document.getElementById('headerAuth');
  const headerUser = document.getElementById('headerUser');
  
  if (headerAuth) headerAuth.style.display = 'flex';
  if (headerUser) headerUser.style.display = 'none';

  // Móvil - Bottom Nav
  const bottomNavGuest = document.getElementById('bottomNavGuest');
  const bottomNavUser = document.getElementById('bottomNavUser');

  if (bottomNavGuest) bottomNavGuest.style.display = 'flex';
  if (bottomNavUser) bottomNavUser.style.display = 'none';
  
  toast('Sesión cerrada correctamente', 'success');
}

// ============================================
// MODAL
// ============================================
function abrirModal(tipo) {
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
    fechaNacimiento: document.getElementById('regFecha')?.value,
    sexo: document.getElementById('regSexo')?.value,
    movil: document.getElementById('regMovil')?.value.trim(),
    municipio: document.getElementById('regMunicipio')?.value,
    distrito: document.getElementById('regDistrito')?.value,
    direccion: document.getElementById('regBarrio')?.value
  };

  if (!datos.usuario || !datos.email || !datos.alias || !datos.contrasena) {
    mostrarError(errorDiv, 'Completa los campos obligatorios');
    return;
  }

  if (datos.contrasena.length < 6) {
    mostrarError(errorDiv, 'La contraseña debe tener al menos 6 caracteres');
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
        nombre: datos.usuario 
      }));
      mostrarUsuarioLogueado({ alias: datos.alias, nombre: datos.usuario });
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
    const res = await fetch(`${API_BASE}/catalogos`);
    const data = await res.json();
    catalogos = data;

    const selMun = document.getElementById('regMunicipio');
    const selDis = document.getElementById('regDistrito');

    if (selMun) {
      selMun.innerHTML = '<option value="">Selecciona</option>' + 
        catalogos.municipios.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
    }

    if (selDis) {
      selDis.innerHTML = '<option value="">Selecciona</option>' + 
        catalogos.distritos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
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
  if (!t) return;
  
  t.textContent = msg;
  t.className = 'toast show ' + tipo;
  
  setTimeout(() => t.classList.remove('show'), 3000);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  
  if (btn) {
    btn.innerHTML = isPassword 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
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
  verificarSesion();
  warmup();
  setInterval(warmup, 840000);
  
  const aliasInput = document.getElementById('regAlias');
  if (aliasInput) {
    aliasInput.addEventListener('input', (e) => verificarAliasDisponible(e.target.value.trim()));
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModalAuth();
  }
});
