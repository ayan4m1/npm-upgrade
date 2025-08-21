import _ from 'lodash';
import { program } from 'commander';
import { confirm, checkbox } from '@inquirer/prompts';

import Config from '../../utils/config.js';
import { colors } from '../../utils/index.js';
import { createIgnoredPackagesTable } from '../../utils/ignore.js';

const { success, strong, attention } = colors;

(async () => {
  try {
    await program
      .argument('[packages...]', 'Names of packages to stop ignoring')
      .parseAsync();

    let packagesToRemove = program.args;
    let invalidPackages = [];
    const config = new Config();
    const ignoredPackages = _.keys(config.ignore);

    console.log(
      `Currently ignored packages:\n\n${createIgnoredPackagesTable(config.ignore)}\n`
    );

    if (packagesToRemove.length) {
      [packagesToRemove, invalidPackages] = _.partition(
        packagesToRemove,
        (moduleName) => _.includes(ignoredPackages, moduleName)
      );

      if (invalidPackages.length) {
        console.log(
          attention(
            `These modules are not in the ignored list: ${strong(invalidPackages.join(', '))}\n`
          )
        );
      }
    }

    if (!packagesToRemove.length || invalidPackages.length) {
      packagesToRemove = await checkbox({
        message: 'Select ignored modules to reset:',
        choices: ignoredPackages,
        default: packagesToRemove
      });
      console.log();
    }

    if (!packagesToRemove.length) {
      console.log(attention('Nothing to reset'));
      process.exit(0);
    }

    console.log(
      `These ignored modules will be reset:\n\n${createIgnoredPackagesTable(config.ignore, packagesToRemove)}\n`
    );

    const confirmResult = await confirm({
      message: 'Are you sure?',
      default: false
    });

    if (confirmResult) {
      config.ignore = _.omit(config.ignore, packagesToRemove);
      config.save();

      console.log(success('\nDone!'));
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
