/**
 * COAJ Madrid - Configuración Global
 * Única fuente de verdad para navegación y configuración
 * 
 * USO: Importar en todas las páginas antes del JS principal
 */

const COAJ_CONFIG = {
  // ============================================
  // API
  // ============================================
  api: {
    base: 'https://coajmadrid-8273afef0255.herokuapp.com/api',
    endpoints: {
      login: '/login',
      registro: '/registro',
      datos: '/datos',
      inscribir: '/inscribir',
      warmup: '/warmup'
    }
  },

  // ============================================
  // CACHE - Configuración de persistencia
  // ============================================
  cache: {
    key: 'coaj_actividades_cache',
    userKey: 'coajUsuario',
    themeKey: 'coajTheme',
    ttl: 5 * 60 * 1000 // 5 minutos en milisegundos
  },

  // ============================================
  // NAVEGACIÓN - Orden homologado
  // Usado en: header, footer, bottom-nav
  // ============================================
  navigation: {
    // Orden oficial de navegación
    items: [
      {
        id: 'inicio',
        label: 'Inicio',
        href: '/index.html',
        icon: 'home',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>`
      },
      {
        id: 'actividades',
        label: 'Actividades',
        href: '/pages/actividades.html',
        icon: 'play_circle',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>`
      },
      {
        id: 'eventos',
        label: 'Eventos',
        href: '/pages/eventos.html',
        icon: 'calendar_month',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>`
      },
      {
        id: 'entrar',
        label: 'Entrar',
        href: '#login',
        icon: 'login',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>`,
        guestOnly: true
      }
    ],

    // Items solo para usuarios logueados (reemplaza 'entrar')
    userItems: [
      {
        id: 'perfil',
        label: 'Mi Perfil',
        href: '/pages/perfil.html',
        icon: 'person',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>`,
        userOnly: true
      }
    ]
  },

  // ============================================
  // CATEGORÍAS - Iconos y colores
  // ============================================
  categories: {
    icons: {
      'Deporte': '⚽',
      'Arte': '🎨',
      'Música': '🎵',
      'Tecnología': '💻',
      'Idiomas': '🌍',
      'Danza': '💃',
      'Teatro': '🎭',
      'Cocina': '👨‍🍳',
      'Fotografía': '📷',
      'Gaming': '🎮',
      'Formación': '📚',
      'Taller': '🔧',
      'Ocio': '🎉',
      'default': '🎯'
    },
    images: {
      'Deporte': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
      'Arte': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
      'Música': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
      'Tecnología': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
      'Danza': 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400',
      'Teatro': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400',
      'Formación': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
      'Idiomas': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400',
      'default': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
    }
  }
};

// ============================================
// UTILIDADES DE CACHE
// ============================================
const CoajCache = {
  /**
   * Guarda datos en sessionStorage con timestamp
   */
  set(key, data) {
    const item = {
      data: data,
      timestamp: Date.now()
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(item));
      console.log(`💾 Cache guardado: ${key}`);
      return true;
    } catch (e) {
      console.warn('Error guardando cache:', e);
      return false;
    }
  },

  /**
   * Obtiene datos del cache si no han expirado
   * @returns {object|null} Datos o null si expiró/no existe
   */
  get(key, ttl = COAJ_CONFIG.cache.ttl) {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const age = Date.now() - parsed.timestamp;

      if (age > ttl) {
        console.log(`⏰ Cache expirado: ${key} (${Math.round(age/1000)}s)`);
        sessionStorage.removeItem(key);
        return null;
      }

      console.log(`✅ Cache válido: ${key} (${Math.round(age/1000)}s de ${ttl/1000}s)`);
      return parsed.data;
    } catch (e) {
      console.warn('Error leyendo cache:', e);
      return null;
    }
  },

  /**
   * Elimina un item del cache
   */
  remove(key) {
    sessionStorage.removeItem(key);
    console.log(`🗑️ Cache eliminado: ${key}`);
  },

  /**
   * Limpia todo el cache de COAJ
   */
  clear() {
    Object.values(COAJ_CONFIG.cache).forEach(key => {
      if (typeof key === 'string') {
        sessionStorage.removeItem(key);
      }
    });
    console.log('🧹 Cache limpiado');
  },

  /**
   * Verifica si hay datos válidos en cache
   */
  has(key, ttl = COAJ_CONFIG.cache.ttl) {
    return this.get(key, ttl) !== null;
  }
};

// ============================================
// UTILIDADES DE NAVEGACIÓN
// ============================================
const CoajNav = {
  /**
   * Obtiene la página actual basándose en la URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('actividades')) return 'actividades';
    if (path.includes('eventos')) return 'eventos';
    if (path.includes('perfil')) return 'perfil';
    return 'inicio';
  },

  /**
   * Verifica si el usuario está logueado
   */
  isLoggedIn() {
    const user = localStorage.getItem(COAJ_CONFIG.cache.userKey);
    return user !== null;
  },

  /**
   * Obtiene el usuario actual
   */
  getUser() {
    const user = localStorage.getItem(COAJ_CONFIG.cache.userKey);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Verifica si es invitado
   */
  isGuest() {
    const user = this.getUser();
    return user?.alias === 'invitado';
  },

  /**
   * Genera el HTML del bottom nav
   * @param {string} basePath - Ruta base relativa (ej: '../' o './')
   */
  renderBottomNav(basePath = '') {
    const currentPage = this.getCurrentPage();
    const isLogged = this.isLoggedIn();
    const user = this.getUser();
    const items = COAJ_CONFIG.navigation.items;

    // Ajustar rutas
    const adjustPath = (href) => {
      if (href.startsWith('#')) return href;
      if (href.startsWith('/')) {
        return basePath + href.substring(1);
      }
      return basePath + href;
    };

    // Guest nav
    const guestNav = items.map(item => {
      const isActive = item.id === currentPage;
      const href = item.id === 'entrar' ? '#' : adjustPath(item.href);
      const onclick = item.id === 'entrar' ? 'onclick="mostrarLoginModal()"' : '';
      const tag = item.id === 'entrar' ? 'button' : 'a';
      const hrefAttr = tag === 'a' ? `href="${href}"` : '';
      
      return `
        <${tag} ${hrefAttr} class="nav-item ${isActive ? 'active' : ''}" ${onclick}>
          ${item.svg}
          <span>${item.label}</span>
        </${tag}>
      `;
    }).join('');

    // User nav (sin "entrar", con avatar)
    const userNav = items
      .filter(item => !item.guestOnly)
      .map(item => {
        const isActive = item.id === currentPage;
        const href = adjustPath(item.href);
        
        return `
          <a href="${href}" class="nav-item ${isActive ? 'active' : ''}">
            ${item.svg}
            <span>${item.label}</span>
          </a>
        `;
      }).join('') + `
        <div class="nav-item nav-user">
          <div class="nav-avatar"><span id="bottomAvatarInitial">${user?.nombre?.charAt(0) || 'U'}</span></div>
          <span id="bottomUserName">${user?.nombre?.split(' ')[0] || 'User'}</span>
        </div>
      `;

    return `
      <div id="bottomNavGuest" class="nav-items" style="display: ${isLogged ? 'none' : 'flex'}">
        ${guestNav}
      </div>
      <div id="bottomNavUser" class="nav-items" style="display: ${isLogged ? 'flex' : 'none'}">
        ${userNav}
      </div>
    `;
  }
};

// Exponer globalmente
window.COAJ_CONFIG = COAJ_CONFIG;
window.CoajCache = CoajCache;
window.CoajNav = CoajNav;

console.log('⚙️ COAJ Config cargado');
