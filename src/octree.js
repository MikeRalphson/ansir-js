/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

class Octree {
  static initClass() {
  
    this.prototype.internal  = false;
  }

  constructor(
    _order,
    _center
  ) {
    if (_order == null) { _order = 16; }
    this._order = _order;
    if (_center == null) { _center = new Octree.Point(0,0,0); }
    this._center = _center;
  }

  get(point) {
    let node = this;
    while (node.internal) {
      node = node._childAt(point);
    }
    return node._dataValue;
  }

  insert(point, value) {
    let node = this;
    while (node.internal) {
      node = node._childAt(point);
    }
    node._insert(point,value);
  }

  nearest(point, best = null) {
    // Return if best is already better than anything in this node
    const halfSize = Math.pow(2, this._order - 1);
    if ((best != null) && (
       (point.x < (this._center.x - halfSize - best.distance)) ||
       (point.x > (this._center.x + halfSize + best.distance)) ||
       (point.y < (this._center.y - halfSize - best.distance)) ||
       (point.y > (this._center.y + halfSize + best.distance)) ||
       (point.z < (this._center.z - halfSize - best.distance)) ||
       (point.z > (this._center.z + halfSize + best.distance))
      )) {
      return best;
    }

    // If we have a value, test ourselves
    if (this._dataPoint != null) {
      const distance = this._dataPoint.distance(point);
      if ((best == null)) {
        best = {
          distance,
          point    : this._dataPoint,
          value    : this._dataValue
        };
      } else if (distance < best.distance) {
        best = {
          distance,
          point    : this._dataPoint,
          value    : this._dataValue
        };
      }
    }

    // Finally, recurse children starting at most likely index
    if (this._children != null) {
      const startIndex = this._toChildIndex(point);
      for (let i = 0; i < 8; i++) {
        const idx = (i + startIndex) % 8;
        best = this._children[idx].nearest(point, best);
      }
    }

    return best;
  }

  _internalize() {
    this.internal = true;
    const quarterSize = Math.pow(2, this._order - 2);

    this._children = new Array(8);
    for (let i = 0; i < 8; i++) {
      this._children[i] = new this.constructor(
        (this._order - 1),
        this._toCenterPoint(i, quarterSize)
      );
    }
  }

  _toCenterPoint(index, quarterSize) {
    const x = (index & 1) === 0 ? this._center.x - quarterSize : this._center.x + quarterSize;
    const y = (index & 2) === 0 ? this._center.y - quarterSize : this._center.y + quarterSize;
    const z = (index & 4) === 0 ? this._center.z - quarterSize : this._center.z + quarterSize;
    return new Octree.Point(x, y, z);
  }

  _toChildIndex(point) {
    const x = point.x < this._center.x ? 0 : 1;
    const y = point.y < this._center.y ? 0 : 1;
    const z = point.z < this._center.z ? 0 : 1;
    return ((z << 2) | (y << 1) | x);
  }

  _childAt(point) {
    return this._children[this._toChildIndex(point)];
  }

  _insert(point, value) {
    // insert here if empty
    if ((this._dataPoint == null)) {
      this._dataPoint = point;
      this._dataValue = value;
      return;
    }

    // detect direct collisions before attempting to subdivide
    if ((this._dataPoint.x === point.x) &&
       (this._dataPoint.y === point.y) &&
       (this._dataPoint.z === point.z)) {
      return; // throw new Error('Collision', @_dataValue)
    }

    // otherwise we must split!
    // extract current data values
    const currentPoint = this._dataPoint;
    const currentValue = this._dataValue;
    delete this._dataPoint;
    delete this._dataValue;

    this._internalize();

    // re-insert both
    this._childAt(currentPoint).insert(currentPoint, currentValue);
    this._childAt(point).insert(point, value);
  }
}
Octree.initClass();

Octree.Point = class Point {
  static centroid(pts) {
    const c = new Octree.Point();
    for (let p of Array.from(pts)) { c.add(p); }
    return c.scale(1.0 / pts.length);
  }

  constructor(x, y, z) {
    if (x == null) { x = 0; }
    this.x = x;
    if (y == null) { y = 0; }
    this.y = y;
    if (z == null) { z = 0; }
    this.z = z;
  }

  distanceSq(p) {
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dz = p.z - this.z;
    return (dx * dx) + (dy * dy) + (dz * dz);
  }

  distance(p) {
    return Math.sqrt(this.distanceSq(p));
  }

  add(p) {
    this.x += p.x;
    this.y += p.y;
    this.z += p.z;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  valueOf() {
    return `${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}`;
  }
};


module.exports = Octree;