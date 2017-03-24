Simple node.js REST client for Flybase.io
===================================================

- [Flybase](http://www.flybase.io) Flybase

***

## NPM flybase

- create on your desktop empty directory with name: website
- open terminal and find this directory: cd /Desktop/website/
- write and run on terminal:

```text
$ npm install flybase
```

## Methods

```js
/*
    Flybase constructor
    @database {String}
    @collection {String}
    @key {String} :: get your key from http://app.flybase.io/
*/
Flybase(database, collection, key);
 
/*
    Usage / Constructor
    @database {String}
    @collection {String}
    @key {String} :: get your key from http://app.flybase.io/
    return {Flybase};
*/
require('flybase').init(database, collection, key);
 
/*
    All collection in database
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.collections(cb);
 
/*
    Get all documents
    @params {Object}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.documents(params, cb);
 
/*
    Listen for changes via push server
    @event {String}
    @cb {Function} :: function(error, data)
    return {Flybase}
*/
flybase.on(event, cb);

/*
    Push a change to push server
    @event {String}
    @message {String}
*/
flybase.trigger(event, message);
 
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
 
var params = { where: { age: 28 }, asc: ['age'] };
 
flybase.documents('users', params, function(err, data) {
     
});
 
/*
    Insert document / documents
    @collection {String}
    @documents {Object or Object array}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.set(documents, cb);
flybase.push(documents, cb);
flybase.insert(documents, cb);
 
/*
    Update document / documents
    @collection {String}
    @condition {Object or Object array}
    @params {Object}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.update(condition, params, cb);
 
/*
    Find document by Id
    @collection {String}
    @id {String or Number}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.findId(id, cb);
 
/*
    Update document by Id
    @collection {String}
    @id {String or Number}
    @document {Object}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.updateId(id, document, cb);
 
/*
    Delete document by Id
    @collection {String}
    @id {String or Number}
    @cb {Function} :: function(error, object)
    return {Flybase}
*/
flybase.deleteId(id, cb);
 
```

***