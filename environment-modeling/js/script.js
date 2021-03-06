var controlShape = new Path();
A = controlShape.add(new Point(100, 100)).point;
A.t = 0;
B = controlShape.add(new Point(225, 200)).point;
B.AB_t = 1;
B.BC_t = 0;
C = controlShape.add(new Point(100, 315)).point;
C.t = 1;

stringArtArr = [];
var orthogonals = [];
var annotations = new Path();
var parabola = new Path();

// controlShape.closed = true;
controlShape.fullySelected = true;
controlShape.fillColor = 'white';

var getClosestPoint = function(point) {
  var points = [A, B, C],
    closestDistance = Infinity,
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

controlShape.onMouseDown = function(event) {
  var point = getClosestPoint(event.point);
  if (_distance(point, event.point) > 20) return;

  var text = new PointText(point.x, point.y);
  text.content = "(" + point.x + ", " + point.y + ")";
  annotations.add(text);
  text.removeOnUp();
};

// move the controlShape in accordance with the mouse drag
// and drag all of the Q's and R's along with it
controlShape.onMouseDrag = function(event) {
  var refreshPointLocation = function(point) {
    if (point.edge == undefined) return;
    var t = point.t;
    if (point.edge == "AB") {
      point.x = (1.0-t)*A.x + t*B.x;
      point.y = (1.0-t)*A.y + t*B.y;
    } else if (point.edge == "BC") {
      point.x = (1.0-t)*B.x + t*C.x;
      point.y = (1.0-t)*B.y + t*C.y;
    }
  }

  // update controlPoint
  var point = getClosestPoint(event.point);
  point.x = event.point.x;
  point.y = event.point.y;

  // remove prior stringArt
  stringArtArr.forEach(function(art) {
    art.remove();
  });
  stringArtArr = [];

  // update stringArt
  var ABpt, BCpt, midIndex = (controlShape.segments.length - 1) / 2;
  for (var i = 1; i < midIndex; i++) {
    ABpt = controlShape.segments[i].point;
    BCpt = controlShape.segments[midIndex + i].point;
    refreshPointLocation(ABpt);
    refreshPointLocation(BCpt);
    stringArtArr.push(generateStringArt(ABpt, BCpt));
  }

  // and redraw parabola
  if (parabola) drawParabola();
}

generateStringArt = function(pt1, pt2) {
  var stringArt = new Path.Line(pt1, pt2);
  stringArt.strokeColor = 'black';
  stringArt.fillColor = 'white';
  return stringArt;
}

// generate a midpoint for each consecutive pair of points
// And connect points from the AB segment to the BC segment with a line
// -> string art
generateMidpoint = function(e) {
  var addMidpoint = function(pt1, pt2, index, edge, tFunc) {
    var t1 = tFunc(pt1);
    var t2 = tFunc(pt2);

    var point = new Point((pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2);
    var segmentPoint = controlShape.insert(index, point).point;
    segmentPoint.t = (t1 + t2)/2;
    segmentPoint.edge = edge
    return segmentPoint;
  }

  // generate midpoints on AB and on BC
  var pt1, pt2, Q, R, stringArt,
    midIndex = (controlShape.segments.length - 1) / 2;
  var bcIndex = midIndex,
    abIndex = 0;

  for (var i = 0; i < midIndex; i++) {
    // add A-B midpoint
    pt1 = controlShape.segments[abIndex].point;
    pt2 = controlShape.segments[abIndex + 1].point;
    Q = addMidpoint(pt1, pt2, abIndex + 1, "AB", function(pt) {
      return pt == B ? pt.AB_t : pt.t;
    });
    abIndex += 2;
    bcIndex++;  // increment since we just added a point

    // add B-C midpoint
    pt1 = controlShape.segments[bcIndex].point;
    pt2 = controlShape.segments[bcIndex + 1].point;
    R = addMidpoint(pt1, pt2, bcIndex + 1, "BC", function(pt) {
      return pt == B ? pt.BC_t : pt.t;
    });
    bcIndex += 2;

    // then join them up to get string art
    stringArtArr.push(generateStringArt(Q, R));
  }
}

toggleStringArt = function() {
  stringArtArr.forEach(function(art){
    art.visible = !art.visible;
  })
}

// Draw parabola by applying formula to Q (on AB edge) and R (on BC edge)
drawParabola = function(e) {
  if (parabola) {
    parabola.remove();
  }

  parabola = new Path();
  parabola.strokeColor = 'green';
  parabola.fillColor = 'white';
  parabola.strokeWidth = 3;

  var Q, R, P, t, halfway = (controlShape.segments.length - 1) / 2;
  for (var i = 0; i <= halfway; i++) {
    Q = controlShape.segments[i].point;
    R = controlShape.segments[halfway + i].point;
    t = Q == B ? Q.AB_t : Q.t;

    P = new Point(
      (1-t)*Q.x + t*R.x,
      (1-t)*Q.y + t*R.y
    )
    parabola.add(P);
  }
}

// generate skeleton by drawing a perpendicular line at each point
generateSkeleton = function(e) {
  var skeletonWidth = 10;

  if (!parabola) drawParabola();

  var vec, skeletonPath, P;
  for (var i = 0; i < stringArtArr.length; i++){
    vec = stringArtArr[i].getNormalAt(0).normalize(10);
    for (var j = 0; j < parabola.segments.length; j++) {
      if (_isOnPath(
        parabola.segments[j].point,
        stringArtArr[i].segments[0].point,
        stringArtArr[i].segments[1].point)) {

        P = parabola.segments[j].point;
      }
    }
    skeletonPath = new Path(P.subtract(vec), P.add(vec));
    skeletonPath.strokeColor = 'red';
  }
}

_isOnPath = function(point, pt1, pt2) {
  return pt1.subtract(point).angle == pt1.subtract(pt2).angle;
}
_distance = function(pt1, pt2) {
  return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

_lineVec = function(path) {
  return new Point(
    path.segments[1].point.x - path.segments[0].point.x,
    path.segments[1].point.y - path.segments[0].point.y);
}

globals = {
  generateMidpoint: generateMidpoint,
  drawParabola: drawParabola,
  toggleStringArt: toggleStringArt,
  generateSkeleton: generateSkeleton
}