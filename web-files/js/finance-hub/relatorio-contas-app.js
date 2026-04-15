/**
 * relatorio-contas-app.js v2
 * Orquestrador - alinhado com template RC profissional (33 notas)
 */
var RCApp = (function() {
    'use strict';
    var state = { balancete: null, hasComparativo: false, balancoN: null, balancoAnt: null, drN: null, drAnt: null, dacp: null, dfc: null, indicadores: null, empresa: {}, notas: {}, mappingLoaded: false, currentStep: 1 };
    var LOCAL_STORAGE_KEY = 'rc_app_dados_v2';
    var EMPRESA_FIELDS = ['empDenominacao','empNIF','empFormaJuridica','empSede','empCAE','empAtividade','empDataConstituicao','empCapitalSocial','empNumAcoes','empValorNominal','empNumColaboradores','empContabilista','empExercicio','empDataFecho','empExercicioComp','empNormativo','empCidadeAssinatura','empDataAprovacao'];
    var NOTAS_MANUAIS = ['nota1','nota4','nota6','nota10','nota13','nota17','nota20','nota31','nota32','nota33'];

    function init() {
        console.log('[RC App v2] A inicializar...');
        var baseUrl = document.querySelector('meta[name="baseurl"]');
        var base = baseUrl ? baseUrl.getAttribute('content') : '';
        SNCMapper.loadMapping(base + '/web-files/js/finance-hub/mapping-ncrf.json')
            .then(function() { state.mappingLoaded = true; console.log('[RC App] Mapeamento SNC carregado'); })
            .catch(function(err) { console.error('[RC App] Erro mapeamento:', err); showMessage('Erro ao carregar configuração SNC. Recarregue a página.', 'error'); });
        setupFileUpload(); setupAutoSave(); loadFromLocalStorage(); showStep(1);
        setTimeout(function() { if (!window.docx) console.warn('[RC App] docx.js não detectada'); else console.log('[RC App] docx.js OK'); }, 5000);
    }

    function setupFileUpload() {
        var dz = document.getElementById('dropZone'), fi = document.getElementById('excelFile');
        if (!dz || !fi) { console.error('[RC App] dropZone/excelFile não encontrado!'); return; }
        dz.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); fi.click(); });
        dz.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.add('drag-over'); });
        dz.addEventListener('dragleave', function(e) { e.preventDefault(); dz.classList.remove('drag-over'); });
        dz.addEventListener('drop', function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag-over'); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });
        fi.addEventListener('change', function(e) { if (e.target.files.length > 0) handleFile(e.target.files[0]); });
    }

    function handleFile(file) {
        console.log('[RC App] Ficheiro:', file.name, file.size, 'bytes');
        var ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (['.xlsx','.xls'].indexOf(ext) === -1) { showMessage('Ficheiro inválido. Carregue .xlsx ou .xls.', 'error'); return; }
        showMessage('A processar ficheiro...', 'info'); updateFileInfo(file.name, 'A ler...');
        ExcelReader.readFile(file).then(function(result) {
            console.log('[RC App] Lido:', result.totalContas, 'contas');
            if (result.errors.length > 0) { showValidation(result.errors, result.warnings); updateFileInfo(file.name, 'Erros'); return; }
            state.balancete = result.data; state.hasComparativo = result.hasComparativo;
            updateFileInfo(file.name, result.totalContas + ' contas | folha "' + result.folha + '"' + (result.hasComparativo ? ' | com comparativo' : ''));
            var val = ExcelReader.validateBalancete(result.data);
            var warns = result.warnings.concat(val.warnings);
            if (!val.isValid) showValidation(val.errors, warns);
            else if (warns.length > 0) showValidation([], warns);
            else showMessage('Balancete carregado e validado com sucesso!', 'success');
            var btn = document.getElementById('btnProsseguir'); if (btn) btn.disabled = false;
        }).catch(function(err) { console.error('[RC App] Erro:', err); showMessage(err.message, 'error'); updateFileInfo('', 'Erro'); });
    }

    function collectEmpresa() {
        return { denominacao: getVal('empDenominacao'), nif: getVal('empNIF'), forma_juridica: getVal('empFormaJuridica'), sede: getVal('empSede'), cae: getVal('empCAE'), atividade: getVal('empAtividade'), data_constituicao: getVal('empDataConstituicao'), capital_social: getVal('empCapitalSocial'), num_acoes: getVal('empNumAcoes'), valor_nominal: getVal('empValorNominal'), num_colaboradores: getVal('empNumColaboradores'), contabilista: getVal('empContabilista'), exercicio: getVal('empExercicio'), data_fecho: getVal('empDataFecho'), exercicio_comparativo: getVal('empExercicioComp'), normativo: getVal('empNormativo'), cidade_assinatura: getVal('empCidadeAssinatura'), data_aprovacao: getVal('empDataAprovacao') };
    }
    function collectNotas() { var n = {}; NOTAS_MANUAIS.forEach(function(id) { n[id] = getVal(id); }); return n; }

    function processarDados() {
        if (!state.balancete || !state.mappingLoaded) { showMessage('Carregue o balancete e aguarde o mapeamento.', 'error'); return; }
        try {
            state.empresa = collectEmpresa();
            SNCMapper.setBalancete(state.balancete);
            state.balancoN = SNCMapper.processarBalanco('atual');
            if (state.hasComparativo) state.balancoAnt = SNCMapper.processarBalanco('anterior');
            state.drN = SNCMapper.processarDR('atual');
            if (state.hasComparativo) state.drAnt = SNCMapper.processarDR('anterior');
            var rlDR = state.drN.subtotais.RL;
            state.balancoN.capital_proprio.rubricas.forEach(function(r) { if (r.id === 'RLP') r.valor = rlDR; });
            state.balancoN.capital_proprio.total = state.balancoN.capital_proprio.rubricas.reduce(function(s, r) { return s + (r.valor || 0); }, 0);
            state.balancoN.cp_passivo_total = state.balancoN.capital_proprio.total + state.balancoN.passivo_total;
            state.dacp = SNCMapper.processarDACP();
            state.dfc = SNCMapper.processarDFC(state.drN, state.balancoN, state.balancoAnt);
            state.indicadores = Calculator.calcularIndicadores(state.balancoN, state.drN);
            var avisos = Calculator.verificarConsistencia(state.balancoN, state.drN, state.dfc);
            renderPreview();
            if (avisos.length > 0) renderAvisos(avisos);
            showStep(2);
            console.log('[RC App] Processado. RL:', rlDR);
        } catch (err) { console.error('[RC App] Erro:', err); showMessage('Erro: ' + err.message, 'error'); }
    }

    function renderPreview() {
        renderTablePreview('previewBalanco', state.balancoN, state.balancoAnt, state.empresa.exercicio);
        renderDRPreview('previewDR', state.drN, state.drAnt, state.empresa.exercicio);
        renderIndicadoresPreview('previewIndicadores', state.indicadores);
    }

    function renderTablePreview(cid, bN, bA, ex) {
        var c = document.getElementById(cid); if (!c) return;
        var f = Calculator.formatPT, eA = bA ? (parseInt(ex)-1) : 'N-1', cols = bA ? 3 : 2;
        var h = '<table class="preview-table"><thead><tr><th>Rubricas</th><th class="num">'+(ex||'N')+'</th>';
        if (bA) h += '<th class="num">'+eA+'</th>';
        h += '</tr></thead><tbody>';
        [{k:'ativo_nao_corrente',t:'ATIVO NÃO CORRENTE'},{k:'ativo_corrente',t:'ATIVO CORRENTE'}].forEach(function(s) {
            h += '<tr class="section-header"><td colspan="'+cols+'">'+s.t+'</td></tr>';
            bN[s.k].rubricas.forEach(function(r) {
                if (r.valor === 0 && (!bA || SNCMapper.getValorRubrica(bA, r.id) === 0)) return;
                h += '<tr><td class="indent">'+r.nome+'</td><td class="num">'+f(r.valor,0)+'</td>';
                if (bA) h += '<td class="num">'+f(SNCMapper.getValorRubrica(bA, r.id),0)+'</td>';
                h += '</tr>';
            });
            h += '<tr class="subtotal"><td>Total '+s.t.charAt(0)+s.t.slice(1).toLowerCase()+'</td><td class="num">'+f(bN[s.k].total,0)+'</td>';
            if (bA) h += '<td class="num">'+f(bA[s.k].total,0)+'</td>';
            h += '</tr>';
        });
        h += '<tr class="total"><td>TOTAL DO ATIVO</td><td class="num">'+f(bN.ativo_total,0)+'</td>';
        if (bA) h += '<td class="num">'+f(bA.ativo_total,0)+'</td>';
        h += '</tr><tr><td colspan="'+cols+'">&nbsp;</td></tr>';
        [{k:'capital_proprio',t:'CAPITAL PRÓPRIO'},{k:'passivo_nao_corrente',t:'PASSIVO NÃO CORRENTE'},{k:'passivo_corrente',t:'PASSIVO CORRENTE'}].forEach(function(s) {
            h += '<tr class="section-header"><td colspan="'+cols+'">'+s.t+'</td></tr>';
            bN[s.k].rubricas.forEach(function(r) {
                if (r.valor !== null && r.valor !== 0) {
                    h += '<tr><td class="indent">'+r.nome+'</td><td class="num">'+f(r.valor,0)+'</td>';
                    if (bA) h += '<td class="num">'+f(SNCMapper.getValorRubrica(bA, r.id),0)+'</td>';
                    h += '</tr>';
                }
            });
            h += '<tr class="subtotal"><td>Total '+s.t.charAt(0)+s.t.slice(1).toLowerCase()+'</td><td class="num">'+f(bN[s.k].total,0)+'</td>';
            if (bA) h += '<td class="num">'+f(bA[s.k].total,0)+'</td>';
            h += '</tr>';
        });
        h += '<tr class="total"><td>TOTAL CP + PASSIVO</td><td class="num">'+f(bN.cp_passivo_total,0)+'</td>';
        if (bA) h += '<td class="num">'+f(bA.cp_passivo_total,0)+'</td>';
        h += '</tr></tbody></table>'; c.innerHTML = h;
    }

    function renderDRPreview(cid, drN, drA, ex) {
        var c = document.getElementById(cid); if (!c) return;
        var f = Calculator.formatPT, eA = drA ? (parseInt(ex)-1) : null;
        var h = '<table class="preview-table"><thead><tr><th>Rubricas</th><th class="num">'+(ex||'N')+'</th>';
        if (drA) h += '<th class="num">'+eA+'</th>';
        h += '</tr></thead><tbody>';
        drN.rubricas.forEach(function(r) {
            var vN = (r.tipo==='gasto'||r.tipo==='gasto_liquido') ? -r.valor : r.valor;
            var vA = drA ? ((r.tipo==='gasto'||r.tipo==='gasto_liquido') ? -(drA.valores[r.id]||0) : (drA.valores[r.id]||0)) : null;
            if (vN === 0 && (vA === null || vA === 0)) return;
            h += '<tr><td class="indent">'+r.nome+'</td><td class="num">'+f(vN,0)+'</td>';
            if (drA) h += '<td class="num">'+f(vA,0)+'</td>';
            h += '</tr>';
        });
        [{n:'EBITDA',k:'EBITDA'},{n:'EBIT',k:'EBIT'},{n:'RAI',k:'RAI'},{n:'Resultado Líquido',k:'RL'}].forEach(function(s) {
            var cls = s.k === 'RL' ? 'total' : 'subtotal';
            h += '<tr class="'+cls+'"><td>'+s.n+'</td><td class="num">'+f(drN.subtotais[s.k],0)+'</td>';
            if (drA) h += '<td class="num">'+f(drA.subtotais[s.k],0)+'</td>';
            h += '</tr>';
        });
        h += '</tbody></table>'; c.innerHTML = h;
    }

    function renderIndicadoresPreview(cid, ind) {
        var c = document.getElementById(cid); if (!c) return;
        var h = '<table class="preview-table indicators-table"><thead><tr><th>Indicador</th><th class="num">Valor</th><th>Fórmula</th></tr></thead><tbody>';
        ind.forEach(function(i) { h += '<tr><td><strong>'+i.nome+'</strong></td><td class="num">'+Calculator.formatarIndicador(i)+'</td><td class="formula">'+i.descricao+'</td></tr>'; });
        h += '</tbody></table>'; c.innerHTML = h;
    }

    function renderAvisos(avisos) {
        var c = document.getElementById('consistencyWarnings'); if (!c || !avisos.length) return;
        var h = '<div class="rc-alert rc-alert-warning"><strong>Avisos:</strong><ul>';
        avisos.forEach(function(a) { h += '<li>'+a.mensagem+'</li>'; });
        c.innerHTML = h + '</ul></div>'; c.style.display = 'block';
    }

    function gerarWord() {
        console.log('[RC App] gerarWord()');
        if (!state.balancoN || !state.drN) { var msg = 'Dados não processados. Volte ao Passo 1.'; showMessage(msg, 'error'); alert(msg); return; }
        if (!window.docx) { var m2 = 'docx.js não carregada. Recarregue a página.'; showMessage(m2, 'error'); alert(m2); return; }
        try {
            showMessage('A gerar Word... Aguarde.', 'info');
            state.empresa = collectEmpresa(); state.notas = collectNotas();
            var rg = getVal('relatorioGestao'); saveToLocalStorage();
            var bClone = JSON.parse(JSON.stringify(state.balancoN));
            bClone.capital_proprio.rubricas.forEach(function(r) { if (r.id==='RLP') { bClone.capital_proprio.total -= r.valor||0; r.valor = null; } });
            bClone.cp_passivo_total = bClone.capital_proprio.total + bClone.passivo_total;
            var dados = { empresa: state.empresa, balancoN: bClone, balancoAnt: state.balancoAnt, drN: state.drN, drAnt: state.drAnt, dacp: state.dacp, dfc: state.dfc, indicadores: state.indicadores, relatorioGestao: rg, notas: state.notas };
            WordGenerator.gerarEDescarregar(dados)
                .then(function(fn) { showMessage('"'+fn+'" gerado! Verifique downloads.', 'success'); })
                .catch(function(err) { var e = 'Erro Word: '+(err.message||err); showMessage(e, 'error'); alert(e); });
        } catch (err) { var e = 'Erro: '+(err.message||err); showMessage(e, 'error'); alert(e); }
    }

    function showStep(step) {
        state.currentStep = step;
        for (var i = 1; i <= 3; i++) {
            var el = document.getElementById('step'+i); if (el) el.style.display = i === step ? 'block' : 'none';
            var ind = document.getElementById('stepIndicator'+i); if (ind) { ind.classList.toggle('active', i===step); ind.classList.toggle('completed', i<step); }
        }
        window.scrollTo(0, 0);
    }
    function getVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function showMessage(msg, type) {
        var c = document.getElementById('messageContainer'); if (!c) return;
        c.innerHTML = '<div class="rc-alert rc-alert-'+type+'">'+msg+'</div>'; c.style.display = 'block';
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (type==='success'||type==='info') setTimeout(function() { c.style.display = 'none'; }, 8000);
    }
    function showValidation(errors, warnings) {
        var c = document.getElementById('validationResults'); if (!c) return; var h = '';
        errors.forEach(function(e) { h += '<div class="rc-alert rc-alert-error">'+e.mensagem+(e.detalhe?'<br><small>'+e.detalhe+'</small>':'')+'</div>'; });
        warnings.forEach(function(w) { h += '<div class="rc-alert rc-alert-warning">'+w.mensagem+'</div>'; });
        c.innerHTML = h; c.style.display = 'block';
    }
    function updateFileInfo(name, info) {
        var n = document.getElementById('fileName'), i = document.getElementById('fileInfo');
        if (n) n.textContent = name; if (i) i.textContent = info;
        var c = document.getElementById('fileInfoContainer'); if (c) c.style.display = name ? 'flex' : 'none';
    }
    function setupAutoSave() {
        EMPRESA_FIELDS.concat(NOTAS_MANUAIS).concat(['relatorioGestao']).forEach(function(id) {
            var el = document.getElementById(id); if (el) el.addEventListener('change', function() { saveToLocalStorage(); });
        });
    }
    function saveToLocalStorage() {
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ empresa: collectEmpresa(), notas: collectNotas(), relatorioGestao: getVal('relatorioGestao') })); } catch (e) {}
    }
    function loadFromLocalStorage() {
        try {
            var saved = localStorage.getItem(LOCAL_STORAGE_KEY); if (!saved) return;
            var d = JSON.parse(saved);
            if (d.empresa) {
                var map = { empDenominacao: d.empresa.denominacao, empNIF: d.empresa.nif, empFormaJuridica: d.empresa.forma_juridica, empSede: d.empresa.sede, empCAE: d.empresa.cae, empAtividade: d.empresa.atividade, empDataConstituicao: d.empresa.data_constituicao, empCapitalSocial: d.empresa.capital_social, empNumAcoes: d.empresa.num_acoes, empValorNominal: d.empresa.valor_nominal, empNumColaboradores: d.empresa.num_colaboradores, empContabilista: d.empresa.contabilista, empExercicio: d.empresa.exercicio, empDataFecho: d.empresa.data_fecho, empExercicioComp: d.empresa.exercicio_comparativo, empNormativo: d.empresa.normativo, empCidadeAssinatura: d.empresa.cidade_assinatura, empDataAprovacao: d.empresa.data_aprovacao };
                for (var id in map) { var el = document.getElementById(id); if (el && map[id]) el.value = map[id]; }
            }
            if (d.notas) { for (var nid in d.notas) { var el = document.getElementById(nid); if (el && d.notas[nid]) el.value = d.notas[nid]; } }
            if (d.relatorioGestao) { var el = document.getElementById('relatorioGestao'); if (el) el.value = d.relatorioGestao; }
        } catch (e) {}
    }

    return { init: init, processarDados: processarDados, gerarWord: gerarWord, showStep: showStep, state: state };
})();
document.addEventListener('DOMContentLoaded', function() { RCApp.init(); });
