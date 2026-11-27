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
        "A fábrica de software, mais um explorador agendado que avalia o app em relação à visão e abre as issues ele mesmo. Você pode se afastar.",
      finds: "O explorador, você e autores confiáveis",
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
    discovery: "Explorador da fábrica autônoma",
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
    dark: "O trabalho começa como uma issue do GitHub, aberta pelo explorador, por você ou por um autor confiável. Issues de qualquer outra pessoa são ignoradas até você liberá-las.",
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
    "Um agente que avalia periodicamente o app em relação à sua visão e abre issues para o trabalho que vale a pena fazer. Ele só olha quando a fila está baixa (o limite fica nas Configurações), ou quando você clica em Rodar explorador agora.",
  roundHelp:
    "Uma passada do explorador: ele planeja o que olhar, os revisores de cada área revisam e então ele abre como issues as descobertas que mais valem a pena. Uma rodada começa no horário que você definiu assim que a fila fica baixa, ou na hora com Rodar explorador agora.",
  checkNowHelp: {
    light:
      "Executa agora a verificação regular da fábrica (ela roda a cada 30 segundos): avança o trabalho em andamento, pega issues novas e inicia agentes livres.",
    dark: "Executa agora a verificação regular da fábrica (ela roda a cada 30 segundos): avança o trabalho em andamento, pega issues novas, inicia agentes livres e inicia o explorador se estiver na hora.",
  },
  wipHelp:
    "O limite de trabalho em andamento. Com esse número de pull requests da fábrica abertos, a fábrica os termina antes de começar outros: nenhuma construção nova sai da fila, o explorador não abre nada e os agentes livres vão para revisões, correções e rebases até que um receba merge ou seja fechado. Construções que ainda não abriram o pull request também ocupam espaço, já que cada uma vai abrir. Correções para verificações com falha na branch padrão continuam começando. Pull requests de trabalho com falha ou escalado, que aguardam você, não contam (trabalho que falhou por um motivo fora do código volta sozinho, e o pull request dele também, a menos que aguarde um provedor desconectado ou no limite de uso). Menos PRs abertos significa menos conflitos de merge entre eles.",
  providerWaitHelp:
    "Trabalho que falhou por um motivo fora do código, como o provedor do agente estar desconectado ou no limite de uso, volta sozinho assim que esse provedor puder trabalhar de novo. Até lá o pull request dele não conta para o máximo de PRs abertos, então o trabalho novo continua com os outros provedores. Conecte o provedor (ou espere o limite renovar) para que ele continue.",
  slotOrderHelp:
    "Um agente livre vai primeiro para as revisões (PRs com a CI aprovada, depois rebases e rodadas de revisão, depois PRs com a CI ainda rodando), depois para as construções e, por último, para o explorador. O trabalho em andamento nunca é interrompido.",
  wipLabel: "Terminando o trabalho aberto ({{openPrs}} de {{limit}} PRs abertos)",
  reviewAreasHelp:
    "Quantos agentes revisores focados o explorador pode usar em uma rodada, cada um olhando uma área do app: segurança, UI e UX, desempenho, documentação e assim por diante. Cada um consome tokens; 0 significa que o explorador revisa sozinho.",
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
};
