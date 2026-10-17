// Loads and validates the wallet and credential templates under wallets/ and
// credentials/. Shared by build-index.mjs, which refuses to publish invalid
// templates, and validate-templates.mjs, which checks them on pull requests.
//
// The checks are structural: a template has to be loadable and identifiable by
// the consumers (tw-web-app, nexus-ai-backend, twt). Whether a wallet config is
// accepted by the wallet service is not checked here.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dirname, "..");
export const walletsDir = path.join(repoRoot, "wallets");
export const credentialsDir = path.join(repoRoot, "credentials");

// Index files are generated into the template directories, so they are not
// templates themselves.
export const INDEX_FILE = "index.json";

export const TRUST_FRAMEWORKS = ["EBSI", "EUDI", "IDTL", "NOOP"];

/**
 * The file name, without ".json", of the credential template for a credential
 * type id: lowercased, with every run of other characters than a-z and 0-9
 * replaced by "-". Type ids contain ":" and ",", which are not valid in file
 * names on every platform, and a derived name lets a consumer locate a template
 * from its type id without the index - e.g. at a pinned commit, where the
 * generated index does not exist.
 */
export function credentialSlug(credentialTypeId) {
  return credentialTypeId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function jsonFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });

  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)).split(path.sep).join("/"))
    .filter((rel) => rel !== INDEX_FILE)
    .sort();
}

async function parseJson(dir, rel, errors, label) {
  try {
    return JSON.parse(await readFile(path.join(dir, rel), "utf8"));
  } catch (err) {
    errors.push(`${label}/${rel}: not valid JSON: ${err.message}`);
    return undefined;
  }
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function nonEmptyString(v) {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Wallet templates live at wallets/<framework>/.../<slug>.json. The template id
 * is that path without ".json", e.g. "noop/triveria_org".
 */
export async function loadWalletTemplates(errors) {
  const templates = [];

  for (const rel of await jsonFiles(walletsDir)) {
    const where = `wallets/${rel}`;
    const template = await parseJson(walletsDir, rel, errors, "wallets");
    if (template === undefined) continue;

    if (!isObject(template)) {
      errors.push(`${where}: must be a JSON object`);
      continue;
    }

    const id = rel.replace(/\.json$/, "");
    const folder = id.split("/")[0];

    if (!id.includes("/")) {
      errors.push(`${where}: must be in a trust framework folder, e.g. wallets/noop/${rel}`);
    }
    if (!nonEmptyString(template.name)) {
      errors.push(`${where}: "name" must be a non-empty string`);
    }
    if (template.description !== undefined && typeof template.description !== "string") {
      errors.push(`${where}: "description" must be a string`);
    }
    if (!isObject(template.config)) {
      errors.push(`${where}: "config" must be an object`);
      continue;
    }

    const framework = template.config.trustFramework;
    if (!TRUST_FRAMEWORKS.includes(framework)) {
      errors.push(`${where}: "config.trustFramework" must be one of ${TRUST_FRAMEWORKS.join(", ")}, got ${JSON.stringify(framework)}`);
    } else if (framework.toLowerCase() !== folder) {
      errors.push(`${where}: "config.trustFramework" is ${framework}, so the template belongs in wallets/${framework.toLowerCase()}/`);
    }

    templates.push({ id, framework, path: `wallets/${rel}`, template });
  }

  return templates;
}

/**
 * Credential templates live at credentials/<slug>.json, where the slug is
 * credentialSlug(credentialTypeId).
 */
export async function loadCredentialTemplates(errors) {
  const templates = [];
  const bySlug = new Map();

  for (const rel of await jsonFiles(credentialsDir)) {
    const where = `credentials/${rel}`;
    const template = await parseJson(credentialsDir, rel, errors, "credentials");
    if (template === undefined) continue;

    if (!isObject(template)) {
      errors.push(`${where}: must be a JSON object`);
      continue;
    }

    if (rel.includes("/")) {
      errors.push(`${where}: credential templates must not be in subfolders`);
    }
    for (const key of ["credentialTypeId", "name", "format"]) {
      if (!nonEmptyString(template[key])) {
        errors.push(`${where}: "${key}" must be a non-empty string`);
      }
    }
    if (template.description !== undefined && typeof template.description !== "string") {
      errors.push(`${where}: "description" must be a string`);
    }

    // The form and the display are JSON documents serialized into strings.
    const definition = template.subjectDefinition;
    if (!isObject(definition)) {
      errors.push(`${where}: "subjectDefinition" must be an object`);
    } else {
      for (const key of ["form", "display"]) {
        if (typeof definition[key] !== "string") {
          errors.push(`${where}: "subjectDefinition.${key}" must be a string holding JSON`);
          continue;
        }
        try {
          JSON.parse(definition[key]);
        } catch (err) {
          errors.push(`${where}: "subjectDefinition.${key}" is not valid JSON: ${err.message}`);
        }
      }
    }

    if (!nonEmptyString(template.credentialTypeId)) continue;

    const slug = credentialSlug(template.credentialTypeId);
    if (rel !== `${slug}.json`) {
      errors.push(`${where}: a template of credential type "${template.credentialTypeId}" must be named credentials/${slug}.json`);
    }

    const duplicate = bySlug.get(slug);
    if (duplicate) {
      errors.push(`${where}: credential type "${template.credentialTypeId}" has the same file name as "${duplicate}" in credentials/${slug}.json`);
    }
    bySlug.set(slug, template.credentialTypeId);

    templates.push({ credentialTypeId: template.credentialTypeId, path: `credentials/${rel}`, template });
  }

  return templates;
}

/** Loads all templates and throws listing every problem found. */
export async function loadTemplates() {
  const errors = [];
  const wallets = await loadWalletTemplates(errors);
  const credentials = await loadCredentialTemplates(errors);

  if (errors.length > 0) {
    const err = new Error(`${errors.length} invalid template(s):\n  ${errors.join("\n  ")}`);
    err.templateErrors = errors;
    throw err;
  }

  return { wallets, credentials };
}
