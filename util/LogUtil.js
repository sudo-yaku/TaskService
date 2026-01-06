// var winston = require('winston');                                                                                                          
// var expressWinston = require('express-winston');                                                                                           

// winston.transports.DailyRotateFile = require('winston-daily-rotate-file');

// // Logger initialized
// module.exports = new (winston.Logger)({
//     transports: [
//       new (winston.transports.Console)(),
//       new (winston.transports.DailyRotateFile)({
//                 filename: config.log.filePath,
//                 level : config.log.level,
//                 datePattern: '.yyyy-MM-dd', //Daily
//                 maxsize : 104857600 //100 MB   
//             }
//           )
//     ]
//   });
module.exports=require('@iop/ms-corelib').CoreLogger.initialize('taskservice', { logFilePath: config.log.filePath });