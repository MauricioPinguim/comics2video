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
    const output1 = path.join(file.tempFolders.videoJoin, `${filePart.outputFile}_TMP.mp4`);
    const output2 = path.join(file.destinationFolder, `${filePart.outputFile}.mp4`);

    let paramArray = ['-f', 'concat', '-safe', '0', '-i', joinFile, '-c', 'copy', '-y', output1];
    await spawn(ffmpegFullPath, paramArray);

    // Convert to final video specs (same framerate) and remove audio track
    const videoQuality = `${params.systemParams.videoQualityMBPS}M`;
    paramArray = ['-f', 'lavfi', '-i', 'anullsrc', '-i', output1, '-c:v', 'copy', '-c:a', 'aac', '-map', '0:a', '-map', '1:v', '-shortest', '-c:v', 'libx264', '-b:v', videoQuality, '-maxrate', videoQuality, '-minrate', videoQuality, '-y', output2];
    await spawn(ffmpegFullPath, paramArray);
};

module.exports = {
    generateStill,
    generatePageTransition,
    joinVideos
}