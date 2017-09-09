var controlShape = new Path(
  new Point(100, 100),
  new Point(100, 400),
  new Point(400, 400),
  new Point(400, 100)
)
controlShape.fillColor = 'white';
controlShape.fullySelected = true;
controlShape.closed = true;
controlShape.strokeColor = 'black';

// set up global variables
currentShape = new Path();
averaging = false;
newAveragedShape = false;

controlShape.onMouseDrag = function(event) {
  var controlShapePoints = _shapePoints(controlShape),
    currentShapePoints = _shapePoints(currentShape),
    furthestPoint,
    oppositeEdges = [],
    maxDistance;
  var controlShapePointsCopy = [];
  for (var i in controlShapePoints) {
    controlShapePointsCopy.push(controlShapePoints[i].clone());
  }

  // given an array "points", return the one that is closest to "point"
  var getClosestPoint = function(point, points) {
    var closestDistance = Infinity,
      closestPointIndex = null,
      closestPoint = null;

    // find closest point to click
    for (var i = 0; i < points.length; i++) {
      if (_distance(point, points[i]) < closestDistance) {
        closestPoint = points[i];
        closestDistance = _distance(point, points[i]);
        closestPointIndex = i;
      }
    }
    return {
      point: closestPoint,
      index: closestPointIndex
    };
  }

  var closest = getClosestPoint(event.point, controlShapePoints);
  closestPointIndex = closest.index;
  furthestPoint = controlShapePoints[(closestPointIndex + 2) % 4];
  maxDistance = furthestPoint - closest.point

  var closestPointCopy = closest.point.clone();
  closest.point.x = event.point.x;
  closest.point.y = event.point.y;

  if (!currentShape) return;

  oppositeEdges = [
    {
      pt1: controlShapePoints[(closestPointIndex + 1) % 4],
      pt2: furthestPoint
    },
    {
      pt1: furthestPoint,
      pt2: controlShapePoints[(closestPointIndex + 3) % 4]
    }
  ]

  var liesOnOppositeEdges = function(point){
    var slope = function(pt1, pt2) {
      return (pt1.y - pt2.y) / (pt1.x - pt2.x);
    }

    return (
      slope(point, oppositeEdges[0].pt1) == slope(oppositeEdges[0].pt2, oppositeEdges[0].pt1) ||
      slope(point, oppositeEdges[1].pt1) == slope(oppositeEdges[1].pt2, oppositeEdges[1].pt1)
    )
  }

  var dist, xProp, yProp;
  for (var i = 0; i < currentShapePoints.length; i++) {
    // do not scale points that are:
    // on an opposite edge
    if (liesOnOppositeEdges(currentShapePoints[i])) continue;

    // closest to the furthest point
    if (getClosestPoint(currentShapePoints[i], controlShapePoints).point == furthestPoint) continue;

    // if here, move the point to track the motion of the dragged point
    // closer points move more
    // further points move less
    // apply a proportion of the movement to each point

    if (getClosestPoint(currentShapePoints[i], controlShapePointsCopy).point == closestPointCopy) {
      currentShape.segments[i].point.x += 0.75 * event.delta.x;
      currentShape.segments[i].point.y += 0.75 * event.delta.y;
    } else {
      currentShape.segments[i].point.x += 0.25 * event.delta.x;
      currentShape.segments[i].point.y += 0.25 * event.delta.y;
    }
  }

}

// add points to each segment's midpoint
handleClickSplit = function(e) {
  newAveragedShape = false;

  if (currentShape.segments.length == 0) {
    // copy control shape onto currentShape
    currentShape = controlShape.clone();
    currentShape.strokeColor = 'green';
  }

  var i = 0,
    midPoint,
    points;

  while (i < _shapePoints(currentShape).length - 1) {
    points = _shapePoints(currentShape);
    midPoint = _computeMidpoint(points[i], points[i+1]);
    currentShape.insert(i + 1, midPoint);
    i += 2;  // incrementing by 1 only moves i to added point
  }

  // compute last midPoint (between last point and first point)
  points = _shapePoints(currentShape);
  midPoint = _computeMidpoint(points[i], points[0]);
  currentShape.add(midPoint);
  currentShape.fullySelected = true;
}

handleClickAverage = function(e) {
  averagedShape = new Path();
  averagedShape.visible = false;
  averagedShape.closed = true;

  var points = _shapePoints(currentShape);

  for (var i = 0; i < points.length; i++) {
    if (i == points.length - 1) {
      averagedShape.add(_computeMidpoint(points[i], points[0]))
    } else {
      averagedShape.add(_computeMidpoint(points[i], points[i+1]))
    }
  }

  // mark that a newAveragedShape has been computed
  newAveragedShape = true;
}

onFrame = function(event) {
  if (!newAveragedShape) return;

  // if there is a newAveragedShape computed, animate the transition b/t the
  // currentShape and the newAveragedShape
  var animationLength = globals.animationSpeed(),  // seconds
    averagedShapePts = _shapePoints(averagedShape),
    currentShapePts = _shapePoints(currentShape),
    xDist,
    yDist,
    finished = true;

  // move currentShape coords towards corresponding averageShaped coords slightly
  for (var i = 0; i < currentShapePts.length; i++) {
    xDist = averagedShapePts[i].x - currentShapePts[i].x;
    yDist = averagedShapePts[i].y - currentShapePts[i].y;

    if (!(xDist < 0.001 && yDist < 0.001)){
      finished = false;
    }

    currentShapePts[i].x += xDist / (60 * animationLength);
    currentShapePts[i].y += yDist / (60 * animationLength);
  }

  if (finished) {
    newAveragedShape = false;
  }
}

_shapePoints = function(shape) {
  var points = shape.segments.map(function(segment) {
    return segment.point
  });
  return points;
}

_computeMidpoint = function(pt1, pt2) {
  return new Point(
    (pt1.x + pt2.x) / 2,
    (pt1.y + pt2.y) / 2
  )
}

_distance = function(pt1, pt2) {
  return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

globals = {
  splitHandler: handleClickSplit,
  averageHandler: handleClickAverage
}