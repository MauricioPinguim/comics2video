const message = require('../messages/message');
const params = require('../params');

const getSVGBuffer = (svg) => {
    return Buffer.from(`<svg width="${params.systemParams.screenWidth}" height="${params.systemParams.screenHeight}">${svg}</svg>`);
};

const getCover = (title, subTitle, isFrontCover) => {
    const topWithMargin = params.systemParams.screenHeight * (isFrontCover ? .9 : 0);
    const topLine1 = topWithMargin + Math.floor((params.systemParams.screenHeight - topWithMargin) * (isFrontCover ? .2 : .46));
    const topLine2 = topWithMargin + Math.floor((params.systemParams.screenHeight - topWithMargin) * (isFrontCover ? .66 : .54));

    return `
        <text fill="#FFFFFF77" x="10" y="${params.systemParams.screenHeight - 15}"  font-family="Arial" font-size="23" text-anchor="start" xml:space="preserve">${message('generated_with')} comics2video</text>
        <text fill="#FFFFFF" x="${params.systemParams.screenCenterX}" y="${topLine1}" font-family="Arial" font-size="40" dominant-baseline="middle" text-anchor="middle" xml:space="preserve">${title}</text>
        <text fill="#FFFFFF" x="${params.systemParams.screenCenterX}" y="${topLine2}" font-family="Arial" font-size="30" dominant-baseline="middle" text-anchor="middle" xml:space="preserve">${subTitle}</text>
        `;
};

const getLine = (frame) => {
    let lines = '';

    if (frame.firstLineTop != params.systemParams.screenHeight) {
        lines += `<line stroke="#888888CC" x1="0" y1="${frame.firstLineTop - 0}" x2="${frame.secondLineLeft - 0}" y2="${frame.firstLineTop - 0}" stroke-width="2" fill="none"/>`
    }
    if (frame.secondLineLeft != params.systemParams.screenWidth) {
        lines += `<line stroke="#888888CC" x1="${frame.secondLineLeft - 0}" y1="0" x2="${frame.secondLineLeft - 0}" y2="${frame.firstLineTop - 0}" stroke-width="2" fill="none"/>`
    }

    return lines;
};

const getTitle = (title) => {
    return `<text fill="#FFFFFF" stroke="#000000" stroke-width="2" font-weight="bold" x="5" y="-5" font-size="51" font-family="Arial" text-anchor="start" dy="1em" xml:space="preserve">${title}</text>`;
};

const getCountdownText = (count) => {
    return `<text fill="#FFFFFF" stroke="#000000" stroke-width="3" font-weight="bold" x="${params.systemParams.screenWidth - 5}" y="${params.systemParams.screenHeight - 15}" font-family="Arial" font-size="190" text-anchor="end" xml:space="preserve">${count}</text>`;
};

const getIconText = (iconText) => {
    return `<text fill="#FFFFFF" stroke="#000000" stroke-width="2" font-weight="bold" x="${params.systemParams.screenWidth - 6}" y="${params.systemParams.screenHeight - 12}" font-family="Arial" font-size="60" text-anchor="end" xml:space="preserve">${iconText}</text>`;
};

module.exports = {
    getSVGBuffer,
    getCover,
    getLine,
    getTitle,
    getCountdownText,
    getIconText
}