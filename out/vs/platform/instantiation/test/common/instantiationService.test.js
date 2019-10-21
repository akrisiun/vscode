/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors"], function (require, exports, assert, instantiation_1, instantiationService_1, serviceCollection_1, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let IService1 = instantiation_1.createDecorator('service1');
    class Service1 {
        constructor() {
            this.c = 1;
        }
    }
    let IService2 = instantiation_1.createDecorator('service2');
    class Service2 {
        constructor() {
            this.d = true;
        }
    }
    let IService3 = instantiation_1.createDecorator('service3');
    class Service3 {
        constructor() {
            this.s = 'farboo';
        }
    }
    let IDependentService = instantiation_1.createDecorator('dependentService');
    let DependentService = class DependentService {
        constructor(service) {
            this.name = 'farboo';
            assert.equal(service.c, 1);
        }
    };
    DependentService = __decorate([
        __param(0, IService1)
    ], DependentService);
    let Service1Consumer = class Service1Consumer {
        constructor(service1) {
            assert.ok(service1);
            assert.equal(service1.c, 1);
        }
    };
    Service1Consumer = __decorate([
        __param(0, IService1)
    ], Service1Consumer);
    let Target2Dep = class Target2Dep {
        constructor(service1, service2) {
            assert.ok(service1 instanceof Service1);
            assert.ok(service2 instanceof Service2);
        }
    };
    Target2Dep = __decorate([
        __param(0, IService1), __param(1, IService2)
    ], Target2Dep);
    let TargetWithStaticParam = class TargetWithStaticParam {
        constructor(v, service1) {
            assert.ok(v);
            assert.ok(service1);
            assert.equal(service1.c, 1);
        }
    };
    TargetWithStaticParam = __decorate([
        __param(1, IService1)
    ], TargetWithStaticParam);
    let TargetNotOptional = class TargetNotOptional {
        constructor(service1, service2) {
        }
    };
    TargetNotOptional = __decorate([
        __param(0, IService1), __param(1, IService2)
    ], TargetNotOptional);
    let TargetOptional = class TargetOptional {
        constructor(service1, service2) {
            assert.ok(service1);
            assert.equal(service1.c, 1);
            assert.ok(service2 === undefined);
        }
    };
    TargetOptional = __decorate([
        __param(0, IService1), __param(1, instantiation_1.optional(IService2))
    ], TargetOptional);
    let DependentServiceTarget = class DependentServiceTarget {
        constructor(d) {
            assert.ok(d);
            assert.equal(d.name, 'farboo');
        }
    };
    DependentServiceTarget = __decorate([
        __param(0, IDependentService)
    ], DependentServiceTarget);
    let DependentServiceTarget2 = class DependentServiceTarget2 {
        constructor(d, s) {
            assert.ok(d);
            assert.equal(d.name, 'farboo');
            assert.ok(s);
            assert.equal(s.c, 1);
        }
    };
    DependentServiceTarget2 = __decorate([
        __param(0, IDependentService), __param(1, IService1)
    ], DependentServiceTarget2);
    let ServiceLoop1 = class ServiceLoop1 {
        constructor(s) {
            this.c = 1;
        }
    };
    ServiceLoop1 = __decorate([
        __param(0, IService2)
    ], ServiceLoop1);
    let ServiceLoop2 = class ServiceLoop2 {
        constructor(s) {
            this.d = true;
        }
    };
    ServiceLoop2 = __decorate([
        __param(0, IService1)
    ], ServiceLoop2);
    suite('Instantiation Service', () => {
        test('service collection, cannot overwrite', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let result = collection.set(IService1, null);
            assert.equal(result, undefined);
            result = collection.set(IService1, new Service1());
            assert.equal(result, null);
        });
        test('service collection, add/has', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            collection.set(IService1, null);
            assert.ok(collection.has(IService1));
            collection.set(IService2, null);
            assert.ok(collection.has(IService1));
            assert.ok(collection.has(IService2));
        });
        test('@Param - simple clase', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            collection.set(IService3, new Service3());
            service.createInstance(Service1Consumer);
        });
        test('@Param - fixed args', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            collection.set(IService3, new Service3());
            service.createInstance(TargetWithStaticParam, true);
        });
        test('service collection is live', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            collection.set(IService1, new Service1());
            let service = new instantiationService_1.InstantiationService(collection);
            service.createInstance(Service1Consumer);
            // no IService2
            assert.throws(() => service.createInstance(Target2Dep));
            service.invokeFunction(function (a) {
                assert.ok(a.get(IService1));
                assert.ok(!a.get(IService2, instantiation_1.optional));
            });
            collection.set(IService2, new Service2());
            service.createInstance(Target2Dep);
            service.invokeFunction(function (a) {
                assert.ok(a.get(IService1));
                assert.ok(a.get(IService2));
            });
        });
        test('@Param - optional', function () {
            let collection = new serviceCollection_1.ServiceCollection([IService1, new Service1()]);
            let service = new instantiationService_1.InstantiationService(collection, true);
            service.createInstance(TargetOptional);
            assert.throws(() => service.createInstance(TargetNotOptional));
            service = new instantiationService_1.InstantiationService(collection, false);
            service.createInstance(TargetOptional);
            service.createInstance(TargetNotOptional);
        });
        // we made this a warning
        // test('@Param - too many args', function () {
        // 	let service = instantiationService.create(Object.create(null));
        // 	service.addSingleton(IService1, new Service1());
        // 	service.addSingleton(IService2, new Service2());
        // 	service.addSingleton(IService3, new Service3());
        // 	assert.throws(() => service.createInstance(ParameterTarget2, true, 2));
        // });
        // test('@Param - too few args', function () {
        // 	let service = instantiationService.create(Object.create(null));
        // 	service.addSingleton(IService1, new Service1());
        // 	service.addSingleton(IService2, new Service2());
        // 	service.addSingleton(IService3, new Service3());
        // 	assert.throws(() => service.createInstance(ParameterTarget2));
        // });
        test('SyncDesc - no dependencies', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            service.invokeFunction(accessor => {
                let service1 = accessor.get(IService1);
                assert.ok(service1);
                assert.equal(service1.c, 1);
                let service2 = accessor.get(IService1);
                assert.ok(service1 === service2);
            });
        });
        test('SyncDesc - service with service dependency', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            collection.set(IDependentService, new descriptors_1.SyncDescriptor(DependentService));
            service.invokeFunction(accessor => {
                let d = accessor.get(IDependentService);
                assert.ok(d);
                assert.equal(d.name, 'farboo');
            });
        });
        test('SyncDesc - target depends on service future', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            collection.set(IDependentService, new descriptors_1.SyncDescriptor(DependentService));
            let d = service.createInstance(DependentServiceTarget);
            assert.ok(d instanceof DependentServiceTarget);
            let d2 = service.createInstance(DependentServiceTarget2);
            assert.ok(d2 instanceof DependentServiceTarget2);
        });
        test('SyncDesc - explode on loop', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(ServiceLoop1));
            collection.set(IService2, new descriptors_1.SyncDescriptor(ServiceLoop2));
            assert.throws(() => {
                service.invokeFunction(accessor => {
                    accessor.get(IService1);
                });
            });
            assert.throws(() => {
                service.invokeFunction(accessor => {
                    accessor.get(IService2);
                });
            });
            try {
                service.invokeFunction(accessor => {
                    accessor.get(IService1);
                });
            }
            catch (err) {
                assert.ok(err.name);
                assert.ok(err.message);
            }
        });
        test('Invoke - get services', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.equal(accessor.get(IService1).c, 1);
                return true;
            }
            assert.equal(service.invokeFunction(test), true);
        });
        test('Invoke - get service, optional', function () {
            let collection = new serviceCollection_1.ServiceCollection([IService1, new Service1()]);
            let service = new instantiationService_1.InstantiationService(collection);
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.throws(() => accessor.get(IService2));
                assert.equal(accessor.get(IService2, instantiation_1.optional), undefined);
                return true;
            }
            assert.equal(service.invokeFunction(test), true);
        });
        test('Invoke - keeping accessor NOT allowed', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            let cached;
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.equal(accessor.get(IService1).c, 1);
                cached = accessor;
                return true;
            }
            assert.equal(service.invokeFunction(test), true);
            assert.throws(() => cached.get(IService2));
        });
        test('Invoke - throw error', function () {
            let collection = new serviceCollection_1.ServiceCollection();
            let service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            function test(accessor) {
                throw new Error();
            }
            assert.throws(() => service.invokeFunction(test));
        });
        test('Create child', function () {
            let serviceInstanceCount = 0;
            const CtorCounter = class {
                constructor() {
                    this.c = 1;
                    serviceInstanceCount += 1;
                }
            };
            // creating the service instance BEFORE the child service
            let service = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([IService1, new descriptors_1.SyncDescriptor(CtorCounter)]));
            service.createInstance(Service1Consumer);
            // second instance must be earlier ONE
            let child = service.createChild(new serviceCollection_1.ServiceCollection([IService2, new Service2()]));
            child.createInstance(Service1Consumer);
            assert.equal(serviceInstanceCount, 1);
            // creating the service instance AFTER the child service
            serviceInstanceCount = 0;
            service = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([IService1, new descriptors_1.SyncDescriptor(CtorCounter)]));
            child = service.createChild(new serviceCollection_1.ServiceCollection([IService2, new Service2()]));
            // second instance must be earlier ONE
            service.createInstance(Service1Consumer);
            child.createInstance(Service1Consumer);
            assert.equal(serviceInstanceCount, 1);
        });
    });
});
//# sourceMappingURL=instantiationService.test.js.map