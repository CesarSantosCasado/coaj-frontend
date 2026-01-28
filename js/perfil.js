// ============================================
// COAJ MADRID - PERFIL.JS
// ============================================

// ============================================
// CONSTANTES
// ============================================
const API_BASE = 'https://coajmadrid-8273afef0255.herokuapp.com/api';
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dkf1xg2mw/image/upload';
const CLOUDINARY_PRESET = 'coaj_dni';

// ============================================
// ESTADO GLOBAL
// ============================================
let archivoSeleccionado = null;
let usuarioActual = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('🚀 Inicializando COAJ Perfil...');
  initTheme();
  verificarSesion();
  setupEventListeners();
}

function setupEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Nada que cerrar en perfil
    }
  });
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
    console.log('❌ Sin sesión, redirigiendo...');
    window.location.href = '../index.html';
    return;
  }
  
  usuarioActual = JSON.parse(sesion);
  console.log('✅ Usuario cargado:', usuarioActual.alias);
  cargarPerfil();
}

function cargarPerfil() {
  if (!usuarioActual) return;
  
  const u = usuarioActual;
  const inicial = (u.nombre || u.alias || 'U').charAt(0).toUpperCase();
  
  // Avatar
  const profileInitial = document.getElementById('profileInitial');
  if (profileInitial) profileInitial.textContent = inicial;
  
  // Info principal
  const updates = {
    profileName: u.nombre || u.alias || 'Usuario',
    profileAlias: '@' + (u.alias || 'usuario'),
    profileCentro: u.centro || 'COAJ Madrid',
    infoEmail: u.email || '-',
    infoCentro: u.centro || '-'
  };
  
  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
  
  // Fecha nacimiento
  if (u.fechaNacimiento) {
    const fecha = new Date(u.fechaNacimiento);
    const infoFecha = document.getElementById('infoFecha');
    if (infoFecha && !isNaN(fecha)) {
      infoFecha.textContent = fecha.toLocaleDateString('es-ES');
    }
  }
  
  // Estado DNI
  actualizarEstadoDNI(u.foto);
}

function actualizarEstadoDNI(fotoUrl) {
  const alertDNI = document.getElementById('alertDNI');
  const statusIcon = document.querySelector('.dni-status-icon');
  const statusText = document.querySelector('.dni-status-text');
  const uploadArea = document.getElementById('dniUploadArea');
  const btnSubir = document.getElementById('btnSubirDNI');
  
  if (fotoUrl) {
    // DNI ya subido
    if (alertDNI) alertDNI.classList.add('hidden');
    if (statusIcon) {
      statusIcon.textContent = 'check_circle';
      statusIcon.classList.remove('pending');
      statusIcon.classList.add('success');
    }
    if (statusText) statusText.textContent = 'Documento verificado';
    if (uploadArea) uploadArea.style.display = 'none';
    if (btnSubir) btnSubir.style.display = 'none';
  } else {
    // DNI pendiente
    if (alertDNI) alertDNI.classList.remove('hidden');
    if (statusIcon) {
      statusIcon.textContent = 'hourglass_empty';
      statusIcon.classList.add('pending');
      statusIcon.classList.remove('success');
    }
    if (statusText) statusText.textContent = 'Pendiente de subir';
    if (uploadArea) uploadArea.style.display = 'block';
    if (btnSubir) btnSubir.style.display = 'flex';
  }
}

// ============================================
// UPLOAD DNI
// ============================================
function previsualizarDNI(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    mostrarToast('Solo se permiten imágenes', 'error');
    return;
  }
  
  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    mostrarToast('La imagen no debe superar 5MB', 'error');
    return;
  }
  
  archivoSeleccionado = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('dniPreview');
    const previewContainer = document.getElementById('dniPreviewContainer');
    const placeholder = document.getElementById('dniPlaceholder');
    const btnSubir = document.getElementById('btnSubirDNI');
    
    if (preview) preview.src = e.target.result;
    if (previewContainer) previewContainer.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (btnSubir) btnSubir.disabled = false;
  };
  reader.readAsDataURL(file);
}

function eliminarPreview() {
  archivoSeleccionado = null;
  
  const input = document.getElementById('dniInput');
  const preview = document.getElementById('dniPreview');
  const previewContainer = document.getElementById('dniPreviewContainer');
  const placeholder = document.getElementById('dniPlaceholder');
  const btnSubir = document.getElementById('btnSubirDNI');
  
  if (input) input.value = '';
  if (preview) preview.src = '';
  if (previewContainer) previewContainer.style.display = 'none';
  if (placeholder) placeholder.style.display = 'block';
  if (btnSubir) btnSubir.disabled = true;
}

async function subirDNI() {
  if (!archivoSeleccionado) {
    mostrarToast('Selecciona una imagen primero', 'error');
    return;
  }
  
  const btn = document.getElementById('btnSubirDNI');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Subiendo...';
  }
  
  try {
    // 1. Subir a Cloudinary
    console.log('📤 Subiendo imagen a Cloudinary...');
    const formData = new FormData();
    formData.append('file', archivoSeleccionado);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    
    const cloudRes = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });
    
    const cloudData = await cloudRes.json();
    
    if (!cloudData.secure_url) {
      throw new Error('Error al subir imagen a Cloudinary');
    }
    
    console.log('✅ Imagen subida:', cloudData.secure_url);
    
    // 2. Actualizar en backend
    console.log('📝 Actualizando en backend...');
    const apiRes = await fetch(`${API_BASE}/actualizar-foto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alias: usuarioActual.alias,
        fotoUrl: cloudData.secure_url
      })
    });
    
    const apiData = await apiRes.json();
    
    if (apiData.success) {
      // Actualizar sesión local
      usuarioActual.foto = cloudData.secure_url;
      localStorage.setItem('coajUsuario', JSON.stringify(usuarioActual));
      
      // Actualizar UI
      actualizarEstadoDNI(cloudData.secure_url);
      mostrarToast('¡DNI actualizado correctamente!', 'success');
      
      console.log('✅ DNI actualizado exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 2000);
    } else {
      throw new Error(apiData.message || 'Error al guardar en backend');
    }
  } catch (err) {
    console.error('❌ Error subiendo DNI:', err);
    mostrarToast('Error al subir el documento', 'error');
    
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.innerHTML = '<span class="material-symbols-outlined">upload</span> Subir Documento';
    }
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
  
  toast.className = `toast show ${tipo}`;
  
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
