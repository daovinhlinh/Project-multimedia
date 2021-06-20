class Handwriting {
  constructor() {
    this.model = new Model();

    this.stroke = document.getElementById("stroke");
    this.output = document.getElementById("output");

    this.canvas = new fabric.Canvas("handwriting", {
      backgroundColor: "#fff",
      isDrawingMode: true,
    });

    this.canvas.freeDrawingBrush.color = "#000";
    this.clearCanvas(true);
    this.resizeCanvas();

    this.model.isLoadedModel.then(this.bindEvents.bind(this));
  }

  //Reset canvas and optionaly remove previous predictions
  clearCanvas(removeText = true) {
    this.canvas.clear();
    this.canvas.backgroundColor = "#fff";
    if (removeText) {
      this.output.value = "";
      this.model.clearInput();
    }
  }

  //Rescales canvas to current window dimensions
  resizeCanvas() {
    this.canvas.setDimensions({
      width: 300,
      height: 300,
    });
    this.canvas.calcOffset();
    this.canvas.renderAll();
  }

  captureDrawing() {
    //Groups collection of strokes on canvas to a group
    let group = new fabric.Group(this.canvas.getObjects());
    let { left, top, width, height } = group;
    let scale = window.devicePixelRatio;
    let image = this.canvas.contextContainer.getImageData(
      left * scale,
      top * scale,
      width * scale,
      height * scale
    );
    this.clearCanvas(false);
    return image;
  }

  bindEvents() {
    this.stroke.onchange = ({ target }) => {
      this.canvas.freeDrawingBrush.width = parseInt(target.value, 10) || 1;
      target.previousSibling.innerHTML = target.value;
    };

    this.canvas.freeDrawingBrush.width = parseInt(this.stroke.value, 10) || 1;
    this.stroke.previousSibling.innerHTML = this.canvas.freeDrawingBrush.width;

    let timer = null;
    let isTouched = "ontouchstart" in window;
    let timeOut = isTouched ? 400 : 800;
    let hasTimeout = true;

    this.canvas
      .on("mouse:down", () => {
        if (hasTimeout) this.clearCanvas(false);
        hasTimeout = false;

        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      })
      .on("mouse:up", () => {
        timer = setTimeout(() => {
          hasTimeout = true;
          let [character, probability] = this.model.predict(
            this.captureDrawing()
          );
          this.output.value += true || probability > 0.5 ? character : "?";
        }, timeOut);
      });

    window.onresize = this.resizeCanvas.bind(this);
  }
}

let handwriting = new Handwriting();
