const Markconf = {
  includers: {
    html: 'local-mods/custom-includer.js'
  },
  modifiers: {
    '**/*.*': 'local-mods/custom-modifier.js'
  }
};

module.exports = Markconf;
