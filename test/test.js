var wacwav = require('../index.js');

wacwav.convert('test.wac', 'test.wav', function(err) {
  console.log('test:');
  console.log(err);
});
