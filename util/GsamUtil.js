let fs = require('fs');
let GsamUtil = function () {
    logger.debug("Initializing Gsam util");
};
const gsamSensitiveDictionary = JSON.parse(fs.readFileSync(config?.gsamDetailsFilePath, 'utf8'));
GsamUtil.prototype.restrictData = function (data, field) {
    outerBlock: {
        for (let i = data?.length - 1; i >= 0; i--) {
            innerBlock: {
                for (let j = 0; j < field?.length; j++) {
                    if (gsamSensitiveDictionary?.some(substring => data[i][field[j]]?.toUpperCase()?.includes(substring))) {
                        data?.splice(i, 1);
                        break innerBlock;
                    }
                }
            }
        }
    }
    return data;
}

module.exports = new GsamUtil();