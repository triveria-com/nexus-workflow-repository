#!/usr/bin/env node
// Scans workflows/*.md, parses YAML frontmatter + markdown body, and writes
// workflows/data.json — the single data file the static site fetches at
// runtime (see assets/js/*.js). Run automatically by the GitHub Pages deploy
// workflow, but safe to re-run locally any time a workflow file changes.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const repoRoot = path.resolve(import.meta.dirname, "..");
const workflowsDir = path.join(repoRoot, "workflows");
const outFile = path.join(workflowsDir, "data.json");

async function main() {
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

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
