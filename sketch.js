var pointCollections = [];
var anchor = {x: 0, y:0};
var updateCountdown = 0;
var updateInterval = 1;
var deleteThreshold = 10;
var deleteAge = 1;
var canDrawPoints = false;
var directionsColour = 160;
var backgroundColour = 220;
var doShowDirections = true;
var startFadingDirections = false;

function setup() {
  canvas = createCanvas(400, 400);
  canvas.style(
    "touch-action", "none"
  );

  frameRate(1);
  updateCountdown += updateInterval;

  fadeTimeDiv = createDiv("Fade time: ");

  fadeTimeSlider = createSlider(0.001, 1, 0.5, 0.001);
  fadeTimeSlider.parent(fadeTimeDiv);
  fadeTimeSlider.style(
    "margin-left", "10px",
  );
  debugCheckbox = createCheckbox('show debug info', false);
  debugCheckbox.showDebug = false;
  
  debugCheckbox.changed(() => {
    debugCheckbox.showDebug = !debugCheckbox.showDebug;
  })
  
  const onClickOrTouch = () => {
    canDrawPoints = true;
    pointCollections.push([]);
  }

  const onClickOrTouchEnded = () => {
    canDrawPoints = false;
    startFadingDirections = true;
  }

  canvas.touchStarted(onClickOrTouch);
  canvas.mousePressed(onClickOrTouch);

  canvas.touchEnded(onClickOrTouchEnded);
  canvas.mouseReleased(onClickOrTouchEnded);
  canvas.mouseOut(onClickOrTouchEnded);
}

function addPointsToCurvyLine(points) {
  if (mouseIsPressed && canDrawPoints) {
    updateCountdown -= 1;
    
    // add points to line
    if (updateCountdown <= 0) {
      let posx, posy;
      if (touches.length) {
        posx = touches[0].x;
        posy = touches[0].y;
      } else {
        posx = mouseX;
        posy = mouseY;
      }

      points.push({ x: posx, y: posy, age: 0 });
      updateCountdown += updateInterval;
    }
  } 
}

function timeToDelete(p,q) {
  return (p.age > deleteAge && dist(p.x, p.y, q.x, q.y) <= deleteThreshold)
}

function deleteLastIfItsTime(points) {
  if (points.length == 1) return [];
  
  if (timeToDelete(points[points.length-1], points[points.length-2])) {
    points.pop();
  }
  return points;
}

function agePointsBy(points, amt) {
  for (let point of points) { point.age += amt; }
  return points;
}
/**
 * All points inch toward the last point in the array.
 * @param {*} points an array of points 
 * @returns the modified array of points
 */
function moveTowardEndpoint(points) {
  // move points toward the next
  for (let i = 0; i < points.length-1; i++) {
    points[i].x = lerp(points[i].x, points[i+1].x, fadeTimeSlider.value());
    points[i].y = lerp(points[i].y, points[i+1].y, fadeTimeSlider.value());
  }
  
  points = agePointsBy(points, 1);
  
  return deleteLastIfItsTime(points);
}

function deleteIfCloseToCenter(points, centerIdx) {
  if (points.length == 1) return [];
  
  console.log("deleting at " + centerIdx);
  if (centerIdx-1 >= 0 && centerIdx+1 < points.length) {
    if (sufficientlyClose(points[centerIdx], points[centerIdx+1]) || 
        sufficientlyClose(points[centerIdx], points[centerIdx-1])) {
      return points.filter(p => p != points[centerIdx]);
    }
  }

  return points;
}

function sufficientlyClose(p, q, thresh) {
  return (dist(p.x,p.y,q.x,q.y) <= thresh);
}

function deleteSufficientlyClosePoints(pts) {
  if (pts.length <= 2) return [];
  let newPoints = [pts[0]];
  let deleted = false;
  for (let i = 1; i < pts.length-1; ++i) {
    if (!deleted) {
      if (sufficientlyClose(pts[i], pts[i-1], deleteThreshold) || sufficientlyClose(pts[i], pts[i+1], deleteThreshold)) {
        continue;
      }

      newPoints.add[pts[i]];
    }
  }

  return pts;

  // return pts.filter(p => !toDelete.has(p));
}

/**
 * Rather than points approaching the last point, points approach the center point(s)
 * @param {*} points an array of points
 * @returns the modified array of points
 */
function moveTowardCenterpoint(points) {
  let len = points.length;
  let centerIdx = Math.floor(len/2);

  for (let i = 0; i < len; i++) {
    if (i < centerIdx) {
      points[i].x = lerp(points[i].x, points[i+1].x, fadeTimeSlider.value());
      points[i].y = lerp(points[i].y, points[i+1].y, fadeTimeSlider.value());
    } else if (i > centerIdx) {
      points[i].x = lerp(points[i].x, points[i-1].x, fadeTimeSlider.value());
      points[i].y = lerp(points[i].y, points[i-1].y, fadeTimeSlider.value());
    } else {
      push();
      stroke(255,0,0);
      strokeWeight(5);
      point(points[i].x, points[i].y);
      pop();
    }
  }

  // points = agePointsBy(points, 1);

  return deleteIfCloseToCenter(points, centerIdx);
}

/**
 * Draw lines between points. The stroke weight of the lines should be thicker near the middle of the line.
 * 
 * getWeight(0) = 1
 * getWeight(n) = 1
 * getWeight(n/2) = k
 * @param {*} points 
 */
function drawFatLine(points, thinnest, fattest) {
  let n = points.length-1;
  let m = n/2;

  for (let i = 0; i < points.length-1; i++) {
    strokeWeight(
      map(Math.abs(i-m),0,m,fattest,thinnest)
    ); // thicker towards the middle
    line(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
  }
}

function drawAllLines() {
  for (let points of pointCollections) {
    points = moveTowardEndpoint(points);
    drawFatLine(points, 2, 4);
  }
}

function drawAllLinesCenter() {
  for (let points of pointCollections) {
    if (!mouseIsPressed) points = moveTowardCenterpoint(points);
    drawFatLine(points, 2, 4);
  }
}

function drawFusion() {
  for (var [idx, points] of pointCollections.entries()) {
    if (mouseIsPressed && idx == pointCollections.length-1) {
      points = moveTowardEndpoint(points);
    } else {
      points = moveTowardCenterpoint(points);
    }
    drawFatLine(points, 2, 4);
  }
}

function showDebugInfo() {
  let pointCount = 0;
  pointCount = pointCollections
    .map(arr => arr.length)
    .reduce((a,b) => a+b, 0);
  
  if (debugCheckbox.showDebug) {
    text(updateCountdown,10,20);
    text(fadeTimeSlider.value(), 10,60);
    text(`Number of points: ${pointCount}`, 10, 40);
  }
}

function showDirections() {
  if (doShowDirections) {
    push();
    textAlign(CENTER, CENTER);
    textStyle(ITALIC);
    if (startFadingDirections) {
      directionsColour = lerp(directionsColour, backgroundColour, 0.1);
    }
    fill(directionsColour);
    text("click and hold or touch to draw", width/2, height/2);
    pop();
  }
}

function draw() {
  background(backgroundColour);
  showDirections();
  addPointsToCurvyLine(pointCollections[pointCollections.length-1]);
  // drawAllLines();
  // drawAllLinesCenter();
  drawFusion();
  showDebugInfo();
}
