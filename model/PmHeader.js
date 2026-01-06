const moment = require('moment');
var PmHeader = function(obj){

    if(obj === undefined){
        return construct();
    }
    this.listname = obj.LISTNAME;
    this.frequency = obj.FREQUENCY;
    this.switch = obj.SWITCH;
    this.site_name = obj.SITE_NAME;
    this.site_unid = obj.SITE_UNID;
    this.numtasks = obj.NUMTASKS;
    this.numtasksdone = obj.NUMTASKSDONE;
    this.startdate = moment(obj.STARTDATE).format('YYYY-MM-DD HH:mm:SS');
    this.stopdate = moment(obj.ENDDATE).format('YYYY-MM-DD HH:mm:SS');
    this.pm_unid = obj.META_UNIVERSALID;
    this.pmd_widget_id = obj.PMD_WIDGET_ID;
    this.pmd_widget_status = obj.STATUS;
};

var construct = function(){

};

module.exports = PmHeader;
