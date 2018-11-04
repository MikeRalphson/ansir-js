/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chroma = require('chroma-js');
const ansi   = require('../ansi-codes');
const Octree = require('../octree');

class ColorTable {
  static initClass() {
    this.UTF8_SHADED_BLOCK_CHARS  = [
      '\u2591', // ░ LIGHT SHADE
      '\u2592', // ▒ MEDIUM SHADE
      '\u2593', // ▓ DARK SHADE
      '\u2588' // █ FULL BLOCK
    ];
  }

  constructor(config) {
    this.config = config;
    this.tree = new Octree();
    for (let ansiCode of Array.from(this.config.ansiCodes)) {
      for (let i = 0; i < ColorTable.UTF8_SHADED_BLOCK_CHARS.length; i++) {
        const blockChar = ColorTable.UTF8_SHADED_BLOCK_CHARS[i];
        const opacity = (i + 1) / 4.0;
        const color = chroma.mix(this.config.terminalBackground, ansiCode.color, opacity, 'hsl');
        const entry = {
          blockChar,
          ansiCode
        };
        this.tree.insert(new Octree.Point(...Array.from(color.lab() || [])), entry);
      }
    }
  }

  // Finds the nearest color by using euclidean distance in CIELAB colorspace.
  // We insert all the colors in the color table into an octree so that nearest
  // neighbor searches are very fast.
  getNearest(color) {
    if (color.alpha() < this.config.alphaCutoff) { return null; }
    return this.tree.nearest(new Octree.Point(...Array.from(color.lab() || []))).value;
  }
}
ColorTable.initClass();

const render = function(image, config) {
  const colorTable = new ColorTable(config);

  for (let y = 0, end = image.height, asc = 0 <= end; asc ? y <= end : y >= end; asc ? y++ : y--) {
    const line = [];
    for (let x = 0, end1 = image.width, asc1 = 0 <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
      const nearest = colorTable.getNearest(image.colorAt(x, y));
      if (nearest != null) {
        line.push({
          char : nearest.blockChar,
          fg   : nearest.ansiCode.fg,
          bg   : null
        });
      } else {
        line.push({
          char : '\u0020',
          fg   : null,
          bg   : null
        });
      }
    }

    config.write(ansi.joinLineEscapes(line) + '\n');
  }
  config.write(ansi.ANSI_RESET);
};

module.exports = {render};