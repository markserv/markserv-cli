// These exports are used by the plugin architecture only, and should not be
// loaded when running Markserv from the CLI.
global.log.trace('CLI Mode = false (plugin mode)');

module.exports = {
  helpers: require('./helpers'),

  plugin: {
    modifier: require('./plugin-modifier'),
    includer: require('./plugin-includer')
  }
};