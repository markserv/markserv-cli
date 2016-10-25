const path = require('path');
const callerId = require('caller-id');
const plugin = require('./plugin-modifier');

module.exports = callback => {
  const moduleId = callerId.getData().filePath;
  const _module = require.cache[moduleId];

  if (typeof callback === 'function') {
    console.log('was obj');
    plugin(_module, callback);
  }
};
