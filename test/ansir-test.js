/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {expect} = require('chai');
const chroma   = require('chroma-js');
const fs       = require('fs');
const api      = require('../ansir-api');

describe('Renderers', function() {

  const pngPromise = api.png.loadPng(`${__dirname}/../sample/in.png`);

  const compareRenderToCanonical = (rendererType, scale) =>
    pngPromise.then(function(pngObj) {
      const strs   = [];
      const config = {
        ansiCodes          : api.ansi.ANSI_COLORS_EXTENDED,
        terminalBackground : chroma('black'),
        scale,
        alphaCutoff        : 0.95,
        write(str) { return strs.push(str); }
      };

      // Render using ansir API
      const image = png.createRescaledImage(pngObj, config);
      api.renderer[rendererType].render(image, config);

      // Compare output to canonical
      expect(strs.join('')).to.equal(fs.readFileSync(`${__dirname}/renders/${rendererType}.txt`, 'utf8'));
    })
  ;

  it('"block" renderer matches canonical', done => compareRenderToCanonical('block', 0.05).then(done));

  it('"shaded" renderer matches canonical', done => compareRenderToCanonical('shaded', 0.05).then(done));

  return it('"sub" renderer matches canonical', done => compareRenderToCanonical('sub', 0.1).then(done));
});