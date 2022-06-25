import P5 from "p5";
import { PointLine, Pointlike } from "./PointLine";


const sketch = (p5: P5) => {
    const FRAMERATE = 60;
    const BG_COLOUR = 220;
    var DIRECTIONS_COLOUR = 150;
    var POINT_DELETE_THRESHOLD = 3;
    var POINT_MOVEMENT_AMT = 0.1;

    var LINES: PointLine[] = [];

    var CAN_DRAW = false; 
    var CAN_SHOW_DIRECTIONS = true;
    var CAN_FADE_DIRECTIONS = false;

    var UPDATE_TIMER = 0;
    var UPDATE_COOLDOWN = 1; 

    var canvas;

    p5.setup = () => {
        canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
        canvas.parent("sketch");
        canvas.style("touch-action", "none");

        var movementSliderDiv = p5.createDiv(`point movement rate: ${POINT_MOVEMENT_AMT}`);
        var movementSlider = p5.createSlider(0, 1, 0.5, 0.01);
        const updateSliderDiv = () => {
            POINT_MOVEMENT_AMT = movementSlider.value() as number;
            let s = `point movement rate: ${POINT_MOVEMENT_AMT}`;
            movementSliderDiv.html(s);
        }
        movementSlider.mouseMoved(() => {
            if (p5.mouseIsPressed) {
                updateSliderDiv();
            }
        })


        const touchDown = () => {
            CAN_DRAW = true;
            LINES.push(new PointLine());
        }

        const touchUp = () => {
            CAN_DRAW = false;
            CAN_FADE_DIRECTIONS = true;
        }

        canvas.mousePressed(touchDown);
        canvas.touchStarted(touchDown);

        canvas.mouseReleased(touchUp);
        canvas.touchEnded(touchUp);
        canvas.mouseOut(touchUp);

        p5.frameRate(FRAMERATE);
    }

    const displayDirections = () => {
        if (CAN_SHOW_DIRECTIONS) {
            p5.push();
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.textStyle(p5.ITALIC);

            if (CAN_FADE_DIRECTIONS) {
                DIRECTIONS_COLOUR = p5.lerp(DIRECTIONS_COLOUR, BG_COLOUR, 0.1);
            }

            p5.fill(DIRECTIONS_COLOUR);
            p5.text("click and hold or touch to draw", p5.width/2, p5.height/2);
            p5.pop();
          }
    }

    const addToCurrentLine = () => {
        if (p5.mouseIsPressed && CAN_DRAW) {
            UPDATE_TIMER--;
            if (UPDATE_TIMER <= 0) {
                LINES[LINES.length-1].addFromMouse(p5);
                UPDATE_TIMER += UPDATE_COOLDOWN;
            }
        }
    }

    const processAllLines = () => {
        let len = LINES.length;
        for (let i = 0; i < len; i++) {
            if (i == len-1 && p5.mouseIsPressed) {
                LINES[i].followToEnd(p5, POINT_MOVEMENT_AMT);
            } else {
                LINES[i].shrink(p5, POINT_MOVEMENT_AMT);
            }
        }
    }

    const drawAllLines = () => {
        for (let line of LINES) {
            line.draw(p5, 2, 6);
        }
    }

    const deleteCenterPointOfEachLine = () => {
        let len = LINES.length;
        for (let [i, line] of LINES.entries()) {
            if (i != len-1 || !p5.mouseIsPressed ) {
                line.deleteCenterPointIfTooClose(p5, POINT_DELETE_THRESHOLD);
            }
        }
    }

    const drawLinesToCentroid = () => {
        for (let line of LINES) {
            line.drawLineToCentroid(p5);
        }
    }

    const ageAllPoints = () => {
        for (let line of LINES) {
            line.agePointsBy(1);
        }
    }

    const debugAllLines = () => {
        for (let line of LINES) {
            line.debug(p5);
        }
    }

    p5.draw = () => {
        p5.background(BG_COLOUR);
        displayDirections();
        addToCurrentLine();

        if (!p5.keyIsPressed) {
            processAllLines();
            ageAllPoints();
        }
        drawAllLines();
        deleteCenterPointOfEachLine();
        // drawLinesToCentroid();

        // debugAllLines();
    }
}

new P5(sketch);