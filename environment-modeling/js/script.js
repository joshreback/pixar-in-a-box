var controlShape = new Path();
A = controlShape.add(new Point(100, 100)).point;
A.t = 0;
B = controlShape.add(new Point(225, 200)).point;
B.AB_t = 1;
B.BC_t = 0;
C = controlShape.add(new Point(120, 315)).point;
C.t = 1;


controlShape.fullySelected = true;

// generate a midpoint for each consecutive pair of points
// And connect points from the AB segment to the BC segment with a line
// -> string art
generateMidpoint = function(e) {
  var addMidpoint = function(pt1, pt2, index, tFunc) {
    var t1 = tFunc(pt1);
    var t2 = tFunc(pt2);

    var point = new Point((pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2);
    var segmentPoint = controlShape.insert(index, point).point;
    segmentPoint.t = (t1 + t2)/2;
    return segmentPoint;
  }

  // generate midpoints on AB and on BC
  var pt1, pt2, mpOnAB, mpOnBC, stringArt,
    midIndex = (controlShape.segments.length - 1) / 2;
  var bcIndex = midIndex,
    abIndex = 0;

  for (var i = 0; i < midIndex; i++) {

    // add A-B midpoint
    pt1 = controlShape.segments[abIndex].point;
    pt2 = controlShape.segments[abIndex + 1].point;
    mpOnAB = addMidpoint(pt1, pt2, abIndex + 1, function(pt) {
      return pt == B ? pt.AB_t : pt.t;
    });
    abIndex += 2;
    bcIndex++;  // increment since we just added a point

    // add B-C midpoint
    pt1 = controlShape.segments[bcIndex].point;
    pt2 = controlShape.segments[bcIndex + 1].point;
    mpOnBC = addMidpoint(pt1, pt2, bcIndex + 1, function(pt) {
      return pt == B ? pt.BC_t : pt.t;
    });
    bcIndex += 2;

    // then join them up to get string art
    stringArt = new Path(mpOnAB, mpOnBC);
    stringArt.strokeColor = 'black';
  }
}

globals = {
  generateMidpoint: generateMidpoint
}