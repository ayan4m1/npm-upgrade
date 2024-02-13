import Config from '../../utils/config.js';
import { catchAsyncError } from '../../utils/index.js';
import { createIgnoredPackagesTable } from '../../utils/ignore.js';

catchAsyncError(async () => {
  const config = new Config();

  config.ignore = config.ignore || {};
  console.log(
    `Currently ignored packages:\n\n${createIgnoredPackagesTable(config.ignore)}\n`
  );
})();
