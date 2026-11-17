const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const {parseOptions}=require('../mocklab-options.js');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const img='data:image/png;base64,AAAA';
const choices=['Red','Green','Orange','Blue'];
const json=x=>JSON.parse(JSON.stringify(x));
async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await new Promise(r=>setTimeout(r,5))}throw Error('Timed out')}
function page(file,db=new IDBFactory()){
 const d=new JSDOM(read(file),{url:'https://mocklab.test/'+file,runScripts:'outside-only',pretendToBeVisual:true});
 const w=d.window;w.indexedDB=db;w.confirm=()=>true;w.alerts=[];w.alert=s=>w.alerts.push(s);w.matchMedia=()=>({matches:false});
 w.HTMLCanvasElement.prototype.getContext=function(){return {drawImage(){},fillRect(){},getImageData:()=>({data:new Uint8ClampedArray(this.width*this.height*4)})}};
 w.HTMLCanvasElement.prototype.toDataURL=()=>img;w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
 return {d,w,db,boot(){for(const s of w.document.querySelectorAll('script')){if(s.src){const name=s.getAttribute('src');if(!name.startsWith('http'))vm.runInContext(read(name),d.getInternalVMContext())}else vm.runInContext(s.textContent,d.getInternalVMContext())}}};
}
test('parse labelled, multiline options; reject missing, duplicate and out-of-order labels',()=>{
 assert.deepEqual(parseOptions('A. Red\nB. Green\nC. Orange\nD. Blue'),choices);
 assert.deepEqual(parseOptions('(A) 2 × 3\nunits\n(B) x² + y²'),['2 × 3\nunits','x² + y²']);
 for(const text of ['Red\nGreen','A. Red\nC. Blue','A. Red\nA. Green','B. Red\nA. Blue','A.\nB. Blue'])assert.equal(parseOptions(text),null);
});
test('all application scripts parse',()=>{
 for(const name of fs.readdirSync(root).filter(f=>f.endsWith('.html')))for(const m of read(name).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:name});
 for(const name of ['mocklab-options.js','mocklab-storage.js'])new vm.Script(read(name),{filename:name});
});
test('save, reload, export and import keep exact options, source and legacy images',async()=>{
 const {d,w}=page('index.html');w.eval(read('mocklab-storage.js'));const store=w.MockLabStore;
 try{const saved=await store.save({name:'Sky',questions:[{src:img,options:choices,optionsReviewed:true,optionsSource:img},{src:img}]});
 const loaded=await store.get(saved.id);assert.deepEqual(json(loaded.questions[0].options),choices);assert.equal(loaded.questions[0].optionsReviewed,true);assert.equal(loaded.questions[1].options,null);
 const restored=await store.importPortable(store.portable(loaded));assert.deepEqual(json(restored.questions[0].options),choices);assert.equal(restored.questions[0].optionsSource,img);
 await assert.rejects(store.save({questions:[{src:img,options:['only one']}]}),/Invalid options/);
 const incomplete=await store.save({questions:[{src:img,options:['','Blue'],optionsReviewed:true}]});assert.equal(incomplete.questions[0].optionsReviewed,false);
 }finally{d.window.close()}
});
test('exam renders text as text, preserves selection, and uses per-question keyboard limits',async()=>{
 const p=page('index.html');p.boot();const {w,d}=p;
 try{await until(()=>w.document.querySelector('#qualityGate').textContent.includes('Built-in'));
 const saved=await w.MockLabStore.save({name:'Sky',questions:[{src:img,qa:'ready',options:choices,optionsReviewed:true},{src:img,qa:'ready',options:['<img src=x onerror=alert(1)>','Other'],optionsReviewed:true},{src:img,qa:'ready'}]});
 await w.refreshSets(true);w.document.querySelector('#start').click();
 assert.deepEqual([...w.document.querySelectorAll('.choice')].map(e=>e.textContent),['A. Red','B. Green','C. Orange','D. Blue']);
 w.document.querySelectorAll('.choice')[3].click();w.document.querySelector('#next').click();
 assert.equal(w.document.querySelectorAll('.choice').length,2);assert.equal(w.document.querySelector('#choices img'),null);
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'D'}));assert.equal(w.document.querySelector('.choice.selected'),null);
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'B'}));assert.equal(w.document.querySelector('.choice.selected').textContent,'B. Other');
 w.document.querySelector('#prev').click();assert.equal(w.document.querySelector('.choice.selected').textContent,'D. Blue');
 w.document.querySelector('#clear').click();assert.equal(w.document.querySelector('.choice.selected'),null);
 w.document.querySelector('#next').click();w.document.querySelector('#next').click();assert.equal(w.document.querySelectorAll('.choice').length,4);assert.equal(w.document.querySelector('.choice').textContent,'A');
 assert.equal(w.getComputedStyle(w.document.querySelector('.choice')).backgroundColor,'rgb(255, 255, 255)');
 w.document.querySelector('#themeToggle').click();assert.equal(w.getComputedStyle(w.document.querySelector('.choice')).backgroundColor,'rgb(23, 38, 58)');
 }finally{d.window.close()}
});
test('unconfirmed extracted options cannot start, even with preview override',async()=>{
 const p=page('index.html');p.boot();const {w,d}=p;
 try{await until(()=>w.document.querySelector('#qualityGate').textContent.includes('Built-in'));
 await w.MockLabStore.save({questions:[{src:img,qa:'ready',options:choices,optionsReviewed:false}]});await w.refreshSets(true);w.document.querySelector('#unreviewedOverride').checked=true;w.start();assert.match(w.alerts.at(-1),/confirm all extracted options/);assert.equal(w.document.querySelector('#exam').classList.contains('hidden'),true);
 }finally{d.window.close()}
});
test('review edits invalidate approval and persist corrected options',async()=>{
 const p=page('review.html');const {w,d}=p;w.eval(read('mocklab-storage.js'));
 await w.MockLabStore.save({questions:[{src:img,qa:'ready',options:choices,optionsReviewed:true,optionsSource:img}]});p.boot();
 try{await until(()=>w.document.querySelectorAll('#reviewOptionFields textarea').length===4);
 const field=w.document.querySelector('#reviewOptionFields textarea');field.value='Crimson';field.dispatchEvent(new w.Event('input'));
 assert.equal(w.document.querySelector('#confirmOptions').checked,false);assert.equal(w.document.querySelector('#qa').value,'pending');
 w.document.querySelector('#qa').value='ready';w.document.querySelector('#qa').dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelector('#qa').value,'pending');
 w.document.querySelector('#confirmOptions').checked=true;w.document.querySelector('#confirmOptions').dispatchEvent(new w.Event('change'));
 w.document.querySelector('#qa').value='ready';w.document.querySelector('#qa').dispatchEvent(new w.Event('change'));await w.document.querySelector('#save').onclick();
 const saved=await w.MockLabStore.get();assert.equal(saved.questions[0].options[0],'Crimson');assert.equal(saved.questions[0].optionsReviewed,true);assert.equal(saved.questions[0].optionsSource,img);
 }finally{d.window.close()}
});
test('cropper sends only selected options to OCR and requires confirmation',async()=>{
 const p=page('cropper.html');p.boot();const {w,d}=p;
 try{
 w.eval('doc={};canvas.width=800;canvas.height=1000;selection={x:10,y:20,width:600,height:200};drawSelection()');w.document.querySelector('#add').click();
 assert.equal(w.document.querySelectorAll('#optionFields textarea').length,4);
 await w.document.querySelector('#sendToExam').onclick();assert.match(w.document.querySelector('#status').textContent,/confirm every/);
 let received,terminated=false;
 w.Tesseract={PSM:{SINGLE_BLOCK:6},createWorker:async()=>({setParameters:async()=>{},recognize:async(source)=>{received=source;return {data:{text:'A. Red\nB. Green\nC. Orange\nD. Blue'}}},terminate:async()=>{terminated=true}})};
 const drawn=[];w.HTMLCanvasElement.prototype.getContext=()=>({drawImage:(...args)=>drawn.push(args)});
 w.eval('selection={x:30,y:300,width:650,height:400}');await w.document.querySelector('#readOptions').onclick();
 assert.equal(received,img);assert.equal(terminated,true);assert.deepEqual(drawn[0].slice(1,5),[30,300,650,400]);
 assert.deepEqual([...w.document.querySelectorAll('#optionFields textarea')].map(e=>e.value),choices);assert.equal(w.document.querySelector('#optionsReviewed').checked,false);
 w.document.querySelector('#optionsReviewed').checked=true;w.document.querySelector('#optionsReviewed').dispatchEvent(new w.Event('change'));assert.equal(w.eval('crops[0].optionsReviewed'),true);
 w.document.querySelector('#optionFields textarea').value='Edited';w.document.querySelector('#optionFields textarea').dispatchEvent(new w.Event('input'));assert.equal(w.eval('crops[0].optionsReviewed'),false);
 }finally{d.window.close()}
});
