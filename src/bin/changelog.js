import open from 'open';

import catchAsyncError from '../catchAsyncError.js';
import { findModuleChangelogUrl } from '../changelogUtils.js';
import { strong } from '../cliStyles.js';

const pkg = await import('../../package.json');

catchAsyncError(async (opts) => {
  const { moduleName } = opts;

  console.log(`Trying to find changelog URL for ${strong(moduleName)}...`);
  let changelogUrl;
  try {
    changelogUrl = await findModuleChangelogUrl(moduleName);
  } catch (err) {
    if (err.code === 'E404') {
      console.log("Couldn't find info about this module in npm registry");
      return;
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
})();
