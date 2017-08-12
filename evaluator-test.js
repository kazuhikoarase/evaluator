'use strict';

var doTest = function(assertEquals) {

  assertEquals(false, evaluator.evalString('!1') );
  assertEquals(false, evaluator.evalString('!!0') );
  assertEquals(false, evaluator.evalString('!(1 == 1)') );
  assertEquals(false, evaluator.evalString('!!(1 != 1)') );
  assertEquals(1, evaluator.evalString('~~1.5') );

  assertEquals(0, evaluator.evalString('.0') );
  assertEquals(-0.5, evaluator.evalString('-.5') );
  assertEquals(-0.5, evaluator.evalString('-0.5') );
  assertEquals(0.5, evaluator.evalString('0.5') );
  assertEquals(0.5, evaluator.evalString('.5') );
  assertEquals(1, evaluator.evalString('1') );
  assertEquals('1', evaluator.evalString('"1"') );
  assertEquals(-0.5, evaluator.evalString('-.5') );
  assertEquals(-1, evaluator.evalString('2 * -.5') );
  assertEquals(-1, evaluator.evalString('-.5 * 2') );
  assertEquals(-2, evaluator.evalString('4-6') );
  assertEquals(-2.5, evaluator.evalString('-0.5*5') );
  assertEquals(10, evaluator.evalString('4--6') );
  assertEquals(-24, evaluator.evalString('-4*6') );
  assertEquals(24, evaluator.evalString('-4*-6') );
  assertEquals(-24, evaluator.evalString('4*-6') );
  assertEquals(27, evaluator.evalString('3+4*6') );

  assertEquals(27, evaluator.evalString('4*6+3') );
  assertEquals(24, evaluator.evalString('2*3*4') );
  assertEquals(2, evaluator.evalString('24/4/3') );
  assertEquals(42, evaluator.evalString('(3+4)*6') );
  assertEquals(42, evaluator.evalString('6*(3+4)') );
  assertEquals(42, evaluator.evalString('( 13 - 7 ) * (3+4)') );
  assertEquals(49, evaluator.evalString('(3+4)*(6 + 7 - 6)') );
  assertEquals(0, evaluator.evalString('3 * sin(0)') );
  assertEquals(0, evaluator.evalString('3 * sin(1 * 0)') );

  assertEquals(1, evaluator.evalString('min(1,3,2)') );
  assertEquals(3, evaluator.evalString('max(1,3,2)') );
  assertEquals('AB', evaluator.evalString('"A"+"B"') );
  assertEquals('AB\'"', evaluator.evalString('"A"+\'B\'+"\'"+\'"\'') );
  assertEquals(true, evaluator.evalString('1 == 1') );
  assertEquals(false, evaluator.evalString('1 == 1 + 2') );
  assertEquals(true, evaluator.evalString('4 - 1 == 1 + 2') );

  assertEquals(1, evaluator.evalString('a=b=c=1') );
  assertEquals(1, evaluator.evalString('a') );
  assertEquals(1, evaluator.evalString('b') );
  assertEquals(1, evaluator.evalString('c') );

  assertEquals(8, evaluator.evalString('c = 8') );
  assertEquals(8, evaluator.evalString('c') );
  assertEquals(11, evaluator.evalString('c += 3') );
  assertEquals(11, evaluator.evalString('c') );
  assertEquals(22, evaluator.evalString('c *= 2') );
  assertEquals(22, evaluator.evalString('c') );

  var vars = { a : 3, b : 4, d : {
    a: 1, b : 2, c : function(a, b) { return a + b; } },
    Math : Math };
  var context = {
    get : function(o, k) { return (o || vars)[k]; },
    set : function(o, k, v) { (o || vars)[k] = v; }
  };
  assertEquals(11, evaluator.evalString('a + b * 2', context) );
  assertEquals(8, evaluator.evalString('c = b * 2', context) );
  assertEquals(8, vars.c);
  assertEquals(3, evaluator.evalString('Math.min(a,b,c)', context) );
  assertEquals(8, evaluator.evalString('Math.max(a,b,c)', context) );
  assertEquals(1, evaluator.evalString('d.a', context) );
  assertEquals(2, evaluator.evalString('d.b', context) );
  assertEquals(13, evaluator.evalString('d.b = 5 * 2 + 3', context) );
  assertEquals(13, vars.d.b);
  assertEquals(13, evaluator.evalString('d.e = d.b', context) );
  assertEquals(13, vars.d.e);
  assertEquals('puke', evaluator.evalString('d.b = "puke"', context) );
  assertEquals(8, evaluator.evalString('d.c(3 * 2, 2)', context) );
};

!function() {

  var testCount = 0;
  var assertEquals = function(expected, actual) {
    testCount += 1;
    if (expected !== actual) {
      throw 'expected ' + JSON.stringify(expected) +
        ' but ' + JSON.stringify(actual);
    }
  };

  var t1 = +new Date();

  for (var i = 0; i < 1000; i += 1) {
    doTest(assertEquals);
  }

  var t2 = +new Date();

  console.log(testCount + ' tests in ' + (t2 - t1) + ' ms');
}();
