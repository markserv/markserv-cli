const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const log = require('./core.logger');

const cwd = process.cwd();

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

const fileExists = path => {
  return new Promise((resolve, reject) => {
    try {
      fs.stat(path, (error, file) => {
        if (!error && file.isFile()) {
          return resolve(true);
        }

        if (error && error.code === 'ENOENT') {
          return resolve(false);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

const fileExistsSync = filepath => {
  try {
    fs.statSync(filepath);
    return true;
  } catch (err) {
    return false;
  }
};

const readfile = filepath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }

      resolve(contents);
    });
  });
};

const npmModuleExists = modname => {
  const sep = path.sep;
  const modpath = cwd + sep + 'node_modules' + sep + modname;
  return directoryExists(modpath);
};

module.exports = {
  directoryExists,
  fileExists,
  fileExistsSync,
  npmModuleExists,
  readfile
};
