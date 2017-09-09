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

Point.prototype.refreshLocation = function() {
  var controlPoints = _segmentPoints(controlShape);

  var newPoint = (
    controlPoints[0] * this.wt1 +
    controlPoints[1] * this.wt2 +
    controlPoints[2] * this.wt3 +
    controlPoints[3] * this.wt4);

  this.x = newPoint.x;
  this.y = newPoint.y;
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

animate = false;

controlShape.onMouseDrag = function(event) {
  // debugger;
  var controlShapePoints = _segmentPoints(controlShape);
  var currentShapePoints = _segmentPoints(currentShape);

  // return entry from "points" that's closest to point
  var getClosestPoint = function(point, points) {
    var closestDistance = Infinity,
      closestPoint = null;

    // find closest point to click
    for (var i = 0; i < points.length; i++) {
      if (_distance(point, points[i]) < closestDistance) {
        closestPoint = points[i];
        closestDistance = _distance(point, points[i]);
      }
    }
    return closestPoint;
  }

  // this is the point that needs to move in response to the mouse drag
  var closestPoint = getClosestPoint(event.point, controlShapePoints);
  // update the point
  closestPoint.x = event.point.x;
  closestPoint.y = event.point.y;

  // then update each of the points in currentShape according to the new location
  for (var i = 0; i < currentShapePoints.length; i++) {
    currentShapePoints[i].refreshLocation();
  }
}

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
  animate = true;
}

// animate the movement from each point in currentShape to its destinationPoint
onFrame = function(event) {
  if (!animate) return;

  //   // if there is a newAveragedShape computed, animate the transition b/t the
  // currentShape and the newAveragedShape
  var animationLength = globals.animationSpeed(),  // seconds
    points = _segmentPoints(currentShape),
    xDist,
    yDist,
    finished = true;

  // move currentShape coords towards corresponding averageShaped coords slightly
  for (var i = 0; i < points.length; i++) {
    xDist = points[i].dest.x - points[i].x;
    yDist = points[i].dest.y - points[i].y;
    points[i].copyWeights(points[i].dest);  // this gets done redundantly...

    if (!(xDist < 0.001 && yDist < 0.001)){
      finished = false;
    }

    points[i].x += xDist / (60 * animationLength);
    points[i].y += yDist / (60 * animationLength);
  }

  if (finished) {
    animate = false;  // we are done
    for (var i = 0; i < points.length; i++) {
      points[i].dest = null
    }
  }
}

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

_distance = function(pt1, pt2) {
  return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

globals = {
  splitHandler: handleClickSplit,
  averageHandler: handleClickAverage
}