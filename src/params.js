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

const systemParams = {
    screenWidth: width,
    screenHeight: height,
    screenCenterX: Math.floor(width / 2),
    screenCenterY: Math.floor(height / 2),
    screenDoublePageWidth: Math.ceil(width * doublePageWidthRatio),
    screenDoublePageFirstHalf: Math.ceil(width * doublePageWidthRatio) - width,
    ocrResizeRatio: .65,
    coverDuration: 10,
    pagesPerFilePart: 25,
    maximumPagesWithoutSplit: 30, // Modern comic books usually have a little more than 25 pages, so 30 is a more practical threshold to start the division
    jpegOutputQuality: 50,
    jpegOCROutputQuality: 80,
    videoFrameRate: 8,
    videoQualityMBPS: .5,
    keepTempFolder: false,
    disableTerminalElaborate: false
}

const userParams = {
    generateVideo: true,
    ocrEnabled: true,
    contentProfile: contentProfiles.complexContent,
    readingSpeed: readingSpeeds.normal
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

const setOcrEnabled = (ocrEnabled) => {
    if (typeof ocrEnabled === 'boolean') {
        userParams.ocrEnabled = ocrEnabled;
    } else if (typeof ocrEnabled === 'string') {
        const value = ocrEnabled.trim().toLowerCase();
        if (value === 'false') {
            userParams.ocrEnabled = false;
        } else if (value === 'true') {
            userParams.ocrEnabled = true;
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

const setParamValues = (paramValues) => {
    if (!paramValues) {
        return;
    }

    setGenerateVideo(paramValues.generateVideo);
    setOcrEnabled(paramValues.ocrEnabled);
    setContentProfile(paramValues.contentProfile);
    setReadingSpeed(paramValues.readingSpeed);
}

module.exports = {
    contentProfiles,
    readingSpeeds,
    systemParams,
    userParams,
    setParamValues,
}