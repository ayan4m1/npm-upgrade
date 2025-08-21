import jsonfile from 'jsonfile';
import { program } from 'commander';

import { overridesPath } from '../utils/changelog.js';

const { readFile, writeFile } = jsonfile;

const sortObjectKeysAlphabetically = (object) =>
  Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b))
  );

(async () => {
  try {
    await program
      .argument('<packageName>', 'Name of the package')
      .argument('<changelogUrl>', 'URL pointing to the changelog')
      .parseAsync();

    const [packageName, changelogUrl] = program.args;
    const overrides = await readFile(overridesPath);

    overrides[packageName] = changelogUrl;

    await writeFile(overridesPath, sortObjectKeysAlphabetically(overrides));

    console.log(
      `Changelog URL for package ${packageName} set to ${changelogUrl}`
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
