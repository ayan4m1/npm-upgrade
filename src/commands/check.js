import _ from 'lodash';
import open from 'open';
import shell from 'shelljs';
import fp from 'lodash/fp.js';
import { writeFileSync } from 'fs';
import { program } from 'commander';
import detectIndent from 'detect-indent';
import { gt, neq, satisfies, coerce } from 'semver';
import { confirm, select } from '@inquirer/prompts';
// eslint-disable-next-line import-x/default
import queryVersionObj from 'npm-check-updates/build/src/lib/queryVersions.js';
import { colorizeDiff } from 'npm-check-updates/build/src/lib/version-util.js';
import upgradeDependencies from 'npm-check-updates/build/src/lib/upgradeDependencies.js';
import getCurrentDependencies from 'npm-check-updates/build/src/lib/getCurrentDependencies.js';

import Config from '../utils/config.js';
import { colors } from '../utils/index.js';
import { askIgnoreFields } from '../utils/ignore.js';
import { createSimpleTable } from '../utils/table.js';
import { makeFilterFunction } from '../utils/filter.js';
import { fetchRemoteDb, openAndFindChangelog } from '../utils/changelog.js';
import {
  DEPS_GROUPS,
  loadGlobalPackages,
  loadPackageJson,
  setModuleVersion,
  getModuleInfo,
  getModuleHomepage
} from '../utils/package.js';

program.argument('[filter]', 'Package name filter').parse();

// destructuring required here because packages are commonjs
const { flow, map, partition } = fp;
const { default: queryVersions } = queryVersionObj;
const { strong, success, attention } = colors;

const toSentence = (items) =>
  items.length <= 1
    ? items[0] || ''
    : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];

const getVersionsForTarget = async (
  currentVersions,
  target,
  showProgress = false
) =>
  Object.fromEntries(
    Object.entries(
      await queryVersions(currentVersions, {
        target,
        json: showProgress
      })
    ).map(([packageName, { version }]) => [packageName, version])
  );

const sortModules = (modules) => {
  const processedModules = new Set();

  for (let i = 0, len = modules.length; i < len; i++) {
    const module = modules[i];

    if (processedModules.has(module)) {
      continue;
    }

    const normalizedName = module.name.replace(/^@types\//, '');

    if (module.name === normalizedName) {
      continue;
    }

    // Searching for corresponding module
    const originalModuleIndex = modules.findIndex(
      ({ name }) => name === normalizedName
    );

    if (originalModuleIndex === -1 || i === originalModuleIndex + 1) {
      continue;
    }

    if (originalModuleIndex > i) {
      modules.splice(originalModuleIndex + 1, 0, module);
      modules.splice(i, 1);
      processedModules.add(module);
      i--;
    } else {
      modules.splice(i, 1);
      modules.splice(originalModuleIndex + 1, 0, module);
    }
  }
};

const createUpdatedModulesTable = (modules) =>
  createSimpleTable(
    _.map(modules, ({ name, from, to }) => [
      strong(name),
      from,
      '→',
      colorizeDiff(from, to)
    ])
  );

try {
  const { chalkInit } = await import(
    'npm-check-updates/build/src/lib/chalk.js'
  );

  await chalkInit();

  const opts = program.opts();
  const [filter] = program.args;
  // Making function that will filter out deps by module name
  const filterModuleName = makeFilterFunction(filter);

  // Checking all the deps if all of them are omitted
  if (_.every(DEPS_GROUPS, ({ name }) => !opts[name])) {
    _.each(DEPS_GROUPS, ({ name }) => (opts[name] = true));
    opts.global = false;
  } else if (opts.global) {
    // Make global flag mutually exclusive with other flags
    _.each(DEPS_GROUPS, ({ name }) => {
      opts[name] = false;
    });
    opts.global = true;
  }

  // Loading `package.json` from the current directory
  const {
    path: packageFile,
    content: packageJson,
    source: packageSource
  } = opts.global ? loadGlobalPackages() : loadPackageJson();

  // Fetching remote changelogs db in background
  fetchRemoteDb();

  const depsGroupsToCheck = _.filter(DEPS_GROUPS, ({ name }) => !!opts[name]);
  const depsGroupsToCheckStr =
    depsGroupsToCheck.length === DEPS_GROUPS.length
      ? ''
      : `${toSentence(_.map(depsGroupsToCheck, ({ name }) => strong(name)))} `;
  const filteredWith = filter ? `filtered with ${strong(filter)} ` : '';

  console.log(
    `Checking for outdated ${depsGroupsToCheckStr}dependencies ${filteredWith}${
      opts.global ? '' : `for "${strong(packageFile)}"`
    }...`
  );

  const ncuDepGroups = DEPS_GROUPS.filter(({ name }) => opts[name])
    .map(({ ncuValue }) => ncuValue)
    .join(',');
  const currentVersions = getCurrentDependencies.default(packageJson, {
    dep: ncuDepGroups
  });
  const latestVersions = await getVersionsForTarget(
    currentVersions,
    'latest',
    true
  );
  const stableVersions = await getVersionsForTarget(currentVersions, 'semver');

  let upgradedVersions = upgradeDependencies.default(
    currentVersions,
    latestVersions
  );

  // Filtering modules that have to be updated
  upgradedVersions = _.pickBy(upgradedVersions, (newVersion, moduleName) =>
    filterModuleName(moduleName)
  );

  if (_.isEmpty(upgradedVersions)) {
    console.log(success('All dependencies are up-to-date!'));
    process.exit(0);
  }

  // Getting the list of ignored modules
  const config = new Config();
  config.ignore = config.ignore || {};

  // Making arrays of outdated modules
  const [ignoredModules, modulesToUpdate] = flow(
    map.convert({ cap: false })((newVersion, moduleName) => ({
      name: moduleName,
      from: currentVersions[moduleName],
      to: newVersion
    })),
    partition(
      (module) =>
        _.has(config.ignore, module.name) &&
        satisfies(
          latestVersions[module.name],
          config.ignore[module.name].versions
        )
    )
  )(upgradedVersions);

  // Moving `@types/*` modules right below their original modules
  sortModules(modulesToUpdate);
  sortModules(ignoredModules);

  // Creating pretty-printed CLI tables with update info
  if (_.isEmpty(modulesToUpdate)) {
    console.log(success('\nAll active modules are up-to-date!'));
  } else {
    console.log(
      `\n${strong('New versions of active modules available:')}\n\n${createUpdatedModulesTable(modulesToUpdate)}`
    );
  }

  if (!_.isEmpty(ignoredModules)) {
    const rows = _.map(ignoredModules, ({ name, from, to }) => [
      strong(name),
      from,
      '→',
      colorizeDiff(from, to),
      attention(config.ignore[name].versions),
      config.ignore[name].reason
    ]);

    // Adding table header
    rows.unshift(
      _.map(['', 'From', '', 'To', 'Ignored versions', 'Reason'], (header) =>
        strong(header)
      )
    );

    console.log(
      `\n${strong('Ignored updates:')}\n\n${createSimpleTable(rows)}`
    );
  }

  const updatedModules = [];
  let isUpdateFinished = false;
  while (modulesToUpdate.length && !isUpdateFinished) {
    const outdatedModule = modulesToUpdate.shift();
    const { name, from, to } = outdatedModule;
    let { changelogUrl, homepage } = outdatedModule;

    const currentVersion = from.replace(/[\^~]/g, '');
    const stableVersion = stableVersions[name];
    const latestVersion = to.replace(/[\^~]/g, '');

    // Adds new line
    console.log('');

    const showChangelog = changelogUrl !== null;
    const showHomepage = !showChangelog && homepage !== null;
    const showStableVersion =
      stableVersion &&
      gt(stableVersion, coerce(currentVersion)) &&
      neq(stableVersion, coerce(latestVersion));

    const answer = await select({
      message: `${changelogUrl === undefined ? 'U' : 'So, u'}pdate "${name}" ${
        opts.global ? 'globally' : 'in package.json'
      } from ${from} to ${colorizeDiff(from, to)}?`,
      choices: _.compact([
        { name: 'Yes', value: true },
        { name: 'No', value: false },
        showStableVersion && {
          name: `Use ${colorizeDiff(currentVersion, stableVersion)} instead`,
          value: 'stable'
        },
        // Don't show this option if we couldn't find module's changelog url
        showChangelog && { name: 'Show changelog', value: 'changelog' },
        // Show this if we haven't found changelog
        showHomepage && { name: 'Open homepage', value: 'homepage' },
        { name: 'Ignore', value: 'ignore' },
        { name: 'Finish update process', value: 'finish' }
      ]),
      // Automatically setting cursor to "Open homepage" after we haven't found changelog
      default: changelogUrl === null && homepage === undefined ? 2 : 0
    });

    switch (answer) {
      case 'changelog':
        // Ask user about this module again
        modulesToUpdate.unshift(outdatedModule);

        if (changelogUrl === undefined) {
          const newUrl = await openAndFindChangelog(name);

          if (newUrl) {
            changelogUrl = outdatedModule.changelogUrl = newUrl;
          }
        }
        break;

      case 'homepage':
        // Ask user about this module again
        modulesToUpdate.unshift(outdatedModule);

        if (homepage === undefined) {
          console.log('Trying to find homepage URL...');
          homepage = outdatedModule.homepage = getModuleHomepage(
            await getModuleInfo(name)
          );
        }

        if (homepage) {
          console.log(`Opening ${strong(homepage)}...`);
          open(homepage);
        } else {
          console.log(
            `Sorry, there is no info about homepage URL in the ${strong(name)}'s package.json`
          );
        }
        break;

      case 'ignore': {
        const { versions, reason } = await askIgnoreFields(
          latestVersions[name]
        );
        config.ignore[name] = { versions, reason };
        break;
      }

      case 'finish':
        isUpdateFinished = true;
        break;

      case 'stable':
        updatedModules.push({
          ...outdatedModule,
          to: stableVersion
        });
        setModuleVersion(name, stableVersion, packageJson);
        delete config.ignore[name];
        break;

      case true:
        updatedModules.push(outdatedModule);
        setModuleVersion(name, to, packageJson);
        delete config.ignore[name];
        break;
    }
  }

  // Adds new line
  console.log('');

  // Saving config
  config.save();

  if (!updatedModules.length) {
    console.log('Nothing to update');
    process.exit(0);
  }

  // Showing the list of modules that are going to be updated
  console.log(
    `\n${strong('These packages will be updated:')}\n\n` +
      createUpdatedModulesTable(updatedModules) +
      '\n'
  );

  if (opts.global) {
    const shouldUpdateGlobalPackages = await confirm({
      message: 'Update global modules?',
      default: true
    });

    if (shouldUpdateGlobalPackages) {
      console.log(
        `Automatically upgrading ${updatedModules.length} module${updatedModules.length !== 1 ? 's' : ''}...`
      );
      shell.exec(
        `npm install --global ${updatedModules.map(({ name, to }) => `${name}@${to}`).join(' ')}`
      );
      process.exit(0);
    }
  }

  const shouldUpdatePackageFile = await confirm({
    message: 'Update package.json?',
    default: true
  });

  if (shouldUpdatePackageFile) {
    const { indent } = detectIndent(packageSource);

    writeFileSync(
      packageFile,
      // Adding newline to the end of file
      `${JSON.stringify(packageJson, null, indent)}\n`
    );
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
