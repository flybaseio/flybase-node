var api_key = 'YOUR-API-KEY';
var db = 'test';
var collection = 'chat';

var flybase = require('./flybase').init(db, collection, api_key);

flybase.push( {name:"node", text:"test"}, function(data){
	console.log("pushed good");
});

var cb = function(object, error){
	console.log( object );
};

console.log( 'connected to ' + flybase.toString() );

var params = {'limit': 20 };
flybase.documents(params, function(data, err) {
	console.log ("Found " + data.count() + " records");
});

flybase.on('added', function (data) {
	var message = data.value();
	console.log( message.name+': '+message.text );
});

flybase.limitToLast(10).on('value', function (data) {
	data.forEach( function( message ){
		var message = message.value();
		console.log( message.name+': '+message.text );
	});
});

/*
flybase.collections( function(object, error){
	console.log( object );
});
*/
/*
    Get all documents
    @collection {String}
    @params {Object}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
//	flybase.documents(params, cb);


// Params options
// q<query> :: restrict results by the specified JSON query
// q = {} :: object
// where = {} :: object
// query = {} :: object

// s<sort> :: specify the order in which to sort each specified field (1- ascending; -1 - descending)
// s = {} :: object
// sort = {} :: object
// asc = ['name', 'age'] :: array
// desc = ['name', 'age'] :: array

// f<set of fields> :: specify the set of fields to include or exclude in each document (1 - include; 0 - exclude)
// f = {} :: object
// include = ['name', 'age'] :: array
// exclude = ['name', 'age'] :: array

// c<boolean> :: return the result count for this query
// c = true :: boolean
// count = true :: boolean

// fo<boolean> :: return a single document from the result set (same as findOne() using the mongo shell
// fo = true :: boolean
// first = true :: boolean

// sk<num results to skip> :: specify the number of results to skip in the result set; useful for paging
// sk = 10 :: number
// skip = 10 :: number

// l<limit> :: specify the limit for the number of results (default is 1000)
// l = 10 :: number
// take = 10 :: number
// max = 10 :: number
// top = 10 :: number
// limit = 10 :: number

// --------
// UPDATING
// --------

// m<boolean> :: update all documents
// m = true :: boolean
// all = true :: boolean
// update-all = true :: boolean

// u<boolean> :: insert the document defined in the request body if none match the specified query
// u = true :: boolean
// upsert = true :: boolean

//	var params = { where: { age: 28 }, asc: ['age'] };
//		flybase.documents('users', params, function(data) {
//	});

/*
    Insert document / documents
    @collection {String}
    @documents {Object or Object array}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
//	flybase.set(documents, cb);
//	flybase.push(documents, cb);
//	flybase.insert(documents, cb);

/*
    Update document / documents
    @collection {String}
    @condition {Object or Object array}
    @params {Object}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
//	flybase.update(condition, params, cb);

/*
    Find document by Id
    @collection {String}
    @id {String or Number}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
//	flybase.findId(id, cb);

/*
    Update document by Id
    @collection {String}
    @id {String or Number}
    @document {Object}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
//	flybase.updateId(id, document, cb);

/*
    Delete document by Id
    @collection {String}
    @id {String or Number}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
//	flybase.deleteId(id, cb);
