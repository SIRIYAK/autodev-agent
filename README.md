# AutoDev-Agent

AutoDev-Agent is a modular, open-source VS Code extension inspired by Roo Code that orchestrates a multi-agent workflow for architecture planning, code generation, debugging, and documentation assistance. Token-efficient, model-agnostic, and tuned to R/R Shiny flows, it lets statisticians and dev teams co-create R/UIs straight from VS Code—think “Shiny-ready AI copilots” for your data apps.

## Key Architecture

- **Agent Orchestrator:** receives prompts, gathers repo-aware context (prioritizing R/Shiny entry points such as `app.R`, `global.R`, `.Rproj`, or `DESCRIPTION`), and sequences downstream agents through structured JSON tasks.
- **Architect Agent:** translates intent into prioritized, modular JSON tasks and applies heuristics for UI modules, server logic, and dependency management when R or Shiny files are involved.
- **Code Agent:** edits files through `FileEditor`, shows diff previews, and waits for approval. It handles TypeScript, JavaScript, and R artifacts (`.R`, `.Rmd`, Shiny modules, etc.) uniformly.
- **Debug Agent:** analyzes compiler errors, stack traces, or R logs (e.g., `R CMD check`, `testthat`, `shiny` warnings) and returns a root cause plus patch suggestion.
- **Ask Agent:** answers follow-up questions by combining summarized files, dependencies, detected languages, and entry points so responses cite the most relevant assets.
- **Supporting Tools:** `RepoScanner`/`ContextBuilder` collect metadata, `TerminalRunner` executes commands (npm, Rscript) and feeds results to the Debug Agent, and the sidebar/chat webviews keep users informed and enable approvals.

## Getting Started

1. Install dependencies: `npm install`
2. Compile the extension: `npm run build`
3. Launch it from the Run Extension (F5) debugger in VS Code

## Configuration

Configure `agent.config.json` with the default model key, provider entries (OpenAI, Anthropic, local), endpoints, and token-optimization hints such as:

```json
"tokenOptimization": {
  "maxContextFiles": 5,
  "summaryChars": 800
}
```

Provide API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) in environment variables or VS Code secrets before invoking the agents.

## Workflow Overview

1. Trigger `AutoDev-Agent: Start` or open the sidebar.
2. Send a prompt: the Orchestrator builds context and asks the Architect Agent for structured tasks.
3. The Code Agent turns tasks into file edits and diffs; every change pauses so you can review and approve.
4. Run shell or R commands (`npm install`, `npm test`, `Rscript -e "devtools::test()"`, `R CMD check`, `npm run build`) directly from the chat panel; TerminalRunner captures output and the Debug Agent surfaces root causes.
5. Ask technical or documentation questions; the Ask Agent synthesizes answers from the summarized context.

## Detailed Usage Walkthrough

1. **Start a session** – run `AutoDev-Agent: Start`. The chat panel opens beside the active editor with prompt, command, and history panes.
2. **Describe your goal** – articulate the requirement, mention relevant files or packages (e.g., `ggplot2`, Shiny inputs), and emphasize the desired outcome.
3. **Review the Architect’s tasks** – after the Orchestrator summarizes the repo, the Architect Agent returns JSON tasks such as `{ task: "Implement Shiny server filter", metadata: { file: "server.R" } }`.
4. **Approve code edits** – the Code Agent posts path/content proposals. Use the sidebar/chat diff preview to inspect the changes. For R assets (`app.R`, `server.R`, `.Rproj`, module folders), confirm reactive chains, inputs, outputs, and observers before approving.
5. **Run automation commands** – issue commands like `npm run build`, `npm test`, `Rscript -e "devtools::test()"`, or `R CMD check`. TerminalRunner streams the logs to the Debug Agent, which highlights the root cause and suggested patch.
6. **Ask follow-ups** – ask clarifying questions; the Ask Agent cites key context files (`DESCRIPTION`, `renv.lock`, `global.R`, etc.).
7. **Iterate** – repeat prompts for new features or fixes. Each run summarizes the top files guided by the token-optimization settings so payloads stay small.
8. **Share results** – record approved diffs or VSIX exports for R teams (Ant Gravity, Claude, etc.) and mention the prompt/diff pair in tickets or release notes.

## Token Efficiency

- Only the top `maxContextFiles` from `agent.config.json` are summarized and sent to the LLM.
- Summaries are trimmed to `summaryChars` characters to keep tokens low while preserving intent.
- ContextBuilder prioritizes dependencies, discovered languages (including R), and entry points before packaging data.

## R & Shiny Workflows

- Prioritize R artifacts (`app.R`, `global.R`, `server.R`, `ui.R`, module folders, `DESCRIPTION`, `renv.lock`, `.Rproj`) when building context.
- Mention package managers (CRAN, Bioconductor, renv) so the payload includes dependency snapshots and enables accurate module planning.
- Describe UI needs (layout, inputs like `pickerInput`, `sliderInput`, outputs such as plots/tables) and server logic (reactive expressions, observers, DBI pipelines). AutoDev-Agent can propose `fluidPage`, `navbarPage`, `bs4Dash`, and reactive wiring to `renderPlot`, `renderTable`, or custom modules.
- For backend logic, specify reactive data transforms, observers, and database operations (`DBI`, `dplyr`).
- Use prompts such as “Generate a Shiny module with reactive filtering and server tests,” “Add a data table UI tied to `input$region`,” or “Hook `renv` to restore dependencies and run `testthat::test_dir`. ”
- The Debug Agent parses `R CMD check`, `devtools::check()`, or `testthat` output (via `Rscript`) and flags missing packages, outdated dependencies, or reactive violations.

## Testing

- `tests/fileEditor.test.ts`: validates file reads, writes, replacements, and approvals.
- `tests/orchestrator.test.ts`: ensures prompts yield task lists, code results, and debug routing.
- `tests/debugger.test.ts`: verifies JSON parsing of debug responses.

Run `npm test` to execute the suite.

## Example Prompts

1. *"Plan a REST API microservice with handlers and unit tests."*
2. *"Analyze the latest TypeScript build failure and propose a patch."*
3. *"Explain how AutoDev-Agent chooses which files to send to the LLM."*
4. *"Create an R Shiny module with reactive filtering and server tests."*
5. *"Investigate the recent `R CMD check` fault and suggest a fix."*

Each prompt flows through the Architect → Code Agent pipeline, with diffs surfaced through the UI for approval.

## Distribution & Deployment

- Package with `npx vsce package` and attach the `.vsix` to GitHub releases or other marketplaces (Ant Gravity, Claude-friendly portals, etc.).
- Maintain a `vsce publish` workflow for the Visual Studio Marketplace, storing the PAT in GitHub Secrets and triggering publishes on tagged commits.
- Document installation instructions (`code --install-extension path/to/AutoDev-Agent-0.1.0.vsix`) in release notes or README so users can install manually.

## GitHub Repository Guidelines

1. **Pick a repo name** that mirrors the extension (e.g., `AutoDev-Agent` or `autodev-agent`) so it matches `package.json` and is discoverable on GitHub.
2. **Craft a clear description** such as “Modular multi-agent AI coding assistant for VS Code” so search and listing previews explain the project quickly.
3. **Set up issue templates, labels, and the README (this document)** to orient contributors and describe the workflow.
4. **Tag releases** (`git tag v0.1.0 && git push --tags`) so your `.vsix` artifacts can be attached to release pages for download.
5. **Link the GitHub home** in docs (`https://github.com/<org>/autodev-agent`) so users know where to report bugs, request features, or grab the source.

## Community & Support

- Open issues for feature requests, bugs, or deployment questions (including R/Shiny workflows and multi-model setups).
- Share effective prompts to help new contributors replicate your success.
- Contributions are welcome—add agents, improve heuristics, or polish the UI while respecting the modular structure and documenting changes.
- When distributing VSIX manually, consider a shared release branch so R/Shiny developers can grab the latest artifact easily.

## Supporting Documentation

- `docs/skill.md`: explains the skill layer and how agents collaborate.
- `docs/memory.md`: describes the repo summaries and heuristics that act as the extension’s “memory.”
- `docs/attention.md`: covers how context attention is prioritized so the right files reach the LLM.
- `docs/responsible_ai.md`: spells out the responsible AI commitments and privacy safeguards.

## Extending LLMs, Agents, and IDE Support

1. **Fishbone approach to new providers:** map each core concern (API endpoint, authentication, prompt structure, token limits, security/compliance such as MCP) and define how the LLM/agent handles them.
2. **Add providers** in `agent.config.json` (e.g., `custom-stack` pointing to `openai`, `anthropic`, or `local`) with model name, endpoint, and `apiKeyEnv` for secrets.
3. **Secure credentials** via VS Code secrets, environment variables, or vaults; rotate scoped tokens through CI/CD so no keys land in git.
4. **Enable fresh agents** by placing new role-specific adapters under `agents/` and wire them into the orchestrator flow.
5. **Support other IDEs** by keeping the orchestrator/context/agent logic independent of VS Code and swapping the UI layer for a web app, CLI, or another editor front end.
6. **Document the diagram**—store a fishbone diagram or mind map in `docs/` or `images/` so contributors understand the dependencies, controls, and IDE targets.

## Meet Siriyak (Riddle time)

Siriyak is the guide behind AutoDev-Agent. Add the name to extension settings or prompts to keep the voice personal, and embed this riddle somewhere ergonomic:

> *“I steer the agents, yet never type—what am I? I’m the spark that starts each prompt; my name rhymes with the winds of knowledge.”*

Answer: Siriyak, your AI steward. Include the name in docs or notifications so every run feels humanized.
## Responsible AI Practices

- **Audit prompts and outputs** to ensure the agents do not hallucinate sensitive data from your repositories—review summaries before approving edits.
- **Avoid sending secrets** (API keys, credentials) in prompts; keep the context builder focused on code and metadata.
- **Monitor failure handling** so Debug Agent responses degrade gracefully when models return uncertain answers.
- **Log usage** or prompt decisions externally if your deployment requires explainability or audit trails (e.g., MCP/enterprise compliance).
- **Respect privacy and intent:** AutoDev-Agent only summarizes the files you explicitly approve and never uploads raw data, project names, or study identifiers unless you mention them as part of the prompt. Stay proactive by providing clear descriptions so the agents stay focused on the feature you need without scanning unrelated data.

