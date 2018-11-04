/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _      = require('lodash');
const chroma = require('chroma-js');
const ansi   = require('../ansi-codes');
const Octree = require('../octree');

class BrailleColorTable {
  static initClass() {
    this.UTF8_BRAILLE_MAP  = [
      0x1, 0x8,
      0x2, 0x10,
      0x4, 0x20,
      0x40, 0x80
    ];
  }

  constructor(config) {
    this.config = config;
    this.tree = new Octree();
    for (let ansiCode of Array.from(this.config.ansiCodes)) {
      this.tree.insert(new Octree.Point(...Array.from(ansiCode.color.lab() || [])), ansiCode);
    }
  }

  getTransparentDistance(colors) {
    return colors
      .map(c => c.alpha() < this.config.alphaCutoff ? 0 : 100)
      .reduce((a, b) => a + b);
  }

  getNearestColor(colors) {
    // Get nearest point to CIELAB centroid
    const labs    = colors.map(c => new Octree.Point(...Array.from(c.lab() || [])));
    const lab     = Octree.Point.centroid(labs);
    const nearest = this.tree.nearest(lab);
    nearest.distance *= colors.length;

    // # Compare to transparent
    // transparentDistance = @getTransparentDistance(colors)
    // if transparentDistance is 0
    //   return {
    //     distance : transparentDistance
    //     value    : null
    //   }

    // Rescale distance
    return nearest;
  }

  decodeBrailleOffset(pixels, offset, invert) {
    if (invert == null) { invert = false; }
    return _.filter(pixels, function(p, i) {
      const mask = BrailleColorTable.UTF8_BRAILLE_MAP[i];
      return ((offset & mask) === mask) ^ invert;
    });
  }

  /*
  Finds the best foreground/background match to the four pixel block.

  Pixel layout:
    [p0][p1]
    [p2][p3]
  */
  getNearest(pixels) {
    const candidates = [{
      char  : '\u0020',
      fg    : {
        distance : this.getTransparentDistance(pixels),
        value    : null
      },
      bg    : {
        distance : 0,
        value    : null
      }
    }
    ];

    for (let i = 0x40; i <= 0xFF; i++) {
      var cand;
      const offset = 0x2800 + i;
      const fgPixels = this.decodeBrailleOffset(pixels, i, false);
      const bgPixels = this.decodeBrailleOffset(pixels, i, true);
      candidates.push(cand = {
        char : String.fromCharCode(offset),
        fg   : this.getNearestColor(fgPixels),
        bg   : this.getNearestColor(bgPixels)
      });
    }


    const best = _.min(candidates, c => c.fg.distance + c.bg.distance);
    return {
      fg   : (best.fg.value != null ? best.fg.value.fg : undefined),
      bg   : (best.bg.value != null ? best.bg.value.bg : undefined),
      char : best.char
    };
  }
}
BrailleColorTable.initClass();

const render = function(image, config) {
  const colorTable = new BrailleColorTable(config);

  for (let y = 0, end = image.height - 4; y < end; y += 4) {
    const line = [];
    for (let x = 0, end1 = image.width - 2; x < end1; x += 2) {
      const pixels = [
        image.colorAt(x, y),
        image.colorAt(x + 1, y),
        image.colorAt(x, y + 1),
        image.colorAt(x + 1, y + 1),
        image.colorAt(x, y + 2),
        image.colorAt(x + 1, y + 2),
        image.colorAt(x, y + 3),
        image.colorAt(x + 1, y + 3)
      ];
      line.push(colorTable.getNearest(pixels));
    }

    config.write(ansi.joinLineEscapes(line) + '\n');
  }
  config.write(ansi.ANSI_RESET);
};

module.exports = {render, charHeight : 1};