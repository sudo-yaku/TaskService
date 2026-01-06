var express = require('express');
var router = express.Router();
var controller = require(rootdir+'/controller/TaskController');

//router middleware to intercept every request 
router.use(function(req, res, next) {
    // log each request to the console
    logger.info("Request Method  : ", req.method, "  Request Params : " , req.params, " Request URL : ", req.url );
    var result = authUtil.isValidUser(req);
    // continue doing what we were doing and go to the route
    if(result.code == 0){
        var user = result.data;      
        next();        
    }else{
        var output = {};
        var resArray = []; 
        var err = new error("403","Unauthorized Access","User not authorized to access the resource");
        resArray.push(err);
        output.errors = resArray;
        return res.status(403).json(output)
    }    
});

router.get('/mgr/:mgrId', function(req, res, next) {
	logger.info("Manager id : " + req.params.mgrId);
	controller.getPmByMgr(req,res, next);
});	

router.get('/tech/:techId', function(req, res, next) {
	logger.info("Tech is : " + req.params.techId);
	controller.getPmByTech(req,res, next);
});	

router.get('/tech/:techId/pm', function(req, res, next) {
	logger.info("Tech is : " + req.params.techId);
	controller.getPmByTech(req,res, next);
});	

router.get('/mgr/:mgrId/summary', function(req, res, next) {
	logger.info("Manager id : " + req.params.mgrId);
	controller.getMgrSummary(req,res, next);
});	

router.get('/mgr/:mgrId/pm/summary', function(req, res, next) {
	logger.info("Manager id : " + req.params.mgrId);
	controller.getPmMgrSummary(req,res, next);
});	

router.get('/tech/:techId/summary', function(req, res, next) {
	logger.info("Tech id : " + req.params.techId);
	controller.getTechSummary(req,res, next);
});

router.get('/tech/:techId/pm/summary', function(req, res, next) {
	logger.info("Tech id : " + req.params.techId);
	controller.getTechPmSummary(req,res, next);
});

router.get('/user/:userId/counts/summary', function(req, res, next) {
        logger.info("User id : " + req.params.userId);
        controller.getTaskCountSummary(req,res, next);
});

router.get('/user/:userId/pm/counts/summary', function(req, res, next) {
        logger.info("User id : " + req.params.userId);
        controller.getPMCountSummary(req,res, next);
});

router.get('/czone/:czName/counts/summary', function(req, res, next) {
        logger.info("Czone is : " + req.params.czName);
        controller.getCzoneCountSummary(req,res, next);
});

router.get('/czone/:czName/pm/counts/summary', function(req, res, next) {
        logger.info("Czone is : " + req.params.czName);
        controller.getPMCzoneCountSummary(req,res, next);
});

router.get('/site/:siteunid/summary', function(req, res, next) {
        logger.info("Site unid : " + req.params.siteunid);
        controller.getSiteSummary(req,res, next);
});

router.get('/site/:siteunid/pm/summary', function(req, res, next) {
        logger.info("Site unid : " + req.params.siteunid);
        controller.getSitePmSummary(req,res, next);
});

//This will return PM's for a site (only header info)
router.get('/site/:siteUniId/pm', function(req, res, next) {
	logger.info("Site id is : " + req.params.siteUniId);
	controller.getPmBySite(req,res, next);
});	

//This will return the tasks associated with a PM
router.get('/pm/:pmHeaderId/tasks', function(req, res, next) {
	logger.info("PM header is : " + req.params.pmHeaderId);
	controller.getTasksByPm(req,res, next);
});	

// This will return the tasks for a site
router.get('/site/:siteUniId', function(req, res, next) {
	logger.info("Site id is : " + req.params.siteUniId);
	controller.getTasksBySite(req,res, next);
});	

// This will return the regular task details for a taskunid
router.get('/:taskUnid/details', function(req, res, next) {
        logger.info("Task Unid is : " + req.params.taskUnid);
        controller.getTasksByUnid(req,res, next);
});

//Updated the tasks 
router.put('/update', function(req, res, next) {
	logger.info("Updating the task ");
	controller.updateTask(req,res, next);
});	

//update PM tasks
router.put('/update/pmtasks', function(req, res, next) {
	logger.info("Updating the PM tasks ");
	controller.updatePmTasks(req,res, next);
});	

//update single PM task
router.put('/update/pmtask', function(req, res, next) {
	logger.info("Updating the PM task ");
	controller.updatePmTask(req,res, next);
});	

//update Switch PM tasks
router.put('/switch/update/pmtasks', function(req, res, next) {
	logger.info("Updating the Switch PM tasks ");
	controller.updateSwitchPmTasks(req,res, next);
});

//Get the tasks summary for manager grouped by sites
router.get('/mgr/:loginId/sitesummary', function(req, res, next) {
	logger.info("Login id is : " + req.params.loginId);
	controller.getMgrSummaryBySites(req,res, next);
});	

//Get the tasks summary for manager grouped by sites
router.get('/mgr/:loginId/pm/sitesummary', function(req, res, next) {
	logger.info("Login id is : " + req.params.loginId);
	controller.getMgrPmSummaryBySites(req,res, next);
});	

//Get the tasks summary for manager grouped by sites
router.get('/czone/:czname/summary', function(req, res, next) {
	logger.info("Callout zone  is : " + req.params.czname);
	controller.getTaskCalloutZoneSummary(req,res, next);
});	

//Get the tasks summary for manager grouped by sites
router.get('/czone/:czname/pm/summary', function(req, res, next) {
	logger.info("Callout zone  is : " + req.params.czname);
	controller.getPmCalloutZoneSummary(req,res, next);
});	

router.get('/users/memory', function(req, res, next) {
        logger.info("Getting all the users");
        controller.getAllUsers(req,res, next);
});

//This will return the tasks associated with a PM
router.get('/site/:siteUnid/pm/:pmHeaderId/geninfo', function(req, res, next) {
	logger.info("PM header is : " + req.params.pmHeaderId);
	controller.getGeneratorInfo(req,res, next);
});	

router.get('/pm/genreading/prepops', function(req, res, next) {
	logger.info("PM header is : " + req.params.pmHeaderId);
	controller.getGeneratorFuelLevel(req,res, next);
});	

router.put('/update/pm/genreading', function(req, res, next) {
	controller.updateGeneratorReadings(req,res, next);
});	

router.get('/switch/:switchUnid', function(req, res, next) {
	logger.info("Switch unid  is : " + req.params.switchUnid);
	controller.getTaskDetailsForSwitch(req,res, next);
});	

router.get('/switch/:switchUnid/directives', function(req, res, next) {
	logger.info("Switch unid is : " + req.params.switchUnid);
	if(config.directiveService.isEnabled){
		controller.getDirectivesForSwitch_new(req,res, next);
	} else {
		controller.getDirectivesForSwitch(req,res, next);
	}
});	

router.get('/user/:loginId/switchsummary', function(req, res, next) {
	logger.info("LoginId is : " + req.params.loginId);
	if(config.directiveService.isEnabled){
		controller.getDirectiveSwitchSummary_new(req,res, next);
	} else {
		controller.getDirectiveSwitchSummary(req,res, next);
	}
});	

router.get('/user/:loginId/pm/switchsummary', function(req, res, next) {
	logger.info("LoginId is : " + req.params.loginId);
	controller.getPMSwitchSummary(req,res, next);
});	

router.get('/switch/:switchUnid/pm', function(req, res, next) {
	logger.info("Switch unid is : " + req.params.switchUnid);
	controller.getPmBySwitch(req,res, next);
});	

router.put('/update/directives', function(req, res, next) {                                                                                 
	if(config.directiveService.isEnabled){
		controller.updateDirective_new(req,res, next);
	} else {
		controller.updateDirective(req,res, next);
	}                                                                                           
}); 

router.put('/bulkupdate/directives', function(req, res, next) {                                                                                 
	if(config.directiveService.isEnabled){
		controller.bulkUpdateDirectives_new(req,res, next);
	} else {
		controller.bulkUpdateDirectives(req,res, next);
	}                                                                                           
}); 

router.get('/wws/:unid/details', function(req, res, next) {                                                                                 
    controller.getWwsDetails(req,res, next);                                                                                             
}); 

router.get('/wws/user/:userid/sitesummary', function(req, res, next) {                                                                                 
    controller.getUserSiteSummmaryForWws(req,res, next);                                                                                             
});

router.get('/wws/user/:userid/sites', (req, res, next) => {
    controller.getUserWwsDashboard(req, res, next);
});

router.put('/wws/:unid/details', (req, res, next) => {
    controller.updateWwsDetails(req, res, next);
});

router.get('/user/:user_id/tasks', (req, res, next) => {
    controller.getTasksForUser(req, res, next);
});

router.get('/czone/:czname/tasks', (req, res, next) => {
    controller.getTasksForCalloutZone(req, res, next);
});

router.get('/switch/:switch_unid/tasks', (req, res, next) => {
    controller.getTasksForSwitch(req, res, next);
});


module.exports = router;
