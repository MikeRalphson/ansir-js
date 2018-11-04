/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chroma = require('chroma-js');

const ansiEscape = code => `\x1b[${code}m`;

const ANSI_RESET = ansiEscape('0');

const ANSI_COLOR_DEFAULT = {
  fg : ansiEscape('39'),
  bg : ansiEscape('40')
};

const ANSI_COLORS_BASIC = [{
  color : chroma('red'),
  fg    : ansiEscape('31'),
  bg    : ansiEscape('41')
}
, {
  color : chroma('yellow'),
  fg    : ansiEscape('33'),
  bg    : ansiEscape('43')
}
, {
  color : chroma('green'),
  fg    : ansiEscape('32'),
  bg    : ansiEscape('42')
}
, {
  color : chroma('cyan'),
  fg    : ansiEscape('36'),
  bg    : ansiEscape('46')
}
, {
  color : chroma('blue'),
  fg    : ansiEscape('34'),
  bg    : ansiEscape('44')
}
, {
  color : chroma('magenta'),
  fg    : ansiEscape('35'),
  bg    : ansiEscape('45')
}
, {
  color : chroma('black'),
  fg    : ansiEscape('30'),
  bg    : ansiEscape('40')
}
, {
  color : chroma('white'),
  fg    : ansiEscape('37'),
  bg    : ansiEscape('47')
}
];

// Convert an extended ANSI color code into its RGB value.
// See: http://stackoverflow.com/questions/27159322/rgb-values-of-the-colors-in-the-ansi-extended-colors-index-17-255
const convertAnsiExtended = function(code) {
  let g;
  if (code >= 232) {
    g = ((code - 232) * 10) + 8;
    return {
      color : chroma(g, g, g),
      fg    : ansiEscape(`38;5;${code}`),
      bg    : ansiEscape(`48;5;${code}`)
    };
  } else {
    let r = Math.floor((code - 16) / 36);
    r = r > 0 ? 55 + (r * 40) : 0;

    g = Math.floor(((code - 16) % 36) / 6);
    g = g > 0 ? 55 + (g * 40) : 0;

    let b = (code - 16) % 6;
    b = b > 0 ? 55 + (b * 40) : 0;

    return {
      color : chroma(r, g, b),
      fg    : ansiEscape(`38;5;${code}`),
      bg    : ansiEscape(`48;5;${code}`)
    };
  }
};

const ANSI_COLORS_EXTENDED = __range__(16, 256, false).map(convertAnsiExtended);

const joinLineEscapes = function(line) {
  let lastFg = null;
  let lastBg = null;
  let s      = '';

  for (let pixel of Array.from(line)) {

    if ((lastBg !== pixel.bg) || (lastFg !== pixel.fg)) {
      s += ANSI_RESET;
      if (pixel.bg != null) { s += pixel.bg; }
      if (pixel.fg != null) { s += pixel.fg; }
      lastBg = pixel.bg;
      lastFg = pixel.fg;
    }

    s += pixel.char;
  }

  if ((lastBg !== null) || (lastFg !== null)) {
    s += ANSI_RESET;
  }

  return s;
};

module.exports = {
  ANSI_RESET,
  ANSI_COLOR_DEFAULT,
  ANSI_COLORS_BASIC,
  ANSI_COLORS_EXTENDED,
  joinLineEscapes
};
function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}