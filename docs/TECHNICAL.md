# Documentação Técnica - Platform1

## Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Base de Dados](#base-de-dados)
5. [Módulos Funcionais](#módulos-funcionais)
6. [Guia de Migração para Power Pages](#guia-de-migração-para-power-pages)

---

## Visão Geral do Projeto

O Platform1 é um portal de colaborador desenvolvido como protótipo para posterior migração para Microsoft Power Pages. O sistema implementa funcionalidades de gestão de formações, deslocações, inventário e reembolsos.

### Tecnologias Utilizadas

| Tecnologia | Utilização |
|------------|------------|
| Jekyll | Gerador de sites estáticos (GitHub Pages) |
| Liquid | Template engine (compatível com Power Pages) |
| Supabase | Backend como serviço (PostgreSQL) |
| Vanilla JS | Lógica de frontend sem frameworks |
| CSS Modular | Estilos organizados por componente |

### Funcionalidades Principais

- **Gestão de Formações**: Criação, inscrição, alocação, presenças e avaliações
- **Gestão de Deslocações**: Pedidos, aprovações e tracking
- **Gestão de Inventário**: Atribuição de artigos a colaboradores
- **Sistema de Notificações**: Alertas dinâmicos por tipo de evento
- **Controlo de Acessos**: Roles e permissões por departamento

---

## Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Frontend)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Jekyll    │  │   Liquid    │  │  Vanilla JS │         │
│  │  (Build)    │  │ (Templates) │  │  (Lógica)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │  PostgREST  │  │    Auth     │         │
│  │   (Data)    │  │    (API)    │  │  (Futuro)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Camadas da Aplicação

1. **Apresentação**: HTML + CSS + Templates Liquid
2. **Lógica de Negócio**: JavaScript (DataService, AuthService)
3. **Persistência**: Supabase PostgreSQL via REST API

---

## Estrutura de Pastas

```
Platform1/
├── _includes/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── header.html
│   │   ├── calendar-section.html
│   │   ├── profile-section.html
│   │   └── quick-actions.html
│   └── modals/              # Modais do sistema
├── _layouts/
│   └── default.html         # Layout base
├── docs/                    # Documentação (esta pasta)
├── snippets/                # Blocos pequenos reutilizáveis
├── web-files/
│   ├── css/
│   │   ├── main.css
│   │   ├── components.css
│   │   └── responsive.css
│   └── js/
│       ├── app.js
│       ├── authService.js
│       ├── dataService.js
│       ├── calendar.js
│       ├── formacao.js
│       └── ...
├── index.html               # Página principal
├── formacao.html            # Lista de formações
├── formacao-detalhe.html    # Detalhe de formação
├── deslocacoes.html         # Lista de deslocações
└── ...
```

### Mapeamento para Power Pages

| Pasta Atual | Artefacto Power Pages |
|-------------|----------------------|
| `_layouts/` | Page Templates |
| `_includes/components/` | Web Templates |
| `snippets/` | Content Snippets |
| `web-files/css/` | Web Files (CSS) |
| `web-files/js/` | Web Files (JS) |
| `*.html` (raiz) | Web Pages |

---

## Base de Dados

### Diagrama ER (Principais Entidades)

```
┌──────────────────┐       ┌──────────────────┐
│   colaboradores  │       │   departamentos  │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │───┐   │ id (PK)          │
│ nome             │   │   │ codigo           │
│ email            │   │   │ nome             │
│ departamento_id  │───┼──►│ ativo            │
│ role_id          │   │   └──────────────────┘
│ cargo            │   │
└──────────────────┘   │   ┌──────────────────┐
                       │   │      roles       │
                       │   ├──────────────────┤
                       └──►│ id (PK)          │
                           │ codigo           │
                           │ nome             │
                           │ permissoes       │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────────┐
│    formacoes     │       │  formacao_inscricoes │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │◄──────│ formacao_id (FK)     │
│ titulo           │       │ colaborador_id (FK)  │
│ tipo             │       │ estado               │
│ estado           │       │ tipo_inscricao       │
│ duracao_horas    │       └──────────────────────┘
│ entidade_id      │
└──────────────────┘       ┌──────────────────────┐
        │                  │ formacao_notificacoes│
        │                  ├──────────────────────┤
        └─────────────────►│ formacao_id (FK)     │
                           │ colaborador_id (FK)  │
                           │ tipo                 │
                           │ titulo               │
                           │ mensagem             │
                           │ lida                 │
                           └──────────────────────┘
```

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `colaboradores` | Dados dos funcionários |
| `departamentos` | Unidades orgânicas |
| `roles` | Perfis de acesso |
| `formacoes` | Cursos de formação |
| `formacao_inscricoes` | Inscrições em formações |
| `formacao_sessoes` | Sessões/datas de formação |
| `formacao_presencas` | Registo de presenças |
| `formacao_avaliacoes` | Avaliações/feedback |
| `formacao_notificacoes` | Notificações do sistema |
| `deslocacoes` | Pedidos de deslocação |
| `artigos_inventario` | Catálogo de artigos |
| `atribuicoes_inventario` | Artigos atribuídos |

### Tipos de Notificação

| Tipo | Descrição |
|------|-----------|
| `alocacao` | Colaborador foi alocado a formação |
| `lembrete_sessao` | Lembrete de sessão próxima |
| `sessao_iniciada` | Sessão começou |
| `questionario_formacao` | Pedido de avaliação |
| `formacao_concluida` | Formação terminou |
| `formacao_cancelada` | Formação foi cancelada |
| `resultado_disponivel` | Resultado de avaliação disponível |

---

## Módulos Funcionais

### 1. Módulo de Formação

**Fluxo de Estados:**
```
Rascunho → Pendente Aprovação → Agendada → Em Curso → Concluída
                                    ↓
                               Cancelada
```

**Funcionalidades:**
- Criação e edição de formações
- Gestão de sessões e datas
- Inscrição voluntária e alocação obrigatória
- Registo de presenças (código QR/manual)
- Avaliação pós-formação
- Notificações automáticas

### 2. Módulo de Notificações

**Carregamento Dinâmico:**
```javascript
// Ao carregar a página inicial, o sistema:
// 1. Verifica formações concluídas sem avaliação
// 2. Cria notificações automaticamente
// 3. Apresenta todas as notificações ordenadas

await DataService.getNotificacoesColaboradorCompletas(userId);
```

### 3. Módulo de Deslocações

**Fluxo de Aprovação:**
```
Rascunho → Pendente Aprovação → Aprovada → Concluída
              ↓                    ↓
          Rejeitada            Cancelada
```

### 4. Módulo de Inventário

- Catálogo de artigos por categoria
- Atribuição a colaboradores
- Tracking de estado (Ativo, Devolvido, Abatido)

---

## Guia de Migração para Power Pages

### Pré-requisitos

1. Ambiente Power Platform com licença Power Pages
2. Dataverse configurado
3. Acesso de administrador ao ambiente

### Passo 1: Configurar Dataverse

#### 1.1 Criar Tabelas (Entities)

Criar as seguintes tabelas no Dataverse, mapeando da estrutura atual:

| Tabela Supabase | Tabela Dataverse | Prefixo Sugerido |
|-----------------|------------------|------------------|
| `colaboradores` | `cr_colaborador` | cr_ |
| `departamentos` | `cr_departamento` | cr_ |
| `formacoes` | `cr_formacao` | cr_ |
| `formacao_inscricoes` | `cr_formacao_inscricao` | cr_ |
| `formacao_notificacoes` | `cr_formacao_notificacao` | cr_ |

#### 1.2 Criar Relações

```
cr_colaborador (N:1) → cr_departamento
cr_formacao_inscricao (N:1) → cr_formacao
cr_formacao_inscricao (N:1) → cr_colaborador
cr_formacao_notificacao (N:1) → cr_colaborador
cr_formacao_notificacao (N:1) → cr_formacao
```

### Passo 2: Criar Web Templates

Converter os componentes `_includes/components/*.html` para Web Templates:

**Exemplo - Conversão de Notificações:**

> **Nota:** O código abaixo é específico para Power Pages e não executa em Jekyll/GitHub Pages.

{% raw %}
```html
<!-- Antes (Jekyll/Liquid atual) -->
{% for notif in notificacoes %}
  <div class="notification-item">{{ notif.titulo }}</div>
{% endfor %}

<!-- Depois (Power Pages Liquid) -->
{% fetchxml notifications %}
<fetch>
  <entity name="cr_formacao_notificacao">
    <attribute name="cr_titulo" />
    <attribute name="cr_mensagem" />
    <attribute name="cr_lida" />
    <filter>
      <condition attribute="cr_colaboradorid" operator="eq" value="{{ user.id }}" />
    </filter>
    <order attribute="createdon" descending="true" />
  </entity>
</fetch>
{% endfetchxml %}

{% for notif in notifications.results.entities %}
  <div class="notification-item {% unless notif.cr_lida %}unread{% endunless %}">
    {{ notif.cr_titulo }}
  </div>
{% endfor %}
```
{% endraw %}

### Passo 3: Configurar Web API

#### 3.1 Habilitar Web API para as tabelas

No Power Pages Studio:
1. Ir a **Set up** → **Site Settings**
2. Adicionar: `Webapi/cr_formacao_notificacao/enabled` = `true`
3. Adicionar: `Webapi/cr_formacao_notificacao/fields` = `*`

#### 3.2 Configurar Table Permissions

Criar permissões para cada tabela:
- **Scope**: Contact
- **Privileges**: Read, Write, Create (conforme necessário)

### Passo 4: Converter JavaScript

**Antes (Supabase REST):**
```javascript
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/formacao_notificacoes?colaborador_id=eq.${userId}`,
  { headers }
);
```

**Depois (Power Pages Web API):**
```javascript
webapi.safeAjax({
  type: "GET",
  url: "/_api/cr_formacao_notificacoes?$filter=_cr_colaboradorid_value eq " + userId,
  contentType: "application/json",
  success: function(data) {
    renderNotificacoes(data.value);
  }
});
```

### Passo 5: Migrar CSS e Assets

1. No Power Pages Studio, ir a **Styling** → **Custom CSS**
2. Copiar conteúdo de `web-files/css/main.css`
3. Ajustar variáveis CSS se necessário

**Ou** fazer upload como Web Files:
1. Ir a **Set up** → **Web files**
2. Upload de `main.css`, `components.css`, `responsive.css`

### Passo 6: Criar Page Templates

Converter `_layouts/default.html`:

{% raw %}
```html
<!-- Power Pages Page Template -->
{% include 'Header' %}

<main class="main-content">
  {% block content %}{% endblock %}
</main>

{% include 'Footer' %}

<!-- Scripts -->
<script src="~/js/app.js"></script>
```
{% endraw %}

### Passo 7: Configurar Autenticação

1. Ir a **Set up** → **Identity providers**
2. Configurar Azure AD B2C ou outro provider
3. Mapear utilizadores para contactos Dataverse

### Checklist de Migração

- [ ] Tabelas Dataverse criadas
- [ ] Relações configuradas
- [ ] Web Templates convertidos
- [ ] Web API habilitada
- [ ] Table Permissions configuradas
- [ ] JavaScript convertido para webapi.safeAjax
- [ ] CSS migrado
- [ ] Page Templates criados
- [ ] Autenticação configurada
- [ ] Testes de integração
- [ ] Migração de dados (se aplicável)

### Diferenças Chave

| Aspeto | Jekyll/Supabase | Power Pages |
|--------|-----------------|-------------|
| Template Engine | Liquid | Liquid (sintaxe similar) |
| API | REST direto | webapi.safeAjax |
| Auth | Custom/Supabase Auth | Power Pages Identity |
| Data | PostgreSQL | Dataverse |
| Hosting | GitHub Pages | Power Platform |
| Filtros Liquid | `where:` | FetchXML |

### Recursos Úteis

- [Power Pages Documentation](https://learn.microsoft.com/power-pages/)
- [Liquid Reference](https://learn.microsoft.com/power-pages/configure/liquid/liquid-overview)
- [Web API Reference](https://learn.microsoft.com/power-pages/configure/web-api-overview)
- [FetchXML Reference](https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/overview)

---

*Documentação atualizada em Janeiro 2026*
