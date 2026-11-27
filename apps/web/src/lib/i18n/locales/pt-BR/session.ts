import type { Catalog } from "../en";
import type { session } from "../en/session";

/** Brazilian Portuguese for `../en/session.ts`. */
export const sessionBR: Catalog<typeof session> = {
  handoff: {
    writing: "Escrevendo o resumo da passagem…",
    continued: "Continuada numa nova sessão do {{name}}",
    continuedDescription:
      "Ela tem o código desta sessão e um resumo do trabalho. Esta sessão continua igual.",
  },
  fork: {
    forking: "Fazendo fork da sessão…",
    pending: "Fazendo fork…",
    forked: "Fork criado numa nova sessão",
    afterTurnDescription:
      "Ela tem a conversa e o código como estavam depois daquele turno. A original continua igual.",
    soFarDescription: "Ela tem a conversa e o código até agora. A original continua igual.",
  },
  archive: {
    undo: "Desfazer",
    containerDeleted: "Sessão arquivada e o container dela excluído",
    worktreeRemoved: "Sessão arquivada e a worktree dela removida",
    archived: "Sessão arquivada",
    keptUnpushed:
      "Sessão arquivada. O container foi mantido: ele tem trabalho que não está em nenhum remoto.",
    keptUnpushedDescription: "{{work}}. Excluir mesmo assim apaga esse trabalho de vez.",
    deleteAnyway: "Excluir mesmo assim",
    pushFirst: "Fazer push da branch antes",
    keptChanges: "Sessão arquivada. A worktree tem alterações não commitadas, então foi mantida.",
    removeAnyway: "Remover mesmo assim",
    notRemoved: "Sessão arquivada, mas ainda não foi possível remover a worktree",
    tryAgain: "Tentar de novo",
  },
  actions: {
    stopped: "Sessão parada",
    restored: "Sessão restaurada na barra lateral",
    pushFailed: "Não foi possível fazer push da branch",
    exportFailed: "Não foi possível exportar a sessão",
    downloaded: "{{fileName}} baixado",
    copiedMarkdown: "Copiado como Markdown",
    linkCopied: "Link copiado",
    markdownHint: "Segredos ocultados",
  },
  blocked: {
    notARepo: "A pasta do projeto não é um repositório git",
    answerFirst: "Responda primeiro o que ela está esperando",
    waitForTurn: "Espere o turno em andamento terminar",
    notStarted: "A sessão ainda não começou",
    noConversation: "Ainda não há conversa para fazer fork",
    forkNeedsBranch: "Só dá para fazer fork de sessões numa branch git",
    handoffNeedsBranch: "Só dá para passar adiante sessões numa branch git",
    nothingToHandOff: "Ainda não há nada para passar adiante",
    reviewNeedsBranch: "Só dá para revisar sessões numa branch git",
    nothingToReview: "Ainda não há mudanças para revisar",
  },
  anotherSession: "outra sessão",
  empty: {
    review: {
      title: "Sessão de revisão",
      body: "Revisa as mudanças de <link>{{source}}</link>, só leitura, na sua própria worktree com o código daquela sessão. Quando a worktree estiver pronta, o CodeDen manda ao agente um resumo da revisão como primeira mensagem. A sessão original não muda.",
    },
    handoff: {
      title: "Sessão passada adiante",
      body: "Continua <link>{{source}}</link> com o código até agora, na sua própria worktree e branch. Quando a worktree estiver pronta, o CodeDen manda ao agente um resumo do trabalho como primeira mensagem. A sessão original não muda.",
    },
    fork: {
      title: "Sessão com fork",
      body: "Fork de <link>{{source}}</link>. O agente tem a conversa e o código {{upTo}}, na sua própria worktree e branch. Mande uma mensagem para continuar; a sessão original não muda.",
    },
  },
  origin: {
    upToAfterTurn: "como estavam depois do turno {{n}}",
    upToAfterForkedTurn: "como estavam depois do turno de onde saiu o fork",
    upToSoFar: "até agora",
    codeBranch: "Código: a branch dela",
    codeAfterTurn: "Código: os arquivos depois do turno {{n}}",
    codeEndOfTurn: "Código: os arquivos no fim daquele turno",
    codeStarted: "Código: os arquivos de quando ela começou",
    conversationUpToTurn: "Conversa: até o fim do turno {{n}}",
    conversationUpToForkedTurn: "Conversa: até o fim do turno de onde saiu o fork",
    conversationHandoff: "Conversa: uma nova, aberta com um resumo do trabalho",
    conversationReview: "Conversa: uma nova, só leitura, aberta com um resumo da revisão",
    handedOffFrom: "Passada de",
    reviewOf: "Revisão de",
    forkedFrom: "Fork de",
    forkOf: "Fork de",
  },
};
