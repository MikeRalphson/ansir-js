/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chroma = require('chroma-js');
const ansi   = require('../ansi-codes');
const Octree = require('../octree');

class ColorTable {
  constructor(config) {
    this.config = config;
    this.tree = new Octree();
    for (let ansiCode of Array.from(this.config.ansiCodes)) {
      this.tree.insert(new Octree.Point(...Array.from(ansiCode.color.lab() || [])), ansiCode);
    }
  }

  // Finds the nearest color by using euclidean distance in CIELAB colorspace.
  // We insert all the colors in the color table into an octree so that nearest
  // neighbor searches are very fast.
  getNearest(color) {
    if (color.alpha() < this.config.alphaCutoff) { return null; }
    return this.tree.nearest(new Octree.Point(...Array.from(color.lab() || []))).value.bg;
  }
}

const render = function(image, config) {
  const colorTable = new ColorTable(config);

  for (let y = 0, end = image.height, asc = 0 <= end; asc ? y <= end : y >= end; asc ? y++ : y--) {
    const line = [];
    for (let x = 0, end1 = image.width, asc1 = 0 <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
      const color = colorTable.getNearest(image.colorAt(x, y));
      line.push({
        char : '\u0020',
        fg   : null,
        bg   : color
      });
    }
    config.write(ansi.joinLineEscapes(line) + '\n');
  }
  config.write(ansi.ANSI_RESET);
};

module.exports = {render};