// ===================================================================
// DATA SERVICE - Camada de Abstração para Supabase/Power Pages
// ===================================================================
// Este ficheiro fornece uma interface unificada para acesso a dados
// que pode ser facilmente adaptada para Power Pages (Dataverse)
// ===================================================================

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const DataService = (function() {
  
  // Configuração Supabase
  const SUPABASE_URL = 'https://yujhfscnnngaivwwunom.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhmc2Nubm5nYWl2d3d1bm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODA5OTEsImV4cCI6MjA4MDk1Njk5MX0.wpWiNx6ck_gEujMoodbFTswjBjMbuEHeAO8lMtLes2c';
  
  // Headers padrão para Supabase
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  // ==========================================
  // FUNÇÕES AUXILIARES (Compatíveis com Power Pages)
  // ==========================================
  
  /**
   * Executa uma query GET - Similar a webapi.safeAjax do Power Pages
   * @param {string} entityName - Nome da tabela/entidade
   * @param {object} options - Opções de query (select, filter, orderby, top)
   * @returns {Promise<Array>} - Array de registos
   */
  async function retrieveMultipleRecords(entityName, options = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${entityName}`;
      const params = new URLSearchParams();
      
      // Select (equivalente a $select do OData)
      if (options.select) {
        params.append('select', options.select);
      }
      
      // Filter (equivalente a $filter do OData)
      // Nota: Supabase usa sintaxe diferente, mas mapeamos para compatibilidade
      if (options.filter) {
        // Adiciona filtros como query params do Supabase
        Object.keys(options.filter).forEach(key => {
          const value = options.filter[key];
          if (typeof value === 'object') {
            // Operadores especiais: eq, neq, gt, gte, lt, lte, like, in
            Object.keys(value).forEach(op => {
              params.append(key, `${op}.${value[op]}`);
            });
          } else {
            params.append(key, `eq.${value}`);
          }
        });
      }
      
      // OrderBy (equivalente a $orderby do OData)
      if (options.orderby) {
        params.append('order', options.orderby);
      }
      
      // Top/Limit (equivalente a $top do OData)
      if (options.top) {
        params.append('limit', options.top);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[DataService] Erro ao buscar ${entityName}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém um único registo por ID - Similar a webapi.retrieveRecord do Power Pages
   * @param {string} entityName - Nome da tabela/entidade
   * @param {string} id - ID do registo (UUID)
   * @param {string} select - Campos a retornar
   * @returns {Promise<Object>} - Registo
   */
  async function retrieveRecord(entityName, id, select = '*') {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}?id=eq.${id}&select=${select}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`[DataService] Erro ao buscar registo ${entityName}/${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria um novo registo - Similar a webapi.createRecord do Power Pages
   * @param {string} entityName - Nome da tabela/entidade
   * @param {object} data - Dados do registo
   * @returns {Promise<Object>} - Registo criado
   */
  async function createRecord(entityName, data) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${error}`);
      }
      
      const result = await response.json();
      return result.length > 0 ? result[0] : result;
    } catch (error) {
      console.error(`[DataService] Erro ao criar ${entityName}:`, error);
      throw error;
    }
  }
  
  /**
   * Atualiza um registo - Similar a webapi.updateRecord do Power Pages
   * @param {string} entityName - Nome da tabela/entidade
   * @param {string} id - ID do registo
   * @param {object} data - Dados a atualizar
   * @returns {Promise<Object>} - Registo atualizado
   */
  async function updateRecord(entityName, id, data) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.length > 0 ? result[0] : result;
    } catch (error) {
      console.error(`[DataService] Erro ao atualizar ${entityName}/${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Elimina um registo - Similar a webapi.deleteRecord do Power Pages
   * @param {string} entityName - Nome da tabela/entidade
   * @param {string} id - ID do registo
   * @returns {Promise<boolean>} - Sucesso
   */
  async function deleteRecord(entityName, id) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[DataService] Erro ao eliminar ${entityName}/${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Executa uma query customizada com joins - Específico Supabase
   * Para Power Pages, isto seria feito com FetchXML
   * @param {string} entityName - Nome da tabela principal
   * @param {string} select - Select com joins (sintaxe Supabase)
   * @param {object} filter - Filtros
   * @returns {Promise<Array>}
   */
  async function retrieveWithRelations(entityName, select, filter = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${entityName}?select=${encodeURIComponent(select)}`;
      
      // Adicionar filtros
      Object.keys(filter).forEach(key => {
        const value = filter[key];
        if (value !== null && value !== undefined) {
          url += `&${key}=eq.${value}`;
        }
      });
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DataService] Erro response:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[DataService] Erro ao buscar ${entityName} com relações:`, error);
      throw error;
    }
  }
  
  /**
   * Executa operações em lote - Similar a batch do OData
   * @param {Array} operations - Array de operações {method, entity, data, id}
   * @returns {Promise<Array>}
   */
  async function executeBatch(operations) {
    const results = [];
    
    for (const op of operations) {
      try {
        let result;
        switch (op.method) {
          case 'POST':
            result = await createRecord(op.entity, op.data);
            break;
          case 'PATCH':
            result = await updateRecord(op.entity, op.id, op.data);
            break;
          case 'DELETE':
            result = await deleteRecord(op.entity, op.id);
            break;
          default:
            result = await retrieveMultipleRecords(op.entity, op.options);
        }
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  // ==========================================
  // FUNÇÕES ESPECÍFICAS POR ENTIDADE
  // (Facilitam o uso e são mais compatíveis com Power Pages)
  // ==========================================
  
  // --- COLABORADORES ---
  async function getColaboradores() {
    return retrieveWithRelations('colaboradores', 
      '*,departamentos(id,codigo,nome)',
      { ativo: true }
    );
  }
  
  async function getColaboradorById(id) {
    const result = await retrieveWithRelations('colaboradores',
      '*,departamentos(id,codigo,nome),roles(id,codigo,nome)',
      { id }
    );
    return result.length > 0 ? result[0] : null;
  }
  
  // --- DEPARTAMENTOS ---
  async function getDepartamentos() {
    return retrieveMultipleRecords('departamentos', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  // --- FORMADORES ---
  async function getFormadores() {
    return retrieveWithRelations('formadores',
      '*,entidades_formadoras(id,nome)',
      { ativo: true }
    );
  }
  
  // --- ENTIDADES FORMADORAS ---
  async function getEntidadesFormadoras() {
    return retrieveMultipleRecords('entidades_formadoras', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  // --- FROTA ---
  async function getFrota() {
    return retrieveMultipleRecords('frota', {
      orderby: 'modelo.asc'
    });
  }
  
  async function getFrotaDisponivel() {
    return retrieveMultipleRecords('frota', {
      filter: { disponivel: true },
      orderby: 'modelo.asc'
    });
  }
  
  // --- TIPOS DE TRANSPORTE ---
  async function getTiposTransporte() {
    return retrieveMultipleRecords('tipos_transporte', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  async function getTiposTransportePublico() {
    return retrieveMultipleRecords('tipos_transporte_publico', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  // --- FORMAÇÕES ---
  // IMPORTANTE: Queries Supabase devem estar numa única linha, sem quebras!
  async function getFormacoes() {
    const select = '*,entidades_formadoras(id,codigo,nome),formadores(id,nome,especialidade,tipo),formacao_sessoes(id,data,hora_inicio,hora_fim),formacao_inscricoes(id,colaborador_id,estado),formacao_departamentos(id,departamento_id,departamentos(id,codigo,nome)),formacao_favoritos(id,colaborador_id),formacao_presencas(id,colaborador_id,presente),formacao_resultados(id,colaborador_id,resultado),formacao_avaliacoes(id,colaborador_id,score_conteudo,score_formador,score_organizacao,comentario,created_at)';
    return retrieveWithRelations('formacoes', select);
  }
  
  async function getFormacaoById(id) {
    const select = '*,entidades_formadoras(id,codigo,nome),formadores(id,nome,especialidade,tipo),formacao_sessoes(id,data,hora_inicio,hora_fim),formacao_inscricoes(id,colaborador_id,estado,colaboradores(id,nome,email,departamento_id)),formacao_departamentos(id,departamento_id,departamentos(id,codigo,nome)),formacao_favoritos(id,colaborador_id),formacao_presencas(id,colaborador_id,presente),formacao_resultados(id,colaborador_id,resultado),formacao_avaliacoes(id,colaborador_id,score_conteudo,score_formador,score_organizacao,comentario,created_at)';
    const result = await retrieveWithRelations('formacoes', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createFormacao(data) {
    // Extrair dados relacionados
    const { sessoes, departamentos_alvo, ...formacaoData } = data;
    
    // Criar formação
    const formacao = await createRecord('formacoes', formacaoData);
    
    // Criar sessões
    if (sessoes && sessoes.length > 0) {
      for (const sessao of sessoes) {
        await createRecord('formacao_sessoes', {
          formacao_id: formacao.id,
          data: sessao.data,
          hora_inicio: sessao.horaInicio,
          hora_fim: sessao.horaFim
        });
      }
    }
    
    // Associar departamentos
    if (departamentos_alvo && departamentos_alvo.length > 0) {
      for (const depId of departamentos_alvo) {
        await createRecord('formacao_departamentos', {
          formacao_id: formacao.id,
          departamento_id: depId
        });
      }
    }
    
    return formacao;
  }
  
  async function updateFormacao(id, data) {
    return updateRecord('formacoes', id, data);
  }
  
  async function inscreverFormacao(formacaoId, colaboradorId, observacoes = null) {
    return createRecord('formacao_inscricoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      observacoes,
      estado: 'Inscrito'
    });
  }
  
  async function cancelarInscricaoFormacao(formacaoId, colaboradorId) {
    // Buscar inscrição
    const inscricoes = await retrieveMultipleRecords('formacao_inscricoes', {
      filter: {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId
      }
    });
    
    if (inscricoes.length > 0) {
      return updateRecord('formacao_inscricoes', inscricoes[0].id, {
        estado: 'Cancelada',
        cancelada_em: new Date().toISOString()
      });
    }
    return null;
  }
  
  async function toggleFavoritoFormacao(formacaoId, colaboradorId) {
    // Verificar se já é favorito
    const favoritos = await retrieveMultipleRecords('formacao_favoritos', {
      filter: {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId
      }
    });
    
    if (favoritos.length > 0) {
      // Remover
      await deleteRecord('formacao_favoritos', favoritos[0].id);
      return false;
    } else {
      // Adicionar
      await createRecord('formacao_favoritos', {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId
      });
      return true;
    }
  }
  
  async function registarPresenca(formacaoId, colaboradorId, presente) {
    // Verificar se já existe registo
    const presencas = await retrieveMultipleRecords('formacao_presencas', {
      filter: {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId
      }
    });
    
    if (presencas.length > 0) {
      return updateRecord('formacao_presencas', presencas[0].id, { presente });
    } else {
      return createRecord('formacao_presencas', {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId,
        presente
      });
    }
  }
  
  async function submeterAvaliacao(formacaoId, colaboradorId, avaliacao) {
    return createRecord('formacao_avaliacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      score_conteudo: avaliacao.conteudo,
      score_formador: avaliacao.formador,
      score_organizacao: avaliacao.organizacao,
      comentario: avaliacao.comentario,
      recomendaria: avaliacao.recomendaria
    });
  }
  
  // --- DESLOCAÇÕES ---
  // IMPORTANTE: Queries Supabase devem estar numa única linha, sem quebras!
  async function getDeslocacoes() {
    const select = '*,criador:colaboradores!deslocacoes_criado_por_fkey(id,nome),deslocacao_colaboradores(id,colaborador_id,ordem,colaboradores(id,nome,departamento_id,departamentos(id,nome))),deslocacao_transportes(id,tipo_transporte_id,viatura_id,tipo_publico_id,motorista_id,ordem,observacoes,tipos_transporte(id,codigo,nome,requer_motorista,requer_viatura),frota(id,matricula,modelo,tipo,lugares),tipos_transporte_publico(id,codigo,nome),motorista:colaboradores(id,nome)),deslocacao_anexos(id,nome_ficheiro,url,tipo_ficheiro)';
    return retrieveWithRelations('deslocacoes', select);
  }
  
  async function getDeslocacaoById(id) {
    const select = '*,criador:colaboradores!deslocacoes_criado_por_fkey(id,nome),deslocacao_colaboradores(id,colaborador_id,ordem,colaboradores(id,nome,departamento_id,departamentos(id,nome))),deslocacao_transportes(id,tipo_transporte_id,viatura_id,tipo_publico_id,motorista_id,ordem,observacoes,tipos_transporte(id,codigo,nome,requer_motorista,requer_viatura),frota(id,matricula,modelo,tipo,lugares),tipos_transporte_publico(id,codigo,nome),motorista:colaboradores(id,nome)),deslocacao_anexos(id,nome_ficheiro,url,tipo_ficheiro)';
    const result = await retrieveWithRelations('deslocacoes', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createDeslocacao(data) {
    const { colaboradores, transportes, anexos, ...deslocacaoData } = data;
    
    // Criar deslocação
    const deslocacao = await createRecord('deslocacoes', deslocacaoData);
    
    // Adicionar colaboradores
    if (colaboradores && colaboradores.length > 0) {
      for (let i = 0; i < colaboradores.length; i++) {
        await createRecord('deslocacao_colaboradores', {
          deslocacao_id: deslocacao.id,
          colaborador_id: colaboradores[i],
          ordem: i + 1
        });
      }
    }
    
    // Adicionar transportes
    if (transportes && transportes.length > 0) {
      for (let i = 0; i < transportes.length; i++) {
        const t = transportes[i];
        await createRecord('deslocacao_transportes', {
          deslocacao_id: deslocacao.id,
          tipo_transporte_id: t.tipo_transporte_id,
          viatura_id: t.viatura_id || null,
          tipo_publico_id: t.tipo_publico_id || null,
          motorista_id: t.motorista_id || null,
          ordem: i + 1,
          observacoes: t.observacoes || null
        });
      }
    }
    
    return deslocacao;
  }
  
  async function updateDeslocacao(id, data) {
    return updateRecord('deslocacoes', id, data);
  }
  
  async function deleteDeslocacao(id) {
    // Eliminar registos relacionados primeiro
    const colaboradores = await retrieveMultipleRecords('deslocacao_colaboradores', {
      filter: { deslocacao_id: id }
    });
    for (const c of colaboradores) {
      await deleteRecord('deslocacao_colaboradores', c.id);
    }
    
    const transportes = await retrieveMultipleRecords('deslocacao_transportes', {
      filter: { deslocacao_id: id }
    });
    for (const t of transportes) {
      await deleteRecord('deslocacao_transportes', t.id);
    }
    
    const anexos = await retrieveMultipleRecords('deslocacao_anexos', {
      filter: { deslocacao_id: id }
    });
    for (const a of anexos) {
      await deleteRecord('deslocacao_anexos', a.id);
    }
    
    // Eliminar deslocação
    return deleteRecord('deslocacoes', id);
  }
  
  // ==========================================
  // ESTATÍSTICAS
  // ==========================================
  
  async function getFormacaoStats(colaboradorId = null) {
    const formacoes = await getFormacoes();
    
    let agendadas = 0;
    let inscritos = 0;
    let concluidas = 0;
    let avaliacoesPendentes = 0;
    
    formacoes.forEach(f => {
      if (f.estado === 'Agendada' || f.estado === 'Em Curso') agendadas++;
      if (f.estado === 'Concluída') concluidas++;
      
      const inscricoesAtivas = (f.formacao_inscricoes || []).filter(i => i.estado === 'Inscrito');
      inscritos += inscricoesAtivas.length;
      
      if (colaboradorId) {
        const estaInscrito = inscricoesAtivas.some(i => i.colaborador_id === colaboradorId);
        const jaAvaliou = (f.formacao_avaliacoes || []).some(a => a.colaborador_id === colaboradorId);
        if (f.estado === 'Concluída' && estaInscrito && !jaAvaliou) {
          avaliacoesPendentes++;
        }
      }
    });
    
    return { agendadas, inscritos, concluidas, avaliacoesPendentes };
  }
  
  async function getDeslocacaoStats(colaboradorId = null) {
    const deslocacoes = await getDeslocacoes();
    
    let total = deslocacoes.length;
    let pendentes = deslocacoes.filter(d => d.estado === 'Pendente Aprovação').length;
    let aprovadas = deslocacoes.filter(d => d.estado === 'Aprovada').length;
    let rascunhos = deslocacoes.filter(d => d.estado === 'Rascunho').length;
    
    return { total, pendentes, aprovadas, rascunhos };
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    // Funções genéricas (compatíveis com Power Pages webapi)
    retrieveMultipleRecords,
    retrieveRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    retrieveWithRelations,
    executeBatch,
    
    // Colaboradores
    getColaboradores,
    getColaboradorById,
    
    // Departamentos
    getDepartamentos,
    
    // Formadores
    getFormadores,
    
    // Entidades Formadoras
    getEntidadesFormadoras,
    
    // Frota
    getFrota,
    getFrotaDisponivel,
    
    // Tipos de Transporte
    getTiposTransporte,
    getTiposTransportePublico,
    
    // Formações
    getFormacoes,
    getFormacaoById,
    createFormacao,
    updateFormacao,
    inscreverFormacao,
    cancelarInscricaoFormacao,
    toggleFavoritoFormacao,
    registarPresenca,
    submeterAvaliacao,
    getFormacaoStats,
    
    // Deslocações
    getDeslocacoes,
    getDeslocacaoById,
    createDeslocacao,
    updateDeslocacao,
    deleteDeslocacao,
    getDeslocacaoStats
  };
  
})();

// Exportar para uso global
window.DataService = DataService;
