var _= require('lodash');
var error = require(rootdir+'/model/Error');

var pmTaskForm = function(request){
    
    var requestBody = _.clone(request.body.pm, true);
    this.pmtasks = requestBody.pmtasks;
    this.site_unid = requestBody.site_unid;
    var completeCount = 0;
    var techIdAndName = {};

    var fData = {};
    fData.pm = {};
    fData.pm.pm_unid = requestBody.pm_unid;
    fData.pm.userid = requestBody.userid;
    fData.pm.format = "IOP";
    fData.pm.hide_completed = true;
    fData.pm.pmtasks = new Array();
    
    _(this.pmtasks).forEach(function(value){
        value.meta_universalid = value.task_unid;
        completeCount = value.status !== 'I' ? completeCount + 1 : completeCount;
        if(value.meta_lastupdateby && value.statusnamestamp)
            techIdAndName[value.meta_lastupdateby] = value.statusnamestamp;
       //_.unset(value, 'task_unid');
       fData.pm.pmtasks.push(value);
    });
    this.formData = fData;
    this.updateStatusTrans = completeCount === fData.pm.pmtasks.length;
    this.completeCount = completeCount;
    this.techIdAndName = techIdAndName;
};

//validate the request here
pmTaskForm.prototype.validate = function () {
   var errors = new Array();

/*    if (_.isEmpty(this.site_unid) || this.site_unid == 'undefined' || this.site_unid == 'null') {
        err = new error("400", "Bad Request", "site_unid is required");
        errors.push(err);
    }
    */

   return errors;
}

//form the data and headers to be sent for update request
pmTaskForm.prototype.getUpdateParams = function(){
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

module.exports = pmTaskForm;
