// ============================================
// COAJ MADRID - PERFIL.JS
// ============================================

const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';

let usuarioActual = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('🚀 Inicializando COAJ Perfil...');
  initTheme();
  verificarSesion();
}

// ============================================
// TEMA CLARO/OSCURO
// ============================================
function initTheme() {
  const saved = localStorage.getItem('coajTheme') || 'light';
  setTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('coajTheme', next);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

// ============================================
// SESIÓN Y PERFIL
// ============================================
function verificarSesion() {
  const sesion = localStorage.getItem('coajUsuario');
  
  if (!sesion) {
    window.location.href = '../index.html';
    return;
  }
  
  usuarioActual = JSON.parse(sesion);
  cargarPerfil();
}

function cargarPerfil() {
  if (!usuarioActual) return;
  
  const u = usuarioActual;
  const inicial = (u.nombre || u.alias || 'U').charAt(0).toUpperCase();
  
  const el = (id) => document.getElementById(id);
  
  if (el('profileInitial')) el('profileInitial').textContent = inicial;
  if (el('profileName')) el('profileName').textContent = u.nombre || u.alias || 'Usuario';
  if (el('profileAlias')) el('profileAlias').textContent = '@' + (u.alias || 'usuario');
  if (el('profileCentro')) el('profileCentro').textContent = u.centro || 'COAJ Madrid';
  if (el('infoEmail')) el('infoEmail').textContent = u.email || '-';
  if (el('infoCentro')) el('infoCentro').textContent = u.centro || '-';
  
  if (u.fechaNacimiento) {
    const fecha = new Date(u.fechaNacimiento);
    if (!isNaN(fecha) && el('infoFecha')) {
      el('infoFecha').textContent = fecha.toLocaleDateString('es-ES');
    }
  }
  
  actualizarEstadoDNI(u.foto);
}

function actualizarEstadoDNI(dni) {
  const alertDNI = document.getElementById('alertDNI');
  const statusIcon = document.querySelector('.dni-status-icon');
  const statusText = document.querySelector('.dni-status-text');
  const dniForm = document.getElementById('dniForm');
  const dniSaved = document.getElementById('dniSaved');
  const dniValue = document.getElementById('dniValue');
  
  if (dni) {
    if (alertDNI) alertDNI.classList.add('hidden');
    if (statusIcon) {
      statusIcon.textContent = 'check_circle';
      statusIcon.classList.remove('pending');
      statusIcon.classList.add('success');
    }
    if (statusText) statusText.textContent = 'Documento registrado';
    if (dniForm) dniForm.style.display = 'none';
    if (dniSaved) dniSaved.style.display = 'flex';
    if (dniValue) dniValue.textContent = dni;
  } else {
    if (alertDNI) alertDNI.classList.remove('hidden');
    if (statusIcon) {
      statusIcon.textContent = 'hourglass_empty';
      statusIcon.classList.add('pending');
      statusIcon.classList.remove('success');
    }
    if (statusText) statusText.textContent = 'Pendiente de registrar';
    if (dniForm) dniForm.style.display = 'flex';
    if (dniSaved) dniSaved.style.display = 'none';
  }
}

// ============================================
// VALIDACIÓN DNI / NIE
// ============================================
function validarDNI(input) {
  let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  input.value = valor;
  
  const inputField = input.closest('.input-field');
  const hint = document.getElementById('dniHint');
  const btn = document.getElementById('btnGuardarDNI');
  
  if (!inputField || !hint || !btn) return;
  
  inputField.classList.remove('valid', 'invalid');
  hint.classList.remove('valid', 'invalid');
  
  if (valor.length === 0) {
    hint.textContent = 'Formato: 8 números + 1 letra';
    btn.disabled = true;
    return;
  }
  
  const regexDNI = /^[0-9]{8}[A-Z]$/;
  const regexNIE = /^[XYZ][0-9]{7}[A-Z]$/;
  
  if (valor.length < 9) {
    hint.textContent = `Faltan ${9 - valor.length} caracteres`;
    btn.disabled = true;
    return;
  }
  
  if (regexDNI.test(valor)) {
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const numero = parseInt(valor.substring(0, 8));
    const letraCorrecta = letras[numero % 23];
    const letraIngresada = valor.charAt(8);
    
    if (letraIngresada === letraCorrecta) {
      inputField.classList.add('valid');
      hint.classList.add('valid');
      hint.textContent = '✓ DNI válido';
      btn.disabled = false;
    } else {
      inputField.classList.add('invalid');
      hint.classList.add('invalid');
      hint.textContent = `✗ Letra incorrecta (debería ser ${letraCorrecta})`;
      btn.disabled = true;
    }
  } else if (regexNIE.test(valor)) {
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let nieNumero = valor.substring(1, 8);
    const primeraLetra = valor.charAt(0);
    
    if (primeraLetra === 'X') nieNumero = '0' + nieNumero;
    else if (primeraLetra === 'Y') nieNumero = '1' + nieNumero;
    else if (primeraLetra === 'Z') nieNumero = '2' + nieNumero;
    
    const letraCorrecta = letras[parseInt(nieNumero) % 23];
    const letraIngresada = valor.charAt(8);
    
    if (letraIngresada === letraCorrecta) {
      inputField.classList.add('valid');
      hint.classList.add('valid');
      hint.textContent = '✓ NIE válido';
      btn.disabled = false;
    } else {
      inputField.classList.add('invalid');
      hint.classList.add('invalid');
      hint.textContent = `✗ Letra incorrecta (debería ser ${letraCorrecta})`;
      btn.disabled = true;
    }
  } else {
    inputField.classList.add('invalid');
    hint.classList.add('invalid');
    hint.textContent = '✗ Formato inválido';
    btn.disabled = true;
  }
}

// ============================================
// GUARDAR DNI
// ============================================
async function guardarDNI() {
  const input = document.getElementById('dniInput');
  const dni = input.value.toUpperCase().trim();
  
  if (!dni || dni.length !== 9) {
    mostrarToast('Ingresa un DNI válido', 'error');
    return;
  }
  
  const btn = document.getElementById('btnGuardarDNI');
  btn.disabled = true;
  btn.classList.add('btn-loading');
  
  try {
    const res = await fetch(`${API_BASE}/actualizar-foto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alias: usuarioActual.alias,
        fotoUrl: dni
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      usuarioActual.foto = dni;
      localStorage.setItem('coajUsuario', JSON.stringify(usuarioActual));
      
      actualizarEstadoDNI(dni);
      mostrarToast('¡DNI guardado correctamente!', 'success');
      
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1500);
    } else {
      throw new Error(data.message || 'Error al guardar');
    }
  } catch (err) {
    console.error('Error:', err);
    mostrarToast('Error al guardar el DNI', 'error');
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
}

// ============================================
// CERRAR SESIÓN
// ============================================
function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  mostrarToast('Sesión cerrada', 'success');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
}

// ============================================
// TOAST
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const text = document.getElementById('toastMessage');
  
  if (!toast) return;
  
  if (icon) icon.textContent = tipo === 'success' ? 'check_circle' : 'error';
  if (text) text.textContent = mensaje;
  toast.className = 'toast show ' + tipo;
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
window.validarDNI = validarDNI;
window.guardarDNI = guardarDNI;
window.cerrarSesion = cerrarSesion;
window.toggleTheme = toggleTheme;
