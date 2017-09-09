Point.prototype.setWeights = function(wt1, wt2, wt3, wt4) {
  this.wt1 = wt1;
  this.wt2 = wt2;
  this.wt3 = wt3;
  this.wt4 = wt4;
}

Point.prototype.copyWeights = function(point) {
  this.wt1 = point.wt1;
  this.wt2 = point.wt2;
  this.wt3 = point.wt3;
  this.wt4 = point.wt4;
}

/////////////////////////////////////////////////

var controlShape = new Path(
  new Point(100, 100),
  new Point(400, 100),
  new Point(400, 400),
  new Point(100, 400)
)
controlShape.fillColor = 'white';
controlShape.fullySelected = true;
controlShape.closed = true;
controlShape.strokeColor = 'black';

currentShape = new Path();
currentShape.fullySelected = true;
currentShape.closed = true;

// compute midpoints for each pair of points on the currentShape
// and add each of those new midpoints to the currentShape
handleClickSplit = function(e) {
  // initialize currentShape if its empty
  if (currentShape.segments.length == 0){
    _initializeCurrentShape(currentShape)
  }

  var originalSegments = currentShape.segments.length,
    totalSegments = originalSegments * 2,
    tmpMidpoint,
    midpoint,
    points;

  // for each pair of points, compute the midpoint and add to currentShape
  // between the points it is the midpoint of
  for (var mpAdded = 0, leftIndex = 0; mpAdded < originalSegments; mpAdded++) {
    points = _segmentPoints(currentShape);
    tmpMidpoint = _midPoint(points[leftIndex], points[(leftIndex + 1) % (totalSegments - 1)]);
    midpoint = currentShape.insert(leftIndex + 1, tmpMidpoint).point;  // b/t left and right point
    midpoint.copyWeights(tmpMidpoint);
    leftIndex += 2;  // to skip over the point it just added
  }
}

// for each pair of points, pt1 and pt2 (where pt2 is the clockwise neighbor)
// compute the midpoint again
// set pt1's destination pt equal to the midpoint
handleClickAverage = function(e) {
  var points = _segmentPoints(currentShape),
    numSegments = currentShape.segments.length;

  // for each pair of points, compute the midpoint and add to currentShape
  // between the points it is the midpoint of
  // then, install the midpoint as the destination point for the left-hand point
  for (var i = 0; i < numSegments; i++) {
    var left = points[i];
    var right = points[(i+1) % (numSegments)];
    var midpoint = _midPoint(left, right);
    left.dest = midpoint;
  }
  for (var i = 0; i < numSegments; i++) {
    points[i].x = points[i].dest.x;
    points[i].y = points[i].dest.y;
    points[i].copyWeights(points[i].dest);
    points[i].dest = null;
  }
}

// animate the movement from each point in currentShape to its destinationPoint
// onFrame = function(event) {

// }

_initializeCurrentShape = function(currentShape) {
  var point = new Point(controlShape.segments[0].point);
  point = currentShape.add(point).point;
  point.setWeights(1, 0, 0, 0);

  point = new Point(controlShape.segments[1].point);
  point = currentShape.add(point).point;
  point.setWeights(0, 1, 0, 0);

  point = new Point(controlShape.segments[2].point);
  point = currentShape.add(point).point;
  point.setWeights(0, 0, 1, 0);

  point = new Point(controlShape.segments[3].point);
  point = currentShape.add(point).point;
  point.setWeights(0, 0, 0, 1);
}

_midPoint = function(pt1, pt2) {
  var point = new Point(
    (pt1.x + pt2.x) / 2,
    (pt1.y + pt2.y) / 2
  );

  point.setWeights(
    (pt1.wt1 + pt2.wt1)/2,
    (pt1.wt2 + pt2.wt2)/2,
    (pt1.wt3 + pt2.wt3)/2,
    (pt1.wt4 + pt2.wt4)/2
  );

  return point;
}

_segmentPoints = function(shape) {
  var points = shape.segments.map(function(segment) {
    return segment.point
  });
  return points;
}

globals = {
  splitHandler: handleClickSplit,
  averageHandler: handleClickAverage
}