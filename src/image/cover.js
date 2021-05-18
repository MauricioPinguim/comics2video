const path = require('path');
const sharp = require('sharp');
const Frame = require('../classes/Frame');
const Page = require('../classes/Page');
const params = require('../params');
const imageUtil = require('./imageProcessing');
const svg = require('./svg');
const message = require('../messages/message');

const coverTypes = { FrontCover: {}, BackCover: {} };

const generateCover = async (processData) => {
    const { file, filePart, page } = processData.getCurrentData();
    const coverTempLocation = file.tempFolders.root;
    const isFrontCover = (page.coverType === coverTypes.FrontCover);

    const coverImage = await sharp({
        create: {
            width: params.systemParams.screenWidth,
            height: params.systemParams.screenHeight,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
        }
    }).jpeg();

    const coverSvg = svg.getCover(page.title, page.subtitle, page.coverType === coverTypes.FrontCover);
    const compositeBuffer = svg.getSVGBuffer(coverSvg);

    const backgroundImage = await sharp(path.join(coverTempLocation, `_COVER_BG.jpg`));
    const backgroundImageBuffer = await backgroundImage.toBuffer();

    if (isFrontCover) {
        const thumbnailImage = await sharp(path.join(coverTempLocation, '_COVER_THUMB.png'));
        const thumbnailImageBuffer = await thumbnailImage.toBuffer();

        await coverImage.composite([
            { input: backgroundImageBuffer },
            { input: thumbnailImageBuffer },
            { input: compositeBuffer }
        ]);
    } else {
        await coverImage.composite([
            { input: backgroundImageBuffer },
            { input: compositeBuffer }
        ]);
    }

    const fileName = `${page.name}-${isFrontCover ? '0' : '9'}`;
    const coverImageBufferBeforSave = await coverImage.toBuffer();
    const destinationFile = path.join(filePart.imageDestinationFolder, fileName + '.jpg')
    await imageUtil.saveImage(coverImage, destinationFile);

    const frame = new Frame();
    frame.name = fileName;
    frame.coverType = page.coverType;
    frame.transition = (isFrontCover) ? '' : 'wipeleft';
    page.frames.push(frame);
    page.selectNextFrame();

    await imageUtil.generateCountDown(processData, coverImageBufferBeforSave);
    processData.increasePercentImage(filePart.imagePageProgressIncrement);
}

const generateCoverThumbnail = async (destinationFolder, pageSource) => {
    const pageImage = await sharp(pageSource);
    const { width, height } = await pageImage.metadata();
    const thumbnailImage = await sharp({
        create: {
            width: params.systemParams.screenWidth,
            height: params.systemParams.screenHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    });

    const thumbnailAreaHeight = params.systemParams.screenHeight * .9;
    const thumbnailMargin = thumbnailAreaHeight * .05;
    const thumbnailHeight = thumbnailAreaHeight - thumbnailMargin * 2;
    const rate = thumbnailHeight / height;
    const resizedWidth = width * rate;
    const thumbnailLeft = params.systemParams.screenCenterX - resizedWidth / 2;
    const pageImageBuffer = await pageImage.resize({ height: Math.floor(thumbnailHeight) }).toBuffer();

    await thumbnailImage.composite([{
        input: pageImageBuffer,
        top: Math.floor(thumbnailMargin),
        left: Math.floor(thumbnailLeft)
    }]);
    await thumbnailImage.png().toFile(path.join(destinationFolder, '_COVER_THUMB.png'));
}

const generateCoverBackground = async (destinationFolder, pageSource) => {
    const image = await sharp(pageSource);
    const { width, height } = await image.metadata();

    const screenWidth = params.systemParams.screenWidth;
    const screenHeight = params.systemParams.screenHeight;
    const resizedHeight = height * (screenWidth / width);
    const resizedWidth = width * (screenHeight / height);

    let top, left;
    if (resizedHeight >= screenHeight) {
        await image.resize({ width: screenWidth });
        top = (resizedHeight - screenHeight) / 2;
        left = 0;
    } else {
        await image.resize({ height: screenHeight });
        top = 0;
        left = (resizedWidth - screenWidth) / 2;
    }

    await image.extract({
        left: Math.floor(left),
        top: Math.floor(top),
        width: params.systemParams.screenWidth,
        height: params.systemParams.screenHeight
    })

    await image.modulate({ brightness: .4, saturation: .14 });
    await image.blur(13);

    await imageUtil.saveImage(image, path.join(destinationFolder, '_COVER_BG.jpg'));
}

const prepareCoverImages = async (processData) => {
    const { file } = processData.getCurrentData();
    const firstPage = file.sourcePages[0];

    processData.progress({
        status: message('processing_cover'),
        statusType: 'image'
    });

    await generateCoverBackground(file.tempFolders.root, firstPage.source);
    await generateCoverThumbnail(file.tempFolders.root, firstPage.source);
}

const newCoverPage = ({ number, name, title, subtitle, coverType }) => {
    const coverPage = new Page();

    coverPage.number = number;
    coverPage.name = name;
    coverPage.title = title;
    coverPage.subtitle = subtitle;
    coverPage.coverType = coverType;

    return coverPage;
}

const addCoverPages = (filePart) => {
    const firstPage = filePart.pages[0];
    const lastPage = filePart.pages[filePart.pages.length - 1];

    let coverSubtitle;
    if (filePart.isMultiPart) {
        coverSubtitle = `${filePart.partTitle} (${message('pages_from')} ${filePart.firstPage} ${message('pages_to')} ${filePart.lastPage})`;
    } else {
        let pageLabel;
        if (filePart.pages.length > 1) {
            pageLabel = message('pages');
        } else {
            pageLabel = message('page');
        }
        coverSubtitle = `${filePart.pages.length} ${pageLabel}`;
    }

    if (!params.systemParams.skipFrontCover) {
        filePart.pages.unshift(
            newCoverPage({
                number: firstPage.number,
                name: firstPage.number.toString().padStart(3, '0'),
                title: filePart.title,
                subtitle: coverSubtitle,
                coverType: coverTypes.FrontCover
            })
        );
    }

    filePart.pages.push(
        newCoverPage({
            number: lastPage.number,
            name: lastPage.number.toString().padStart(3, '0'),
            title: filePart.title,
            subtitle: filePart.isLastPart ? message('end_of_file') : message('end_of') + ' ' + filePart.partTitle,
            coverType: coverTypes.BackCover
        })
    );
}

module.exports = {
    coverTypes,
    prepareCoverImages,
    generateCover,
    addCoverPages
}