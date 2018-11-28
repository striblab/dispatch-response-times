/**
 * Basic wrapper to tunr a command line command through gulp
 */

// Dependencies
const gutil = require('gulp-util');
const child = require('child_process');

// Main command
function gulpRunner(command, args) {
  return new Promise((resolve, reject) => {
    const commandLog = command.split('/').pop();
    const proc = child.spawn(command, args);
    const logger = buffer => {
      buffer
        .toString()
        .split(/\n/)
        .forEach(message => gutil.log(commandLog + ': ' + message));
    };

    proc.stdout.on('data', logger);
    proc.stderr.on('data', logger);

    // Passes status code
    proc.on('close', status => {
      if (status) {
        return reject(
          new gutil.PluginError(
            command,
            `Command returned non-zero status of ${status}`
          )
        );
      }

      resolve();
    });
  });
}

module.exports = gulpRunner;
