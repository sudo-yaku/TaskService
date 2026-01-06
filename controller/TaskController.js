var fileUtil = require(rootdir + '/util/FileUtil');
var model = require(rootdir+'/model/Task');
var headerModel = require(rootdir+'/model/TaskHeader');
var dirModel = require(rootdir+'/model/Directive');
var taskForm = require(rootdir+'/form/TaskForm');
var directiveForm = require(rootdir+'/form/DirectiveForm'); 
var pmTaskForm = require(rootdir+'/form/PmTaskForm');
var pmSingleTaskForm  = require(rootdir+'/form/PmSingleTaskForm');
var pmHeader  = require(rootdir+'/model/PmHeader');
var pmHeaderNew  = require(rootdir+'/model/PmHeaderNew');
var pmHeaderSwitch  = require(rootdir+'/model/PmHeaderSwitch');
var pmTask = require(rootdir+'/model/PmTask');
var pmTaskNew = require(rootdir+'/model/PmTaskNew');
var error = require(rootdir+'/model/Error');
var restClient =  require(rootdir+'/util/RestClient');
var _ = require('lodash');
var util = require('util');
let async = require('async');
const axios = require('axios');
var WwsInfo = require(rootdir + '/model/WwsSiteSummary');
var taskHelper = require(rootdir + '/controller/TaskHelper');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const { map } = require('lodash');
let gsamUtil = require(rootdir + '/util/GsamUtil');

const OT_HEADERS = {
    "Accept" : "application/json",
    "Content-Type" : "application/json",
    "Authorization" : config.app.authHeader
};

module.exports = {

	getPmByMgr : function(req, res, next) {
		logger.debug(" Getting preventive maintenance for a manager ");
		fileUtil.readFile(rootdir+'/model/test/mgrPmList.json','utf-8',function(err, data) {
			if (err) {
				fileUtil.readFile(rootdir+'/model/test/error.json','utf-8',function(err,data){
					res.status(404).json(JSON.parse(data));
				});
			} else {
				res.status(200).json(JSON.parse(data));
			}
		});
	},

	getPmBySite_task : function(req, res, next) {
		logger.debug(" Getting preventive maintenance tasks for a site ");
		var output = {};
		var siteId = req.params.siteUniId;
		var resArray = new Array();
		
		if(_.isEmpty(siteId) || siteId == 'undefined' || siteId == 'null'){
       		err = new error("400","Site id mandatory","Site id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		//-------------------------------Use new table to get the tasks data------------------------------
		var url = `${config.dbService.url}get`;

		var args = {
			headers: {
				"Accept" : "application/json",
				"Content-Type": "application/json"
			},
			data: {
				"data": {
				"queryParams": {"siteUnid" : siteId},
				"event": "getPMTasksBySiteUnid"
				}
			}
		};
	
		restClient.post(url, args, (data, response) => {
			
			if (data && data.result && data.result.length > 0){
				logger.debug("Fetching from db success with %s records", data.result.length ); 
				let PmMap = {};
				let numtasksdone =0;
				for(var i=0; i < data.result.length; i++){
					if(!PmMap[data.result[i].PM_UNID]){
						let current_header=new pmHeaderNew(data.result[i]);
						current_header.numtasks = 1;
						current_header.numtasksdone = data.result[i].STATUS === 'COMPLETED' ? 1:0;
						PmMap[data.result[i].PM_UNID] = current_header;
					}
					else{
						PmMap[data.result[i].PM_UNID].numtasks++
						if (data.result[i].STATUS === 'COMPLETED'){
							PmMap[data.result[i].PM_UNID].numtasksdone++
						}
					}				
				}
				
				let keys = Object.keys(PmMap);
				keys.forEach(pm =>{
					resArray.push(PmMap[pm])
				})

				output.pmlist = resArray;
				res.status(200).json(output);			
			}else{
				logger.debug(" No data found for the site : " + siteId);
				err = new error("500","Internal server error","Couldn't fetch the pm tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);			
			}
		});

		//------------------------------------------------------------------------------------------------				
		// var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		// var apiSize = (req.query.api_size) ? req.query.api_size : 500;
		// var orderBy = (req.query.api_orderby) ? req.query.api_orderby : "duedate" ;
		
		// var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmList_v2";
		// var showCompleted = (req.query.show_completed) ? req.query.show_completed : "true";
		
		// var url = config.opsTrackerService.url;
		
		
		// var args = {
		// 		parameters : {
		// 			api_recordtype : apiRecordType,
		// 			api_offset : apiOffset,
		// 			api_size  : apiSize,
		// 			api_orderby : orderBy,
		// 			siteid : siteId,
		// 			site_switch :  "site",  
		// 			show_completed :  showCompleted
		// 		},
		// 		headers : {
		// 			"Accept" : "application/json",
		// 			"Authorization" : authHeader,
		// 			"Content-Type": "application/json" 
		// 		}
		// };

		// restClient.post(url, args, function(data, response){
		// 	if(data && data.result){
		// 		logger.debug("Fetching from db success with %s records", data.result.length ); 
		// 		const PmMap = {};
		// 		for(var i=0; i < data.result.length; i++){
		// 			if(!PmMap[data.result[i].META_UNIVERSALID]){
		// 				resArray.push(new pmHeader(data.result[i]));
		// 				PmMap[data.result[i].META_UNIVERSALID] = true;
		// 			}
					
		// 		}
		// 		output.pmlist = resArray;
		// 		res.status(200).json(output);
		// 	}else{
		// 		logger.debug(" No data found for the site : " + siteId);
		// 		err = new error("500","Internal server error","Couldn't fetch the pm tasks");
		// 		resArray.push(err);
		// 		output.errors = resArray;
		// 		res.status(500).json(output);
		// 	}
		// }, function(err){
		// 	logger.debug("Error is : " + err);
		// 	err = new error("500","Internal server error","Error occured while fetching tasks");
		// 	resArray.push(err);
		// 	output.errors = resArray;
		// 	res.status(500).json(output);
		// });
		//------------------------------------------------------------------------------------------------

	},
	getPmBySite : function(req, res, next) {
		logger.debug(" Getting preventive maintenance tasks for a site ");
		var output = {};
		var siteId = req.params.siteUniId;
		var resArray = new Array();
		
		if(_.isEmpty(siteId) || siteId == 'undefined' || siteId == 'null'){
       		err = new error("400","Site id mandatory","Site id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		
		// var authHeader = req.headers.authorization;
		// authHeader = config.app.authHeader; 
				
		// var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		// var apiSize = (req.query.api_size) ? req.query.api_size : 500;
		// var orderBy = (req.query.api_orderby) ? req.query.api_orderby : "duedate" ;
		
		// var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmList_v2";
		// var showCompleted = (req.query.show_completed) ? req.query.show_completed : "true";
		
		// var url = config.opsTrackerService.url;
		
		
		// var args = {
		// 		parameters : {
		// 			api_recordtype : apiRecordType,
		// 			api_offset : apiOffset,
		// 			api_size  : apiSize,
		// 			api_orderby : orderBy,
		// 			siteid : siteId,
		// 			site_switch :  "site",  
		// 			show_completed :  showCompleted
		// 		},
		// 		headers : {
		// 			"Accept" : "application/json",
		// 			"Authorization" : authHeader,
		// 			"Content-Type": "application/json" 
		// 		}
		// };

		var url = `${config.dbService.url}get`;

		var args = {
			headers: {
				"Accept" : "application/json",
				"Content-Type": "application/json"
			},
			data: {
				"data": {
				"queryParams": {"siteUnid" : siteId},
				"event": "getPMTasksBySiteUnid"
				}
			}
		}

		restClient.post(url, args, function(data, response){
				   if(data && data.result){
				       logger.debug("Fetching from db success with %s records", data.result.length ); 
					   const PmMap = {};
                        for(var i=0; i < data.result.length; i++){
							if(!PmMap[data.result[i].META_UNIVERSALID]){
								resArray.push(new pmHeader(data.result[i]));
								PmMap[data.result[i].META_UNIVERSALID] = true;
							}
                            
                        }
                        output.pmlist = resArray;
                        res.status(200).json(output);
				   }else{
					   logger.debug(" No data found for the site : " + siteId);
					   err = new error("500","Internal server error","Couldn't fetch the pm tasks");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching tasks");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })

	},
	getTasksByPm_task: function(req, res, next) {
		
		logger.debug(" Getting tasks for a given PM with header : ", req.params.pmHeaderId);
		
		var pmHeaderId = req.params.pmHeaderId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(pmHeaderId) || pmHeaderId == 'undefined' || pmHeaderId == 'null'){
       		err = new error("400","PM header id is mandatory","PM header id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		//-------------------------------Use new table to get the tasks data------------------------------
		const pm_tasks=[];
		async.series([
			(callback)=>{
				
				let url = config.dbService.url + "get";
				let args = {
					headers: {'Content-Type': 'application/json'},
					data: {
						"data": {
							"queryParams": {pm_unid : pmHeaderId},
							"event":"getPmdWidgetPmTasksByPmHeaderId"
						}
					}
				}
				restClient.post(url, args, (data, response) => {
					if (data && data.result && data.result.length > 0){
						for(let i=0; i < data.result.length; i++){
							let current_task =  new pmTaskNew(data.result[i]);
							pm_tasks.push(current_task);
						}
						callback();
					}else{
						callback();
					}
				});
			}
		], function (err) {
				if (err) {
					logger.debug(" No tasks found for PM ");
					err = new error("500","Internal server error","Tasks not found");
					resArray.push(err);
					output.errors = resArray;
					res.status(500).json(output);
				} else {
					if ( pm_tasks.length > 0){
						logger.debug("Get tasks by Pm_unid request success with %s records", pm_tasks.length ); 
						let numtasksdone=0;
						for(var i=0; i < pm_tasks.length; i++){
							let current_task =  pm_tasks[i];
							if(current_task.widget_status ==='COMPLETED')
							{
								numtasksdone ++;
							}
							resArray.push(current_task);					
						}				
						
						output.headerData = {};
						output.headerData.numtasks = pm_tasks.length;
						output.headerData.numtasksdone = numtasksdone;
						
						output.pmtasks = resArray;
						res.status(200).json(output);
					}else{
						logger.debug(" No tasks found for PM ");
						err = new error("500","Internal server error","Tasks not found");
						resArray.push(err);
						output.errors = resArray;
						res.status(500).json(output);
					}
				}
			});
		//------------------------------------------------------------------------------------------------
		// var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmTaskList_V2";		
		// var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		// var apiSize = (req.query.api_size) ? req.query.api_size : 500;
		// var hideCompleted = (req.query.hide_completed) ? req.query.hide_completed : 0;
		// var url = config.opsTrackerService.url;
		// var args = {
		// 		parameters : {
		// 			api_recordtype : apiRecordType,
		// 			api_offset : apiOffset,
		// 			api_size  : apiSize,
		// 			pmheaderunid : pmHeaderId,
		// 			hide_completed :  hideCompleted,
        //             format : "IOP"
		// 		},
		// 		headers : {
		// 			"Accept" : "application/json",
		// 			"Authorization" : authHeader,
		// 			"Content-Type": "application/json" 
		// 		}
		// };

		// restClient.get(url, args, function(data, response){
        //     if(data && data.data && data.data.listitems){
               // logger.debug("Data in controller is :  " , data );
        //        logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
        //         for(var i=0; i < data.data.listitems.length; i++){
        //             resArray.push(new pmTask(data.data.listitems[i]));
        //         }
        //         if(data.headerData){
        //             output.headerData = {};
        //             output.headerData.numtasks = data.headerData.numtasks;
        //             output.headerData.numtasksdone = data.headerData.numtasksdone;
        //         }

		// 	output.pmtasks = resArray;
								
		// 	res.status(200).json(output);
        //     }else{
        //         logger.debug(" No tasks found for PM ");
        //         err = new error("500","Internal server error","Tasks not found");
        //         resArray.push(err);
        //         output.errors = resArray;
        //         res.status(500).json(output);
        //     }
		// 	   }, function(err){
		// 		   logger.debug("Error is : " + err);
		// 		   err = new error("500","Internal server error","Error occured while fetching tasks");
		// 		   resArray.push(err);
		// 		   output.errors = resArray;
		// 		   res.status(500).json(output);
		// });
		//------------------------------------------------------------------------------------------------
	},
	getTasksByPm : function(req, res, next) {

		let pmd_status="";
		let pmd_widget_id="";
		var resArray = new Array();
		var resArray1 = new Array();
		

		var pmHeaderId = req.params.pmHeaderId;
		var output = {};

		if(_.isEmpty(pmHeaderId) || pmHeaderId == 'undefined' || pmHeaderId == 'null'){
			err = new error("400","PM header id is mandatory","PM header id is mandatory");
			resArray.push(err);
 			output.errors = resArray;
 			return res.status(400).json(output);
			}   

	async.series([
		
		(callback) => {
			logger.debug(" Getting tasks for a given PM with header : ", req.params.pmHeaderId);
			var authHeader = req.headers.authorization;
			authHeader = config.app.authHeader; 
			var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmTaskList_V2";		
			var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
			var apiSize = (req.query.api_size) ? req.query.api_size : 500;
			var hideCompleted = (req.query.hide_completed) ? req.query.hide_completed : 0;
			 
			var url = config.opsTrackerService.url;
			var args = {
					parameters : {
						api_recordtype : apiRecordType,
						api_offset : apiOffset,
						api_size  : apiSize,
						pmheaderunid : pmHeaderId,
						hide_completed :  hideCompleted,
											format : "IOP"
					},
					headers : {
						"Accept" : "application/json",
						"Authorization" : authHeader,
						"Content-Type": "application/json" 
					}
			};
	
			restClient.get(url, args, function(data, response){
							if(data && data.data && data.data.listitems && response.statusCode == 200){
								 logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
									for(var i=0; i < data.data.listitems.length; i++){
									var data1 = 	data.data.listitems[i];
									let pm = 	new pmTask(data1);
									pm.widgetStatus = '';
									pm.widgetId = '';
									resArray.push(pm);
									}

									if(data.headerData){
											output.headerData = {};
											output.headerData.numtasks = data.headerData.numtasks;
											output.headerData.numtasksdone = data.headerData.numtasksdone;
									}
									callback();
							}else{
									logger.debug(" No tasks found for PM ");
									err = new error("500","Internal server error","Tasks not found");
									resArray.push(err);
									output.errors = resArray;
                  					callback(output);
							}
					 })
		},
      (callback) => {
				let uuids = [];
				for(let i = 0; i < resArray.length; i++){
					uuids.push("'"+resArray[i].task_unid+"'");
				}
				//uuids.push("'B9C8C5EF776D666E2F3BB3CAC5F4CA40'");
				var arr = resArray[0];
				let dbUrl = `${config.dbService.url}get`;
								let dbArgs = {
									headers: { 'Content-Type': 'application/json' },
									data: {
										"data": {
											"queryParams": {},
											"event": "CurrentDetails",
											"replace": {
												"##ref_id": uuids
											}
										}
									}
								}
					restClient.post(dbUrl, dbArgs, function(data, response) {
					if (data && data.result && data.result.length > 0) {	
						for(var i=0; i < data.result.length; i++){
							var start_status =  data.result[i].START_STATUS;
							var widgetId = data.result[i].PMD_WIDGET_ID;
							var ref_id = 	data.result[i].REF_ID;
							console.log(data.result[i].START_STATUS);
							console.log(data.result[i].PMD_WIDGET_ID);
							console.log(data.result[i].REF_ID);
							for(var j=0; j < resArray.length; j++){
								if(resArray[j].task_unid == ref_id){
									//if('B9C8C5EF776D666E2F3BB3CAC5F4CA40' == 'B9C8C5EF776D666E2F3BB3CAC5F4CA40'){
									resArray[j].widgetStatus = start_status;
									resArray[j].widgetId = widgetId;
								}
							}
						}
					}
					output.pmtasks = resArray;
					callback();
				}
			);
		}
	], function (err) {
      if (err) {
        return res.status(500).json(output);
      } else {
			res.status(200).json(output);
      }
    })
  },
    
  getTasksByPm1 : function(req, res, next) {
		
	logger.debug(" Getting tasks for a given PM with header : ", req.params.pmHeaderId);
	
	var pmHeaderId = req.params.pmHeaderId;
	var output = {};
	var resArray = new Array();
	
	if(_.isEmpty(pmHeaderId) || pmHeaderId == 'undefined' || pmHeaderId == 'null'){
		   err = new error("400","PM header id is mandatory","PM header id is mandatory");
		   resArray.push(err);
		output.errors = resArray;
		return res.status(400).json(output);
	   }    

	var authHeader = req.headers.authorization;
	authHeader = config.app.authHeader; 
	var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmTaskList_V2";		
	var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
	var apiSize = (req.query.api_size) ? req.query.api_size : 500;
	var hideCompleted = (req.query.hide_completed) ? req.query.hide_completed : 0;
	 
	var url = config.opsTrackerService.url;
	var args = {
			parameters : {
				api_recordtype : apiRecordType,
				api_offset : apiOffset,
				api_size  : apiSize,
				pmheaderunid : pmHeaderId,
				hide_completed :  hideCompleted,
				format : "IOP"
			},
			headers : {
				"Accept" : "application/json",
				"Authorization" : authHeader,
				"Content-Type": "application/json" 
			}
	};

	restClient.get(url, args, function(data, response){
		if(data && data.data && data.data.listitems){
		   logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
			for(var i=0; i < data.data.listitems.length; i++){
							var data1 = 	data.data.listitems[i];
							let dbUrl = `${config.dbService.url}get`;
							let dbArgs = {
								headers: { 'Content-Type': 'application/json' },
								data: {
									"data": {
										"queryParams": {
											"ref_id": 'B9C8C5EF776D666E2F3BB3CAC5F4CA40'
										},
										"event": "CurrentDetails"
									}
								}
							}
							restClient.post(dbUrl, dbArgs, function(data2, response1) {
								if (data2 && data2.result && data2.result.length > 0 && response1.statusCode == 200) {					
									let item = data2.result[0];
										data2.pmd_status=item.START_STATUS;
										data1.pmd_widget_id=item.PMD_WIDGET_ID;
										console.log("item.START_STATUS: "+  data2.pmd_status)
								}
							});	
							console.log("after: "+  new Date())
							let pm = 	new pmTask(data1);
							resArray.push(pm);
							}
			if(data.headerData){
				output.headerData = {};
				output.headerData.numtasks = data.headerData.numtasks;
				output.headerData.numtasksdone = data.headerData.numtasksdone;
			}
							output.pmtasks = resArray;
			res.status(200).json(output);
		}else{
			logger.debug(" No tasks found for PM ");
			err = new error("500","Internal server error","Tasks not found");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		}
		   }, function(err){
			   logger.debug("Error is : " + err);
			   err = new error("500","Internal server error","Error occured while fetching tasks");
			   resArray.push(err);
			   output.errors = resArray;
			   res.status(500).json(output);
		   })
},
	getPmByTech_task : function(req, res, next) {
		logger.debug(" Getting preventive maintenance tasks for a user ");
		var techId = req.params.techId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(techId) || techId == 'undefined' || techId == 'null'){
       		err = new error("400","Tech id is mandatory","Tech id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		//-------------------------------Use new table to get PM by tech------------------------------
		let url = config.dbService.url + "get";
		let args = {
			headers: {'Content-Type': 'application/json'},
			data: {
				"data": {
					"queryParams": {userId : techId},
					"event": "getPmdWidgetPmTasksByUserId"
				}
			}
		};

		restClient.post(url, args, (data, response) => {
			if (data && data.result && data.result.length > 0){
				logger.debug("Get PM by techId request success with %s records", data.result.length ); 
				for(var i=0; i < data.result.length; i++){
					resArray.push(new pmHeaderNew(data.result[i]));								
				}				
			
				output.pmlist = resArray;
				res.status(200).json(output);
			
			}else{
				logger.debug(" No data found for the user ");
				err = new error("500","Internal server error","Error occured while fetching the tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);				
			}
		});

		//------------------------------------------------------------------------------------------------
		// var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		// var apiSize = (req.query.api_size) ? req.query.api_size : 500;
		// var orderBy = (req.query.api_orderby) ? req.query.api_orderby : "duedate" ;

		// var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmList_v2";
		// var showCompleted = (req.query.show_completed) ? req.query.show_completed : "true";
		// var asOfDate = (req.query.show_completed) ? req.query.show_completed : "";
		
		// var url = config.opsTrackerService.url;
		// var args = {
		// 		parameters : {
		// 			api_recordtype : apiRecordType,
		// 			api_offset : apiOffset,
		// 			api_size  : apiSize,
		// 			api_orderby : orderBy,
		// 			userid : techId, 
		// 			site_switch :  "site",  
		// 			show_completed :  showCompleted
		// 		},
		// 		headers : {
		// 			"Accept" : "application/json",
		// 			"Authorization" : authHeader,
		// 			"Content-Type": "application/json" 
		// 		}
		// };

		// restClient.get(url, args, function(data, response){
		// 		   if(data && data.data && data.data.listitems){
		// 		      logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
        //                for(var i=0; i < data.data.listitems.length; i++){
        //                     resArray.push(new pmHeader(data.data.listitems[i]));
        //                }
        //                 output.pmlist = resArray;
        //                 res.status(200).json(output);
		// 		   }else{
		// 			   logger.debug(" No data found for the manager ");
		// 			   err = new error("500","Internal server error","Error occured while fetching the tasks");
		// 			   resArray.push(err);
		// 			   output.errors = resArray;
		// 			   res.status(500).json(output);
		// 		   }
		// 	   }, function(err){
		// 		   logger.debug("Error is : " + err);
		// 		   err = new error("500","Internal server error","Tasks not found");
		// 		   resArray.push(err);
		// 		   output.errors = resArray;
		// 		   res.status(500).json(output);
		// });-----------------------------------------------------------------------------------

	},
    getPmByTech : function(req, res, next) {
		logger.debug(" Getting preventive maintenance tasks for a tech ");
		
		var techId = req.params.techId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(techId) || techId == 'undefined' || techId == 'null'){
       		err = new error("400","Tech id is mandatory","Tech id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    
		   
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
				
		var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		var apiSize = (req.query.api_size) ? req.query.api_size : 500;
		var orderBy = (req.query.api_orderby) ? req.query.api_orderby : "duedate" ;

		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmList_v2";
		var showCompleted = (req.query.show_completed) ? req.query.show_completed : "true";
		var asOfDate = (req.query.show_completed) ? req.query.show_completed : "";
		
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					api_offset : apiOffset,
					api_size  : apiSize,
					api_orderby : orderBy,
					userid : techId, 
					site_switch :  "site",  
					show_completed :  showCompleted
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
				   if(data && data.data && data.data.listitems){
				      logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                       for(var i=0; i < data.data.listitems.length; i++){
                            resArray.push(new pmHeader(data.data.listitems[i]));
                       }
                        output.pmlist = resArray;
                        res.status(200).json(output);
				   }else{
					   logger.debug(" No data found for the manager ");
					   err = new error("500","Internal server error","Error occured while fetching the tasks");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Tasks not found");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })

	},

	getMgrSummary : function(req, res, next) {
      let mgrId = req.params.mgrId;
      let output = {};
      let resArray = new Array();

      if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
        let err = new error("400","Manager id is mandatory","Manager id is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }

      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;

      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK,DIRECTIVE";
      let type = "TASK";
      taskHelper.getMgrSummaryFromCache(mgrId,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatMgrSummaryResponse(cacheData,type, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getMgrSummaryFromOps(mgrId,type,authHeader,apiRecordType,duein,recordtype,totalsFor, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatMgrSummaryResponse(opsData,type, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });   
            } 
          });
        }
      });
    },

	getMgrSummary_old : function(req, res, next) {
		
		logger.debug(" Getting preventive maintenance summary for manager ");
		
		var mgrId = req.params.mgrId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
       		err = new error("400","Manager id is mandatory","Manager id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		
		var apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
		var duein = (req.query.duein)?req.query.duein:"EOY";
		var recordtype = (req.query.recordtype)?req.query.recordtype:"site";
		var totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK";

		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					day_span : duein,
					mgrid : mgrId,
					recordtype :  recordtype,
					totals_for : totalsFor
					
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
				   if(data && data.data && data.data.listitems){
				   	 logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
						var items = data.data.listitems;
						var taskcounts = new Array();
						for(var key in items){
							var value = items[key];
							var outerObj = {};
							var tasksArr = new Array();
							outerObj.techid = key;
							var tasks = value["TASK"];
							var t = new Array();
							for(var k1 in tasks){
								var innerObj = {};
								innerObj.duein = k1.toLowerCase();
								innerObj.task = {};
								innerObj.task.total = tasks[k1].totalTasks;
								innerObj.task.done = tasks[k1].totalTasksDone;
								innerObj.task.perc = tasks[k1].totalTasksPerc;
								tasksArr.push(innerObj);
							}
							logger.debug("Task Array : ",  tasksArr);
							outerObj.tasks = tasksArr;
							taskcounts.push(outerObj);
						}
						output.taskcounts = taskcounts;
					   res.status(200).json(output);
				   }else{
					   logger.debug(" No data found for the manager ");
					   err = new error("500","Internal server error","Error occured while fetching the tasks");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				    err = new error("500","Internal server error","Error occured while fetching the data");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })
	},

    getPmMgrSummary : function(req, res, next) {
      let mgrId = req.params.mgrId;
      let output = {};
      let resArray = new Array();

      if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
        let err = new error("400","Manager id is mandatory","Manager id is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }

      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;

      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";
      let type = "PM";
      taskHelper.getMgrSummaryFromCache(mgrId,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatMgrSummaryResponse(cacheData,type, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getMgrSummaryFromOps(mgrId,type,authHeader,apiRecordType,duein,recordtype,totalsFor, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatMgrSummaryResponse(opsData,type, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },

	getPmMgrSummary_old : function(req, res, next) {
		
		logger.debug(" Getting preventive maintenance summary for manager ");
		
		var mgrId = req.params.mgrId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
       		err = new error("400","Manager id is mandatory","Manager id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		
		var apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
		var duein = (req.query.duein)?req.query.duein:"EOY";
		var recordtype = (req.query.recordtype)?req.query.recordtype:"site";
		var totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";

		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					day_span : duein,
					mgrid : mgrId,
					recordtype :  recordtype,
					totals_for : totalsFor
					
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
				   if(data && data.data && data.data.listitems){
				   	  logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
						var items = data.data.listitems;
						var taskcounts = new Array();
						for(var key in items){
							var value = items[key];
							var outerObj = {};
							var tasksArr = new Array();
							outerObj.techid = key;
							var pmTasks = value["PM"];
							var t = new Array();
							for(var k1 in pmTasks){
								var innerObj = {};
								innerObj.duein = k1.toLowerCase();
								innerObj.pm = {};
								innerObj.pm.total = pmTasks[k1].totalTasks;
								innerObj.pm.done = pmTasks[k1].totalTasksDone;
								innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
								tasksArr.push(innerObj);
							}
							logger.debug("Task Array : ",  tasksArr);
							outerObj.tasks = tasksArr;
							taskcounts.push(outerObj);
						}
						output.taskcounts = taskcounts;
					   res.status(200).json(output);
				   }else{
					   logger.debug(" No data found for the manager ");
					   err = new error("500","Internal server error","Error occured while fetching the tasks");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				    err = new error("500","Internal server error","Error occured while fetching the data");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })
	},
	getTaskCountSummary : function(req, res, next) {
		var output = {};
        	var resArray = [];
        	var userId = req.params.userId;
        	if(_.isEmpty(userId) || userId == 'undefined' || userId == 'null'){
            		var err = new error("400","Bad Request","Required field user id cannot be null/undefined");
            		resArray.push(err);
            		output.errors = resArray;
            		return res.status(400).json(output);
        	}

        	if(usersList && usersList[userId.toUpperCase()]){
                	 var role = usersList[userId.toUpperCase()].role;
        	}
        	if(role == "TECHNICIAN" || role == "MANAGER" || role == "CELL_SWITCH_MANAGER"){
         		var taskServiceUrl = config.taskService.url + "mgr/"+userId+"/sitesummary?duein=eoy";
         		if(role == "TECHNICIAN"){
                		taskServiceUrl = config.taskService.url + "tech/"+userId+"/summary?duein=eoy";  
         		}		
        		var args = {
            			headers : {
                			"Accept" : "application/json",
                			"Content-Type" : "application/json"
            			}
        		}	
			restClient.get(taskServiceUrl, args, function(data, response){
                		var o = {};
                		var counts = {};
                		if(data && data.taskcounts && data.taskcounts.length > 0){
					var totalCount = 0;
					var doneCount = 0;
					for(var i = 0; i < data.taskcounts.length; i++){
						totalCount += data.taskcounts[i].tasks[0].task.total;
						doneCount += data.taskcounts[i].tasks[0].task.done; 
                                        }
					counts.total = totalCount;
					counts.done = doneCount;
					o.counts = counts;
                        		return res.json(o);

                		}else{
                        		counts.total = 0;
					counts.done = 0;
                        		o.counts = counts;
                        		return res.json(o);
                		}
         		}, function(err){
                        	logger.debug("Error is : " + err);
                        	err = new error("500","Internal Server Error","Error occured while fetching the data");
                        	resArray.push(err);
                        	output.errors = resArray;
                        	res.status(500).json(output);
                      	});
		}else{
                 	var err = new error("400","Bad Request","Unauthorized user");
                 	resArray.push(err);
                 	output.errors = resArray;
                 	return res.status(400).json(output);
        	}

	},
	getPMCountSummary : function(req, res, next) {
                var output = {};
                var resArray = [];
                var userId = req.params.userId;
                if(_.isEmpty(userId) || userId == 'undefined' || userId == 'null'){
                        var err = new error("400","Bad Request","Required field user id cannot be null/undefined");
                        resArray.push(err);
                        output.errors = resArray;
                        return res.status(400).json(output);
                }

                if(usersList && usersList[userId.toUpperCase()]){
                         var role = usersList[userId.toUpperCase()].role;
                }
                if(role == "TECHNICIAN" || role == "MANAGER" || role == "CELL_SWITCH_MANAGER"){
                        var taskServiceUrl = config.taskService.url + "mgr/"+userId+"/pm/summary?duein=eoy";
                        if(role == "TECHNICIAN"){
                                taskServiceUrl = config.taskService.url + "tech/"+userId+"/pm/summary?duein=eoy";
                        }
                        var args = {
                                headers : {
                                        "Accept" : "application/json",
                                        "Content-Type" : "application/json"
                                }
                        }
		restClient.get(taskServiceUrl, args, function(data, response){
                                var o = {};
                                var counts = {};
                                if(data && data.taskcounts && data.taskcounts.length > 0){
                                        var totalCount = 0;
                                        var doneCount = 0;
                                        for(var i = 0; i < data.taskcounts.length; i++){
                                                totalCount += data.taskcounts[i].tasks[0].pm.total;
                                                doneCount += data.taskcounts[i].tasks[0].pm.done;
                                        }
                                        counts.total = totalCount;
                                        counts.done = doneCount;
                                        o.counts = counts;
                                        return res.json(o);

                                }else{
                                        counts.total = 0;
                                        counts.done = 0;
                                        o.counts = counts;
                                        return res.json(o);
                                }
                        }, function(err){
                                logger.debug("Error is : " + err);
                                err = new error("500","Internal Server Error","Error occured while fetching the data");
                                resArray.push(err);
                                output.errors = resArray;
                                res.status(500).json(output);
                        });
                }else{
                        var err = new error("400","Bad Request","Unauthorized user");
                        resArray.push(err);
                        output.errors = resArray;
                        return res.status(400).json(output);
                }

        },
	getCzoneCountSummary : function(req, res, next){
        	var output = {};
        	var resArray = [];
        	var czName = req.params.czName;
        	if(_.isEmpty(czName) || czName == 'undefined' || czName == 'null'){
            		var err = new error("400","Bad Request","Required field czName cannot be null/undefined");
            		resArray.push(err);
            		output.errors = resArray;
            		return res.status(400).json(output);
        	}
        	var taskCzoneUrl = config.taskService.url + "czone/"+encodeURIComponent(czName)+"/summary?duein=eoy";
        	var args = {
            		headers : {
                		"Accept" : "application/json",
                		"Content-Type" : "application/json"
            		}
        	}
        	restClient.get(taskCzoneUrl, args, function(data, response){
            		var o = {};
                	var counts = {};
			if(data && data.taskcounts && data.taskcounts.length > 0){
       				var totalCount = 0;
                      		var doneCount = 0;
                   		for(var i = 0; i < data.taskcounts.length; i++){
                          		totalCount += parseInt(data.taskcounts[i].tasks[0].task.total);

                               		doneCount += parseInt(data.taskcounts[i].tasks[0].task.done);
                    		}
                   		counts.total = totalCount;
                      		counts.done = doneCount;
                   		o.counts = counts;
                		return res.json(o);
            		}else{
             			counts.total = 0;
                  		counts.done = 0;
                        	o.counts = counts;
                 		return res.json(data);
           		}
		}, function(err){
                        logger.debug("Error is : " + err);
                        err = new error("500","Internal Server Error","Error occured while fetching the data");
                        resArray.push(err);
                        output.errors = resArray;
                        res.status(500).json(output);

        	});
    	},
	getPMCzoneCountSummary : function(req, res, next){
                var output = {};
                var resArray = [];
                var czName = req.params.czName;
                if(_.isEmpty(czName) || czName == 'undefined' || czName == 'null'){
                        var err = new error("400","Bad Request","Required field czName cannot be null/undefined");
                        resArray.push(err);
                        output.errors = resArray;
                        return res.status(400).json(output);
                }
                var taskCzoneUrl = config.taskService.url + "czone/"+ encodeURIComponent(czName)+"/pm/summary?duein=eoy";
                var args = {
                        headers : {
                                "Accept" : "application/json",
                                "Content-Type" : "application/json"
                        }
                }
                restClient.get(taskCzoneUrl, args, function(data, response){
                        var o = {};
                        var counts = {};
                        if(data && data.taskcounts && data.taskcounts.length > 0){
                                var totalCount = 0;
                                var doneCount = 0;
                                for(var i = 0; i < data.taskcounts.length; i++){
                                        totalCount += parseInt(data.taskcounts[i].tasks[0].pm.total);
                                        doneCount += parseInt(data.taskcounts[i].tasks[0].pm.done);
                                }
                                counts.total = totalCount;
                                counts.done = doneCount;
                                o.counts = counts;
                                return res.json(o);
                        }else{
                                counts.total = 0;
                                counts.done = 0;
                                o.counts = counts;
                                return res.json(o);
                        }
		}, function(err){
                        logger.debug("Error is : " + err);
                        err = new error("500","Internal Server Error","Error occured while fetching the data");
                        resArray.push(err);
                        output.errors = resArray;
                        res.status(500).json(output);

                });
        },

    getTechSummary : function(req, res, next) {
      let techId = req.params.techId;
      let output = {};
      let resArray = new Array();

      if(_.isEmpty(techId) || techId == 'undefined' || techId == 'null'){
        let err = new error("400","Tech id is mandatory","Tech id is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }

      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;

      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK,DIRECTIVE";
      let type = "TASK";
      taskHelper.getTechSummaryFromCache(techId,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatTechSummaryResponse(cacheData,type, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getTechSummaryFromOps(techId,type,authHeader,apiRecordType,duein,recordtype,totalsFor, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatTechSummaryResponse(opsData,type, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },

	getTechSummary_old : function(req, res, next) {
		
		logger.debug(" Getting preventive maintenance summary for technician ");

		var techId = req.params.techId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(techId) || techId == 'undefined' || techId == 'null'){
       		err = new error("400","Tech id is mandatory","Tech id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		
		var apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
		var duein = (req.query.duein)?req.query.duein:"EOY";
		var recordtype = (req.query.recordtype)?req.query.recordtype:"site";
		var totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK";

		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					day_span : duein,
					techid : techId,
					recordtype :  recordtype,
					totals_for : totalsFor
					
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
				   if(data && data.data && data.data.listitems){
				   	logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
						var items = data.data.listitems;
						var taskcounts = new Array();
						for(var key in items){
							var value = items[key];
							var outerObj = {};
							var tasksArr = new Array();
							outerObj.site_unid = value.site_info.site_unid;
							outerObj.siteid = "" + parseInt(value.site_info.cell_num);
							outerObj.site_name = value.site_info.site_name;
							outerObj.switch = value.site_info.switch;
							var tasks = value["TASK"];
							var t = new Array();
							for(var k1 in tasks){
								var innerObj = {};
								innerObj.duein = k1.toLowerCase();
								innerObj.task = {};
								innerObj.task.total = tasks[k1].totalTasks;
								innerObj.task.done = tasks[k1].totalTasksDone;
								innerObj.task.perc = tasks[k1].totalTasksPerc;
								tasksArr.push(innerObj);
							}
							logger.debug("Task Array : ",  tasksArr);
							outerObj.tasks = tasksArr;
							taskcounts.push(outerObj);
						}
						output.taskcounts = taskcounts;
					   res.status(200).json(output);
				   }else{
					   logger.debug("No data found for the tech ..");
					   err = new error("500","Internal server error ","Tasks not found");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching the tasks");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   });
		},
    
    getTechPmSummary : function(req, res, next) {
      let techId = req.params.techId;
      let output = {};
      let resArray = new Array();

      if(_.isEmpty(techId) || techId == 'undefined' || techId == 'null'){
        let err = new error("400","Tech id is mandatory","Tech id is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }

      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;

      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";
      let type = "PM";
      taskHelper.getTechSummaryFromCache(techId,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatTechSummaryResponse(cacheData,type, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getTechSummaryFromOps(techId,type,authHeader,apiRecordType,duein,recordtype,totalsFor, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatTechSummaryResponse(opsData,type, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },

	getTechPmSummary_old : function(req, res, next) {
		
		logger.debug(" Getting preventive maintenance summary for technician ");

		var techId = req.params.techId;
		var output = {};
		var resArray = new Array();
		
		if(_.isEmpty(techId) || techId == 'undefined' || techId == 'null'){
       		err = new error("400","Tech id is mandatory","Tech id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		
		var apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
		var duein = (req.query.duein)?req.query.duein:"EOY";
		var recordtype = (req.query.recordtype)?req.query.recordtype:"site";
		var totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";

		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					day_span : duein,
					techid : techId,
					recordtype :  recordtype,
					totals_for : totalsFor
					
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
				   if(data && data.data && data.data.listitems){
				   	logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
						var items = data.data.listitems;
						var taskcounts = new Array();
						for(var key in items){
							var value = items[key];
							var outerObj = {};
							var tasksArr = new Array();
							outerObj.site_unid = value.site_info.site_unid;
							outerObj.siteid = "" + parseInt(value.site_info.cell_num);
							outerObj.site_name = value.site_info.site_name;
							outerObj.switch = value.site_info.switch;
							var pmTasks = value["PM"];
							var t = new Array();
							for(var k1 in pmTasks){
								var innerObj = {};
								innerObj.duein = k1.toLowerCase();
								innerObj.pm = {};
								innerObj.pm.total = pmTasks[k1].totalTasks;
								innerObj.pm.done = pmTasks[k1].totalTasksDone;
								innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
								tasksArr.push(innerObj);
							}
							logger.debug("Task Array : ",  tasksArr);
							outerObj.tasks = tasksArr;
							taskcounts.push(outerObj);
						}
						output.taskcounts = taskcounts;
					   res.status(200).json(output);
				   }else{
					   logger.debug("No data found for the tech ..");
					   err = new error("500","Internal server error ","Tasks not found");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching the tasks");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   });
		},
    
    getTasksBySite : function(req, res, next){
 
        logger.debug(" Getting tasks for a site ");
		
		var siteUniId = req.params.siteUniId;
		var output = {};
		var resArray = new Array();
		if(_.isEmpty(siteUniId) || siteUniId == 'undefined' || siteUniId == 'null'){
       		err = new error("400","Site id is mandatory","Site id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    
		   
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_tasksFullRecordBySite";
		var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		var apiSize = (req.query.api_size) ? req.query.api_size : 500;
        var apiFields = (req.query.api_fields) ? req.query.api_fields : "*";
		var daySpan = (req.query.day_span) ? req.query.day_span : 365;
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					api_offset : apiOffset,
					api_size  : apiSize,
                    api_fields : apiFields,
					site_unid : siteUniId,
					day_span :  daySpan,  
					format :  "IOP" 
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json"
				}
		};

		restClient.get(url, args, function(data, response){
            logger.debug("Data is : ", data);

				   if(data && data.data && data.data.listitems){
				     logger.debug("Ops tracker request success with %s records", data.data.listitems.length );
                        for(var i=0; i < data.data.listitems.length; i++){
                            resArray.push(new model(data.data.listitems[i]));
                        }
                        output.task_details = resArray;
                        res.status(200).json(output);
				   }else{
					   logger.debug(" No tasks found for the site ");
					   err = new error("500","Internal server error","Tasks not found");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching the data");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })
    },
	getSiteSummary : function(req, res, next) {
		
		logger.debug(" Getting preventive maintenance summary for site ");
		var siteUnid = req.params.siteunid;
		var output = {};
		var resArray = new Array();
		if(_.isEmpty(siteUnid) || siteUnid == 'undefined' || siteUnid == 'null'){
       		err = new error("400","Site id is mandatory","Site id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		var authHeader = req.headers.authorization;
		var apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
		var daySpan = (req.query.duein)?req.query.duein:"EOY";
		var recordtype = (req.query.recordtype)?req.query.recordtype:"site";
		var totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK";
		authHeader = config.app.authHeader; 
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					day_span : daySpan,
					siteunid : siteUnid,
					recordtype :  recordtype,
					totals_for : totalsFor
					
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
			if(data && data.data && data.data.listitems){
			logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                var items1 = data.data.listitems;
				var outerObj = {};
				var tasksArr = new Array();
				for(var key in items1){
                    var items = items1[key];
                    outerObj.site_unid = items["site_info"].site_unid;
                    outerObj.siteid = "" + items["site_info"].cell_num;
                    outerObj.site_name = items["site_info"].site_name;
                    outerObj.switch = items["site_info"].switch;
                    var tasks = items["TASK"];
                    var t = new Array();
                    for(var k1 in tasks){
                        var innerObj = {};
                        innerObj.duein = k1.toLowerCase();
                        innerObj.task = {};
                        innerObj.task.total = tasks[k1].totalTasks + "";
                        innerObj.task.done = tasks[k1].totalTasksDone + "";
                        innerObj.task.perc = tasks[k1].totalTasksPerc + "";
                        tasksArr.push(innerObj);
                    }
				}
				logger.debug("Task Array : ",  tasksArr);
				outerObj.tasks = tasksArr;
				output.taskcounts = outerObj;
				res.status(200).json(output);
			}else{
				logger.debug("No data found for the tech ..");
				err = new error("500","Internal server error","Error occured while fetching the tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function(err){
			logger.debug("Error is : " + err);
			err = new error("500","Internal server error","Error occured while fetching the tasks");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		});
	},

	getSitePmSummary : function(req, res, next) {
		
		logger.debug(" Getting preventive maintenance summary for site ");
		var siteUnid = req.params.siteunid;
		var output = {};
		var resArray = new Array();
		if(_.isEmpty(siteUnid) || siteUnid == 'undefined' || siteUnid == 'null'){
       		err = new error("400","Site id is mandatory","Site id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		var authHeader = req.headers.authorization;
		var apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
		var daySpan = (req.query.duein)?req.query.duein:"EOY";
		var recordtype = (req.query.recordtype)?req.query.recordtype:"site";
		var totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";
		authHeader = config.app.authHeader; 
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					day_span : daySpan,
					siteunid : siteUnid,
					recordtype :  recordtype,
					totals_for : totalsFor
					
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
			if(data && data.data && data.data.listitems){
			logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                var items1 = data.data.listitems;
				var outerObj = {};
				var tasksArr = new Array();
				for(var key in items1){
					var items = items1[key];
					outerObj.site_unid = items["site_info"].site_unid;
					outerObj.siteid = "" + items["site_info"].cell_num;
					outerObj.site_name = items["site_info"].site_name;
					outerObj.switch = items["site_info"].switch;
					var pmTasks = items["PM"];
					var t = new Array();
					for(var k1 in pmTasks){
						var innerObj = {};
						innerObj.duein = k1.toLowerCase();
						innerObj.pm = {};
						innerObj.pm.total = pmTasks[k1].totalTasks + "";
						innerObj.pm.done = pmTasks[k1].totalTasksDone + "";
						innerObj.pm.perc = pmTasks[k1].totalTasksPerc + "";
						tasksArr.push(innerObj);
					}
				}
				logger.debug("Task Array : ",  tasksArr);
				outerObj.tasks = tasksArr;
				output.taskcounts = outerObj;
				res.status(200).json(output);
			}else{
				logger.debug("No data found for the tech ..");
				err = new error("500","Internal server error","Error occured while fetching the tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function(err){
			logger.debug("Error is : " + err);
			err = new error("500","Internal server error","Error occured while fetching the tasks");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		});
	},

	// 3.5 TODO
    updateTask : function(req, res, next) {
      logger.debug(" Updating the task  ", req.body);
      var output = {};
      let self = this;
      var resArray = new Array();
      let clearCache = this.clearCache; 
      var form = new taskForm(req);
      var errors = form.validate();

      if(errors.length > 0){
        output.errors = errors;
        return res.status(400).json(output);
      }
      let userId = req.body.task.userid;
      let site_unid = req.body.task.site_unid;
      var args = form.getUpdateParams();
      var url = config.opsTrackerService.updateUrl;

      restClient.put(url, args, function(data, response){
        if(data && data.resultcode == 0){
            
            let taskStatus = req.body.task.status;
            if(taskStatus == "Completed" || taskStatus == "Cancelled" || taskStatus == "N/A"){     
                self.closeTaskWidget(req.body.task.task_unid, () => {
                    logger.debug("Closed the Widget successfully !");
                });  
            }

          clearCache(site_unid,"TASK", function (clearCacheData, clearCacheResponse) {
            logger.debug("Task updated successfully ");
            output.message = "Task updated successfully";
            output.task = req.body.task;
            res.status(200).json(output);
          });
        }else{
          logger.debug("Error updating the task ");
          err = new error("500","Error updating the task",data?.resultmessage);
          resArray.push(err);
          output.errors = resArray;
          res.status(500).json(output);
        }
      }, function(err){
        logger.debug("Error is : " + err);
        err = new error("500","Internal server error ","Error while updating the task");
        resArray.push(err);
        output.errors = resArray;
        res.status(500).json(output);
      });
    },
    
    closeTaskWidget : function(taskUnid, finalCallback){
        
        let widgetId = 0;
        async.series([
                (callback)=>{

                    let url = config.dbService.url + "get";
                    let args = {
                        headers: {'Content-Type': 'application/json'},
                        data: {
                            "data": {
                                "queryParams": {task_unid : taskUnid},
                                "event": "getOpsTaskWidgetId"
                            }
                        }
                    }

                    restClient.post(url, args, (data, response) => {
                        if (data && data.result && data.result.length > 0){

                            let record = data.result[0];
                            widgetId = record.PMD_WIDGET_ID;
                            return callback();

                        }else{
                            logger.debug("Unable to find the widget for task = %s", taskUnid);
                            return callback();
                        }
                    });

                },
            (callback) => {

                if(widgetId == 0) return callback(); 
                let postData = {};
                postData.id = widgetId;
                postData.type = "ops_task";
                postData.user_id = "SYSTEM";

                let url = config.rcmService.url + "widget/close";
                let args = {
                    headers : {
                        "Content-Type" : "application/json",
                        "Accept" : "application/json"
                    },

                    data : postData
                };

                restClient.post(url, args, (data, response) => {

                    logger.debug("Closed widget API response = %s", data);
                    callback(data);
                });
            }
        ], (err, results)=>{
                return finalCallback();
        });
    },


    clearCache: function (site_unid, type, clearCacheCB) {

        if(!site_unid || site_unid === undefined || site_unid == null || site_unid.length == 0){
            return clearCacheCB();
        }

        let output = {};
        let resArray = new Array();
        let entitiesArr = [];

        async.series([
            //Get site data needed for clear cache
            function (callback) {
                let url = config.siteService.url + "/" + site_unid;
                let args = {
                    headers: {'Content-Type': 'application/json'}
                };
                restClient.get(url, args, function (data, response) {
                    if (response.statusCode == 200 && data && data.sitedetails) {
                        logger.info("Successfully retrieved site details to clear " + type + " cache, site_unid - " + site_unid);
                        let rec = data.sitedetails;
                        if (rec.callout_zones && rec.callout_zones.length > 0) {
                            for (let i = 0; i < rec.callout_zones.length; i++) {
                                let o = {};
                                o.entity = "czone_pm_task_wo_summary";
                                o.query = {};
                                o.query.czname = rec.callout_zones[i].name.toUpperCase();
                                o.query.type = type;
                                entitiesArr.push(o);
                            }
                        }
                        if (rec.techid) {
                            let t = {};
                            t.entity = "tech_pm_task_wo_summary";
                            t.query = {};
                            t.query.techid = rec.techid;
                            t.query.type = type;
                            entitiesArr.push(t);
                        }
                        if (rec.managerid) {
                            let m = {};
                            m.entity = "mgr_pm_task_wo_summary";
                            m.query = {};
                            m.query.mgr_id = rec.managerid;
                            m.query.type = type;
                            entitiesArr.push(m);
                        }
                        callback();
                    } else {
                        let err = new error("500", "Error occurred while getting the site details to clear " + type + " cache, site_unid - " + site_unid, data);
                        logger.error(err);
                        callback(err);
                    }
                });
            },
            function (callback) {
                if (entitiesArr.length > 0) {
                    let postdata = {};
                    postdata.entities = entitiesArr;
                    let url = config.cacheService.url + "/remove";
                    let args = {
                        headers: {
                            "Content-Type": "application/json"
                        },
                        data: postdata
                    };
                    restClient.remove(url, args, (data, response) => {
                        if (data && response.statusCode == 200) {
                            logger.info("Successfully cleared " + type + " cache for, %j", entitiesArr);
                            callback();
                        } else {
                            let err = new error("500", "Internal Server Error", "Error occurred while deleting data from " + type + " cache , site_unid - " + site_unid);
                            logger.error(err, data);
                            callback(err);
                        }
                    });
                } else {
                    logger.info("Could not clear " + type + " cache as entitiesArr is empty!!");
                    callback();
                }
            }
        ], function (err) {
            if (err) {
                resArray.push(err);
                output.errors = resArray;
                return clearCacheCB(output, null);
            } else {
                output.message = type + " Cache cleared successfully";
                return clearCacheCB(output, null);
            }
        });
    },
	// 3.5 TODO
	updatePmTasks : function(req, res, next) {
	    logger.debug(" Updating the PM Tasks  ", req.body);
        var output = {};
        var resArray = new Array();

		const pmd_widget_id = req.body.pm.pmd_widget_id;
		let userId = req.body.pm.userid;

		if(_.isEmpty(pmd_widget_id) || pmd_widget_id == 'undefined' || pmd_widget_id == 'null'){
			err = new error("400","PMD Widget ID is missing","PMD Widget ID is missing");
			resArray.push(err);
		 	output.errors = resArray;
			return res.status(400).json(output);
		}  
		
		// Get Widget Details and compare assigned to value with userid and update widget
		if(userId){
			let requrl = config.dbService.url + "/get";
            let reqargs = {
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "data": {
                        "queryParams": {
                            "pmd_widget_id": pmd_widget_id
                        },
                        "event": 'getPMDWidgetDetails'
                    }
                }
            };
            restClient.post(requrl, reqargs, (data, response) => {
                if (data && data.result && data.result.length > 0 && response.statusCode == 200) {
                    let widget = data.result[0];
                    let assigned_to = widget.ASSIGNED_TO;
                    let updateStatus = "UPDATED", readStatus = userId !== assigned_to ? 'UNREAD' : 'READ';
                    
                    reqargs = {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {
                            "data": {
                                "queryParams": {
                                    "widget_id": pmd_widget_id,
                                    "read_status": readStatus,
                                    "update_flag": updateStatus
                                },
                                "event": 'updatePMDWidgetReadStatusWithNewUpdateFlag'
                            }
                        }
                    };    

                    restClient.post(requrl, reqargs, (data, response) => {
                        if(data &&response.statusCode == 200){
                            logger.info("Successfully updated PMD Widget Read and New/Updated status")
                        }else{
                            logger.error("Failed updated PMD Widget Read and New/Updated status")
                        }
                    });
                } else {
                    logger.error("Failed updated PMD Widget Read and New/Updated status, Can't get widget details. Or widget doesn't exists")
                }
            });
		}else{
			logger.error("Failed updated PMD Widget Read and New/Updated status, Can't get UserId")
		}

		let clearCache = this.clearCache; 
		let updatePMTasksCountAndStatus = this.updatePMTasksCountAndStatus;
        var form = new pmTaskForm(req);
        var errors = form.validate();

        if (errors.length > 0) {
            output.errors = errors;
            return res.status(400).json(output);
        }

        var args = form.getUpdateParams();
		args.format = "IOP";
		args.hide_completed = 1; 
		let site_unid = req.body.pm.site_unid;
		const isUpdate = form.updateStatusTrans;
		const techIdAndName = form.techIdAndName;
		logger.debug("arguments to be updated args are : ", args);		
        var url = config.opsTrackerService.pmTaskUpdateUrl;
        restClient.put(url, args, function(data, response){
        if(data && data.resultcode == 0){
			clearCache(site_unid,"PM", function (clearCacheData, clearCacheResponse) {
                  logger.debug("Task updated successfully ", data);
                  output.message = "PM tasks updated successfully";
                  output.pm = {};
                  output.pm.pm_unid = args.data.pm.pm_unid;
				  output.pm.userid = args.data.pm.userid;
                  if(data.headerData){
				    output.pm.numtasksdone = data.headerData.numtasksdone;
                  }
                  /*
                  data.data.listitems.forEach(function (entry) {
					  entry.task_unid = entry.meta_universalid;
                  });
                  */
                  for(let i=0; i<data.data.listitems.length; i++){
                    let rec = data.data.listitems[i];
                    rec.task_unid = rec.meta_universalid;
                    resArray.push(rec);
                  }
				  //output.pm.pmtasks = data.data.listitems;
				  output.pm.pmtasks = resArray;
	              let updateData = {
					  "pm_unid": args.data.pm.pm_unid,
					  "isUpdate": isUpdate,
					  "count": form.completeCount,
					  "pmd_widget_id": pmd_widget_id,
					  "user_id": userId,
					  "user_name": techIdAndName[userId]
				  }
				  updatePMTasksCountAndStatus(updateData, function(err, resp) {
					  if (err) {
						  res.status(500).json(err);
					  } else {
						  res.status(200).json(output);
					  }
				  })
			});
      	}else{
			      err = new error("500","Error updating the pm tasks",data?.resultmessage);
			      resArray.push(err);
			      output.errors = resArray;
	              res.status(500).json(output);
              }
        }, function(err){
	          logger.debug("Error is : " + err);
			  err = new error("500","Internal server error ","Server error occured while updating the pm tasks");
			  resArray.push(err);
			  output.errors = resArray;
	          res.status(500).json(output);
	    });
	},

	// Update the Single PM Task
	updatePmTask_task : function(req, res, next) {
		logger.debug("Updating the PM Task", req.body);
        var output = {};
        var resArray = new Array();
		let self = this;
		let clearCache = this.clearCache; 

		const pmd_widget_id = req.body.pmd_widget_id;		
		const start_stop_info = req.body.start_stop_info;

		if(_.isEmpty(pmd_widget_id) || pmd_widget_id == 'undefined' || pmd_widget_id == 'null'){
			err = new error("400","PMD Widget ID is missing","PMD Widget ID is missing");
			resArray.push(err);
		 	output.errors = resArray;
			return res.status(400).json(output);
		}  
		
		let paused = req.body.widget_status == 'PAUSE' || 'START' ? true: false

        var singleTaskform = new pmSingleTaskForm(req, paused);
        var errors = singleTaskform.validate();

        if (errors.length > 0) {
            output.errors = errors;
            return res.status(400).json(output);
        }

        var args = singleTaskform.getUpdateParams();
		args.format = "IOP";
		args.hide_completed = 1; 
		let site_unid = req.body.site_unid;
		logger.debug("arguments to be updated args are : ", args);		
        var url = config.opsTrackerService.pmTaskUpdateUrl;
        restClient.put(url, args, function(data, response){
        if(data && data.resultcode == 0){

			clearCache(site_unid,"TASK", function (clearCacheData, clearCacheResponse) {
				logger.debug("Task updated successfully ");
				output.message = "Task updated successfully";
				output.task = req.body.task;	
			  });


			let params = {};
			params.comments = req.body.comments;
			params.lastUpdatedBy = req.body.meta_lastupdateby;
			params.lastUpdatedDate = moment().utc().format('YYYY-MM-DD HH:mm:ss'), 
			params.taskUnid = req.body.task_unid;
			params.specific_task = req.body.specifictask;
			params.specifictask_value = req.body.specifictask_value;
			if (paused == false){
			params.taskStatus = req.body.status;   
			}
			let query = paused == false ? "updatePMTask": "pausePMTask";     
			let url = config.dbService.url + "get";
			let args = {
			  headers: {'Content-Type': 'application/json'},
			  data: {
				"data": {
				  "queryParams": params,
				  "event": query
				}
			  }
			};
			
			restClient.post(url,args,(data,response) => {
				if(data && response.statusCode == 200) {
					logger.info("Successfully updated the task status in db");
 
					let action = req.body.start_stop_info?.action;//by widgetstatus
					if(action){
						self.updatePmTaskWidget(action,req.body.pmd_widget_id,req.body.user_id, () => {
							logger.debug("Updated the Widget status successfully !");
						});  
					}

					res.status(200).json(output);
					
				} else {
					let err = new error('500','Server Error',"Updated Successfully in ops tracker but failed to update in iop");
					resArray.push(err);
					output.errors = resArray;
					res.status(500).json(output);
				}
			});
		}
			else{
				err = new error("500","Error updating the pm task",data?.resultmessage);
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		});
	},

	// Update the PM_WIDGET table 
	updatePmTaskWidget_task  : function(action,pmd_widget_id,user_id,cb){
		
		let params = {};
		let today = moment.utc();
        let timeStamp = moment(today).format("YYYY-MM-DD HH:mm:ss");
		
		if(action == "START" || action == "IN PROGRESS"){
			//Change PMD_WIDGET.Status = FROM NEW to IN PROGRESS
			params.status = 'IN PROGRESS';
		}else if(action == "PAUSE" ||action == "PAUSED" ){
			//Change PMD_WIDGET.Status = FROM IN PROGRESS to PAUSED
			params.status = 'PAUSED';
		}else if(action == "STOP" || action == "COMPLETE"){
			//Change PMD_WIDGET.Status = FROM IN PROGRESS to PAUSED
			params.status = 'COMPLETED';
		}
        
        
        params.modified_on = timeStamp;
        params.pmd_widget_id = pmd_widget_id;
		let url = config.dbService.url + "insert";
        let args = {
            headers: {'Content-Type': 'application/json'},
            data: {
                "data": {
                    "queryParams": params,
                    "event": "updatePmdWidgetStatusByAction"
                }
            }
        };
        restClient.post(url, args, function (data, response) {
            if (data && response.statusCode == 200) {
                logger.info("Sucessfully updated the pwd widget status");
                cb();
            } else {
                let err = new error("500", "Internal Server Error", "Error occurred while updating the pmd widget status");
                cb(err);
            }
        });
	},
	updateSwitchPmTasks: function (req, res, next) {
		logger.info(" Updating the Switch PM Tasks1  ", req.body);
		let output = {};
		let resArray = new Array();
		let form = new pmTaskForm(req);
		let errors = form.validate();

		if (errors.length > 0) {
			output.errors = errors;
			return res.status(400).json(output);
		}

		let args = form.getUpdateParams();
		args.format = "IOP";
		args.hide_completed = 1;
		logger.info("arguments to be updated args are : ", args);

		let url = config.opsTrackerService.pmTaskUpdateUrl;
		logger.info(" url  "+ url);

		restClient.put(url, args, function (data, response) {
			if (data && data.resultcode == 0) {
				logger.debug("Task updated successfully ", data);
				output.message = "PM tasks updated successfully";
				output.pm = {};
				output.pm.pm_unid = args.data.pm.pm_unid;
				output.pm.userid = args.data.pm.userid;
				if (data.headerData) {
					output.pm.numtasksdone = data.headerData.numtasksdone;
				}
				for (let i = 0; i < data.data.listitems.length; i++) {
					let rec = data.data.listitems[i];
					rec.task_unid = rec.meta_universalid;
					resArray.push(rec);
				}
				output.pm.pmtasks = resArray;

				var url1 = config.pmDirectiveService.url+"/pmd/updatePMStatus";
				logger.info(" url  "+ url);
				let reqstr = args.data.pm;
				let switch_unid = req.body.pm.switch_unid;
				let userid = req.body.pm.userid;
				reqstr.switch_unid = switch_unid;
				reqstr.user = userid;
				let args1 = {
					headers : {
						"Content-Type" : "application/json"
				},
				data: reqstr
				};
				restClient.post(url1, args1, (data, response) => {
					console.log('Updated status');
				});
				res.status(200).json(output);
			} else {
				err = new error("500", "Error updating the pm tasks", data?.resultmessage);
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function (err) {
			logger.debug("Error is : " + err);
			err = new error("500", "Internal server error ", "Server error occured while updating the pm tasks");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		});
	},
	// Update the PM Tasks for Switch User
	updateSwitchPmTasks_task: function (req, res, next) {
		logger.debug(" Updating the Switch PM Tasks  ", req.body);
		let output = {};
		let resArray = new Array();
		let form = new pmTaskForm(req);
		let errors = form.validate();

		if (errors.length > 0) {
			output.errors = errors;
			return res.status(400).json(output);
		}

		let args = form.getUpdateParams();
		args.format = "IOP";
		args.hide_completed = 1;
		logger.debug("arguments to be updated args are : ", args);
		let url = config.opsTrackerService.pmTaskUpdateUrl;
		restClient.put(url, args, function (data, response) {
			if (data && data.resultcode == 0) {
				logger.debug("Task updated successfully ", data);
				output.message = "PM tasks updated successfully";
				output.pm = {};
				output.pm.pm_unid = args.data.pm.pm_unid;
				output.pm.userid = args.data.pm.userid;
				if (data.headerData) {
					output.pm.numtasksdone = data.headerData.numtasksdone;
				}
				for (let i = 0; i < data.data.listitems.length; i++) {
					let rec = data.data.listitems[i];
					rec.task_unid = rec.meta_universalid;
					resArray.push(rec);
				}
				output.pm.pmtasks = resArray;



/////
//let args2 = form.getUpdateParams();

	//Calling java service to fetch ddpa transaction details
	//var url = config.pmDirectiveService.url+"/pmd/insertPDMSwitchLevel";
					
	//var userid =req.query.user ? req.query.user : 'system';
	//output.user = userid;
	//output.switch_unid = switchUnid;
	//let reqstr = args2.data.pm;
	//let switch_unid = req.body.pm.switch_unid;
	//let userid = req.body.pm.userid;

	//reqstr.switch_unid = switch_unid;
	//reqstr.user = userid;
	//let args1 = {
		//headers : {
			//"Content-Type" : "application/json"
	//},
	//data: reqstr
//};
	//restClient.post(url, args1, (data, response) => {
//if(data){
	//res.status(200).json(output);
//}else{
	//res.status(200).json(output);
//}
//});

/////


				res.status(200).json(output);
			} else {
				err = new error("500", "Error updating the pm tasks", data?.resultmessage);
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function (err) {
			logger.debug("Error is : " + err);
			err = new error("500", "Internal server error ", "Server error occured while updating the pm tasks");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		});
	},

    getMgrSummaryBySites : function(req, res, next) {
      let mgrId = req.params.loginId;
      let output = {};
      let resArray = new Array();
      if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
        let err = new error("400","Manager id is mandatory","Manager id is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }
      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;

      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK,DIRECTIVE";
      let totals_by = (req.query.totals_by)?req.query.totals_by:"location";
      let type = "SITE_TASK";
      let outputType = "TASK";
      taskHelper.getMgrSiteSummaryFromCache(mgrId,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatMgrSiteSummaryResponse(cacheData,outputType, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getMgrSiteSummaryFromOps(mgrId,type,authHeader,apiRecordType,duein,recordtype,totalsFor,totals_by, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatMgrSiteSummaryResponse(opsData,outputType, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },

    getMgrSummaryBySites_old : function(req, res, next) {

        logger.debug(" Getting manager Task summary by sites ");

        var mgrId = req.params.loginId;
        var output = {};
        var resArray = new Array();

        if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
            err = new error("400","Manager id is mandatory","Manager id is mandatory");
            resArray.push(err);
            output.errors = resArray;
            return res.status(400).json(output);
        }    

        var authHeader = req.headers.authorization;
        authHeader = config.app.authHeader; 

        var duein = (req.query.duein)?req.query.duein:"EOY";
        var url = config.opsTrackerService.url;
        var args = {
            parameters : {
                api_recordtype : "custom_recordTotals",
                day_span : duein,
                mgrid : mgrId,
                recordtype :  "site",
                totals_for : "TASK",
                totals_by : "location"    

            },
            headers : {
                "Accept" : "application/json",
                "Authorization" : authHeader,
                "Content-Type": "application/json" 
            }
        };

        restClient.get(url, args, function(data, response){
            if(data && data.data && data.data.listitems){
               logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                var items = data.data.listitems;
                var taskcounts = new Array();
                for(var key in items){
                    var value = items[key];
                    var outerObj = {};
                    var tasksArr = new Array();
                    outerObj.siteid = value.site_info.site_id+"";
                    outerObj.site_unid = value.site_info.site_unid;
					outerObj.site_name = value.site_info.site_name;
					outerObj.switch = value.site_info.switch;
                    var tasks = value["TASK"];
                    var t = new Array();
                    for(var k1 in tasks){
                        var innerObj = {};
                        innerObj.duein = k1.toLowerCase();
                        innerObj.task = {};
                        innerObj.task.total = tasks[k1].totalTasks;
                        innerObj.task.done = tasks[k1].totalTasksDone;
                        innerObj.task.perc = tasks[k1].totalTasksPerc;
                        tasksArr.push(innerObj);
                    }
                    logger.debug("Task Array : ",  tasksArr);
                    outerObj.tasks = tasksArr;
                    taskcounts.push(outerObj);
                }
                output.taskcounts = taskcounts;
                res.status(200).json(output);
            }else{
                logger.debug(" No data found for the manager ");
                err = new error("500","Internal server error","Error occured while fetching the tasks");
                resArray.push(err);
                output.errors = resArray;
                res.status(500).json(output);
            }
        }, function(err){
            logger.debug("Error is : " + err);
            err = new error("500","Internal server error","Error occured while fetching the data");
            resArray.push(err);
            output.errors = resArray;
            res.status(500).json(output);
        })
    },
    
    getMgrPmSummaryBySites : function(req, res, next) {
      let mgrId = req.params.loginId;
      let output = {};
      let resArray = new Array();
      if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
        let err = new error("400","Manager id is mandatory","Manager id is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }
      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;

      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";
      let totals_by = (req.query.totals_by)?req.query.totals_by:"location";
      let type = "SITE_PM";
      let outputType = "PM";
      taskHelper.getMgrSiteSummaryFromCache(mgrId,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatMgrSiteSummaryResponse(cacheData,outputType, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getMgrSiteSummaryFromOps(mgrId,type,authHeader,apiRecordType,duein,recordtype,totalsFor,totals_by, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatMgrSiteSummaryResponse(opsData,outputType, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },

    getMgrPmSummaryBySites_old : function(req, res, next) {

        logger.debug(" Getting manager PM summary by sites ");

        var mgrId = req.params.loginId;
        var output = {};
        var resArray = new Array();

        if(_.isEmpty(mgrId) || mgrId == 'undefined' || mgrId == 'null'){
            err = new error("400","Manager id is mandatory","Manager id is mandatory");
            resArray.push(err);
            output.errors = resArray;
            return res.status(400).json(output);
        }    

        var authHeader = req.headers.authorization;
        authHeader = config.app.authHeader; 

        var duein = (req.query.duein)?req.query.duein:"EOY";
        var url = config.opsTrackerService.url;
        var args = {
            parameters : {
                api_recordtype : "custom_recordTotals",
                day_span : duein,
                mgrid : mgrId,
                recordtype :  "site",
                totals_for : "PM",
                totals_by : "location"    

            },
            headers : {
                "Accept" : "application/json",
                "Authorization" : authHeader,
                "Content-Type": "application/json" 
            }
        };

        restClient.get(url, args, function(data, response){
            if(data && data.data && data.data.listitems){
              logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                var items = data.data.listitems;
                var taskcounts = new Array();
                for(var key in items){
                    var value = items[key];
                    var outerObj = {};
                    var tasksArr = new Array();
                    outerObj.siteid = value.site_info.site_id+"";
                    outerObj.site_unid = value.site_info.site_unid;
					outerObj.site_name = value.site_info.site_name;
					outerObj.switch = value.site_info.switch;
                    var pmTasks = value["PM"];
                    var t = new Array();
                    for(var k1 in pmTasks){
                        var innerObj = {};
                        innerObj.duein = k1.toLowerCase();
                        innerObj.pm = {};
                        innerObj.pm.total = pmTasks[k1].totalTasks;
                        innerObj.pm.done = pmTasks[k1].totalTasksDone;
                        innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
                        tasksArr.push(innerObj);
                    }
                    logger.debug("Task Array : ",  tasksArr);
                    outerObj.tasks = tasksArr;
                    taskcounts.push(outerObj);
                }
                output.taskcounts = taskcounts;
                res.status(200).json(output);
            }else{
                logger.debug(" No data found for the manager ");
                err = new error("500","Internal server error","Error occured while fetching the tasks");
                resArray.push(err);
                output.errors = resArray;
                res.status(500).json(output);
            }
        }, function(err){
            logger.debug("Error is : " + err);
            err = new error("500","Internal server error","Error occured while fetching the data");
            resArray.push(err);
            output.errors = resArray;
            res.status(500).json(output);
        })
    },

    getTaskCalloutZoneSummary : function (req, res, next) {
      let output = {};
      let resArray = [];
      let calloutZone = req.params.czname;
      if(_.isEmpty(calloutZone) || calloutZone == 'undefined' || calloutZone == 'null'){
        let err = new error("400","Call out zone is mandatory","Call out zone is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }
      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;
      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"TASK,DIRECTIVE";
      let type = "TASK";
      taskHelper.getCalloutZoneSummaryFromCache(calloutZone,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatCalloutZoneSummaryResponse(cacheData,type, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getCalloutZoneSummaryFromOps(calloutZone,type,authHeader,apiRecordType,duein,recordtype,totalsFor, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatCalloutZoneSummaryResponse(opsData,type, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },

	getTaskCalloutZoneSummary_old : function (req, res, next) {
		logger.debug("Getting callout zone summary for %s", req.params.czname);
		var output = {};
		var resArray = [];
		var calloutZone = req.params.czname;
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		var daySpan = (req.query.duein)?req.query.duein:"EOY";
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : "custom_recordTotals",
					calloutzone : calloutZone,
					recordtype :  "site",
					api_orderby : "site_name",
					api_order : "asc",
					api_size : 1000,
					api_offset : 0,
					totals_for : "TASK",
					day_span : daySpan							
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
			if(data && data.data && data.data.listitems){
			logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                var items = data.data.listitems;
                var taskcounts = new Array();
                for(var key in items){
				    var outerObj = {};
				    var tasksArr = new Array();
				    outerObj.site_unid = items[key]["site_info"].site_unid;
				    outerObj.siteid = "" + items[key]["site_info"].cell_num;
					outerObj.site_name = items[key]["site_info"].site_name;
					outerObj.switch = items[key]["site_info"].switch;
				    var tasks = items[key]["TASK"];
				    for(var k1 in tasks){  
					    var innerObj = {};
					    innerObj.duein = k1.toLowerCase();
					    innerObj.task = {};
					    innerObj.task.total = tasks[k1].totalTasks;
					    innerObj.task.done = tasks[k1].totalTasksDone;
					    innerObj.task.perc = tasks[k1].totalTasksPerc;
					    tasksArr.push(innerObj);
				    }
				    logger.debug("Task Array : ",  tasksArr);
				    outerObj.tasks = tasksArr;
                    taskcounts.push(outerObj);
                }

			    output.taskcounts = taskcounts;
			    res.status(200).json(output);

			}else{
				logger.debug("No data found for the tech ..");
				err = new error("500","Internal server error","Error occured while fetching the tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function(err){
			logger.debug("Error is : " + err);
			err = new error("500","Internal server error","Error occured while fetching the tasks");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		});		
	},

    getPmCalloutZoneSummary : function (req, res, next) {
      let output = {};
      let resArray = [];
      let calloutZone = req.params.czname;
      if(_.isEmpty(calloutZone) || calloutZone == 'undefined' || calloutZone == 'null'){
        let err = new error("400","Call out zone is mandatory","Call out zone is mandatory");
        resArray.push(err);
        output.errors = resArray;
        return res.status(400).json(output);
      }
      let authHeader = req.headers.authorization;
      authHeader = config.app.authHeader;
      let apiRecordType = (req.query.api_recordtype)?req.query.api_recordtype:"custom_recordTotals";
      let duein = (req.query.duein)?req.query.duein:"EOY";
      let recordtype = (req.query.recordtype)?req.query.recordtype:"site";
      let totalsFor = (req.query.totals_for)?req.query.totals_for:"PM";
      let type = "PM";
      taskHelper.getCalloutZoneSummaryFromCache(calloutZone,type, (data, response) => {
        if(data && data.records && data.records.length > 0){
          let cacheData = data.records[0].summary;
          taskHelper.formatCalloutZoneSummaryResponse(cacheData,type, (data, response) => {
            output.taskcounts = data.taskcounts;
            res.status(200).json(output);
          });
        }else{
          taskHelper.getCalloutZoneSummaryFromOps(calloutZone,type,authHeader,apiRecordType,duein,recordtype,totalsFor, (data, response) => {
            if(data.errors){
              res.status(500).json(data);
            }else{
              let opsData = data.data;
              taskHelper.formatCalloutZoneSummaryResponse(opsData,type, (data, response) => {
                output.taskcounts = data.taskcounts;
                res.status(200).json(output);
              });
            }
          });
        }
      });
    },
        
	getPmCalloutZoneSummary_old : function (req, res, next) {
		logger.debug("Getting callout zone summary for %s", req.params.czname);
		var output = {};
		var resArray = [];
		var calloutZone = req.params.czname;
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		var daySpan = (req.query.duein)?req.query.duein:"EOY";
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : "custom_recordTotals",
					calloutzone : calloutZone,
					recordtype :  "site",
					api_orderby : "site_name",
					api_order : "asc",
					api_size : 1000,
					api_offset : 0,
					totals_for : "PM",
					day_span : daySpan							
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
			if(data && data.data && data.data.listitems){
			  logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                var items = data.data.listitems;
				var taskcounts = new Array();
                for(var key in items){
					var outerObj = {};
					outerObj.site_unid = items[key]["site_info"].site_unid;
					outerObj.siteid = "" + items[key]["site_info"].cell_num;
					outerObj.site_name = items[key]["site_info"].site_name;
					outerObj.switch = items[key]["site_info"].switch;
					var pmTasks = items[key]["PM"];
					var tasksArr = new Array();
					for(var k1 in pmTasks){
						var innerObj = {};
						innerObj.duein = k1.toLowerCase();
						innerObj.pm = {};
						innerObj.pm.total = pmTasks[k1].totalTasks + "";
						innerObj.pm.done = pmTasks[k1].totalTasksDone + "";
						innerObj.pm.perc = pmTasks[k1].totalTasksPerc + "";
						tasksArr.push(innerObj);
					}
					logger.debug("Task Array : ",  tasksArr);
					outerObj.tasks = tasksArr;
					taskcounts.push(outerObj);
                }
				output.taskcounts = taskcounts;
				res.status(200).json(output);
			}else{
				logger.debug("No data found for the tech ..");
				err = new error("500","Internal server error","Error occured while fetching the tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function(err){
			logger.debug("Error is : " + err);
			err = new error("500","Internal server error","Error occured while fetching the tasks");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		});		
	},
	
    getTasksByUnid : function(req, res, next){
 
        logger.debug(" Get Task by Task Unid ");
		
		var taskUnid = req.params.taskUnid;
		var output = {};
		var resArray = new Array();
		if(_.isEmpty(taskUnid) || taskUnid == 'undefined' || taskUnid == 'null'){
       		var err = new error("400","Bad Request","Task Unid cannot be null/undefined");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    
		   
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		var url = config.opsTrackerService.updateUrl;

        var args = {
            parameters : {
                recordtype : "C2VZWTask",
                meta_universalid : taskUnid,
                retrieve : "*",
                retrieveformat :  "simple" 
            },
            headers : {
                "Accept" : "application/json",
                "Authorization" : authHeader,
                "Content-Type": "application/json" 
            }
        };

        restClient.get(url, args, function(data, response){					
            if(data && data.fields ){
              logger.debug("Ops tracker request success with %s records", data.fields.length );
                output.task_details = data.fields;
				output.task_details.is_editable = "yes";
                output.task_details.task_unid = output.task_details.meta_universalid;
                let category = output.task_details.cfd_tr_category ? output.task_details.cfd_tr_category : "";

                if(category.indexOf("RESERVED_") >= 0){
					output.task_details.is_editable = "no";
					output.task_details.task_url = config.opsTrackerService.task_form_url + output.task_details.task_unid;
                    output.task_details.link_text = "Open form in Ops-Tracker";
				}
                return res.status(200).json(output);
            }else{
                logger.debug(" No tasks found for the site ");
                output.task_details = {};
                return res.status(200).json(output);
            }
        }, function(err){
            logger.debug("Error is : " + err);
            var err = new error("500","Internal server error","Error occured while fetching the data");
            resArray.push(err);
            output.errors = resArray;
            return res.status(500).json(output);
        });
    },
    
    getAllUsers : function(req, res, next){
        logger.debug("User id is %s", req.query.id);
        var loginId = req.query.id;
        if(loginId) {
            loginId = loginId.toUpperCase();
            return res.status(200).json(global.usersList[loginId])
        }else{
            return res.status(200).json(global.usersList)
        }
    },
	
	getGeneratorInfo : function(req, res, next){
		var output = {};
		var resArray = [];
		var siteUnid = req.params.siteUnid;
		var pmHeaderId = req.params.pmHeaderId;
		var url = config.generator.info;
		var args = {
			headers : {
                "Accept" : "application/json",
				"Authorization" : config.app.authHeader,
				"Content-Type" : "application/json"
			},
			
			parameters : {
				site_unid : siteUnid,
				pm_unid : pmHeaderId
			}
		}
		restClient.get(url, args, function(data, response){
            if(data && data.resultcode == 0){
                output.generator_info = data.data;
                res.status(200).json(output);
            }else{
                res.status(500).json(output);
            }
			console.log("Data is %j", data);		
		});			
	},
	
	getGeneratorFuelLevel : function(req, res, next){
		
		var output = {};
		var resArray = [];
		var url = config.generator.level;
		var args = {
			headers : {
                "Accept" : "application/json",
				"Authorization" : config.app.authHeader,
				"Content-Type" : "application/json"
			}
		}
		restClient.get(url, args, function(data, response){
            if(data && data.resultcode == 0){
                output.generator_fuellevel = data.data.GEN_FUELLEVEL; 
                output.generator_oillevel =  data.data.GEN_OILLEVEL;
                res.status(200).json(output);
            }else{
                output.generator_level = {};
                output.generator_oillevel =  {};
                res.status(500).json(output);
            }
		});			
	},
	
	updateGeneratorReadings : function(req, res, next){
		logger.debug("Adding/updating generator readings ");
        console.log("Request is : %j", req.body);
		var output = {};
		var resArray = [];
		var reqData = req.body;
		var pmUnid = reqData.pm_unid;
		var readings = reqData.readings;
		var userId = reqData.userid;
		var url = config.generator.updateUrl;
		var args = {
			headers : {
				"Authorization" : config.app.authHeader,
				"Content-Type" : "application/json",
				"Accept" : "application/json",
				"IOPUSERID" : userId
			},
			
			data : {
				"pm_unid" : pmUnid,
				"readings" : readings
			}
		};
		
		restClient.post(url, args, function(data, response){
					
			if(data && data.resultcode == 0){
				output.message = "Readings added/updated successfully";
				if(data.reading_unids){
					for(var key in data.reading_unids){
						reqData.readings[0].reading_unid = data.reading_unids[key].reading_unid;
						reqData.readings[0].meta_createddate = data.reading_unids[key].meta_createddate;
						reqData.readings[0].meta_createdby = data.reading_unids[key].meta_createdby;
						reqData.readings[0].meta_lastupdatedate = data.reading_unids[key].meta_lastupdatedate;
						reqData.readings[0].meta_lastupdateby = data.reading_unids[key].meta_lastupdateby;
					}
				}
				output.data = reqData;
				res.status(200).json(output);
			}else{
	            logger.debug("Error occured while saving the generator readings : " + data?.resultmessage);
    	        var err = new error("500","Internal server error",data?.resultmessage);
        	    resArray.push(err);
            	output.errors = resArray;
            	res.status(500).json(output);
			}
		});
	},

    getTaskDetailsForSwitch : function(req, res, next){
 
        logger.debug(" Getting tasks for a switch ");
		var switchUnid = req.params.switchUnid;
		var output = {};
		var resArray = new Array();
		if(_.isEmpty(switchUnid) || switchUnid == 'undefined' || switchUnid == 'null'){
       		err = new error("400","Switch id is mandatory","Switch id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    
		   
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_tasksFullRecordBySite";
		var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		var apiSize = (req.query.api_size) ? req.query.api_size : 500;
        var apiFields = (req.query.api_fields) ? req.query.api_fields : "*";
		var daySpan = (req.query.day_span) ? req.query.day_span : "EOY";
		var url = config.opsTrackerService.url;
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					api_offset : apiOffset,
					api_size  : apiSize,
                    api_fields : apiFields,
					site_unid : switchUnid,
					day_span :  daySpan,  
					format :  "IOP",
                    recordType : "switch",
                    includedirectives : "no"    
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
            logger.debug("Data is : ", data);
				   if(data && data.data && data.data.listitems){
				     logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                        for(var i=0; i < data.data.listitems.length; i++){
                            resArray.push(new model(data.data.listitems[i]));
                        }
                        output.task_details = resArray;
                        res.status(200).json(output);
				   }else{
					   logger.debug(" No tasks found for the site ");
					   err = new error("500","Internal server error","Tasks not found");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching the data");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })
    },

    getDirectivesForSwitch : function(req, res, next){
 
        logger.debug(" Getting directives for a switch ");
		var switchUnid = req.params.switchUnid;
		var output = {};
		var resArray = new Array();
		if(_.isEmpty(switchUnid) || switchUnid == 'undefined' || switchUnid == 'null'){
       		err = new error("400","Switch id is mandatory","Switch id is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    
		var role =req.query.role ? req.query.role : '';  
		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader; 
		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_tasksFullRecordBySite";
		var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		var apiSize = (req.query.api_size) ? req.query.api_size : 500;
        var apiFields = (req.query.api_fields) ? req.query.api_fields : "*";
		var daySpan = (req.query.day_span) ? req.query.day_span : "EOY";
		var url = config.opsTrackerService.url;
			var args = {
				parameters: {
					api_recordtype: apiRecordType,
					api_offset: apiOffset,
					api_size: apiSize,
					api_fields: apiFields,
					site_unid: switchUnid,
					day_span: daySpan,
					format: "IOP",
					recordType: "switch",
					includedirectives: "only",
					includecancelled: "1"
				},
				headers: {
					"Accept": "application/json",
					"Authorization": authHeader,
					"Content-Type": "application/json"
				}
			};

			if (role && role.includes('TRANSLATION_ENGINEER')) {
				//Added a flag (direlementdept=transport) to pull translations directives. 
				args.parameters["direlementdept"] = "transport";
			}

			restClient.get(url, args, function (data, response) {
				logger.debug("Data is : ", data);
				if (data && data.data && data.data.listitems) {
					logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
					if (role && role.includes('TRANS')) {
						for (var i = 0; i < data.data.listitems.length; i++) {
							if ((data.data.listitems[i].platform && data.data.listitems[i].directiveid) &&
								((data.data.listitems[i]).platform.trim().substring(0, 4) === 'NDBM') &&
								((data.data.listitems[i]).directiveid.trim().substring(0, 4) === 'NDBM')) {
								resArray.push(new dirModel(data.data.listitems[i]));
							} else {
								resArray.push(new dirModel(data.data.listitems[i]));
							}
						}
					} else {
						for (var i = 0; i < data.data.listitems.length; i++) {
							resArray.push(new dirModel(data.data.listitems[i]));
						}
					}
					output.directive_count = data.data.listitems.length;
					output.directive_details = resArray;

					//Calling java service to fetch ddpa transaction details
					//var url = config.pmDirectiveService.url+"/pmd/insertPDMSwitchLevel";
					
					//var userid =req.query.user ? req.query.user : 'system';
					//output.user = userid;
					//output.switch_unid = switchUnid;
					//let args = {
						//headers : {
							//"Content-Type" : "application/json"
					//},
					//data: output
				//};
					//restClient.post(url, args, (data, response) => {
				//if(data){
					//console.log("helll---------");
					//res.status(200).json(data);
				//}else{
					//res.status(200).json(output);
				//}
			//});

			res.status(200).json(output);

				} else {
					   logger.debug(" No tasks found for the site ");
					   err = new error("500","Internal server error","Tasks not found");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching the data");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })
    },

	getDirectivesForSwitch_new : function(req, res, next){

        logger.debug(" Getting directives for a switch ");
		var switch_unid = req.params.switchUnid;
		var start_date = req.query.start_date;
		var due_date = req.query.due_date;
		var output = {};
		var resArray = new Array();
		if (!switch_unid || switch_unid === 'undefined' || switch_unid === 'null') {
			logger.debug("Switch ID is missing or invalid");
			err = new error("400","Switch ID is mandatory","Switch ID is mandatory");
			resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
		}

		const url = `${config.directiveService.url}/directives/switch/${switch_unid}`;

		var args = {
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			parameters: {
				start_date: start_date,
				due_date: due_date
			}
		};

		restClient.get(url, args, function (data, response) {
			logger.debug("Data is : ", data);
			if (data && data.directive_details) {
				logger.debug(`Found ${data.directive_details.length} directives`);
				data.directive_details.forEach(row => {
					row.cfd_original_status = row.status
					row.cfd_tr_duedatetime = row.due_date

					if (row.completed_by) {
						const user = global.usersList[row.completed_by.toUpperCase()];

						const fname = user && user.fname ? user.fname : '';
						const lname = user && user.lname ? user.lname : '';
						let name;
						if (fname && lname) {
							name = `${lname}, ${fname}`
						}
 
						row.completed_by_name = name;
					}

					if (row.assigned_to) {
						
						const user = global.usersList[row.assigned_to.toUpperCase()];

						const fname = user && user.fname ? user.fname : '';
						const lname = user && user.lname ? user.lname : '';
						let name;
						if (fname && lname) {
							name = `${lname}, ${fname}`
						}
						row.assigned_to_name = name;
					}

				});
				output.directive_count = data.directive_details.length;
				output.directive_details = data.directive_details;
				res.status(200).json(output);
			} else {
				logger.debug(" No directives found for the switch ID");
				err = new error("500", "Internal server error", "No directives found");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			}
		}, function (err) {
			console.log("Error", err)
			logger.debug("Error is : " + err);
			console.log("err", err)
			err = new error("500", "Internal server error", "Error occured while fetching the directives");
			resArray.push(err);
			output.errors = resArray;
			res.status(500).json(output);
		})
    },

	getDirectiveSwitchSummary: function (req, res, next) {

		logger.debug(" Getting directive switch summary for User ");

		var loginId = req.params.loginId;
		var output = {};
		var resArray = new Array();

		if (_.isEmpty(loginId) || loginId == 'undefined' || loginId == 'null') {
			var err = new error("400", "loginId is mandatory", "loginId is mandatory");
			resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
		}

		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader;

		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_recordTotals";
		var duein = (req.query.duein) ? req.query.duein : "EOY";
		var recordtype = (req.query.recordtype) ? req.query.recordtype : "switch";
		var totalsFor = (req.query.totals_for) ? req.query.totals_for : "TASK,DIRECTIVE";

		var role = "";
		if (usersList && usersList[loginId.toUpperCase()]) {
			role = usersList[loginId.toUpperCase()].role;
		}

		if (!role || role == "") {
			var err = new error("500", "Internal server error", "unable to find user/role");
			resArray.push(err);
			output.errors = resArray;
			return res.status(500).json(output);
		}

		var url = config.opsTrackerService.url;
		var args = {
			parameters: {
				api_recordtype: apiRecordType,
				day_span: duein,
				recordtype: recordtype,
				totals_for: totalsFor

			},
			headers: {
				"Accept": "application/json",
				"Authorization": authHeader,
				"Content-Type": "application/json"
			}
		};

		if (role && role.includes('TRANS')) {
			//Added a flag (direlementdept=transport) to pull translations directives. 
			args.parameters["direlementdept"] = "transport";
		}
		
		if (role && role.includes("TRANS")) {
			let dbUrl = `${config.dbService.url}get`;
			let dbArgs = {
				headers: { 'Content-Type': 'application/json' },
				data: {
					"data": {
						"queryParams": {
							"user_id": loginId.toUpperCase()
						},
						"event": "getTransPrefSwitches"
					}
				}
			}
			restClient.post(dbUrl, dbArgs, (data, response) => {
				if (data.result) {
					let switch_unids = '';
					data.result.forEach(item => {
						switch_unids += item.SWITCH_UNID + ','
					});
					args.parameters.siteunid = switch_unids.slice(0, switch_unids.length - 1);
					restClient.get(url, args, function (data, response) {
						if (data && data.data && data.data.listitems) {
							logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
							var items = data.data.listitems;
							var taskcounts = new Array();
							for (var key in items) {
								var value = items[key];
								var outerObj = {};
								var tasksArr = new Array();
								var directivesArr = [];
								outerObj.switch_unid = value.site_info.switch_unid;
								outerObj.switch_name = value.site_info.switch;
								var directives = value["DIRECTIVE"];
								var tasks = value["TASK"];
								var t = new Array();
								for (var k1 in directives) {
									var innerObj = {};
									innerObj.duein = k1.toLowerCase();
									innerObj.task = {};
									innerObj.task.total = directives[k1].totalTasks;
									innerObj.task.done = directives[k1].totalTasksDone;
									innerObj.task.perc = directives[k1].totalTasksPerc;
									directivesArr.push(innerObj);
								}
								for (var k2 in tasks) {
									var innerTaskObj = {};
									innerTaskObj.duein = k2.toLowerCase();
									innerTaskObj.task = {};
									innerTaskObj.task.total = tasks[k2].totalTasks;
									innerTaskObj.task.done = tasks[k2].totalTasksDone;
									innerTaskObj.task.perc = tasks[k2].totalTasksPerc;
									tasksArr.push(innerTaskObj);
								}

								logger.debug("Task Array : ", tasksArr);
								outerObj.directives = directivesArr;
								outerObj.tasks = tasksArr;
								taskcounts.push(outerObj);
							}
							output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
							res.status(200).json(output);
						} else {
							logger.debug("No data found for the User ..");
							err = new error("500", "Internal server error ", "Directives not found for user");
							resArray.push(err);
							output.errors = resArray;
							res.status(500).json(output);
						}
					}, function (err) {
						logger.debug("Error is : " + err);
						err = new error("500", "Internal server error", "Error occured while fetching the directives");
						resArray.push(err);
						output.errors = resArray;
						res.status(500).json(output);
					});
				}
				else {
					logger.debug(" No data found for the Translation user ");
					output.taskcounts = [];
					res.status(200).json(output);
				}
			});
		} else if (role && role.includes("SWITCH")) {
			if (role && (role == "SWITCH_MANAGER" || role == "CELL_SWITCH_MANAGER")) {

				args.parameters.totals_by = "location";
				let switchUrl = config.switchService.url + "/mgr/" + loginId + "/pref"
				let switchargs = {
					headers: { 'Content-Type': 'application/json' }
				};
				restClient.get(switchUrl, switchargs, (data, response) => {
					if (data && data.switches) {
						let switch_unids = '';
						let switchData;
						let switchUserPrefData = []
						data.switches[0].market_level.map(market => {
							switchUserPrefData.push(market)
						})
						data.switches[0].user_selected.map(selected => {
							switchUserPrefData.push(selected)
						})
						switchData = switchUserPrefData
						switchData.forEach(item => {
							switch_unids += item.switch_unid + ','
						});
						args.parameters.siteunid = switch_unids.slice(0, switch_unids.length - 1);
						restClient.get(url, args, function (data, response) {
							if (data && data.data && data.data.listitems) {
								logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
								var items = data.data.listitems;
								var taskcounts = new Array();
								for (var key in items) {
									var value = items[key];
									var outerObj = {};
									var tasksArr = new Array();
									var directivesArr = [];
									outerObj.switch_unid = value.site_info.switch_unid;
									outerObj.switch_name = value.site_info.switch;
									var directives = value["DIRECTIVE"];
									var tasks = value["TASK"];
									var t = new Array();
									for (var k1 in directives) {
										var innerObj = {};
										innerObj.duein = k1.toLowerCase();
										innerObj.task = {};
										innerObj.task.total = directives[k1].totalTasks;
										innerObj.task.done = directives[k1].totalTasksDone;
										innerObj.task.perc = directives[k1].totalTasksPerc;
										directivesArr.push(innerObj);
									}
									for (var k2 in tasks) {
										var innerTaskObj = {};
										innerTaskObj.duein = k2.toLowerCase();
										innerTaskObj.task = {};
										innerTaskObj.task.total = tasks[k2].totalTasks;
										innerTaskObj.task.done = tasks[k2].totalTasksDone;
										innerTaskObj.task.perc = tasks[k2].totalTasksPerc;
										tasksArr.push(innerTaskObj);
									}
	
									logger.debug("Task Array : ", tasksArr);
									outerObj.directives = directivesArr;
									outerObj.tasks = tasksArr;
									taskcounts.push(outerObj);
								}
								output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
								res.status(200).json(output);
							} else {
								logger.debug("No data found for the User ..");
								err = new error("500", "Internal server error ", "Directives not found for user");
								resArray.push(err);
								output.errors = resArray;
								res.status(500).json(output);
							}
						}, function (err) {
							logger.debug("Error is : " + err);
							err = new error("500", "Internal server error", "Error occured while fetching the directives");
							resArray.push(err);
							output.errors = resArray;
							res.status(500).json(output);
						});
					}
					else {
						logger.debug(" No data found for the SWITCH MANAGER user ");
						output.taskcounts = [];
						res.status(200).json(output);
					}
				});
			}
			else if (role == "SWITCH_TECHNICIAN") {

				let switchUrl = config.switchService.url + "/tech/" + loginId + "/pref"
				let switchargs = {
					headers: { 'Content-Type': 'application/json' }
				};
				restClient.get(switchUrl, switchargs, (data, response) => {
					if (data?.switches) {
						let switch_unids = '';
						let switchData;
						let switchUserPrefData = []
						data.switches[0].market_level.map(market => {
							switchUserPrefData.push(market)
						})
						data.switches[0].user_selected.map(selected => {
							switchUserPrefData.push(selected)
						})
						switchData = switchUserPrefData
						switchData.forEach(item => {
							switch_unids += item.switch_unid + ','
						});
						args.parameters.siteunid = switch_unids.slice(0, switch_unids.length - 1);
						restClient.get(url, args, function (data, response) {
							if (data && data.data && data.data.listitems) {
								logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
								var items = data.data.listitems;
								var taskcounts = new Array();
								for (var key in items) {
									var value = items[key];
									var outerObj = {};
									var tasksArr = new Array();
									var directivesArr = [];
									outerObj.switch_unid = value.site_info.switch_unid;
									outerObj.switch_name = value.site_info.switch;
									var directives = value["DIRECTIVE"];
									var tasks = value["TASK"];
									var t = new Array();
									for (var k1 in directives) {
										var innerObj = {};
										innerObj.duein = k1.toLowerCase();
										innerObj.task = {};
										innerObj.task.total = directives[k1].totalTasks;
										innerObj.task.done = directives[k1].totalTasksDone;
										innerObj.task.perc = directives[k1].totalTasksPerc;
										directivesArr.push(innerObj);
									}
									for (var k2 in tasks) {
										var innerTaskObj = {};
										innerTaskObj.duein = k2.toLowerCase();
										innerTaskObj.task = {};
										innerTaskObj.task.total = tasks[k2].totalTasks;
										innerTaskObj.task.done = tasks[k2].totalTasksDone;
										innerTaskObj.task.perc = tasks[k2].totalTasksPerc;
										tasksArr.push(innerTaskObj);
									}
	
									logger.debug("Task Array : ", tasksArr);
									outerObj.directives = directivesArr;
									outerObj.tasks = tasksArr;
									taskcounts.push(outerObj);
								}
								output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
								res.status(200).json(output);
							} else {
								logger.debug("No data found for the User ..");
								err = new error("500", "Internal server error ", "Directives not found for user");
								resArray.push(err);
								output.errors = resArray;
								res.status(500).json(output);
							}
						}, function (err) {
							logger.debug("Error is : " + err);
							err = new error("500", "Internal server error", "Error occured while fetching the directives");
							resArray.push(err);
							output.errors = resArray;
							res.status(500).json(output);
						});
					}
					else {
						logger.debug(" No data found for the SWITCH TECH user ");
						output.taskcounts = [];
						res.status(200).json(output);
					}
				});
			}	
		} else {

			if (role && (role == "MANAGER")) {
				args.parameters.mgrid = loginId;
				args.parameters.totals_by = "location";
			} else if (role && (role == "DIRECTOR")) {
				args.parameters.dirid = loginId;
				args.parameters.totals_by = "location";
			} else {
				args.parameters.techid = loginId;
			}

			restClient.get(url, args, function (data, response) {
				if (data && data.data && data.data.listitems) {
					logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
					var items = data.data.listitems;
					var taskcounts = new Array();
					for (var key in items) {
						var value = items[key];
						var outerObj = {};
						var tasksArr = new Array();
						var directivesArr = [];
						outerObj.switch_unid = value.site_info.switch_unid;
						outerObj.switch_name = value.site_info.switch;
						var directives = value["DIRECTIVE"];
						var tasks = value["TASK"];
						var t = new Array();
						for (var k1 in directives) {
							var innerObj = {};
							innerObj.duein = k1.toLowerCase();
							innerObj.task = {};
							innerObj.task.total = directives[k1].totalTasks;
							innerObj.task.done = directives[k1].totalTasksDone;
							innerObj.task.perc = directives[k1].totalTasksPerc;
							directivesArr.push(innerObj);
						}
						for (var k2 in tasks) {
							var innerTaskObj = {};
							innerTaskObj.duein = k2.toLowerCase();
							innerTaskObj.task = {};
							innerTaskObj.task.total = tasks[k2].totalTasks;
							innerTaskObj.task.done = tasks[k2].totalTasksDone;
							innerTaskObj.task.perc = tasks[k2].totalTasksPerc;
							tasksArr.push(innerTaskObj);
						}

						logger.debug("Task Array : ", tasksArr);
						outerObj.directives = directivesArr;
						outerObj.tasks = tasksArr;
						taskcounts.push(outerObj);
					}
					output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
					res.status(200).json(output);
				} else {
					logger.debug("No data found for the User ..");
					err = new error("500", "Internal server error ", "Directives not found for user");
					resArray.push(err);
					output.errors = resArray;
					res.status(500).json(output);
				}
			}, function (err) {
				logger.debug("Error is : " + err);
				err = new error("500", "Internal server error", "Error occured while fetching the directives");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			});
		}
	},

	getDirectiveSwitchSummary_new : function(req, res, next){
 
        logger.debug(" Getting directive switch summary for User ");
		var output = {};
		var resArray = new Array();
		const duein = (req.query.duein) ? req.query.duein : "EOY";
		const login_id = req.params.loginId

		const url = `${config.directiveService.url}/directives/summary?duein=${duein}&login_id=${login_id}`;
		var args = {
			headers: {
				"Accept" : "application/json",
				"Content-Type": "application/json"
			}
		};
			restClient.get(url, args, function (data, response) {
				logger.debug("Data is : ", data);
				res.status(200).json(data);
			   }, function(err){
				console.log("Error",err)
				   logger.debug("Error is : " + err);
				   console.log("err",err)
				   err = new error("500","Internal server error","Error occured while fetching the directives");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })
    },

	getPMSwitchSummary: function (req, res, next) {

		logger.debug(" Getting PM switch summary for User ");

		var loginId = req.params.loginId;
		var output = {};
		var resArray = new Array();

		if (_.isEmpty(loginId) || loginId == 'undefined' || loginId == 'null') {
			var err = new error("400", "loginId is mandatory", "loginId is mandatory");
			resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
		}

		var authHeader = req.headers.authorization;
		authHeader = config.app.authHeader;

		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_recordTotals";
		var duein = (req.query.duein) ? req.query.duein : "EOY";
		var recordtype = (req.query.recordtype) ? req.query.recordtype : "switch";
		var totalsFor = (req.query.totals_for) ? req.query.totals_for : "PM";

		var role = "";
		if (usersList && usersList[loginId.toUpperCase()]) {
			role = usersList[loginId.toUpperCase()].role;
		}

		if (!role || role == "") {
			var err = new error("500", "Internal server error", "unable to find user/role");
			resArray.push(err);
			output.errors = resArray;
			return res.status(500).json(output);
		}

		var url = config.opsTrackerService.url;
		var args = {
			parameters: {
				api_recordtype: apiRecordType,
				day_span: duein,
				recordtype: recordtype,
				totals_for: totalsFor,

			},
			headers: {
				"Accept": "application/json",
				"Authorization": authHeader,
				"Content-Type": "application/json"
			}
		};

		if (role && role.includes("TRANS")) {
			let dbUrl = `${config.dbService.url}get`;
			let dbArgs = {
				headers: { 'Content-Type': 'application/json' },
				data: {
					"data": {
						"queryParams": {
							"user_id": loginId.toUpperCase()
						},
						"event": "getTransPrefSwitches"
					}
				}
			}
			restClient.post(dbUrl, dbArgs, (data, response) => {
				if (data.result) {
					let switch_unids = '';
					data.result.forEach(item => {
						switch_unids += item.SWITCH_UNID + ','
					});
					args.parameters.siteunid = switch_unids.slice(0, switch_unids.length - 1);

					restClient.get(url, args, function (data, response) {
						if (data && data.data && data.data.listitems) {
							logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
							var items = data.data.listitems;
							var taskcounts = new Array();
							for (var key in items) {
								var value = items[key];
								var outerObj = {};
								var tasksArr = new Array();
								outerObj.switch_unid = value.site_info.switch_unid;
								outerObj.switch_name = value.site_info.switch;
								var pmTasks = value["PM"];
								var t = new Array();
								for (var k1 in pmTasks) {
									var innerObj = {};
									innerObj.duein = k1.toLowerCase();
									innerObj.pm = {};
									innerObj.pm.total = pmTasks[k1].totalTasks;
									innerObj.pm.done = pmTasks[k1].totalTasksDone;
									innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
									tasksArr.push(innerObj);
								}
								logger.debug("Task Array : ", tasksArr);
								outerObj.tasks = tasksArr;
								taskcounts.push(outerObj);
							}
							output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
							res.status(200).json(output);
						} else {
							logger.debug("No data found for the User ..");
							err = ("PM tasks not found");
							resArray.push(err);
							output.errors = resArray;
							res.status(200).json(output);
						}
					}, function (err) {
						logger.debug("Error is : " + err);
						err = new error("500", "Internal server error", "Error occured while fetching the tasks");
						resArray.push(err);
						output.errors = resArray;
						res.status(500).json(output);
					});
				}
			})
		} else if (role && role.includes("SWITCH")) {
			if (role && (role == "SWITCH_MANAGER" || role == "CELL_SWITCH_MANAGER")) {

				args.parameters.totals_by = "location";
				let switchUrl = config.switchService.url + "/mgr/" + loginId + "/pref"
				let switchargs = {
					headers: { 'Content-Type': 'application/json' }
				};

				restClient.get(switchUrl, switchargs, (data, response) => {
					if (data?.switches) {
						let switch_unids = '';
						let switchData;
						let switchUserPrefData = []
						data.switches[0].market_level.map(market => {
							switchUserPrefData.push(market)
						})
						data.switches[0].user_selected.map(selected => {
							switchUserPrefData.push(selected)
						})
						switchData = switchUserPrefData
						switchData.forEach(item => {
							switch_unids += item.switch_unid + ','
						});
						args.parameters.siteunid = switch_unids.slice(0, switch_unids.length - 1);
	
						restClient.get(url, args, function (data, response) {
							if (data && data.data && data.data.listitems) {
								logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
								var items = data.data.listitems;
								var taskcounts = new Array();
								for (var key in items) {
									var value = items[key];
									var outerObj = {};
									var tasksArr = new Array();
									outerObj.switch_unid = value.site_info.switch_unid;
									outerObj.switch_name = value.site_info.switch;
									var pmTasks = value["PM"];
									var t = new Array();
									for (var k1 in pmTasks) {
										var innerObj = {};
										innerObj.duein = k1.toLowerCase();
										innerObj.pm = {};
										innerObj.pm.total = pmTasks[k1].totalTasks;
										innerObj.pm.done = pmTasks[k1].totalTasksDone;
										innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
										tasksArr.push(innerObj);
									}
									logger.debug("Task Array : ", tasksArr);
									outerObj.tasks = tasksArr;
									taskcounts.push(outerObj);
								}
								output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
								res.status(200).json(output);
							} else {
								logger.debug("No data found for the User ..");
								err = ("PM tasks not found");
								resArray.push(err);
								output.errors = resArray;
								res.status(200).json(output);
							}
						}, function (err) {
							logger.debug("Error is : " + err);
							err = new error("500", "Internal server error", "Error occured while fetching the tasks");
							resArray.push(err);
							output.errors = resArray;
							res.status(500).json(output);
						});
					}
				})
			} else if (role == "SWITCH_TECHNICIAN") {
				let switchUrl = config.switchService.url + "/tech/" + loginId + "/pref"
				let switchargs = {
					headers: { 'Content-Type': 'application/json' }
				};
				restClient.get(switchUrl, switchargs, (data, response) => {
					if (data && data.switches) {
						let switch_unids = '';
						let switchData;
						let switchUserPrefData = []
						data.switches[0].market_level.map(market => {
							switchUserPrefData.push(market)
						})
						data.switches[0].user_selected.map(selected => {
							switchUserPrefData.push(selected)
						})
						switchData = switchUserPrefData
						switchData.forEach(item => {
							switch_unids += item.switch_unid + ','
						});
						args.parameters.siteunid = switch_unids.slice(0, switch_unids.length - 1);
	
						restClient.get(url, args, function (data, response) {
							if (data && data.data && data.data.listitems) {
								logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
								var items = data.data.listitems;
								var taskcounts = new Array();
								for (var key in items) {
									var value = items[key];
									var outerObj = {};
									var tasksArr = new Array();
									outerObj.switch_unid = value.site_info.switch_unid;
									outerObj.switch_name = value.site_info.switch;
									var pmTasks = value["PM"];
									var t = new Array();
									for (var k1 in pmTasks) {
										var innerObj = {};
										innerObj.duein = k1.toLowerCase();
										innerObj.pm = {};
										innerObj.pm.total = pmTasks[k1].totalTasks;
										innerObj.pm.done = pmTasks[k1].totalTasksDone;
										innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
										tasksArr.push(innerObj);
									}
									logger.debug("Task Array : ", tasksArr);
									outerObj.tasks = tasksArr;
									taskcounts.push(outerObj);
								}
								output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
								res.status(200).json(output);
							} else {
								logger.debug("No data found for the User ..");
								err = ("PM tasks not found");
								resArray.push(err);
								output.errors = resArray;
								res.status(200).json(output);
							}
						}, function (err) {
							logger.debug("Error is : " + err);
							err = new error("500", "Internal server error", "Error occured while fetching the tasks");
							resArray.push(err);
							output.errors = resArray;
							res.status(500).json(output);
						});
					} else {
								logger.debug("No data found for the Switch ..");
								err = ("PM tasks not found");
								resArray.push(err);
								output.errors = resArray;
								res.status(200).json(output);
					}
				})
		}
	}else {
			if(role && (role == "MANAGER")){
				args.parameters.mgrid = loginId;
				args.parameters.totals_by = "location";
			} else if (role && (role == "DIRECTOR")) {
				args.parameters.dirid = loginId;
				args.parameters.totals_by = "location";
			} else {
				args.parameters.techid = loginId;
			}

			restClient.get(url, args, function (data, response) {
				if (data && data.data && data.data.listitems) {
					logger.debug("Ops tracker request success with %s records", data.data.listitems.length);
					var items = data.data.listitems;
					var taskcounts = new Array();
					for (var key in items) {
						var value = items[key];
						var outerObj = {};
						var tasksArr = new Array();
						outerObj.switch_unid = value.site_info.switch_unid;
						outerObj.switch_name = value.site_info.switch;
						var pmTasks = value["PM"];
						var t = new Array();
						for (var k1 in pmTasks) {
							var innerObj = {};
							innerObj.duein = k1.toLowerCase();
							innerObj.pm = {};
							innerObj.pm.total = pmTasks[k1].totalTasks;
							innerObj.pm.done = pmTasks[k1].totalTasksDone;
							innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
							tasksArr.push(innerObj);
						}
						logger.debug("Task Array : ", tasksArr);
						outerObj.tasks = tasksArr;
						taskcounts.push(outerObj);
					}
					output.taskcounts = req.query.isGsamOffshore == 'true' ? gsamUtil.restrictData(taskcounts,['switch_name']) : taskcounts;
					res.status(200).json(output);
				} else {
					logger.debug("No data found for the User ..");
					err = ("PM tasks not found");
					resArray.push(err);
					output.errors = resArray;
					res.status(200).json(output);
				}
			}, function (err) {
				logger.debug("Error is : " + err);
				err = new error("500", "Internal server error", "Error occured while fetching the tasks");
				resArray.push(err);
				output.errors = resArray;
				res.status(500).json(output);
			});
		}
	},
	
	getPmBySwitch : function(req, res, next) {
		logger.debug(" Getting preventive maintenance tasks for switch ");
		var output = {};
		var switchUnid = req.params.switchUnid;
		var resArray = new Array();
		
		if(_.isEmpty(switchUnid) || switchUnid == 'undefined' || switchUnid == 'null'){
       		err = new error("400","switchUnid is mandatory","switchUnid is mandatory");
       		resArray.push(err);
			output.errors = resArray;
			return res.status(400).json(output);
   		}    

		
		var authHeader = config.app.authHeader; 
				
		var apiOffset = (req.query.api_offset) ? req.query.api_offset : 0;
		var apiSize = (req.query.api_size) ? req.query.api_size : 500;
		var orderBy = (req.query.api_orderby) ? req.query.api_orderby : "duedate" ;
		
		var apiRecordType = (req.query.api_recordtype) ? req.query.api_recordtype : "custom_pmList_v2";
		var showCompleted = (req.query.show_completed) ? req.query.show_completed : "true";
		
		var url = config.opsTrackerService.url;
		
		
		var args = {
				parameters : {
					api_recordtype : apiRecordType,
					api_offset : apiOffset,
					api_size  : apiSize,
					api_orderby : orderBy,
					siteid : switchUnid,
					site_switch :  "switch",  
					show_completed :  showCompleted
				},
				headers : {
					"Accept" : "application/json",
					"Authorization" : authHeader,
					"Content-Type": "application/json" 
				}
		};

		restClient.get(url, args, function(data, response){
				   if(data && data.data && data.data.listitems){
				       logger.debug("Ops tracker request success with %s records", data.data.listitems.length ); 
                        for(var i=0; i < data.data.listitems.length; i++){
                            resArray.push(new pmHeaderSwitch(data.data.listitems[i]));
                        }
                        output.pmlist = resArray;
                        res.status(200).json(output);
				   }else{
					   logger.debug(" No data found for the Switch Unid ");
					   err = new error("500","Internal server error","unable to get PM Headers ");
					   resArray.push(err);
					   output.errors = resArray;
					   res.status(500).json(output);
				   }
			   }, function(err){
				   logger.debug("Error is : " + err);
				   err = new error("500","Internal server error","Error occured while fetching tasks");
				   resArray.push(err);
				   output.errors = resArray;
				   res.status(500).json(output);
			   })

	},

	updateDirective : function(req, res, next){                                                                                            
        logger.debug(" Updating the directive  ", req.body);                                                                                    
        var output = {};                                                                                                                   
        var resArray = new Array();                                                                                                        
        var form = new directiveForm(req, req.body.directive);                                                                                                 
        var errors = form.validate();                                                                                                      
                                                                                                                                           
        if(errors.length > 0){                                                                                                             
            output.errors = errors;                                                                                                        
            return res.status(400).json(output);                                                                                           
        }                                                                                                                                  
                                                                                                                                           
        var args = form.getUpdateParams();                                                                                                 
        var url = config.opsTrackerService.updateUrl;                                                                                      
        restClient.put(url, args, function(data, response){                                                                                
            if(data && data.resultcode == 0){
                logger.debug("Directive updated successfully ");
                output.message = "Directive updated successfully";
                output.directive = req.body.directive;
                res.status(200).json(output);
            }else{
                logger.debug("Error updating the Directive ");
                err = new error("500","Error updating the Directive",data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                res.status(500).json(output);
            }
        }, function(err){
			logger.debug("Error is : " + err);
            err = new error("500","Internal server error ","Error while updating the task");
            resArray.push(err);
            output.errors = resArray;
            res.status(500).json(output);
        });
    },

	updateDirective_new : function(req, res, next){                                                                                            
        logger.debug(" Updating the directive  ", req.body);                                                                                    
        var output = {};                                                                                                                   
        var resArray = new Array();                                                                                                        
        var errors = new Array();  
		const directive = req.body.directive
		if(!directive.pmd_widget_directive_details_id){
			err = new error("400","Directive pmd_widget_directive_details_id mandatory","Directive pmd_widget_directive_details_id is mandatory");
			errors.push(err);
			output.errors = errors;                                                                                                        
            return res.status(400).json(output);
		}                                                                                                                                 

		const args = {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			data: req.body,
		};                                                                                               
		const url = `${config.directiveService.url}/directives`;
        restClient.put(url, args, function(data, response){ 
            if(data){
                logger.debug("Directive updated successfully ");
                res.status(200).json(data);
            }else{
                logger.debug("Error updating the Directive ");
                err = new error("500","Error updating the Directive",data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                res.status(500).json(output);
            }
        }, function(err){
			logger.debug("Error is : " + err);
            err = new error("500","Internal server error ","Error while updating the task");
            resArray.push(err);
            output.errors = resArray;
            res.status(500).json(output);
        });
    },

	bulkUpdateDirectives : async function(req, res, next){                                                                                            
        logger.info(" Bulk Updating the directives  ", req.body);                                                                                    
        let output = {};                                                                                                                   
		let errors = []; 
		let directives = req.body.directives;
		if (!directives || !Array.isArray(directives) || !directives.length > 0) {
			errors.push(new error(400, 'Bad Request', 'No directives sent for bulk updating'))
			output.errors = errors;
			return res.status(400).json(output);  
		}
		
		let forms = [];
		directives.forEach(directive =>
			forms.push({directive: directive, form: new directiveForm(req, directive)})
		);
		
		forms.forEach(formObj =>
			errors.push(...formObj.form.validate())
		); 

        if(errors.length > 0){   
            output.errors = errors;      
            return res.status(400).json(output);                                                                                           
        }
	
		let url = config.opsTrackerService.updateUrl;
		let updateArgs = []
		output.directives = [];
		forms.forEach(formObj =>
			updateArgs.push({directive: formObj.directive, args: formObj.form.getUpdateParams()})
		);
		
		let promises = updateArgs.map(async argsObj => {
			try {
				let promResponse = await axios.put(url, argsObj.args.data, argsObj.args);
				return {res: promResponse, directive: argsObj.directive};
			} catch (err) {
				logger.debug(err);
				let _error = new error(500, 'Ops Tracker Error', `Directive failed to update in Ops Tracker for Switch ${argsObj.directive.switch_name}${err.response && err.response.data ? ' - ' +err.response.data?.resultmessage : ''}`);
				return {error: _error}
			}
		})

		let settledPromises = [];
		try {
			settledPromises = await Promise.all(promises);
		} catch(err) {
			logger.debug(`Error updating Directives in ops tracker`)
			logger.debug(err);
			errors.push(new error('500', 'Internal Server Error', 'Error bulk updating directives in Ops Tracker'));
			output.errors = errors;
			return res.status(500).json(output);
		}

		for (let promise of settledPromises) {
			if (promise.error) {
				errors.push(promise.error);
				output.errors = errors;
			} else {
				output.directives.push({directive: promise.directive, message: `Directive updated successfully for switch ${promise.directive.switch_name}`});
			}
		}
		
		return res.status(200).json(output);
    },

	bulkUpdateDirectives_new: async function (req, res) {
		logger.debug(" Bulk Updating the directives  ", req.body);                                                                                     
		const directives = req.body.directives
		let resArray = []
		let output = {errors:[]}

		const args = {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			data: req.body,
		}; 

		if (!Array.isArray(directives) || directives.length === 0) {
			return res.status(400).json({ error: 'Directives array cannot be empty' });
		}

		const url = `${config.directiveService.url}/directives/bulk`;

		restClient.put(url, args, function(data, response){ 
            if(data && data.directives){
                logger.debug("Bulk Directives updated successfully ");
                res.status(200).json(data);
            }else{
                logger.debug("Error updating the Bulk Directives ");
                err = new error("500","Error updating the Bulk Directives",data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                res.status(500).json(output);
            }
        }, function(err){
			logger.debug("Error is : " + err);
            err = new error("500","Internal server error ","Error while updating the task");
            resArray.push(err);
            output.errors = resArray;
            res.status(500).json(output);
        });
	},

    getUserSiteSummmaryForWws : function(req, res, next){
        
        let output = {};
        let resArray = [];
        let userId = req.params.userid;
        let dueIn = (req.query.duein) ? req.query.duein : "EOY";
        //let totalsFor = "WWS" + new Date().getFullYear();
        let totalsFor = "WWS2017";

        if(!userId || userId === undefined || userId.length == 0){
            let err = new error("400","Bad Request","User id is mandatory");
            resArray.push(err);
            output.errors = resArray;
            return res.status(500).json(output);
        }

        let userInfo = usersList[userId.toUpperCase()];
        if(userInfo === undefined || _.isEmpty(userInfo)){
            let err = new error("400","Bad Request","User not found in IOP");
            resArray.push(err);
            output.errors = resArray;
            return res.status(500).json(output);
        }

        let role = userInfo.role;
        console.log(" User role is : %s", role);
        
        if(role === undefined || role.length == 0 || role != "TECHNICIAN"){
            let err = new error("400","Bad Request","User should be a TECHNICIAN");
            resArray.push(err);
            output.errors = resArray;
            return res.status(500).json(output);
        }
        
        let userField = "techid";

        let url = config.opsTrackerService.url;
        let args = {};
        args.headers = OT_HEADERS;
        args.parameters = {};
        args.parameters.api_recordtype = "custom_recordTotals";
        args.parameters.day_span = dueIn;
        args.parameters[userField] = userId;
        args.parameters.recordtype = "site";
        args.parameters.totals_for = totalsFor;

        restClient.get(url, args, (data, response) => {
            if(data && data.resultcode == 0){
                let records = data.data.listitems;
                for(var key in records){
                    let siteInfo = records[key].site_info;
                    let wwsInfo = records[key][totalsFor]["EOY"];
                    resArray.push(new WwsInfo(siteInfo, wwsInfo));
                }
                output.wwscounts = resArray;
                return res.status(200).json(output); 
            }else{
                logger.debug("Error while getting the data from Ops-tracker : %j", data?.resultmessage);
                let err = new error("500","Server Error Occured","Error while getting the data : " + data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                return res.status(500).json(output);
            } 
        });
    },

    getWwsDetails : function(req, res, next){
        
        let output = {};
        let resArray = [];
        let url = config.opsTrackerService.updateUrl;
        let unid = req.params.unid;
        let args = {};
        //let recordType =  "C2WWS" + new Date().getFullYear();
        let recordType =  "C2WWS2017";
        //let outKey = "wws" + new Date().getFullYear() + "_info";
        let outKey = "wws2017" + "_info";
        args.headers = OT_HEADERS;
        args.parameters = {};
        args.parameters.recordtype = recordType;
        args.parameters.meta_universalid = unid;
        args.parameters.retrieve = "*";
        args.parameters.retrieveformat = "simple";      
        
        restClient.get(url, args, (data, response) =>{
            if(data && data.resultcode == 0 ){
                output[outKey] =  data.fields;
                return res.status(200).json(output);
            }else{
                logger.debug("Error while getting the data from Ops-tracker : %j", data?.resultmessage);
                let err = new error("500","Server Error Occured","Error while getting the data : " + data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                return res.status(500).json(output);
            } 
        });
    },

    updateWwsDetails : function(req, res, next){
        let output = {};
        let resArray = [];
        //let key = "wws" + new Date().getFullYear() + "_info";
        let key = "wws2017"  + "_info";
        let unid = req.params.unid;
        let url = config.opsTrackerService.updateUrl;
	    let reqData = req.body[key];
		let userId = req.body.user_id;
        if(userId === undefined || userId == null || userId.length == 0){
            
            let err = new error("400","Bad Request","User id is mandatory for update ");
            resArray.push(err);
            output.errors = resArray;
            return res.status(500).json(output);
        }

        delete reqData.userid;
 		var args = {
			headers : {
				"Authorization" : config.app.authHeader,
				"Content-Type" : "application/json",
				"Accept" : "application/json",
				"IOPUSERID" : userId
			}
		};

        args.data = {};
        args.data.data = reqData;
        args.data.action = "PUT";
        //args.data.recordtype = "C2WWS" + new Date().getFullYear(); 
        args.data.recordtype = "C2WWS2017"; 
        args.data.recordkeys = {};
        args.data.recordkeys.meta_universalid = reqData.meta_universalid;
        args.data.retrieve = "*";

        restClient.put(url, args, (data, response) => {
            if(data && data.resultcode == 0){
                output.message = "WWS task updated successfully";
                output[key] = reqData;
                return res.status(200).json(output);
            }else{
                logger.debug("Error while udpating the WWS record : %j", data?.resultmessage);
                let err = new error("500","Server Error Occured","Error while updating the data : " + data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                return res.status(500).json(output);
            }
        });
	               
    },

    getUserWwsDashboard : function(req, res, next){
        let output = {};
        let resArray = [];
        let args = {};
        let userId = req.params.userid;
        let url = config.opsTrackerService.url;
        //let recordType = "custom_IOP_WWS" + new Date().getFullYear() + "_Dashboard";
        let recordType = "custom_IOP_WWS" + "2017" + "_Dashboard";

        args.headers = OT_HEADERS;
        args.parameters = {};
        args.parameters.api_recordtype = recordType;
        args.parameters.day_span = "eoy";
        args.parameters.userid = userId;
        args.parameters.includeclosed = false;
        
        restClient.get(url, args, (data, response) => {
           if(data && data.resultcode == 0){
                output.wws_headers = data.data.listitems;
                return res.status(200).json(output);
           }else{
                logger.debug("Error while getting the data from Ops-tracker : %j", data?.resultmessage);
                let err = new error("500","Server Error Occured","Error while getting the data : " + data?.resultmessage);
                resArray.push(err);
                output.errors = resArray;
                return res.status(500).json(output);
           } 
        });
    },

    getTasksForUser : function(req, res, next){
        
        let output = {};
        let resArray = [];
        let self = this;   
        let userId = req.params.user_id;
        let params = {};
        params.siteUserID = userId; 
        
        let statusCode = 200;
        self.getTasksFromOpstracker(params, (err, tasks) => {
            if(err == null){
                output.tasks = tasks;
            }else{
                statusCode = 500;
                output.errors = err;
            }
            res.status(statusCode).json(output);
        });
    },

    getTasksForCalloutZone : function(req, res, next){

        let output = {};
        let resArray = [];
        let self = this;
        let czName = req.params.czname; 
        let params = {};
        params.czname = czName;

        let statusCode = 200;
        self.getTasksFromOpstracker(params, (err, tasks) => {
            if(err == null){
                output.tasks = tasks;
            }else{
                statusCode = 500;
                output.errors = err;
            }
            res.status(statusCode).json(output);
        });

    },

    getTasksForSwitch : function(req, res, next){

        let output = {};
        let resArray = [];
        let self = this;    
		let switchUnid = req.params.switch_unid;
		let dueIn = req.query.duein;
		let includeClosed = req.query.includeclosed;
        let params = {};
		params.switchunid = switchUnid;
		params.duein = dueIn;
		params.includeClosed = includeClosed;

        let statusCode = 200;
        self.getTasksFromOpstracker(params, (err, tasks) => {
            if(err == null){
                output.tasks = tasks;
            }else{
                statusCode = 500;
                output.errors = err;
            }
            res.status(statusCode).json(output);
        });

    },

    getTasksFromOpstracker : function(additionalParams, callback){
        
        let resArray = []; 
        let tasks = {};
        tasks.tasks = [];
		tasks.wws_tasks = [];
		let dueIn = additionalParams.duein;
		let includeClosed = additionalParams.includeClosed;
        let url = config.opsTrackerService.url;
        let args = {
            headers : {
                "Accept" : "application/json",
                "Authorization" : config.app.authHeader,
            },

            parameters : {
                "api_recordtype" : "custom_siteTaskHeaders",
                "api_fields" : "*",
                "day_span" : dueIn? dueIn :"EOY",
				"includeclosed" : includeClosed? includeClosed : 0
            }
        };
        
        /*
        Below are possible parameters for Ops-Tracker
            api_recordtype = custom_siteTaskHeaders
            api_fields = * 
            siteUserID = jacobmi
            day_span = EOY
            switchunid = 338A238E13B14154F6BF99873D176BCF
            czname = CELLS_%20LOUISVILLE/KY%20ZONE%20TWO'
            includeclosed = 0
        */
       
        for(let key in additionalParams){
            args.parameters[key] = additionalParams[key];
        }
        
        restClient.get(url, args, (data, response)=>{
            if(data && data.resultcode == 0){
                let taskList = data.data.listitems;
                let headerTasks = new headerModel(taskList);
                tasks.tasks = headerTasks.tasks;
                tasks.wws_tasks = headerTasks.wws_tasks;                    
            }else{
                logger.debug("Error while getting the task headers for args : %j = %s ", args, data?.resultmessage);
                let err = new error("500", "Server Error Occured", "Error while getting the header data : " + data?.resultmessage);
                resArray.push(err); 
            }
            callback(null, tasks);
        });
    },
	
	updatePMTasksCountAndStatus: function(detail, cb) {
		let today = moment.utc();
		let timeStamp = moment(today).format("YYYY-MM-DD HH:mm:ss");
		let updatingCompletedWidgets = false; 
		const newWidgetDetails = {};
		const existingWidget = {};

		async.series([
			//get  current widget details
			(callback) => {
				let url = config.dbService.url + "/get";
				let args = {
					headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    data: {
                        "data": {
                            "queryParams": {
								"pm_unid": detail.pm_unid,
								"pmd_widget_id": detail.pmd_widget_id
							},
                            "event": "getPMDetails"
                        }
                    }
				};
				restClient.post(url, args, function (data, response) {
                    if (data && response.statusCode === 200) {
						const exisitngWidgetDetails = data.result[0];
						existingWidget.status = exisitngWidgetDetails.STATUS;
						existingWidget.priority = exisitngWidgetDetails.RULE_PRIORITY;
						existingWidget.end_date = exisitngWidgetDetails.END_DATE;
						existingWidget.frequency = exisitngWidgetDetails.FREQUENCY;
						existingWidget.list_name = exisitngWidgetDetails.LIST_NAME;
						existingWidget.num_of_tasks = exisitngWidgetDetails.NUM_OF_TASKS;
						existingWidget.num_of_tasks_done = exisitngWidgetDetails.NUM_OF_TASKS_DONE;
						existingWidget.pm_unid = exisitngWidgetDetails.PM_UNID;
						existingWidget.site_name = exisitngWidgetDetails.SITE_NAME;
						existingWidget.site_unid = exisitngWidgetDetails.SITE_UNID;
						existingWidget.start_date = exisitngWidgetDetails.START_DATE;
						existingWidget.switch_name = exisitngWidgetDetails.SWITCH_NAME;
						existingWidget.switch_unid = exisitngWidgetDetails.SWITCH_UNID;
						existingWidget.assigned_to = exisitngWidgetDetails.ASSIGNED_TO;
                        if(exisitngWidgetDetails.STATUS === "COMPLETE" || exisitngWidgetDetails.STATUS === "COMPLETED"){
							updatingCompletedWidgets = true;
						};
                        callback();
                    } else {
                        logger.info("Failed to updated the count of tasks done for the pm unid" + detail.pm_unid);
                        logger.info("response  :: %j", data);
                        let err = new error("500", "Internal Server Error", "Updated successfully in Ops Tracker but failed to update the task done count in IOP");
                        callback(err);
                    }
                });

			},
			//Update the num of tasks done in the table
			(callback) => {
				if(!updatingCompletedWidgets){
					let url = config.dbService.url + "/get";
					let args = {
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json"
						},
						data: {
							"data": {
								"queryParams": {
									"pm_unid": detail.pm_unid,
									"count": detail.count,
									"now": timeStamp,
									"pmd_widget_id" : detail.pmd_widget_id
								},
								"event": "updatePMTaskCount"
							}
						}
					};
					restClient.post(url, args, function (data, response) {
						if (data && response.statusCode === 200) {
							logger.info("Successfully updated the count of tasks done");
							callback();
						} else {
							logger.info("Failed to updated the count of tasks done for the pm unid" + detail.pm_unid);
							logger.info("response  :: %j", data);
							let err = new error("500", "Internal Server Error", "Updated successfully in Ops Tracker but failed to update the task done count in IOP");
							callback(err);
						}
					});
				}
				else{
					callback();
				}
			},
			//Update PMD Widget Status and add an entry for DDPA
			(callback) => {
					if(detail.isUpdate) {
						async.parallel([
							(cb) => {
								const rcmUrl = config.rcmService.url + '/updatestatustrans';
								const rcmArgs = {
									headers: {
										Accept: 'application/json',
										'Content-Type': 'application/json'
									},
									data: {
										pmd_widget_id: detail.pmd_widget_id,
										work_type: 'PM',
										status: 'COMPLETE',
										actual_status: 'COMPLETED',
										userId: detail.user_id,
										refId: detail.pm_unid,
										re_assigned: (existingWidget.assigned_to === detail.user_id) ? false : true,
										source : 'taskservice_updatePMTasksCountAndStatus'
									}
								};
								restClient.post(rcmUrl, rcmArgs, function (rcmData, rcmResponse) {
									if (rcmResponse && rcmResponse.statusCode == 200) {
										cb();
									} else {
										const errmsg = rcmData && rcmData.detail ? "Updated Successfully in ops tracker but " + rcmData.detail :
											"Updated Successfully in ops tracker but failed to update the widget status"
										logger.info(errmsg + " for the pm unid" + detail.pm_unid);
										logger.info("response  :: %j", rcmData);
										let err = new error("500", "Internal Server Error", errmsg);
										cb(err);
									}
								});

							},
							(cb) => {

								let url = config.dbService.url + "/get";
								let args = {
									headers: {
										"Content-Type": "application/json",
										"Accept": "application/json"
									},
									data : {
										"data": {
										"queryParams" : {
											pmd_widget_id : detail.pmd_widget_id,
											 status : 'COMPLETED',
											 "now": timeStamp 
										},
										"event": "updatePMDWidgetStatus"
										}
									}
								};
								restClient.post(url,args,(data,response) => {
									if(data && response.statusCode == 200) {
										logger.info("Successfully updated the pmd widget id status");
                        				cb();
									} else {
										let err = new error('500','Server Error',"Updated Successfully in ops tracker but failed to update the widget status");
										cb(err);
									}
								});
							}
						],
							(err, result)=>{
								if(err){
								  callback(err);
								}
								else{
								  callback();
								} });
						
				  } else 
				if(updatingCompletedWidgets){
					  async.series([
						//add pmd widget details
						callbackFunc => {
							let url = config.dbService.url + "/insert";
							let args = {
								headers: {
									"Content-Type": "application/json",
									"Accept": "application/json"
								},
								data: {
									"data": {
										"queryParams": {
											"switch_unid" : existingWidget.switch_unid,
											"site_unid": existingWidget.site_unid,
											"widget_type_name": 'PM',
											"assigned_to" : detail.user_id,
											"status" : 'IN PROGRESS',
											"priority" : existingWidget.priority,
											"created_on" : moment.utc().format('YYYY-MM-DD HH:mm:ss')
										},
										"event": "createWidgetForPM"
									}
								}
							};
							newWidgetDetails.uuid =  uuidv4();
							args.data.data.queryParams.uuid = newWidgetDetails.uuid;
							restClient.post(url, args, (data, response) => {
								if(response.statusCode===200){
									callbackFunc();
								}
								else{
									let err = new error("500", "Internal Server Error", "Updated successfully in Opstracker but cannot create new widget for the PM");
									callbackFunc(err);
								}
							});


						},
						// get  PMD Widget ID by uuid
						callbackFunc => {

							let url = config.dbService.url + "/get";
							let args = {
								headers: {
									"Content-Type": "application/json",
									"Accept": "application/json"
								},
								data : {
									"data": {
									"queryParams" : {uuid : newWidgetDetails.uuid},
									"event": "getWidgetByUuid"
									}
								}
							};
							restClient.post(url,args,(data,response) => {
								if(data && response.statusCode == 200) {
									newWidgetDetails.pmd_widget_id = data.result[0].PMD_WIDGET_ID;
								  callbackFunc();
								} else {
								  let err = new error('500','Server Error',"Error occurred while getting the widget ID with uuid="+widgetparams.wparams.uuid);
								  callbackFunc(err);
								}
							  });

						},
						// insert pmd widget details
						callbackFunc => {
							let url = config.dbService.url + "/insert";
							let args = {
								headers: {
									"Content-Type": "application/json",
									"Accept": "application/json"
								},
								data: {
									"data" : {
										"queryParams": {
											"pmd_widget_id": newWidgetDetails.pmd_widget_id,
											"created_on" : moment.utc().format('YYYY-MM-DD HH:mm:ss'),
											"end_date" : existingWidget.end_date ? moment(existingWidget.end_date).format('YYYY-MM-DD HH:mm:ss') : "",
											"frequency" : existingWidget.frequency,
											"list_name" : existingWidget.list_name,
											"num_of_tasks" : existingWidget.num_of_tasks,
											"num_of_tasks_done" : detail.count,
											"pm_unid" : existingWidget.pm_unid,
											"site_name" : existingWidget.site_name,
											"site_unid" : existingWidget.site_unid,
											"start_date" : existingWidget.start_date ? moment(existingWidget.start_date).format('YYYY-MM-DD HH:mm:ss') : "",
											"switch_name" : existingWidget.switch_name,
											"switch_unid" : existingWidget.switch_unid,
										},
										"event": "insertPMDWidgetPMDetails"
									},
									
								}
							};
							restClient.post(url, args, (data, response) => {
								if(response.statusCode===200){
									callbackFunc();
								}
								else{
									let err = new error("500", "Internal Server Error", "Updated successfully in Opstracker but cannot create new widget for the PM");
									callbackFunc(err);
								}
							});

						},
						// add entry for ddpa
						callbackFunc => {
							const url = config.rcmService.url + '/updatestatustrans';
							const args = {
								headers: {
									Accept: 'application/json',
									'Content-Type': 'application/json'
								},
								data: {
									pmd_widget_id: newWidgetDetails.pmd_widget_id,
									work_type: 'PM',
									status: 'WIP',
									actual_status: 'IN PROGRESS',
									userId: detail.user_id,
									refId: existingWidget.pm_unid,
									re_assigned: (existingWidget.assigned_to === detail.user_id) ? false : true,
									source : 'taskservice_updatePMTasksCountAndStatus'
								}
							};
							restClient.post(url, args, (data, response) => {
								if(response.statusCode===200){
									callbackFunc();
								}
								else{
									let err = new error("500", "Internal Server Error", "Unable to update the widget status trans");
									callbackFunc(err);
								}
							});
						}

					  ], (err, result)=>{
						  if(err){
							callback(err);
						  }
						  else{
							callback();
						  }
					  });
				  }
				  else{
					callback();
				  }
			},
			//Add audit information
			(callback) => {
				if (detail.isUpdate || updatingCompletedWidgets) {
					let url = config.dbService.url + "/insert";
					let args = {
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json"
						},
						data: {
							"data": {
								"queryParams": {
									"pmd_widget_id": detail.isUpdate ? detail.pmd_widget_id : newWidgetDetails.pmd_widget_id,
									"text": detail.isUpdate ? `Work Item closed by ${detail.user_name ? detail.user_name : detail.user_id}` : 
															  `Work Item created by ${detail.user_name ? detail.user_name : detail.user_id}`,
									"user_id": detail.user_id,
									"created_on": timeStamp
								},
								"event": "addWidgetAudit"
							}
						}
					};
					restClient.post(url, args, function (data, response) {
						if (data && response.statusCode === 200) {
							logger.info("Successfully added the audit");
							callback();
						} else {
							logger.info("Failed to update the audit for the pm unid" + detail.pm_unid);
							logger.info("response  :: %j", data);
							let err = new error("500", "Internal Server Error", "Updated successfully in Ops Tracker but failed to update the audit in IOP");
							callback(err);
						}
					});
				} 
				else {
					callback();
				}
			}
		], (err, result) => {
                if (err) {
                    cb(err, null);
                } else {
                    cb(null, {message: "Successfully updated the number of tasks done and widget status"});
                }
            })
	},

	updatePMTasksCountAndStatus_task: function(detail, cb) {
		let today = moment.utc();
		let timeStamp = moment(today).format("YYYY-MM-DD HH:mm:ss");
		let updatingCompletedWidgets = false; 
		const newWidgetDetails = {};
		const existingWidget = {};

		async.series([
			//get  current widget details
			(callback) => {
				let url = config.dbService.url + "/get";
				let args = {
					headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    data: {
                        "data": {
                            "queryParams": {
								"pm_unid": detail.pm_unid,
								"pmd_widget_id": detail.pmd_widget_id
							},
                            "event": "getPMDetails"
                        }
                    }
				};
				restClient.post(url, args, function (data, response) {
                    if (data && response.statusCode === 200) {
						const exisitngWidgetDetails = data.result[0];
						existingWidget.status = exisitngWidgetDetails.STATUS;
						existingWidget.priority = exisitngWidgetDetails.RULE_PRIORITY;
						existingWidget.end_date = exisitngWidgetDetails.END_DATE;
						existingWidget.frequency = exisitngWidgetDetails.FREQUENCY;
						existingWidget.list_name = exisitngWidgetDetails.LIST_NAME;
						existingWidget.num_of_tasks = exisitngWidgetDetails.NUM_OF_TASKS;
						existingWidget.num_of_tasks_done = exisitngWidgetDetails.NUM_OF_TASKS_DONE;
						existingWidget.pm_unid = exisitngWidgetDetails.PM_UNID;
						existingWidget.site_name = exisitngWidgetDetails.SITE_NAME;
						existingWidget.site_unid = exisitngWidgetDetails.SITE_UNID;
						existingWidget.start_date = exisitngWidgetDetails.START_DATE;
						existingWidget.switch_name = exisitngWidgetDetails.SWITCH_NAME;
						existingWidget.switch_unid = exisitngWidgetDetails.SWITCH_UNID;
						existingWidget.assigned_to = exisitngWidgetDetails.ASSIGNED_TO;
                        if(exisitngWidgetDetails.STATUS === "COMPLETE" || exisitngWidgetDetails.STATUS === "COMPLETED"){
							updatingCompletedWidgets = true;
						};
                        callback();
                    } else {
                        logger.info("Failed to updated the count of tasks done for the pm unid" + detail.pm_unid);
                        logger.info("response  :: %j", data);
                        let err = new error("500", "Internal Server Error", "Updated successfully in Ops Tracker but failed to update the task done count in IOP");
                        callback(err);
                    }
                });

			},
			//Update the num of tasks done in the table
			(callback) => {
				if(!updatingCompletedWidgets){
					let url = config.dbService.url + "/get";
					let args = {
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json"
						},
						data: {
							"data": {
								"queryParams": {
									"pm_unid": detail.pm_unid,
									"count": detail.count,
									"now": timeStamp,
									"pmd_widget_id" : detail.pmd_widget_id
								},
								"event": "updatePMTaskCount"
							}
						}
					};
					restClient.post(url, args, function (data, response) {
						if (data && response.statusCode === 200) {
							logger.info("Successfully updated the count of tasks done");
							callback();
						} else {
							logger.info("Failed to updated the count of tasks done for the pm unid" + detail.pm_unid);
							logger.info("response  :: %j", data);
							let err = new error("500", "Internal Server Error", "Updated successfully in Ops Tracker but failed to update the task done count in IOP");
							callback(err);
						}
					});
				}
				else{
					callback();
				}
			},
			//Update PMD Widget Status and add an entry for DDPA
			(callback) => {
					if(detail.isUpdate) {
						async.parallel([
							(cb) => {
								const rcmUrl = config.rcmService.url + '/updatestatustrans';
								const rcmArgs = {
									headers: {
										Accept: 'application/json',
										'Content-Type': 'application/json'
									},
									data: {
										pmd_widget_id: detail.pmd_widget_id,
										work_type: 'PM',
										status: 'COMPLETE',
										actual_status: 'COMPLETED',
										userId: detail.user_id,
										refId: detail.pm_unid,
										re_assigned: (existingWidget.assigned_to === detail.user_id) ? false : true,
										source : 'taskservice_updatePMTasksCountAndStatus'
									}
								};
								restClient.post(rcmUrl, rcmArgs, function (rcmData, rcmResponse) {
									if (rcmResponse && rcmResponse.statusCode == 200) {
										cb();
									} else {
										const errmsg = rcmData && rcmData.detail ? "Updated Successfully in ops tracker but " + rcmData.detail :
											"Updated Successfully in ops tracker but failed to update the widget status"
										logger.info(errmsg + " for the pm unid" + detail.pm_unid);
										logger.info("response  :: %j", rcmData);
										let err = new error("500", "Internal Server Error", errmsg);
										cb(err);
									}
								});

							},
							(cb) => {

								let url = config.dbService.url + "/get";
								let args = {
									headers: {
										"Content-Type": "application/json",
										"Accept": "application/json"
									},
									data : {
										"data": {
										"queryParams" : {
											pmd_widget_id : detail.pmd_widget_id,
											 status : 'COMPLETED',
											 "now": timeStamp 
										},
										"event": "updatePMDWidgetStatus"
										}
									}
								};
								restClient.post(url,args,(data,response) => {
									if(data && response.statusCode == 200) {
										logger.info("Successfully updated the pmd widget id status");
                        				cb();
									} else {
										let err = new error('500','Server Error',"Updated Successfully in ops tracker but failed to update the widget status");
										cb(err);
									}
								});
							}
						],
							(err, result)=>{
								if(err){
								  callback(err);
								}
								else{
								  callback();
								} });
						
				  } else 
				if(updatingCompletedWidgets){
					  async.series([
						//add pmd widget details
						callbackFunc => {
							let url = config.dbService.url + "/insert";
							let args = {
								headers: {
									"Content-Type": "application/json",
									"Accept": "application/json"
								},
								data: {
									"data": {
										"queryParams": {
											"switch_unid" : existingWidget.switch_unid,
											"site_unid": existingWidget.site_unid,
											"widget_type_name": 'PM',
											"assigned_to" : detail.user_id,
											"status" : 'IN PROGRESS',
											"priority" : existingWidget.priority,
											"created_on" : moment.utc().format('YYYY-MM-DD HH:mm:ss')
										},
										"event": "createWidgetForPM"
									}
								}
							};
							newWidgetDetails.uuid =  uuidv4();
							args.data.data.queryParams.uuid = newWidgetDetails.uuid;
							restClient.post(url, args, (data, response) => {
								if(response.statusCode===200){
									callbackFunc();
								}
								else{
									let err = new error("500", "Internal Server Error", "Updated successfully in Opstracker but cannot create new widget for the PM");
									callbackFunc(err);
								}
							});


						},
						// get  PMD Widget ID by uuid
						callbackFunc => {

							let url = config.dbService.url + "/get";
							let args = {
								headers: {
									"Content-Type": "application/json",
									"Accept": "application/json"
								},
								data : {
									"data": {
									"queryParams" : {uuid : newWidgetDetails.uuid},
									"event": "getWidgetByUuid"
									}
								}
							};
							restClient.post(url,args,(data,response) => {
								if(data && response.statusCode == 200) {
									newWidgetDetails.pmd_widget_id = data.result[0].PMD_WIDGET_ID;
								  callbackFunc();
								} else {
								  let err = new error('500','Server Error',"Error occurred while getting the widget ID with uuid="+widgetparams.wparams.uuid);
								  callbackFunc(err);
								}
							  });

						},
						// insert pmd widget details
						callbackFunc => {
							let url = config.dbService.url + "/insert";
							let args = {
								headers: {
									"Content-Type": "application/json",
									"Accept": "application/json"
								},
								data: {
									"data" : {
										"queryParams": {
											"pmd_widget_id": newWidgetDetails.pmd_widget_id,
											"created_on" : moment.utc().format('YYYY-MM-DD HH:mm:ss'),
											"end_date" : existingWidget.end_date ? moment(existingWidget.end_date).format('YYYY-MM-DD HH:mm:ss') : "",
											"frequency" : existingWidget.frequency,
											"list_name" : existingWidget.list_name,
											// "num_of_tasks" : existingWidget.num_of_tasks,
											// "num_of_tasks_done" : detail.count,
											"pm_unid" : existingWidget.pm_unid,
											"site_name" : existingWidget.site_name,
											"site_unid" : existingWidget.site_unid,
											"start_date" : existingWidget.start_date ? moment(existingWidget.start_date).format('YYYY-MM-DD HH:mm:ss') : "",
											"switch_name" : existingWidget.switch_name,
											"switch_unid" : existingWidget.switch_unid,
										},
										"event": "insertPMDWidgetPMDetails"
									},
									
								}
							};
							restClient.post(url, args, (data, response) => {
								if(response.statusCode===200){
									callbackFunc();
								}
								else{
									let err = new error("500", "Internal Server Error", "Updated successfully in Opstracker but cannot create new widget for the PM");
									callbackFunc(err);
								}
							});

						},
						// add entry for ddpa
						callbackFunc => {
							const url = config.rcmService.url + '/updatestatustrans';
							const args = {
								headers: {
									Accept: 'application/json',
									'Content-Type': 'application/json'
								},
								data: {
									pmd_widget_id: newWidgetDetails.pmd_widget_id,
									work_type: 'PM',
									status: 'WIP',
									actual_status: 'IN PROGRESS',
									userId: detail.user_id,
									refId: existingWidget.pm_unid,
									re_assigned: (existingWidget.assigned_to === detail.user_id) ? false : true,
									source : 'taskservice_updatePMTasksCountAndStatus'
								}
							};
							restClient.post(url, args, (data, response) => {
								if(response.statusCode===200){
									callbackFunc();
								}
								else{
									let err = new error("500", "Internal Server Error", "Unable to update the widget status trans");
									callbackFunc(err);
								}
							});
						}

					  ], (err, result)=>{
						  if(err){
							callback(err);
						  }
						  else{
							callback();
						  }
					  });
				  }
				  else{
					callback();
				  }
			},
			//Add audit information
			(callback) => {
				if (detail.isUpdate || updatingCompletedWidgets) {
					let url = config.dbService.url + "/insert";
					let args = {
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json"
						},
						data: {
							"data": {
								"queryParams": {
									"pmd_widget_id": detail.isUpdate ? detail.pmd_widget_id : newWidgetDetails.pmd_widget_id,
									"text": detail.isUpdate ? `Work Item closed by ${detail.user_name ? detail.user_name : detail.user_id}` : 
															  `Work Item created by ${detail.user_name ? detail.user_name : detail.user_id}`,
									"user_id": detail.user_id,
									"created_on": timeStamp
								},
								"event": "addWidgetAudit"
							}
						}
					};
					restClient.post(url, args, function (data, response) {
						if (data && response.statusCode === 200) {
							logger.info("Successfully added the audit");
							callback();
						} else {
							logger.info("Failed to update the audit for the pm unid" + detail.pm_unid);
							logger.info("response  :: %j", data);
							let err = new error("500", "Internal Server Error", "Updated successfully in Ops Tracker but failed to update the audit in IOP");
							callback(err);
						}
					});
				} 
				else {
					callback();
				}
			}
		], (err, result) => {
                if (err) {
                    cb(err, null);
                } else {
                    cb(null, {message: "Successfully updated the number of tasks done and widget status"});
                }
            })
	}
}
