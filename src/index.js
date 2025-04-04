import { fileURLToPath } from 'url';
import { program, Command } from 'commander';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const commandDir = resolve(__dirname, 'commands');

program
  .name('npm-upgrade')
  .executableDir(commandDir)
  .description('Upgrade dependencies')
  .command('check [filter]', 'Check for outdated packages', {
    isDefault: true,
    executableFile: 'check.js'
  })
  .command('changelog <packageName>', 'Show changelog for a package', {
    executableFile: 'changelog.js'
  })
  .command(
    'override <packageName> <changelogUrl>',
    'Update local overrides database',
    {
      executableFile: 'override.js'
    }
  )
  .addCommand(
    new Command('ignore')
      .executableDir(join(commandDir, 'ignore'))
      .description('Manage ignored packages')
      .command('list', 'Show the list of ignored package', {
        executableFile: 'list.js'
      })
      .command('add [packages...]', 'Add package to ignored list', {
        executableFile: 'add.js'
      })
      .command('remove [packages...]', 'Remove package from ignored list', {
        executableFile: 'remove.js'
      })
  )
  .parse();
