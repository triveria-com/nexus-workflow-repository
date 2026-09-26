import { renderHeader, loadWorkflowData, escapeHtml } from "./common.js";

renderHeader();

const listEl = document.getElementById("workflow-list");

loadWorkflowData()
  .then((workflows) => {
    if (!workflows.length) {
      listEl.innerHTML = `<p class="state-message">No workflows published yet.</p>`;
      return;
    }

    listEl.innerHTML = workflows
      .map(
        (w) => `
          <a class="workflow-card" href="./workflow.html#${encodeURIComponent(w.slug)}">
            <h2>${escapeHtml(w.title)}</h2>
            <p>${escapeHtml(w.summary)}</p>
          </a>
        `
      )
      .join("");
  })
  .catch((err) => {
    console.error(err);
    listEl.innerHTML = `<p class="state-message">Failed to load workflows: ${escapeHtml(err.message)}</p>`;
  });
