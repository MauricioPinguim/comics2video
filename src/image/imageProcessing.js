const path = require('path');
const sharp = require('sharp');
const params = require('../params');
const svg = require('./svg');

const saveImage = async (sharpImage, destinationFile, isOCR) => {
    const quality = isOCR ? params.systemParams.jpegOCROutputQuality : params.systemParams.jpegOutputQuality;
    await sharpImage
        .jpeg({ quality: quality })
        .toFile(destinationFile);
}

const generateCountDown = async (processData, sourceImageBuffer, iconText = '') => {
    if (!params.userParams.generateVideo) {
        return;
    }

    const { file, frame } = processData.getCurrentData();

    for (let count = processData.durationDefinition.countdownStart; count >= 1; count--) {
        const image = await sharp(sourceImageBuffer);

        let compositeSvg = svg.getCountdownText(count);
        compositeSvg += svg.getIconText(iconText);
        const compositeBuffer = svg.getSVGBuffer(compositeSvg);
        await image.composite([{ input: compositeBuffer }]);

        const fileSuffix = `_COUNT${(processData.durationDefinition.countdownStart - count + 1).toString().padStart(2, '0')}`;
        const fileName = frame.name + fileSuffix;
        const destinationFile = path.join(file.tempFolders.imageCountdown, fileName + '.jpg');
        await saveImage(image, destinationFile);

        frame.countdownImages.push(fileName);
    }
}

const getSizeData = async (file) => {
    try {
        const image = sharp(file);
        const metadata = await image.metadata();

        if (metadata && metadata.width && metadata.height) {
            return {
                width: metadata.width,
                height: metadata.height
            }
        }
    } catch { }
}

module.exports = {
    getSizeData,
    generateCountDown,
    saveImage
}