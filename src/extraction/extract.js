const filedir = require('../util/filedir');
const extractZIP = require('./extractZIP'); 
const extractRAR = require('./extractRAR'); 

const extractFile = async (processData) => {
    const { file } = processData.getCurrentData();
    try {
        processData.progress({
            status: `Extracting file`,
            statusType: `folder`
        });

        if (filedir.isZIP(file.source)) {
            await extractZIP.extract(file);
        } else if (filedir.isRAR(file.source)) {
            await extractRAR.extract(file);
        }

        file.tempFolders.pages = filedir.tryFindSubFolder(file.tempFolders.pages);

        return true;
    } catch {
        return false;
    }
}

module.exports = { extractFile }