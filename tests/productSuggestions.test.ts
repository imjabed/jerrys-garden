import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestProducts} from '../src/services/productSuggestions';
import {DEFAULT_SITE_CONTENT,sanitizeSiteContent,CUSTOMER_TEXT_FIELDS} from '../shared/siteEditor';
import type {RibbonBouquet} from '../src/types';
const make=(id:string,title:string,category:string,description='')=>({id,title,category,description,inStock:true,ribbonColors:[]}) as RibbonBouquet;
test('search suggests products from the first character and prioritizes title prefix',()=>{
 const products=[make('1','Pink Rose','Ribbon Bouquets'),make('2','Rose Bouquet','Ribbon Bouquets'),make('3','Tulip','Decor','red flower')];
 assert.equal(suggestProducts(products,'r')[0].id,'2');
 assert.equal(suggestProducts(products,'ROSE B')[0].id,'2');
 assert.deepEqual(suggestProducts(products,'not found'),[]);
 assert.deepEqual(suggestProducts(products,' '),[]);
});
test('new homepage copy and safe cart icon persist',()=>{
 const c=sanitizeSiteContent({...DEFAULT_SITE_CONTENT,cartIconUrl:'https://res.cloudinary.com/example/image/upload/cart.png',customerText:{'nav.brandName':'My shop','story.keep.title':'Forever','footer.careHeading':'Care guide','custom.noPayment':'Pay after confirmation'}});
 assert.equal(c.cartIconUrl,'https://res.cloudinary.com/example/image/upload/cart.png');
 assert.equal(c.customerText['nav.brandName'],'My shop');
 assert.equal(c.customerText['story.keep.title'],'Forever');
 assert.equal(c.customerText['footer.careHeading'],'Care guide');
 assert.equal(c.customerText['custom.noPayment'],'Pay after confirmation');
 assert.equal(sanitizeSiteContent({...c,cartIconUrl:'javascript:alert(1)'}).cartIconUrl,'');
 assert.ok(CUSTOMER_TEXT_FIELDS.some(f=>f.id==='footer.privacyPolicy'));
});
