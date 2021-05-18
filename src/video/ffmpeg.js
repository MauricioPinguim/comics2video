const path = require('path');
const spawn = require('spawn-please');
const params = require('../params');

const ffmpegFullPath = require('ffmpeg-static');

const generateStill = async (processData, sourceFolder, name, destinationFolder, duration) => {
    if (duration < .5) {
        duration = .5;
    }
    const { filePart } = processData.getCurrentData();
    const input = path.join(sourceFolder, name + '.jpg');
    const output = path.join(destinationFolder, name + '.mp4');

    const paramArray = ['-framerate', `${params.systemParams.videoFrameRate}`, '-loop', '1', '-i', input, '-c:v', 'libx264', '-t', duration, '-pix_fmt', 'yuv420p', '-y', output];
    await spawn(ffmpegFullPath, paramArray);

    filePart.videoSequence.push(`file '${path.resolve(output)}'`);
};

const generatePageTransition = async (processData, from, to, transition) => {
    const { file, filePart, frame } = processData.getCurrentData();

    const input1 = path.join(filePart.imageDestinationFolder, `${from}.jpg`);
    const input2 = path.join(filePart.imageDestinationFolder, `${to}.jpg`);
    const output1 = path.join(file.tempFolders.videoTransition, `${frame.name}_${transition}.mp4`);
    const output2 = path.join(file.tempFolders.videoTransition, `${frame.name}_${transition}_ok.mp4`);

    let paramArray = ['-loop', '1', '-t', '1', '-i', input1, '-loop', '1', '-t', '1', '-i', input2, '-filter_complex', `[0][1]xfade=transition=${transition}:duration=1:offset=0,format=yuv420p`, '-y', output1];
    await spawn(ffmpegFullPath, paramArray);

    // Convert to target framerate
    paramArray = ['-i', output1, '-filter:v', `fps=${params.systemParams.videoFrameRate}`, '-y', output2];
    await spawn(ffmpegFullPath, paramArray);

    filePart.videoSequence.push(`file '${path.resolve(output2)}'`);
};

const joinVideos = async (processData, joinFile) => {
    const { file, filePart } = processData.getCurrentData();
    const fileFirstStep = path.join(file.tempFolders.videoJoin, `${filePart.outputFile}_TMP.mp4`);
    const fileFinalStep = path.join(file.destinationFolder, `${filePart.outputFile}.mp4`);
    let output1, output2;

    // The first step joins the video parts. The second step adjusts the bitrate and adds a silent sound track to avoid a warning message in some video players
    // The second step will be skipped in macOS because Apple Quicktime doesn't open the file after that processing

    if (process.platform !== 'darwin') {
        output1 = fileFirstStep;
        output2 = fileFinalStep;
    } else {
        output1 = fileFinalStep;
    }

    let paramArray = ['-f', 'concat', '-safe', '0', '-i', joinFile, '-c', 'copy', '-y', output1];
    await spawn(ffmpegFullPath, paramArray);

    if (process.platform !== 'darwin') {
        // Convert to final video specs and disable audio track
        const videoQuality = `${params.systemParams.videoQualityMBPS}M`;
        paramArray = ['-f', 'lavfi', '-i', 'anullsrc', '-i', output1, '-c:v', 'copy', '-c:a', 'aac', '-map', '0:a', '-map', '1:v', '-shortest', '-b:v', videoQuality, '-maxrate', videoQuality, '-minrate', videoQuality, '-y', output2];
        await spawn(ffmpegFullPath, paramArray);
    }

    filePart.videoDestinationFile = path.resolve(fileFinalStep);
};

module.exports = {
    generateStill,
    generatePageTransition,
    joinVideos
}