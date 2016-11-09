#Changelog

##v1.2.1 (31/10/2016)
**Handling multiple dynamic parameters.** While previously you could add only one extra param dynamically, `container.get("myThing", extraParam);` now you can add as many as you want. `container.get("myThing", extraparam1, extraParam2);` That's also true to factories. `myThingFactory.get(extraparam1, extraParam2);`
##v1.3.0 (9/11/2016)
**Introducing compostion.** When you're accessing an instance using the container you can compose the interface of your instance with other interfaces or functions. The foreign interfaces and functions will be handled as traditional traits. (Stateless with explicit conflict resolution)