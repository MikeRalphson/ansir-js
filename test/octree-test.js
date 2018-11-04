/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {expect} = require('chai');
const Octree = require('../src/octree');

const randomPoint = () => new Octree.Point(
  Math.random() * 100,
  Math.random() * 100,
  Math.random() * 100
) ;

const nearestPointLinear = function(points, test) {
  let min = Infinity;
  let val = null;
  for (let i = 0; i < points.length; i++) {
    var distance;
    const p = points[i];
    if ((distance = p.distanceSq(test)) < min) {
      min = distance;
      val = i;
    }
  }
  return val;
};

describe('Octree', function() {

  it('Can insert points', function() {
    const tree   = new Octree();
    const points = __range__(0, 1000, false).map(randomPoint);
    return Array.from(points).map((p, i) =>
      tree.insert(p, i));
  });

  it('Can locate exact match points', function() {
    let i, p;
    const tree   = new Octree();
    const points = __range__(0, 1000, false).map(randomPoint);
    for (i = 0; i < points.length; i++) {
      p = points[i];
      tree.insert(p, i);
    }

    return (() => {
      const result = [];
      for (i = 0; i < points.length; i++) {
        p = points[i];
        const nearest = tree.nearest(p);
        result.push(expect(nearest.value).to.equal(i));
      }
      return result;
    })();
  });

  return it('Can find same nearest point as linear search', function() {
    const tree   = new Octree();
    const points = __range__(0, 1000, false).map(randomPoint);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      tree.insert(p, i);
    }

    return (() => {
      const result = [];
      for (let run = 0; run < 1000; run++) {
        const test = randomPoint();
        const nt = tree.nearest(test).value;
        const nl = nearestPointLinear(points, test);
        result.push(expect(nt).to.equal(nl));
      }
      return result;
    })();
  });
});


function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}