const fileInput = document.getElementById("fileinput");
const download = document.getElementById("download");
const canvas = document.getElementById("canvas");
const filter = document.getElementById("filter-bar");
const defaultImg = document.getElementById("default-img");
const ctx = canvas.getContext("2d");

const red = document.getElementById("red");
const green = document.getElementById("green");
const blue = document.getElementById("blue");
const brightness = document.getElementById("brightness");
const grayscale = document.getElementById("grayscale");
const contrast = document.getElementById("contrast");
const swirl = document.getElementById("swirl");

const imgSrc = new Image();
var imgData, originalPixels, currentPixels;

fileInput.onchange = (e) => {
    if (e.target.files) {
        imgSrc.src = URL.createObjectURL(e.target.files[0]); //create blob url
        filter.classList.remove("hidden");
    }
};

download.addEventListener("click", (e) => {
    let dataURL = canvas.toDataURL();
    download.href = dataURL;
});

imgSrc.onload = () => {
    filter.classList.remove("hide");
    defaultImg.src = imgSrc.src;
    canvas.width = imgSrc.width;
    canvas.height = imgSrc.height;
    ctx.drawImage(imgSrc, 0, 0, imgSrc.width, imgSrc.height); //draw canvas image
    imgData = ctx.getImageData(0, 0, imgSrc.width, imgSrc.height);
    originalPixels = imgData.data.slice(); //return copy of imgData array

    //Giả sử ảnh 2x2 thì array sẽ có dạng [128, 255, 0, 255, 186, 182, 200, 255, 186, 255, 255, 255, 127, 60, 20, 128]
    // 8 value đầu sẽ của 2 pixels dòng đầu và 8 value cuối sẽ của 2 pixels dòng 2
    //1 pixel chiếm 4 value lần lượt là: red, green, blue, alpha channel giá trị từ 0-255
};

const getIndex = (x, y) => (x + y * imgSrc.width) * 4; //get index of pixel

//Limit value <= 255
const clamp = (value) => {
    return Math.max(0, Math.min(Math.floor(value), 255));
};

const R_OFFSET = 0;
const G_OFFSET = 1;
const B_OFFSET = 2;
const A_OFFSET = 3;

const addRed = (x, y, value) => {
    const index = getIndex(x, y) + R_OFFSET;
    const currentVal = currentPixels[index];
    currentPixels[index] = clamp(currentVal + value);
};

const addGreen = (x, y, value) => {
    const index = getIndex(x, y) + G_OFFSET;
    const currentVal = currentPixels[index];
    currentPixels[index] = clamp(currentVal + value);
};

const addBlue = (x, y, value) => {
    const index = getIndex(x, y) + B_OFFSET;
    const currentVal = currentPixels[index];
    currentPixels[index] = clamp(currentVal + value);
};

//Add more brightness = add more R, G, B value
const addBrightness = (x, y, value) => {
    addRed(x, y, value);
    addGreen(x, y, value);
    addBlue(x, y, value);
};

const addContrast = (x, y, value) => {
    const redIndex = getIndex(x, y) + R_OFFSET;
    const greenIndex = getIndex(x, y) + G_OFFSET;
    const blueIndex = getIndex(x, y) + B_OFFSET;

    const redValue = currentPixels[redIndex];
    const greenValue = currentPixels[greenIndex];
    const blueValue = currentPixels[blueIndex];

    const alpha = (value + 255) / 255; // 0<value< 2, 0->1: less contrast, 1->2: more contrast

    const newRed = alpha * (redValue - 128) + 128;
    const newGreen = alpha * (greenValue - 128) + 128;
    const newBlue = alpha * (blueValue - 128) + 128;

    currentPixels[redIndex] = clamp(newRed);
    currentPixels[greenIndex] = clamp(newGreen);
    currentPixels[blueIndex] = clamp(newBlue);
};

const addGrayScale = (x, y) => {
    const redIndex = getIndex(x, y) + R_OFFSET;
    const greenIndex = getIndex(x, y) + G_OFFSET;
    const blueIndex = getIndex(x, y) + B_OFFSET;

    const redValue = currentPixels[redIndex];
    const greenValue = currentPixels[greenIndex];
    const blueValue = currentPixels[blueIndex];

    const newRed = redValue * 0.3;
    const newGreen = greenValue * 0.59;
    const newBlue = blueValue * 0.11;

    const grayscaleValue = newRed + newGreen + newBlue;

    currentPixels[redIndex] = clamp(grayscaleValue);
    currentPixels[greenIndex] = clamp(grayscaleValue);
    currentPixels[blueIndex] = clamp(grayscaleValue);
};

const commitChange = () => {
    for (let i = 0; i < imgData.data.length; i++) {
        imgData.data[i] = currentPixels[i];
    }
    ctx.putImageData(imgData, 0, 0, 0, 0, imgSrc.width, imgSrc.height);
};

//Check value thay đổi
red.onchange = runPipeline;
green.onchange = runPipeline;
blue.onchange = runPipeline;
brightness.onchange = runPipeline;
contrast.onchange = runPipeline;
grayscale.onchange = runPipeline;
swirl.onchange = () => {
    rotateImage(imgData, swirl.value);
};

function runPipeline() {
    currentPixels = originalPixels.slice();

    //get change value
    const redFilter = Number(red.value);
    const greenFilter = Number(green.value);
    const blueFilter = Number(blue.value);
    const brightnessFilter = Number(brightness.value);
    const contrastFilter = Number(contrast.value);
    const grayscaleFilter = grayscale.checked;

    for (let i = 0; i < imgSrc.height; i++) {
        for (let j = 0; j < imgSrc.width; j++) {
            if (grayscaleFilter) {
                addGrayScale(j, i);
            } else {
                addBrightness(j, i, brightnessFilter);
                addContrast(j, i, contrastFilter);
                addRed(j, i, redFilter);
                addGreen(j, i, greenFilter);
                addBlue(j, i, blueFilter);
            }
        }
    }
    commitChange();
}

function copyImageData(srcPixels, dstPixels, width, height) {
    let i, j;
    for (j = 0; j < height; j++) {
        for (i = 0; i < width; i++) {
            dstPixels[getIndex(i, j) + R_OFFSET] =
                srcPixels[getIndex(i, j) + R_OFFSET];
            dstPixels[getIndex(i, j) + G_OFFSET] =
                srcPixels[getIndex(i, j) + G_OFFSET];
            dstPixels[getIndex(i, j) + B_OFFSET] =
                srcPixels[getIndex(i, j) + B_OFFSET];
            dstPixels[getIndex(i, j) + A_OFFSET] =
                srcPixels[getIndex(i, j) + A_OFFSET];
        }
    }
}

function checkInCircle(x, y, r) {
    return x * x + y * y <= r * r;
}

function rotateImage(imgData, deg) {
    let x, y, radius, size, centerX, centerY, sourcePosition, destPosition;
    let transformedImageData = ctx.createImageData(
        imgData.width,
        imgData.height
    );

    let originalPixels = imgData.data;
    let transformedPixels = transformedImageData.data;
    let r, alpha;
    let newX, newY;
    let degree;
    let { width, height } = imgData;

    size = width < height ? width : height;
    radius = Math.floor(size / 2);
    centerX = Math.floor(width / 2);
    centerY = Math.floor(height / 2);

    copyImageData(originalPixels, transformedPixels, width, height);

    for (y = -radius; y < radius; y++) {
        for (x = -radius; x < radius; x++) {
            if (checkInCircle(x, y, radius)) {
                destPosition = (y + centerY) * width + x + centerX;
                destPosition *= 4;
                r = Math.sqrt(x * x + y * y);
                alpha = Math.atan2(y, x);
                degree = (alpha * 180.0) / Math.PI;

                degree += (r * deg) / 1.5;
                alpha = (degree * Math.PI) / 180.0;
                newY = Math.floor(r * Math.sin(alpha));
                newX = Math.floor(r * Math.cos(alpha));

                sourcePosition = (newY + centerY) * width + newX + centerX;
                sourcePosition *= 4;

                transformedPixels[destPosition + R_OFFSET] =
                    originalPixels[sourcePosition + R_OFFSET];
                transformedPixels[destPosition + G_OFFSET] =
                    originalPixels[sourcePosition + G_OFFSET];
                transformedPixels[destPosition + B_OFFSET] =
                    originalPixels[sourcePosition + B_OFFSET];
                transformedPixels[destPosition + A_OFFSET] =
                    originalPixels[sourcePosition + A_OFFSET];
            }
        }
    }
    ctx.putImageData(transformedImageData, 0, 0);
}
