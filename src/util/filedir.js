const deltree = require("deltree");
const path = require('path');
const fs = require('fs');
const File = require('../classes/File')
const dependencies = require('./dependencies');
const { log, logTypes } = require('./log');

const fileExtensions = {
    ZIP: ['.cbz', '.zip'],
    RAR: ['.cbr', '.rar'],
    PDF: ['.pdf']
}
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.png'];

const entryExists = (entry) => fs.existsSync(entry);

const isFolder = (entry) => fs.lstatSync(entry).isDirectory();

const isFile = (entry) => fs.lstatSync(entry).isFile();

const getFileExtension = (file) => path.extname(file).toLowerCase();

const getFileWithoutExtension = (file) => path.parse(file).name;

const getPath = (file) => path.dirname(file);

const getFile = (file) => path.basename(file);

const createFolder = (path) => fs.mkdirSync(path);

const isZIP = (file) => fileExtensions.ZIP.includes(getFileExtension(file));

const isRAR = (file) => fileExtensions.RAR.includes(getFileExtension(file));

const isPDF = (file) => fileExtensions.PDF.includes(getFileExtension(file));

const removeFolder = (path) => {
    try {
        deltree(path);
    } catch (err) {
        throw new Error(`Unable to remove folder '${path}'`);
    }
}

const getDefaultInputFolder = () => {
    const folder = path.join(__dirname, '../../comics_files');

    if (!entryExists(folder) || !isFolder(folder)) {
        throw new Error(`Default input folder not found in '${folder}'`);
    }

    return folder;
}

const validateInputSource = (source) => {
    if (!entryExists(source)) {
        throw new Error(`Input file or folder '${source}' not found`);
    }
}

const isImageExtensionValid = (file) => {
    const extension = getFileExtension(file);
    if (!imageExtensions.includes(extension)) {
        log(`'${extension}' is not a supported extension for source pages. Page '${file}' ignored `, 2, logTypes.Warning);
        return false;
    }
    return true;
}

const getImagesFiles = (sourceFolder) => {
    return fs.readdirSync(sourceFolder)
        .filter(file => isImageExtensionValid(file))
        .map(file => path.join(sourceFolder, file));
}

const checkExtensionEnabled = (extension, file, extensionEnabled) => {
    if (extensionEnabled) {
        return true;
    }
    log(`Extraction of '${extension}' files are disabled due to missing dependencies. File '${file}' ignored `, 2, logTypes.Warning);
}

const isSourceExtensionValid = (file) => {
    const extension = getFileExtension(file);

    if (isZIP(file)) {
        return checkExtensionEnabled(extension, file, dependencies.availableFeatures.extractionFromZIP);
    }
    if (isRAR(file)) {
        return checkExtensionEnabled(extension, file, dependencies.availableFeatures.extractionFromRAR);
    }
    if (isPDF(file)) {
        return checkExtensionEnabled(extension, file, dependencies.availableFeatures.extractionFromPDF);
    }

    log(`'${extension}' is not a supported Comic Book file extension. File '${file}' ignored `, 2, logTypes.Warning);
}

const findSourceFiles = (processData) => {
    try {
        const source = processData.source;
        if (!entryExists(source)) {
            return log(`File or folder '${source}' not found`, 2, logTypes.Warning);
        }
        if (isFile(source)) {
            if (isSourceExtensionValid(source)) {
                return processData.files.push(new File(source));
            }
        } else {
            const files = fs.readdirSync(source)
                .map(file => path.join(source, file))
                .filter(file => isFile(file));

            if (files.length === 0) {
                return log(`No file was found in folder '${source}'`, 2, logTypes.Warning);
            }

            for (const file of files) {
                if (isSourceExtensionValid(file)) {
                    processData.files.push(new File(file));
                }
            }
        }
    } catch { }
}

const tryFindSubFolder = (folder) => {
    const entries = fs.readdirSync(folder);

    for (const entry of entries) {
        const subFolder = path.join(folder, entry);
        if (isFolder(subFolder)) {
            return path.join(folder, entry);
        }
    }
    return folder;
}

const replaceInvalidCharacters = (fileName) => {
    const invalidCharacters = '&?/\\|<>:*"';
    const replacement = '_';

    return fileName
        .split('')
        .map(character => invalidCharacters.includes(character) ? replacement : character)
        .join('')
        .trim();
}

const setFolderStructure = (file) => {
    const sourceFolder = getPath(file.source);
    const fileName = getFile(file.source);
    file.title = getFileWithoutExtension(fileName);
    file.formattedTitle = replaceInvalidCharacters(file.title);

    const destinationFolder = path.join(sourceFolder, file.formattedTitle);
    const tempFolder = path.join(destinationFolder, 'temp');

    file.destinationFolder = destinationFolder;
    file.tempFolders = {
        root: tempFolder,
        pages: path.join(tempFolder, 'img_pages'),
        ocr: path.join(tempFolder, 'img_ocr'),
        imageCountdown: path.join(tempFolder, 'img_countdown'),
        videoFrames: path.join(tempFolder, 'video_frames'),
        videoTransition: path.join(tempFolder, 'video_transitions'),
        videoCountdown: path.join(tempFolder, 'video_countdown'),
        videoJoin: path.join(tempFolder, 'video_join')
    }
}

const createFolderStructure = (file) => {
    try {
        if (entryExists(file.destinationFolder)) {
            return false;
        }
        createFolder(file.destinationFolder);

        const temp = file.tempFolders;
        createFolder(temp.root);
        file.tempFolderCreated = true;
        createFolder(temp.pages);
        createFolder(temp.ocr);
        createFolder(temp.imageCountdown);
        createFolder(temp.videoFrames);
        createFolder(temp.videoTransition);
        createFolder(temp.videoCountdown);
        createFolder(temp.videoJoin);

        return true;
    } catch (error) {
        throw new Error(`Unable to create folder structure`);
    }
}

const prepareImageDestinationFolder = (file, filePart) => {
    let folder;
    try {

        if (file.isMultiPart) {
            folder = path.join(file.destinationFolder, `Images - ${filePart.partTitle}`);
        } else {
            folder = path.join(file.destinationFolder, 'Images');
        }
        createFolder(folder);

        return folder;
    } catch (error) {
        throw new Error(`Unable to create image destination folder in ${folder}`);
    }
}

module.exports = {
    getDefaultInputFolder,
    validateInputSource,
    findSourceFiles,
    setFolderStructure,
    createFolderStructure,
    tryFindSubFolder,
    isZIP,
    isRAR,
    isPDF,
    getImagesFiles,
    prepareImageDestinationFolder,
    removeFolder
};