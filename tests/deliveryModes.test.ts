import test from 'node:test';
import assert from 'node:assert/strict';
import {preparationDaysFor,enabledCourierModes,carrierModeCode,carrierShippingName,customerShippingFee} from '../shared/deliveryModes';
test('preparation defaults to three and accepts owner changes',()=>{assert.equal(preparationDaysFor({}),3);assert.equal(preparationDaysFor({preparationDays:5}),5);assert.equal(preparationDaysFor({preparationDays:-1}),3);});
test('enabled modes and carrier mappings',()=>{assert.deepEqual(enabledCourierModes({}),['standard','express']);assert.deepEqual(enabledCourierModes({standardDeliveryEnabled:false}),['express']);assert.equal(carrierModeCode('express'),'E');assert.equal(carrierShippingName('standard'),'Surface');});
test('free standard delivery does not subsidise express',()=>{assert.equal(customerShippingFee(85,999,999,'standard'),0);assert.equal(customerShippingFee(155,999,999,'express'),155);assert.equal(customerShippingFee(85,998,999,'standard'),85);});