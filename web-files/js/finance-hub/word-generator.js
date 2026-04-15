/**
 * word-generator.js
 * Geração do ficheiro Word (.docx) - Relatório e Contas completo
 * Biblioteca: docx.js via CDN | Página A4, margens 2.5cm, Arial 11pt/9pt
 */
var WordGenerator = (function() {
    'use strict';
    var MARGIN = 1417, A4_W = 11906, A4_H = 16838, CW = 11906 - 1417 * 2;
    var D;
    function initDocx() {
        D = window.docx;
        if (!D) throw new Error('Biblioteca docx.js não carregada. Verifique a ligação à internet e recarregue a página.');
        if (!D.Document || !D.Packer) throw new Error('Biblioteca docx.js carregada mas incompleta. Versão incompatível?');
    }

    function fmtPT(val, dec) {
        if (val === null || val === undefined || isNaN(val)) return '-';
        dec = dec !== undefined ? dec : 0;
        var neg = val < 0, abs = Math.abs(val);
        var p = abs.toFixed(dec).split('.');
        var r = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (dec > 0) r += ',' + p[1];
        return neg ? '(' + r + ')' : r;
    }

    function text(s, o) { o = o || {}; return new D.TextRun({ text: s || '', font: o.font || 'Arial', size: o.size || 22, bold: o.bold || false, italics: o.italics || false, color: o.color || '000000' }); }
    function para(ch, o) { o = o || {}; var c = { children: Array.isArray(ch) ? ch : [ch], alignment: o.alignment || D.AlignmentType.LEFT, spacing: o.spacing || { after: 120 } }; if (o.heading) c.heading = o.heading; if (o.indent) c.indent = o.indent; return new D.Paragraph(c); }

    function cell(content, o) {
        o = o || {};
        var w = o.width || Math.floor(CW / 3);
        var b = { style: D.BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
        var ch;
        if (typeof content === 'string' || typeof content === 'number') {
            ch = [para([text(String(content), { size: o.fontSize || 18, bold: o.bold || false, color: o.color || '000000' })], { alignment: o.alignment || D.AlignmentType.LEFT, spacing: { after: 40, before: 40 } })];
        } else ch = Array.isArray(content) ? content : [content];
        var cfg = { children: ch, width: { size: w, type: D.WidthType.DXA }, borders: { top: b, bottom: b, left: b, right: b }, margins: { top: 40, bottom: 40, left: 80, right: 80 } };
        if (o.shading) cfg.shading = { fill: o.shading, type: D.ShadingType.CLEAR };
        return new D.TableCell(cfg);
    }

    function finRow(nome, vN, vA, o) {
        o = o || {};
        var hdr = o.header, sub = o.subtotal, ind = o.indent || 0;
        var sh = hdr ? '2B5797' : (o.shading || null), tc = hdr ? 'FFFFFF' : '000000';
        var cw = o.colWidths || [Math.floor(CW*0.55), Math.floor(CW*0.225), CW-Math.floor(CW*0.55)-Math.floor(CW*0.225)];
        var nm = ind > 0 ? '  '.repeat(ind) + nome : nome;
        var fs = hdr ? 20 : 18;
        return new D.TableRow({ children: [
            cell(nm, { width: cw[0], bold: sub||hdr, shading: sh, color: tc, fontSize: fs }),
            cell(vN !== null && vN !== undefined ? fmtPT(vN) : '', { width: cw[1], alignment: D.AlignmentType.RIGHT, bold: sub, shading: sh, color: tc, fontSize: fs }),
            cell(vA !== null && vA !== undefined ? fmtPT(vA) : '', { width: cw[2], alignment: D.AlignmentType.RIGHT, bold: sub, shading: sh, color: tc, fontSize: fs })
        ]});
    }

    function gerarCapa(emp) {
        var ch = [];
        for (var i = 0; i < 6; i++) ch.push(para([text('')]));
        ch.push(para([text(emp.denominacao || 'Empresa', { size: 48, bold: true, color: '2B5797' })], { alignment: D.AlignmentType.CENTER }));
        ch.push(para([text('')]));
        if (emp.nif) ch.push(para([text('NIF: ' + emp.nif, { size: 24, color: '666666' })], { alignment: D.AlignmentType.CENTER }));
        ch.push(para([text('')])); ch.push(para([text('')]));
        ch.push(para([text('RELATÓRIO E CONTAS', { size: 40, bold: true })], { alignment: D.AlignmentType.CENTER }));
        ch.push(para([text('')]));
        ch.push(para([text('Exercício ' + (emp.exercicio || ''), { size: 32, color: '2B5797' })], { alignment: D.AlignmentType.CENTER }));
        ch.push(para([text('')])); ch.push(para([text('')]));
        ch.push(para([text('Normativo: ' + (emp.normativo || 'NCRF'), { size: 22, color: '666666' })], { alignment: D.AlignmentType.CENTER }));
        if (emp.sede) ch.push(para([text(emp.sede, { size: 20, color: '888888' })], { alignment: D.AlignmentType.CENTER }));
        for (var j = 0; j < 4; j++) ch.push(para([text('')]));
        var dt = new Date(); var dg = dt.getDate().toString().padStart(2,'0')+'/'+(dt.getMonth()+1).toString().padStart(2,'0')+'/'+dt.getFullYear();
        ch.push(para([text('Documento gerado em ' + dg, { size: 18, italics: true, color: '999999' })], { alignment: D.AlignmentType.CENTER }));
        return ch;
    }

    function gerarBalanco(bN, bA, ex, exA) {
        var ch = [], cw = [Math.floor(CW*0.55), Math.floor(CW*0.225), CW-Math.floor(CW*0.55)-Math.floor(CW*0.225)];
        ch.push(para([text('BALANÇO', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } }));
        ch.push(para([text('(valores expressos em euros)', { size: 18, italics: true, color: '666666' })], { spacing: { after: 200 } }));
        var rows = [];
        rows.push(finRow('RUBRICAS', ex||'N', exA||'N-1', { header: true, colWidths: cw }));
        [{k:'ativo_nao_corrente',t:'ATIVO NÃO CORRENTE'},{k:'ativo_corrente',t:'ATIVO CORRENTE'}].forEach(function(s) {
            rows.push(finRow(s.t, '', '', { subtotal: true, shading: 'E8EEF5', colWidths: cw }));
            bN[s.k].rubricas.forEach(function(r) { var va = bA ? SNCMapper.getValorRubrica(bA, r.id) : null; if (r.valor !== 0 || (va && va !== 0)) rows.push(finRow(r.nome, r.valor, va, { indent: 1, colWidths: cw })); });
            rows.push(finRow('Total '+s.t.charAt(0)+s.t.slice(1).toLowerCase(), bN[s.k].total, bA ? bA[s.k].total : null, { subtotal: true, shading: 'F5F5F5', colWidths: cw }));
        });
        rows.push(finRow('TOTAL DO ATIVO', bN.ativo_total, bA ? bA.ativo_total : null, { subtotal: true, shading: 'D6E4F0', colWidths: cw }));
        rows.push(finRow('', '', '', { colWidths: cw }));
        [{k:'capital_proprio',t:'CAPITAL PRÓPRIO'},{k:'passivo_nao_corrente',t:'PASSIVO NÃO CORRENTE'},{k:'passivo_corrente',t:'PASSIVO CORRENTE'}].forEach(function(s) {
            rows.push(finRow(s.t, '', '', { subtotal: true, shading: 'E8EEF5', colWidths: cw }));
            bN[s.k].rubricas.forEach(function(r) { var va = bA ? SNCMapper.getValorRubrica(bA, r.id) : null; if (r.valor !== null && (r.valor !== 0 || (va && va !== 0))) rows.push(finRow(r.nome, r.valor, va, { indent: 1, colWidths: cw })); });
            rows.push(finRow('Total '+s.t.charAt(0)+s.t.slice(1).toLowerCase(), bN[s.k].total, bA ? bA[s.k].total : null, { subtotal: true, shading: 'F5F5F5', colWidths: cw }));
        });
        rows.push(finRow('TOTAL DO PASSIVO', bN.passivo_total, bA ? bA.passivo_total : null, { subtotal: true, shading: 'F5F5F5', colWidths: cw }));
        rows.push(finRow('TOTAL DO CAPITAL PRÓPRIO E PASSIVO', bN.cp_passivo_total, bA ? bA.cp_passivo_total : null, { subtotal: true, shading: 'D6E4F0', colWidths: cw }));
        ch.push(new D.Table({ width: { size: CW, type: D.WidthType.DXA }, columnWidths: cw, rows: rows }));
        return ch;
    }

    function gerarDR(drN, drA, ex, exA) {
        var ch = [], cw = [Math.floor(CW*0.55), Math.floor(CW*0.225), CW-Math.floor(CW*0.55)-Math.floor(CW*0.225)];
        ch.push(para([text('DEMONSTRAÇÃO DE RESULTADOS POR NATUREZA', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } }));
        ch.push(para([text('(valores expressos em euros)', { size: 18, italics: true, color: '666666' })], { spacing: { after: 200 } }));
        var rows = [];
        rows.push(finRow('RUBRICAS', ex||'N', exA||'N-1', { header: true, colWidths: cw }));
        drN.rubricas.forEach(function(r) {
            var vN = r.valor, vA = drA ? (drA.valores[r.id]||0) : null;
            if (r.tipo === 'gasto' || r.tipo === 'gasto_liquido') { vN = -vN; if (vA !== null) vA = -vA; }
            if (vN !== 0 || (vA !== null && vA !== 0)) rows.push(finRow(r.nome, vN, vA, { indent: 1, colWidths: cw }));
        });
        rows.push(finRow('EBITDA', drN.subtotais.EBITDA, drA ? drA.subtotais.EBITDA : null, { subtotal: true, shading: 'E8EEF5', colWidths: cw }));
        rows.push(finRow('Resultado operacional (EBIT)', drN.subtotais.EBIT, drA ? drA.subtotais.EBIT : null, { subtotal: true, shading: 'E8EEF5', colWidths: cw }));
        rows.push(finRow('Resultado antes de impostos', drN.subtotais.RAI, drA ? drA.subtotais.RAI : null, { subtotal: true, shading: 'E8EEF5', colWidths: cw }));
        rows.push(finRow('RESULTADO LÍQUIDO DO PERÍODO', drN.subtotais.RL, drA ? drA.subtotais.RL : null, { subtotal: true, shading: 'D6E4F0', colWidths: cw }));
        ch.push(new D.Table({ width: { size: CW, type: D.WidthType.DXA }, columnWidths: cw, rows: rows }));
        return ch;
    }

    function gerarDACP(dacp, rl) {
        var ch = [];
        ch.push(para([text('DEMONSTRAÇÃO DAS ALTERAÇÕES NO CAPITAL PRÓPRIO', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } }));
        ch.push(para([text('(valores expressos em euros)', { size: 18, italics: true, color: '666666' })], { spacing: { after: 200 } }));
        var cw = [Math.floor(CW*0.35), Math.floor(CW*0.22), Math.floor(CW*0.22), CW-Math.floor(CW*0.35)-Math.floor(CW*0.22)-Math.floor(CW*0.22)];
        var rows = [];
        rows.push(new D.TableRow({ children: [cell('Componente',{width:cw[0],bold:true,shading:'2B5797',color:'FFFFFF',fontSize:18}),cell('Saldo Inicial',{width:cw[1],bold:true,shading:'2B5797',color:'FFFFFF',alignment:D.AlignmentType.RIGHT,fontSize:18}),cell('Movimentos',{width:cw[2],bold:true,shading:'2B5797',color:'FFFFFF',alignment:D.AlignmentType.RIGHT,fontSize:18}),cell('Saldo Final',{width:cw[3],bold:true,shading:'2B5797',color:'FFFFFF',alignment:D.AlignmentType.RIGHT,fontSize:18})] }));
        var tI=0,tM=0,tF=0;
        dacp.forEach(function(r) { tI+=r.saldo_inicial; tM+=r.movimentos; tF+=r.saldo_final;
            rows.push(new D.TableRow({ children: [cell(r.nome,{width:cw[0],fontSize:18}),cell(fmtPT(r.saldo_inicial),{width:cw[1],alignment:D.AlignmentType.RIGHT,fontSize:18}),cell(fmtPT(r.movimentos),{width:cw[2],alignment:D.AlignmentType.RIGHT,fontSize:18}),cell(fmtPT(r.saldo_final),{width:cw[3],alignment:D.AlignmentType.RIGHT,fontSize:18})] }));
        });
        rows.push(new D.TableRow({ children: [cell('Resultado líquido do período',{width:cw[0],fontSize:18}),cell('-',{width:cw[1],alignment:D.AlignmentType.RIGHT,fontSize:18}),cell(fmtPT(rl),{width:cw[2],alignment:D.AlignmentType.RIGHT,fontSize:18}),cell(fmtPT(rl),{width:cw[3],alignment:D.AlignmentType.RIGHT,fontSize:18})] }));
        tM+=rl; tF+=rl;
        rows.push(new D.TableRow({ children: [cell('TOTAL',{width:cw[0],bold:true,shading:'D6E4F0',fontSize:18}),cell(fmtPT(tI),{width:cw[1],bold:true,shading:'D6E4F0',alignment:D.AlignmentType.RIGHT,fontSize:18}),cell(fmtPT(tM),{width:cw[2],bold:true,shading:'D6E4F0',alignment:D.AlignmentType.RIGHT,fontSize:18}),cell(fmtPT(tF),{width:cw[3],bold:true,shading:'D6E4F0',alignment:D.AlignmentType.RIGHT,fontSize:18})] }));
        ch.push(new D.Table({ width: { size: CW, type: D.WidthType.DXA }, columnWidths: cw, rows: rows }));
        return ch;
    }

    function gerarDFC(dfc) {
        var ch = [];
        ch.push(para([text('DEMONSTRAÇÃO DOS FLUXOS DE CAIXA', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } }));
        ch.push(para([text('(Método indireto - valores expressos em euros)', { size: 18, italics: true, color: '666666' })], { spacing: { after: 200 } }));
        var cw = [Math.floor(CW*0.7), CW-Math.floor(CW*0.7)];
        var rows = [];
        rows.push(new D.TableRow({children:[cell('RUBRICAS',{width:cw[0],bold:true,shading:'2B5797',color:'FFFFFF',fontSize:18}),cell('Valor',{width:cw[1],bold:true,shading:'2B5797',color:'FFFFFF',alignment:D.AlignmentType.RIGHT,fontSize:18})]}));
        function secRow(t){return new D.TableRow({children:[cell(t,{width:cw[0],bold:true,shading:'E8EEF5',fontSize:18}),cell('',{width:cw[1],shading:'E8EEF5',fontSize:18})]});}
        function itemRow(n,v){return new D.TableRow({children:[cell('  '+n,{width:cw[0],fontSize:18}),cell(fmtPT(v),{width:cw[1],alignment:D.AlignmentType.RIGHT,fontSize:18})]});}
        function totRow(n,v){return new D.TableRow({children:[cell(n,{width:cw[0],bold:true,shading:'F5F5F5',fontSize:18}),cell(fmtPT(v),{width:cw[1],bold:true,shading:'F5F5F5',alignment:D.AlignmentType.RIGHT,fontSize:18})]});}
        rows.push(secRow('ATIVIDADES OPERACIONAIS'));
        dfc.operacionais.itens.forEach(function(i){rows.push(itemRow(i.nome,i.valor));});
        rows.push(totRow('Fluxos das atividades operacionais', dfc.operacionais.total));
        rows.push(secRow('ATIVIDADES DE INVESTIMENTO'));
        dfc.investimento.itens.forEach(function(i){rows.push(itemRow(i.nome,i.valor));});
        rows.push(totRow('Fluxos das atividades de investimento', dfc.investimento.total));
        rows.push(secRow('ATIVIDADES DE FINANCIAMENTO'));
        dfc.financiamento.itens.forEach(function(i){rows.push(itemRow(i.nome,i.valor));});
        rows.push(totRow('Fluxos das atividades de financiamento', dfc.financiamento.total));
        rows.push(new D.TableRow({children:[cell('Variação de caixa e seus equivalentes',{width:cw[0],bold:true,shading:'D6E4F0',fontSize:18}),cell(fmtPT(dfc.variacao_caixa),{width:cw[1],bold:true,shading:'D6E4F0',alignment:D.AlignmentType.RIGHT,fontSize:18})]}));
        rows.push(itemRow('Caixa e equivalentes no início do período', dfc.caixa_inicio));
        rows.push(new D.TableRow({children:[cell('Caixa e equivalentes no fim do período',{width:cw[0],bold:true,fontSize:18}),cell(fmtPT(dfc.caixa_fim),{width:cw[1],bold:true,alignment:D.AlignmentType.RIGHT,fontSize:18})]}));
        ch.push(new D.Table({ width: { size: CW, type: D.WidthType.DXA }, columnWidths: cw, rows: rows }));
        return ch;
    }

    function gerarIndicadores(indicadores) {
        var ch = [];
        ch.push(para([text('INDICADORES FINANCEIROS', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } }));
        var cw = [Math.floor(CW*0.45), Math.floor(CW*0.30), CW-Math.floor(CW*0.45)-Math.floor(CW*0.30)];
        var rows = [];
        rows.push(new D.TableRow({children:[cell('Indicador',{width:cw[0],bold:true,shading:'2B5797',color:'FFFFFF',fontSize:18}),cell('Valor',{width:cw[1],bold:true,shading:'2B5797',color:'FFFFFF',alignment:D.AlignmentType.RIGHT,fontSize:18}),cell('Fórmula',{width:cw[2],bold:true,shading:'2B5797',color:'FFFFFF',fontSize:16})]}));
        indicadores.forEach(function(ind, idx) {
            var sh = idx % 2 === 0 ? 'F9F9F9' : null;
            rows.push(new D.TableRow({children:[cell(ind.nome,{width:cw[0],bold:true,shading:sh,fontSize:18}),cell(Calculator.formatarIndicador(ind),{width:cw[1],alignment:D.AlignmentType.RIGHT,shading:sh,fontSize:18}),cell(ind.descricao,{width:cw[2],shading:sh,fontSize:16,color:'666666'})]}));
        });
        ch.push(new D.Table({ width: { size: CW, type: D.WidthType.DXA }, columnWidths: cw, rows: rows }));
        return ch;
    }

    function gerarAnexo(emp, notas) {
        var ch = [];
        ch.push(para([text('ANEXO ÀS DEMONSTRAÇÕES FINANCEIRAS', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } }));
        ch.push(para([text('1. Identificação da Entidade e Referencial Contabilístico', { size: 24, bold: true })], { spacing: { before: 200, after: 100 } }));
        ch.push(para([text(emp.denominacao + (emp.nif ? ' (NIF: ' + emp.nif + ')' : '') + ' adota o SNC, aplicando as ' + (emp.normativo||'NCRF') + ' como referencial contabilístico para o exercício de ' + (emp.exercicio||'') + '.', { size: 22 })]));
        if (emp.sede) ch.push(para([text('Sede: ' + emp.sede, { size: 22 })]));
        if (emp.cae) ch.push(para([text('CAE Principal: ' + emp.cae, { size: 22 })]));
        ch.push(para([text('2. Políticas Contabilísticas', { size: 24, bold: true })], { spacing: { before: 200, after: 100 } }));
        ch.push(para([text('As demonstrações financeiras foram preparadas de acordo com o SNC, no pressuposto da continuidade das operações e na base do acréscimo. As principais políticas contabilísticas adotadas são:', { size: 22 })]));
        ch.push(para([text('Ativos Fixos Tangíveis: Mensurados ao custo de aquisição deduzido das depreciações acumuladas. Depreciações pelo método das quotas constantes.', { size: 22 })], { indent: { left: 360 } }));
        ch.push(para([text('Inventários: Mensurados ao custo de aquisição ou ao valor realizável líquido, dos dois o mais baixo.', { size: 22 })], { indent: { left: 360 } }));
        ch.push(para([text('Clientes e outras contas a receber: Registados pelo valor nominal, deduzido de eventuais perdas por imparidade.', { size: 22 })], { indent: { left: 360 } }));
        [{n:3,t:'Descrição da Atividade',c:'descricao_atividade'},{n:4,t:'Eventos Relevantes do Período',c:'eventos_relevantes'},{n:5,t:'Eventos Após a Data de Balanço',c:'eventos_pos_balanco'},{n:6,t:'Passivos Contingentes e Compromissos',c:'passivos_contingentes'},{n:7,t:'Operações com Partes Relacionadas',c:'partes_relacionadas'},{n:8,t:'Honorários do ROC / Auditor',c:'honorarios_roc'},{n:9,t:'Outras Informações Relevantes',c:'outras_informacoes'}].forEach(function(nota) {
            ch.push(para([text(nota.n + '. ' + nota.t, { size: 24, bold: true })], { spacing: { before: 200, after: 100 } }));
            var txt = notas[nota.c];
            if (txt && txt.trim()) ch.push(para([text(txt, { size: 22 })]));
            else ch.push(para([text('[A preencher]', { size: 22, color: 'FF0000', italics: true })]));
        });
        if (emp.contabilista) { ch.push(para([text('')])); ch.push(para([text('O Contabilista Certificado: ' + emp.contabilista, { size: 22 })], { spacing: { before: 400 } })); }
        return ch;
    }

    function gerarDocumento(dados) {
        initDocx();
        var emp = dados.empresa, bN = dados.balancoN, bA = dados.balancoAnt, drN = dados.drN, drA = dados.drAnt;
        var ex = emp.exercicio || 'N', exA = emp.exercicio_comparativo || (parseInt(ex)-1).toString() || 'N-1';
        var rlDR = drN.subtotais.RL;
        bN.capital_proprio.rubricas.forEach(function(r) { if (r.id === 'RLP') { r.valor = rlDR; bN.capital_proprio.total += rlDR; } });
        bN.cp_passivo_total = bN.capital_proprio.total + bN.passivo_total;
        var hdr = emp.denominacao + (emp.nif ? ' | NIF: ' + emp.nif : '');
        var dg = new Date().toLocaleDateString('pt-PT');
        var pgProps = { page: { size: { width: A4_W, height: A4_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } };
        var rgCh = [para([text('RELATÓRIO DE GESTÃO', { size: 28, bold: true, color: '2B5797' })], { spacing: { after: 200 } })];
        var rg = dados.relatorioGestao || '';
        if (rg.trim()) rg.split('\n').forEach(function(p) { rgCh.push(para([text(p.trim(), { size: 22 })])); });
        else rgCh.push(para([text('[Relatório de Gestão a preencher]', { size: 22, color: 'FF0000', italics: true })]));
        var sections = [
            { properties: pgProps, children: gerarCapa(emp) },
            { properties: pgProps, headers: { default: new D.Header({ children: [para([text(hdr, { size: 16, color: '999999' })], { alignment: D.AlignmentType.RIGHT, spacing: { after: 0 } })] }) }, footers: { default: new D.Footer({ children: [para([text('Relatório e Contas '+ex+' | '+dg+'  ', { size: 16, color: '999999' }), new D.TextRun({ children: [D.PageNumber.CURRENT], font: 'Arial', size: 16, color: '999999' }), text(' / ', { size: 16, color: '999999' }), new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: '999999' })], { alignment: D.AlignmentType.CENTER, spacing: { before: 0 } })] }) }, children: rgCh },
            { properties: pgProps, children: gerarBalanco(bN, bA, ex, exA) },
            { properties: pgProps, children: gerarDR(drN, drA, ex, exA) },
            { properties: pgProps, children: gerarDACP(dados.dacp, rlDR) },
            { properties: pgProps, children: gerarDFC(dados.dfc) },
            { properties: pgProps, children: gerarAnexo(emp, dados.notas || {}) },
            { properties: pgProps, children: gerarIndicadores(dados.indicadores) }
        ];
        return new D.Document({ styles: { default: { document: { run: { font: 'Arial', size: 22 } } } }, sections: sections });
    }

    /**
     * Gera e descarrega o ficheiro Word
     * IMPORTANTE: Envolvido em try-catch para retornar Promise rejeitada em vez de throw síncrono
     */
    function gerarEDescarregar(dados) {
        try {
            var doc = gerarDocumento(dados);
            var fn = 'RelatorioContas_' + (dados.empresa.nif||'SemNIF') + '_' + (dados.empresa.exercicio||'Periodo') + '.docx';
            return D.Packer.toBlob(doc).then(function(blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a'); a.href = url; a.download = fn;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return fn;
            });
        } catch (err) {
            // Retornar Promise rejeitada em vez de throw síncrono
            return Promise.reject(err);
        }
    }

    return { gerarDocumento: gerarDocumento, gerarEDescarregar: gerarEDescarregar, fmtPT: fmtPT };
})();
