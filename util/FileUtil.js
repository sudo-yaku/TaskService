var fs = require('fs');

var fileUtil =  function(){
	logger.info(' Initializing the file util');
};

fileUtil.prototype.readFile = function(filePath, encoding, callback){
	
	fs.readFile(filePath,encoding,callback);
	
};


module.exports = new fileUtil();

