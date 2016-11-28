const Markconf = {
  includers: {
    html: 'markserv-contrib-inc.html'
  },

  modifiers: {
    '**/': [
      {'markserv-contrib-mod.dir': 'partials/outer.html'}
    ]
  }
};

module.exports = Markconf;
