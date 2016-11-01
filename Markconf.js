const Markconf = {
  title: 'Markconf Example',

  // serverRoot: 'some-pre-defined-path',

  // defaults: {
  //   fileTypes: {
  //     markdown: [
  //      '.md'
  //    ]
  //   }
  // }

  watch: {
    Markconf: true,
    modifiers: true,
    includers: true,
    templates: true,
    paths: true
  },

  // File includers
  includers: {
    // html: 'markserv-contrib-inc.html',
    // markdown: 'markserv-contrib-inc.markdown',
    // less: 'markserv-contrib-inc.less'
  },

  modifiers: 'markserv-contrib-app.github'
};

module.exports = Markconf;
