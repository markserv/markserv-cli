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
    html: 'markserv-inc-html',
    markdown: 'markserv-inc-markdown',
    less: 'markserv-inc-less'
  },

  // HTTP Response Modifiers
  modifiers: {
    core: {
      // directory: 'markserv-mod-dir',
      markdown: 'markserv-mod-markdown'
      // http404: 'markserv-mod-http-404',
      // file: 'markserv-mod-file'
    },

    path: {
      // 'tests/posts/**/*.md': 'markserv-mod-post'
    }
  },

  rewrites: {
    'test/redirect-a/**/*': 'test/redirect-b/**/*'
  }
};

module.exports = Markconf;
