import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { resolve, dirname } from 'path';

import changelogUrls from '../../db/changelogUrls.json';
import { sortObjectKeysAlphabetically } from '../utils/index.js';

program
  .argument('<packageName>', 'Name of the package')
  .argument('<changelogUrl>', 'URL pointing to the changelog')
  .parse();

const [packageName, changelogUrl] = program.args;
const __dirname = dirname(fileURLToPath(import.meta.url));
const changelogUrlsPath = resolve(
  __dirname,
  '..',
  '..',
  'db',
  'changelogUrls.json'
);

changelogUrls[packageName] = changelogUrl;

writeFileSync(
  changelogUrlsPath,
  `${JSON.stringify(sortObjectKeysAlphabetically(changelogUrls), null, 4)}\n`
);

console.log(`Changelog URL for package ${packageName} set to ${changelogUrl}`);
