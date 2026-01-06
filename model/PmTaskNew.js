const moment = require('moment');

var PmTaskNew  = function(obj){
    
    if(obj === undefined) return construct();

    this.availablestatuses = ["I", "P", "F", "NA"];
    this.category = obj.CATEGORY;
    this.cfd_helptext_converted = obj.HELPTEXT;
    this.comments = obj.COMMENTS;
    this.meta_createddate = obj.CREATED_DATE;
    this.meta_lastupdatedate = obj.LAST_UPDATED_DATE;
    this.meta_lastupdateby = obj.LAST_UPDATED_BY;
    this.task_unid = obj.TASK_UNID;
    this.pm_unid = obj.PM_UNID;
    this.specifictask = obj.SPECIFIC_TASK;
    this.specifictask_value = obj.SPECIFIC_TASK_VALUE;
    this.status = obj.TASK_STATUS;
    this.taskname =  obj.TASK_NAME;
    this.widget_status = obj.STATUS;
    this.pmd_widget_id =obj.PMD_WIDGET_ID;
    this.assigned_to = obj.ASSIGNED_TO;
    
    this.start_stop_info = {
      status :obj.STATUS,
      user_id:obj.ASSIGNED_TO,
      username:(usersList && usersList[obj.ASSIGNED_TO.toUpperCase()]) 
            ? (usersList[obj.ASSIGNED_TO.toUpperCase()].fname + " " + usersList[obj.ASSIGNED_TO.toUpperCase()].lname) 
            : "",
            datetime:moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    if(obj.STATUS=="NEW" || obj.STATUS=="PAUSED")
    {
      this.start_stop_info.start_stop_actions= ["START"];
    }else if(obj.STATUS=="IN PROGRESS")
    {
      this.start_stop_info.start_stop_actions= ["PAUSE", "COMPLETE"];
    }else
    {
      this.start_stop_info.start_stop_actions= [];
    }
  }
 
    var construct  = function(){
    };
    
    module.exports = PmTaskNew;
