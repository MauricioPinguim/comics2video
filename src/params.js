const width = 1920;
const height = 1080;
const doublePageWidthRatio = 1 / 10 * 19;

const contentProfiles = {
    simpleContent: {
        name: 'simple',
        defaultDuration: 20,
        ocrTextLengthMin: 0,
        ocrTextLengthMinDuration: 9,
        ocrTextLengthMax: 300,
        ocrTextLengthMaxDuration: 23
    },
    complexContent: {
        name: 'complex',
        defaultDuration: 30,
        ocrTextLengthMin: 0,
        ocrTextLengthMinDuration: 10,
        ocrTextLengthMax: 600,
        ocrTextLengthMaxDuration: 50
    }
}

const readingSpeeds = {
    slow: {
        name: 'slow',
        durationMultiplier: 1.5,
        countdownStart: 7
    },
    normal: {
        name: 'normal',
        durationMultiplier: 1,
        countdownStart: 5
    },
    fast: {
        name: 'fast',
        durationMultiplier: 0.5,
        countdownStart: 3
    }
}

const coverPageProcessing = {
    thumbnailPage: {
        name: 'thumbnailPage',
    },
    normalPage: {
        name: 'normalPage',
    },
    thumbnailAndNormalPage: {
        name: 'thumbnailAndNormalPage',
    }
}

const systemParams = {
    screenWidth: width,
    screenHeight: height,
    screenCenterX: Math.floor(width / 2),
    screenCenterY: Math.floor(height / 2),
    screenDoublePageWidth: Math.ceil(width * doublePageWidthRatio),
    screenDoublePageFirstHalf: Math.ceil(width * doublePageWidthRatio) - width,
    ocrResizeRatio: .65,
    coverDuration: 10,
    pagesPerFilePart: 30,
    jpegOutputQuality: 50,
    jpegOCROutputQuality: 80,
    videoFrameRate: 8,
    videoQualityMBPS: .5,
    defaultMessageLanguage: 'en',
    keepTempFolder: false,
    disableTerminalElaborate: false
}

const userParams = {
    generateVideo: true,
    contentProfile: contentProfiles.complexContent,
    readingSpeed: readingSpeeds.normal,
    coverPageProcessing: coverPageProcessing.thumbnailPage,
    messageLanguage: 'en'
}

const setGenerateVideo = (generateVideo) => {
    if (typeof generateVideo === 'boolean') {
        userParams.generateVideo = generateVideo;
    } else if (typeof generateVideo === 'string') {
        const value = generateVideo.trim().toLowerCase();
        if (value === 'false') {
            userParams.generateVideo = false;
        } else if (value === 'true') {
            userParams.generateVideo = true;
        }
    }
}

const setContentProfile = (contentProfile) => {
    for (const profile of Object.values(contentProfiles)) {
        if (contentProfile === profile) {
            userParams.contentProfile = profile;
            return;
        }
        if (typeof contentProfile === 'string') {
            if (contentProfile.trim().toLowerCase() === profile.name) {
                userParams.contentProfile = profile;
                return;
            }
        }
    }
}

const setReadingSpeed = (readingSpeed) => {
    for (const speed of Object.values(readingSpeeds)) {
        if (readingSpeed === speed) {
            userParams.readingSpeed = speed;
            return;
        }
        if (typeof readingSpeed === 'string') {
            if (readingSpeed.trim().toLowerCase() === speed.name) {
                userParams.readingSpeed = speed;
                return;
            }
        }
    }
}

const setCoverPageProcessing = (coverPageProcessingValue) => {
    for (const option of Object.values(coverPageProcessing)) {
        if (coverPageProcessingValue === option) {
            userParams.coverPageProcessing = option;
            return;
        }
        if (typeof coverPageProcessingValue === 'string') {
            if (coverPageProcessingValue.trim().toLowerCase() === option.name) {
                userParams.coverPageProcessing = option;
                return;
            }
        }
    }
}

const setMessageLanguage = (messageLanguage) => {
    if (messageLanguage) {
        userParams.messageLanguage = messageLanguage.trim();
    }
}

const setParamValues = (paramValues) => {
    if (!paramValues) {
        return;
    }

    setGenerateVideo(paramValues.generateVideo);
    setContentProfile(paramValues.contentProfile);
    setReadingSpeed(paramValues.readingSpeed);
    setMessageLanguage(paramValues.messageLanguage);
    setCoverPageProcessing(paramValues.coverPageProcessing)
}

module.exports = {
    contentProfiles,
    readingSpeeds,
    coverPageProcessing,
    userParams,
    systemParams,
    setParamValues
}