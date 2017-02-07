'use strict';

var util = require('util');
var PassThrough = require('stream').PassThrough;
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

function noop(){}

function mergeError(err1, err2) {
  var err = err1 || err2;
  if (err1 && err2) {
    err = new Error(err1.message + ' : ' + err2.message);
    err.errors = [err1, err2];
  }
  return err;
}

var cmdpath = path.join(__dirname, 'build', 'wac2wavcmd');

var WacToWav = function() {
  PassThrough.call(this);
  this.child = spawn(cmdpath, [], {detached: true});
  var self = this;
  this.child.on('error', function(err){ self.emit('error', err); });
  this.child.on('exit', function(){ self.childExited = true; });

  this.on('pipe', function(source) {
    source.unpipe(this);
    source.pipe(this.child.stdin);
  });
};

util.inherits(WacToWav, PassThrough);

WacToWav.prototype.pipe = function(dest, options) {
  return this.child.stdout.pipe(dest, options);
};

WacToWav.prototype.cancel = function() {
  if (!this.childExited) this.child.kill();
};

module.exports = function() {
  return new WacToWav();
};

module.exports.convert = function(wacPath, wavPath, cb) {
  fs.open(wacPath, 'r', function(err, infd){
    if (err) return cb(err);
    fs.open(wavPath, 'w', function(errOut, outfd){
      if (errOut) {
        fs.close(infd, function(errClose){
          return cb(mergeError(errOut, errClose));
        });
        return;
      }
      var child = spawn(cmdpath, [], { detached: true, stdio:[infd, outfd, 'ignore'] });
      var finish = function(err){
        finish = noop;
        var errors;
        var closeErrors = [];
        var allClosed = function(errClose){
          closeErrors.push(errClose);
          if (closeErrors.length === 2) {
            errors = mergeError(err, mergeError(closeErrors[0], closeErrors[1]))
            if (err) {
              fs.unlink(wavPath, function(errUnlink){
                errors = mergeError(err, errUnlink);
                return cb(errors);
              });
            } else {
              return cb(errors);
            }
          }
        };
        //console.log('closing files');
        fs.close(infd, allClosed);
        fs.close(outfd, allClosed);
      };
      child.on('error', finish);
      child.on('close', function(code, signal){
        //console.log('close')
        var err1, err2;
        if (code > 0) err1 = new Error('Invalid input data');
        if (signal) err2 = new Error('Forced exit on signal ' + signal);
        return finish(mergeError(err1, err2));
      });
      //child.on('exit',()=>console.log('exit'));
    });
  });
};
