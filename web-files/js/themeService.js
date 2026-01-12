// ===================================================================
// THEME SERVICE - Gestão de Tema/Branding da Plataforma
// ===================================================================

const ThemeService = (function() {
  
  const CACHE_KEY = 'platform_theme_config';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  let themeConfig = null;
  
  // Mapeamento de chaves BD para variáveis CSS
  const CSS_VAR_MAP = {
    'primary_color': '--primary-color',
    'primary_hover': '--primary-hover',
    'primary_light': '--primary-light',
    'secondary_color': '--secondary-color',
    'text_primary': '--text-primary',
    'text_secondary': '--text-secondary',
    'text_muted': '--text-muted',
    'border_color': '--border-color',
    'bg_gray': '--bg-gray',
    'bg_card': '--bg-card',
    'success_color': '--success',
    'warning_color': '--warning',
    'danger_color': '--danger',
    'info_color': '--info',
    'header_bg': '--header-bg',
    'header_border': '--header-border',
    'sidebar_bg': '--sidebar-bg',
    'modal_header_bg': '--modal-header-bg',
    'modal_header_text': '--modal-header-text',
    'quick_action_icon_bg': '--quick-action-icon-bg',
    'quick_action_icon_color': '--quick-action-icon-color',
    'btn_primary_bg': '--btn-primary-bg',
    'btn_primary_text': '--btn-primary-text',
    'gradient_start': '--gradient-start',
    'gradient_end': '--gradient-end',
    'logo_height': '--logo-height'
  };
  
  // Carregar configurações da BD
  async function loadConfig() {
    try {
      // Verificar cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          themeConfig = data;
          return data;
        }
      }
      
      // Carregar da BD
      const response = await fetch(`${DataService.getBaseUrl()}/rest/v1/configuracoes_tema?select=*`, {
        headers: DataService.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações de tema');
      }
      
      const configs = await response.json();
      
      // Converter array para objeto
      themeConfig = {};
      configs.forEach(c => {
        themeConfig[c.chave] = {
          valor: c.valor,
          tipo: c.tipo,
          categoria: c.categoria,
          descricao: c.descricao
        };
      });
      
      // Guardar em cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: themeConfig,
        timestamp: Date.now()
      }));
      
      return themeConfig;
      
    } catch (error) {
      console.warn('[ThemeService] Erro ao carregar config, usando defaults:', error);
      return null;
    }
  }
  
  // Aplicar tema às variáveis CSS
  function applyTheme(config = null) {
    const cfg = config || themeConfig;
    if (!cfg) return;
    
    const root = document.documentElement;
    
    Object.keys(CSS_VAR_MAP).forEach(key => {
      if (cfg[key] && cfg[key].valor) {
        let value = cfg[key].valor;
        
        // Para altura do logo, adicionar 'px'
        if (key === 'logo_height' && !value.includes('px')) {
          value = value + 'px';
        }
        
        root.style.setProperty(CSS_VAR_MAP[key], value);
      }
    });
    
    // Atualizar gradiente
    if (cfg.gradient_start?.valor && cfg.gradient_end?.valor) {
      root.style.setProperty('--gradient-primary', 
        `linear-gradient(135deg, ${cfg.gradient_start.valor} 0%, ${cfg.gradient_end.valor} 100%)`);
      
      // Atualizar shadow primário
      root.style.setProperty('--shadow-primary', 
        `0 4px 15px ${hexToRgba(cfg.gradient_start.valor, 0.3)}`);
    }
    
    // Aplicar logo
    applyLogo(cfg);
    
    console.log('[ThemeService] Tema aplicado');
  }
  
  // Aplicar logo no header
  function applyLogo(config = null) {
    const cfg = config || themeConfig;
    if (!cfg) return;
    
    const logoUrl = cfg.logo_url?.valor;
    const logoHeight = cfg.logo_height?.valor || '40';
    
    // Procurar container do logo no header
    const logoContainer = document.querySelector('.header-logo, .logo-container, #headerLogo');
    
    if (logoContainer && logoUrl) {
      logoContainer.innerHTML = `<img src="${logoUrl}" alt="Logo" style="height: ${logoHeight}px; width: auto;">`;
    }
    
    // Também procurar por qualquer elemento com data-theme-logo
    document.querySelectorAll('[data-theme-logo]').forEach(el => {
      if (logoUrl) {
        el.innerHTML = `<img src="${logoUrl}" alt="Logo" style="height: ${logoHeight}px; width: auto;">`;
      }
    });
  }
  
  // Guardar configuração
  async function saveConfig(chave, valor) {
    try {
      const response = await fetch(
        `${DataService.getBaseUrl()}/rest/v1/configuracoes_tema?chave=eq.${chave}`,
        {
          method: 'PATCH',
          headers: DataService.getHeaders(),
          body: JSON.stringify({
            valor: valor,
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erro ao guardar configuração');
      }
      
      // Atualizar cache local
      if (themeConfig && themeConfig[chave]) {
        themeConfig[chave].valor = valor;
      }
      
      // Limpar cache
      localStorage.removeItem(CACHE_KEY);
      
      return true;
    } catch (error) {
      console.error('[ThemeService] Erro ao guardar:', error);
      throw error;
    }
  }
  
  // Guardar múltiplas configurações
  async function saveMultipleConfigs(configs) {
    try {
      const promises = Object.keys(configs).map(chave => 
        saveConfig(chave, configs[chave])
      );
      
      await Promise.all(promises);
      
      // Recarregar e aplicar
      await loadConfig();
      applyTheme();
      
      return true;
    } catch (error) {
      console.error('[ThemeService] Erro ao guardar múltiplas configs:', error);
      throw error;
    }
  }
  
  // Obter valor de uma configuração
  function getConfig(chave) {
    if (!themeConfig || !themeConfig[chave]) return null;
    return themeConfig[chave].valor;
  }
  
  // Obter todas as configurações
  function getAllConfigs() {
    return themeConfig;
  }
  
  // Obter configurações por categoria
  function getConfigsByCategory(categoria) {
    if (!themeConfig) return {};
    
    const filtered = {};
    Object.keys(themeConfig).forEach(key => {
      if (themeConfig[key].categoria === categoria) {
        filtered[key] = themeConfig[key];
      }
    });
    return filtered;
  }
  
  // Reset para valores padrão
  async function resetToDefaults() {
    const defaults = {
      'primary_color': '#00b276',
      'primary_hover': '#009661',
      'primary_light': '#e6f7f1',
      'secondary_color': '#282a32',
      'text_primary': '#282a32',
      'text_secondary': '#686b87',
      'text_muted': '#94a3b8',
      'border_color': '#e9ecf4',
      'bg_gray': '#f8fafb',
      'bg_card': '#ffffff',
      'success_color': '#00b276',
      'warning_color': '#f59e0b',
      'danger_color': '#ef4444',
      'info_color': '#3b82f6',
      'header_bg': '#ffffff',
      'header_border': '#e9ecf4',
      'modal_header_bg': '#00b276',
      'modal_header_text': '#ffffff',
      'quick_action_icon_bg': '#00b276',
      'quick_action_icon_color': '#ffffff',
      'btn_primary_bg': '#00b276',
      'btn_primary_text': '#ffffff',
      'gradient_start': '#00b276',
      'gradient_end': '#059669',
      'logo_height': '40'
    };
    
    await saveMultipleConfigs(defaults);
    return defaults;
  }
  
  // Limpar cache
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    themeConfig = null;
  }
  
  // Utilitário: hex para rgba
  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Inicialização automática
  async function init() {
    await loadConfig();
    applyTheme();
  }
  
  // Auto-inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // API Pública
  return {
    loadConfig,
    applyTheme,
    applyLogo,
    saveConfig,
    saveMultipleConfigs,
    getConfig,
    getAllConfigs,
    getConfigsByCategory,
    resetToDefaults,
    clearCache,
    init
  };
  
})();

window.ThemeService = ThemeService;
