import _ from 'lodash';
import { Separator } from 'inquirer';

import catchAsyncError from '../catchAsyncError.js';
import askUser from '../askUser.js';
import { strong, success, attention } from '../cliStyles.js';
import { createIgnoredModulesTable, askIgnoreFields } from '../ignoreUtils.js';
import Config from '../Config.js';
import {
  DEPS_GROUPS,
  loadPackageJson,
  getModuleVersion
} from '../packageUtils.js';

function makeModulesToIgnoreList(ignoredModulesConfig) {
  const { content: packageJson } = loadPackageJson();
  const ignoredModules = _.keys(ignoredModulesConfig);

  return _.transform(DEPS_GROUPS, (list, group) => {
    const groupModules = _.keys(packageJson[group.field]);
    const availableToIgnore = _.difference(groupModules, ignoredModules);

    if (availableToIgnore.length) {
      list.push(
        new Separator(strong(`--- ${group.field} ---`)),
        ...availableToIgnore
      );
    }
  });
}

catchAsyncError(async (opts) => {
  let { module: moduleName } = opts;
  const config = new Config();
  config.ignore = config.ignore || {};

  console.log(
    `Currently ignored modules:\n\n${createIgnoredModulesTable(config.ignore)}\n`
  );

  if (moduleName && !getModuleVersion(moduleName, loadPackageJson().content)) {
    console.log(
      attention(
        `Couldn't find module ${strong(moduleName)} in ${strong('package.json')}. Choose existing module.\n`
      )
    );
    moduleName = null;
  }

  let ignoreMore;
  do {
    if (!moduleName) {
      moduleName = await askUser({
        type: 'list',
        message: 'Select module to ignore:',
        choices: makeModulesToIgnoreList(config.ignore),
        pageSize: 20
      });
    }

    config.ignore[moduleName] = await askIgnoreFields('*');
    config.save();

    console.log(
      success(`\nModule ${strong(moduleName)} added to ignored list.\n`)
    );
    moduleName = null;

    ignoreMore = await askUser({
      message: 'Do you want to ignore some other module?',
      type: 'confirm'
    });
  } while (ignoreMore);
})();
