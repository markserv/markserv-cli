const fs = require('fs');

const fileExists = file => {
  let exists;

  try {
    const stat = fs.statSync(file);
    if (stat.isFile()) {
      exists = true;
    }
  } catch (err) {
    exists = false;
  }

  return exists;
};

const result = fileExists('README.mdd');
console.log(result);


// , (error, file) => {

//   console.log(arguments);

//   // if (!error && file.isFile()) {
//   //   console.log('statSync isfile: ' + path);
//   // }

//   // if (error && error.code === 'ENOENT') {
//   //   console.log('statSync ENOENT: ' + path);
//   //   return false;
//   // }
// });