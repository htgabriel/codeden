import type { Catalog } from "../en";
import type { pages } from "../en/pages";

/** Brazilian Portuguese for `../en/pages.ts`. */
export const pagesBR: Catalog<typeof pages> = {
  agents: {
    title: "Configuração dos agentes",
    meta: "Os arquivos nativos são a fonte da verdade — as edições aparecem na CLI também",
    globalOnly: "Só global",
    tabs: {
      memory: "Memória",
      skills: "Skills",
      subagents: "Subagentes",
      mcp: "Servidores MCP",
      hooks: "Hooks",
    },
  },
  session: {
    noMessages: "Nenhuma mensagem ainda",
    worktreeHint: "Descreva a tarefa. O agente trabalha na própria worktree e branch.",
  },
  newSession: {
    projectNotFound: "Projeto não encontrado",
    maybeArchived: "Ele pode ter sido arquivado.",
    title: "Nova sessão",
    repoRootHint:
      "Descreva a tarefa. O agente trabalha na própria pasta do projeto: ela não é um repositório git, então não há worktree.",
    nothingCreated: "Nada é criado até você enviar.",
    placeholder: "Descreva a tarefa — @ para mencionar arquivos, / para comandos e skills",
  },
  reports: {
    title: "Uso e custo",
    exportCsv: "Exportar CSV",
    project: "Projeto",
    fields: {
      provider: "Provedor",
      model: "Modelo",
      projectId: "Projeto",
      role: "Papel",
      source: "Iniciado por",
    },
    removeFilter: "Remover filtro {{field}}: {{value}}",
    apiEquivalent:
      "Os custos são <b>equivalentes à API</b>: você usa um login de assinatura, então isto é o que o mesmo trabalho custaria em créditos de API, não o que você paga. Valores marcados com ≈ são estimados pela tabela de preços.",
    loadFailed: "Não foi possível carregar o uso",
    sessionsBehind: "Sessões de {{day}} · {{label}}",
    close: "Fechar",
    limits: "Limites da assinatura",
    topSessions: "Sessões mais caras",
    background: "Trabalho em segundo plano",
  },
  spend: {
    dailySpend: "Gasto diário",
    dailyTokens: "Tokens por dia",
    byHint: "por {{dimension}} · clique numa barra para ver as sessões dela",
    breakDownBy: "Detalhar por",
    measure: "Medida",
    cost: "Custo",
    tokens: "Tokens",
  },
  search: {
    title: "Buscar nas transcrições",
    meta: "Mensagens, respostas, comandos e caminhos de arquivo em todas as sessões, das mais recentes para as mais antigas",
    placeholder: "webhook retry, prisma migrate, src/cart…",
    session: "Sessão",
    agent: "Agente",
    archived: "Arquivada",
    roles: { agent: "Agentes", pm: "PMs", orchestrator: "Orquestrador" },
    project: "Projeto",
    role: "Papel",
    allProjects: "Todos os projetos",
    allRoles: "Todos os papéis",
    archivedSessions: "Sessões arquivadas",
    startTitle: "Buscar em todas as transcrições",
    startHint:
      "Encontre o que foi pedido, respondido ou executado em qualquer sessão, inclusive as arquivadas: uma mensagem, um comando, um caminho de arquivo.",
    keepTyping: "Continue digitando",
    keepTypingHint: "A busca precisa de uma palavra com pelo menos 3 caracteres.",
    failed: "Não foi possível buscar nas transcrições",
    noMatches: "Nenhum resultado",
    noMatchesFiltered: "Nada nestas sessões contém todas as palavras de “{{query}}”.",
    noMatchesAll: "Nenhuma transcrição contém todas as palavras de “{{query}}”.",
    searchOlder: "Buscar em transcrições mais antigas",
    loadMore: "Carregar mais",
  },
};
