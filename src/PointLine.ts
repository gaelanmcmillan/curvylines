import P5 from "p5";

function movePoint(p5: P5, start: Pointlike, end: Pointlike, lerpAmt: number) {
    let x = p5.lerp(start.x, end.x, lerpAmt);
    let y = p5.lerp(start.y, end.y, lerpAmt);
    return {x:x, y:y, age:start.age!};
}

function pointDistance(p5: P5, p1, p2) {
    return p5.dist(p1.x, p1.y, p2.x, p2.y);
}

export class Pointlike {
    x: number
    y: number
    age?: number;
}

export class PointLine {
    points: Pointlike[] = [];

    constructor() {

    }

    addFromMouse(p5: P5) {
        let [posx, posy] = [0,0];
        if (p5.touches.length) {
            let touch = p5.touches[0] as Pointlike;
            posx = touch.x;
            posy = touch.y;
        } else {
            posx = p5.mouseX;
            posy = p5.mouseY;
        }
        this.addPoint({ x: posx, y: posy, age: 0});
    }

    getCenterIndex() {
        return Math.floor(this.points.length/2);
    }

    getCentroid(): Pointlike {
        if (this.points.length == 0) return {x:0,y:0};
        let centroid = this.points.reduce((l,r) => { return {x:l.x + r.x, y: l.y + r.y, age:0}}, {x:0, y:0, age:0});
        let quotient = 1/this.points.length;
        centroid.x *= quotient;
        centroid.y *= quotient;
        return centroid;
    }

    shrink(p5: P5, lerpAmt: number) {
        // move all points toward the center point
        let centerIndex = this.getCenterIndex();
        for (let i = 0; i < centerIndex; ++i) {
            this.points[i] = movePoint(p5, this.points[i], this.points[i+1], lerpAmt);
        }
        
        for (let i = this.points.length-1; i > centerIndex; i--) {
            this.points[i] = movePoint(p5, this.points[i], this.points[i-1], lerpAmt);
        }
    }

    followToEnd(p5: P5, lerpAmt: number) {
        for (let i = 0; i < this.points.length-1; i++) {
            this.points[i] = movePoint(p5, this.points[i], this.points[i+1], lerpAmt);
        }
    }

    debug(p5: P5) {
        const DRAW_POINTS = true;
        let len = this.points.length;
        if (len > 2) {
            let c = this.getCentroid();
            let centerIndex = this.getCenterIndex();
            p5.push();
            p5.stroke(255,0,0);
            p5.noFill();
            p5.circle(this.points[centerIndex].x, this.points[centerIndex].y, 30);
            p5.pop();
            
            p5.push();
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.text(`Total points: ${len}`, c.x, c.y-20);
            p5.text(`Center index: ${centerIndex}`, c.x, c.y);
            
            for (let i = 0; i < len; ++i) {
                if (DRAW_POINTS) {
                    p5.push();
                    p5.strokeWeight(10);
                    p5.stroke(0);
                    p5.point(this.points[i].x, this.points[i].y);
                    p5.pop();
                }

                if (i < centerIndex) {
                    let d = pointDistance(p5, this.points[i], this.points[i+1]);
                    p5.push();
                    p5.stroke(150);
                    p5.line(this.points[i].x, this.points[i].y, this.points[i].x + 15, this.points[i].y + 15);
                    p5.pop(); 
                    p5.text(`d: ${d}`, this.points[i].x + 20, this.points[i].y + 20); 
                } else if (i > centerIndex) {
                    let d = pointDistance(p5, this.points[i], this.points[i-1]);
                    p5.push();
                    p5.stroke(150);
                    p5.line(this.points[i].x, this.points[i].y, this.points[i].x + 15, this.points[i].y + 15);
                    p5.pop(); 
                    p5.text(`d: ${d}`, this.points[i].x + 20, this.points[i].y + 20); 
                }
                
            }
            p5.pop();
        }
    }

    drawLineToCentroid(p5:P5) {
        let c = this.getCentroid();
        p5.push();
        p5.stroke(180);
        for (let p of this.points) {
            p5.line(p.x, p.y, c.x, c.y);
        }
        p5.pop();
    }

    /**
     * This really makes a path look like its scaling down evenly. Pretty uninteresting visually, but cool to know!
     * @param p5 
     * @param lerpAmt 
     */
    collapseOnCentroid(p5: P5, lerpAmt: number) {
        let c = this.getCentroid();
        for (let i = 0; i < this.points.length; ++i) {
            this.points[i] = movePoint(p5, this.points[i], c, lerpAmt);
        }
    }

    deletePointsAtIndices(...indices: number[]) {
        let newPoints: Pointlike[] = [];
        for (let i = 0; i < this.points.length; ++i) {
            if (!indices.includes(i)) {
                newPoints.push(this.points[i]);
            }
        }
        this.points = newPoints;
    }

    
    deleteCenterPointIfTooClose(p5: P5, threshold: number) {
        if (this.points.length <= 2) {
            this.points = [];
            return;
        }
        let centerIdx = this.getCenterIndex();
        let deletes: number[] = [];

        if (pointDistance(p5, this.points[centerIdx], this.points[centerIdx-1]) <= threshold) {
            deletes.push(centerIdx-1);
        }

        if (pointDistance(p5, this.points[centerIdx], this.points[centerIdx+1]) <= threshold) {
            deletes.push(centerIdx+1);
        }

        if (deletes.length != 0) {
            this.deletePointsAtIndices(centerIdx);
        }
    }

    /**
     * Main drawing function. Visualizes the line by drawing small lines between each point.
     * @param p5 
     * @param thin 
     * @param thick 
     */
    draw(p5: P5, thin: number, thick: number) {
        const CHANGE_COLOUR = true;
        let centerIndex = this.getCenterIndex();

        p5.push();
        for (let i = 0; i < this.points.length-1; ++i) {
            if (CHANGE_COLOUR) {
                let s = Math.min(p5.map(this.points[i].age!, 0, 100, 0, 220), 220);
                p5.stroke(s, 20, 255);
            }

            
            p5.strokeWeight(p5.map(Math.abs(i-centerIndex),0,centerIndex,thick,thin))
            p5.line(this.points[i].x, this.points[i].y, this.points[i+1].x, this.points[i+1].y);
        }
        p5.pop();
    }

    agePointsBy(amt: number) {
        for (let i = 0; i < this.points.length; ++i) {
            if (this.points[i].age == undefined) {
                this.points[i].age = 1;
            } else {
                this.points[i].age! += amt;
            }
        }
    }

    addPoint(point: Pointlike) {
        this.points.push(point);
    }

    removeCenterPoint() {
        if (this.points.length == 2) {
            this.points = [];
        }
    }
}