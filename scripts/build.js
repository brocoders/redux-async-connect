var execSync = require('child_process').execSync;
var readFileSync = require('fs').readFileSync;
var prettyBytes = require('pretty-bytes');
var gzipSize = require('gzip-size');

function exec(command) {
    execSync(command, { stdio: [0, 1, 2] });
}

exec('npm run build');
