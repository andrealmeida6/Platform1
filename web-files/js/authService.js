// ===================================================================
// AUTH SERVICE - Gestão de Autenticação e Permissões
// ===================================================================

const AuthService = (function() {
  
  const STORAGE_KEY = 'platform1_current_user';
  const VIEW_AS_KEY = 'platform1_view_as';
  
  let currentUserCache = null;
  let viewAsUserCache = null;
  let rolesCache = null;
  
  // ==========================================
  // FUNÇÕES DE ROLES
  // ==========================================
  
  async function getRoles() {
    if (rolesCache) return rolesCache;
    
    try {
      rolesCache = await DataService.retrieveMultipleRecords('roles', {
        filter: { ativo: true },
        orderby: 'nivel.desc'
      });
      return rolesCache;
    } catch (error) {
      console.error('[AuthService] Erro ao buscar roles:', error);
      return [];
    }
  }
  
  async function getColaboradoresComRoles() {
    try {
      // Query simples sem nested joins complexos
      const select = '*,departamentos(id,codigo,nome),colaborador_roles(id,role_id,ativo)';
      const colaboradores = await DataService.retrieveWithRelations('colaboradores', select, { ativo: true });
      
      // Buscar todas as roles uma vez
      const roles = await getRoles();
      const rolesMap = {};
      roles.forEach(r => rolesMap[r.id] = r);
      
      // Processar para adicionar roles completas
      return colaboradores.map(c => {
        const userRoles = (c.colaborador_roles || [])
          .filter(cr => cr.ativo && rolesMap[cr.role_id])
          .map(cr => rolesMap[cr.role_id])
          .sort((a, b) => (b.nivel || 0) - (a.nivel || 0));
        
        return {
          ...c,
          roles: userRoles,
          colaborador_roles: undefined // limpar
        };
      });
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaboradores com roles:', error);
      return [];
    }
  }
  
  async function getColaboradorComRoles(colaboradorId) {
    try {
      const select = '*,departamentos(id,codigo,nome),colaborador_roles(id,role_id,ativo)';
      const result = await DataService.retrieveWithRelations('colaboradores', select, { id: colaboradorId });
      
      if (result.length === 0) return null;
      
      const roles = await getRoles();
      const rolesMap = {};
      roles.forEach(r => rolesMap[r.id] = r);
      
      const c = result[0];
      const userRoles = (c.colaborador_roles || [])
        .filter(cr => cr.ativo && rolesMap[cr.role_id])
        .map(cr => rolesMap[cr.role_id])
        .sort((a, b) => (b.nivel || 0) - (a.nivel || 0));
      
      return {
        ...c,
        roles: userRoles,
        colaborador_roles: undefined
      };
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaborador:', error);
      return null;
    }
  }
  
  async function atribuirRole(colaboradorId, roleId, atribuidoPor = null) {
    try {
      return await DataService.createRecord('colaborador_roles', {
        colaborador_id: colaboradorId,
        role_id: roleId,
        atribuido_por: atribuidoPor,
        ativo: true
      });
    } catch (error) {
      console.error('[AuthService] Erro ao atribuir role:', error);
      throw error;
    }
  }
  
  async function removerRole(colaboradorId, roleId) {
    try {
      const registos = await DataService.retrieveMultipleRecords('colaborador_roles', {
        filter: {
          colaborador_id: colaboradorId,
          role_id: roleId
        }
      });
      
      if (registos.length > 0) {
        return await DataService.deleteRecord('colaborador_roles', registos[0].id);
      }
      return false;
    } catch (error) {
      console.error('[AuthService] Erro ao remover role:', error);
      throw error;
    }
  }
  
  // ==========================================
  // GESTÃO DO UTILIZADOR ATUAL
  // ==========================================
  
  async function setCurrentUser(colaboradorId) {
    localStorage.setItem(STORAGE_KEY, colaboradorId);
    currentUserCache = await getColaboradorComRoles(colaboradorId);
    return currentUserCache;
  }
  
  async function getCurrentUser() {
    // Se há "Ver como" ativo, retorna esse utilizador
    const viewAsId = localStorage.getItem(VIEW_AS_KEY);
    if (viewAsId) {
      if (!viewAsUserCache || viewAsUserCache.id !== viewAsId) {
        viewAsUserCache = await getColaboradorComRoles(viewAsId);
      }
      return viewAsUserCache;
    }
    
    // Retorna o utilizador real
    if (currentUserCache) return currentUserCache;
    
    const userId = localStorage.getItem(STORAGE_KEY);
    if (userId) {
      currentUserCache = await getColaboradorComRoles(userId);
      if (currentUserCache) return currentUserCache;
    }
    
    // Default: primeiro utilizador com role Núcleo, ou primeiro colaborador
    try {
      const colaboradores = await getColaboradoresComRoles();
      if (colaboradores.length === 0) return null;
      
      const admin = colaboradores.find(c => c.roles && c.roles.some(r => r.codigo === 'nucleo'));
      const defaultUser = admin || colaboradores[0];
      
      if (defaultUser) {
        await setCurrentUser(defaultUser.id);
        return currentUserCache;
      }
    } catch (error) {
      console.error('[AuthService] Erro ao obter utilizador default:', error);
    }
    
    return null;
  }
  
  async function getRealUser() {
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) return getCurrentUser();
    
    if (!currentUserCache || currentUserCache.id !== userId) {
      currentUserCache = await getColaboradorComRoles(userId);
    }
    return currentUserCache;
  }
  
  // ==========================================
  // FUNCIONALIDADE "VER COMO"
  // ==========================================
  
  async function setViewAs(colaboradorId) {
    if (colaboradorId) {
      localStorage.setItem(VIEW_AS_KEY, colaboradorId);
      viewAsUserCache = await getColaboradorComRoles(colaboradorId);
    } else {
      localStorage.removeItem(VIEW_AS_KEY);
      viewAsUserCache = null;
    }
    
    window.dispatchEvent(new CustomEvent('viewAsChanged', { 
      detail: { viewAsUser: viewAsUserCache }
    }));
    
    return viewAsUserCache;
  }
  
  function getViewAsUser() {
    return viewAsUserCache;
  }
  
  function isViewAsActive() {
    return localStorage.getItem(VIEW_AS_KEY) !== null;
  }
  
  function clearViewAs() {
    localStorage.removeItem(VIEW_AS_KEY);
    viewAsUserCache = null;
    
    window.dispatchEvent(new CustomEvent('viewAsChanged', { 
      detail: { viewAsUser: null }
    }));
  }
  
  // ==========================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ==========================================
  
  function hasRole(user, roleCode) {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.codigo === roleCode);
  }
  
  function hasPermission(user, permission) {
    if (!user || !user.roles) return false;
    
    return user.roles.some(r => {
      const perms = r.permissoes || {};
      return perms[permission] === true || perms.ver_tudo === true;
    });
  }
  
  function getMaxLevel(user) {
    if (!user || !user.roles || user.roles.length === 0) return 0;
    return Math.max(...user.roles.map(r => r.nivel || 0));
  }
  
  function isAdmin(user) {
    return hasRole(user, 'nucleo');
  }
  
  function canAccessBackoffice(user) {
    return isAdmin(user) || hasPermission(user, 'backoffice') || hasPermission(user, 'gerir_utilizadores');
  }
  
  function canApprove(user) {
    return hasPermission(user, 'aprovar') || hasPermission(user, 'aprovar_afr') || isAdmin(user);
  }
  
  function filterByPermissions(data, user, ownerField = 'criado_por') {
    if (!user || !data) return [];
    
    if (isAdmin(user)) return data;
    if (hasRole(user, 'afr_dirigente')) return data;
    
    return data.filter(item => {
      if (item[ownerField] === user.id) return true;
      
      if (item.deslocacao_colaboradores) {
        return item.deslocacao_colaboradores.some(dc => dc.colaborador_id === user.id);
      }
      if (item.formacao_inscricoes) {
        return item.formacao_inscricoes.some(fi => fi.colaborador_id === user.id);
      }
      
      return false;
    });
  }
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  async function init() {
    try {
      await getCurrentUser();
      
      const viewAsId = localStorage.getItem(VIEW_AS_KEY);
      if (viewAsId) {
        viewAsUserCache = await getColaboradorComRoles(viewAsId);
      }
      
      console.log('[AuthService] Inicializado com sucesso');
    } catch (error) {
      console.error('[AuthService] Erro na inicialização:', error);
    }
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    getRoles,
    getColaboradoresComRoles,
    getColaboradorComRoles,
    atribuirRole,
    removerRole,
    setCurrentUser,
    getCurrentUser,
    getRealUser,
    setViewAs,
    getViewAsUser,
    isViewAsActive,
    clearViewAs,
    hasRole,
    hasPermission,
    getMaxLevel,
    isAdmin,
    canAccessBackoffice,
    canApprove,
    filterByPermissions,
    init
  };
  
})();

window.AuthService = AuthService;
