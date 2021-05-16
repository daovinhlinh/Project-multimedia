const fileInput = document.getElementById("fileinput");
const download = document.getElementById("download");
const canvas = document.getElementById("canvas");
const filter = document.getElementById("filter-bar");
const tab = document.getElementsByClassName("tab")[0];
const defaultImg = document.getElementById("default-img");
const resetImg = document.getElementById("reset-img");
const ctx = canvas.getContext("2d");

const red = document.getElementById("red");
const green = document.getElementById("green");
const blue = document.getElementById("blue");
const brightness = document.getElementById("brightness");
const grayscale = document.getElementById("grayscale");
const contrast = document.getElementById("contrast");
const threshold = document.getElementById("threshold");
const swirl = document.getElementById("swirl");

const imgSrc = new Image();
var imgData, originalPixels, currentPixels;

fileInput.onchange = (e) => {
    if (e.target.files) {
        imgSrc.src = URL.createObjectURL(e.target.files[0]); //create blob url
        filter.classList.remove("hidden");
        tab.classList.remove("hidden");
    }
};

//Download
download.addEventListener("click", (e) => {
    let dataURL = canvas.toDataURL();
    download.href = dataURL;
});

//Undo change to image
resetImg.addEventListener("click", (e) => {
    resetChange();
});

imgSrc.onload = () => {
    // filter.classList.remove("hide");
    defaultImg.src = imgSrc.src;
    canvas.width = imgSrc.width;
    canvas.height = imgSrc.height;
    ctx.drawImage(imgSrc, 0, 0, imgSrc.width, imgSrc.height); //draw canvas image
    imgData = ctx.getImageData(0, 0, imgSrc.width, imgSrc.height);
    originalPixels = imgData.data.slice(); //return copy of imgData array

    //Giả sử ảnh 2x2 thì array sẽ có dạng [128, 255, 0, 255, 186, 182, 200, 255, 186, 255, 255, 255, 127, 60, 20, 128]
    // 8 value đầu sẽ của 2 pixels dòng đầu và 8 value cuối sẽ của 2 pixels dòng 2
    //1 pixel chiếm 4 value lần lượt là: red, green, blue, alpha và có giá trị từ 0-255
};

function openTab(event, tabName) {
    let i, tabcontents, tablinks;
    tabcontents = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "flex";
    event.currentTarget.className += " active";
}

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

    const newRed = redValue * 0.2126; //0,3
    const newGreen = greenValue * 0.7152; //0.59
    const newBlue = blueValue * 0.0722; //0.11

    const grayscaleValue = newRed + newGreen + newBlue;

    currentPixels[redIndex] =
        currentPixels[greenIndex] =
        currentPixels[blueIndex] =
            clamp(grayscaleValue);
};

const addThreshold = (x, y, value) => {
    const redIndex = getIndex(x, y) + R_OFFSET;
    const greenIndex = getIndex(x, y) + G_OFFSET;
    const blueIndex = getIndex(x, y) + B_OFFSET;

    const redValue = currentPixels[redIndex];
    const greenValue = currentPixels[greenIndex];
    const blueValue = currentPixels[blueIndex];

    const newRed = redValue * 0.2126;
    const newGreen = greenValue * 0.7152;
    const newBlue = blueValue * 0.0722;

    const thresholdValue = newRed + newGreen + newBlue >= value ? 255 : 0;

    currentPixels[redIndex] =
        currentPixels[greenIndex] =
        currentPixels[blueIndex] =
            clamp(thresholdValue);
};

const commitChange = () => {
    for (let i = 0; i < imgData.data.length; i++) {
        imgData.data[i] = currentPixels[i];
    }
    ctx.putImageData(imgData, 0, 0, 0, 0, imgSrc.width, imgSrc.height);
};

const resetChange = () => {
    for (let i = 0; i < imgData.data.length; i++) {
        imgData.data[i] = originalPixels[i];
    }
    red.value = 0;
    green.value = 0;
    blue.value = 0;
    brightness.value = 0;
    contrast.value = 0;
    grayscale.checked = false;
    threshold.value = 0;
    swirl.value = 0;
    ctx.putImageData(imgData, 0, 0, 0, 0, imgSrc.width, imgSrc.height);
};

//Check value thay đổi
red.onchange = runPipeline;
green.onchange = runPipeline;
blue.onchange = runPipeline;
brightness.onchange = runPipeline;
contrast.onchange = runPipeline;
grayscale.onchange = runPipeline;
threshold.onchange = runPipeline;
swirl.onchange = () => rotateImage(imgData, swirl.value);

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

                //Transform alpha to degree
                degree = (alpha * 180.0) / Math.PI;

                degree += (r * deg) / 1.5;
                alpha = (degree * Math.PI) / 180.0;
                newX = r * Math.cos(alpha);
                newY = r * Math.sin(alpha);

                x0 = Math.floor(newX);
                xf = x0 + 1;
                y0 = Math.floor(newY);
                yf = y0 + 1;
                deltaX = newX - x0;
                deltaY = newY - y0;

                pos0 = ((y0 + centerY) * width + x0 + centerX) * 4; //(x,y)
                pos1 = ((y0 + centerY) * width + xf + centerX) * 4; //(x+1,y)
                pos2 = ((yf + centerY) * width + x0 + centerX) * 4; //(x,y+1)
                pos3 = ((yf + centerY) * width + xf + centerX) * 4; //(x+1,y+1)

                for (k = 0; k < 4; k++) {
                    componentX0 =
                        (originalPixels[pos1 + k] - originalPixels[pos0 + k]) *
                            deltaX +
                        originalPixels[pos0 + k];
                    componentX1 =
                        (originalPixels[pos3 + k] - originalPixels[pos2 + k]) *
                            deltaX +
                        originalPixels[pos2 + k];
                    finalPixelComponent =
                        (componentX1 - componentX0) * deltaY + componentX0;
                    transformedPixels[destPosition + k] =
                        finalPixelComponent > 255
                            ? 255
                            : finalPixelComponent < 0
                            ? 0
                            : finalPixelComponent;
                }
            }
        }
    }

    ctx.putImageData(transformedImageData, 0, 0);
}

function runPipeline() {
    currentPixels = originalPixels.slice();

    //get change value
    const redFilter = Number(red.value);
    const greenFilter = Number(green.value);
    const blueFilter = Number(blue.value);
    const brightnessFilter = Number(brightness.value);
    const contrastFilter = Number(contrast.value);
    const thresholdFilter = Number(threshold.value);
    const grayscaleFilter = grayscale.checked;

    for (let i = 0; i < imgSrc.height; i++) {
        for (let j = 0; j < imgSrc.width; j++) {
            if (grayscaleFilter) {
                addGrayScale(j, i);
            } else if (thresholdFilter) {
                addThreshold(j, i, thresholdFilter);
                addBrightness(j, i, brightnessFilter);
                addContrast(j, i, contrastFilter);
                addRed(j, i, redFilter);
                addGreen(j, i, greenFilter);
                addBlue(j, i, blueFilter);
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
