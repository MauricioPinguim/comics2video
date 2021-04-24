const path = require('path');
const sharp = require('sharp');
const imageUtil = require('../image/imageProcessing');
const svg = require('../image/svg');
const params = require('../params');

const generateOCRImage = async (processData, frameImageBuffer) => {
    if (!params.userParams.generateVideo) {
        return;
    }

    const { file, frame } = processData.getCurrentData();

    const ocrImage = await sharp(frameImageBuffer)
        .extract({
            left: 0,
            top: 0,
            width: frame.secondLineLeft,
            height: frame.firstLineTop
        });
    if (params.systemParams.ocrResizeRatio !== 1) {
        await ocrImage.resize({ width: Math.floor(frame.secondLineLeft * params.systemParams.ocrResizeRatio) });
    }
    await ocrImage.threshold();

    const ocrDestinationFile = path.join(file.tempFolders.ocr, `${frame.name}_OCR.jpg`);
    await imageUtil.saveImage(ocrImage, ocrDestinationFile, true);
    frame.ocrImage = ocrDestinationFile;
}

const getFrameImageFinal = async (frame, frameImageBuffer) => {
    const frameImageFinal = await sharp({
        create: {
            width: params.systemParams.screenWidth,
            height: params.systemParams.screenHeight,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
        }
    }).jpeg();

    const mainImage = await sharp(frameImageBuffer);
    await mainImage.extract({
        left: 0,
        top: 0,
        width: frame.secondLineLeft,
        height: frame.firstLineTop
    });
    const mainImageBuffer = await mainImage.toBuffer();

    const backgroundImage = await sharp(frameImageBuffer);
    await backgroundImage.modulate({
        brightness: 1.3,
        saturation: 0.25
    });
    const backgroundImageBuffer = await backgroundImage.toBuffer();

    await frameImageFinal.composite([
        { input: backgroundImageBuffer },
        { input: mainImageBuffer, gravity: 'northwest' }
    ]);

    return frameImageFinal;
}

const process = async (processData) => {
    const { filePart, page, frame } = processData.getCurrentData();

    const pageImage = sharp(page.resizedImageBuffer);
    const frameImageBuffer = await pageImage.extract({
        left: frame.left,
        top: frame.top,
        width: params.systemParams.screenWidth,
        height: params.systemParams.screenHeight
    }).toBuffer();
    const frameImage = sharp(frameImageBuffer);

    let compositeSvg = svg.getIconText(frame.iconText);
    if (frame.number === 1 && frame.halfNumber !== 2) {
        compositeSvg += svg.getTitle(page.title);
    }
    compositeSvg += svg.getLine(frame);
    const compositeBuffer = svg.getSVGBuffer(compositeSvg);
    await frameImage.composite([{ input: compositeBuffer }]);

    const frameImageFinal = await getFrameImageFinal(frame, await frameImage.toBuffer());

    // Keep a version before saving because the Sharp object will be corrupted after saving
    const frameImageBufferBeforeSave = await frameImageFinal.toBuffer();
    const destinationFile = path.join(filePart.imageDestinationFolder, frame.name + '.jpg');
    await imageUtil.saveImage(frameImageFinal, destinationFile);

    await generateOCRImage(processData, frameImageBuffer);

    await imageUtil.generateCountDown(processData, frameImageBufferBeforeSave, frame.iconText);

    processData.increasePercentImage(page.imageFrameProgressIncrement);
    filePart.totalVideoFrames++;
}

module.exports = { process }