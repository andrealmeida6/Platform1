// ===================================================================
// AUTH SERVICE - Gestão de Autenticação e Permissões (v2)
// ===================================================================
// Power Pages Equivalent:
// - Web Role: Define permissões baseadas em roles
// - Contact Entity: Representa os utilizadores/colaboradores
// - Entity Permissions: Controla acesso a registos
// ===================================================================

const AuthService = (function() {
  
  const STORAGE_KEY = 'platform1_current_user';
  const VIEW_AS_KEY = 'platform1_view_as';
  
  // ID do utilizador padrão - André Borges
  const DEFAULT_USER_ID = 'ab123456-7890-abcd-ef01-234567890abc';
  
  let currentUserCache = null;
  let viewAsUserCache = null;
  let rolesCache = null;
  
  // ==========================================
  // FUNÇÕES DE ROLES
  // ==========================================
  
  /**
   * Buscar todos os roles activos
   * Power Pages FetchXML:
   * <fetch>
   *   <entity name="adx_webrole">
   *     <attribute name="adx_name"/>
   *     <filter>
   *       <condition attribute="statecode" operator="eq" value="0"/>
   *     </filter>
   *     <order attribute="adx_name"/>
   *   </entity>
   * </fetch>
   */
  async function getRoles() {
    if (rolesCache) return rolesCache;
    
    try {
      const url = `${DataService.getBaseUrl()}/rest/v1/roles?ativo=eq.true&order=nivel.desc`;
      const response = await fetch(url, { headers: DataService.getHeaders() });
      if (!response.ok) throw new Error('Erro ao buscar roles');
      rolesCache = await response.json();
      return rolesCache;
    } catch (error) {
      console.error('[AuthService] Erro ao buscar roles:', error);
      return [];
    }
  }
  
  /**
   * Buscar colaboradores com os seus roles
   * Power Pages FetchXML:
   * <fetch>
   *   <entity name="contact">
   *     <attribute name="fullname"/>
   *     <attribute name="emailaddress1"/>
   *     <link-entity name="adx_contactwebrole" from="adx_contactid" to="contactid">
   *       <link-entity name="adx_webrole" from="adx_webroleid" to="adx_webroleid">
   *         <attribute name="adx_name" alias="role_name"/>
   *       </link-entity>
   *     </link-entity>
   *     <filter>
   *       <condition attribute="statecode" operator="eq" value="0"/>
   *     </filter>
   *   </entity>
   * </fetch>
   */
  async function getColaboradoresComRoles() {
    try {
      // Buscar colaboradores
      const urlColab = `${DataService.getBaseUrl()}/rest/v1/colaboradores?ativo=eq.true&select=*,departamentos(id,codigo,nome)`;
      const respColab = await fetch(urlColab, { headers: DataService.getHeaders() });
      if (!respColab.ok) throw new Error('Erro ao buscar colaboradores');
      const colaboradores = await respColab.json();
      
      // Buscar colaborador_roles
      const urlCR = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?ativo=eq.true&select=colaborador_id,role_id`;
      const respCR = await fetch(urlCR, { headers: DataService.getHeaders() });
      if (!respCR.ok) throw new Error('Erro ao buscar colaborador_roles');
      const colaboradorRoles = await respCR.json();
      
      // Buscar roles
      const roles = await getRoles();
      const rolesMap = {};
      roles.forEach(r => rolesMap[r.id] = r);
      
      // Criar mapa de roles por colaborador
      const rolesByColaborador = {};
      colaboradorRoles.forEach(cr => {
        if (!rolesByColaborador[cr.colaborador_id]) {
          rolesByColaborador[cr.colaborador_id] = [];
        }
        if (rolesMap[cr.role_id]) {
          rolesByColaborador[cr.colaborador_id].push(rolesMap[cr.role_id]);
        }
      });
      
      // Combinar dados
      return colaboradores.map(c => ({
        ...c,
        roles: (rolesByColaborador[c.id] || []).sort((a, b) => (b.nivel || 0) - (a.nivel || 0))
      }));
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaboradores com roles:', error);
      return [];
    }
  }
  
  /**
   * Buscar um colaborador específico com os seus roles
   * Power Pages FetchXML:
   * <fetch>
   *   <entity name="contact">
   *     <attribute name="fullname"/>
   *     <attribute name="emailaddress1"/>
   *     <filter>
   *       <condition attribute="contactid" operator="eq" value="{colaboradorId}"/>
   *     </filter>
   *   </entity>
   * </fetch>
   */
  async function getColaboradorComRoles(colaboradorId) {
    try {
      // Buscar colaborador
      const urlColab = `${DataService.getBaseUrl()}/rest/v1/colaboradores?id=eq.${colaboradorId}&select=*,departamentos(id,codigo,nome)`;
      const respColab = await fetch(urlColab, { headers: DataService.getHeaders() });
      if (!respColab.ok) throw new Error('Erro ao buscar colaborador');
      const colaboradores = await respColab.json();
      if (colaboradores.length === 0) return null;
      
      // Buscar roles do colaborador
      const urlCR = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?colaborador_id=eq.${colaboradorId}&ativo=eq.true&select=role_id`;
      const respCR = await fetch(urlCR, { headers: DataService.getHeaders() });
      if (!respCR.ok) throw new Error('Erro ao buscar roles do colaborador');
      const colaboradorRoles = await respCR.json();
      
      // Buscar roles
      const roles = await getRoles();
      const rolesMap = {};
      roles.forEach(r => rolesMap[r.id] = r);
      
      // Combinar
      const userRoles = colaboradorRoles
        .map(cr => rolesMap[cr.role_id])
        .filter(r => r)
        .sort((a, b) => (b.nivel || 0) - (a.nivel || 0));
      
      return {
        ...colaboradores[0],
        roles: userRoles
      };
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaborador:', error);
      return null;
    }
  }
  
  /**
   * Atribuir role a um colaborador
   * Power Pages: Requer gestão via Web Role assignment
   */
  async function atribuirRole(colaboradorId, roleId) {
    try {
      const url = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles`;
      const response = await fetch(url, {
        method: 'POST',
        headers: DataService.getHeaders(),
        body: JSON.stringify({
          colaborador_id: colaboradorId,
          role_id: roleId,
          ativo: true
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return await response.json();
    } catch (error) {
      console.error('[AuthService] Erro ao atribuir role:', error);
      throw error;
    }
  }
  
  async function removerRole(colaboradorId, roleId) {
    try {
      // Buscar o registo
      const urlGet = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?colaborador_id=eq.${colaboradorId}&role_id=eq.${roleId}`;
      const respGet = await fetch(urlGet, { headers: DataService.getHeaders() });
      const registos = await respGet.json();
      
      if (registos.length > 0) {
        const urlDelete = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?id=eq.${registos[0].id}`;
        const respDelete = await fetch(urlDelete, {
          method: 'DELETE',
          headers: DataService.getHeaders()
        });
        return respDelete.ok;
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
    
    // Default: André Borges
    try {
      const andreBorges = await getColaboradorComRoles(DEFAULT_USER_ID);
      if (andreBorges) {
        await setCurrentUser(DEFAULT_USER_ID);
        return currentUserCache;
      }
      
      // Fallback: primeiro utilizador com role Núcleo
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
  }
  
  // ==========================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ==========================================
  
  function hasRole(user, roleCode) {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.codigo === roleCode);
  }
  
  function isAdmin(user) {
    return hasRole(user, 'nucleo');
  }
  
  function canAccessBackoffice(user) {
    return isAdmin(user);
  }
  
  // Verificar se é AFR - RH (gestão de formações)
  function isAFRRH(user) {
    return hasRole(user, 'afr_rh');
  }
  
  // Verificar se pode aceder à gestão de formações
  function canAccessFormacaoManagement(user) {
    return isAdmin(user) || isAFRRH(user);
  }
  
  // Verificar se é Secretariado
  function isSecretariado(user) {
    return hasRole(user, 'secretariado');
  }
  
  // Verificar se é Dirigente de unidade orgânica
  function isDirigente(user) {
    return hasRole(user, 'afr_dirigente');
  }
  
  // Verificar se pode aprovar pedidos de formação (1º nível - dirigente)
  function canApproveFormacaoLevel1(user, pedido) {
    // O dirigente da unidade orgânica do solicitante pode aprovar
    if (!isDirigente(user)) return false;
    if (!pedido || !pedido.solicitante) return false;
    
    // Verificar se é dirigente da mesma unidade orgânica
    return user.departamento_id === pedido.solicitante.departamento_id;
  }
  
  // Verificar se pode aprovar pedidos de formação (2º nível - AFR-RH)
  function canApproveFormacaoLevel2(user) {
    return canAccessFormacaoManagement(user);
  }
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  async function init() {
    try {
      console.log('[AuthService] A inicializar...');
      await getCurrentUser();
      
      const viewAsId = localStorage.getItem(VIEW_AS_KEY);
      if (viewAsId) {
        viewAsUserCache = await getColaboradorComRoles(viewAsId);
      }
      
      console.log('[AuthService] Inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('[AuthService] Erro na inicialização:', error);
      return false;
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
    isAdmin,
    canAccessBackoffice,
    isAFRRH,
    canAccessFormacaoManagement,
    isSecretariado,
    isDirigente,
    canApproveFormacaoLevel1,
    canApproveFormacaoLevel2,
    init,
    DEFAULT_USER_ID
  };
  
})();

window.AuthService = AuthService;
