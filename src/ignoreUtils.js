import semver from 'semver';
import keys from 'lodash/keys.js';

import askUser from './askUser.js';
import { createSimpleTable } from './cliTable.js';
import { strong, attention } from './cliStyles.js';

export function createIgnoredModulesTable(
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

export async function askIgnoreFields(defaultVersions) {
  return {
    versions: await askUser({
      message: 'Input version or version range to ignore',
      default: defaultVersions,
      validate: (input) =>
        semver.validRange(input) ? true : 'Input valid semver version range'
    }),
    reason: await askUser({ message: 'Ignore reason' })
  };
}
