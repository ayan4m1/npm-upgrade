import Config from '../../utils/config.js';
import { createIgnoredPackagesTable } from '../../utils/ignore.js';

try {
  const config = new Config();

  config.ignore = config.ignore || {};
  console.log(
    `Currently ignored packages:\n\n${createIgnoredPackagesTable(config.ignore)}\n`
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}
