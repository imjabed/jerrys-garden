import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDeliveryAddress, normalizeDeliveryAddressBook } from '../shared/deliveryAddress';

const address = { fullName:'Example Recipient', email:'PERSON@example.com', phone:'1234567890', city:'Berhampore', deliveryAddress:'Example Street', pincode:'742101' };
test('saved addresses use the exact checkout fields and omit order-only data',()=>{
  assert.deepEqual(normalizeDeliveryAddress({...address, giftNote:'do not save'}), {...address,email:'person@example.com'});
});
test('reject incomplete, invalid and unsafe addresses',()=>{
  assert.equal(normalizeDeliveryAddress({...address,pincode:'123'}),null);
  assert.equal(normalizeDeliveryAddress({...address,city:''}),null);
  assert.equal(normalizeDeliveryAddress({...address,deliveryAddress:'<script>'}),null);
  assert.equal(normalizeDeliveryAddress({...address,email:'bad'}),null);
});
test('address book deduplicates and limits entries',()=>{
  assert.equal(normalizeDeliveryAddressBook([address,address])?.length,1);
  assert.equal(normalizeDeliveryAddressBook(Array(11).fill(address)),null);
  assert.deepEqual(normalizeDeliveryAddressBook([]),[]);
});
