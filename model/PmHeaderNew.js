const moment = require('moment');
var PmHeaderNew = function(obj){

    if(obj === undefined){
        return construct();
    }
    this.listname = obj.LISTNAME;
    this.frequency = obj.FREQUENCY;
    this.switch = obj.SWITCH_NAME;
    this.site_name = obj.SITE_NAME;
    this.site_unid = obj.SITE_UNID;
    this.task_status = obj.TASK_STATUS;
    this.startdate = moment(obj.START_DATE).format('YYYY-MM-DD HH:mm:SS');
    this.stopdate = moment(obj.STOP_DATE).format('YYYY-MM-DD HH:mm:SS');
    this.pm_unid = obj.PM_UNID;
    this.pmd_widget_id = obj.PMD_WIDGET_ID;
    this.widget_status = obj.STATUS;
};

var construct = function(){

};

module.exports = PmHeaderNew;
