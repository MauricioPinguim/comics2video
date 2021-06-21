const filedir = require('../util/filedir');
const extractZIP = require('./extractZIP'); 
const extractRAR = require('./extractRAR'); 
const message = require('../messages/message');

const extractFile = async (processData) => {
    const { file } = processData.getCurrentData();
    try {
        processData.progress({
            status: message('extracting_file'),
            statusType: `folder`
        });

        if (filedir.isZIP(file.source)) {
            await extractZIP.extract(file);
        } else if (filedir.isRAR(file.source)) {
            await extractRAR.extract(file);
        } else {
            // require() cannot be at the beginning because PDF extraction will be installed only in Windows
            await require('./extractPDF').extract(file);
        }

        file.tempFolders.pages = filedir.tryFindSubFolder(file.tempFolders.pages);

        return true;
    } catch {
        return false;
    }
}

module.exports = { extractFile }