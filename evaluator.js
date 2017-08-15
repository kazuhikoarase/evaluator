//
// evaluator
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

'use strict';
var evaluator = function() {

  var each = function(o, callback) {
    for (var k in o) { callback(k, o[k]); }
  };

  var isSpc = function(c) {
    return c == '\u0020' || c == '\t' || c == '\r' || c == '\n';
  };
  var isSign = function(c) { return c == '+' || c == '-'; };
  var isNum = function(c) { return '0' <= c && c <= '9'; };
  var isAlp = function(c) {
    return 'a' <= c && c <= 'z' || 'A' <= c && c <= 'Z';
  };
  var isQuot = function(c) { return c == '"' || c == "'"; };
  var isOpe = function(c) { return '.~!*/%+-&|<>='.indexOf(c) != -1; };

  var bracket = {
//    '{' : '}',
//    '[' : ']',
    '(' : ')'
  };

  // precedence table
  // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
  var operators = {
    '.' : 19,
    '~' : 16,
    '!' : 16,
    '*' : 14,
    '/' : 14,
    '%' : 14,
    '+' : 13,
    '-' : 13,
    '<<' : 12,
    '>>' : 12,
    '>>>' : 12,
    '>' : 11,
    '<' : 11,
    '>=' : 11,
    '<=' : 11,
    '==' : 10,
    '!=' : 10,
    '&' : 9,
    '^' : 8,
    '|' : 7,
    '&&' : 6,
    '||' : 5,
    '=' : 3,
    '+=' : 3,
    '-=' : 3,
    '*=' : 3,
    '/=' : 3,
    '%=' : 3,
    '<<=' : 3,
    '>>=' : 3,
    '>>>=' : 3,
    '&=' : 3,
    '^=' : 3,
    '|=' : 3
  };

  var fn = {
    '~' : function(v) { return ~v; },
    '!' : function(v) { return !v; },
    '*' : function(v1, v2) { return v1 * v2; },
    '/' : function(v1, v2) { return v1 / v2; },
    '+' : function(v1, v2) { return v1 + v2; },
    '-' : function(v1, v2) { return v1 - v2; },
    '%' : function(v1, v2) { return v1 % v2; },
    '<<' : function(v1, v2) { return v1 << v2; },
    '>>' : function(v1, v2) { return v1 >> v2; },
    '>>>' : function(v1, v2) { return v1 >>> v2; },
    '>' : function(v1, v2) { return v1 > v2; },
    '<' : function(v1, v2) { return v1 < v2; },
    '>=' : function(v1, v2) { return v1 >= v2; },
    '<=' : function(v1, v2) { return v1 <= v2; },
    '==' : function(v1, v2) { return v1 == v2; },
    '!=' : function(v1, v2) { return v1 != v2; },
    '&' : function(v1, v2) { return v1 & v2; },
    '^' : function(v1, v2) { return v1 ^ v2; },
    '|' : function(v1, v2) { return v1 | v2; },
    '&&' : function(v1, v2) { return v1 && v2; },
    '||' : function(v1, v2) { return v1 || v2; }
  };

  var rtol = { '~' : true, '!' : true };

  var func = function() {

    var assignments = {
      '=' : function(dst, src) {
        if (dst.t != 'sym') {
          throw 'left object is bad type:' + dst.t;
        }
        accessor(this, dst).set(evalObject(this, src) );
        return src;
      }
    };

    [ '+', '-', '*', '/', '%', '<<', '>>', '>>>', '&', '^', '|' ].
      forEach(function(op) {
        assignments[op + '='] = function(dst, src) {
          if (dst.t != 'sym') {
            throw 'left object is bad type:' + dst.t;
          }
          var a = accessor(this, dst);
          a.set(fn[op](a.get(), evalObject(this, src) ) );
          return dst;
        };
      });

    each(assignments, function(k, v) { rtol[k] = true; });

    var prop = function(ctx, l, r) {
      if (l.t != 'sym') {
        throw 'left object is bad type:' + l.t;
      }
      if (r.t != 'sym') {
        throw 'right object is bad type:' + r.t;
      }
      var o = accessor(ctx, l).get();
      l.v += '.' + r.v;
      l.a = {
        get : function() { return ctx.get(o, r.v); },
        set : function(v) { ctx.set(o, r.v, v); }
      };
      return l;
    };

    return function(ctx, f, args) {
      if (typeof f == 'string') {
        if (assignments[f]) {
          return assignments[f].apply(ctx, args);
        } else if (f == '.') {
          return prop(ctx, args[0], args[1]);
        }
      }
      return obj('obj', (typeof f == 'string'? fn[f] : f).
          apply(ctx, args.map(function(arg) {
            return evalObject(ctx, arg);
          }) ) );
    };
  }();

  var evalObject = function(ctx, obj) {
    if (obj.t == 'obj') {
      return obj.v;
    } else if (obj.t == 'lis') {
      return evalObject(ctx, evalList(ctx, obj.v) );
    } else if (obj.t == 'sym') {
      return accessor(ctx, obj).get();
    } else {
      throw JSON.stringify(obj);
    }
  };

  var accessor = function(ctx, obj) {
    return obj.a || {
      get : function() { return ctx.get.call(ctx, null, obj.v); },
      set : function(v) { return ctx.set.call(ctx, null, obj.v, v); }
    };
  };

  // type and value
  var obj = function(t, v) { return { t : t, v : v }; };

  var parse = function(s) {

    var index = 0;
    var read = function() {
      return index < s.length? s.charAt(index++) : '';
    };
    var peek = function() {
      return index < s.length? s.charAt(index) : '';
    };
    var eof = function() {
      return index >= s.length;
    };

    var readNumber = function(c) {
      var n = '';
      n += c;
      if (c != '.') {
        // ipart
        while (isNum(peek() ) ) {
          n += read();
        }
        // fpart
        if (peek() == '.') {
          n += read();
          while (isNum(peek() ) ) {
            n += read();
          }
        }
      } else {
        // fpart
        while (isNum(peek() ) ) {
          n += read();
        }
      }
      if (peek() == 'e' || peek() == 'E') {
        n += read();
        if (isSign(peek() ) ) {
          n += read();
        }
        while (isNum(peek() ) ) {
          n += read();
        }
      }
      return obj('obj', +n);
    };

    var readString = function(quot) {
      var s = '';
      while (true) {
        var c = read();
        if (c == '') {
          throw 'eof';
        } else if (c == '\\') {
          s += read();
        } else if (c == quot) {
          break;
        } else {
          s += c;
        }
      }
      return obj('obj', s);
    };

    var readOperator = function(c) {
      var o = '';
      o += c;
      while (operators[o + peek()]) {
        o += read();
      }
      if (typeof operators[o] == 'undefined') {
        throw 'undefined operator:' + o;
      }
      return obj('ope', o);
    };

    var readSymbol = function(c) {
      var s = '';
      s += c;
      while (isAlp(peek() ) || isNum(peek() ) ) {
        s += read();
      }
      return obj('sym', s);
    };

    var readList = function(start) {
      var end = bracket[start];
      var lastObject = null;
      var list = [];
      while (true) {
        var o = readObject(lastObject);
        if (o == null || o.t == 'dlm' && o.v == end) {
          break;
        }
        list.push(o);
        lastObject = o;
      }
      return obj('lis', list);
    };

    var readObject = function(lastObject) {

      while (isSpc(peek() ) ) {
        read();
      }
      if (eof() ) {
        return null;
      }

      var c = read();
      if (isSign(c) ) {
        if (lastObject == null || lastObject.t == 'ope') {
          while (isSpc(peek() ) ) {
            read();
          }
          return readNumber(c);
        }
        return readOperator(c);
      } else if (c == '.' && isNum(peek() ) ) {
        return readNumber(c);
      } else if (isNum(c) ) {
        return readNumber(c);
      } else if (isQuot(c) ) {
        return readString(c);
      } else if (isOpe(c) ) {
        return readOperator(c);
      } else if (isAlp(c) ) {
        return readSymbol(c);
      } else if (bracket[c]) {
        return readList(c);
      } else {
        return obj('dlm', c);
      }
    };

    return readList(null);
  };

  var getOperatorIndex = function(list) {
    var maxPrec = 0;
    var index = -1;
    for (var i = 0; i < list.length; i += 1) {
      var op = null;
      if (list[i].t == 'ope') {
        op = list[i].v;
      } else if (list[i].t == 'sym' &&
          i + 1 < list.length && list[i + 1].t == 'lis') {
        op = '.';
      }
      if (op != null) {
        // found
        var prec = operators[op];
        if (index == -1 || (rtol[op]? maxPrec <= prec : maxPrec < prec) ) {
          maxPrec = prec;
          index = i;
        }
      }
    }
    return index;
  };

  var evalList = function(ctx, list) {

    if (list.length == 0) {
      return obj('obj', undefined);
    } else if (list.length == 1) {
      return list[0];
    }

    var index = getOperatorIndex(list);
    if (index == -1) {
      // error
      return obj('obj', { err : list });
    }

    // operator
    if (list[index].t == 'ope') {
      var op = list[index].v;
      if (op == '~' || op == '!') {
        return evalList(ctx, list.slice(0, index).
            concat([ func(ctx, op, [ list[index + 1] ]) ]).
            concat(list.slice(index + 2) ) );
      } else {
        return evalList(ctx, list.slice(0, index - 1).
            concat([ func(ctx, op,
                [ list[index - 1], list[index + 1] ]) ]).
            concat(list.slice(index + 2) ) );
      }
    } else {
      var f = accessor(ctx, list[index]).get();
      return evalList(ctx, list.slice(0, index).
          concat([ func(ctx, f, expandList(list[index + 1].v) ) ]).
          concat(list.slice(index + 2) ) );
    }
  };

  var expandList = function(list) {
    var m = [];
    var s = [];
    m.push(obj('lis', s) );
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].t == 'dlm') {
        s = [];
        m.push(obj('lis', s) );
      } else {
        s.push(list[i]);
      }
    }
    return m;
  };

  var defaultCtx = {
    get : function(o, k) { return (o || this)[k]; },
    set : function(o, k, v) { (o || this)[k] = v; }
  };
  // append Math functions
  ('acos asin atan atan2 ceil cos exp floor log ' +
   'max min pow random round sin sqrt tan').
    split(/\s+/g).forEach(function(name) {
      defaultCtx[name] = Math[name]; });

  var evalString = function(s, ctx) {
    ctx = ctx || defaultCtx;
    return evalObject(ctx, evalList(ctx, parse(s).v) );
  };

  return { evalString : evalString, parse : parse };
}();
