const DEFAULT_CHECK_EXPIRATION_INTERVAL = 5000;

/**
 * @constructor RuntimeMemoryStore
 * @param {Object} [options] - Options
 * @param {Boolean} [options.checkExpiration = false] - specify whether the store should automatically check expiration periodly, as a alternative, you may call instance methods startCheckExpiration/stopCheckExpiration to control this behavior; by default, the store only check expiration when retrieving objects
 * @param {Number} [options.checkExpirationInterval = 5000] - specify the default expiration checking interval in millisecond
 */
module.exports = function RuntimeMemoryStore(options){
	if(!(this instanceof RuntimeMemoryStore)){
		return new RuntimeMemoryStore(options);
	}

	options = options || {};

	options.checkExpiration = Boolean(options.checkExpiration);

	var store = {},
		ttlTimerInterval = options.checkExpirationInterval >= 1000? options.checkExpirationInterval: DEFAULT_CHECK_EXPIRATION_INTERVAL,
		started = false,
		stopped = false,
		ttlTimer;

	function isExpired(item, curTime){
		curTime = curTime? curTime: new Date().getTime();
		return item && item.expireTime && item.expireTime <= curTime;
	}

	/**
	  * Retrieve an object previously stored.
	  * @param {String} key - specify the key of the object to be retrieve
	  * @return {Any} the object stored with the specified key
	 */
	function get(key){
		var item = store[key];

		if(item && isExpired(item)){
			remove(key);
			return null;
		}

		return item? item.object: null;
	}

	/**
	  * Save an object with a specific key.  
	  * Note: if the key has already been used, then original value saved with the key will be overrided by the new value.
	  * @param {String} key - specify the key
	  * @param {Any} value - sepcify the value to be saved
	  * @return {Boolean} always returns true
	 */
	function set(key, value){
		store[key] = {
			'object': value
		};

		return true;
	}

	/**
	  * Save an object with a specific key and specify when to expire the object.
	  * Note: if the store instance option 'checkExpiration' is set to true, then calling this method will start the expiration checking if it's not already started. 
	  * Thus, the checking procedure is deffered utils the first object with an expiration is saved.
	  * @param {String} key - specify the key
	  * @param {Any} value - specify the value to be saved
	  * @param {Date} exp - specify a Date object indicating when to expire the object
	  * @return {Boolean} always returns true
	 */
	function setExpiration(key, value, exp){
		store[key] = {
			'object': value,
			'expireTime': exp instanceof Date? exp.getTime(): exp
		};

		if(options.checkExpiration && !started && !stopped){
			startTTLTimer();
		}

		return true;
	}

	/**
	  * Save an object with a specific key and specify the time-to-live(TTL) of the object.
	  * Note: similar to the `setExpiration` method, this will also start the deffered expiration checking procedure.
	  * @param {String} key - sepcify the key
	  * @param {Any} value - sepcify the value to be saved
	  * @param {Number} - specify a TTL in second indicating how long the value will live for
	  * @return {Boolean} always returns true
	 */
	function setTTL(key, value, ttl){
		store[key] = {
			'object': value,
			'expireTime': new Date().getTime() + ttl * 1000
		};

		if(options.checkExpiration && !started && !stopped){
			startTTLTimer();
		}

		return true;
	}

	/**
	  * Remove the object specified by the key from the store.
	  * @param {String} key - specify the key
	  * @return {Boolean} returns true when an object with the specified key is found and deleted, and returns false otherwise
	 */
	function remove(key){
		var found = store[key] !== undefined && store[key] !== null;

		if(found){
			delete store[key];
		}

		return found;
	}

	/**
	  * Manually start the expiration checking procedure.
	 */
	function startTTLTimer(){
		if(ttlTimer){
			clearInterval(ttlTimer);
			ttlTimer = null;
		}
		ttlTimer = setInterval(checkExpiration, ttlTimerInterval);
		started = true;
		stopped = false;
	}

	/**
	  * Manually stop the expiration checking procedure.
	 */
	function stopTTLTimer(){
		if(ttlTimer){
			clearInterval(ttlTimer);
			ttlTimer = null;
		}
		stopped = true;
		started = false;
	}

	/**
	  * Trigger an one-time expiration checking immediately.
	 */
	function checkExpiration(){
		var key, t;

		t = new Date().getTime();

		for(key in store){
			if(store.hasOwnProperty(key) && isExpired(store[key], t)){
				remove(key);
			}
		}
	}

	/**
	  * Remove all saved values in the store.
	  * Note: use with caution.
	 */
	function clear(){
		stopTTLTimer();
		stopped = false;
		store = {};
	}

	/**
	  * Count objects(expired and unexpired) in the store.
      * Mostly for test.
	  * @return {Number} number of objects currently in the store.
	 */
	function count(){
		var count = 0, key;
		
		for(key in store){
			if(store.hasOwnProperty(key)){
				count ++;
			}
		}

		return count;
	}

	//exports
	return {
		get: get,
		set: set,
		setTTL: setTTL,
		setExpiration: setExpiration,
		remove: remove,
		clear: clear,
		count: count,
		checkExpiration: checkExpiration,
		startCheckingExpiration: startTTLTimer,
		stopCheckingExpiration: stopTTLTimer
	};
};
