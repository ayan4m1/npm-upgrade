import open from 'open';
import { program } from 'commander';

import { strong } from '../utils/colors.js';
import { findModuleChangelogUrl } from '../utils/changelog.js';

program.argument('<packageName>', 'Name of the package to search for').parse();

try {
  const pkg = await import('../../package.json');
  const [packageName] = program.args;

  console.log(`Trying to find changelog URL for ${strong(packageName)}...`);
  let changelogUrl;
  try {
    changelogUrl = await findModuleChangelogUrl(packageName);
  } catch (err) {
    if (err.code === 'E404') {
      console.log("Couldn't find info about this module in npm registry");
      process.exit(404);
    }
  }

  if (changelogUrl) {
    console.log(`Opening ${strong(changelogUrl)}...`);
    open(changelogUrl);
  } else {
    console.log(
      "Sorry, we haven't found any changelog URL for this module.\n" +
        `It would be great if you could fill an issue about this here: ${strong(pkg.bugs.url)}\n` +
        'Thanks a lot!'
    );
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
