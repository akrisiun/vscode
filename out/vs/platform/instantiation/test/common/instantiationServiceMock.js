/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection"], function (require, exports, sinon, instantiationService_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestInstantiationService = void 0;
    const isSinonSpyLike = (fn) => fn && 'callCount' in fn;
    class TestInstantiationService extends instantiationService_1.InstantiationService {
        constructor(_serviceCollection = new serviceCollection_1.ServiceCollection()) {
            super(_serviceCollection);
            this._serviceCollection = _serviceCollection;
            this._servciesMap = new Map();
        }
        get(service) {
            return this._serviceCollection.get(service);
        }
        set(service, instance) {
            return this._serviceCollection.set(service, instance);
        }
        mock(service) {
            return this._create(service, { mock: true });
        }
        stub(serviceIdentifier, arg2, arg3, arg4) {
            let service = typeof arg2 !== 'string' ? arg2 : undefined;
            let serviceMock = { id: serviceIdentifier, service: service };
            let property = typeof arg2 === 'string' ? arg2 : arg3;
            let value = typeof arg2 === 'string' ? arg3 : arg4;
            let stubObject = this._create(serviceMock, { stub: true }, service && !property);
            if (property) {
                if (stubObject[property]) {
                    if (stubObject[property].hasOwnProperty('restore')) {
                        stubObject[property].restore();
                    }
                    if (typeof value === 'function') {
                        const spy = isSinonSpyLike(value) ? value : sinon.spy(value);
                        stubObject[property] = spy;
                        return spy;
                    }
                    else {
                        const stub = value ? sinon.stub().returns(value) : sinon.stub();
                        stubObject[property] = stub;
                        return stub;
                    }
                }
                else {
                    stubObject[property] = value;
                }
            }
            return stubObject;
        }
        stubPromise(arg1, arg2, arg3, arg4) {
            arg3 = typeof arg2 === 'string' ? Promise.resolve(arg3) : arg3;
            arg4 = typeof arg2 !== 'string' && typeof arg3 === 'string' ? Promise.resolve(arg4) : arg4;
            return this.stub(arg1, arg2, arg3, arg4);
        }
        spy(service, fnProperty) {
            let spy = sinon.spy();
            this.stub(service, fnProperty, spy);
            return spy;
        }
        _create(arg1, options, reset = false) {
            if (this.isServiceMock(arg1)) {
                let service = this._getOrCreateService(arg1, options, reset);
                this._serviceCollection.set(arg1.id, service);
                return service;
            }
            return options.mock ? sinon.mock(arg1) : this._createStub(arg1);
        }
        _getOrCreateService(serviceMock, opts, reset) {
            let service = this._serviceCollection.get(serviceMock.id);
            if (!reset && service) {
                if (opts.mock && service['sinonOptions'] && !!service['sinonOptions'].mock) {
                    return service;
                }
                if (opts.stub && service['sinonOptions'] && !!service['sinonOptions'].stub) {
                    return service;
                }
            }
            return this._createService(serviceMock, opts);
        }
        _createService(serviceMock, opts) {
            serviceMock.service = serviceMock.service ? serviceMock.service : this._servciesMap.get(serviceMock.id);
            let service = opts.mock ? sinon.mock(serviceMock.service) : this._createStub(serviceMock.service);
            service['sinonOptions'] = opts;
            return service;
        }
        _createStub(arg) {
            return typeof arg === 'object' ? arg : sinon.createStubInstance(arg);
        }
        isServiceMock(arg1) {
            return typeof arg1 === 'object' && arg1.hasOwnProperty('id');
        }
    }
    exports.TestInstantiationService = TestInstantiationService;
});
//# sourceMappingURL=instantiationServiceMock.js.map