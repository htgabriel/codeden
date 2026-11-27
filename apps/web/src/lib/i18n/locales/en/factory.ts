/**
 * Factory: modes, loop and stage labels, pipeline steps, merge checks and their help texts.
 * Keys under the label maps are the contract values (`manual`, `waiting_ci`, …) so
 * `components/factory/meta.ts` can look them up by value.
 */
export const factory = {
  mode: {
    manual: {
      label: "Manual",
      summary: "You drive every session. Automations only run when you start them.",
      finds: "You",
      merges: "You",
    },
    assisted: {
      label: "Assisted",
      summary: "You, the PM and automations find work; you review and merge every PR.",
      finds: "You, the PM, automations",
      merges: "You",
    },
    software_factory: {
      label: "Software factory",
      summary:
        "Issues filed on GitHub by you or trusted people are classified as a bug, feature or docs change and built by a pool of agents. Each ends in a PR with test results and screenshots.",
      finds: "You and trusted authors, on GitHub",
      merges: "You (or CodeDen, with auto-merge)",
    },
    dark_factory: {
      label: "Dark factory",
      summary:
        "The software factory, plus a scheduled scout that reviews the app against the vision and files the issues itself. You can step away.",
      finds: "The scout, you and trusted authors",
      merges: "You (or CodeDen, with auto-merge)",
    },
  },
  loop: {
    idle: "Idle",
    discovering: "Scouting",
    building: "Building",
    verifying: "Verifying",
    paused: "Paused",
    stopped: "Stopped",
    draining: "Draining",
  },
  stage: {
    candidate: "Identifying type",
    ignored: "Ignored (untrusted author)",
    backlog: "Queued",
    building: "Building",
    verifying: "Verifying",
    watching: "Watching main",
    merged: "Merged",
    reverted: "Reverted",
    rejected: "Stopped",
    failed: "Failed",
    escalated: "Needs you",
  },
  prState: {
    checking: {
      label: "Checking",
      help: "The merge checks are running: the review, tests and evidence.",
    },
    waiting_ci: {
      label: "Waiting for CI",
      help: "CI is running, or yet to start, on the newest commit.",
    },
    queued: {
      label: "Queued",
      help: "Every check passed. The factory merges every pull request that is ready, oldest approved first, seconds apart.",
    },
    updating: {
      label: "Updating",
      help: "Behind the default branch and due a re-test: GitHub merges the default branch in, then CI runs on the new head. No agent is needed.",
    },
    rebasing: {
      label: "Rebasing",
      help: "Merge conflicts with the default branch: the author (or an integrator, when the author's session is gone) rebases it. This isn't a revise round.",
    },
    rebuilding: {
      label: "Rebuilding",
      help: "It still conflicted after three requests to rebase, so the work is redone from the default branch. The new pull request replaces this one.",
    },
    superseded: {
      label: "Superseded",
      help: "A newer pull request for the same work replaced this one. The factory closes it with a link to the new one.",
    },
    merged: { label: "Merged", help: "Merged today." },
    waiting_for_you: {
      label: "Waiting for you",
      help: "A person merges this one (auto-merge is off, a protected area or an untrusted author), or its checks failed: then Retry sends it back to a fresh review, and new commits on it are re-reviewed by themselves. The factory keeps it free of merge conflicts meanwhile.",
    },
    stuck: {
      label: "Stuck",
      help: "The factory can't settle this by itself: it was already rebuilt once, or CI can never run. It is in your inbox.",
    },
  },
  source: {
    discovery: "Dark factory scout",
    issue: "GitHub issue",
    failed_check: "Failed check on main",
    revert: "Revert",
  },
  type: {
    bug: "Bug",
    feature: "Feature",
    docs: "Documentation",
  },
  outcome: {
    reproduced: "Reproduced",
    not_reproduced: "Not reproduced",
    implement: "Build it",
    already_done: "Already possible",
    needs_info: "Needs more information",
    out_of_scope: "Out of scope",
  },
  area: {
    features: "Features",
    ux: "UI & UX",
    performance: "Performance",
    tech_debt: "Code quality",
    test_gaps: "Test gaps",
    security: "Security",
    bugs: "Bugs",
    docs: "Docs",
  },
  step: {
    intake: "Identify type",
    queued: "Waiting for an agent",
    reproduce: "Reproduce",
    analyze: "Analyze feature",
    implementBug: "Create fix",
    implementDocs: "Implement docs change",
    implementFeature: "Implement feature",
    reviewBug: "Review fix",
    reviewDocs: "Checks",
    reviewFeature: "Review feature",
    merge: "Merge",
    ignored: "Ignored",
    done: "Done",
    stopped: "Stopped",
  },
  lane: {
    bug: "Each issue is sorted into a lane by type, and each lane has its own steps. Bugs are reproduced first, so the fix is proven against a failing test.",
    feature:
      "Each issue is sorted into a lane by type, and each lane has its own steps. Features are analyzed first: does it exist already, and does it fit the vision?",
    docs: "Each issue is sorted into a lane by type, and each lane has its own steps. Documentation changes go straight to implementation and only need the automated checks.",
  },
  issueHelp: {
    dark: "Work starts as a GitHub issue, filed by the scout, by you or by a trusted author. Issues from anyone else are ignored until you let them in.",
    light:
      "Work starts as a GitHub issue filed by you or a trusted author. Issues from anyone else are ignored until you let them in.",
  },
  stepHelp: {
    intake:
      "One quick model call reads each new issue and sorts it into the Bug, Feature or Documentation lane (a type label on the issue decides it instead). It then waits for a free agent.",
    queued:
      "Waiting for a free agent. Reviews, revise rounds and rebases of open pull requests get free agents first; then items are picked by priority, then age. At the open pull request limit nothing new starts until one merges, and an item likely to touch the files of an open pull request waits behind items that don't.",
    reproduce:
      "An agent writes a failing test or probe that shows the bug. Once it's reproduced, the same agent moves on to the fix; if it can't be, the work stops and the issue asks for more information.",
    analyze:
      "An agent checks whether the feature exists already and fits the vision, then posts a spec with acceptance criteria on the issue. An accepted spec moves it on to Implement; otherwise the work stops with the reason.",
    implementBug:
      "The same agent fixes the bug in its own worktree and opens a pull request with its test results. The pull request moves it on to review.",
    implementDocs:
      "An agent makes the documentation change in its own worktree and opens a pull request. The pull request moves it on to the checks.",
    implementFeature:
      "The same agent builds the feature to the spec in its own worktree and opens a pull request with test results, and screenshots for UI changes. The pull request moves it on to review.",
    reviewDocs:
      "The merge checks run on the pull request; a change that touches only documentation skips the agent review. With every check green it moves on to Merge.",
    review:
      "A separate reviewer agent checks the pull request while the merge checks run. Approved with every check green, it moves on to Merge; otherwise it goes back to the builder to revise.",
    mergeAuto:
      "With every check green, CodeDen merges the pull request itself and watches CI on main; a regression opens a revert and pauses the factory. Work let in from an untrusted author always waits for you.",
    mergeManual:
      "With every check green, the pull request is ready for you: review it and merge it on GitHub.",
    ignored:
      "Opened by someone who isn't a trusted author, so the factory leaves it alone until you let it in.",
    done: "Merged.",
    stopped:
      "The work stopped: not reproduced, declined, failed or closed. Retry runs it again: with its pull request still open, that pull request goes back to a fresh review; otherwise the work starts over. A failed pull request that gets new commits is re-reviewed by itself.",
  },
  reviseHelp:
    "When the reviewer asks for changes or a merge check fails, the work goes back to the same builder to revise it, a few times at most. The number is how many are being revised now.",
  scoutHelp:
    "An agent that periodically reviews the app against your vision and files issues for the work worth doing. It only looks when the queue runs low (the threshold is in Settings), or when you click Run scout now.",
  roundHelp:
    "One pass of the scout: it plans what to look at, its area reviewers review, then it files the findings most worth doing as issues. A round starts on the schedule you set once the queue runs low, or right away with Run scout now.",
  checkNowHelp: {
    light:
      "Runs the factory's regular check immediately (it runs every 30 seconds): moves work in progress, picks up new issues, starts free agents.",
    dark: "Runs the factory's regular check immediately (it runs every 30 seconds): moves work in progress, picks up new issues, starts free agents, and starts the scout if it's due.",
  },
  wipHelp:
    "The work-in-progress limit. With this many factory pull requests open, the factory finishes them before it starts more: no new build starts from the queue, the scout files nothing, and free agents go to reviews, fixes and rebases until one merges or closes. Builds that haven't opened their pull request yet take room too, since each will. Fixes for failing checks on the default branch still start. Pull requests of failed or escalated work, which wait for you, don't count (work that failed for a reason outside its code goes back by itself, so its pull request does, unless it waits on a provider that is signed out or at its usage limit). Fewer open PRs means fewer merge conflicts between them.",
  providerWaitHelp:
    "Work that failed for a reason outside its code, such as its agent's provider being signed out or at its usage limit, goes back by itself once that provider can work again. Until then its pull request doesn't count toward PRs open at most, so new work carries on with the other providers. Sign the provider in (or wait for its limit to reset) to let it continue.",
  slotOrderHelp:
    "A free agent goes to reviews first (PRs whose CI passed, then rebases and revise rounds, then PRs whose CI still runs), then to builds, and to the scout last. Work in progress is never interrupted.",
  wipLabel: "Finishing open work ({{openPrs}} of {{limit}} PRs open)",
  reviewAreasHelp:
    "How many focused reviewer agents the scout may use in a round, each looking at one area of the app: security, UI & UX, performance, docs and so on. Each costs tokens; 0 means the scout reviews by itself.",
  check: {
    ci: "CI",
    tests: "Tests",
    test_results: "Test results",
    review: "Review",
    security: "Security",
    ui_evidence: "Screenshots",
    size: "Size",
    protected_paths: "Protected areas",
  },
  checkHelp: {
    ci: "The PR's checks passed on GitHub.",
    tests: "Tests changed with the code, or the change needs none.",
    test_results: "The PR reports its test results (a Test results section or attached output).",
    review: "An independent reviewer session approved it (docs-only changes skip it).",
    security: "The audit command and the reviewer found no concerns.",
    ui_evidence: "UI changes have screenshots attached.",
    size: "Small enough for the factory.",
    protected_paths: "Touches no protected area from the vision or the limits.",
  },
} as const;
