var _= require('lodash');                                                                                                                  
var error = require(rootdir+'/model/Error');                                                                                               

var directiveForm = function(request, directive){                                                                                                     
                                                                                                                                           
    var requestBody = directive;                                                                                              
    this.method = request.method;                                                                                                          
    this.authHeader = config.app.authHeader;                                                                                               
    this.id = requestBody.directive_unid;                                                                                                  
    this.userId = requestBody.userid;                                                                                                      
                                                                                                                                           
    this.formData = {};                                                                                                                    
    this.formData.performer_comments = (requestBody.performer_comments)? requestBody.performer_comments : "" ;                             
    this.formData.status = (requestBody.status) ? requestBody.status : "";                                                                 
    this.formData.completed_on = (requestBody.completed_on) ? requestBody.completed_on : "";                                               
                                                                                                                                           
};                                                                                                                                         
                                                                                                                                           
//validate the request here                                                                                                                
directiveForm.prototype.validate = function () {
   var errors = new Array();
   if(_.isEmpty(this.id) || this.id == 'undefined' || this.id == 'null'){
       err = new error("400","Directive id mandatory","Directive id is mandatory");
       errors.push(err);
   }
                                                                                                                                           
   if(_.isEmpty(this.userId) || this.userId == 'undefined' || this.userId == 'null'){
       err = new error("400","User id mandatory","User id is mandatory");
       errors.push(err);
   }
   return errors; 
}

//form the data and headers to be sent for update request
directiveForm.prototype.getUpdateParams = function(){
    var args = {};
    //headers
    var headers = {};
    headers["Content-Type"] = "application/json";
    headers.Accept = "application/json";
    headers.IOPUSERID = this.userId;
    headers.Authorization = this.authHeader;

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

module.exports = directiveForm;