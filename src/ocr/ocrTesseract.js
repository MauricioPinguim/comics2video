const { createWorker } = require('tesseract.js');
const { log, logTypes } = require('../util/log');
const params = require('../params');

const whitelistLower = 'abcdefghijklmnopqrstuvwxyz';
const whitelistUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const whitelist = whitelistLower + whitelistUpper;

let worker;

const initializeOCR = async () => {
    if (!params.userParams.ocrEnabled) {
        return;
    }

    // The file 'eng.traineddata.gz' in ocr folder is an english language data focused on speed instead of accuracy
    // Keep that file, or else Tesseract.js will download a default language data, bigger and slower
    // There is no need to use other language files, the goal here is only to count the number of letters in each frame/page
    // We don´t need to know what the characters said in the Comics story, only how many letters there were in the speech balloons, even if they are the wrong letters
    worker = createWorker({ langPath: __dirname });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    await worker.setParameters({
        tessedit_char_whitelist: whitelist,
        tessedit_ocr_engine_mode: 'OEM_TESSERACT_ONLY',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0'
    });
}

const tryTerminateOCR = async () => {
    try {
        if (!params.userParams.ocrEnabled) {
            return;
        }
        await worker.terminate();
    } catch { }
}

const isValidWord = (word) => {
    if (!word) {
        return false;
    }

    // OCR result contains false readings, usually short words (mainly in lower case letters) from random things (not real text)
    // Each word will be validated to remove them from the final result

    let lowerCount = 0;
    let upperCount = 0;

    for (let character of word) {
        lowerCount += whitelistLower.includes(character) ? 1 : 0;
        upperCount += whitelistUpper.includes(character) ? 1 : 0;
    }

    if (upperCount >= 3) {
        // With 3 or more upper case letters, chances are that it is real text
        return true;
    } else if (lowerCount >= 4) {
        // Even being lowercase, false readings usually don't have 4 letters or more
        return true;
    } else if (upperCount >= 2 && lowerCount >= 3) {
        // A combination of upper and lower case, probably not a false reading
        return true;
    }
    // Most like to be a false reading, the entire word will be discarded
    return false;
};

const filterResult = (ocrResult) => {
    if (!ocrResult || !ocrResult.data || !ocrResult.data.text) {
        return '';
    }

    const textResult = ocrResult.data.text
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .split(' ')
        .filter((word) => {
            return isValidWord(word);
        })
        .join('');

    return textResult;
}

const getValidTextLength = async (file) => {
    try {
        const ocrResult = await worker.recognize(file);
        const filteredResult = filterResult(ocrResult);

        return filteredResult.length;
    } catch {
        log(`Unable to process OCR on file '${file}' : ${error}`, 5, logTypes.Error);
        return -1;
    }
}

module.exports = {
    initializeOCR,
    getValidTextLength,
    tryTerminateOCR
}