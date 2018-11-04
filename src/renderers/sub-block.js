/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS201: Simplify complex destructure assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _      = require('lodash');
const chroma = require('chroma-js');
const ansi   = require('../ansi-codes');
const Octree = require('../octree');

class SubBlockColorTable {
  static initClass() {
    this.UTF8_SUB_BLOCK_CHARS  = [
      '\u2598', // ▘ QUADRANT UPPER LEFT
      '\u259D', // ▝ QUADRANT UPPER RIGHT
      '\u2596', // ▖ QUADRANT LOWER LEFT
      '\u2597', // ▗ QUADRANT LOWER RIGHT
      '\u259A', // ▚ QUADRANT UPPER LEFT AND LOWER RIGHT
      '\u259E', // ▞ QUADRANT UPPER RIGHT AND LOWER LEFT
      '\u2588' // █ FULL BLOCK
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

    // Compare to transparent
    const transparentDistance = this.getTransparentDistance(colors);
    if (transparentDistance === 0) {
      return {
        distance : transparentDistance,
        value    : null
      };
    }

    // Rescale distance
    return nearest;
  }

  /*
  Finds the best foreground/background match to the four pixel block.

  Pixel layout:
    [p0][p1]
    [p2][p3]
  */
  getNearest(...args) {
    const [p0, p1, p2, p3] = Array.from(args[0]);
    const candidates = [{
      char  : '\u0020',
      fg    : {
        distance : this.getTransparentDistance([p0, p1, p2, p3]),
        value    : null
      },
      bg    : {
        distance : 0,
        value    : null
      }
    }
    , {
      char : SubBlockColorTable.UTF8_SUB_BLOCK_CHARS[0],
      fg   : this.getNearestColor([p0]),
      bg   : this.getNearestColor([p1, p2, p3])
    }
    , {
      char : SubBlockColorTable.UTF8_SUB_BLOCK_CHARS[1],
      fg   : this.getNearestColor([p1]),
      bg   : this.getNearestColor([p0, p2, p3])
    }
    , {
      char : SubBlockColorTable.UTF8_SUB_BLOCK_CHARS[2],
      fg   : this.getNearestColor([p2]),
      bg   : this.getNearestColor([p0, p1, p3])
    }
    , {
      char : SubBlockColorTable.UTF8_SUB_BLOCK_CHARS[3],
      fg   : this.getNearestColor([p3]),
      bg   : this.getNearestColor([p0, p1, p2])
    }
    , {
      char : SubBlockColorTable.UTF8_SUB_BLOCK_CHARS[4],
      fg   : this.getNearestColor([p0, p3]),
      bg   : this.getNearestColor([p1, p2])
    }
    , {
      char : SubBlockColorTable.UTF8_SUB_BLOCK_CHARS[5],
      fg   : this.getNearestColor([p1, p2]),
      bg   : this.getNearestColor([p0, p3])
    }
    ];

    const best = _.min(candidates, c => c.fg.distance + c.bg.distance);
    return {
      fg   : (best.fg.value != null ? best.fg.value.fg : undefined),
      bg   : (best.bg.value != null ? best.bg.value.bg : undefined),
      char : best.char
    };
  }
}
SubBlockColorTable.initClass();

const render = function(image, config) {
  const colorTable = new SubBlockColorTable(config);

  // Since we go by 2, we have to end on an even index
  const maxX = image.width - (image.width % 2);
  const maxY = image.height - (image.height % 2);
  for (let y = 0, end = maxY; y < end; y += 2) {
    const line = [];
    for (let x = 0, end1 = maxX; x < end1; x += 2) {
      const pixels = [
        image.colorAt(x, y),
        image.colorAt(x + 1, y),
        image.colorAt(x, y + 1),
        image.colorAt(x + 1, y + 1)
      ];
      line.push(colorTable.getNearest(pixels));
    }

    config.write(ansi.joinLineEscapes(line) + '\n');
  }
  config.write(ansi.ANSI_RESET);
};

module.exports = {render};