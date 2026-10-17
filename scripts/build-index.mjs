#!/usr/bin/env node
// Scans workflows/*.md, parses YAML frontmatter + markdown body, and writes
// workflows/data.json — the single data file the static site fetches at
// runtime (see assets/js/*.js).
//
// Also validates the wallet and credential templates and writes their indexes,
// wallets/index.json and credentials/index.json, which tw-web-app,
// nexus-ai-backend and twt read to find the templates. An invalid template
// fails the build, so it is never published.
//
// Run automatically by the GitHub Pages deploy workflow, but safe to re-run
// locally any time a workflow or template file changes.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { credentialsDir, INDEX_FILE, loadTemplates, walletsDir } from "./templates.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const workflowsDir = path.join(repoRoot, "workflows");
const outFile = path.join(workflowsDir, "data.json");

async function buildWorkflows() {
  const entries = await readdir(workflowsDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();

  const workflows = [];
  for (const file of files) {
    const raw = await readFile(path.join(workflowsDir, file), "utf8");
    const { data: frontmatter, content } = matter(raw);

    const slug = frontmatter.slug || file.replace(/\.md$/, "");
    if (!frontmatter.title) {
      throw new Error(`Workflow file "${file}" is missing a "title" in its frontmatter.`);
    }

    workflows.push({
      slug,
      file,
      title: frontmatter.title,
      summary: frontmatter.summary || "",
      questions: frontmatter.questions || [],
      frontmatter,
      content: content.trim(),
    });
  }

  workflows.sort((a, b) => a.title.localeCompare(b.title));

  await writeFile(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), workflows }, null, 2) + "\n");
  console.log(`Wrote ${workflows.length} workflow(s) to ${path.relative(repoRoot, outFile)}`);
}

async function writeIndex(dir, key, entries) {
  const file = path.join(dir, INDEX_FILE);
  await writeFile(file, JSON.stringify({ generatedAt: new Date().toISOString(), [key]: entries }, null, 2) + "\n");
  console.log(`Wrote ${entries.length} ${key.replace(/s$/, "")} template(s) to ${path.relative(repoRoot, file)}`);
}

// The index carries what a consumer needs to list the templates and pick one;
// the template itself is fetched from "path", relative to the site root.
async function buildTemplateIndexes() {
  const { wallets, credentials } = await loadTemplates();

  await writeIndex(
    walletsDir,
    "wallets",
    wallets.map(({ id, framework, path: file, template }) => ({
      id,
      framework,
      name: template.name,
      description: template.description || "",
      path: file,
    })),
  );

  await writeIndex(
    credentialsDir,
    "credentials",
    credentials.map(({ credentialTypeId, path: file, template }) => ({
      credentialTypeId,
      format: template.format,
      name: template.name,
      description: template.description || "",
      path: file,
    })),
  );
}

async function main() {
  await buildTemplateIndexes();
  await buildWorkflows();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
