import { program } from 'commander';

import { openAndFindChangelog } from '../utils/changelog.js';

(async () => {
  try {
    await program
      .argument('<packageName>', 'Name of the package to search for')
      .parseAsync();

    const [packageName] = program.args;

    await openAndFindChangelog(packageName);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
