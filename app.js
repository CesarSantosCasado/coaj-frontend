const API_URL = 'https://coaj-backend.onrender.com/api/datos';
const LOGIN_URL = 'https://coaj-backend.onrender.com/api/login';

var actividades = [];
var actividadVigente = [];
var vistaActual = 'tarjetas';
var claseActual = 'todas';
var centroActual = 'todos';
var mesActual = new Date().getMonth();
var añoActual = new Date().getFullYear();
var usuarioActual = null;

var iconos = {
  'Cultura': '📚', 'Deporte': '⚽', 'Ocio': '🎮', 'Ocio y Tiempo Libre': '🎮',
  'Formación': '🎓', 'Tecnología': '💻', 'Arte': '🎨', 'Música': '🎵',
  'Naturaleza': '🌿', 'Social': '🤝'
};

var mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
var diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ============================================
// FUNCIONES DE LOGIN
// ============================================

function verificarSesion() {
  var sesion = localStorage.getItem('coajUsuario');
  if (sesion) {
    usuarioActual = JSON.parse(sesion);
    document.getElementById('nombreUsuario').textContent = usuarioActual.nombre;
    document.getElementById('loginModal').classList.add('hidden');
    cargarActividades();
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
  }
}

function entrarComoInvitado() {
  usuarioActual = {
    alias: 'invitado',
    nombre: 'Invitado'
  };
  localStorage.setItem('coajUsuario', JSON.stringify(usuarioActual));
  document.getElementById('nombreUsuario').textContent = 'Invitado';
  document.getElementById('loginModal').classList.add('hidden');
  cargarActividades();
}

function iniciarSesion(event) {
  event.preventDefault();
  
  var alias = document.getElementById('alias').value.trim();
  var contrasena = document.getElementById('contrasena').value;
  var errorDiv = document.getElementById('loginError');
  var btnLogin = event.target.querySelector('button[type="submit"]');
  var form = event.target;
  
  if (!alias || !contrasena) {
    errorDiv.textContent = 'Por favor completa todos los campos';
    errorDiv.style.display = 'block';
    return;
  }
  
  errorDiv.style.display = 'none';
  
  // DESHABILITAR FORMULARIO
  btnLogin.innerHTML = '⏳ Verificando credenciales...';
  btnLogin.disabled = true;
  form.querySelectorAll('input').forEach(function(input) {
    input.disabled = true;
  });
  
  console.log('Intentando login con:', alias);
  
  fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ alias: alias, contrasena: contrasena })
  })
    .then(function(response) {
      console.log('Respuesta recibida:', response.status);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      return response.json();
    })
    .then(function(data) {
      console.log('Datos recibidos:', data);
      
      if (data.success) {
        btnLogin.innerHTML = '✅ ¡Acceso concedido!';
        
        // ESPERAR 500ms ANTES DE CONTINUAR
        setTimeout(function() {
          usuarioActual = data.usuario;
          localStorage.setItem('coajUsuario', JSON.stringify(usuarioActual));
          document.getElementById('nombreUsuario').textContent = usuarioActual.nombre;
          document.getElementById('loginModal').classList.add('hidden');
          document.getElementById('alias').value = '';
          document.getElementById('contrasena').value = '';
          
          // RESTAURAR FORMULARIO
          btnLogin.innerHTML = '🔐 Iniciar Sesión';
          btnLogin.disabled = false;
          form.querySelectorAll('input').forEach(function(input) {
            input.disabled = false;
          });
          
          cargarActividades();
        }, 500);
      } else {
        // RESTAURAR FORMULARIO
        btnLogin.innerHTML = '🔐 Iniciar Sesión';
        btnLogin.disabled = false;
        form.querySelectorAll('input').forEach(function(input) {
          input.disabled = false;
        });
        
        errorDiv.textContent = data.message || 'Usuario o contraseña incorrectos';
        errorDiv.style.display = 'block';
      }
    })
    .catch(function(error) {
      console.error('Error completo:', error);
      
      // RESTAURAR FORMULARIO
      btnLogin.innerHTML = '🔐 Iniciar Sesión';
      btnLogin.disabled = false;
      form.querySelectorAll('input').forEach(function(input) {
        input.disabled = false;
      });
      
      errorDiv.textContent = 'Error de conexión. El servidor puede estar iniciando (espera 30 seg y vuelve a intentar).';
      errorDiv.style.display = 'block';
    });
}

function cerrarSesion() {
  localStorage.removeItem('coajUsuario');
  usuarioActual = null;
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('alias').value = '';
  document.getElementById('contrasena').value = '';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('vistaTarjetas').innerHTML = '';
  document.getElementById('vistaCalendario').innerHTML = '';
}

// ============================================
// FUNCIONES ORIGINALES
// ============================================

function cargarActividades() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('empty').style.display = 'none';
  document.getElementById('vistaTarjetas').innerHTML = '';
  document.getElementById('vistaCalendario').innerHTML = '';
  
  fetch(API_URL)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      actividades = filtrarVigentes(data.actividades || []);
      actividadVigente = data.actividadVigente || [];
      generarFiltros(actividades);
      generarFiltrosCentros(actividades);
      render(actividades);
      actualizarFecha();
    })
    .catch(function(error) {
      console.error('Error:', error);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('empty').style.display = 'block';
    });
}

function parsearFecha(fechaStr) {
  if (!fechaStr) return null;
  try {
    if (typeof fechaStr === 'string' && fechaStr.includes("/")) {
      var fecha = fechaStr.split(" ")[0].split("/");
      return new Date(parseInt(fecha[2]), parseInt(fecha[0]) - 1, parseInt(fecha[1]));
    }
    var fechaObj = new Date(fechaStr);
    if (!isNaN(fechaObj.getTime())) return fechaObj;
    return null;
  } catch (e) { return null; }
}

function filtrarVigentes(acts) {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return acts.filter(function(act) {
    var fechaAl = parsearFecha(act.Al);
    if (!fechaAl) return false;
    fechaAl.setHours(0, 0, 0, 0);
    return fechaAl >= hoy;
  });
}

function formatearFecha(str) {
  if (!str) return "";
  try {
    if (str.indexOf("/") > -1) {
      var partes = str.split(" ");
      var fecha = partes[0].split("/");
      var fechaObj = new Date(parseInt(fecha[2]), parseInt(fecha[0]) - 1, parseInt(fecha[1]));
      return fechaObj.toLocaleDateString("es-MX", { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return str;
  } catch (e) { return str; }
}

function formatearHora(str) {
  if (!str) return "";
  try {
    var partes = str.split(":");
    if (partes.length >= 2) return partes[0] + ":" + partes[1];
    return str;
  } catch (e) { return str; }
}

function extraerImg(campo) {
  if (!campo) return null;
  try {
    if (typeof campo === 'string' && campo.indexOf('{') > -1) {
      var obj = JSON.parse(campo);
      var url = obj.Url || null;
      if (url && url.indexOf('fileName=') > -1) {
        var fileName = url.split('fileName=')[1];
        if (!fileName || fileName.trim().length === 0 || fileName === '&' || fileName.startsWith('&')) return null;
      }
      return url;
    }
    if (typeof campo === 'object' && campo.Url) {
      var url = campo.Url;
      if (url && url.indexOf('fileName=') > -1) {
        var fileName = url.split('fileName=')[1];
        if (!fileName || fileName.trim().length === 0 || fileName === '&' || fileName.startsWith('&')) return null;
      }
      return url;
    }
    if (typeof campo === 'string' && campo.indexOf('http') === 0) {
      if (campo.indexOf('fileName=') > -1) {
        var fileName = campo.split('fileName=')[1];
        if (!fileName || fileName.trim().length === 0 || fileName === '&' || fileName.startsWith('&')) return null;
      }
      return campo;
    }
  } catch (e) {}
  return null;
}

function cambiarVista(vista) {
  vistaActual = vista;
  var botones = document.querySelectorAll('.view-btn');
  botones.forEach(function(btn) { btn.classList.remove('active'); });
  if (vista === 'tarjetas') {
    botones[0].classList.add('active');
    document.getElementById('vistaTarjetas').style.display = 'block';
    document.getElementById('vistaCalendario').style.display = 'none';
  } else {
    botones[1].classList.add('active');
    document.getElementById('vistaTarjetas').style.display = 'none';
    document.getElementById('vistaCalendario').style.display = 'block';
  }
  render(actividades);
}

function agrupar(acts) {
  var grupos = {};
  acts.forEach(function(act) {
    var clase = act.Clase || 'Sin Clasificar';
    if (!grupos[clase]) grupos[clase] = [];
    grupos[clase].push(act);
  });
  return grupos;
}

function filtrarActividades(acts) {
  var resultado = acts;
  if (claseActual !== 'todas') {
    resultado = resultado.filter(function(act) {
      return (act.Clase || 'Sin Clasificar') === claseActual;
    });
  }
  if (centroActual !== 'todos') {
    resultado = resultado.filter(function(act) {
      return act["Centro Juvenil"] === centroActual;
    });
  }
  return resultado;
}

function generarFiltros(acts) {
  var filtrosContainer = document.getElementById('filtros');
  filtrosContainer.innerHTML = '';
  
  var btnTodas = document.createElement('button');
  btnTodas.className = 'filtro-btn active';
  btnTodas.innerHTML = '📌 Todas (' + acts.length + ')';
  btnTodas.onclick = function() { filtrarClase('todas'); };
  filtrosContainer.appendChild(btnTodas);
  
  var grupos = agrupar(acts);
  Object.keys(grupos).sort().forEach(function(clase) {
    var btn = document.createElement('button');
    btn.className = 'filtro-btn';
    btn.innerHTML = (iconos[clase] || '📌') + ' ' + clase + ' (' + grupos[clase].length + ')';
    btn.onclick = function() { filtrarClase(clase); };
    filtrosContainer.appendChild(btn);
  });
}

function generarFiltrosCentros(acts) {
  var centrosContainer = document.getElementById('filtrosCentros');
  centrosContainer.innerHTML = '';
  
  var centrosSet = new Set();
  acts.forEach(function(act) {
    var centro = act["Centro Juvenil"];
    if (centro && centro.trim()) centrosSet.add(centro.trim());
  });
  
  var centros = Array.from(centrosSet).sort();
  if (centros.length === 0) {
    centrosContainer.style.display = 'none';
    return;
  }
  
  centrosContainer.style.display = 'flex';
  
  var btnTodos = document.createElement('button');
  btnTodos.className = 'filtro-centro-btn active';
  btnTodos.innerHTML = '🏢 Todos los Centros (' + acts.length + ')';
  btnTodos.onclick = function() { filtrarCentro('todos'); };
  centrosContainer.appendChild(btnTodos);
  
  centros.forEach(function(centro) {
    var count = acts.filter(function(act) { return act["Centro Juvenil"] === centro; }).length;
    var btn = document.createElement('button');
    btn.className = 'filtro-centro-btn';
    btn.innerHTML = '📍 ' + centro + ' (' + count + ')';
    btn.onclick = function() { filtrarCentro(centro); };
    centrosContainer.appendChild(btn);
  });
}

function crearCard(act) {
  var nombre = act.Actividad || act["ID Actividad"] || "Sin nombre";
  var dias = act.Días || act.Dias || "Por confirmar";
  var horaInicio = formatearHora(act["Hora de inicio"]);
  var horaFin = formatearHora(act["Hora de finalización"]);
  var horario = horaInicio && horaFin ? horaInicio + " - " + horaFin : "Por confirmar";
  var centro = act["Centro Juvenil"] || "Sin centro";
  var estado = act.Estado || "";
  var imgUrl = extraerImg(act["Imagen URL"]) || extraerImg(act.Cartel);
  var img = imgUrl || "https://placehold.co/600x400/032845/ffffff?text=COAJ";

  var badgeHtml = '';
  if (estado === 'Desarrollo') badgeHtml = '<span class="badge badge-desarrollo">En curso</span>';
  else if (estado === 'Finalizado') badgeHtml = '<span class="badge badge-finalizado">Finalizado</span>';
  else if (estado === 'Pendiente') badgeHtml = '<span class="badge badge-programado">Próximo</span>';

  var card = document.createElement('div');
  card.className = 'evento-card';
  
  var imgElement = document.createElement('img');
  imgElement.className = 'evento-img';
  imgElement.src = img;
  imgElement.alt = nombre;
  imgElement.onerror = function() { this.src = 'https://placehold.co/600x400/032845/ffffff?text=COAJ'; };

  var content = document.createElement('div');
  content.className = 'evento-content';
  
  var nombreDiv = document.createElement('div');
  nombreDiv.className = 'evento-nombre';
  nombreDiv.textContent = nombre;

  var infoDiv = document.createElement('div');
  infoDiv.className = 'evento-info';
  infoDiv.innerHTML = badgeHtml +
    '<div class="info-item"><div class="info-icon">📅</div><div class="info-text">' + dias + '</div></div>' +
    '<div class="info-item"><div class="info-icon">⏰</div><div class="info-text">' + horario + '</div></div>' +
    '<div class="info-item"><div class="info-icon">🏢</div><div class="info-text">' + centro + '</div></div>';

  var btn = document.createElement('button');
  btn.className = 'btn-ver-mas';
  btn.textContent = 'Ver más';
  btn.onclick = function() { abrirModal(act); };

  content.appendChild(nombreDiv);
  content.appendChild(infoDiv);
  content.appendChild(btn);
  card.appendChild(imgElement);
  card.appendChild(content);
  return card;
}

function getActividadesDia(dia, mes, año) {
  var fechaBuscada = (mes + 1).toString().padStart(2, '0') + '/' + dia.toString().padStart(2, '0') + '/' + año;
  return actividadVigente.filter(function(act) {
    return act.Fecha === fechaBuscada;
  });
}

function generarCalendario(acts) {
  var primerDia = new Date(añoActual, mesActual, 1);
  var ultimoDia = new Date(añoActual, mesActual + 1, 0);
  var diasEnMes = ultimoDia.getDate();
  var primerDiaSemana = (primerDia.getDay() + 6) % 7;

  var html = '<div class="calendario-container">';
  html += '<div class="calendario-header">';
  html += '<div class="calendario-nav">';
  html += '<button class="btn-nav" onclick="cambiarMes(-1)">←</button>';
  html += '<div class="mes-actual">' + mesesNombres[mesActual] + ' ' + añoActual + '</div>';
  html += '<button class="btn-nav" onclick="cambiarMes(1)">→</button>';
  html += '</div>';
  html += '<button class="btn-hoy" onclick="irHoy()">Hoy</button>';
  html += '</div>';
  html += '<div class="calendario-grid">';

  for (var i = 0; i < 7; i++) {
    html += '<div class="dia-semana">' + diasSemana[i] + '</div>';
  }

  for (var i = 0; i < primerDiaSemana; i++) {
    var diaAnterior = new Date(añoActual, mesActual, -(primerDiaSemana - i - 1));
    html += '<div class="dia-celda otro-mes"><div class="dia-numero">' + diaAnterior.getDate() + '</div></div>';
  }

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (var dia = 1; dia <= diasEnMes; dia++) {
    var actividadesDia = getActividadesDia(dia, mesActual, añoActual);
    if (centroActual !== 'todos') {
      actividadesDia = actividadesDia.filter(function(act) {
        return act["Centro Juvenil"] === centroActual;
      });
    }
    var clases = 'dia-celda';
    if (hoy.getDate() === dia && hoy.getMonth() === mesActual && hoy.getFullYear() === añoActual) clases += ' hoy';
    if (actividadesDia.length > 0) clases += ' con-actividades';
    html += '<div class="' + clases + '" onclick="verActividadesDia(' + dia + ')">';
    html += '<div class="dia-numero">' + dia + '</div>';
    if (actividadesDia.length > 0) html += '<div class="dia-contador">' + actividadesDia.length + ' act.</div>';
    html += '</div>';
  }

  var diasRestantes = (7 - ((primerDiaSemana + diasEnMes) % 7)) % 7;
  for (var i = 1; i <= diasRestantes; i++) {
    html += '<div class="dia-celda otro-mes"><div class="dia-numero">' + i + '</div></div>';
  }

  html += '</div></div>';
  return html;
}

function verActividadesDia(dia) {
  var actividadesDia = getActividadesDia(dia, mesActual, añoActual);
  if (centroActual !== 'todos') {
    actividadesDia = actividadesDia.filter(function(act) {
      return act["Centro Juvenil"] === centroActual;
    });
  }
  if (actividadesDia.length === 0) return;

  var container = document.getElementById('vistaCalendario');
  var actividadesDiaDiv = document.getElementById('actividadesDia');
  if (actividadesDiaDiv) actividadesDiaDiv.remove();

  var fecha = new Date(añoActual, mesActual, dia);
  var fechaFormateada = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var textoActividades = actividadesDia.length === 1 ? '1 actividad' : actividadesDia.length + ' actividades';

  var html = '<div class="actividades-dia-container" id="actividadesDia">';
  html += '<div class="actividades-dia-header">';
  html += '<div class="actividades-dia-titulo">📅 ' + fechaFormateada + ' (' + textoActividades + ')</div>';
  html += '<button class="btn-cerrar-dia" onclick="cerrarActividadesDia()">✕</button>';
  html += '</div>';
  html += '<div class="actividades-dia-body">';
  html += '<div class="eventos-grid" id="gridActividadesDia"></div>';
  html += '</div></div>';

  container.insertAdjacentHTML('beforeend', html);
  var grid = document.getElementById('gridActividadesDia');
  actividadesDia.forEach(function(act) { grid.appendChild(crearCardVigente(act)); });
  document.getElementById('actividadesDia').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarActividadesDia() {
  var actividadesDiaDiv = document.getElementById('actividadesDia');
  if (actividadesDiaDiv) actividadesDiaDiv.remove();
}

function cambiarMes(direccion) {
  mesActual += direccion;
  if (mesActual < 0) { mesActual = 11; añoActual--; }
  else if (mesActual > 11) { mesActual = 0; añoActual++; }
  cerrarActividadesDia();
  render(actividades);
}

function irHoy() {
  var hoy = new Date();
  mesActual = hoy.getMonth();
  añoActual = hoy.getFullYear();
  cerrarActividadesDia();
  render(actividades);
}

function crearCardVigente(act) {
  var nombre = act.Actividad || "Sin nombre";
  var centro = act["Centro Juvenil"] || "Sin centro";
  var horaInicio = act["Hora Inicio"] ? act["Hora Inicio"].substring(0, 5) : "";
  var horaFin = act["Hora Fin"] ? act["Hora Fin"].substring(0, 5) : "";
  var horario = horaInicio && horaFin ? horaInicio + " - " + horaFin : "Por confirmar";
  var img = act["URL Actividad"] || "https://placehold.co/600x400/032845/ffffff?text=COAJ";
  var estado = act.Estado || "";

  var badgeHtml = '';
  if (estado === 'Desarrollo') badgeHtml = '<span class="badge badge-desarrollo">En curso</span>';
  else if (estado === 'Finalizado') badgeHtml = '<span class="badge badge-finalizado">Finalizado</span>';
  else if (estado === 'Pendiente') badgeHtml = '<span class="badge badge-programado">Próximo</span>';

  var card = document.createElement('div');
  card.className = 'evento-card';
  
  var imgElement = document.createElement('img');
  imgElement.className = 'evento-img';
  imgElement.src = img;
  imgElement.alt = nombre;
  imgElement.onerror = function() { this.src = 'https://placehold.co/600x400/032845/ffffff?text=COAJ'; };

  var content = document.createElement('div');
  content.className = 'evento-content';
  
  var nombreDiv = document.createElement('div');
  nombreDiv.className = 'evento-nombre';
  nombreDiv.textContent = nombre;

  var infoDiv = document.createElement('div');
  infoDiv.className = 'evento-info';
  infoDiv.innerHTML = badgeHtml +
    '<div class="info-item"><div class="info-icon">⏰</div><div class="info-text">' + horario + '</div></div>' +
    '<div class="info-item"><div class="info-icon">🏢</div><div class="info-text">' + centro + '</div></div>';

  var btn = document.createElement('button');
  btn.className = 'btn-ver-mas';
  btn.textContent = 'Ver más';
  btn.onclick = function() { abrirModalVigente(act); };

  content.appendChild(nombreDiv);
  content.appendChild(infoDiv);
  content.appendChild(btn);
  card.appendChild(imgElement);
  card.appendChild(content);
  return card;
}

function abrirModalVigente(act) {
  var modal = document.getElementById('modal');
  var nombre = act.Actividad || "Sin nombre";
  var desc = act.Descripción || "Sin descripción disponible.";
  var img = act["URL Actividad"] || "https://placehold.co/600x400/032845/ffffff?text=COAJ";

  document.getElementById('modalImg').src = img;
  document.getElementById('modalTitulo').textContent = nombre;
  document.getElementById('modalDescripcion').textContent = desc;

  var badges = document.getElementById('modalBadges');
  badges.innerHTML = '<span class="modal-badge" style="background: #0a3d5c; color: white;">' + (act.Días || '') + '</span>';

  var horaInicio = act["Hora Inicio"] ? act["Hora Inicio"].substring(0, 5) : "N/A";
  var horaFin = act["Hora Fin"] ? act["Hora Fin"].substring(0, 5) : "N/A";

  var info = document.getElementById('modalInfo');
  info.innerHTML =
    '<div class="modal-info-card"><small>📅 Fecha</small><strong>' + (act.Fecha || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>🕐 Horario</small><strong>' + horaInicio + ' - ' + horaFin + '</strong></div>' +
    '<div class="modal-info-card"><small>🏢 Centro</small><strong>' + (act["Centro Juvenil"] || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>👥 Inscritos</small><strong>' + (act["No de Inscritos"] || '0') + '</strong></div>';

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function render(acts) {
  var loading = document.getElementById('loading');
  var empty = document.getElementById('empty');
  var actividadesFiltradas = filtrarActividades(acts);

  if (!actividadesFiltradas || actividadesFiltradas.length === 0) {
    loading.style.display = 'none';
    empty.style.display = 'block';
    document.getElementById('vistaTarjetas').innerHTML = '';
    document.getElementById('vistaCalendario').innerHTML = '';
    return;
  }

  loading.style.display = 'none';
  empty.style.display = 'none';

  if (vistaActual === 'tarjetas') renderTarjetas(actividadesFiltradas);
  else renderCalendario(acts);
}

function renderTarjetas(acts) {
  var container = document.getElementById('vistaTarjetas');
  container.innerHTML = '';
  var grupos = agrupar(acts);
  var clases = Object.keys(grupos).sort();

  if (claseActual !== 'todas') {
    var items = grupos[claseActual] || [];
    if (items.length === 0) return;
    var grid = document.createElement('div');
    grid.className = 'eventos-grid';
    for (var i = 0; i < items.length; i++) grid.appendChild(crearCard(items[i]));
    container.appendChild(grid);
  } else {
    for (var c = 0; c < clases.length; c++) {
      var clase = clases[c];
      var items = grupos[clase];
      var icono = iconos[clase] || '📌';
      
      var banner = document.createElement('div');
      banner.className = 'category-banner';
      banner.innerHTML =
        '<div class="category-content">' +
          '<div class="category-info">' +
            '<div class="category-icon">' + icono + '</div>' +
            '<div class="category-title">' + clase + '</div>' +
          '</div>' +
          '<div class="category-count">' + items.length + '</div>' +
        '</div>';
      container.appendChild(banner);
      
      var grid = document.createElement('div');
      grid.className = 'eventos-grid';
      for (var i = 0; i < items.length; i++) grid.appendChild(crearCard(items[i]));
      container.appendChild(grid);
    }
  }
}

function renderCalendario(acts) {
  var container = document.getElementById('vistaCalendario');
  container.innerHTML = generarCalendario(acts);
}

function filtrarClase(clase) {
  claseActual = clase;
  var botones = document.querySelectorAll('.filtro-btn');
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.remove('active');
    if (botones[i].textContent.includes(clase) || (clase === 'todas' && botones[i].textContent.includes('Todas'))) {
      botones[i].classList.add('active');
    }
  }
  cerrarActividadesDia();
  render(actividades);
}

function filtrarCentro(centro) {
  centroActual = centro;
  var botones = document.querySelectorAll('.filtro-centro-btn');
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.remove('active');
    if (botones[i].textContent.includes(centro) || (centro === 'todos' && botones[i].textContent.includes('Todos'))) {
      botones[i].classList.add('active');
    }
  }
  cerrarActividadesDia();
  render(actividades);
}

function abrirModal(act) {
  var modal = document.getElementById('modal');
  var nombre = act.Actividad || act["ID Actividad"] || "Sin nombre";
  var desc = act.Descripción || act.Descripcion || "Sin descripción disponible.";
  var imgUrl = extraerImg(act["Imagen URL"]) || extraerImg(act.Cartel);
  var img = imgUrl || "https://placehold.co/600x400/032845/ffffff?text=COAJ";

  document.getElementById('modalImg').src = img;
  document.getElementById('modalTitulo').textContent = nombre;
  document.getElementById('modalDescripcion').textContent = desc;

  var badges = document.getElementById('modalBadges');
  badges.innerHTML = '';

  var estado = act.Estado || '';
  if (estado === 'Desarrollo') badges.innerHTML += '<span class="modal-badge badge-desarrollo">En curso</span>';
  else if (estado === 'Finalizado') badges.innerHTML += '<span class="modal-badge badge-finalizado">Finalizado</span>';
  else if (estado === 'Pendiente') badges.innerHTML += '<span class="modal-badge badge-programado">Próximo</span>';

  var clase = act.Clase;
  if (clase) badges.innerHTML += '<span class="modal-badge" style="background: #e8552a; color: white;">' + clase + '</span>';

  var modalidad = act.Modalidad;
  if (modalidad) badges.innerHTML += '<span class="modal-badge" style="background: #0a3d5c; color: white;">' + modalidad + '</span>';

  var horaInicio = formatearHora(act["Hora de inicio"]);
  var horaFin = formatearHora(act["Hora de finalización"]);

  var info = document.getElementById('modalInfo');
  info.innerHTML =
    '<div class="modal-info-card"><small>📅 Del</small><strong>' + (formatearFecha(act.Del) || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>⏰ Al</small><strong>' + (formatearFecha(act.Al) || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>🕐 Horario</small><strong>' + (horaInicio && horaFin ? horaInicio + ' - ' + horaFin : 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>📅 Días</small><strong>' + (act.Días || act.Dias || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>🏢 Centro</small><strong>' + (act["Centro Juvenil"] || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>📚 Programa</small><strong>' + (act.Programa || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>👥 Plazas</small><strong>' + (act.Plazas || 'N/A') + '</strong></div>' +
    '<div class="modal-info-card"><small>🎯 Tipo</small><strong>' + (act["Tipo de Actividad"] || 'N/A') + '</strong></div>';

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function cerrarModal(e) {
  if (!e || e.target.id === 'modal') {
    document.getElementById('modal').classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

function actualizarFecha() {
  var f = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  document.getElementById('fecha').textContent = f;
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Página cargada');
  actualizarFecha();
  verificarSesion();
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') cerrarModal(); });
});
