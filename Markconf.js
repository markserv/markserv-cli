const Markconf = {

  title: 'Markconf Example',
  watchConf: true,
  serverRoot: 'some-pre-defined-path',
  // defaults: {
  //   fileTypes: {
  //     markdown
  //   }

  // }

  includes: {
    html: 'markserv-inc-html',
    markdown: 'markserv-inc-markdown',
    less: 'markserv-inc-less'
  },

  handlers: {
    core: {
      directory: 'markserv-mod-dir',
      markdown: 'markserv-mod-markdown',
      http404: 'markserv-mod-http404',
      file: 'markserv-mod-file'
    },

    path: {
      'tests/posts/**/*.md': 'markserv-mod-post'
    }
  },

  rewrites: {
    'test/redirect-a/**/*': 'test/redirect-b/**/*'
  }
};

module.exports = Markconf;
