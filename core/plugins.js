// Early helper export for external module use
if (module.parent.parent === null) {
  module.parent.exports = {
    helpers: require('./helpers'),

    plugin: {
      modifier: require('./plugin-modifier'),
      includer: require('./plugin-includer')
    }
  };
}
