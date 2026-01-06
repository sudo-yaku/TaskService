var _ = require('lodash');
var jwt  = require('jsonwebtoken'); // used to create, sign, and verify tokens
var restClient =  require(rootdir+'/util/RestClient');

var AuthUtil = function(){
    logger.debug("Initializing Auth util");
};

AuthUtil.prototype.populateUsersInMap = function(){
    var url = config.userService.url + "/all/memory/";
    var args = {
        headers : {
            "Accept" : "application/json",
            "Authorization" : config.app.authHeader
        }
    }   
    restClient.get(url, args, function(data, response){
        if(!_.isEmpty(data) && !_.isEmpty(data.users)){
            global.usersList = data.users;
        }else{
            logger.debug("User list is empty")
        }
    });
},

AuthUtil.prototype.isValidUser = function(request){
    var result = {};
    result.code = 0;
    result.data = {};
    result.message = "User authenticated successfully";

    if(!config.app.authEnabled){
        return result;
    }
    
    var cookies = this.parseCookies(request);
    var token = cookies["IOP_AUTH"];
        
    if (!_.isEmpty(token)) {
        jwt.verify(token, config.auth.secret, function(err, decoded) { 
            if(err){
                result.code = 1;
                result.message = err;
            } else {
                logger.debug("Decoded value is %j", decoded);
                if(decoded && decoded.login_id){
                    var loginId = decoded.login_id.toUpperCase();
                    if(!_.isEmpty(usersList[loginId])){
                        result.data = usersList[loginId];
                    }
                }else{
                    result.code = 3;
                    result.message = "User not found in the decoded token";
                }                
            }
        });
    } else {
        result.code = 4;
        result.message = "No token provided";
    }
    logger.debug("Result is : %j", result); 
    return result;
},

AuthUtil.prototype.parseCookies = function (request) {
    var list = {},
    rc = request.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}    
    
module.exports = new AuthUtil();