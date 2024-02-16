import open from 'open';
import { program } from 'commander';

import { strong } from '../utils/colors.js';
import { findModuleChangelogUrl } from '../utils/changelog.js';

program.argument('<packageName>', 'Name of the package to search for').parse();

try {
  const pkg = await import('../../package.json');
  const [packageName] = program.args;

  console.log(`Trying to find changelog URL for ${strong(packageName)}...`);
  try {
    const changelogUrl = await findModuleChangelogUrl(packageName);

    if (!changelogUrl) {
      console.log('No URL found, giving up!');
      process.exit(1);
    }

    console.log(`Opening ${strong(changelogUrl)}...`);
    try {
      open(changelogUrl);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  } catch (err) {
    if (err.code === 'E404') {
      console.log("Couldn't find info about this module in npm registry");
      process.exit(404);
    } else {
      console.log(
        `Sorry, we haven't found any changelog URL for this module.
        It would be great if you could fill an issue about this here: ${strong(pkg.bugs.url)}
        Thanks a lot!`
      );
    }
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
