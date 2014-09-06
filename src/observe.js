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

  // function define(o, n, v, e, w, c) {
  //   Object.defineProperty(o, n, {
  //     value: v || null,
  //     enumerable: e || false,
  //     writable: w || false,
  //     configurable: c || false
  //   });
  //   return o;
  // }

  function unmonitor(obj, callback) {
    if(isFunction(obj.put)) {
      obj.put = function () {
        return false;
      };
      callback.call(obj, obj);
    }
    delete obj.set;
    delete obj.push;
    delete obj.pop;
  }

  function monitor(obj, callback) {
    var 
      records = [], 
      _obj = obj,
      is_array = isArray(obj);

    // function getRecordType(rec) {
    //   return (undefined !== obj[rec.name]) ? 'update' : 'add';
    // }

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

    function deleteRecord(name) {
      if(undefined !== obj[name]) {
        var n = obj[name], rec = {
          type:'delete', 
          name:name,
          object:obj, 
          oldValue:n
        };
        if(is_array) {
          Array.prototype.pop.call(obj);
        }
        else {
          delete obj[name];
        }
        records.push(rec);
        callback.call(obj, rec, records);
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
      //define(obj, rec.name, rec.value, true, true, true);
      records.push(rec);
      callback.call(obj, rec, records);

      // obj.__defineSetter__(rec.name, function(val) {
      //   rec.value = val;
      //   console.log('<-- '+rec.name+' = ', obj[rec.name]);
      //   console.log('--> '+rec.name+' = ', rec.value);
      //   updateRecord(rec);
      // });      
    }

    function updateRecord(rec) {
      //rec.type = getRecordType(rec);
      rec.type = 'update';
      rec.object = obj;
      rec.oldValue = obj[rec.name];
      obj[rec.name] = rec.value;
      //define(obj, rec.name, rec.value, true, true, true);
      records.push(rec);
      callback.call(obj, rec, records); 
    }

    //define(obj, 'set', set);
    obj.set = function(prop, value) {
      set(prop, value);
    }
    obj.push = function(value) {
      set(obj.length, value);
    }
    obj.pop = function() {
      deleteRecord(obj.length-1);
    }
  }

  Object.monitor = Array.monitor = function(obj, callback) {
    monitor(obj, callback);
  }
  Object.unmonitor = function (obj, callback) {
    unmonitor(obj, callback);
  }

})();