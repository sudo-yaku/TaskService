var Error = function(status,title,detail){
	this.status = status;
	this.title = title;
	this.detail = detail;
}

module.exports = Error;