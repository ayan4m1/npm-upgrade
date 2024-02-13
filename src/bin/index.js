#! /usr/bin/env node

import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ignore = new Command('ignore')
  .executableDir(__dirname)
  .description('Manage ignored modules')
  .command('add [module]', 'Add module to ignored list')
  .command('list', 'Show the list of ignored modules')
  .command('reset [modules...]', 'Reset ignored modules');

new Command('npm-upgrade')
  .executableDir(__dirname)
  .description('Upgrade dependencies')
  .command('check [filter]', 'Check for outdated modules', {
    isDefault: true,
    executableFile: 'check.js'
  })
  .command('changelog <moduleName>', 'Show changelog for a module', {
    executableFile: 'changelog.js'
  })
  .addCommand(ignore)
  .parse(process.argv);
