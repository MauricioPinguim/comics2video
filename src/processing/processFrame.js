const path = require('path');
const sharp = require('sharp');
const imageUtil = require('../image/imageProcessing');
const svg = require('../image/svg');
const params = require('../params');

const generateOCRImage = async (processData, frameImageBuffer) => {
    if (!params.userParams.generateVideo || !params.userParams.ocrEnabled) {
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
    try {
        processData.progress({
            frame: `Frame ${frame.name}`,
            action: `Cropping`
        });

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

        // Keep a version before save, the Sharp Object is modified after saving
        const frameImageBufferBeforeSave = await frameImageFinal.toBuffer();
        const destinationFile = path.join(filePart.imageDestinationFolder, frame.name + '.jpg');
        await imageUtil.saveImage(frameImageFinal, destinationFile);

        processData.progress({ action: 'OCR Image' });
        await generateOCRImage(processData, frameImageBuffer);

        processData.progress({ action: 'Countdown' });
        await imageUtil.generateCountDown(processData, frameImageBufferBeforeSave, frame.iconText);

        processData.progressPercent += page.imageFrameProgressIncrement;
        filePart.totalVideoFrames++;
    } catch (error) {
        processData.error(`Frame ${frame.name} process failed. ${error}`);
    }
}

module.exports = { process }