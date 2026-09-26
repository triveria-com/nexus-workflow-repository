import { renderHeader, loadWorkflowData, getSelectedEnvironment, escapeHtml } from "./common.js";
import { NEXUS_ENVIRONMENTS, rawWorkflowUrl } from "./config.js";

const main = document.getElementById("workflow-main");
const slug = decodeURIComponent(window.location.hash.slice(1));

function buildImportUrl(workflow, environmentId) {
  const env = NEXUS_ENVIRONMENTS.find((e) => e.id === environmentId) || NEXUS_ENVIRONMENTS[0];
  const rawUrl = rawWorkflowUrl(workflow.file);
  return `${env.baseUrl}/workflow_from_repository?workflow_url=${encodeURIComponent(rawUrl)}`;
}

function renderQuestions(questions) {
  if (!questions || !questions.length) return "";
  const rows = questions
    .map((q) => {
      const required = q.required
        ? `<span class="badge required">Required</span>`
        : `<span class="badge optional">Optional</span>`;
      const options = Array.isArray(q.options) && q.options.length
        ? `<ul class="options-list">${q.options.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>`
        : "&mdash;";
      const hint = q.hint ? `<div class="hint">${escapeHtml(q.hint)}</div>` : "";
      return `
        <tr>
          <td><code>${escapeHtml(q.id ?? "")}</code></td>
          <td>${escapeHtml(q.prompt ?? "")}${hint}</td>
          <td>${required}</td>
          <td>${options}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="panel">
      <h2>Questions</h2>
      <table class="questions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Prompt</th>
            <th>Required</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderExtraFrontmatter(frontmatter) {
  return `
    <details class="raw-frontmatter panel">
      <summary>Raw YAML frontmatter</summary>
      <pre><code>${escapeHtml(JSON.stringify(frontmatter, null, 2))}</code></pre>
    </details>
  `;
}

function render(workflow) {
  document.title = `${workflow.title} — Triveria NEXUS Workflows`;

  const importUrl = buildImportUrl(workflow, getSelectedEnvironment().id);

  main.innerHTML = `
    <a class="back-link" href="./index.html">&larr; All workflows</a>
    <div class="workflow-header">
      <div class="titles">
        <div class="slug-tag">${escapeHtml(workflow.slug)}</div>
        <h1 class="page-title">${escapeHtml(workflow.title)}</h1>
        <p class="page-subtitle">${escapeHtml(workflow.summary)}</p>
      </div>
      <a class="import-button" id="import-button" href="${importUrl}" target="_blank" rel="noopener">
        Import to NEXUS
      </a>
    </div>

    ${renderQuestions(workflow.questions)}
    ${renderExtraFrontmatter(workflow.frontmatter)}

    <div class="markdown-body">${marked.parse(workflow.content)}</div>
  `;
}

if (!slug) {
  main.innerHTML = `<p class="state-message">No workflow specified.</p>`;
} else {
  let currentWorkflow;
  renderHeader({
    onEnvironmentChange: (environmentId) => {
      if (!currentWorkflow) return;
      const btn = document.getElementById("import-button");
      if (btn) btn.href = buildImportUrl(currentWorkflow, environmentId);
    },
  });
  loadWorkflowData()
    .then((workflows) => {
      const workflow = workflows.find((w) => w.slug === slug);
      if (!workflow) {
        main.innerHTML = `<p class="state-message">Workflow "${escapeHtml(slug)}" was not found.</p>`;
        return;
      }
      currentWorkflow = workflow;
      render(workflow);
    })
    .catch((err) => {
      console.error(err);
      main.innerHTML = `<p class="state-message">Failed to load workflow: ${escapeHtml(err.message)}</p>`;
    });
}
