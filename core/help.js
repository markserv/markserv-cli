module.exports = () => {
  module.parent.exports.fs = require('./help.fs');
  module.parent.exports.log = require('./logger');
};
