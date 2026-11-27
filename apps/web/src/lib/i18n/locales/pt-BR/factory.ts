import type { Catalog } from "../en";
import type { factory } from "../en/factory";

export const factoryBR: Catalog<typeof factory> = {
  mode: {
    manual: {
      label: "Manual",
      summary: "Você conduz cada sessão. As automações só rodam quando você as inicia.",
      finds: "Você",
      merges: "Você",
    },
    assisted: {
      label: "Assistido",
      summary:
        "Você, o PM e as automações encontram trabalho; você revisa e faz o merge de cada PR.",
      finds: "Você, o PM, as automações",
      merges: "Você",
    },
    software_factory: {
      label: "Fábrica de software",
      summary:
        "Issues abertas no GitHub por você ou por pessoas confiáveis são classificadas como bug, funcionalidade ou mudança de documentação e construídas por um grupo de agentes. Cada uma termina em um PR com resultados de testes e capturas de tela.",
      finds: "Você e autores confiáveis, no GitHub",
      merges: "Você (ou o CodeDen, com merge automático)",
    },
    dark_factory: {
      label: "Fábrica autônoma",
      summary:
        "A fábrica de software, mais um Scout agendado que avalia o app em relação à visão e abre as issues ele mesmo. Você pode se afastar.",
      finds: "O Scout, você e autores confiáveis",
      merges: "Você (ou o CodeDen, com merge automático)",
    },
  },
  loop: {
    idle: "Ociosa",
    discovering: "Explorando",
    building: "Construindo",
    verifying: "Verificando",
    paused: "Pausada",
    stopped: "Parada",
    draining: "Esvaziando",
  },
  stage: {
    candidate: "Identificando o tipo",
    ignored: "Ignorado (autor não confiável)",
    backlog: "Na fila",
    building: "Construindo",
    verifying: "Verificando",
    watching: "Observando a main",
    merged: "Merge feito",
    reverted: "Revertido",
    rejected: "Parado",
    failed: "Falhou",
    escalated: "Precisa de você",
  },
  prState: {
    checking: {
      label: "Verificando",
      help: "As verificações de merge estão rodando: a revisão, os testes e as evidências.",
    },
    waiting_ci: {
      label: "Aguardando a CI",
      help: "A CI está rodando, ou ainda vai começar, no commit mais recente.",
    },
    queued: {
      label: "Na fila",
      help: "Todas as verificações passaram. A fábrica faz o merge de cada pull request pronto, o aprovado há mais tempo primeiro, com segundos de intervalo.",
    },
    updating: {
      label: "Atualizando",
      help: "Atrás da branch padrão e precisando de novo teste: o GitHub traz a branch padrão para ele e a CI roda no novo head. Nenhum agente é necessário.",
    },
    rebasing: {
      label: "Fazendo rebase",
      help: "Conflitos de merge com a branch padrão: o autor (ou um integrador, quando a sessão do autor não existe mais) faz o rebase. Isso não é uma rodada de revisão.",
    },
    rebuilding: {
      label: "Refazendo",
      help: "Ainda havia conflito depois de três pedidos de rebase, então o trabalho é refeito a partir da branch padrão. O novo pull request substitui este.",
    },
    superseded: {
      label: "Substituído",
      help: "Um pull request mais novo para o mesmo trabalho substituiu este. A fábrica o fecha com um link para o novo.",
    },
    merged: { label: "Merge feito", help: "Merge feito hoje." },
    waiting_for_you: {
      label: "Aguardando você",
      help: "Uma pessoa faz o merge deste (o merge automático está desligado, é uma área protegida ou um autor não confiável), ou as verificações dele falharam: aí Tentar de novo o manda para uma nova revisão, e novos commits nele são revisados sozinhos. Enquanto isso, a fábrica o mantém livre de conflitos de merge.",
    },
    stuck: {
      label: "Travado",
      help: "A fábrica não consegue resolver isto sozinha: ele já foi refeito uma vez, ou a CI nunca vai conseguir rodar. Está na sua caixa de entrada.",
    },
  },
  source: {
    discovery: "Scout da fábrica autônoma",
    issue: "Issue do GitHub",
    failed_check: "Verificação com falha na main",
    revert: "Reversão",
  },
  type: {
    bug: "Bug",
    feature: "Funcionalidade",
    docs: "Documentação",
  },
  outcome: {
    reproduced: "Reproduzido",
    not_reproduced: "Não reproduzido",
    implement: "Construir",
    already_done: "Já é possível",
    needs_info: "Precisa de mais informações",
    out_of_scope: "Fora do escopo",
  },
  area: {
    features: "Funcionalidades",
    ux: "UI e UX",
    performance: "Desempenho",
    tech_debt: "Qualidade do código",
    test_gaps: "Lacunas de testes",
    security: "Segurança",
    bugs: "Bugs",
    docs: "Documentação",
  },
  step: {
    intake: "Identificar o tipo",
    queued: "Aguardando um agente",
    reproduce: "Reproduzir",
    analyze: "Analisar a funcionalidade",
    implementBug: "Criar a correção",
    implementDocs: "Implementar a mudança na documentação",
    implementFeature: "Implementar a funcionalidade",
    reviewBug: "Revisar a correção",
    reviewDocs: "Verificações",
    reviewFeature: "Revisar a funcionalidade",
    merge: "Merge",
    ignored: "Ignorado",
    done: "Concluído",
    stopped: "Parado",
  },
  lane: {
    bug: "Cada issue é separada em uma trilha pelo tipo, e cada trilha tem suas próprias etapas. Bugs são reproduzidos primeiro, para que a correção seja comprovada contra um teste que falha.",
    feature:
      "Cada issue é separada em uma trilha pelo tipo, e cada trilha tem suas próprias etapas. Funcionalidades são analisadas primeiro: ela já existe, e ela se encaixa na visão?",
    docs: "Cada issue é separada em uma trilha pelo tipo, e cada trilha tem suas próprias etapas. Mudanças na documentação vão direto para a implementação e só precisam das verificações automáticas.",
  },
  issueHelp: {
    dark: "O trabalho começa como uma issue do GitHub, aberta pelo Scout, por você ou por um autor confiável. Issues de qualquer outra pessoa são ignoradas até você liberá-las.",
    light:
      "O trabalho começa como uma issue do GitHub aberta por você ou por um autor confiável. Issues de qualquer outra pessoa são ignoradas até você liberá-las.",
  },
  stepHelp: {
    intake:
      "Uma chamada rápida ao modelo lê cada issue nova e a coloca na trilha de Bug, Funcionalidade ou Documentação (um rótulo de tipo na issue decide no lugar dela). Depois ela aguarda um agente livre.",
    queued:
      "Aguardando um agente livre. Revisões, rodadas de revisão e rebases de pull requests abertos recebem agentes livres primeiro; depois os itens são escolhidos por prioridade e, em seguida, por idade. No limite de pull requests abertos nada novo começa até que um receba merge, e um item que provavelmente mexe nos arquivos de um pull request aberto espera atrás dos que não mexem.",
    reproduce:
      "Um agente escreve um teste ou uma sonda que falha e mostra o bug. Depois de reproduzido, o mesmo agente segue para a correção; se não for possível, o trabalho para e a issue pede mais informações.",
    analyze:
      "Um agente verifica se a funcionalidade já existe e se encaixa na visão, e então publica na issue uma especificação com critérios de aceitação. Uma especificação aceita o leva para Implementar; caso contrário, o trabalho para com o motivo.",
    implementBug:
      "O mesmo agente corrige o bug na própria worktree e abre um pull request com os resultados dos testes. O pull request o leva para a revisão.",
    implementDocs:
      "Um agente faz a mudança na documentação na própria worktree e abre um pull request. O pull request o leva para as verificações.",
    implementFeature:
      "O mesmo agente constrói a funcionalidade conforme a especificação na própria worktree e abre um pull request com os resultados dos testes e capturas de tela para mudanças de interface. O pull request o leva para a revisão.",
    reviewDocs:
      "As verificações de merge rodam no pull request; uma mudança que só mexe na documentação pula a revisão do agente. Com todas as verificações verdes, ele segue para o Merge.",
    review:
      "Um agente revisor separado verifica o pull request enquanto as verificações de merge rodam. Aprovado e com todas as verificações verdes, ele segue para o Merge; caso contrário, volta para quem o construiu revisar.",
    mergeAuto:
      "Com todas as verificações verdes, o CodeDen faz o merge do pull request ele mesmo e acompanha a CI na main; uma regressão abre uma reversão e pausa a fábrica. Trabalho liberado de um autor não confiável sempre aguarda você.",
    mergeManual:
      "Com todas as verificações verdes, o pull request está pronto para você: revise e faça o merge no GitHub.",
    ignored:
      "Aberta por alguém que não é um autor confiável, então a fábrica a deixa de lado até você liberá-la.",
    done: "Merge feito.",
    stopped:
      "O trabalho parou: não reproduzido, recusado, com falha ou fechado. Tentar de novo o executa outra vez: com o pull request ainda aberto, ele volta para uma nova revisão; caso contrário, o trabalho recomeça. Um pull request com falha que recebe novos commits é revisado sozinho.",
  },
  reviseHelp:
    "Quando o revisor pede mudanças ou uma verificação de merge falha, o trabalho volta para quem o construiu revisar, no máximo algumas vezes. O número indica quantos estão sendo revisados agora.",
  scoutHelp:
    "Um agente que avalia periodicamente o app em relação à sua visão e abre issues para o trabalho que vale a pena fazer. Ele só olha quando a fila está baixa (o limite fica nas Configurações), ou quando você clica em Rodar Scout agora.",
  roundHelp:
    "Uma passada do Scout: ele planeja o que olhar, os revisores de cada área revisam e então ele abre como issues as descobertas que mais valem a pena. Uma rodada começa no horário que você definiu assim que a fila fica baixa, ou na hora com Rodar Scout agora.",
  checkNowHelp: {
    light:
      "Executa agora a verificação regular da fábrica (ela roda a cada 30 segundos): avança o trabalho em andamento, pega issues novas e inicia agentes livres.",
    dark: "Executa agora a verificação regular da fábrica (ela roda a cada 30 segundos): avança o trabalho em andamento, pega issues novas, inicia agentes livres e inicia o Scout se estiver na hora.",
  },
  wipHelp:
    "O limite de trabalho em andamento. Com esse número de pull requests da fábrica abertos, a fábrica os termina antes de começar outros: nenhuma construção nova sai da fila, o Scout não abre nada e os agentes livres vão para revisões, correções e rebases até que um receba merge ou seja fechado. Construções que ainda não abriram o pull request também ocupam espaço, já que cada uma vai abrir. Correções para verificações com falha na branch padrão continuam começando. Pull requests de trabalho com falha ou escalado, que aguardam você, não contam (trabalho que falhou por um motivo fora do código volta sozinho, e o pull request dele também, a menos que aguarde um provedor desconectado ou no limite de uso). Menos PRs abertos significa menos conflitos de merge entre eles.",
  providerWaitHelp:
    "Trabalho que falhou por um motivo fora do código, como o provedor do agente estar desconectado ou no limite de uso, volta sozinho assim que esse provedor puder trabalhar de novo. Até lá o pull request dele não conta para o máximo de PRs abertos, então o trabalho novo continua com os outros provedores. Conecte o provedor (ou espere o limite renovar) para que ele continue.",
  slotOrderHelp:
    "Um agente livre vai primeiro para as revisões (PRs com a CI aprovada, depois rebases e rodadas de revisão, depois PRs com a CI ainda rodando), depois para as construções e, por último, para o Scout. O trabalho em andamento nunca é interrompido.",
  wipLabel: "Terminando o trabalho aberto ({{openPrs}} de {{limit}} PRs abertos)",
  reviewAreasHelp:
    "Quantos agentes revisores focados o Scout pode usar em uma rodada, cada um olhando uma área do app: segurança, UI e UX, desempenho, documentação e assim por diante. Cada um consome tokens; 0 significa que o Scout revisa sozinho.",
  check: {
    ci: "CI",
    tests: "Testes",
    test_results: "Resultados dos testes",
    review: "Revisão",
    security: "Segurança",
    ui_evidence: "Capturas de tela",
    size: "Tamanho",
    protected_paths: "Áreas protegidas",
  },
  checkHelp: {
    ci: "As verificações do PR passaram no GitHub.",
    tests: "Os testes mudaram junto com o código, ou a mudança não precisa de nenhum.",
    test_results:
      "O PR informa os resultados dos testes (uma seção Resultados dos testes ou a saída anexada).",
    review:
      "Uma sessão revisora independente o aprovou (mudanças só de documentação pulam esta etapa).",
    security: "O comando de auditoria e o revisor não encontraram problemas.",
    ui_evidence: "Mudanças de interface têm capturas de tela anexadas.",
    size: "Pequeno o bastante para a fábrica.",
    protected_paths: "Não mexe em nenhuma área protegida pela visão ou pelos limites.",
  },
  drain: {
    label: "esvaziando",
    hint: "Terminando o trabalho atual e depois parando: nenhuma issue nova, construção ou rodada do Scout começa, enquanto o trabalho em andamento continua até receber merge, falhar ou precisar de você. Depois a fábrica para sozinha. Retomar cancela isso; Parar agora para tudo de uma vez.",
    deadline: " Se ainda houver trabalho em andamento às {{time}}, tudo para de uma vez.",
    paused: "· pausada: {{reason}}",
  },
  wip: {
    finishingLabel: "terminando o trabalho aberto",
    finishingHint:
      "Novas construções e o Scout aguardam até que um pull request receba merge ou seja fechado.",
    providerLabel: "aguardando um provedor",
  },
  retry: {
    backInReview: "De volta à revisão",
    queuedAgain: "Na fila de novo",
    freshReview: "O #{{number}} recebe uma nova revisão; nenhuma construção nova.",
    startsOver: "Ele recomeça a partir da primeira etapa.",
    failed: "Não foi possível tentar de novo",
    runAgain: "Executar de novo a partir da primeira etapa",
    runAgainReplacing: "Executar de novo a partir da primeira etapa, substituindo o #{{number}}",
    sendBack:
      "Mandar o #{{number}} de volta para uma nova revisão dos commits mais recentes (nenhuma construção nova)",
    rebuild: "Refazer",
    retry: "Tentar de novo",
  },
  badge: {
    human: "Humano",
    humanOrScout: "Humano ou Scout",
    llm: "Chamada ao LLM",
    agent: "Agente",
    workspace: "Agente na worktree",
    auto: "Merge automático",
    scout: "Scout",
    checks: "Verificações de CI",
  },
  cost: {
    notPriced: "Sem preço",
    notPricedTitle:
      "Sem preço: não há preço para estes modelos nem custo informado · {{tokens}} tokens",
    apiSoFar: "Custo equivalente na API até agora",
    soFar: "Custo até agora",
    estimated: "{{kind}} (estimado pelos preços de tabela)",
    sessions_one: "{{count}} sessão",
    sessions_other: "{{count}} sessões",
    turns_one: "{{count}} turno",
    turns_other: "{{count}} turnos",
    tokens: "{{tokens}} tokens",
    turnsNotPriced_one: "{{count}} turno sem preço",
    turnsNotPriced_other: "{{count}} turnos sem preço",
    capUsd: "{{spent}} de {{cap}}",
    capTokens: "{{spent}} de {{cap}} tokens",
  },
  spotReason: {
    sampled: {
      label: "Amostra",
      title: "Escolhido pela fatia de merges automáticos separada para uma pessoa olhar",
    },
    untrusted_author: {
      label: "Autor não confiável",
      title:
        "A issue veio de um autor não confiável e foi liberada manualmente: sempre é verificada",
    },
    large_change: {
      label: "Mudança grande",
      title: "Foi liberada além do limite de tamanho: sempre é verificada",
    },
  },
  spotState: {
    pending: "Aguardando uma olhada",
    looks_good: "Parece bom",
    problem: "Encontrou um problema",
  },
  spotText: {
    shareOff: "Desligado: nenhum merge é separado",
    share:
      "{{percent}}% dos merges automáticos, mais trabalho de autores não confiáveis e mudanças grandes",
    noneChecked: "Nenhum verificado nos últimos {{days}} dias",
    problems_one:
      "Uma pessoa encontrou um problema em {{problems}} de {{count}} merge verificado ({{share}}%) em {{days}} dias",
    problems_other:
      "Uma pessoa encontrou um problema em {{problems}} de {{count}} merges verificados ({{share}}%) em {{days}} dias",
  },
  stopped: {
    protectedArea: "área protegida",
    untrustedAuthor: "autor não confiável",
    autoMergeOff: "o merge automático está desligado",
    yoursToMerge: "O merge é com você",
    yoursToMergeWhy: "O merge é com você: {{why}}",
    rebuiltConflicting: "Refeito uma vez e ainda com conflito",
    ciCantRun: "A CI não consegue rodar neste repositório",
    stuck: "Travado: precisa de uma pessoa",
    withPr: "Parado com o pull request aberto",
    withoutPr: "Parado sem pull request",
  },
  scorecard: {
    noReview: "Sem revisão",
    defaultModel: "modelo padrão",
    problems_one: "{{count}} problema",
    problems_other: "{{count}} problemas",
    spotChecksTitle_one:
      "{{count}} merge verificado por amostragem por uma pessoa, {{problems}} com problema",
    spotChecksTitle_other:
      "{{count}} merges verificados por amostragem por uma pessoa, {{problems}} com problema",
    apiPerMerge: "Custo equivalente na API por merge",
    perMerge: "Custo por merge",
    estimatedSuffix: " (estimado pelos preços de tabela)",
    costLine_one: "{{kind}}, falhas incluídas{{estimated}}: {{cost}} em {{count}} item",
    costLine_other: "{{kind}}, falhas incluídas{{estimated}}: {{cost}} em {{count}} itens",
    title: "Placar",
    summary: "merges de primeira, rodadas de revisão, reversões e custo por construtor e revisor",
    groupBy: "Agrupar por",
    window: "Período",
    views: { builders: "Construtor", reviewers: "Revisor", pairs: "Dupla" },
    days: "{{n}} dias",
    loadFailed: "Não foi possível carregar o placar: {{message}}",
    empty: "Nenhum trabalho da fábrica concluído nos últimos {{days}} dias.",
    footnote:
      "Cada item conta para o construtor e o revisor da última tentativa. Falhas de infraestrutura, trabalho recusado ou escalado e as reversões da própria fábrica não contam.",
    pairHeading: "Construtor → revisor",
    firstPassTitle: "{{n}} de {{merged}} merges",
    reviseTitle: "{{rounds}} rodadas em {{finished}} itens",
    columns: {
      finished: {
        label: "Concluídos",
        title: "Trabalho que recebeu merge ou falhou (pelo próprio trabalho) no período",
      },
      merged: {
        label: "Com merge",
        title: "Merges no período e a fatia do trabalho concluído",
      },
      firstPass: {
        label: "De primeira",
        title:
          "Merges que não precisaram de rodada de revisão (sem revisão ou verificação com falha, sem reversão)",
      },
      reviseRounds: { label: "Rodadas de revisão", title: "Rodadas de revisão por item concluído" },
      reverted: {
        label: "Revertidos",
        title: "Merges revertidos porque a CI na branch padrão falhou depois deles",
      },
      spotChecks: {
        label: "Verificações por amostragem",
        title: "Merges que uma pessoa verificou por amostragem e os problemas encontrados",
      },
      costPerMerge: {
        label: "Custo / merge",
        title: "Quanto custou o trabalho concluído, falhas incluídas, por merge",
      },
      toMerge: { label: "Até o merge", title: "Tempo mediano da entrada até o merge" },
    },
  },
  budget: {
    usd: "{{label}} (USD)",
    tokens: "{{label}} (tokens)",
    daily: "Orçamento diário",
    dailyHelp: "O loop pausa até amanhã quando o gasto de hoje chega a ele.",
    tokensHelp: "Opcional, junto com o USD.",
    usdPlaceholder: "ex.: 10",
    tokensPlaceholder: "ex.: 5000000",
    scopeAria: "Contar todo o gasto do projeto no orçamento",
    scope: "Contar todo o gasto deste projeto",
    scopeHelp:
      "Desligado: só as sessões da própria fábrica (construtores, revisores, o Scout, reversões) contam.",
    item: "Limite por item",
    itemHelp:
      "Opcional. Um item que gasta esse valor para e aguarda você; tentar de novo dá a ele o mesmo valor outra vez. Vazio: sem limite.",
    noCap: "Sem limite",
  },
  followUps: {
    severity: { high: "alta", medium: "média", low: "baixa" },
    dropped: {
      duplicate: "duplicada",
      expired: "expirada",
      capped: "descartada",
      dismissed: "dispensada",
    },
    filedAs: "Aberta como #{{number}}",
    filed: "Aberta",
    fileFailed: "Não foi possível abrir a issue",
    title: "Pendências · não bloqueiam",
    droppedTitle: "Saiu da lista guardada do Scout sem uma issue",
    heldTitle: "Guardada para a próxima rodada do Scout",
    held: "guardada para o Scout",
    fileIssue: "Abrir issue",
    mergedDark:
      "As guardadas aguardam o Scout, que as compara com as outras descobertas dele; as demais são abertas como issues.",
    merged: "Abra como issues as que valem a pena; a fábrica as pega a partir daí.",
    pendingDark:
      "Elas não seguram o merge; depois do merge, as de alta severidade e de segurança são abertas como issues e as demais aguardam as rodadas do Scout.",
    pending: "Elas não seguram o merge; depois do merge você pode abri-las como issues aqui.",
  },
  held: {
    help: "Descobertas não bloqueantes das revisões de pull requests com merge. O Scout as compara com as descobertas dos revisores de área e abre no máximo Issues por rodada no total; as que ele não abre são descartadas depois de 14 dias.",
    dismissed: "Dispensada",
    dismissFailed: "Não foi possível dispensá-la",
    count_one: "{{count}} pendência guardada",
    count_other: "{{count}} pendências guardadas",
    title: "Pendências de revisão guardadas",
    fromPr: "do PR #{{number}}",
    from: "de {{title}}",
    fileNow: "Abrir agora",
    dismiss: "Dispensar",
    dismissAria: 'Dispensar "{{title}}"',
  },
  lessons: {
    title: "Lições",
    summary:
      "o que as revisões ensinaram à fábrica; novos construtores e revisores as recebem nas instruções",
    off: "aprender com as revisões está desligado: as instruções não levam nenhuma",
    empty: "Nenhuma ainda: os revisores adicionam lições enquanto revisam.",
    fromPr: "do #{{number}}",
    fromReview: "de uma revisão",
    recorded: "registrada {{n}}×",
    newInBriefs: "nova: nas instruções {{when}}",
    forgetAria: "Esquecer a lição: {{text}}",
    forgetTitle:
      "Esquecer: os próximos construtores e revisores não a recebem mais, e ela não é aprendida de novo",
    forgotten: "Lição esquecida",
    forgottenHint: "Novos construtores e revisores não a recebem mais.",
    forgetFailed: "Não foi possível esquecer a lição",
  },
  agents: {
    fallback: {
      builder: "Revisar no provedor e no modelo do construtor",
      any: "Revisar em qualquer provedor disponível",
      wait: "Esperar até que ele volte a ficar disponível",
    },
    meanwhile: {
      builder: "as revisões rodam no provedor e no modelo do construtor",
      any: "as revisões rodam em qualquer provedor disponível",
      wait: "as revisões aguardam",
    },
    title: "Agentes",
    intro:
      "Um revisor em um provedor diferente do construtor dá a revisão mais independente. Construções de documentação podem rodar em um modelo mais barato. Provedores desconectados, antigos demais para rodar ou no limite de uso são pulados.",
    builder: "Construtor",
    builderMeanwhile: "os construtores começam em outro provedor disponível",
    docsBuilder: "Construtor de documentação",
    sameAsBuilders: "Igual aos construtores",
    docsHint:
      "Construções de itens de documentação (READMEs, guias, comentários). Igual aos construtores: elas usam o provedor e o modelo do construtor. Construções de funcionalidades e bugs sempre usam os do construtor.",
    docsMeanwhile: "as construções de documentação começam em outro provedor disponível",
    reviewer: "Revisor",
    reviewerAuto: "Automático (um provedor diferente do construtor)",
    fallbackLabel: "Quando o provedor do revisor estiver indisponível",
    fallbackHint:
      "Indisponível significa não instalado, desconectado, no limite de uso ou falhando ao iniciar. Sem nenhum provedor disponível, a revisão aguarda.",
    providerLabel: "{{label}}: provedor",
    modelLabel: "{{label}}: modelo",
    automatic: "Automático",
    notReady: "Não está pronto",
    runPrefix: "(rode",
    untilRun: ". Até que ele possa rodar, {{meanwhile}}.",
    notConnected: "{{value}} (não conectado)",
    providerDefault: "Padrão do provedor",
    chooseProvider: "Escolha um provedor primeiro",
  },
  columns: {
    nothingYet: "Nada ainda",
    letIn: "Liberar",
    letInHint: "{{title}} passa pelo pipeline; você faz o merge do resultado.",
    letInFailed: "Não foi possível liberar",
    ignored: "Ignoradas · autores não confiáveis",
    unknown: "desconhecido",
    letInTitle: "Deixar a fábrica assumir isto. Uma pessoa faz o merge do resultado.",
    mergeChecks: "Verificações de merge",
    reviewer: "Revisor: {{provider}}",
    recent: "Merges e reversões recentes",
  },
  guide: {
    subtitle: "A fábrica de software e a fábrica autônoma, passo a passo.",
    inDocs: "Na documentação",
    contents: "Sumário",
    buttonTitle: "Como funciona o loop da fábrica",
    howItWorks: "Como funciona",
  },
  parts: {
    session: "sessão",
    sessionTitle: "Sessão",
    role: { reviewer: "Revisor", integrator: "Integrador", builder: "Construtor" },
    earlierSessions: "Sessões anteriores",
    archived: "arquivada",
    noUsage: "Nenhum uso ainda",
    escalated: "Escalado: uma pessoa precisa revisar e fazer o merge",
    reproduction: "Reprodução",
    analysis: "Análise",
    test: "Teste:",
    letIn: "Liberado: uma pessoa faz o merge do resultado",
    pipelineChanged: "Pipeline alterado",
    pipelineFailed: "Não foi possível alterar o pipeline",
    takeItOn: "Deixar a fábrica assumir",
    retryOrRebuild:
      "Tentar de novo manda o #{{number}} para uma nova revisão; Refazer recomeça e o substitui.",
    pipeline: "Pipeline",
  },
  kill: {
    limits: {
      none: "Sem limite de tempo",
      "30": "30 minutos",
      "60": "1 hora",
      "120": "2 horas",
      "240": "4 horas",
    },
    confirm: {
      drainTitle: "Terminar o trabalho atual e depois parar?",
      drainBody:
        "A fábrica não assume nenhum trabalho novo: nenhuma issue nova, construção ou rodada do Scout. O trabalho em andamento continua até receber merge, falhar ou precisar de você, com as verificações de sempre; depois a fábrica para sozinha. Os itens na fila continuam na fila.",
      nowTitle: "Parar esta fábrica agora?",
      nowTitleGlobal: "Parar a fábrica de todos os projetos agora?",
      nowBody:
        "Isso para o loop e todas as sessões da fábrica neste projeto imediatamente. Itens em construção voltam para a fila; PRs abertos continuam abertos.",
      nowBodyGlobal:
        "Isso para o loop e todas as sessões da fábrica em todos os projetos imediatamente. Itens em construção voltam para a fila; PRs abertos continuam abertos.",
      releaseTitle: "Liberar o botão de parada?",
      releaseTitleGlobal: "Deixar as fábricas rodarem de novo?",
      releaseBody:
        "O loop volta a pegar itens da fila dentro dos seus limites. Um loop pausado continua pausado até você retomá-lo.",
    },
    toast: {
      finishing: "Terminando o trabalho atual",
      inFlight_one: "{{count}} item em andamento; a fábrica para assim que ele terminar.",
      inFlight_other: "{{count}} itens em andamento; a fábrica para assim que eles terminarem.",
      stopped: "Fábrica parada",
      nothingInFlight: "Não havia nada em andamento.",
      everyStopped: "Todas as fábricas paradas",
      halted_one: "{{count}} sessão da fábrica interrompida.",
      halted_other: "{{count}} sessões da fábrica interrompidas.",
      mayRunAgain: "As fábricas podem rodar de novo",
      resumed: "Fábrica retomada",
      changeFailed: "Não foi possível alterar o botão de parada",
      resumeFailed: "Não foi possível retomar",
    },
    releaseGlobal: "Liberar o botão de parada global",
    release: "Liberar o botão de parada",
    stopEvery: "Parar todas as fábricas",
    cancelDrainAndPause:
      "Cancelar o esvaziamento e a pausa: a fábrica volta a assumir trabalho novo",
    cancelDrain: "Cancelar o esvaziamento: a fábrica volta a assumir trabalho novo",
    resume: "Retomar",
    stopNow: "Parar agora",
    killSwitch: "Botão de parada",
    drainItem: "Terminar o trabalho atual e depois parar",
    drainItemHint: "Nada novo começa; o trabalho em andamento termina primeiro.",
    stopNowHint: "Todas as sessões da fábrica param imediatamente.",
    limitHint: "Se ainda houver trabalho em andamento depois desse tempo, parar tudo de uma vez",
    limitAria: "Limite de tempo do esvaziamento",
    releaseAction: "Liberar",
    drainAction: "Terminar e parar",
    stopAction: "Parar tudo",
  },
  limits: {
    autoMergeAria: "Fazer merge automaticamente",
    autoMerge: "Fazer merge automaticamente quando todas as verificações passarem",
    autoMergeHelp:
      "Desligado (recomendado para começar): cada pull request aguarda você revisar e fazer o merge. Trabalho liberado de um autor não confiável sempre aguarda você.",
    policy: "Política de merge",
    policyHint:
      "Testar de novo cada pull request depois de cada merge custa uma execução completa da CI por merge, então os pull requests esperam minutos em vez de segundos. O modo Rápido pula isso: o GitHub informa conflitos, a CI na branch padrão continua sendo acompanhada depois de cada merge e um merge que a quebra é revertido.",
    policyHelp: {
      fast: "Um pull request atrás da branch padrão recebe merge com a própria CI verde, desde que o GitHub não informe conflito. Ele só é testado de novo antes quando ele e os novos commits mudaram arquivos de dependências ou migrações, ou enquanto a branch padrão está vermelha.",
      strict:
        "Um pull request atrás da branch padrão é sempre atualizado e espera a CI passar de novo antes do merge, um pull request por vez.",
    },
    policyFast: "Rápido: merge com a própria CI, a menos que o GitHub informe um conflito",
    policyStrict: "Estrito: sempre testar de novo com a branch padrão",
    specApproval: "Aprovar especificações antes de construir",
    specApprovalHelp:
      "Uma funcionalidade para depois de Analisar até você aprovar a especificação ou pedir mudanças, então um pedido mal entendido custa uma especificação curta em vez de uma construção e uma revisão. Desligado: o agente constrói a especificação na hora. A fábrica autônoma nunca espera, então pula isso.",
    trusted: "Autores confiáveis",
    trustedHelpLogin:
      "Logins do GitHub, um por linha. A fábrica só assume issues abertas por eles, mais @{{login}} (a conta que o CodeDen usa). Em um repositório público qualquer pessoa pode abrir uma issue: as de todos os outros são ignoradas até você liberá-las.",
    trustedHelp:
      "Logins do GitHub, um por linha. A fábrica só assume issues abertas por eles e pela conta que o CodeDen usa. Em um repositório público qualquer pessoa pode abrir uma issue: as de todos os outros são ignoradas até você liberá-las.",
    agentsAtOnce: "Agentes ao mesmo tempo",
    agentsAtOnceHelp: "O grupo: construtores, revisores e o Scout o compartilham.",
    mergesPerDay: "Merges automáticos por dia",
    mergesPerDayHint:
      "Com o merge automático ligado, o máximo de pull requests que o CodeDen faz merge sozinho em um dia. Quando chega a esse número, mais trabalho espera até amanhã.",
    pauseAfter: "Pausar depois de falhas",
    pauseAfterHint:
      "A fábrica pausa depois dessa quantidade de verificações de merge com falha ou reversões seguidas, para que uma configuração quebrada não continue gastando. Retome-a pelo painel da fábrica.",
    openPrs: "Máximo de PRs abertos",
    openPrsHelp: "Vazio: o mesmo que Agentes ao mesmo tempo.",
    openPrsPlaceholder: "{{n}} (Agentes ao mesmo tempo)",
    protectedPaths: "Caminhos protegidos",
    protectedPathsHelp:
      "Um glob por linha, além das áreas protegidas da visão. Mudanças ali sempre vão para você.",
    allowDeploysAria: "Permitir deploys",
    allowDeploys: "Permitir mudanças de deploy e release",
    allowDeploysHelp:
      "Desligado: workflows, Dockerfiles e configurações de hospedagem contam como protegidos.",
    checks: "Verificações de merge",
    checksHelp: "O que um pull request precisa cumprir antes de estar pronto para o merge.",
    maxLines: "Maior mudança (linhas)",
    maxLinesHelp: "Lockfiles e arquivos gerados não contam. Deixe vazio para não ter limite.",
    noLimit: "Sem limite",
    maxFiles: "Máximo de arquivos alterados",
    maxFilesHelp: "Deixe vazio para não ter limite.",
    overLimit:
      "Acima do limite, o gerente de projeto divide o trabalho ou o permite como uma única mudança (uma estrutura inicial, por exemplo). Nada aguarda você.",
    reviseRounds: "Rodadas de revisão",
    reviseRoundsHint:
      "Quantas vezes o construtor pode revisar um pull request depois que o revisor pede mudanças ou uma verificação de merge falha. Depois disso o item falha, e você pode executá-lo de novo pela página dele.",
    watch: "Acompanhar a CI da main (minutos)",
    watchHint:
      "Depois de um merge automático, por quanto tempo a fábrica acompanha a CI na branch padrão. Uma falha durante esse tempo reverte o merge; a CI ainda rodando depois disso conta como concluída.",
    requireCi: "Exigir CI",
    requireCiHelp: "Desligado: um repositório sem CI ainda pode fazer merge automaticamente.",
    learn: "Aprender com as revisões",
    learnHelp:
      "Os revisores registram lições gerais, e novos construtores e revisores as recebem nas instruções. Desligado: nenhuma é pedida, guardada ou repassada.",
    audit: "Comando de auditoria",
    auditHelp:
      "Varredura opcional de segurança ou de dependências, rodada na worktree do construtor.",
  },
  prs: {
    title: "Pull requests",
    queueTitle:
      "Com o merge automático ligado, a fábrica faz o merge de cada pull request que passou nas verificações, o aprovado há mais tempo primeiro. Um que está atrás da branch padrão recebe merge com a própria CI, a menos que precise ser testado de novo antes.",
    queueWaiting: "fila de merge com {{n}} aguardando",
    queueEmpty: "fila de merge vazia",
    empty: "Nenhum pull request da fábrica aberto",
    position: "Número {{n}} na fila de merge",
    notQueued: "Fora da fila de merge",
  },
  scoutNode: {
    onDemand: "Sob demanda",
    resting: "Descansando",
    waiting: "Aguardando uma rodada",
    planning: "Planejando",
    reviewing: "Revisando áreas",
    filing: "Abrindo issues",
    rounds: "rodadas",
    openSession: "Abrir a sessão do Scout",
    title: "Encontrar melhorias",
    round: "Rodada {{n}}",
    areaReview: "Revisão de {{area}}: {{state}}",
    areaReviewAria: "Revisão de {{area}}: {{state}}. Abrir a sessão",
    reported: "relatada",
    inReview: "revisando",
    areas: "áreas de revisão",
    filed: "{{n}} abertas nesta rodada",
  },
  diagram: {
    waitingAgent: "Aguardando um agente livre",
    admitted: "Liberado manualmente: uma pessoa faz o merge",
    reviseRound: "Rodada de revisão {{n}}",
    openSession: "Clique para abrir a sessão do agente",
    openItem: "Clique para abrir o item",
    lane: "a trilha {{label}}",
    revise: "Revisar",
    issue: "Issue",
    ignoredTitle: "Issues de autores não confiáveis são ignoradas até você liberá-las",
    ignored: "{{n}} ignoradas",
    trusted: "autores confiáveis",
    heldLine: "#{{number}} retida: {{reason}}",
    held: "{{n}} retidas",
    whenPass: "quando todas as verificações passarem",
    readyOnGithub: "pronto para você no GitHub",
  },
  scoutTuning: {
    backlogOff:
      "0: as rodadas agendadas estão desligadas. O Scout só roda quando você clica em Rodar Scout agora no painel da fábrica.",
    backlogOn:
      "O Scout só começa uma rodada agendada quando {{low}} para ser classificada ou por um agente livre, e o intervalo já passou. 0 desliga as rodadas agendadas: aí só Rodar Scout agora inicia uma.",
    noneWaits: "nenhuma issue aguarda",
    fewerWait: "menos de {{n}} issues aguardam",
    title: "O Scout",
    titleLabel: "o Scout",
    intro:
      "Ele avalia o app em relação à visão {{when}}, usando alguns revisores de área de longa duração (um agente revisor por área de revisão, como segurança ou UX), e abre o trabalho que vale a pena fazer.",
    whenRunNow: "quando você clica em Rodar Scout agora",
    whenScheduled: "de forma agendada, quando {{low}}",
    reviewWhen: "Revisar quando houver menos de",
    reviewWhenOff: "Desligado: só Rodar Scout agora inicia uma rodada.",
    reviewWhenHelp_one: "issue aguardando um agente.",
    reviewWhenHelp_other: "issues aguardando um agente.",
    every: "A cada (horas)",
    everyHint:
      "Com que frequência o Scout faz uma rodada de revisão: ele planeja o que olhar, os revisores de área revisam e ele abre issues.",
    everyOff: "As rodadas agendadas ficam desligadas enquanto o limite for 0.",
    everyWaits: "Ele também espera até que {{low}}.",
    areas: "Áreas de revisão por rodada",
    issues: "Issues por rodada",
    issuesHint:
      "O máximo de issues que o Scout abre em uma rodada. Ele só abre o que mais vale a pena, então uma rodada pode abrir menos ou nenhuma.",
    agentHint:
      "Roda o Scout e os revisores de área, agentes de longa duração que leem muito código a cada rodada. Automático: o provedor do projeto. Um Scout ou revisor de área em outro provedor ou modelo recomeça do zero na rodada seguinte.",
    agentMeanwhile: "o Scout começa em outro provedor disponível",
  },
  spotTuning: {
    label: "Fatia de merges automáticos verificados por amostragem (%)",
    hint: "Uma fatia dos pull requests que a fábrica faz merge sozinha é separada para uma olhada rápida de uma pessoa, escolhida sempre do mesmo jeito para o mesmo trabalho. Merges de trabalho liberado de um autor não confiável ou permitido além do limite de tamanho sempre entram. Um item na caixa de entrada diz quantos aguardam; registre Parece bom ou Encontrou um problema na lista de verificações por amostragem do painel da fábrica. Nada aguarda uma verificação por amostragem.",
    help: "Vazio: o padrão, {{n}}% na fábrica autônoma e desligado nos outros modos. 0 desliga as verificações por amostragem.",
    placeholderDark: "{{n}} (padrão)",
    placeholderOff: "Desligado (padrão)",
  },
  spec: {
    approved: "Especificação aprovada: o agente a constrói em seguida",
    changesRequested: "Mudanças pedidas: o agente revisa a especificação",
    recordFailed: "Não foi possível registrar sua decisão",
    approve: "Aprovar especificação",
    requestChanges: "Pedir mudanças",
    placeholder: "O que deve mudar? O agente revisa a análise e pergunta a você de novo.",
    feedbackAria: "O que mudar na especificação",
    send: "Enviar ao agente",
    notBuilt: {
      already_done: "isso já é possível",
      needs_info: "precisa de mais informações",
      out_of_scope: "está fora do escopo da visão",
    },
    asked: "Mudanças pedidas",
    askedAgo: "Mudanças pedidas {{ago}}",
    revising: "{{asked}}: o agente revisa a análise e depois pergunta a você de novo.",
    notBuiltText: "{{asked}}. A análise revisada decidiu não construir: {{why}}.",
    stoppedBefore: "{{asked}}. O item parou antes de o agente enviar uma especificação revisada.",
    title: "Aprovação da especificação",
    waits: "A especificação aguarda você",
    waitsHint:
      "(enviada {{ago}}). Leia a análise e os critérios de aceitação acima. Aprove e o agente a constrói; peça mudanças e ele revisa a especificação primeiro.",
    askedEarlier: "Você pediu antes:",
    approvedAuto:
      "Aprovada automaticamente: a aprovação de especificações foi desligada enquanto ela aguardava.",
    approvedByYou: "Aprovada por você.",
    approvedByYouAgo: "Aprovada por você {{ago}}.",
    afterRounds_one: "Depois de {{count}} rodada de mudanças.",
    afterRounds_other: "Depois de {{count}} rodadas de mudanças.",
    waitingWhenStopped: "Ela aguardava aprovação quando o item parou.",
  },
  spotActions: {
    notFiled: "Registrado, mas a issue não foi aberta",
    notFiledHint: "{{error}}. Use Abrir issue para tentar de novo.",
    recordedGood: "Verificação registrada: parece bom",
    problemFiled: "Problema registrado e aberto como #{{number}}",
    problemRecorded: "Problema registrado",
    recordFailed: "Não foi possível registrar a verificação",
    filed: "Aberta como #{{number}}: a fábrica assume",
    openPr: "Abrir PR",
    prTitle: "Pull request #{{number}}",
    readThenRecord: "Leia a mudança e depois registre o que encontrou.",
    whatsWrong:
      'O que há de errado com "{{title}}"? Fica registrado no item e conta contra o construtor e o revisor dele no placar.',
    notePlaceholder: "O que você encontrou, específico o bastante para um agente corrigir",
    noteAria: "O que você encontrou",
    fileFollowUp: "Abrir uma issue de acompanhamento com esta nota",
    fileFollowUpHint: "Marcada para a fábrica, que a assume como trabalho novo.",
    recording: "Registrando…",
    recordProblem: "Registrar problema",
    filing: "Abrindo…",
  },
  spotSection: {
    title: "Verificação por amostragem",
    setAside: "Separado para uma olhada rápida",
    setAsideHint:
      "({{reason}}, merge {{ago}}). Leia a mudança e depois registre o que encontrou. Nada aguarda isso.",
    foundProblem: "Uma pessoa encontrou um problema",
    looksGood: "Parece bom para uma pessoa",
    followUp: "Issue de acompanhamento #{{number}}",
  },
  spotCard: {
    title: "Verificações por amostragem",
    toCheckTitle: "Merges aguardando uma olhada",
    toCheck: "{{n}} para verificar",
    readHint:
      "Leia a mudança na visualização do PR e depois registre o que encontrou; nada na fábrica aguarda isso.",
    nothing: "Nada para verificar agora.",
    older_one: "e mais {{count}} merge antigo",
    older_other: "e mais {{count}} merges antigos",
    checkedLately: "Verificados recentemente",
    merged: "merge {{ago}}",
    noReview: "Sem revisão de agente (uma mudança só de documentação)",
    foundProblem: "encontrou um problema",
    looksGood: "parece bom",
  },
};
