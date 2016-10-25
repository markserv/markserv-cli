const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');

module.exports = (name, callback) => {
  const moduleId = callerId.getData().filePath;
  const _module = require.cache[moduleId];

  if (typeof name === 'function') {
    callback = name;
    plugin(_module, callback);
    return;
  }

  if (typeof name === 'string' && typeof callback === 'function') {
    plugin(_module, callback, name);
    return;
  }
};
