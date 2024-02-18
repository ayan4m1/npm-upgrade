import _ from 'lodash';
import { program } from 'commander';
import { Separator } from 'inquirer';

import Config from '../../utils/config.js';
import { askUser, colors } from '../../utils/index.js';
import {
  createIgnoredPackagesTable,
  askIgnoreFields
} from '../../utils/ignore.js';
import {
  DEPS_GROUPS,
  loadPackageJson,
  getModuleVersion
} from '../../utils/package.js';

const { strong, success, attention } = colors;

function makePackageIgnoreList(ignoredPackagesObj) {
  const { content: packageJson } = loadPackageJson();
  const ignoredPackages = _.keys(ignoredPackagesObj);

  return _.transform(DEPS_GROUPS, (list, group) => {
    const groupPackages = _.keys(packageJson[group.field]);
    const availableToIgnore = _.difference(groupPackages, ignoredPackages);

    if (availableToIgnore.length) {
      list.push(
        new Separator(strong(`--- ${group.field} ---`)),
        ...availableToIgnore
      );
    }
  });
}

try {
  await program.argument('[package]', 'Name of package to ignore').parseAsync();

  let { package: packageName } = program.opts();
  const config = new Config();

  config.ignore = config.ignore || {};
  console.log(
    `Currently ignored packages:\n\n${createIgnoredPackagesTable(config.ignore)}\n`
  );

  if (
    packageName &&
    !getModuleVersion(packageName, loadPackageJson().content)
  ) {
    console.log(
      attention(
        `Couldn't find package ${strong(packageName)} in ${strong('package.json')}. Choose existing package.\n`
      )
    );
    packageName = null;
  }

  let ignoreMore;
  do {
    if (!packageName) {
      packageName = await askUser({
        type: 'list',
        message: 'Select package to ignore:',
        choices: makePackageIgnoreList(config.ignore),
        pageSize: 20
      });
    }

    config.ignore[packageName] = await askIgnoreFields('*');
    config.save();

    console.log(
      success(`\nPackage ${strong(packageName)} added to ignored list.\n`)
    );
    packageName = null;

    ignoreMore = await askUser({
      message: 'Do you want to ignore another package?',
      type: 'confirm'
    });
  } while (ignoreMore);
} catch (error) {
  console.error(error);
  process.exit(1);
}
