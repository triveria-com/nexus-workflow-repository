// Static site configuration. Update these if the repo is renamed/moved.
export const REPO_OWNER = "triveria-com";
export const REPO_NAME = "nexus-workflow-repository";
export const REPO_BRANCH = "main";

export const NEXUS_ENVIRONMENTS = [
  { id: "dev", label: "Dev", baseUrl: "https://nexus.triveria.dev" },
  { id: "public-test", label: "Public Test", baseUrl: "https://nexus.test.triveria.com" },
];

export const DEFAULT_NEXUS_ENVIRONMENT = "dev";

export function rawWorkflowUrl(file) {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/workflows/${file}`;
}

export function githubWorkflowUrl(file) {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${REPO_BRANCH}/workflows/${file}`;
}
