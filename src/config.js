/*
 * decaffeinate suggestions:
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chroma = require('chroma-js');
const ansi   = require('./ansi-codes');
const _      = require('lodash');

const configure = function(options) {
  const ansiCodes = (() => { switch (options.colors) {
    case 'basic':    return ansi.ANSI_COLORS_BASIC;
    case 'extended': return ansi.ANSI_COLORS_EXTENDED;
    default: throw new Error(`Unknown ANSI color space ${options.colors}`);
  } })();

  const terminalBackground = (() => { switch (options.background) {
    case 'light': return chroma('white');
    case 'dark':  return chroma('black');
    default: throw new Error(`Unknown background option ${options.background}`);
  } })();

  const renderer = (() => { switch (options.mode) {
    case 'block':   return require('./renderers/block');
    case 'shaded':  return require('./renderers/shaded-block');
    case 'sub':     return require('./renderers/sub-block');
    case 'braille': return require('./renderers/braille');
    default: throw new Error(`Unknown mode option ${options.mode}`);
  } })();

  const alphaCutoff = parseFloat(options.alphaCutoff);

  const write = str => process.stdout.write(str);

  return _.extend(options, {
    ansiCodes,
    terminalBackground,
    alphaCutoff,
    renderer,
    write
  });
};

module.exports =configure;
