const deltree = require("deltree");
const path = require('path');
const fs = require('fs');
const File = require('../classes/File');
const message = require('../messages/message');

const fileExtensions = {
    ZIP: ['.cbz', '.zip'],
    RAR: ['.cbr', '.rar']
}
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.png'];

const entryExists = (entry) => {
    try {
        return fs.existsSync(entry);
    }
    catch {
        return false
    }
}

const isFolder = (entry) => fs.lstatSync(entry).isDirectory();

const isFile = (entry) => {
    if (entryExists(entry) && fs.lstatSync(entry).isFile()) {
        // Ignore file '.gitkeep', added just to git keep track of folder comics_files
        return !entry.toLowerCase().includes('.gitkeep');
    }
}

const getFileExtension = (file) => path.extname(file).toLowerCase();

const getFileWithoutExtension = (file) => path.parse(file).name;

const getPath = (file) => path.dirname(file);

const getFile = (file) => path.basename(file);

const createFolder = (path) => fs.mkdirSync(path);

const isZIP = (file) => fileExtensions.ZIP.includes(getFileExtension(file));

const isRAR = (file) => fileExtensions.RAR.includes(getFileExtension(file));

const removeFolder = (path) => {
    try {
        deltree(path);
    } catch { }
}

const getDefaultInputFolder = () => path.join(__dirname, '../../comics_files');

const isImageExtensionValid = (file) => {
    const extension = getFileExtension(file);

    return imageExtensions.includes(extension);
}

const getImagesFiles = (sourceFolder) => {
    return fs.readdirSync(sourceFolder)
        .filter(file => isImageExtensionValid(file))
        .map(file => path.join(sourceFolder, file));
}

const isSourceExtensionValid = (processData, fileName) => {
    const extension = getFileExtension(fileName);

    if (isZIP(fileName) || isRAR(fileName)) {
        return true;
    }
}

const isSelectedFileValid = (fileName) => {
    const extension = getFileExtension(fileName);

    if (isZIP(fileName) || isRAR(fileName)) {
        return true;
    }
}

const isSelectedFolderValid = (folder) => {
    return fs.readdirSync(folder).some(file => isSelectedFileValid(file));
}

const findSourceFiles = (processData) => {
    try {
        const source = processData.source;
        if (!entryExists(source)) {
            return;
        }
        if (isFile(source)) {
            if (isSourceExtensionValid(processData, getFile(source))) {
                const newFile = new File(path.resolve(source));
                processData.files.push(newFile);
                newFile.sourceFileName = getFile(source);
            }
        } else {
            const files = fs.readdirSync(source)
                .map(file => path.join(source, file))
                .filter(file => isFile(file));

            if (files.length === 0) {
                return;
            }

            for (const fileName of files) {
                if (isSourceExtensionValid(processData, getFile(fileName))) {
                    const newFile = new File(path.resolve(fileName));
                    processData.files.push(newFile);
                    newFile.sourceFileName = getFile(fileName);
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

    if (process.platform === 'win32') {
        // Validate Windows max path size limit
        const pathMaxLengthSimulation = file.source.length + file.title.length + 30;
        if (pathMaxLengthSimulation > 260) {
            return false;
        }
    }

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

    return true;
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
        const folderBase = message('images_folder');

        if (file.isMultiPart) {
            folder = path.join(file.destinationFolder, `${folderBase} - ${filePart.partTitle}`);
        } else {
            folder = path.join(file.destinationFolder, folderBase);
        }
        createFolder(folder);

        return folder;
    } catch (error) {
        throw new Error(`Unable to create image destination folder in ${folder}`);
    }
}

const setCurrentWorkingDirectory = () => {
    try {
        const workingDirectory = path.join(__dirname, '../../');

        process.chdir(workingDirectory);
    } catch { }
}

module.exports = {
    isSelectedFolderValid,
    isSelectedFileValid,
    entryExists,
    getDefaultInputFolder,
    findSourceFiles,
    setFolderStructure,
    createFolderStructure,
    tryFindSubFolder,
    isZIP,
    isRAR,
    isFile,
    getImagesFiles,
    prepareImageDestinationFolder,
    removeFolder,
    setCurrentWorkingDirectory
};