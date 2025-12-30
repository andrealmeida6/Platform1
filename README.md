# Portal do Colaborador - Protótipo

## 🏛️ Estrutura Power Pages-Ready

Este projeto está estruturado para facilitar a migração para **Microsoft Power Pages**. Cada pasta corresponde diretamente a um artefacto do Power Pages.

### 📁 Mapeamento de Estrutura

| Pasta/Ficheiro | Equivalente Power Pages | Descrição |
|----------------|------------------------|-------------|
| `_layouts/` | **Page Templates** | Templates base que definem a estrutura das páginas |
| `_includes/components/` | **Web Templates** | Componentes reutilizáveis (header, calendar, modals) |
| `snippets/` | **Snippets** | Blocos pequenos de UI/texto reutilizáveis |
| `web-files/` | **Web Files** | Assets estáticos (CSS, JS, imagens) |
| `web-pages/` | **Web Pages** | Páginas individuais do portal |

### 🛠️ Tecnologias

- **Jekyll** (GitHub Pages nativo) + **Liquid** (mesma engine do Power Pages)
- **Vanilla HTML/CSS/JS** (sem frameworks pesados)
- **CSS modular** (main.css + components.css + responsive.css)
- **JS componentizado** (app.js + calendar.js + modals.js)

### 🚀 Como Funciona

1. **GitHub Pages** usa Jekyll automaticamente (sem build manual)
2. Páginas em `web-pages/` usam layouts de `_layouts/`
3. Layouts incluem componentes de `_includes/`
4. Assets carregam de `web-files/`
5. Snippets são blocos reutilizáveis ultra-pequenos

### 🔄 Migração para Power Pages

Quando migrar para Power Pages:

1. **Page Templates**: Copiar `_layouts/*.html` → Power Pages Page Templates
2. **Web Templates**: Copiar `_includes/components/*.html` → Power Pages Web Templates
3. **Snippets**: Copiar `snippets/*.html` → Power Pages Snippets
4. **Web Files**: Upload de `web-files/*` → Power Pages Web Files
5. **Web Pages**: Criar páginas com base em `web-pages/*.html`

### 📝 Componentes Principais

#### Layouts (`_layouts/`)
- `default.html` - Layout base com header/footer
- `two-column.html` - Layout 2 colunas (conteúdo + sidebar)

#### Componentes (`_includes/components/`)
- `header.html` - Profile section + Quick actions
- `calendar.html` - Calendário dual-month com eventos
- `info-panel.html` - Painel lateral com eventos
- `notification-item.html` - Item de notificação reutilizável

#### Modais (`_includes/modals/`)
- `inventario.html` - Pedido de inventário
- `deslocacao.html` - Boletim de itinerário
- `reembolso.html` - Pedido de reembolso
- `medicina.html` - Agendamento medicina no trabalho
- `formacao.html` - Inscrição em formações

#### Snippets (`snippets/`)
- `legend-chip.html` - Chip individual da legenda
- `status-badge.html` - Badge de status genérico
- `empty-state.html` - Estado vazio reutilizável

### 🎨 CSS Modular

```
web-files/css/
├── main.css         # Estilos base + variáveis
├── components.css   # Componentes específicos
└── responsive.css   # Media queries
```

### ⚛️ JavaScript Componentizado

```
web-files/js/
├── app.js          # Inicialização + utilitários
├── calendar.js     # Lógica do calendário
└── modals.js       # Lógica dos modais
```

### 📌 Links Úteis

- **GitHub Pages**: https://andrealmeida6.github.io/Platform1/
- **Repositório**: https://github.com/andrealmeida6/Platform1
- **Jekyll Docs**: https://jekyllrb.com/docs/
- **Power Pages Docs**: https://learn.microsoft.com/power-pages/

### ✅ Status do Projeto

- [x] Estrutura Power Pages-ready
- [x] CSS 100% externo e modular
- [x] JS componentizado
- [x] Componentes independentes
- [x] Snippets reutilizáveis
- [x] Layouts flexíveis
- [x] GitHub Pages funcional
- [ ] Migração para Power Pages (próxima fase)

---

**Desenvolvido para KPMG Portugal / Recuperar Portugal**  
*Protótipo preparado para migração Power Pages*