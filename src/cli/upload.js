const resolve = require('../../lib/net/resolve');
const fs = require('fs');
const path = require('path');
const exit = require('../../lib/cli/exit');
const request = require('../../lib/net/request');
const zipfolder = require('../../lib/fs/zipfolder');
const tmpdir = require('../../lib/fs/tmpdir');
const i18n = require('../../lib/i18n/i18n');
const HttpMessage = require('../../lib/net/httpmessage');

module.exports = function(config, workflowDir) {
  var zipPath = tmpdir(generateZipName(workflowDir));

  var workflowName = path.basename(workflowDir);
  var pkgPath = path.resolve(workflowDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    workflowName = require(pkgPath).name;
  }

  zipfolder(path.resolve(config.cwd, workflowDir), zipPath, (error, zip) => {
    if (error) return exit(error);

    var content = JSON.stringify({
      base64Content: fs.readFileSync(zip.path).toString('base64')
    });

    var message = new HttpMessage(resolve(config.host, '/api/admin/workflows/' + workflowName));
    message.method = 'POST';
    message = config.token ? HttpMessage.sign(message, config.token) : message;
    message.headers['Content-Type'] = 'application/json';
    message.headers['Content-Length'] = content.length;

    var req = request(message, (error) => {
      if (error) return exit(error);

      console.log(i18n('Workflow "' + workflowName + '" is uploaded'));
    });

    req.write(content);
    req.end();
    return req;
  });

  function generateZipName(workflowDir) {
    return 'youtrack-workflow-' + path.basename(workflowDir) + '.zip';
  }
};
