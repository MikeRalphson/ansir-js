'use strict';

const jimp = require('jimp');

jimp.read(process.argv[2], (err, data) => {
  if (err) throw err;
  data
    //.resize(256, 256) // resize
    //.quality(60) // set JPEG quality
    //.greyscale() // set greyscale
    .write('output.png'); // save
});
