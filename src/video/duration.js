const dependencies = require('../util/dependencies');
const { log, logTypes } = require('../util/log');
const params = require("../params");

const getDurationDefinition = () => {
    const durationDefinition = {
        ...params.userParams.contentProfile,
    }

    const multiplier = params.userParams.readingSpeed.durationMultiplier;
    const countdownStart = params.userParams.readingSpeed.countdownStart;

    durationDefinition.defaultDuration = Math.round(durationDefinition.defaultDuration * multiplier);
    durationDefinition.ocrTextLengthMinDuration = durationDefinition.ocrTextLengthMinDuration * multiplier;
    durationDefinition.ocrTextLengthMaxDuration = durationDefinition.ocrTextLengthMaxDuration * multiplier;

    durationDefinition.countdownStart = (countdownStart < durationDefinition.ocrTextLengthMinDuration) ? countdownStart : durationDefinition.ocrTextLengthMinDuration;
    durationDefinition.coverDuration = (params.systemParams.coverDuration > durationDefinition.countdownStart) ? params.systemParams.coverDuration : durationDefinition.countdownStart;

    return durationDefinition;
}

const calculateDuration = (textLength, durationDefinition) => {
    if (textLength <= durationDefinition.ocrTextLengthMin) {
        return durationDefinition.ocrTextLengthMinDuration;
    } else if (textLength >= durationDefinition.ocrTextLengthMax) {
        return durationDefinition.ocrTextLengthMaxDuration;
    } else {
        const ocrTextLengthRange = durationDefinition.ocrTextLengthMax - durationDefinition.ocrTextLengthMin;
        const durationRange = durationDefinition.ocrTextLengthMaxDuration - durationDefinition.ocrTextLengthMinDuration;
        const ocrTextLengthRate = (textLength - durationDefinition.ocrTextLengthMin) / ocrTextLengthRange;
        const duration = (ocrTextLengthRate * durationRange) + durationDefinition.ocrTextLengthMinDuration;

        return Math.round(duration);
    }
}

const setFrameDuration = async (processData) => {
    const { frame } = processData.getCurrentData();
    const durationDefinition = processData.durationDefinition;

    if (frame.coverType) {
        return frame.duration = durationDefinition.coverDuration - durationDefinition.countdownStart;
    }

    if (params.userParams.ocrEnabled) {
        if (dependencies.availableFeatures.ocr) {
            log(`Calculating amount of text using OCR`, 5);
            const validTextLength = await require('../ocr/ocrTesseract').getValidTextLength(frame.ocrImage);
            if (validTextLength != -1) {
                return frame.duration = calculateDuration(validTextLength, durationDefinition) - durationDefinition.countdownStart;
            }
        }
    }

    frame.duration = durationDefinition.defaultDuration - durationDefinition.countdownStart;
}

module.exports = {
    getDurationDefinition,
    calculateDuration,
    setFrameDuration
}