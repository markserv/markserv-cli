const Markconf = {
  includers: {
    html: 'markserv-contrib-inc.html'
  },

  modifiers: {
    '**/': [
      {'markserv-contrib-mod.dir': 'partials/level-1.html'}
    ]
  }
  };

module.exports = Markconf;
