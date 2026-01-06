var WwsSiteSummary = function(siteInfo, wwsInfo){

    this.site_unid = siteInfo.site_unid; 
    this.siteid = siteInfo.cell_num + "";
    this.site_name = siteInfo.site_name;
    this.switch = siteInfo.switch;
    this.total = wwsInfo.totalTasks;
    this.done = wwsInfo.totalTasksDone;
    this.perc = wwsInfo.totalTasksPerc;

}

module.exports = WwsSiteSummary;
