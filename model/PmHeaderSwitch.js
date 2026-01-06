var PmHeader = function(obj){

    if(obj === undefined){
        return construct();
    }
    this.listname = obj.listname;
    this.frequency = obj.frequency;
    this.switch = obj.switch;
    //this.switch_name = obj.site_name;
    this.switch_name = obj.switch;
    this.switch_unid = obj.site_unid;
    //==============================================================
    // pass the switch_unid in lie of the site_unid for switch users
    // https://onejira.verizon.com/browse/IOP-32644
    this.site_unid = obj.site_unid; 
    //==============================================================    
    this.numtasks = obj.numtasks;
    this.numtasksdone = obj.numtasksdone;
    this.startdate = obj.startdate;
    this.stopdate = obj.stopdate;
    this.pm_unid = obj.meta_universalid;
};

var construct = function(){

};

module.exports = PmHeader;
