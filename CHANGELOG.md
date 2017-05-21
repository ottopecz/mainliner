# Changelog

## v1.2.1 (31/10/2016)
**Handling multiple dynamic parameters.** While previously you could add only one extra param dynamically, `container.get("myThing", extraParam);` now you can add as many as you want. `container.get("myThing", extraparam1, extraParam2);` That's also true to factories. `myThingFactory.get(extraparam1, extraParam2);`
## v1.3.0 (9/11/2016)
**Introducing compostion.** When you're accessing an instance using the container you can compose the interface of your instance with other interfaces or functions. The foreign interfaces and functions will be handled as traditional traits. (Stateless with explicit conflict resolution)
## v2.0.0 (17/01/2017)
**Introducing talent composition** Asymmetric software composition with talents using [talentcomposer](https://www.npmjs.com/package/talentcomposer)
## v2.0.1 (18/01/2017)
**Updating changelog and readme**
## v2.0.2 (19/01/2017)
**Updating readme**
## v2.0.3 (19/01/2017)
**Fixing readme**
## v2.0.5 (23/01/2017)
**Upgrading talentcomposer which can use talents from multiple sources**
## v2.0.6 (24/01/2017)
**Upgrading talentcomposer.** Going back to proper type check for talents. If using a talent created by an other installment of the package is necessary I recommend to recreate the talent using the Talent constructor. Like: `const copiedTalent = mainliner.createTalent(talent)`
## v2.1.0 (31/01/2017)
**Upgrading talentcomposer.** Making possible to declare a required member on the prototype of a class
## v2.1.1 (05/03/2017)
**Upgrading talentcomposer.** Refactoring for better encapsulation
## v3.0.0 (17/05/2017)
**Upgrading talentcomposer. Removing node4 build** Removing node4 build from package. Also upgrading talentcomposer which node4 build was also removed
## v3.0.1 (19/05/2017)
**Adding badges** Adding dependency (david-dm.org) and npm badges
## v3.0.2 (19/05/2017)
**Removing node4 build note from readme** The node4 build is no longer available so the corresponding note has to be removed
## v3.0.3 (19/05/2017)
**Fixing package.json** Fixing description in package.json
## v3.0.4 (21/05/2017)
**Adding test coverage badge** Adding test coverage (coveralls.io) badge