global.logger.trace('CLI Mode = false (plugin mode)');

module.exports = {
  helpers: require('./helpers'),

  plugin: {
    modifier: require('./plugin-modifier'),
    includer: require('./plugin-includer')
  }
};
