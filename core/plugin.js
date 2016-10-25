const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');

module.exports = callback => {
  const moduleId = callerId.getData().filePath;
  const _module = require.cache[moduleId];

  if (typeof callback === 'function') {
    plugin(_module, callback);
  }
};
