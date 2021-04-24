const sharp = require('sharp');
const Frame = require('../classes/Frame');
const cover = require('../image/cover.js');
const params = require('../params');
const processFrame = require('./processFrame');

const getPageTransition = (frame) => {
    if (frame.halfNumber === 1) {
        if (frame.number === 1) {
            return "wipeleft";
        } else {
            // Two-step transition
            return "slideright+slideup";;
        }
    } else if (frame.halfNumber == 2) {
        return "slideleft";
    } else {
        if (frame.number === 1) {
            return "wipeleft";
        } else {
            return "slideup";
        }
    }
}

const getIconText = (frame, totalFrames) => {
    if (frame.halfNumber === 1) {
        return "►";
    } else if (frame.number === totalFrames) {
        return "■";
    } else {
        return "▼";
    }
}

const fillFrames = (page, halfNumber) => {
    const screenWidth = params.systemParams.screenWidth;
    const screenHeight = params.systemParams.screenHeight;
    const screenDoublePageFirstHalf = params.systemParams.screenDoublePageFirstHalf;
    const totalFrames = Math.ceil(page.resizedHeight / screenHeight);
    const halfSuffix = ['', '-A', '-B'];

    for (let frameNumber = totalFrames; frameNumber > 0; frameNumber--) {
        const frame = new Frame();
        if (frameNumber === totalFrames) {
            frame.top = page.resizedHeight - screenHeight;
            frame.firstLineTop = screenHeight;
            frame.secondLineLeft = (halfNumber === 1) ? screenDoublePageFirstHalf : screenWidth;
        } else if (frameNumber === 2) {
            frame.top = Math.floor(page.resizedHeight / 2 - screenHeight / 2);
            frame.firstLineTop = page.frames[page.frames.length - 1].top - frame.top;
            frame.secondLineLeft = (halfNumber === 1) ? screenDoublePageFirstHalf : screenWidth;
        } else {
            frame.top = 0;
            frame.firstLineTop = page.frames[page.frames.length - 1].top;
            frame.secondLineLeft = (halfNumber === 1) ? screenDoublePageFirstHalf : screenWidth;
        }
        frame.left = (halfNumber === 2) ? screenDoublePageFirstHalf : 0;
        frame.halfNumber = halfNumber;
        frame.number = frameNumber;
        frame.order = frameNumber * 10 + halfNumber;
        frame.name = `${page.name}-${frameNumber}${halfSuffix[halfNumber]}`;
        frame.transition = getPageTransition(frame);
        frame.iconText = getIconText(frame, totalFrames);

        page.frames.push(frame);
    }
}

const preparePage = async (processData) => {
    const { filePart, page } = processData.getCurrentData();
    const image = sharp(page.source);

    if (page.height > page.width) {
        page.resizedWidth = params.systemParams.screenWidth;
        page.resizedHeight = Math.floor(page.height * (params.systemParams.screenWidth / page.width));
        page.isSplitted = false;
    } else {
        // Double-page spread
        page.resizedWidth = params.systemParams.screenDoublePageWidth;
        page.resizedHeight = Math.floor(page.height * (params.systemParams.screenDoublePageWidth / page.width));
        page.isSplitted = true;
        page.title += '  A ► B';
    }
    await image.resize({
        width: page.resizedWidth,
        height: page.resizedHeight
    });
    page.resizedImageBuffer = await image.toBuffer();

    if (!page.isSplitted) {
        fillFrames(page, 0);
    } else {
        fillFrames(page, 1);
        fillFrames(page, 2);
    }

    page.frames.sort((a, b) => a.order - b.order);
    page.imageFrameProgressIncrement = filePart.imagePageProgressIncrement * (1 / page.frames.length);
}

const process = async (processData) => {
    const { page } = processData.getCurrentData();

    if (page.coverType) {
        await cover.generateCover(processData);
    } else {
        await preparePage(processData);

        while (page.selectNextFrame()) {
            await processFrame.process(processData);
        }
        page.resizedImageBuffer = null;
    }
}

module.exports = { process }