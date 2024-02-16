import { program } from 'commander';

import { openAndFindChangelog } from '../utils/changelog.js';

program.argument('<packageName>', 'Name of the package to search for').parse();

try {
  const [packageName] = program.args;

  await openAndFindChangelog(packageName);
} catch (error) {
  console.error(error);
  process.exit(1);
}
