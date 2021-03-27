const fs = require('fs');
const path = require('path');
const duration = require('./duration');
const ffmpeg = require('./ffmpeg');

const processFrameVideoCountDown = async (processData) => {
    const { filePart, file, frame } = processData.getCurrentData();
    processData.progress({ action: `Countdown` });

    for (const name of frame.countdownImages) {
        await ffmpeg.generateStill(processData,
            file.tempFolders.imageCountdown,
            name,
            file.tempFolders.videoCountdown,
            1);
        processData.progressPercent += filePart.videoFrameProgressIncrement;
    }
}

const processFrameVideoTransition = async (processData) => {
    const { filePart, frame } = processData.getCurrentData();

    if (!frame.transition) {
        return;
    }

    processData.progress({ action: `Transition` });
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

    try {
        processData.progress({
            page: `Page ${page.number}`,
            frame: `Frame ${frame.name}`,
            action: 'Process Frame'
        });

        await processFrameVideoTransition(processData);

        await duration.setFrameDuration(processData);

        await ffmpeg.generateStill(processData,
            filePart.imageDestinationFolder,
            frame.name,
            file.tempFolders.videoFrames,
            frame.duration);

        processData.progressPercent += filePart.videoFrameProgressIncrement;

        await processFrameVideoCountDown(processData);

        filePart.beforeLastFrameName = filePart.lastFrameName;
        filePart.lastFrameName = frame.name;
    }
    catch { }
}

const processFinalVideo = async (processData) => {
    const { file, filePart } = processData.getCurrentData();

    if (filePart.videoSequence.length === 0) {
        return processData.error(`No valid video files to be joined for '${filePart.outputFile}'`);
    }
    processData.progressPercent = 99.9;
    const tmpFilePart = processData.progressData.filePart
    processData.progress({
        file: processData.progressData.file, // Force clear the remaining levels
        filePart: tmpFilePart,
        action: 'Writing video file (this can take several minutes)'
    });
    const joinVideoFile = path.join(file.tempFolders.videoJoin, `video_sequence${filePart.number}.txt`);
    fs.writeFileSync(joinVideoFile, filePart.videoSequence.join('\n'));
    try {
        await ffmpeg.joinVideos(processData, joinVideoFile);

        filePart.videoOK = true;
        processData.progressPercent = 100;
        processData.progress({
            action: 'Video generated'
        });
    } catch (error) {
        return processData.error(`Unable to join video files for '${filePart.outputFile}' : ${error}`);
    }
}

const process = async (processData) => {
    const { filePart } = processData.getCurrentData();

    try {
        processData.progressPercent = 0;
        processData.progress({
            element: `Video`,
            action: `Processing Pages`
        });
        filePart.deselectPage();

        filePart.videoFrameProgressIncrement = 1 / filePart.totalVideoFrames * 100;

        while (filePart.selectNextPage()) {
            while (filePart.currentPage().selectNextFrame()) {
                await processFrameVideo(processData);
            }
        }

        await processFinalVideo(processData);
    } catch (error) {
        processData.error(`Video '${filePart.outputFile}' generation failed. ${error}`);
    }
}

module.exports = { process }