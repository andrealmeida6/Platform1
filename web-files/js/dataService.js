// ===================================================================
// DATA SERVICE - Camada de Abstração para Supabase/Power Pages
// ===================================================================

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
  
  // Expor URL e Headers para outros serviços
  function getBaseUrl() {
    return SUPABASE_URL;
  }
  
  function getHeaders() {
    return { ...headers };
  }
  
  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  
  async function retrieveMultipleRecords(entityName, options = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${entityName}`;
      const params = new URLSearchParams();
      
      if (options.select) {
        params.append('select', options.select);
      }
      
      if (options.filter) {
        Object.keys(options.filter).forEach(key => {
          const value = options.filter[key];
          if (typeof value === 'object') {
            Object.keys(value).forEach(op => {
              params.append(key, `${op}.${value[op]}`);
            });
          } else {
            params.append(key, `eq.${value}`);
          }
        });
      }
      
      if (options.orderby) {
        params.append('order', options.orderby);
      }
      
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
  
  async function retrieveWithRelations(entityName, select, filter = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${entityName}?select=${encodeURIComponent(select)}`;
      
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
  
  // ==========================================
  // FUNÇÕES ESPECÍFICAS POR ENTIDADE
  // ==========================================
  
  async function getColaboradores() {
    return retrieveWithRelations('colaboradores', '*,departamentos(id,codigo,nome)', { ativo: true });
  }
  
  async function getColaboradorById(id) {
    const result = await retrieveWithRelations('colaboradores', '*,departamentos(id,codigo,nome)', { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function getDepartamentos() {
    return retrieveMultipleRecords('departamentos', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  async function getFormadores() {
    return retrieveWithRelations('formadores', '*,entidades_formadoras(id,nome)', { ativo: true });
  }
  
  async function getEntidadesFormadoras() {
    return retrieveMultipleRecords('entidades_formadoras', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  async function getFrota() {
    return retrieveMultipleRecords('frota', { orderby: 'modelo.asc' });
  }
  
  async function getFrotaDisponivel() {
    return retrieveMultipleRecords('frota', {
      filter: { disponivel: true },
      orderby: 'modelo.asc'
    });
  }
  
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
  async function getFormacoes() {
    const select = '*,entidades_formadoras(id,codigo,nome),formadores(id,nome,especialidade,tipo),formacao_sessoes(id,data,hora_inicio,hora_fim),formacao_inscricoes(id,colaborador_id,estado),formacao_departamentos(id,departamento_id,departamentos(id,codigo,nome)),formacao_favoritos(id,colaborador_id),formacao_presencas(id,colaborador_id,presente),formacao_resultados(id,colaborador_id,resultado),formacao_avaliacoes(id,colaborador_id,score_conteudo,score_formador,score_organizacao,comentario,created_at),formacao_formadores(id,formador_id,entidade_id,principal,formadores(id,nome),entidades_formadoras(id,nome))';
    return retrieveWithRelations('formacoes', select);
  }
  
  async function getFormacaoById(id) {
    const select = '*,entidades_formadoras(id,codigo,nome),formadores(id,nome,especialidade,tipo),formacao_sessoes(id,data,hora_inicio,hora_fim),formacao_inscricoes(id,colaborador_id,estado,colaboradores(id,nome,email,departamento_id)),formacao_departamentos(id,departamento_id,departamentos(id,codigo,nome)),formacao_favoritos(id,colaborador_id),formacao_presencas(id,colaborador_id,presente),formacao_resultados(id,colaborador_id,resultado),formacao_avaliacoes(id,colaborador_id,score_conteudo,score_formador,score_organizacao,comentario,created_at),formacao_formadores(id,formador_id,entidade_id,principal,formadores(id,nome),entidades_formadoras(id,nome))';
    const result = await retrieveWithRelations('formacoes', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createFormacao(data) {
    const { sessoes, departamentos_alvo, formadores_ids, entidades_ids, ...formacaoData } = data;
    const formacao = await createRecord('formacoes', formacaoData);
    
    if (sessoes && sessoes.length > 0) {
      for (const sessao of sessoes) {
        await createRecord('formacao_sessoes', {
          formacao_id: formacao.id,
          data: sessao.data,
          hora_inicio: sessao.hora_inicio || sessao.horaInicio,
          hora_fim: sessao.hora_fim || sessao.horaFim
        });
      }
    }
    
    if (departamentos_alvo && departamentos_alvo.length > 0) {
      for (const depId of departamentos_alvo) {
        await createRecord('formacao_departamentos', {
          formacao_id: formacao.id,
          departamento_id: depId
        });
      }
    }
    
    // Múltiplos formadores
    if (formadores_ids && formadores_ids.length > 0) {
      for (let i = 0; i < formadores_ids.length; i++) {
        await createRecord('formacao_formadores', {
          formacao_id: formacao.id,
          formador_id: formadores_ids[i],
          principal: i === 0
        });
      }
    }
    
    // Múltiplas entidades
    if (entidades_ids && entidades_ids.length > 0) {
      for (let i = 0; i < entidades_ids.length; i++) {
        await createRecord('formacao_formadores', {
          formacao_id: formacao.id,
          entidade_id: entidades_ids[i],
          principal: !formadores_ids?.length && i === 0
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
    const inscricoes = await retrieveMultipleRecords('formacao_inscricoes', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
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
    const favoritos = await retrieveMultipleRecords('formacao_favoritos', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (favoritos.length > 0) {
      await deleteRecord('formacao_favoritos', favoritos[0].id);
      return false;
    } else {
      await createRecord('formacao_favoritos', {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId
      });
      return true;
    }
  }
  
  async function registarPresenca(formacaoId, colaboradorId, presente) {
    const presencas = await retrieveMultipleRecords('formacao_presencas', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
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
  
  // --- PEDIDOS DE FORMAÇÃO ---
  async function getPedidosFormacao() {
    const select = '*,solicitante:colaboradores!pedidos_formacao_solicitante_id_fkey(id,nome,email,departamento_id,departamentos(id,codigo,nome)),departamentos(id,codigo,nome),dirigente:colaboradores!pedidos_formacao_dirigente_id_fkey(id,nome),rh_aprovador:colaboradores!pedidos_formacao_rh_aprovador_id_fkey(id,nome),pedidos_formacao_historico(id,acao,estado_anterior,estado_novo,comentario,user_id,user_nome,created_at)';
    return retrieveWithRelations('pedidos_formacao', select);
  }
  
  async function getPedidoFormacaoById(id) {
    const select = '*,solicitante:colaboradores!pedidos_formacao_solicitante_id_fkey(id,nome,email,departamento_id,departamentos(id,codigo,nome)),departamentos(id,codigo,nome),dirigente:colaboradores!pedidos_formacao_dirigente_id_fkey(id,nome),rh_aprovador:colaboradores!pedidos_formacao_rh_aprovador_id_fkey(id,nome),pedidos_formacao_historico(id,acao,estado_anterior,estado_novo,comentario,user_id,user_nome,created_at)';
    const result = await retrieveWithRelations('pedidos_formacao', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createPedidoFormacao(data) {
    return createRecord('pedidos_formacao', data);
  }
  
  async function updatePedidoFormacao(id, data) {
    return updateRecord('pedidos_formacao', id, data);
  }
  
  async function aprovarPedidoDirigente(pedidoId, dirigenteId, comentario = '') {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'pendente_rh',
      dirigente_id: dirigenteId,
      dirigente_decisao: 'aprovado',
      dirigente_comentario: comentario,
      dirigente_data: new Date().toISOString()
    });
  }
  
  async function rejeitarPedidoDirigente(pedidoId, dirigenteId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'rejeitado',
      dirigente_id: dirigenteId,
      dirigente_decisao: 'rejeitado',
      dirigente_comentario: comentario,
      dirigente_data: new Date().toISOString()
    });
  }
  
  async function devolverPedidoDirigente(pedidoId, dirigenteId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'devolvido',
      dirigente_id: dirigenteId,
      dirigente_decisao: 'devolvido',
      dirigente_comentario: comentario,
      dirigente_data: new Date().toISOString()
    });
  }
  
  async function aprovarPedidoRH(pedidoId, rhId, comentario = '') {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'aprovado',
      rh_aprovador_id: rhId,
      rh_decisao: 'aprovado',
      rh_comentario: comentario,
      rh_data: new Date().toISOString()
    });
  }
  
  async function rejeitarPedidoRH(pedidoId, rhId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'rejeitado',
      rh_aprovador_id: rhId,
      rh_decisao: 'rejeitado',
      rh_comentario: comentario,
      rh_data: new Date().toISOString()
    });
  }
  
  async function devolverPedidoRH(pedidoId, rhId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'devolvido',
      rh_aprovador_id: rhId,
      rh_decisao: 'devolvido',
      rh_comentario: comentario,
      rh_data: new Date().toISOString()
    });
  }
  
  async function addHistoricoPedido(pedidoId, acao, userId, userName, comentario = '', estadoAnterior = null, estadoNovo = null) {
    return createRecord('pedidos_formacao_historico', {
      pedido_id: pedidoId,
      acao,
      user_id: userId,
      user_nome: userName,
      comentario,
      estado_anterior: estadoAnterior,
      estado_novo: estadoNovo
    });
  }
  
  // --- DESLOCAÇÕES ---
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
    const deslocacao = await createRecord('deslocacoes', deslocacaoData);
    
    if (colaboradores && colaboradores.length > 0) {
      for (let i = 0; i < colaboradores.length; i++) {
        await createRecord('deslocacao_colaboradores', {
          deslocacao_id: deslocacao.id,
          colaborador_id: colaboradores[i],
          ordem: i + 1
        });
      }
    }
    
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
    const colaboradores = await retrieveMultipleRecords('deslocacao_colaboradores', { filter: { deslocacao_id: id } });
    for (const c of colaboradores) {
      await deleteRecord('deslocacao_colaboradores', c.id);
    }
    
    const transportes = await retrieveMultipleRecords('deslocacao_transportes', { filter: { deslocacao_id: id } });
    for (const t of transportes) {
      await deleteRecord('deslocacao_transportes', t.id);
    }
    
    const anexos = await retrieveMultipleRecords('deslocacao_anexos', { filter: { deslocacao_id: id } });
    for (const a of anexos) {
      await deleteRecord('deslocacao_anexos', a.id);
    }
    
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
  
  // Função auxiliar para limpar prefixos de nomes
  function cleanFormadorName(nome) {
    if (!nome) return '';
    return nome.replace(/^(Dra?\.?|Eng\.?|Prof\.?|Sr\.?a?)\s*/gi, '').trim();
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    // Configuração (para outros serviços)
    getBaseUrl,
    getHeaders,
    
    // Funções genéricas
    retrieveMultipleRecords,
    retrieveRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    retrieveWithRelations,
    
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
    
    // Pedidos de Formação
    getPedidosFormacao,
    getPedidoFormacaoById,
    createPedidoFormacao,
    updatePedidoFormacao,
    aprovarPedidoDirigente,
    rejeitarPedidoDirigente,
    devolverPedidoDirigente,
    aprovarPedidoRH,
    rejeitarPedidoRH,
    devolverPedidoRH,
    addHistoricoPedido,
    
    // Deslocações
    getDeslocacoes,
    getDeslocacaoById,
    createDeslocacao,
    updateDeslocacao,
    deleteDeslocacao,
    getDeslocacaoStats,
    
    // Utilitários
    cleanFormadorName
  };
  
})();

window.DataService = DataService;
