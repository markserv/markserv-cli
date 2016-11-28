const Markconf = {
  includers: {
    html: 'markserv-contrib-inc.html',
    markdown: 'markserv-contrib-inc.markdown'
  },

  modifiers: {
    '**/': [
      {'markserv-contrib-mod.dir': 'partials/level-1.html'}
    ]
  }
};

module.exports = Markconf;
