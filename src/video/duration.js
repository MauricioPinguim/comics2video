const params = require("../params");
const ocrTesseract = require('../ocr/ocrTesseract');

const getDurationDefinition = () => {
    const durationDefinition = {
        ...params.userParams.contentProfile,
    }

    const multiplier = params.userParams.readingSpeed.durationMultiplier;
    const countdownStart = params.userParams.readingSpeed.countdownStart;

    durationDefinition.defaultDuration = Math.round(durationDefinition.defaultDuration * multiplier);
    durationDefinition.ocrTextLengthMinDuration = Math.round(durationDefinition.ocrTextLengthMinDuration * multiplier);
    durationDefinition.ocrTextLengthMaxDuration = Math.round(durationDefinition.ocrTextLengthMaxDuration * multiplier);

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

    const validTextLength = await ocrTesseract.getValidTextLength(frame.ocrImage);
    if (validTextLength != -1) {
        return frame.duration = calculateDuration(validTextLength, durationDefinition) - durationDefinition.countdownStart;
    }

    frame.duration = durationDefinition.defaultDuration - durationDefinition.countdownStart;
}

module.exports = {
    getDurationDefinition,
    calculateDuration,
    setFrameDuration
}