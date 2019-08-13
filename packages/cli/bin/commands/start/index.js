#!/usr/bin/env node
import commander from 'commander';
import dev from './dev';
import release from './release';
function collect (value, previous) {
	return previous.concat([value]);
}
commander
	.option('-p, --port', 'override the port')
	.option('--baseDir', 'Set the base directory')
	.option('-c, --configDir', 'Set the configuration directory')
	.option('-d, --dev', 'Starts a watch on the base directory to look for changes')
	.option('-s, --serve <folder>', 'Adds a folder to be served statically', collect, []);

const cwd = process.cwd();
commander.parse(process.argv);
try {
	if (commander.dev) {
		console.log('starting dev...');
		dev({ args: commander, cwd });
	} else {
		release({ args: commander, cwd });
	}
} catch (e) {
	console.error('Unable to load configuration. Ensure that a config directory is in the current directory');
	console.error(e);
	process.exit(1);
}
