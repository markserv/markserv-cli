const callerId = require('caller-id');
const plugin = require('./plugin.register-modifier');

module.exports = (name, callback) => {
  const moduleId = callerId.getData().filePath;
  const _module = require.cache[moduleId];

  if (typeof name === 'function') {
    callback = name;
    return plugin(_module, callback);
  }

  if (typeof name === 'string' && typeof callback === 'function') {
    return plugin(_module, callback, name);
  }
};
