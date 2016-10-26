const fs = require('fs');
const Promise = require('bluebird');

const directoryExists = dir => {
  return new Promise((resolve, reject) => {
    fs.stat(dir, (err, stat) => {
      if (err) {
        return reject(err);
      }

      const isDirectory = stat.isDirectory();
      resolve(isDirectory);
    });
  });
};

const fileExists = filepath => {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stat) => {
      if (err) {
        return reject(err);
      }

      const isFile = stat.isFile();
      resolve(isFile);
    });
  });
};

module.exports = {
  directoryExists,
  fileExists
};
