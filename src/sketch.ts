import P5 from "p5";

const sketch = (p5: P5) => {
    var canvas;
    p5.setup = () => {
        canvas = p5.createCanvas(400,400);
    }

    p5.draw = () => {
        p5.background(220);
    }
}

new P5(sketch);