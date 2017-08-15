const assert = require('assert');
const expect = require('chai').expect;
const MemoryStorage = require('../index');

describe('SimpleMemoryStorage, no automatical expiration checking', function(){

	var store = new MemoryStorage();


	it('should get what was saved before', function(){
		var k = '001', v = 'helloworld', o;

		store.set(k, v);

		o = store.get(k);

		expect(o).to.be.exist;
		expect(o).to.be.equal(v);
	});

	it('should get a null', function(){
		var k = '001', o;

		o = store.get(k);

		expect(o).to.be.null;
	});

	it('should save an object', function(){
		var k = '001', msg = 'helloworld', o;
		
		store.set(k, { msg: msg });
		
		o = store.get(k);

		expect(o).to.be.exist;
		expect(o.msg).to.equal(msg);
	});

	it('should get the count of objects in the store', function(done){
		var k = '001', msg = 'helloworld',
			k2 = '002', msg2 = 'hahahaha', ttl = 1,
			o, c;

		store.set(k, msg);
		store.setTTL(k2, msg2, ttl);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(2);
			
			done();
		}, ttl * 1000 * 2);
		
	});

	it('should save an object an override it with another object', function(){
		var k = '001', v1 = 'msg001', v2 = 'msg002', o, c;

		store.set(k, v1);
		store.set(k, v2);

		o = store.get(k);
		c = store.count();

		expect(o).to.be.exist;
		expect(o).to.equal(v2);
		expect(c).to.equal(1);
	});

	it('should save an object with a TTL, and get the object before TTL runs out', function(done){
		var k = '001', v = 'helloworld', ttl = 1.5, o;

		store.setTTL(k, v, ttl);

		setTimeout(function(){
			o = store.get(k);
			
			expect(o).to.be.exist;
			expect(o).to.equal(v);
			
			done();
		}, Math.floor(ttl * 1000 / 2));

	});

	it('should save an object with a TTL, and get null after TTL runs out', function(done){
		var k = '001', v = 'helloworld', ttl = 1, o;

		store.setTTL(k, v, ttl);

		setTimeout(function(){
			o = store.get(k);

			expect(o).to.be.null;

			done();
		}, Math.floor(ttl * 1000  * 1.5));
	});

	it('should save an object with an expiration, and get the object before the expiration', function(done){
		var k = '001', v = 'helloworld', ttl = 2, exp, o;

		exp = new Date();
		exp.setTime(exp.getTime() + ttl * 1000);

		store.setExpiration(k, v, exp);

		setTimeout(function(){
			o = store.get(k);

			expect(o).to.be.exist;
			expect(o).to.equal(v);

			done();
		}, Math.floor(ttl * 1000 / 2));
	});

	it('should save an object with an expiration, and get null after the expiration', function(done){
		var k = '001', v = 'helloworld', ttl = 1, exp, o;

		exp = new Date();
		exp.setTime(exp.getTime() + ttl * 1000);

		store.setExpiration(k, v, exp);

		setTimeout(function(){
			o = store.get(k);

			expect(o).to.be.null;

			done();
		}, Math.floor(ttl * 1000 * 1.5));
		
	});

	it('should remove the object', function(){
		var k = '001', v = 'helloworld', o;

		store.set(k, v);

		o = store.get(k);

		expect(o).to.be.exist;
		expect(o).to.equal(v);

		store.remove(k);

		o = store.get(k);

		expect(o).to.be.null;
	});

	it('should trigger an one-time expiration checking', function(done){
		var k = '001', v = 'helloworld',
			k2 = '002', v2 = 'hahaha',
			ttl = 0.5, o, c;

		store.set(k, v);
		store.setTTL(k2, v2, ttl);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(2);

			store.checkExpiration();

			c = store.count();

			expect(c).to.equal(1);

			done();
		}, ttl * 2 * 1000);
	});

	it('should start the auto-expiration-checking', function(done){
		var k = '001', v = 'helloworld',
			k2 = '002', v2 = 'hahaha',
			ttl = 2, intv = 2000, o, c;

		store = new MemoryStorage({ checkExpirationInterval: intv });

		store.set(k, v);
		store.setTTL(k2, v2, ttl);

		store.startCheckingExpiration();

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(2);

		}, Math.min(ttl * 1000 / 2, intv / 2));

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			done();
		}, Math.max(ttl, intv) + 500);

	});

	it('should stop the auto-expiration-checking', function(done){
		var k ='001', v = 'helloworld',
			k2 = '002', v2 = 'hahahaha',
			intv = 1500, ttl = 1, ttl2 = 3,
			c;

		store = new MemoryStorage({ checkExpirationInterval: intv });

		store.setTTL(k, v, ttl);
		store.setTTL(k2, v2, ttl2);

		store.startCheckingExpiration();

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			store.stopCheckingExpiration();
			
		}, Math.max(intv + 500, ttl) + 500);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			done();
			
		}, Math.max(intv * 2, ttl2) + 500);
	});

	afterEach(function(){
		store.clear();
	});
});

describe('SimpleMemoryStorage, with automatical expiration checking', function(){

	it('should start the auto-expiration-checking', function(done){
		var k = '001', v = 'helloworld',
			k2 = '002', v2 = 'hahaha',
			ttl = 2, intv = 2000, o, c;

		var store = new MemoryStorage({ checkExpiration: true, checkExpirationInterval: intv });

		store.set(k, v);
		store.setTTL(k2, v2, ttl);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(2);

		}, Math.min(ttl * 1000 / 2, intv / 2));

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			done();
		}, Math.max(ttl, intv) + 500);

	});

	it('should stop the auto-expiration-checking', function(done){
		var k ='001', v = 'helloworld',
			k2 = '002', v2 = 'hahahaha',
			intv = 1500, ttl = 1, ttl2 = 3,
			c;

		var store = new MemoryStorage({ checkExpiration: true, checkExpirationInterval: intv });

		store.setTTL(k, v, ttl);
		store.setTTL(k2, v2, ttl2);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			store.stopCheckingExpiration();
			
		}, Math.max(intv + 500, ttl) + 500);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			done();
			
		}, Math.max(intv * 2, ttl2) + 500);
	});

	it('should stop the auto-expiration-checking before the lazy-auto-start', function(done){
		var k ='001', v = 'helloworld',
			intv = 1500, ttl = 1,
			c;

		var store = new MemoryStorage({ checkExpiration: true, checkExpirationInterval: intv });

		store.stopCheckingExpiration();

		store.setTTL(k, v, ttl);

		setTimeout(function(){
			c = store.count();

			expect(c).to.equal(1);

			done();
			
		}, Math.max(intv * 2, ttl) + 500);
	});

});
