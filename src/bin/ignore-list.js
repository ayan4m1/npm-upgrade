import catchAsyncError from '../catchAsyncError.js';
import { createIgnoredModulesTable } from '../ignoreUtils.js';
import Config from '../Config.js';

catchAsyncError(async () => {
  const config = new Config();
  console.log(
    `Currently ignored modules:\n\n${createIgnoredModulesTable(config.ignore)}\n`
  );
})();
