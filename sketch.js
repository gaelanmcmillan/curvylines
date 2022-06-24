var pointCollections = [];
var anchor = {x: 0, y:0};
var updateCountdown = 0;
var updateInterval = 1;
var deleteThreshold = 0.05;
var deleteAge = 1;
var canDrawPoints = false;

function setup() {
  canvas = createCanvas(400, 400);
  frameRate(30);
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
  
  canvas.mousePressed(() => {
    pointCollections.push([]);
  });
  
  canvas.mouseOver(() => {
    canDrawPoints = true;
  });
  
  canvas.mouseOut(() => {
    canDrawPoints = false;
  })
}

function addPointsToCurvyLine(points) {
  if (mouseIsPressed && canDrawPoints) {
    updateCountdown -= 1;
    
    // add points to line
    if (updateCountdown <= 0) {
      points.push({ x: mouseX, y: mouseY, age: 0, deleteMe: false });
      updateCountdown += updateInterval;
    }
  } 
}

function deleteIfCloseToPoint(p, q) {
  if (p.age > deleteAge && dist(p.x, p.y, q.x, q.y) <= deleteThreshold) {
    console.log("final point flagged for deletion");
    p.deleteMe = true;
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

function updateCurvyLinePositions(points) {
  
  // move points toward the next
  for (let i = 0; i < points.length-1; i++) {
    points[i].x = lerp(points[i].x, points[i+1].x, fadeTimeSlider.value());
    points[i].y = lerp(points[i].y, points[i+1].y, fadeTimeSlider.value());
  }
  
  for (let point of points) { point.age++; }
  
  return deleteLastIfItsTime(points);
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

function draw() {
  background(220);
  
  let pointCount = 0;
  
  addPointsToCurvyLine(pointCollections[pointCollections.length-1]);
  
  for (let points of pointCollections) {
    points = updateCurvyLinePositions(points);
    drawFatLine(points, 2, 10);
  }

  pointCount = pointCollections
    .map(arr => arr.length)
    .reduce((a,b) => a+b, 0);
  
  if (debugCheckbox.showDebug) {
    text(updateCountdown,10,20);
    text(fadeTimeSlider.value(), 10,60);
    text(`Number of points: ${pointCount}`, 10, 40);
  }
}
