var urlParser = require('url');
var http = require('http');
var md5 = require('MD5');

/*
	Flybase class
	@database {String}
    @collection {String}
	@key {String} :: get your key from http://app.flybase.io/
*/
function Flybase(database, collection, apikey) {
	this.apikey = apikey;
	this.query = {};
	this.database = database;
	this.collection = collection;
	this.currentItem;
	this.debug = false;
	this.mockconsole = mockconsole();

	this.sessionId;
	this.room = md5( database + '/' + collection ); 		//	this will be a hash of the room..
	this.uri = urlParser.parse('http://api.flybase.io/apps/');
	this.push_uri = urlParser.parse('https://push.flybase.io');
	this.startWebSocket( this.room );
};

// ======================================================
// FUNCTIONS
// ======================================================

function SHA1(str) {
	var sum = require('crypto').createHash('sha1');
	sum.update(str);
	return sum.digest('hex');
}

/*
	Check if string is JSON object
	@value {String}
	return {Object}
*/
function parseJSON(value) {
	if (isJSON(value))
		return JSON.parse(value);
	return {};
};

function isJSON(value) {
	if (value.length === 1)
		return false;
	var a = value[0];
	var b = value[value.length - 1];
	return (a === '"' && b === '"') || (a === '[' && b === ']') || (a === '{' && b === '}');
};

/*
	Object to URL params
	@obj {Object}
	return {String}
*/
function toParams(obj, apikey) {

	if (typeof(obj) === 'undefined' || obj === null)
		return '?apiKey=' + apikey;

	var buffer = [];

	var arr = Object.keys(obj);

	arr.forEach(function(o) {

		var value = obj[o];
		var name = o.toLowerCase().replace(/-/g, '');

		switch (name) {
			case 'q':
			case 'query':
			case 'where':
				buffer.push('q=' + encodeURIComponent(JSON.stringify(value)));
				break;		

			case 'include':

				if (typeof(value) === 'array') {
					var prepare = {};
					value.forEach(function(o) {
						prepare[o] = 1;
					});
					value = prepare;
				}

				buffer.push('f=' + encodeURIComponent(JSON.stringify(value)));
				break;

			case 'exclude':

				if (typeof(value) === 'array') {
					var prepare = {};
					value.forEach(function(o) {
						prepare[o] = 0;
					});
					value = prepare;
				}

				buffer.push('f=' + encodeURIComponent(JSON.stringify(value)));
				break;

			case 'f':
				buffer.push('f=' + encodeURIComponent(JSON.stringify(value)));
				break;

			case 'l':
			case 'max':
			case 'top':
			case 'limit':
			case 'take':
				buffer.push('l=' + value);
				break;

			case 'skip':
			case 'sk':
				buffer.push('sk=' + value);
				break;

			case 'asc':

				if (typeof(value) === 'array') {
					var prepare = {};
					value.forEach(function(o) {
						prepare[o] = 1;
					});
					value = prepare;
				}

				buffer.push('s=' + encodeURIComponent(JSON.stringify(value)));
				break;

			case 'desc':

				if (typeof(value) === 'array') {
					var prepare = {};
					value.forEach(function(o) {
						prepare[o] = -1;
					});
					value = prepare;
				}

				buffer.push('s=' + encodeURIComponent(JSON.stringify(value)));
				break;

			case 's':
			case 'sort':
			case 'sorting':
				buffer.push('s=' + encodeURIComponent(JSON.stringify(value)));
				break;

			case 'c':
			case 'count':
				buffer.push('c=' + value.toString().toLowerCase());
				break;

			case 'fo':
			case 'first':
				buffer.push('fo=' + value.toString().toLowerCase());
				break;

			case 'm':
			case 'updateall':
			case 'all':
				buffer.push('m=' + value.toString().toLowerCase());
				break;

			case 'u':
			case 'upsert':
				buffer.push('u=' + value.toString().toLowerCase());
				break;

			default:
				break;
		};
	});

	var params = buffer.join('&');
//	console.log( '?' + (params.length > 0 ? params + '&' : '') + 'apiKey=' + apikey );
	return '?' + (params.length > 0 ? params + '&' : '') + 'apiKey=' + apikey;
};

// ======================================================
// PROTOTYPES
// ======================================================

Flybase.prototype.setDebug = function( bool ){
	this.debug = bool;
}

// We also allow a 'logger' option. It can be any object that implements
// log, warn, and error methods.
// We log nothing by default, following "the rule of silence":
// http://www.linfo.org/rule_of_silence.html
Flybase.prototype.logger = function( callback ){
	// we assume that if you're in debug mode and you didn't
	// pass in a logger, you actually want to log as much as
	// possible.
	if (this.debug) {
		return callback || console;
	} else {
		return callback || this.mockconsole;
	}
};

/*
	Internal function
	@path {String}
	@method {String}
	@data {String or Object or Array}
	@params {Object}
	@callback {Function} :: function(object, error)
	return {self}
*/

Flybase.prototype.toString = function(){
	return this.database + '/' + this.collection;
};

Flybase.prototype.startWebSocket = function ( channel ){
	var _this = this;
	this.socket = require('socket.io-client')('http://push.flybase.io',{forceNew: true});

	var data = {};
	data.room = this.room;
	data.apiKey = this.apikey;
	data.db = this.database;
	data.collection = this.collection;

/*
	this.socket.on('connect', function(){});
	this.socket.on('event', function(data){});
	this.socket.on('disconnect', function(){});
*/

//	console.log( "subscribing to channel " + channel );
	this.socket.emit('subscribe', data );

	this.socket.on("connect", function() {
		_this.sessionId = _this.socket.io.engine.id;
		_this.logger().log( "Connected" );
	}).on("disconnect", function() {
		_this.logger().log( "Disconnected" );
	}).on("connecting",function(){
		_this.logger().log( "Connecting" );
	});
  
	this.socket.on('connected', function (data) {
		_this.logger().log( data );
	});
	this.socket.on('status', function (data) {
		_this.logger().log( data );
	});

//	this.socket.emit('status', "Hello Status");
	this.socket.on('whoami', function (data) {
		_this.sessionId = data;
	});
	this.socket.emit('whoami', '');

	return true;
};

/*
	isReady is a function that makes sure the connection is done, this is recommended by anything related to the connection to the real-time server.	
*/
Flybase.prototype.isReady = function( callback ){
	var _this = this;
	function ReadyOrNot(){
		if( typeof _this.sessionId !== "undefined" ){
			return callback();
		}else{
			setTimeout(function(){
				ReadyOrNot()
			}, 500);
		}
	}
	ReadyOrNot();
};

//	Set notifications when event is returned...
/*
Flybase.prototype.on = function( event, callback ){
	if( event == 'value' ){
		return this.documents({},callback);
	}
	this.socket.on( event, callback );
};
*/
Flybase.prototype.where = function( where ){
	this.query.q = where;
	return this;
}

Flybase.prototype.fields = function( field ){
	//	return only the field we passed as $field...
	this.query.f = field;
	return this;
}

Flybase.prototype.skip = function( n ){
	this.query.sk = n;
	return this;
}

Flybase.prototype.orderBy = function( o ){
	this.query.s = o;
	return this;
}

Flybase.prototype.limit = function( n ){
	this.query.l = n;
	return this;
}
Flybase.prototype.limitToFirst = function( n ){
	this.query.l = n;
//	this.query.s = {"_id": 1};
	return this;
}
Flybase.prototype.limitToLast = function( n ){
	this.query.l = n;
	this.query.s = {"_id": -1};
	return this;
}

Flybase.prototype.Connected = function( callback ){
	this.onOnline( callback );
	this.onOffline( callback );	
};

Flybase.prototype.onOnline = function( callback ){
	var myEvent = window.attachEvent || window.addEventListener;
	myEvent("online", function(e) {
		callback( true );
	}, false);
}

Flybase.prototype.onOffline = function( callback ){
	var myEvent = window.attachEvent || window.addEventListener;
	myEvent("offline", function(e) {
		callback( false );
	}, false);
}

Flybase.prototype.onDisconnect = function( callback ){
//	window.onbeforeunload = callback;
/*
	window.addEventListener("beforeunload", function (e) {
		callback();
		return null;
	});
*/
	var myEvent = window.attachEvent || window.addEventListener;
	var chkevent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compitable
	myEvent(chkevent, function(e) { // For >=IE7, Chrome, Firefox
		callback();
	});
}

Flybase.prototype.Disconnected = function( data ) {
//	this.logger().log('A> ' + this.sessionId );
	var endpoint = 'disconnect/' + this.sessionId + '/' + this.database + '/' + this.collection;
	this.rpostp(endpoint, data );
};


Flybase.prototype.on = function( key, callback ){
	if( key == 'value' ){
		this.documents(this.query,callback);
		//	once the initial query finishes, listen for any new records...
//		this.on('added', callback);
	}else{
		var self = this;

		this.socket.on( key, function(res){
			if( key == 'added' || key == 'changed' || key == 'removed' || key == 'online' ){
				var data = self.processData( res );
				self.currentItem = data;
			}else{
				var data = res;
			}
			callback( data );
		});
	}
};

Flybase.prototype.once = function( key, callback ){
	if( key == 'value' ){
		//	check query based on other functions.. 
		this.listDocuments(callback,this.query);
	}else{
		var self = this;
		
		this.socket.on( key, function(res){
			if( key == 'added' || key == 'changed' || key == 'removed' || key == 'online' ){
				var data = self.processData( res );
				self.currentItem = data;
			}else{
				var data = res;
			}
			callback( data );
			return true;
		});
	}
};

//	Send message to notification server...
Flybase.prototype.trigger = function(event, message){
	if( typeof message === 'object' ){
		var message = JSON.stringify( message );
	}
	var data = {
		room: this.room,
		event: event,
		message: message
	}
	this.socket.emit("soundout", data);	
};
Flybase.prototype.emit  = function(event, message) {
	if( typeof message === 'object' ){
		var message = JSON.stringify( message );
	}
	var data = {
		room: this.room,
		event: event,
		message: message
	}
	this.socket.emit("soundout", data);	
};


Flybase.prototype.connect = function(path, method, data, params, callback) {

	var self = this;

	if (path[0] === '/')
		path = path.substring(1);

	var uri = self.uri;
	var type = typeof(data);
	var isObject = type === 'object' || type === 'array';

	var headers = {};

	var timestamp = Math.round(+new Date / 1000);
	var signature = SHA1(self.apikey + ' ' + data + ' ' + timestamp);

	headers['Content-Type'] = isObject ? 'application/json' : 'text/plain';
	headers['X-Flybase-API-Key'] = self.apikey;
	headers['X-Flybase-API-Signature'] = signature;
	headers['X-Flybase-API-Timestamp'] = timestamp;

	var location = '';

	if (path[0] === '#')
		location = path.substring(1);
	else
		location = uri.pathname + path;

	var options = { 
			protocol: uri.protocol, 
			auth: uri.auth, 
			method: method || 'GET', 
			hostname: uri.hostname, 
			port: uri.port, 
			path: location + toParams(params, self.apikey), 
			agent:false, 
			headers: headers 
	};

//	this.logger().log( location + toParams(params, self.apikey));

	var response = function (res) {
		var buffer = '';

		res.on('data', function(chunk) {
			buffer += chunk.toString('utf8');
		})

		req.setTimeout(exports.timeout, function() {
			callback(null,new Error('timeout'));
		});

		res.on('end', function() {
			var data = parseJSON(buffer.trim());
			var error = null;

			if (res.statusCode > 200) {				
				error = new Error(res.statusCode + ' (' + (data.message || '') + ') ');
				data = null;
			}

			var data = self.processData( data );

			self.currentItem = data;
			callback(data,error);
		});
	};

	var con = options.protocol === 'http:' ? http : http;
	var req = callback ? con.request(options, response) : con.request(options);

	req.on('error', function(err) {
		callback(null,err);
	});

	if (isObject)
		req.end(JSON.stringify(data));
	else
		req.end();

	return self;
};

Flybase.prototype.rconnect = function(path, method, data, params, callback) {

	var self = this;

	if (path[0] === '/')
		path = path.substring(1);

	var uri = self.push_uri;
	var type = typeof(data);
	var isObject = type === 'object' || type === 'array';

	var headers = {};

	var timestamp = Math.round(+new Date / 1000);
	var signature = SHA1(self.apikey + ' ' + data + ' ' + timestamp);

	headers['Content-Type'] = isObject ? 'application/json' : 'text/plain';
	headers['X-Flybase-API-Key'] = self.apikey;
	headers['X-Flybase-API-Signature'] = signature;
	headers['X-DataMCFly-API-Timestamp'] = timestamp;

	var location = '';

	if (path[0] === '#')
		location = path.substring(1);
	else
		location = uri.pathname + path;

	var options = { 
			protocol: uri.protocol, 
			auth: uri.auth, 
			method: method || 'GET', 
			hostname: uri.hostname, 
			port: uri.port, 
			path: location + toParams(params, self.apikey), 
			agent:false, 
			headers: headers 
	};

//	this.logger().log( location + toParams(params, self.apikey));

	var response = function (res) {
		var buffer = '';

		res.on('data', function(chunk) {
			buffer += chunk.toString('utf8');
		})

		req.setTimeout(exports.timeout, function() {
			callback(null,new Error('timeout'));
		});

		res.on('end', function() {
			var data = parseJSON(buffer.trim());
			var error = null;

			if (res.statusCode > 200) {				
				error = new Error(res.statusCode + ' (' + (data.message || '') + ') ');
				data = null;
			}

			var data = self.processData( data );

			self.currentItem = data;
			callback(data,error);
		});
	};

	var con = options.protocol === 'http:' ? http : http;
	var req = callback ? con.request(options, response) : con.request(options);

	req.on('error', function(err) {
		callback(null,err);
	});

	if (isObject)
		req.end(JSON.stringify(data));
	else
		req.end();

	return self;
};

/*
	Flybase command
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.collections = function(cb) {
	var self = this;
	return self.connect(self.database + '/collections', 'GET', null, null, cb);
};

/*
	Flybase command
	@params {Object}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.get = function(cb,params) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'GET', null, params, cb);
};
Flybase.prototype.listDocuments = function(cb, params) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'GET', null, params, cb);
};
Flybase.prototype.documents = function(params, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'GET', null, params, cb);
};

/*
	Flybase command
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.databases = function(cb) {
	return this.connect('', 'GET', null, null, cb);
};

/*
	Flybase command
	@documents {Object or Object array}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.set = function(documents, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'POST', documents, null, cb);
};

Flybase.prototype.push = function(documents, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'POST', documents, null, cb);
};

Flybase.prototype.insert = function(documents, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'POST', documents, null, cb);
};

Flybase.prototype.rpostp = function(endpoint, data, callback){
	var self = this;
	callback = callback || function(){};
	data = typeof data === 'object' ? data : false;

	return self.rconnect(self.database + '/collections/' + this.collection, 'POST', JSON.stringify(data), null, cb);
};


/*
	Flybase command
	@condition {Object or Object array}
	@params {Object}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.update = function(condition, params, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'PUT', condition, params, cb);
};

/*
	Flybase command
	@id {String or Number}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.findId = function(id, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection + '/' + id, 'GET', null, null, cb);
};

/*
	Flybase command
	@id {String or Number}
	@document {Object}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.updateDocument = function(id, document, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection + '/' + id, 'PUT', document, null, cb);
};

Flybase.prototype.updateId = function(id, document, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection + '/' + id, 'PUT', document, null, cb);
};

/*
	Flybase command
	@collection {String}
	@id {String or Number}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.drop = function(cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection, 'DELETE', null, null, cb);
};
/*
	Flybase command
	@collection {String}
	@id {String or Number}
	@cb {Function} :: function(object, error)
	return {Flybase}
*/
Flybase.prototype.remove = function(id, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection + '/' + id, 'DELETE', null, null, cb);
};
Flybase.prototype.deleteDocument = function(id, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection + '/' + id, 'DELETE', null, null, cb);
};
Flybase.prototype.deleteId = function(id, cb) {
	var self = this;
	return self.connect(self.database + '/collections/' + this.collection + '/' + id, 'DELETE', null, null, cb);
};

Flybase.prototype.transaction = function( updateFunction, cb){
	callback = cb || function(){};
	var c = {
		update: updateFunction,
		status: null
	};
	var e = this.currentItem.value();
	var e = e[0];
	var d = c.update( e );
	if ( is_void(d) ) {
		this.logger().log("transaction failed: Data returned " + d);
		c.status = 1;
	}else{
		if( is_object( d ) ){
//	merge the arrays together...
			var k = merge( e, d );
			this.push( k, cb );
		}else{
//	returned null.. so delete...
			var id = e._id;
//			delete the record since it was NULL..
			this.deleteId( e._id, cb );
		}
		this.logger().log( d );
	}
};

//	format return values into a object with helper functions...
Flybase.prototype.processData = function ( data ){
	var self = this;
	var retVal = [];
	var raw = data;

	var IS_JSON = true;
	try{
		var json = JSON.parse( data );
	}catch(err){
		IS_JSON = false;
	}

	if( IS_JSON ){
		var toProcess = json;
	}else{
		var toProcess = data;
	}

	if( toProcess == null ){
		var obj = {
			'data': [],
			value : function() {
				return this.data;
			},
			key : function(){
				return this.data._id;
			},
			ref : function(){
				return self;
			}
		};
		var Processed = obj;
	}else if ( !toProcess.length ) { 
		//	single variable...
		var obj = {
			'data': toProcess,
			value : function() {
				return this.data;
			},
			key : function(){
				return this.data._id;
			},
			ref : function(){
				return self;
			}
		};
		var Processed = obj;
	}else{
		for (var i in toProcess) {
			var value = toProcess[i];
			var obj = {
				'data': value,
				value : function() {
					return this.data;
				},
				key : function(){
					return this.data._id;
				},
				ref : function(){
					return self;
				}
			};
			retVal[i] = obj;
		}
		var Processed = retVal;
	}			
	
//	single variable...
	var data = {
		'data': Processed,
		'raw': raw,
		value : function() {
			if( this.count() > 1 ){
				return this.data;
			}else{
				return this.data.value();
			}
		},
		key : function(){
			if( this.count() > 1 ){
				return null;
			}else{
				return this.data.key();
			}
		},
		first : function(){
			if( this.count() > 0 ){
				var d = this.data[ 0 ];
				return d;
			}else{
				return this.data;				
			}
		},
		count : function(){
			if (typeof this.data.length == 'undefined' ){
				return null;
			}else{
				return this.data.length;	
			}
		},
		forEach : function( cb ){
			// iterate through each record returned...
			for (var i in this.data ) {
				var d = this.data[i];

				cb( d );
			}
		},
		ref : function(){
			return self;
		}
	};
	
	return data;
};

//	Utility Functions ---------------------------------------------------------------

var hb = function() {
	var a = 1;
	return function() {
		return a++
	}
}();

function is_object(a) {
	var b = typeof a;
	return "object" == b && null != a || "function" == b
}

function is_void(a) {
//	return (typeof a === 'undefined');
	return void 0 === a;
}

function merge() {
	var obj = {}, i = 0, il = arguments.length, key;
	for (; i < il; i++) {
		for (key in arguments[i]) {
			if (arguments[i].hasOwnProperty(key)) {
				obj[key] = arguments[i][key];
			}
		}
	}
	return obj;
};

function mockconsole(){
	var methods = "assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(",");
	var l = methods.length;
	var fn = function () {};
	var mockconsoleObj = {};
	
	while (l--) {
	    mockconsoleObj[methods[l]] = fn;
	}
	return mockconsoleObj;
}


// ======================================================
// EXPORTS
// ======================================================

exports.timeout = 10000;
exports.Flybase = exports.flybase = exports.mongodb = Flybase;

/*
	Flybase class
	@connectionString {String} :: url address
*/
exports.init = function(db, collection, apikey) {
	return new Flybase(db, collection, apikey);
};
