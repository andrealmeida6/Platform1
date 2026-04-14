/**
 * excel-reader.js
 * Módulo de leitura e validação de ficheiros Excel (Balancete de Verificação)
 * Utiliza SheetJS (xlsx.js) para processamento 100% no browser
 */
var ExcelReader = (function() {
    'use strict';
    var COLUMN_ALIASES = {
        conta: ['conta', 'codigo', 'código', 'cod', 'cod_conta', 'codigo_conta', 'account', 'nº conta', 'num_conta', 'nr_conta'],
        designacao: ['designacao', 'designação', 'descricao', 'descrição', 'nome', 'nome_conta', 'description', 'desc'],
        saldo_dev_ini: ['saldo_dev_ini', 'saldo_devedor_inicial', 'sd_ini', 'sdi', 'devedor_ini', 'saldo_devedor_abertura', 'deb_ini', 'debito_ini'],
        saldo_cred_ini: ['saldo_cred_ini', 'saldo_credor_inicial', 'sc_ini', 'sci', 'credor_ini', 'saldo_credor_abertura', 'cred_ini', 'credito_ini'],
        mov_devedor: ['mov_devedor', 'movimentos_devedor', 'mov_deb', 'debitos', 'débitos', 'total_debito', 'total_débito', 'mov_dev'],
        mov_credor: ['mov_credor', 'movimentos_credor', 'mov_cred', 'creditos', 'créditos', 'total_credito', 'total_crédito', 'mov_cre'],
        saldo_dev_fin: ['saldo_dev_fin', 'saldo_devedor_final', 'sd_fin', 'sdf', 'devedor_fin', 'saldo_devedor_fecho', 'deb_fin', 'debito_fin'],
        saldo_cred_fin: ['saldo_cred_fin', 'saldo_credor_final', 'sc_fin', 'scf', 'credor_fin', 'saldo_credor_fecho', 'cred_fin', 'credito_fin'],
        ano_ant_devedor: ['ano_ant_devedor', 'ant_devedor', 'devedor_anterior', 'sd_ant', 'saldo_dev_ant', 'anterior_deb'],
        ano_ant_credor: ['ano_ant_credor', 'ant_credor', 'credor_anterior', 'sc_ant', 'saldo_cred_ant', 'anterior_cred']
    };
    var REQUIRED_COLUMNS = ['conta', 'designacao', 'saldo_dev_ini', 'saldo_cred_ini', 'mov_devedor', 'mov_credor', 'saldo_dev_fin', 'saldo_cred_fin'];

    function normalizeColumnName(name) {
        if (!name) return '';
        return String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    }

    function identifyColumn(headerName) {
        var normalized = normalizeColumnName(headerName);
        for (var standardName in COLUMN_ALIASES) {
            var aliases = COLUMN_ALIASES[standardName];
            for (var i = 0; i < aliases.length; i++) {
                if (normalizeColumnName(aliases[i]) === normalized) return standardName;
            }
        }
        return null;
    }

    function readFile(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = new Uint8Array(e.target.result);
                    var workbook = XLSX.read(data, { type: 'array' });
                    var sheetName = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[sheetName];
                    var rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    if (rawData.length < 2) { reject(new Error('O ficheiro Excel está vazio ou não contém dados suficientes.')); return; }
                    var headers = rawData[0];
                    var columnMap = {};
                    var unmappedHeaders = [];
                    for (var i = 0; i < headers.length; i++) {
                        var standardName = identifyColumn(headers[i]);
                        if (standardName) { columnMap[standardName] = i; } else if (String(headers[i]).trim()) { unmappedHeaders.push(String(headers[i])); }
                    }
                    var errors = [];
                    var warnings = [];
                    var missingColumns = [];
                    REQUIRED_COLUMNS.forEach(function(col) { if (columnMap[col] === undefined) missingColumns.push(col); });
                    if (missingColumns.length > 0) {
                        errors.push({ tipo: 'colunas_em_falta', mensagem: 'Colunas obrigatórias em falta: ' + missingColumns.join(', '), detalhe: 'Verifique se o ficheiro contém as colunas: conta, designação, saldos devedores/credores iniciais e finais, e movimentos.' });
                    }
                    var hasComparativo = columnMap['ano_ant_devedor'] !== undefined && columnMap['ano_ant_credor'] !== undefined;
                    if (!hasComparativo) { warnings.push({ tipo: 'sem_comparativo', mensagem: 'Colunas do ano anterior não encontradas. O relatório será gerado sem dados comparativos.', critico: false }); }
                    if (errors.length > 0) { resolve({ data: [], warnings: warnings, errors: errors, columnMap: columnMap, hasComparativo: false }); return; }
                    var balancete = [];
                    for (var row = 1; row < rawData.length; row++) {
                        var linha = rawData[row];
                        var conta = String(linha[columnMap['conta']] || '').trim();
                        if (!conta) continue;
                        conta = conta.replace(/[\.\s\-]/g, '');
                        if (!/^\d{2,}$/.test(conta)) { warnings.push({ tipo: 'conta_invalida', mensagem: 'Linha ' + (row + 1) + ': Conta "' + conta + '" não é um código numérico válido (mínimo 2 dígitos).', critico: false }); continue; }
                        var entry = {
                            conta: conta, designacao: String(linha[columnMap['designacao']] || '').trim(),
                            saldo_dev_ini: parseNumericValue(linha[columnMap['saldo_dev_ini']]),
                            saldo_cred_ini: parseNumericValue(linha[columnMap['saldo_cred_ini']]),
                            mov_devedor: parseNumericValue(linha[columnMap['mov_devedor']]),
                            mov_credor: parseNumericValue(linha[columnMap['mov_credor']]),
                            saldo_dev_fin: parseNumericValue(linha[columnMap['saldo_dev_fin']]),
                            saldo_cred_fin: parseNumericValue(linha[columnMap['saldo_cred_fin']]),
                            classe: conta.substring(0, 1), nivel: conta.length
                        };
                        if (hasComparativo) { entry.ano_ant_devedor = parseNumericValue(linha[columnMap['ano_ant_devedor']]); entry.ano_ant_credor = parseNumericValue(linha[columnMap['ano_ant_credor']]); }
                        balancete.push(entry);
                    }
                    if (balancete.length === 0) { errors.push({ tipo: 'sem_dados', mensagem: 'Nenhuma conta válida encontrada no balancete.' }); }
                    resolve({ data: balancete, warnings: warnings, errors: errors, columnMap: columnMap, hasComparativo: hasComparativo, totalContas: balancete.length, folha: sheetName });
                } catch (err) { reject(new Error('Erro ao processar o ficheiro Excel: ' + err.message)); }
            };
            reader.onerror = function() { reject(new Error('Erro ao ler o ficheiro. Verifique se é um ficheiro Excel válido.')); };
            reader.readAsArrayBuffer(file);
        });
    }

    function parseNumericValue(val) {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return val;
        var str = String(val).trim();
        str = str.replace(/[€$\s]/g, '');
        if (/\d+\.\d{3}/.test(str) && str.indexOf(',') > -1) { str = str.replace(/\./g, '').replace(',', '.'); }
        else if (str.indexOf(',') > -1 && str.indexOf('.') === -1) { str = str.replace(',', '.'); }
        if (/^\(.*\)$/.test(str)) { str = '-' + str.replace(/[()]/g, ''); }
        var num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    function validateBalancete(balancete) {
        var errors = [], warnings = [];
        var totalDevIni = 0, totalCredIni = 0, totalDevFin = 0, totalCredFin = 0;
        var hasClasse6 = false, hasClasse7 = false;
        var contasMaxNivel = getContasMaxNivel(balancete);
        contasMaxNivel.forEach(function(entry) {
            totalDevIni += entry.saldo_dev_ini; totalCredIni += entry.saldo_cred_ini;
            totalDevFin += entry.saldo_dev_fin; totalCredFin += entry.saldo_cred_fin;
            if (entry.classe === '6') hasClasse6 = true;
            if (entry.classe === '7') hasClasse7 = true;
            var saldoDevEsperado = entry.saldo_dev_ini + entry.mov_devedor - entry.mov_credor;
            var saldoLiquido = entry.saldo_dev_fin - entry.saldo_cred_fin;
            var diff = Math.abs(saldoDevEsperado - saldoLiquido);
            if (diff > 0.01 && entry.mov_devedor + entry.mov_credor > 0) {
                warnings.push({ tipo: 'saldo_inconsistente', mensagem: 'Conta ' + entry.conta + ' (' + entry.designacao + '): saldo final inconsistente com movimentos. Diferença: ' + diff.toFixed(2) + '€', critico: false });
            }
        });
        var diffIni = Math.abs(totalDevIni - totalCredIni);
        var diffFin = Math.abs(totalDevFin - totalCredFin);
        if (diffIni > 1) { warnings.push({ tipo: 'balancete_desequilibrado_ini', mensagem: 'Balancete inicial desequilibrado. Diferença: ' + diffIni.toFixed(2) + '€', critico: true }); }
        if (diffFin > 1) { errors.push({ tipo: 'balancete_desequilibrado_fin', mensagem: 'Balancete final desequilibrado. Diferença de ' + diffFin.toFixed(2) + '€ entre saldos devedores (' + totalDevFin.toFixed(2) + '€) e credores (' + totalCredFin.toFixed(2) + '€).' }); }
        if (!hasClasse6) { warnings.push({ tipo: 'sem_classe6', mensagem: 'Não foram encontradas contas da Classe 6 (Gastos). A Demonstração de Resultados ficará incompleta.', critico: true }); }
        if (!hasClasse7) { warnings.push({ tipo: 'sem_classe7', mensagem: 'Não foram encontradas contas da Classe 7 (Rendimentos). A Demonstração de Resultados ficará incompleta.', critico: true }); }
        return { isValid: errors.length === 0, errors: errors, warnings: warnings, resumo: { totalContas: contasMaxNivel.length, saldoDevIni: totalDevIni, saldoCredIni: totalCredIni, saldoDevFin: totalDevFin, saldoCredFin: totalCredFin } };
    }

    function getContasMaxNivel(balancete) {
        var contaCodes = balancete.map(function(e) { return e.conta; });
        return balancete.filter(function(entry) {
            return !contaCodes.some(function(code) { return code !== entry.conta && code.indexOf(entry.conta) === 0; });
        });
    }

    return { readFile: readFile, validateBalancete: validateBalancete, getContasMaxNivel: getContasMaxNivel, parseNumericValue: parseNumericValue };
})();
