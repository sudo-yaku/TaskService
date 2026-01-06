
//New Relic Goes first
var os = require('os');
const hostname = os.hostname();

let newRelic;
if(hostname?.toLowerCase()?.indexOf('ioppa') > 0 || hostname?.toLowerCase()?.indexOf('iopsa') > 0 || hostname?.toLowerCase()?.indexOf('iopda') > 0)
{
    newRelic = require('newrelic');
}

// Initialize GLOBALS here
global.rootdir = __dirname; //ROOT level directory
const env_result = require('dotenv').config({path: '/usr/apps/iop/apps/config/.env' });
if(env_result.error){
    console.error("********* ERROR WHILE LOADING .env file at path /usr/apps/iop/apps/config/.env *********" +
    " \n THIS IS A REQUIRED FILE FOR UAT/SA1V AND PROD SERVERS ", env_result.error);
}
global.config = require('config');
global.logger =  require(rootdir+'/util/LogUtil');
global.fileUtil =  require(rootdir+'/util/FileUtil');
global.authUtil = require(rootdir + '/util/AuthUtil');
//Sentry config
const Sentry = require("@sentry/node");

if (config.sentryEnabledServers && config.sentryEnabledServers.split(',').indexOf(hostname) !== -1) {
    Sentry.init({
        dsn: config.sentryDSN,
        environment: "prod",
        release: "taskservice-"+new Date()
    });
    Sentry.setTag("server_name", hostname);
}
// Import required modules
//var express  = require('express');
var CoreLib = require('@iop/ms-corelib');
var app = CoreLib.CoreApp('taskservice', { logFilePath: config.log.filePath });
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var winston = require('winston');
var Client = require('node-rest-client').Client; 
var _= require('lodash');
var routes = require(rootdir+'/routes/Task');
//var app = express();

//necessary for REST API
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb',extended :  true}));
app.use(methodOverride('X-HTTP-Method-Override'));

//add CORS support
app.use(function(req,res,next){
	logger.debug(" Adding the CORS support inside the initializing funtion ");
	res.header('Access-Control-Allow-Origin','*');
	res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers','Content-Type, Authorization');
	next();
});

//Trigger manual GC every 3 hours - Apps running under PM2 issue
var runGC = function() {
    console.log ( "Enter - run GC  -- time -->" +  new Date().toString() );
    if (global.gc) {
        global.gc();
        console.log('After gc ');
    } else {
        console.log('Garbage collection unavailable.  use --expose-gc '
        + 'when launching node to enable forced garbage collection.');
    }
    console.log ( "Exit  - run GC  -- time -->" +  new Date().toString() );
}

let userListRefreshCount = 0;
function refreshUserList() {
    if (global.usersList === undefined || global.usersList === null || global.usersList?.length === 0) {
        authUtil.populateUsersInMap();
    } else {
        if (userListRefreshCount % 30 === 0) {
            userListRefreshCount = 0;
            authUtil.populateUsersInMap();
        }
    }
    userListRefreshCount = userListRefreshCount + 1;
}

var intVar = setInterval(runGC, config.app.gcInterval);
//Populate the users map  
authUtil.populateUsersInMap();   
var value = setInterval(refreshUserList, config.app.userRefreshInterval);
var router = app.use('/task',  routes);
logger.info(" Application started on port : " , config.app.port);
app.listen(config.app.port);

// Define healthcheck
router.get('/task/healthcheck', function(req, res, next) {
      //logger.info('Healthcheck');
    res.sendStatus(200);
});

// Define the landing page here 
router.get('/', function(req, res) {
	logger.info('Setting the landing url');
    res.json({ message: 'Welcome to Task Service API!' });   
});
