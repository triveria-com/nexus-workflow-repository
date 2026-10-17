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
    if (!nonEmptyString(template.description)) {
      errors.push(`${where}: "description" must be a non-empty string`);
    }
    if (!nonEmptyString(template.summary)) {
      errors.push(`${where}: "summary" must be a non-empty string`);
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
 * Checks that every form item is complete and every display item renders a form
 * item: a display key without one is a field the issuance form never fills in.
 * Returns the claims the form defines, or undefined when the form is malformed.
 */
function checkFormAndDisplay(where, form, display, errors) {
  if (!Array.isArray(form?.groups)) {
    errors.push(`${where}: "subjectDefinition.form" must have a "groups" list`);
    return undefined;
  }

  const claims = new Set();
  for (const group of form.groups) {
    for (const item of Array.isArray(group?.items) ? group.items : []) {
      const missing = ["key", "name", "dataType", "format"].filter((k) => !nonEmptyString(item?.[k]));
      if (missing.length > 0) {
        errors.push(`${where}: form item "${item?.key ?? "(no key)"}" has no ${missing.join(", ")}`);
      }
      if (nonEmptyString(item?.key)) claims.add(item.key);
    }
  }

  if (!Array.isArray(display?.columns)) {
    errors.push(`${where}: "subjectDefinition.display" must have a "columns" list`);
    return claims;
  }
  for (const column of display.columns) {
    for (const item of (Array.isArray(column?.displayItems) ? column.displayItems : []).flat()) {
      if (!claims.has(item?.key)) {
        errors.push(`${where}: display item "${item?.key}" has no form item`);
      }
    }
  }

  return claims;
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
    if (!nonEmptyString(template.description)) {
      errors.push(`${where}: "description" must be a non-empty string`);
    }
    if (!nonEmptyString(template.summary)) {
      errors.push(`${where}: "summary" must be a non-empty string`);
    }

    // The form and the display are JSON documents serialized into strings.
    const definition = template.subjectDefinition;
    const parsed = {};
    if (!isObject(definition)) {
      errors.push(`${where}: "subjectDefinition" must be an object`);
    } else {
      for (const key of ["form", "display"]) {
        if (typeof definition[key] !== "string") {
          errors.push(`${where}: "subjectDefinition.${key}" must be a string holding JSON`);
          continue;
        }
        try {
          parsed[key] = JSON.parse(definition[key]);
        } catch (err) {
          errors.push(`${where}: "subjectDefinition.${key}" is not valid JSON: ${err.message}`);
        }
      }
    }
    const claims = parsed.form && parsed.display ? checkFormAndDisplay(where, parsed.form, parsed.display, errors) : undefined;

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

    templates.push({ credentialTypeId: template.credentialTypeId, path: `credentials/${rel}`, template, claims });
  }

  return templates;
}

// Credential types defined in tw-web-app's code rather than as a template here.
const BUILT_IN_CREDENTIAL_TYPES = ["x509_certificate"];

const TYPE_ARRAY_PATHS = ["$.vc.type", "$.type"];

/**
 * The credential type a verifier requests, inferred the way tw-web-app infers it
 * (src/types/verifierDefinitionHelpers.ts): the first `vct_values` of a DCQL
 * query, else the first Presentation Exchange field that pins `$.vct` with a
 * `const`, or a type array (`$.vc.type`, `$.type`) with `contains.const`.
 */
function verifierCredentialType(verifier) {
  for (const credential of verifier.dcqlQuery?.credentials ?? []) {
    const vct = credential?.meta?.vct_values?.[0];
    if (typeof vct === "string") return vct;
  }

  for (const descriptor of verifier.presentationDefinition?.input_descriptors ?? []) {
    for (const field of descriptor?.constraints?.fields ?? []) {
      const path = Array.isArray(field?.path) ? field.path : [];
      const filter = field?.filter ?? {};
      if (path.includes("$.vct") && typeof filter.const === "string") return filter.const;
      if (TYPE_ARRAY_PATHS.some((p) => path.includes(p)) && typeof filter.contains?.const === "string") {
        return filter.contains.const;
      }
    }
  }

  return undefined;
}

/**
 * Resolves a type to a known credential type id the way tw-web-app does: an exact
 * match, else the single id whose type chain ends in it (a JWT VC verifier
 * names only the last segment of a chain like
 * `VerifiableCredential,VerifiableAttestation,OrganizationalDigitalIdentifier`).
 */
function resolveCredentialType(type, knownIds) {
  if (knownIds.includes(type)) return type;
  const chainMatches = knownIds.filter((id) => id.split(",").pop().trim() === type);
  return chainMatches.length === 1 ? chainMatches[0] : undefined;
}

/**
 * The credential subject claim a JSONPath like `$.firstName` addresses. Nested
 * paths (a VCDM `$.vc.credentialSubject.…`) and `$.vct` / `$.id`, which carry
 * the type and the holder rather than a subject field, are not checked.
 */
function claimOf(path) {
  if (typeof path !== "string" || !path.startsWith("$.")) return undefined;
  const claim = path.slice(2);
  return claim && !claim.includes(".") && !claim.includes("[") && claim !== "vct" && claim !== "id" ? claim : undefined;
}

/**
 * The claims a verifier requests, per requested credential: each Presentation
 * Exchange input descriptor that pins `$.vct` with a `const`, and each DCQL
 * credential with `vct_values`. A verifier can request several credentials, so
 * every claim is checked against the type it is requested from.
 */
function verifierClaims(verifier) {
  const requested = [];
  for (const descriptor of verifier.presentationDefinition?.input_descriptors ?? []) {
    const fields = descriptor?.constraints?.fields ?? [];
    const vct = fields.find((f) => Array.isArray(f?.path) && f.path.includes("$.vct"))?.filter?.const;
    if (typeof vct === "string") {
      requested.push({ type: vct, claims: fields.map((f) => claimOf(f?.path?.[0])).filter(Boolean) });
    }
  }
  for (const credential of verifier.dcqlQuery?.credentials ?? []) {
    const vct = credential?.meta?.vct_values?.[0];
    if (typeof vct !== "string") continue;
    const claims = (credential.claims ?? [])
      .filter((c) => Array.isArray(c?.path) && c.path.length === 1)
      .map((c) => claimOf(`$.${c.path[0]}`));
    requested.push({ type: vct, claims: claims.filter(Boolean) });
  }
  return requested;
}

/**
 * Cross-template checks: a wallet template that names a credential type without
 * a credential template, an issuer gated on a verifier it does not define, or a
 * claim the credential type does not have, imports cleanly into tw-web-app and
 * then cannot issue or verify it.
 */
function checkReferences(wallets, credentials, errors) {
  const knownIds = [...credentials.map((c) => c.credentialTypeId), ...BUILT_IN_CREDENTIAL_TYPES];
  const claimsByType = new Map(credentials.filter((c) => c.claims).map((c) => [c.credentialTypeId, c.claims]));

  const checkClaims = (path, source, type, claims) => {
    const known = claimsByType.get(type);
    if (!known) return;
    for (const claim of new Set(claims)) {
      if (!known.has(claim)) {
        errors.push(`${path}: ${source} uses claim "${claim}", which the "${type}" credential template does not define`);
      }
    }
  };

  for (const { path, template } of wallets) {
    const issuers = Array.isArray(template.config.credentialIssuers) ? template.config.credentialIssuers : [];
    const verifiers = Array.isArray(template.config.credentialVerifiers) ? template.config.credentialVerifiers : [];
    const verifierIds = new Set(verifiers.map((v) => v?.id));

    for (const issuer of issuers) {
      const type = issuer?.credentialType;
      if (typeof type === "string" && !knownIds.includes(type)) {
        errors.push(`${path}: issuer "${issuer.id}" issues "${type}", which has no credential template`);
      }
      const disclosable = Array.isArray(issuer?.disclosableClaims) ? issuer.disclosableClaims : [];
      const mapped = Object.values(issuer?.issuerConfiguration?.mapping ?? {});
      checkClaims(path, `issuer "${issuer?.id}"`, type, [...disclosable, ...mapped].map(claimOf).filter(Boolean));

      // An issuer with a custom authentication provider takes its data from the
      // provider, so its credentialVerifierId names no verifier of the wallet.
      const verifierId = issuer?.issuerConfiguration?.credentialVerifierId;
      if (typeof verifierId === "string" && !issuer.authnProviderUrl && !verifierIds.has(verifierId)) {
        errors.push(`${path}: issuer "${issuer.id}" requires verifier "${verifierId}", which the template does not define`);
      }
    }

    for (const verifier of verifiers) {
      const type = verifierCredentialType(verifier);
      if (type !== undefined && !resolveCredentialType(type, knownIds)) {
        errors.push(`${path}: verifier "${verifier.id}" requests "${type}", which has no credential template`);
      }
      for (const { type: requestedType, claims } of verifierClaims(verifier)) {
        checkClaims(path, `verifier "${verifier?.id}"`, resolveCredentialType(requestedType, knownIds), claims);
      }
    }
  }
}

/** Loads all templates and throws listing every problem found. */
export async function loadTemplates() {
  const errors = [];
  const wallets = await loadWalletTemplates(errors);
  const credentials = await loadCredentialTemplates(errors);
  checkReferences(wallets, credentials, errors);

  if (errors.length > 0) {
    const err = new Error(`${errors.length} invalid template(s):\n  ${errors.join("\n  ")}`);
    err.templateErrors = errors;
    throw err;
  }

  return { wallets, credentials };
}
