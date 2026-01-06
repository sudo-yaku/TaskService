var PmTask  = function(obj){
    
    if(obj === undefined) return construct();

    this.availablestatuses = obj.availablestatuses;    
    this.category = obj.category;
    this.cfd_helptext_converted = obj.cfd_helptext_converted;
    this.cfd_origcrc = obj.cfd_origcrc;
    this.cfd_origlastupdate = obj.cfd_origlastupdate;
    this.cfd_specific_task_definition =(Array.isArray(obj.cfd_specific_task_definition)) ? {} : obj.cfd_specific_task_definition ;
    this.comments = obj.comments;
    this.defaultstatus = obj.defaultstatus;
    this.isdone = obj.isdone;
    this.meta_createddate = obj.meta_createddate;
    this.meta_createdby = obj.meta_createdby;
    this.meta_lastupdatedate = obj.meta_lastupdatedate;
    this.meta_lastupdateby = obj.meta_lastupdateby;
    this.task_unid = obj.meta_universalid;
    this.sortorder = obj.sortorder;
    this.pm_unid = obj.source_universalid;
    this.specifictask = obj.specifictask;
    this.specifictask_value = obj.specifictask_value;
    this.status = obj.status;
    this.statusidstamp = obj.statusidstamp;
    this.statusnamestamp = obj.statusnamestamp;
    this.statustimestamp = obj.statustimestamp;
    this.statusvendor_id = obj.statusvendor_id;
    this.statusvendor_name =  obj.statusvendor_name;
    this.taskname =  obj.taskname;
    this.widgetStatus = obj.pmd_status;
    this.widgetId = obj.pmd_widget_id;

  }
 
    var construct  = function(){
    };
    
    module.exports = PmTask;
