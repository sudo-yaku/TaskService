var Client = require('node-rest-client').Client;
var constants = require('constants');
var util = require('util');
const traceId = require('@iop/ms-corelib')
const Error = require("../model/Error");
const DefaultTimeOut = 30000; //30 seconds
const RequestDefaultTimeOut = config?.timeout?.requestTimeout || DefaultTimeOut;
const ResponseDefaultTimeOut = config?.timeout?.responseTimeout || DefaultTimeOut;


var RestClient = function(){
	this.client = new Client({
        requestConfig: {
            timeout: RequestDefaultTimeOut //request timeout
        },
        responseConfig: {
            timeout: ResponseDefaultTimeOut//response timeout
        }
    });
};

let getFinalTraceId = function() { ///common method to call rtracer for the coreLib
    let final_trace_id = traceId.CoreUtils.getReqControlId(); //reqid to trace
    let obj ={ "X-Request-Id":final_trace_id ? final_trace_id:"","Content-Type": "application/json"  }
    return obj   
} 
RestClient.prototype.get =  function(url, args, callback, errorHandler){
	let finalTraceId = getFinalTraceId();
    var requestId = finalTraceId || Math.floor(100000000 + Math.random() * 900000000);
	args.headers= { ...finalTraceId, ...args.headers};

	args = getDefualtRequestArgs(args);
	//var requestId = Math.floor(100000000 + Math.random() * 900000000);
	var metaInfo = {
		"GET_REQUEST_ID" : requestId,
		"GET_URL" : url,
		"GET_ARGS" : args
	};	
	logger.debug(metaInfo);
	var req = this.client.get(url,args, function(data, response){
		if(url.indexOf("/all/memory") < 0){
			metaInfo.GET_DATA = (data && data["0"]) ? data.toString('utf-8') : data; 
		}
//		logger.debug(metaInfo);
		callback(data,response);
	});
	req.on('requestTimeout', function (req) {
        logger.info('Request time out');
        req.destroy();
    });
	
	//Handle the error here
	req.on('error', function (err) {
        metaInfo.GET_ERROR = err;
		logger.info(metaInfo);
        if(errorHandler && typeof errorHandler === "function"){
		    errorHandler(err);
        }
		else {
            callback(null, { response: { statusCode: 500, statusMessage: "Error while processing get request"  } });
        }
	});
};

RestClient.prototype.post = function(url, args, callback, errorHandler){
	let finalTraceId = getFinalTraceId();
    var requestId = finalTraceId || Math.floor(100000000 + Math.random() * 900000000);
	args.headers= { ...finalTraceId, ...args.headers};
	
    args = getDefualtRequestArgs(args);
    //var requestId = Math.floor(100000000 + Math.random() * 900000000);
	var metaInfo = {
		"POST_REQUEST_ID" : requestId,
		"POST_URL" : url,
		"POST_ARGS" : args
	};	
	logger.debug(metaInfo);

	var req = this.client.post(url,args, function(data, response){
		metaInfo.POST_DATA = (data && data["0"]) ? data.toString('utf-8') : data; 
		//logger.debug(metaInfo);
		callback(data,response);
	});

	req.on('requestTimeout', function (req) {
        logger.info('Request time out');
        req.destroy();
    });
	
	//Handle the error here
	req.on('error', function (err) {
        metaInfo.POST_ERROR = err;
		logger.info(metaInfo);
		if(errorHandler && typeof errorHandler === "function"){
		    errorHandler(err);
        }
		else {
            callback(null, { response: { statusCode: 500, statusMessage: "Error while processing post request" } });
        }
	});
};

RestClient.prototype.put = function(url, args, callback, errorHandler){
	let finalTraceId = getFinalTraceId();
    var requestId = finalTraceId || Math.floor(100000000 + Math.random() * 900000000);
	args.headers= { ...finalTraceId, ...args.headers};
	
	args = getDefualtRequestArgs(args);
    //var requestId = Math.floor(100000000 + Math.random() * 900000000);
	var metaInfo = {
		"PUT_REQUEST_ID" : requestId,
		"PUT_URL" : url,
		"PUT_ARGS" : args
	};	
	logger.debug(metaInfo);
	var req = this.client.put(url,args, function(data, response){
		metaInfo.PUT_DATA = (data && data["0"]) ? data.toString('utf-8') : data; 
		//logger.debug(metaInfo);
		callback(data,response);
	});

	req.on('requestTimeout', function (req) {
        logger.info('Request time out');
        req.destroy();
    });
	
	//Handle the error here
	req.on('error', function (err) {
        metaInfo.PUT_ERROR = err;
		logger.info(metaInfo);
        if(errorHandler && typeof errorHandler === "function"){
		    errorHandler(err);
        }else {
            callback(null, { response: { statusCode: 500, statusMessage: "Error while processing put request" } });
        }
	});
};

RestClient.prototype.remove = function(url, args, callback, errorHandler){
	let finalTraceId = getFinalTraceId();
    var requestId = finalTraceId || Math.floor(100000000 + Math.random() * 900000000);
	args.headers= { ...finalTraceId, ...args.headers};
	
	args = getDefualtRequestArgs(args);
    //var requestId = Math.floor(100000000 + Math.random() * 900000000);
	var metaInfo = {
		"DELETE_REQUEST_ID" : requestId,
		"DELETE_URL" : url,
		"DELETE_ARGS" : args
	};	
	logger.debug(metaInfo);
	var req = this.client.delete(url,args, function(data, response){
		metaInfo.DELETE_DATA = (data && data["0"]) ? data.toString('utf-8') : data; 
		logger.debug(metaInfo);
		callback(data,response);
	});

	req.on('requestTimeout', function (req) {
        logger.info('Request time out');
        req.destroy();
    });
	
	//Handle the error here
	req.on('error', function (err) {
        metaInfo.DELETE_ERROR = err;
		logger.info(metaInfo);
		if(errorHandler && typeof errorHandler === "function"){
		    errorHandler(err);
        }else {
            callback(null, { response: { statusCode: 500, statusMessage: "Error while processing delete request" } });
        }
	});
};

/**
 * sets headers of args to there defualts
 * @param {RequestArgs} args
 * @return args with there defualts
 */
 function getDefualtRequestArgs(args) {
    /**
     *  Added for default timeout JIRA number
     */
    args = args || {};
    let requestTimeout = args?.requestConfig?.timeout || RequestDefaultTimeOut;
    let responseTimeout = args?.responseConfig?.timeout || ResponseDefaultTimeOut;
    args = {
        ...args,
        requestConfig: {
            timeout: requestTimeout
        },
        responseConfig: {
            timeout: responseTimeout
        }
    }

    return {
        headers: {
            ...(args && args.headers),
            'Accept': (args && args.headers && args.headers['Accept']) || 'application/json',
            'Content-Type': (args && args.headers && args.headers['Content-Type']) || 'application/json'
        },
        ...args
    }
}


module.exports = new RestClient();
