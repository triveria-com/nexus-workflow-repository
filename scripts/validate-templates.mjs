#!/usr/bin/env node
// Checks every wallet and credential template without writing anything. Run on
// pull requests so a broken template is caught before it reaches main, where
// build-index.mjs would refuse to publish it.

import { loadTemplates } from "./templates.mjs";

try {
  const { wallets, credentials } = await loadTemplates();
  console.log(`${wallets.length} wallet and ${credentials.length} credential template(s) are valid`);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
