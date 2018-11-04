/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs      = require('fs');
const {PNG}   = require('pngjs');
const Promise = require('bluebird');
const chroma  = require('chroma-js');

const loadPng = pngPath =>
  new Promise(function(resolve, reject) {
    return fs.createReadStream(pngPath)
      .pipe(new PNG({filterType : 4}))
      .on('parsed', function() { return resolve(this); })
      .on('error', reject);
  })
;

const createRescaledImage = function(png, options) {
  // default is no scaling
  let { width }  = png;
  let { height } = png;
  let x      = i => i;
  let y      = i => i;
  
  // since block chars are half as wide as tall
  const charHeight = (options.renderer != null ? options.renderer.charHeight : undefined) != null ? (options.renderer != null ? options.renderer.charHeight : undefined) : 2;

  if (options.scale != null) {
    const s      = parseFloat(options.scale);
    const sx     = s * charHeight; 
    const sy     = s;
    width  = Math.floor(png.width * sx);
    height = Math.floor(png.height * sy);
    x      = i => Math.floor(i / sx);
    y      = i => Math.floor(i / sy);
  } else {
    if (options.width != null) {
      width = parseInt(options.width);
      x     = i => Math.floor((i * png.width) / width);
    }
    if (options.height != null) {
      height = parseInt(options.height);
      y      = i => Math.floor((i * png.height) / height);
    }
  }

  const colorAt = function(xi, yi) {
    const idx = ((png.width * y(yi)) + x(xi)) << 2;
    const [r,g,b,a] = Array.from(png.data.slice(idx, idx + 4));
    return chroma([r, g, b]).alpha((a != null ? a : 0) / 255.0);
  };

  return {
    width, height, colorAt
  };
};

module.exports = {
  loadPng,
  createRescaledImage
};