import semver from 'semver';
import keys from 'lodash/keys.js';
import { input } from '@inquirer/prompts';

import { colors } from './index.js';
import { createSimpleTable } from './table.js';

const { strong, attention } = colors;

export function createIgnoredPackagesTable(
  ignoredModulesConfig,
  moduleNames = keys(ignoredModulesConfig)
) {
  const rows = moduleNames.map((moduleName) => [
    strong(moduleName),
    attention(ignoredModulesConfig[moduleName].versions),
    ignoredModulesConfig[moduleName].reason
  ]);

  // Table header
  rows.unshift(
    ['', 'Ignored versions', 'Reason'].map((header) => strong(header))
  );

  return createSimpleTable(rows, { colAligns: 'lcl' });
}

export const askIgnoreFields = async (defaultVersions) => ({
  versions: await input({
    message: 'Input version or version range to ignore',
    default: defaultVersions,
    validate: (input) =>
      semver.validRange(input) ? true : 'Input valid semver version range'
  }),
  reason: await input({ message: 'Ignore reason' })
});
