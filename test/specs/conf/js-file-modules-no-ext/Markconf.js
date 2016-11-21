const Markconf = {
  includers: {
    html: 'local-mods/custom-includer'
  },
  modifiers: {
    '**/*.*': 'local-mods/custom-modifier'
  }
};

module.exports = Markconf;
