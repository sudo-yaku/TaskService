var restClient = require(rootdir + '/util/RestClient');
var async = require('async');
var util = require('util');
var moment = require('moment');
var error = require(rootdir + '/model/Error');
var _ = require('lodash');

var TaskHelper = function() {};

TaskHelper.prototype.getMgrSummaryFromCache = function(mgrId,type, callback) {
  let cacheArgs = {
    parameters: {
      args: "{mgr_id : '" + mgrId + "',type : '" + type + "'}",
      entity: "mgr_pm_task_wo_summary"
    },
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };
  /*if (!config.cacheService.enabled) {
    return callback(null, null);
  }*/

  let cacheUrl = config.cacheService.url;
  restClient.get(cacheUrl, cacheArgs, function(data, response) {
    callback(data, response);
  });
}

TaskHelper.prototype.getMgrSummaryFromOps = function(mgrId,type,authHeader,apiRecordType,duein,recordtype,totalsFor, callback) {
  let output = {};
  let resArray = new Array();
  let url = config.opsTrackerService.url;
  let args = {
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
      let taskData = {};
      taskData.summary = data.data.listitems;
      taskData.mgr_id = mgrId;
      taskData.type = type;
      TaskHelper.prototype.saveMgrSummaryInCache(taskData, function(cacheData,cacheResponse){
        output.data = data.data.listitems;
        callback(output,null);
      });
    }else{
      let err = new error("500","Internal server error","Error occured while fetching the data");
      resArray.push(err);
      output.errors = resArray;
      callback(output,null);
    }
  }, function(err){
    logger.debug("Error is : " + err);
    err = new error("500","Internal server error","Error occured while fetching the data");
    resArray.push(err);
    output.errors = resArray;
    callback(output,null);
  });
}

TaskHelper.prototype.saveMgrSummaryInCache = function(data, callback) {
  let entity = "mgr_pm_task_wo_summary";
  let cacheUrl = config.cacheService.url + "?&entity=" + entity;
  let args = {
    data: {data : [data]},
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };
  restClient.post(cacheUrl, args, function(err, records) {
    if (!_.isEmpty(err)) {
      logger.debug(" Error while saving the data in cache ..", err);
      callback(null,null);
    } else {
      logger.debug(" Data saved in cache successfully .. ");
      callback(null,null);
    }
  });
}

TaskHelper.prototype.formatMgrSummaryResponse = function(data,type, callback) {
  let output = {};
  let resArray = new Array();
  let items = data;
  let taskcounts = new Array();
  if(type == "TASK"){
    for(let key in items){
      let value = items[key];
      let outerObj = {};
      let taskMap = {};
      let tasksArr = new Array();
      outerObj.techid = key;
      let tasks = value[type];
      let t = new Array();
      for(let k1 in tasks){
        let innerObj = {};
        innerObj.duein = k1.toLowerCase();
        innerObj.task = {};
        innerObj.task.total = tasks[k1].totalTasks;
        innerObj.task.done = tasks[k1].totalTasksDone;
        innerObj.task.perc = tasks[k1].totalTasksPerc;
        taskMap[k1] = innerObj;
      }

      let dirTasks = value["DIRECTIVE"];
      console.log("Task Value - directive : %j",  dirTasks);
      for(let k2 in dirTasks){
          if( taskMap[k2] ){
            let inObj = taskMap[k2];
            let innerObj = {};
            innerObj.duein = inObj.duein;
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks + inObj.task.total;
            innerObj.task.done = dirTasks[k2].totalTasksDone + inObj.task.done;
            if( innerObj.task.total > 0 ){
                innerObj.task.perc = ( innerObj.task.done / innerObj.task.total ) * 100;
            } else {
                innerObj.task.perc = 100;
            }
            tasksArr.push(innerObj);
          } else {
            let innerObj = {};
            innerObj.duein = k2.toLowerCase();
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks;
            innerObj.task.done = dirTasks[k2].totalTasksDone;
            innerObj.task.perc = dirTasks[k2].totalTasksPerc;
            tasksArr.push(innerObj);
          }
      }
      logger.debug("Task Array : ",  tasksArr);
      outerObj.tasks = tasksArr;
      taskcounts.push(outerObj);
    }
  }else if(type == "PM"){
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
  }
  output.taskcounts = taskcounts;
  callback(output,null);
}

TaskHelper.prototype.getTechSummaryFromCache = function(techId,type, callback) {
  let cacheArgs = {
    parameters: {
      args: "{techid : '" + techId + "',type : '" + type + "'}",
      entity: "tech_pm_task_wo_summary"
    },
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };

  let cacheUrl = config.cacheService.url;
  restClient.get(cacheUrl, cacheArgs, function(data, response) {
    callback(data, response);
  });
}

TaskHelper.prototype.getTechSummaryFromOps = function(techId,type,authHeader,apiRecordType,duein,recordtype,totalsFor, callback) {
  let output = {};
  let resArray = new Array();
  let url = config.opsTrackerService.url;
  let args = {
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
      let taskData = {};
      taskData.summary = data.data.listitems;
      taskData.techid = techId;
      taskData.type = type;
      TaskHelper.prototype.saveTechSummaryInCache(taskData, function(cacheData,cacheResponse){
        output.data = data.data.listitems;
        callback(output,null);
      });
    }else{
      let err = new error("500","Internal server error","Error occured while fetching the data");
      resArray.push(err);
      output.errors = resArray;
      callback(output,null);
    }
  }, function(err){
    logger.debug("Error is : " + err);
    err = new error("500","Internal server error","Error occured while fetching the data");
    resArray.push(err);
    output.errors = resArray;
    callback(output,null);
  });
}

TaskHelper.prototype.saveTechSummaryInCache = function(data, callback) {
  let entity = "tech_pm_task_wo_summary";
  let cacheUrl = config.cacheService.url + "?&entity=" + entity;
  let args = {
    data: {data : [data]},
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };
  restClient.post(cacheUrl, args, function(err, records) {
    if (!_.isEmpty(err)) {
      logger.debug(" Error while saving the data in cache ..", err);
      callback(null,null);
    } else {
      logger.debug(" Data saved in cache successfully .. ");
      callback(null,null);
    }
  });
}

TaskHelper.prototype.formatTechSummaryResponse = function(data,type, callback) {
  let output = {};
  let resArray = new Array();
  let items = data;
  let taskcounts = new Array();
  if(type == "TASK"){
    for(let key in items){
      let value = items[key];
      let outerObj = {};
      let taskMap = {};
      let tasksArr = new Array();
      outerObj.site_unid = value.site_info.site_unid;
      outerObj.siteid = "" + parseInt(value.site_info.cell_num);
      outerObj.site_name = value.site_info.site_name;
      outerObj.switch = value.site_info.switch;
      let tasks = value[type];
      let t = new Array();
      for(let k1 in tasks){
        let innerObj = {};
        innerObj.duein = k1.toLowerCase();
        innerObj.task = {};
        innerObj.task.total = tasks[k1].totalTasks;
        innerObj.task.done = tasks[k1].totalTasksDone;
        innerObj.task.perc = tasks[k1].totalTasksPerc;
        taskMap[k1] = innerObj;
      }

      let dirTasks = value["DIRECTIVE"];
      //console.log("Task Value - directive : %j",  dirTasks);
      for(let k2 in dirTasks){
          if( taskMap[k2] ){
            let inObj = taskMap[k2];
            let innerObj = {};
            innerObj.duein = inObj.duein;
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks + inObj.task.total;
            innerObj.task.done = dirTasks[k2].totalTasksDone + inObj.task.done;
            if( innerObj.task.total > 0 ){
                innerObj.task.perc = ( innerObj.task.done / innerObj.task.total ) * 100;
            } else {
                innerObj.task.perc = 100;
            }
            tasksArr.push(innerObj);
          } else {
            let innerObj = {};
            innerObj.duein = k2.toLowerCase();
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks;
            innerObj.task.done = dirTasks[k2].totalTasksDone;
            innerObj.task.perc = dirTasks[k2].totalTasksPerc;
            tasksArr.push(innerObj);
          }
      }

      //logger.debug("Task Array : ",  tasksArr);
      outerObj.tasks = tasksArr;
      taskcounts.push(outerObj);
    }
  }else if(type == "PM"){
    for(let key in items){
      let value = items[key];
      let outerObj = {};
      let tasksArr = new Array();
      outerObj.site_unid = value.site_info.site_unid;
      outerObj.siteid = "" + parseInt(value.site_info.cell_num);
      outerObj.site_name = value.site_info.site_name;
      outerObj.switch = value.site_info.switch;
      let pmTasks = value[type];
      let t = new Array();
      for(let k1 in pmTasks){
        let innerObj = {};
        innerObj.duein = k1.toLowerCase();
        innerObj.pm = {};
        innerObj.pm.total = pmTasks[k1].totalTasks;
        innerObj.pm.done = pmTasks[k1].totalTasksDone;
        innerObj.pm.perc = pmTasks[k1].totalTasksPerc;
        tasksArr.push(innerObj);
      }
      //logger.debug("Task Array : ",  tasksArr);
      outerObj.tasks = tasksArr;
      taskcounts.push(outerObj);
    }
  }
  output.taskcounts = taskcounts;
  callback(output,null);
}

TaskHelper.prototype.getMgrSiteSummaryFromCache = function(mgrId,type, callback) {
  let cacheArgs = {
    parameters: {
      args: "{mgr_id : '" + mgrId + "',type : '" + type + "'}",
      entity: "mgr_pm_task_wo_summary"
    },
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };

  let cacheUrl = config.cacheService.url;
  restClient.get(cacheUrl, cacheArgs, function(data, response) {
    callback(data, response);
  });
}

TaskHelper.prototype.getMgrSiteSummaryFromOps = function(mgrId,type,authHeader,apiRecordType,duein,recordtype,totalsFor,totals_by, callback) {
  let output = {};
  let resArray = new Array();
  let url = config.opsTrackerService.url;
  let args = {
    parameters : {
      api_recordtype : apiRecordType,
      day_span : duein,
      mgrid : mgrId,
      recordtype :  recordtype,
      totals_for : totalsFor,
      totals_by : totals_by
    },
    headers : {
      "Accept" : "application/json",
      "Authorization" : authHeader,
      "Content-Type": "application/json"
    }
  };
  restClient.get(url, args, function(data, response){
    if(data && data.data && data.data.listitems){
      let taskData = {};
      taskData.summary = data.data.listitems;
      taskData.mgr_id = mgrId;
      taskData.type = type;
      TaskHelper.prototype.saveMgrSiteSummaryInCache(taskData, function(cacheData,cacheResponse){
        output.data = data.data.listitems;
        callback(output,null);
      });
    }else{
      let err = new error("500","Internal server error","Error occured while fetching the data");
      resArray.push(err);
      output.errors = resArray;
      callback(output,null);
    }
  }, function(err){
    logger.debug("Error is : " + err);
    err = new error("500","Internal server error","Error occured while fetching the data");
    resArray.push(err);
    output.errors = resArray;
    callback(output,null);
  });
}

TaskHelper.prototype.saveMgrSiteSummaryInCache = function(data, callback) {
  let entity = "mgr_pm_task_wo_summary";
  let cacheUrl = config.cacheService.url + "?&entity=" + entity;
  let args = {
    data: {data : [data]},
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };
  restClient.post(cacheUrl, args, function(err, records) {
    if (!_.isEmpty(err)) {
      logger.debug(" Error while saving the data in cache ..", err);
      callback(null,null);
    } else {
      logger.debug(" Data saved in cache successfully .. ");
      callback(null,null);
    }
  });
}

TaskHelper.prototype.formatMgrSiteSummaryResponse = function(data,type, callback) {
  let output = {};
  let resArray = new Array();
  let items = data;
  let taskcounts = new Array();
  if(type == "TASK"){
    for(let key in items){
      let value = items[key];
      let outerObj = {};
      let taskMap = {};
      let tasksArr = new Array();
      outerObj.siteid = value.site_info.site_id+"";
      outerObj.site_unid = value.site_info.site_unid;
      outerObj.site_name = value.site_info.site_name;
      outerObj.switch = value.site_info.switch;
      let tasks = value[type];
      let t = new Array();
      for(let k1 in tasks){
        let innerObj = {};
        innerObj.duein = k1.toLowerCase();
        innerObj.task = {};
        innerObj.task.total = tasks[k1].totalTasks;
        innerObj.task.done = tasks[k1].totalTasksDone;
        innerObj.task.perc = tasks[k1].totalTasksPerc;
        taskMap[k1] = innerObj;
      }

      let dirTasks = value["DIRECTIVE"];
      console.log("Task Value - directive : %j",  dirTasks);
      for(let k2 in dirTasks){
          if( taskMap[k2] ){
            let inObj = taskMap[k2];
            let innerObj = {};
            innerObj.duein = inObj.duein;
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks + inObj.task.total;
            innerObj.task.done = dirTasks[k2].totalTasksDone + inObj.task.done;
            if( innerObj.task.total > 0 ){
                innerObj.task.perc = ( innerObj.task.done / innerObj.task.total ) * 100;
            } else {
                innerObj.task.perc = 100;
            }
            tasksArr.push(innerObj);
          } else {
            let innerObj = {};
            innerObj.duein = k2.toLowerCase();
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks;
            innerObj.task.done = dirTasks[k2].totalTasksDone;
            innerObj.task.perc = dirTasks[k2].totalTasksPerc;
            tasksArr.push(innerObj);
          }
      }
      logger.debug("Task Array : ",  tasksArr);
      outerObj.tasks = tasksArr;
      taskcounts.push(outerObj);
    } 
  }else if(type == "PM"){
    for(let key in items){
      let value = items[key];
      let outerObj = {};
      let tasksArr = new Array();
      outerObj.siteid = value.site_info.site_id+"";
      outerObj.site_unid = value.site_info.site_unid;
      outerObj.site_name = value.site_info.site_name;
      outerObj.switch = value.site_info.switch;
      let pmTasks = value[type];
      let t = new Array();
      for(let k1 in pmTasks){
        let innerObj = {};
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
  }
  output.taskcounts = taskcounts;
  callback(output,null);
}

TaskHelper.prototype.getCalloutZoneSummaryFromCache = function(czname,type, callback) {
  let cacheArgs = {
    parameters: {
      args: "{czname : '" + czname + "',type : '" + type + "'}",
      entity: "czone_pm_task_wo_summary"
    },
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };


  let cacheUrl = config.cacheService.url;
  restClient.get(cacheUrl, cacheArgs, function(data, response) {
    callback(data, response);
  });
}

TaskHelper.prototype.getCalloutZoneSummaryFromOps = function(czname,type,authHeader,apiRecordType,duein,recordtype,totalsFor, callback) {
  let output = {};
  let resArray = new Array();
  let url = config.opsTrackerService.url;
  let args = {
    parameters : {
      api_recordtype : apiRecordType,
      day_span : duein,
      calloutzone : czname,
      recordtype :  recordtype,
      totals_for : totalsFor,
      api_orderby : "site_name",
      api_order : "asc",
      api_size : 1000,
      api_offset : 0
    },
    headers : {
      "Accept" : "application/json",
      "Authorization" : authHeader,
      "Content-Type": "application/json"
    }
  };
  restClient.get(url, args, function(data, response){
    if(data && data.data && data.data.listitems){
      let taskData = {};
      taskData.summary = data.data.listitems;
      taskData.czname = czname;
      taskData.type = type;
      TaskHelper.prototype.saveCalloutZoneSummaryInCache(taskData, function(cacheData,cacheResponse){
        output.data = data.data.listitems;
        callback(output,null);
      });
    }else{
      let err = new error("500","Internal server error","Error occured while fetching the data");
      resArray.push(err);
      output.errors = resArray;
      callback(output,null);
    }
  }, function(err){
    logger.debug("Error is : " + err);
    err = new error("500","Internal server error","Error occured while fetching the data");
    resArray.push(err);
    output.errors = resArray;
    callback(output,null);
  });
}

TaskHelper.prototype.saveCalloutZoneSummaryInCache = function(data, callback) {
  let entity = "czone_pm_task_wo_summary";
  let cacheUrl = config.cacheService.url + "?&entity=" + entity;
  let args = {
    data: {data : [data]},
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };
  restClient.post(cacheUrl, args, function(err, records) {
    if (!_.isEmpty(err)) {
      logger.debug(" Error while saving the data in cache ..", err);
      callback(null,null);
    } else {
      logger.debug(" Data saved in cache successfully .. ");
      callback(null,null);
    }
  });
}

TaskHelper.prototype.formatCalloutZoneSummaryResponse = function(data,type, callback) {
  let output = {};
  let resArray = new Array();
  let items = data;
  let taskcounts = new Array();
  if(type == "TASK"){
    for(let key in items){
      let outerObj = {};
      let taskMap = {};
      let tasksArr = new Array();
      outerObj.site_unid = items[key]["site_info"].site_unid;
      outerObj.siteid = "" + items[key]["site_info"].cell_num;
      outerObj.site_name = items[key]["site_info"].site_name;
      outerObj.switch = items[key]["site_info"].switch;
      let tasks = items[key][type];
      for(let k1 in tasks){
        let innerObj = {};
        innerObj.duein = k1.toLowerCase();
        innerObj.task = {};
        innerObj.task.total = tasks[k1].totalTasks;
        innerObj.task.done = tasks[k1].totalTasksDone;
        innerObj.task.perc = tasks[k1].totalTasksPerc;
        taskMap[k1] = innerObj;
      }

      let dirTasks = items[key]["DIRECTIVE"];
      console.log("Task Value - directive : %j",  dirTasks);
      for(let k2 in dirTasks){
          if( taskMap[k2] ){
            let inObj = taskMap[k2];
            let innerObj = {};
            innerObj.duein = inObj.duein;
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks + inObj.task.total;
            innerObj.task.done = dirTasks[k2].totalTasksDone + inObj.task.done;
            if( innerObj.task.total > 0 ){
                innerObj.task.perc = ( innerObj.task.done / innerObj.task.total ) * 100;
            } else {
                innerObj.task.perc = 100;
            }
            tasksArr.push(innerObj);
          } else {
            let innerObj = {};
            innerObj.duein = k2.toLowerCase();
            innerObj.task = {};
            innerObj.task.total = dirTasks[k2].totalTasks;
            innerObj.task.done = dirTasks[k2].totalTasksDone;
            innerObj.task.perc = dirTasks[k2].totalTasksPerc;
            tasksArr.push(innerObj);
          }
      }
      logger.debug("Task Array : ",  tasksArr);
      outerObj.tasks = tasksArr;
      taskcounts.push(outerObj);
    }
  }else if(type == "PM"){
    for(let key in items){
      let outerObj = {};
      outerObj.site_unid = items[key]["site_info"].site_unid;
      outerObj.siteid = "" + items[key]["site_info"].cell_num;
      outerObj.site_name = items[key]["site_info"].site_name;
      outerObj.switch = items[key]["site_info"].switch;
      let pmTasks = items[key][type];
      let tasksArr = new Array();
      for(let k1 in pmTasks){
        let innerObj = {};
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
  }
  output.taskcounts = taskcounts;
  callback(output,null);
}

module.exports = new TaskHelper();
