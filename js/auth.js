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
  document.getElementById('headerAuth').style.display = 'none';
  document.getElementById('headerUser').style.display = 'flex';
  document.getElementById('nombreUsuario').textContent = usuario.nombre;
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  document.getElementById('headerAuth').style.display = 'flex';
  document.getElementById('headerUser').style.display = 'none';
  toast('Sesión cerrada', 'success');
}

// ============================================
// MODAL
// ============================================
function abrirModal(tipo) {
  const modal = document.getElementById('modalAuth');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  cambiarTab(tipo);
  if (tipo === 'registro') cargarCatalogos();
}

function cerrarModalAuth(e) {
  if (e && e.target !== e.currentTarget) return;
  const modal = document.getElementById('modalAuth');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  limpiarForms();
}

function cambiarTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegistro').classList.toggle('active', tab === 'registro');
  document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('formRegistro').style.display = tab === 'registro' ? 'block' : 'none';
  if (tab === 'registro') cargarCatalogos();
}

function limpiarForms() {
  document.getElementById('formLogin').reset();
  document.getElementById('formRegistro').reset();
  document.getElementById('loginError').classList.remove('show');
  document.getElementById('registroError').classList.remove('show');
  document.getElementById('aliasStatus').textContent = '';
  document.getElementById('regBarrio').disabled = true;
  document.getElementById('regBarrio').innerHTML = '<option value="">Primero selecciona distrito</option>';
}

// ============================================
// LOGIN
// ============================================
async function hacerLogin(e) {
  e.preventDefault();
  const alias = document.getElementById('loginAlias').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('btnLogin');
  const errorDiv = document.getElementById('loginError');
  
  if (!alias || !password) {
    mostrarError(errorDiv, 'Completa todos los campos');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verificando...';
  errorDiv.classList.remove('show');

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
      toast(`¡Bienvenido, ${data.usuario.nombre}!`, 'success');
    } else {
      mostrarError(errorDiv, data.message || 'Credenciales incorrectas');
    }
  } catch (err) {
    mostrarError(errorDiv, 'Error de conexión');
  }

  btn.disabled = false;
  btn.textContent = 'Iniciar Sesión';
}

// ============================================
// REGISTRO
// ============================================
async function hacerRegistro(e) {
  e.preventDefault();
  const btn = document.getElementById('btnRegistro');
  const errorDiv = document.getElementById('registroError');
  
  const datos = {
    usuario: document.getElementById('regNombre').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    alias: document.getElementById('regAlias').value.trim(),
    contrasena: document.getElementById('regPassword').value,
    fechaNacimiento: document.getElementById('regFecha').value,
    sexo: document.getElementById('regSexo').value,
    movil: document.getElementById('regMovil').value.trim(),
    municipio: document.getElementById('regMunicipio').value,
    distrito: document.getElementById('regDistrito').value,
    direccion: document.getElementById('regBarrio').value
  };

  if (!datos.usuario || !datos.email || !datos.alias || !datos.contrasena) {
    mostrarError(errorDiv, 'Completa los campos obligatorios');
    return;
  }

  if (datos.contrasena.length < 6) {
    mostrarError(errorDiv, 'La contraseña debe tener al menos 6 caracteres');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';
  errorDiv.classList.remove('show');

  try {
    const res = await fetch(`${API_BASE}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const data = await res.json();

    if (data.success) {
      // Auto login
      localStorage.setItem('coajUsuario', JSON.stringify({ alias: datos.alias, nombre: datos.usuario }));
      mostrarUsuarioLogueado({ alias: datos.alias, nombre: datos.usuario });
      cerrarModalAuth();
      toast('¡Cuenta creada exitosamente!', 'success');
    } else {
      mostrarError(errorDiv, data.message || 'Error al registrar');
    }
  } catch (err) {
    mostrarError(errorDiv, 'Error de conexión');
  }

  btn.disabled = false;
  btn.textContent = 'Crear Cuenta';
}

// ============================================
// ALIAS SUGERIDO
// ============================================
function generarAliasSugerido() {
  const nombre = document.getElementById('regNombre').value.trim();
  if (!nombre || nombre.length < 3) return;

  const partes = nombre.toLowerCase().split(' ').filter(p => p.length > 0);
  let alias = '';

  if (partes.length >= 2) {
    alias = partes[0] + '.' + partes[partes.length - 1];
  } else if (partes.length === 1) {
    alias = partes[0] + Math.floor(Math.random() * 99);
  }

  alias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/g, '');
  
  if (alias) {
    document.getElementById('regAlias').value = alias;
    verificarAliasDisponible(alias);
  }
}

function verificarAliasDisponible(alias) {
  clearTimeout(aliasTimeout);
  const statusDiv = document.getElementById('aliasStatus');
  
  if (!alias || alias.length < 3) {
    statusDiv.textContent = '';
    return;
  }

  statusDiv.textContent = 'Verificando...';
  statusDiv.className = 'alias-status verificando';

  aliasTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/verificar-alias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias })
      });
      const data = await res.json();

      if (data.disponible) {
        statusDiv.textContent = '✓ Disponible';
        statusDiv.className = 'alias-status disponible';
      } else {
        statusDiv.textContent = '✗ Ya está en uso';
        statusDiv.className = 'alias-status ocupado';
      }
    } catch {
      statusDiv.textContent = '';
    }
  }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  const aliasInput = document.getElementById('regAlias');
  if (aliasInput) {
    aliasInput.addEventListener('input', (e) => verificarAliasDisponible(e.target.value.trim()));
  }
});

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

    selMun.innerHTML = '<option value="">Selecciona</option>' + 
      catalogos.municipios.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');

    selDis.innerHTML = '<option value="">Selecciona</option>' + 
      catalogos.distritos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  }
}

function filtrarBarrios() {
  const distrito = document.getElementById('regDistrito').value;
  const selBarrio = document.getElementById('regBarrio');

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
  div.textContent = msg;
  div.classList.add('show');
}

function toast(msg, tipo = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + tipo;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword 
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

// ESC para cerrar
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModalAuth();
});

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', verificarSesion);
