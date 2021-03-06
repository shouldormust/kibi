import _ from 'lodash';
import pkg from '../utils/package_json';
import Command from './command';
import serveCommand from './serve/serve';

// siren: kibi commands
import replaceEncryptionKeyCommand from './kibi/replace_encryption_key';
import upgradeCommand from './kibi/upgrade';
import backupCommand from './kibi/backup';
import restoreCommand from './kibi/restore';

const argv = process.env.kbnWorkerArgv ? JSON.parse(process.env.kbnWorkerArgv) : process.argv.slice();
const program = new Command('bin/kibi'); // kibi: renamed kibana to kibi

program
.version(pkg.version)
.description(
  'Kibana is an open source (Apache Licensed), browser ' +
  'based analytics and search dashboard for Elasticsearch.'
);

// attach commands
serveCommand(program);
replaceEncryptionKeyCommand(program);
upgradeCommand(program);
backupCommand(program);
restoreCommand(program);

program
.command('help <command>')
.description('Get the help for a specific command')
.action(function (cmdName) {
  const cmd = _.find(program.commands, { _name: cmdName });
  if (!cmd) return program.error(`unknown command ${cmdName}`);
  cmd.help();
});

program
.command('*', null, { noHelp: true })
.action(function (cmd) {
  program.error(`unknown command ${cmd}`);
});

// check for no command name
const subCommand = argv[2] && !String(argv[2][0]).match(/^-|^\.|\//);

if (!subCommand) {
  if (_.intersection(argv.slice(2), ['-h', '--help']).length) {
    program.defaultHelp();
  } else {
    argv.splice(2, 0, ['serve']);
  }
}

program.parse(argv);
