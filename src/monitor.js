/**
 *  Implementation of object change monitoring.
 *  - More like Object.observe except changes have 
 *    to be committed manually (eg. o.put(key, value))
 *
 *  LIMITATIONS
 *  - Current implementation works with only plain objects
 *    (ie: prototypes of Object)
 *
 *  TODO
 *  - Implement Array compatibility
 *    Currently Supports (experimental)
 *    - Array.push
 *    - Array.pop
 *
 *  @version 1.0.0
 *  @author Nelis Elorm Duhadzi
 *  @email mynelis@gmail.com
 */
(function(){
  'use strict';

  function isArray(s) {
    return isFunction(s.slice);
  }

  function isObject(s) {
    return !isArray(s) && isArray(Object.keys(s));
  }

  function isFunction(s) {
    return typeof s === 'function';
  }

  function isUndefined(s) {
    return typeof s === 'undefined';
  }

  function isScalar(s) {
    return isString(s) || isNumber(s);
  }

  function isString(s) {
    return 'string' === typeof s;
  }

  function isNumber(s) {
    return 'number' === typeof s;
  }

  function define(o, n, v, e, w, c) {
    Object.defineProperty(o, n, {
      value: v || null,
      enumerable: e || false,
      writable: w || false,
      configurable: c || false
    });
    return o;
  }

  function unmonitor(obj, callback) {
    delete obj.push;
    delete obj.pop;
    callback.call(obj);
  }

  function monitor(obj, callback) {
    var 
      records = [], 
      _obj = obj,
      is_array = isArray(obj);

    function set(prop, value) {
      if('object' === typeof prop) {
        for(var i in prop) {
          if(prop.hasOwnProperty(i)) {
            setRecord({name:i, value:prop[i]});
          }
        }
        return;
      } 
      if(isScalar(prop)) {
        if(isUndefined(value)) {
          deleteRecord(prop);
          return;
        }
        setRecord({name:prop, value:value});
      }
    }

    function deleteRecord(key) {
      if(undefined !== obj[key]) {
        var n = obj[key], rec = {
          type:'delete', 
          name:key,
          object:obj, 
          oldValue:n
        };
        if(is_array) {
          Array.prototype.pop.call(obj);
        }
        else {
          delete obj[key];
        }
        records.push(rec);
        callback.call(obj, rec, records);
        return is_array ? n : key;
      }
    }

    function setRecord(rec) {
      if(!obj[rec.name]) {
        addRecord(rec);
        return;
      }
      updateRecord(rec);
    }

    function addRecord(rec) {
      rec.type = 'add';
      rec.object = obj;
      obj[rec.name] = rec.value;
      records.push(rec);
      callback.call(obj, rec, records);
    }

    function updateRecord(rec) {
      rec.type = 'update';
      rec.object = obj;
      rec.oldValue = obj[rec.name];
      obj[rec.name] = rec.value;
      records.push(rec);
      callback.call(obj, rec, records); 
    }

    define(obj, 'push', _push, false, false, true);
    define(obj, 'pop', _pop, false, false, true);

    function _push() {
      var i, j, k, args = arguments;

      for(i in args) {
        if(is_array) {
          set(obj.length, args[i]); 
        }
        else {
          for(j in args[i]) {
            set(j, args[i][j]);
          }
        }
      }
      return is_array ? obj.length : Object.keys(obj).length;
    }
    function _pop(key) {
      return deleteRecord(key || (is_array && obj.length-1));
    }
  }

  Object.monitor = Array.monitor = function(obj, callback) {
    monitor(obj, callback);
  }
  Object.unmonitor = Array.unmonitor = function (obj, callback) {
    unmonitor(obj, callback);
  }

})();