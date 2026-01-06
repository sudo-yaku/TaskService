const moment = require('moment');
var _= require('lodash');
var error = require(rootdir+'/model/Error');

var pmSingleTaskForm = function(request, paused){
    
    var requestBody = _.clone(request.body, true);
    this.site_unid = requestBody.site_unid;
    this.switch_unid = requestBody.switch_unid;
    this.frequency=requestBody.frequency;
    this.start_date=requestBody.start_date;
    this.stop_date=requestBody.stop_date;
    this.switch_name=requestBody.switch_name;
    this.site_name=requestBody.site_name;

    var fData = {};
    fData.pm = {};
    fData.pm.pm_unid = requestBody.pm_unid;
    fData.pm.userid = requestBody.user_id;
    fData.pm.pm_unid = requestBody.pm_unid;
    fData.pm.format = "IOP";
    fData.pm.hide_completed = true;
    fData.pm.pmtasks = new Array();

    let pmobj = {
    meta_universalid: requestBody.task_unid,
    cfd_origcrc:requestBody.cfd_origcrc,
    cfd_origlastupdate:moment().utc().format('YYYY-MM-DD HH:mm:ss'), 
    comments: requestBody.comments,
    specifictask: requestBody.specifictask,
    specifictask_value: requestBody.specifictask_value, 
    
   }
   if (paused == false){
       pmobj.status = requestBody.status;
       pmobj.statusidstamp = requestBody.user_id;
        pmobj.statustimestamp = moment().utc().format("YYYY-MM-DD HH:mm:ss");
   }
    fData.pm.pmtasks.push(pmobj);
   
    this.formData = fData;
    
};


//validate the request here
pmSingleTaskForm.prototype.validate = function () {
    var errors = new Array();
 
 /*    if (_.isEmpty(this.site_unid) || this.site_unid == 'undefined' || this.site_unid == 'null') {
         err = new error("400", "Bad Request", "site_unid is required");
         errors.push(err);
     }
     */
 
    return errors;
 }
 
 //form the data and headers to be sent for update request
 pmSingleTaskForm.prototype.getUpdateParams = function(){
     var args = {};
       
     //headers
     var headers = {};
     headers["Content-Type"] = "application/json";
     headers.Accept = "application/json";
     headers.IOPUSERID = this.formData.pm.userid;
     headers.Authorization = config.app.authHeader;    
     
     var data = {};
     //Actual data to be updated
     args.data = this.formData;
     args.headers = headers;
     return args;
 }

module.exports = pmSingleTaskForm;
