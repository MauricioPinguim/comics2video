const fs = require('fs');
const path = require('path');
const { log, logTypes } = require('../util/log');
const duration = require('./duration');
const ffmpeg = require('./ffmpeg');

const processFrameVideoCountDown = async (processData) => {
    const { file, frame } = processData.getCurrentData();
    log(`Frame countdown`, 5);

    for (const name of frame.countdownImages) {
        await ffmpeg.generateStill(processData,
            file.tempFolders.imageCountdown,
            name,
            file.tempFolders.videoCountdown,
            1);
    }
}

const processFrameVideoTransition = async (processData) => {
    const { filePart, frame } = processData.getCurrentData();

    if (!frame.transition) {
        return;
    }

    log(`Frame transition`, 5);
    if (frame.transition === 'slideright+slideup') {
        // Two-step transition
        await ffmpeg.generatePageTransition(processData,
            filePart.lastFrameName,
            filePart.beforeLastFrameName,
            'slideright');
        frame.transition = 'slideup';
        filePart.lastFrameName = filePart.beforeLastFrameName;
    }

    await ffmpeg.generatePageTransition(processData,
        filePart.lastFrameName,
        frame.name,
        frame.transition);
}

const processFrameVideo = async (processData) => {
    const { file, filePart, page, frame } = processData.getCurrentData();
    log(`Video for Page ${page.number}, frame ${frame.name}`, 4);

    try {
        await processFrameVideoTransition(processData);

        await duration.setFrameDuration(processData);
        await ffmpeg.generateStill(processData,
            filePart.imageDestinationFolder,
            frame.name,
            file.tempFolders.videoFrames,
            frame.duration);

        await processFrameVideoCountDown(processData);

        filePart.beforeLastFrameName = filePart.lastFrameName;
        filePart.lastFrameName = frame.name;
    }
    catch (error) {
        console.log(`Unable to export frame ${frame.name} to video : ${error}`, 4);
    }
}

const processFinalVideo = async (processData) => {
    const { file, filePart } = processData.getCurrentData();

    if (filePart.videoSequence.length === 0) {
        return log('No valid video files to be joined', 4, logTypes.Error);
    }

    log(`Joining video files`, 4);
    const joinVideoFile = path.join(file.tempFolders.videoJoin, `video_sequence${filePart.number}.txt`);
    fs.writeFileSync(joinVideoFile, filePart.videoSequence.join('\n'));
    try {
        await ffmpeg.joinVideos(processData, joinVideoFile);
        filePart.videoOK = true;
    } catch (error) {
        return log(`Unable to join video files : ${error}`, 4, logTypes.Error);
    }
}

const process = async (processData) => {
    const { filePart } = processData.getCurrentData();

    try {
        log(`Generating video`, 3);
        filePart.deselectPage();

        while (filePart.selectNextPage()) {
            while (filePart.currentPage().selectNextFrame()) {
                await processFrameVideo(processData);
            }
        }

        await processFinalVideo(processData);

        if (filePart.videoOK) {
            log('Video generated successfully', 4);
        } else {
            log('Video not generated', 4, logTypes.Error);
        }
    } catch (error) {
        log(`Video generation failed. ${error}`, 2, logTypes.Error);
    }
}

module.exports = { process }