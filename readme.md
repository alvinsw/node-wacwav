# node-wacwav
NodeJS wrapper for converting from Wildlife Acoustics WAC format to WAV format.
The C source code that does WAC to WAV conversion is taken from https://sourceforge.net/projects/wac2wavcmd/
For each conversion task, the module spawns a new child process to run the wac2wavcmd command under the build directory.

## Installation
GCC and Make is required.

    npm install github:alvinsw/node-wacwav

## Usage
Convert a file:

    const wacwav = require('wacwav');
    // Convert a file with the specified path `wacPath` to a new WAV file `wavPath`
    wacwav.convert(wacPath, wavPath, cb);
    // For example:
    wacwav.convert('/tmp/a.wac', '/tmp/a.wav', function(err){
      if (!err) {
        console.log('convert ok!');
      }
    });

Convert a stream:

    const wacwav = require('wacwav');
    var converter = wacwav();
    inputStream.pipe(converter).pipe(outputStream);
