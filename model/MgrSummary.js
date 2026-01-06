var TaskSummary = function(obj){
    this.techId = obj.techId;
    this.tasks = new Array();
    this.tasks.push(new tasks());
}

var pm = function(obj){
    this.total = obj.total;
    this.done = obj.done;
    this.perc = obj.perc;
}

var task = function(obj){
    this.total = obj.total;
    this.done = obj.done;
    this.perc = obj.perc;
}

var tasks = function(obj){
    this.duein = obj.duein;
    this.pm = obj.pm;
    this.task = obj.task;
}

module.exports = TaskSummary;