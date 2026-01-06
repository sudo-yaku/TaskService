var _= require('lodash');
var error = require(rootdir+'/model/Error');

var taskForm = function(request){
    
    var requestBody = request.body.task;

    this.method = request.method; 
    this.authHeader = config.app.authHeader;
    this.id = requestBody.task_unid;
    this.userId = requestBody.userid;
    this.site_unid = requestBody.site_unid;

    this.formData = {};
    this.formData.performer_comments = (requestBody.performer_comments)? requestBody.performer_comments : "" ;
    this.formData.status = (requestBody.status) ? requestBody.status : "";
    this.formData.completed_on = (requestBody.completed_on) ? requestBody.completed_on : "";
    this.formData.udf_numeric_1 = (requestBody.udf_numeric_1) ? requestBody.udf_numeric_1 : "";
    this.formData.udf_numeric_2 = (requestBody.udf_numeric_2) ? requestBody.udf_numeric_2 : "";
    this.formData.udf_text_1 = (requestBody.udf_text_1) ? requestBody.udf_text_1 : "";
    this.formData.udf_text_2 = (requestBody.udf_text_2) ? requestBody.udf_text_2 : "";
    
};

//validate the request here
taskForm.prototype.validate = function () {
    var errors = new Array();

    if (_.isEmpty(this.id) || this.id == 'undefined' || this.id == 'null') {
        err = new error("400", "Task id mandatory", "Task id is mandatory");
        errors.push(err);
    }

    if (_.isEmpty(this.userId) || this.userId == 'undefined' || this.userId == 'null') {
        err = new error("400", "User id mandatory", "User id is mandatory");
        errors.push(err);
    }

/*    if (_.isEmpty(this.site_unid) || this.site_unid == 'undefined' || this.site_unid == 'null') {
        err = new error("400", "Bad Request", "site_unid is required");
        errors.push(err);
    }
    */

   return errors;
}

//form the data and headers to be sent for update request
taskForm.prototype.getUpdateParams = function(){
    var args = {};
      
    //headers
    var headers = {};
    headers["Content-Type"] = "application/json";
    headers.Accept = "application/json";
    headers.IOPUSERID = this.userId;
    //headers.Authorization = this.authHeader;
    headers.Authorization = config.app.authHeader;
    
    var data = {};
    data.action = this.method;
    data.recordtype = "C2VZWTask";
    data.recordkeys = {"meta_universalid" : this.id};
    data.retrieve = "meta_universalid";
    
    //Actual data to be updated
    data.data = this.formData;
    
    args.data = data;
    args.headers = headers;
    return args;
}

module.exports = taskForm;
