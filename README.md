[![Build Status](https://travis-ci.org/ottopecz/mainliner.svg?branch=master)](https://travis-ci.org/ottopecz/mainliner)[![Dependency status](https://david-dm.org/ottopecz/mainliner/status.svg)](https://david-dm.org/ottopecz/mainliner#info=dependencies) [![devDependency Status](https://david-dm.org/ottopecz/mainliner/dev-status.svg)](https://david-dm.org/ottopecz/mainliner#info=devDependencies)

[![NPM](https://nodei.co/npm/mainliner.png?downloads=true)](https://www.npmjs.com/package/mainliner/)

# mainliner

Inversion of control container and dependency injector for node6 spiced with [talent composition](http://scg.unibe.ch/archive/papers/Ress12eTalentsSPE.pdf).

With **mainliner** you can create ioc containers. You can register your classes, functions and other things on the container. When you are accessing a class, **mainliner** is going to create the instance for you. If you defined dependencies for the class they will also be instantiated recursively. If you want you can even do basic composition with the interface of other classes and functions. You can also manage the life cycle of the instances. You can just tell **mainliner** which instance is supposed to be a generic singleton, a singleton per request perhaps a unique.
The inspiration is the excellent [intravenous](github.com/RoyJacobs/intravenous) which seems to be abandoned. All the interfaces of [intravenous](github.com/RoyJacobs/intravenous) reimplemented from scratch in node6. With some exceptions...

Differences between **mainliner** and **intravenous**

1. **mainliner** supports native classes. Yay!!!
2. You cannot dispose anything with **mainliner**(yet). Boo!!! Hence there are no sub-containers.
3. You can do composition with **mainliner** using talents. 


You can register 3 kinds of things on a **mainliner** container

1. **class** - It will be instantiated and the instance will be returned/injected
2. **function** - It will be executed and whatever it returns will be returned/injected
3. **passthrough** - Anything which is not a class or a function will be returned/injected as it is

## Getting started
#### Basics

To install **mainliner**:
```bash
npm install mainliner
```
To import **mainliner**: 
```javascript
const mainliner = require("mainliner");
```
To create an ioc container: 
```javascript
const container = mainliner.create();
```
To register a class:
```javascript
class MyClass {}
container.register("myThing", MyClass);
```
To get out the instance from the container: 
```javascript
const myThing = container.get("myThing")
```
To declare dependencies:
```javascript
class MyClass {
  constructor(dependency) {};
}
MyClass.$inject = ["dependency"] 
```
To declare basic composition
```javascript
class MyClass {
  constructor(dependency) {};
}
MyClass.$compose = ["talent"];
```

#### A working example (copy/paste it. It will just run.)
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class DoesSomeThingForMe {}
function returnsThingForMe() {return "aThing";}
const globalData = {"foo": "bar"};

// My class
class MyClass {
  constructor(doesSomethingForMe, returnedThing, gd) {
    assert.ok(doesSomethingForMe instanceof DoesSomeThingForMe);
    assert.equal(returnedThing, "aThing");
    assert.equal(gd, globalData);
  }
}

// Declare dependencies
MyClass.$inject = ["doesSomethingForMe", "returnedThing", "gd"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("doesSomethingForMe", DoesSomeThingForMe);
container.register("returnedThing", returnsThingForMe);
container.register("gd", globalData);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);
```

## Advanced usage
#### Pass extra parameters
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
const globalData = {"foo": "bar"};

// My class
class MyClass {
  constructor(gd, extraParam1, extraParam2) {
    assert.equal(gd, globalData);
    assert.equal(extraParam1, "extraParam1");
    assert.equal(extraParam2, "extraParam2");
  }
}

// Declare dependencies
MyClass.$inject = ["gd"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("gd", globalData);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing", "extraParam1", "extraParam2");

assert.ok(myThing instanceof MyClass);
```

#### Creating instances runtime
You can factorize a class - Only a class - by appending suffix "Factory" to it's registered name. If you do so the injector will inject an object which has a get method which will instantiate the class for you anytime you want
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
const globalData = {"foo": "bar"};
class DoesSomethingThingForMe {
  constructor(gd, param1, param2) {
    assert.equal(gd, globalData);
    assert.equal(param1, "factoryParam1");
    assert.equal(param2, "factoryParam2");
  }
}

// Declare dependencies
DoesSomethingThingForMe.$inject = ["globalData"];

// My class
class MyClass {
  constructor(doesSomethingForMeFactory) {
    const instance = doesSomethingForMeFactory.get("factoryParam1", "factoryParam2");
    assert.ok(instance instanceof DoesSomethingThingForMe);
  }
}

// Declare dependencies
MyClass.$inject = ["doesSomethingForMeFactory"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("globalData", globalData);
container.register("doesSomethingForMe", DoesSomethingThingForMe);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);
```

#### Optional dependency
You can declare something as optional if you add the "?" suffix to it's name
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
const globalData = {"foo": "bar"};

// My class
class MyClass {
  constructor(gd) {
    assert.equal(gd, null);
  }
}

// Declare dependencies
MyClass.$inject = ["gd?"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
// global data is not registered but optional
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);
```

## Life cycles
You can define the life cycle of an instance (so it works only for classes). There are three life cycles.

1. **perRequest** - The default life cycle of an instance. If you don't specify anything upon registration your instance will be a "perRequest" one. A request means one execution of the "get" method of the container. If the same class is accessed more times upon a request the instance will be created just once. So the same instance will injected multiple times.
2. **singleton** - The instance will be created only once no matter how many requests you make.
3. **unique** - The instance will be created every single time the class is accessed. No matter how many requests you make

#### perRequest
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class OnePerRequest {}

class Class2 {
  constructor(onePerRequest) {
    assert.ok(onePerRequest instanceof OnePerRequest);
    this.refToOnePerRequest = onePerRequest
  }
}

// Declare dependencies
Class2.$inject = ["onePerRequest"];

// My class
class Class1 {
  constructor(dependency1, onePerRequest) {
    assert.ok(onePerRequest instanceof OnePerRequest);
    dependency1.refToOnePerRequest.extraProp = "extraPop"; // Adding property to reference to the previous injection
    assert.equal(onePerRequest.extraProp, "extraPop"); // If the same instance the extra property must be there
  }
}

// Declare dependencies
Class1.$inject = ["dependency1", "onePerRequest"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("onePerRequest", OnePerRequest, "perRequest");
container.register("dependency1", Class2);
container.register("myThing", Class1);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof Class1);
```

#### singleton
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class Singleton {}

// My class
class MyClass {
  constructor(single) {
    assert.ok(single instanceof Singleton);
    this.single = single;
  }
}

// Declare dependencies
MyClass.$inject = ["single"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("single", Singleton, "singleton");
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing1 = container.get("myThing");
const myThing2 = container.get("myThing");

assert.ok(myThing1 instanceof MyClass);
assert.ok(myThing2 instanceof MyClass);
myThing1.single.extraProp = "extraProp";
assert.equal(myThing2.single.extraProp, "extraProp"); // The extra property shows up hence it's a singleton
```

#### unique
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class Unique {}

class Class2 {
  constructor(unique) {
    assert.ok(unique instanceof Unique);
    this.refToUnique = unique
  }
}

// Declare dependencies
Class2.$inject = ["unique"];

// My class
class Class1 {
  constructor(dependency1, unique) {
    assert.ok(unique instanceof Unique);
    dependency1.refToUnique.extraProp = "extraPop"; // Adding property to reference to the previous injection
    assert.ifError(unique.extraProp); // If this a unique the extra property should not be there
  }
}

// Declare dependencies
Class1.$inject = ["dependency1", "unique"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("unique", Unique, "unique");
container.register("dependency1", Class2);
container.register("myThing", Class1);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof Class1);
```

## Composition
You can compose the instance of the class with registered talents. The methods of the talents are gonna be delegated on to the instance itself.
#### Composition with talents
Conflicts between methods of talents are supposed to be resolved explicitly using either aliasing or excluding. Conflicts between talents and the instance get resolved implicitly which means a talent method overrides an instance method automatically no mather what
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// My first talent
const talent1 = mainliner.createTalent({
  method1() {}
});

// My second talent
const talent2 = mainliner.createTalent({
  method2() {}
});


// My class
class MyClass {}

// Declare composition
MyClass.$compose = ["talent1", "talent2"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("talent1", talent1);
container.register("talent2", talent2);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);

// The instance has the foreign methods
assert.ok(myThing.method1);
assert.ok(myThing.method2);
```
#### Composition when a member is required in the constructor of a class
You can mark a member as required in the constructor of a class. The member need to implemented/provided by a talent
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// My talent
const talent = mainliner.createTalent({
  method2() {}
});

// My class
class MyClass {
  constructor() {
    this.method2 = mainliner.required;
  }
  method1() {
    this.method2();
  }
}

// Declare composition
MyClass.$compose = ["talent"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("talent", talent);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);

// The instance has the foreign methods
assert.ok(myThing.method1);
assert.ok(myThing.method2);
assert.deepEqual(myThing.method2, talent.method2);
```
#### Composition when a member is required on the prototype of a class
You can mark a member as required on the prototype of a class. The member need to implemented/provided by a talent
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// My talent
const talent = mainliner.createTalent({
  method2() {}
});

// My class
class MyClass {
  get method2() {
    return mainliner.required;
  }
  method1() {
    this.method2();
  }
}

// Declare composition
MyClass.$compose = ["talent"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("talent", talent);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);

// The instance has the foreign methods
assert.ok(myThing.method1);
assert.ok(myThing.method2);
assert.deepEqual(myThing.method2, talent.method2);
```
#### Composition with explicit alias type conflict resolution between talents
You can alias a conflicting method using a special notation in the compose list like: `$compose = ["talent: toRename > renamed"]`
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// My first talent
const talent1 = mainliner.createTalent({
  method() {
    console.log("talent1 method");
  }
});

// My second talent
const talent2 = mainliner.createTalent({
  method() {
    console.log("talent2 method");
  }
});

// My class
class MyClass {}

// Declare composition
MyClass.$compose = ["talent1: method > renamed", "talent2"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("talent1", talent1);
container.register("talent2", talent2);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);

// The instance has the foreign methods
assert.ok(myThing.method);
assert.deepEqual(myThing.method, talent2.method);
```

#### Composition with explicit exclude type conflict resolution between talents
You can alias a conflicting method using a special notation in the compose list like: `$compose = ["talent: toRemove -"]`
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// My first talent
const talent1 = mainliner.createTalent({
  method() {
    console.log("talent1 method");
  }
});

// My second talent
const talent2 = mainliner.createTalent({
  method() {
    console.log("talent2 method");
  }
});

// My class
class MyClass {}

// Declare composition
MyClass.$compose = ["talent1: method-", "talent2"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("talent1", talent1);
container.register("talent2", talent2);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);

// The instance has the foreign methods
assert.ok(myThing.method);
assert.deepEqual(myThing.method, talent2.method);
```

#### Note on testing when you're doing software composition

You might not want to use an ioc container when you're testing your thing. However I still recommend to write test for your composed instances. How? Download the tool wich works under the hood of mainliner and does the composition for you. It's called [talentcomposer](https://www.npmjs.com/package/talentcomposer) With this tool you can do the same compositions like you would do with mainliner. See the [readme](https://github.com/ottopecz/talentcomposer/blob/master/README.md) for the details.



## Links
Roy Jacobs' [intravenous](https://github.com/RoyJacobs/intravenous) and Mark Seeman's [blog](http://blog.ploeh.dk/)
[Talents](http://scg.unibe.ch/archive/papers/Ress12eTalentsSPE.pdf) by the Software Composition Group part of the Institute of Computer Science (INF) at the University of Berne
[Role orinted programming](https://en.wikipedia.org/wiki/Role-oriented_programming) on Wikipedia