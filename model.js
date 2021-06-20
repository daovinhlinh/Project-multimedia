class Model {
  constructor() {
    this.alphabet = "abcdefghijklmnopqrstuvwxyz";
    this.characters =
      "0123456789" + this.alphabet.toUpperCase() + this.alphabet;
    this.input = document.getElementById("input");
    this.isLoadedModel = this.loadModel().then(() =>
      console.log("Backend running on: ", tf.getBackend())
    );
  }

  loadModel() {
    return tf.loadLayersModel("./model.json").then((loadedModel) => {
      this.model = loadedModel;
      console.log("Loaded");
    });
  }

  preprocessImage(pixelData) {
    //Precess image to match the model requirement
    const targetDim = 28,
      edgeSize = 2,
      resizeDim = targetDim - edgeSize * 2,
      padVertically = pixelData.width > pixelData.height,
      padSize = Math.round(
        (Math.max(pixelData.width, pixelData.height) -
          Math.min(pixelData.width, pixelData.height)) /
          2
      ),
      padSquare = padVertically
        ? [
            [padSize, padSize],
            [0, 0],
            [0, 0],
          ]
        : [
            [0, 0],
            [padSize, padSize],
            [0, 0],
          ];

    let tempImg = null;

    //Remove previous image to avoid mem leak
    if (tempImg) tempImg.dispose();

    //Clear unnecessary pixel
    return tf.tidy(() => {
      //Convert pixel data to tensor with 1 data channel per pixel
      console.log(pixelData);
      let tensor = tf.browser.fromPixels(pixelData, 1).pad(padSquare, 255.0); //pad until square
      console.log(tensor);
      tensor = tf.image.resizeBilinear(tensor, [resizeDim, resizeDim]).pad(
        [
          [edgeSize, edgeSize],
          [edgeSize, edgeSize],
          [0, 0],
        ],
        255.0
      );
      tensor = tf.scalar(1.0).sub(tensor.toFloat().div(tf.scalar(255.0)));
      tempImg = tf.keep(tf.clone(tensor));
      this.showInput(tempImg);
      return tensor.expandDims(0);
    });
  }

  predict(pixelData) {
    if (!this.model) return console.log("Model not loaded");

    let tensor = this.preprocessImage(pixelData);
    let prediction = this.model.predict(tensor).as1D();
    let argMax = prediction.argMax().dataSync()[0];
    let probability = prediction.max().dataSync()[0];
    let character = this.characters[argMax];
    return [character, probability];
  }

  clearInput() {
    //Clean image
    [...this.input.parentElement.getElementsByTagName("img")].map((el) =>
      el.remove()
    );

    //Clean canvas
    this.input
      .getContext("2d")
      .clearRect(0, 0, this.input.width, this.input.height);
  }

  showInput(tempImg) {
    let legacyImg = new Image();
    legacyImg.src = this.input.toDataURL("image/png");
    this.input.parentElement.insertBefore(legacyImg, this.input);

    tf.browser.toPixels(tempImg, this.input);
  }
}
