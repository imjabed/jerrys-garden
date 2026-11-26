import test from 'node:test';
import assert from 'node:assert/strict';
import {validParcel,estimateParcel,chargeableGrams} from '../shared/parcelShipping';
const p={parcelLengthCm:35,parcelWidthCm:25,parcelHeightCm:15,parcelWeightGrams:500};
test('packed box volumetric estimate exceeds dead weight',()=>{assert.equal(chargeableGrams(p),2625);});
test('multi-item single box estimate includes quantity',()=>{const box=estimateParcel([{bouquet:p,quantity:2}]);assert.ok(box);assert.equal(box.parcelWeightGrams,1000);assert.equal(chargeableGrams(box),5250);});
test('missing measurements fail closed',()=>{assert.equal(validParcel({parcelWeightGrams:500}),false);assert.equal(estimateParcel([{bouquet:{parcelWeightGrams:500},quantity:1}]),null);});
