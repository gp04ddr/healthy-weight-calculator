// Dependency-free regression checks for the actual inline app script.
// Run: node age-guard.test.cjs (DOM model, not a browser rendering test).
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname+'/index.html','utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function app(initialAge='32'){
  const elements={};
  function el(id){return elements[id] ||= {id,value:id==='aNum'?initialAge:'',textContent:'',innerHTML:'',style:{},hidden:false, attrs:{},classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this.attrs[k]=v},querySelector(){return el(id+'Tag')}};}
  const plans=['planLose','planKeep','planGain'].map(el);
  const ctx={document:{activeElement:null,getElementById:el,querySelectorAll:s=>s==='.plan'?plans:[]}};
  vm.createContext(ctx);vm.runInContext(script,ctx);return {ctx,el};
}
function blocked(a){
  assert.equal(a.el('adultResults').hidden,true);
  assert.equal(a.el('ageNotice').hidden,false);
  for(const id of ['bmiNum','bmiBadgeText','idealWeight','healthyRange','kcalLose','kcalKeep','kcalGain','proteinVal','bfVal'])assert.equal(a.el(id).textContent,'');
}
const a=app();assert.equal(a.el('bmiNum').textContent,'23.0');
for(const age of ['17','14','8','0','-1','17.9','18.5','91','','invalid','Infinity']){
  a.ctx.sync('a',age);blocked(a);assert.equal(a.el('aNum').value,age);
  a.ctx.setSex('f');blocked(a);a.ctx.sync('h','180');blocked(a);
}
for(const age of ['18','90','32']){a.ctx.sync('a',age);assert.equal(a.el('adultResults').hidden,false);assert.notEqual(a.el('kcalLose').textContent,'');}
for(const age of ['14','8','','91'])blocked(app(age));
assert.match(html,/<div id="adultResults" hidden>/);
assert.match(html,/\[hidden\]\{display:none !important\}/);
console.log('PASS: actual script age guard, valid boundaries, underage/invalid/empty values, repeat changes, initial values and fail-closed markup.');
