# simple-memory-storage
A simple runtime-memory-backed storage.

## installation
`npm install waychan23/simple-memory-storage`

## Usage

```javascript
var MemoryStorage = require('simple-memory-storage');

var storage = new MemoryStorage({ checkExpiration: true, checkExpirationInterval: 3000 });

storage.set('key001', 'value001');

storage.get('key001'); // => 'value001'

storage.setTTL('key001', 'value002', /* TTL in second */ 2);

storage.get('key001'); // => 'value002' (Note: override the previous value 'value001')

storage.setExpiration('key001', 'value003', /* Expiration Date Object */ new Date(new Date().getTime() + 5000));

storage.get('key001'); // => 'value003' (override 'value002')
```
Please check the source code for the complete list of APIs.

## Test

Run:  
```
npm run test
```
