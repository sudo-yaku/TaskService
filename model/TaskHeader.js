global.config = require('config')
var TaskHeader = function(objArr){
    
    if( objArr === undefined ) return construct();
        this.tasks = [];
        this.wws_tasks = [];
        
        for(let i=0; i< objArr.length; i++){
            let obj = objArr[i];
            let o  = {};
            o.task_name = obj.tr_taskname;
            o.task_category = obj.tr_category;
            o.request_unid = obj.tr_meta_universalid;
            o.start_time = obj.tr_startdatetime;
            o.start_days_away = obj.tr_startdate_daysaway;
            o.due_date = obj.tr_duedatetime;
            o.requestor_id = obj.tr_requestor_id;
            o.requestor_name = obj.tr_requestor_name;
            o.request_status = obj.tr_status;
            o.site_name = obj.site_name;
            o.switch = obj.switch;
            o.task_unid = obj.task_meta_universalid;
            o.site_unid = obj.site_universalid ;
            o.switch_unid = obj.switch_universalid;
            o.callout_zone = obj.v_zone_name;
            o.task_status = obj.task_status;
            o.ref_table_2 = obj.ref_table_2;
            o.ref_unid_2 = obj.ref_unid_2;                      
            o.performer_name = obj.performer_name;
            o.tech_id = obj.tech_id;
            o.tech_name = obj.tech_name;
            o.manager_id = obj.techmanager_id;
            o.manager_name = obj.techmanager_name;
            o.director_id = obj.techdirector_id;
            o.director_name = obj.techdirector_name;
            o.tech_disabled = obj.tech_disabled;
            if(obj.ref_table_2 == "WWS_2017"){
                this.wws_tasks.push(o);
            }else{
                this.tasks.push(o);
            }
        }
};

var construct = function(){
}

module.exports = TaskHeader;
