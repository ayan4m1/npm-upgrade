import _ from 'lodash';

import catchAsyncError from '../catchAsyncError.js';
import askUser from '../askUser.js';
import { success, strong, attention } from '../cliStyles.js';
import { createIgnoredModulesTable } from '../ignoreUtils.js';
import Config from '../Config.js';

catchAsyncError(async (opts) => {
  let { modules: modulesToReset } = opts;
  let invalidModules = [];
  const config = new Config();
  const ignoredModules = _.keys(config.ignore);

  console.log(
    `Currently ignored modules:\n\n${createIgnoredModulesTable(config.ignore)}\n`
  );

  if (modulesToReset.length) {
    [modulesToReset, invalidModules] = _.partition(
      modulesToReset,
      (moduleName) => _.includes(ignoredModules, moduleName)
    );

    if (invalidModules.length) {
      console.log(
        attention(
          `These modules are not in the ignored list: ${strong(invalidModules.join(', '))}\n`
        )
      );
    }
  }

  if (!modulesToReset.length || invalidModules.length) {
    modulesToReset = await askUser({
      type: 'checkbox',
      message: 'Select ignored modules to reset:',
      choices: ignoredModules,
      default: modulesToReset
    });
    console.log();
  }

  if (!modulesToReset.length) {
    return console.log(attention('Nothing to reset'));
  }

  console.log(
    `These ignored modules will be reset:\n\n${createIgnoredModulesTable(config.ignore, modulesToReset)}\n`
  );

  const confirm = await askUser({
    message: 'Are you sure?',
    type: 'confirm',
    default: false
  });

  if (!confirm) return;

  config.ignore = _.omit(config.ignore, modulesToReset);
  config.save();

  console.log(success('\nDone!'));
})();
