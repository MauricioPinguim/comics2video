const fs = require('fs');
const path = require('path');
const duration = require('./duration');
const ffmpeg = require('./ffmpeg');

const processFrameVideoCountDown = async (processData) => {
    const { filePart, file, frame } = processData.getCurrentData();

    for (const name of frame.countdownImages) {
        await ffmpeg.generateStill(processData,
            file.tempFolders.imageCountdown,
            name,
            file.tempFolders.videoCountdown,
            1);
        processData.increasePercentVideo(filePart.videoFrameProgressIncrement);
    }
}

const processFrameVideoTransition = async (processData) => {
    const { filePart, frame } = processData.getCurrentData();

    if (!frame.transition) {
        return;
    }

    if (frame.transition === 'slideright+slideup') {
        // Two-step transition
        await ffmpeg.generatePageTransition(processData,
            filePart.lastFrameName,
            filePart.beforeLastFrameName,
            'slideright');
        frame.transition = 'slideup';
        filePart.lastFrameName = filePart.beforeLastFrameName;
    }

    if (filePart.lastFrameName) {
        await ffmpeg.generatePageTransition(processData,
            filePart.lastFrameName,
            frame.name,
            frame.transition);
    }
}

const processFrameVideo = async (processData) => {
    const { file, filePart, page, frame } = processData.getCurrentData();

    try {
        await processFrameVideoTransition(processData);

        await duration.setFrameDuration(processData);

        await ffmpeg.generateStill(processData,
            filePart.imageDestinationFolder,
            frame.name,
            file.tempFolders.videoFrames,
            frame.duration);

        processData.increasePercentVideo(filePart.videoFrameProgressIncrement);

        await processFrameVideoCountDown(processData);

        filePart.beforeLastFrameName = filePart.lastFrameName;
        filePart.lastFrameName = frame.name;
    }
    catch { }
}

const processFinalVideo = async (processData) => {
    const { file, filePart } = processData.getCurrentData();

    processData.progress({
        status: 'Finishing (This can take some minutes)',
        statusType: 'wait',
        percentVideo: 99.9
    });

    const joinVideoFile = path.join(file.tempFolders.videoJoin, `video_sequence${filePart.number}.txt`);
    fs.writeFileSync(joinVideoFile, filePart.videoSequence.join('\n'));
    
    try {
        await ffmpeg.joinVideos(processData, joinVideoFile);

        processData.progress({
            status: 'Video generated successfully',
            statusType: 'success',
            percentVideo: 100
        });
    } catch (error) {
        processData.progress({
            status: `Unable to create video file`,
            statusType: 'error',
            percentVideo: 0
        });
    }
}

const process = async (processData) => {
    const { filePart } = processData.getCurrentData();

    processData.progress({
        status: `Generating Video`,
        statusType: 'video',
        percentVideo: 0
    });

    filePart.videoFrameProgressIncrement = 1 / filePart.totalVideoFrames * 100;

    filePart.deselectPage();
    while (filePart.selectNextPage()) {
        while (filePart.currentPage().selectNextFrame()) {
            await processFrameVideo(processData);
        }
    }

    await processFinalVideo(processData);
}

module.exports = { process }