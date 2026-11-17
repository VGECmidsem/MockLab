/* OCR runs locally, only on the option region selected by the user. */
(function(root){
 'use strict';
 const LETTERS='ABCDEF';
 function parseOptions(text){
  const options=[];let current=-1;
  for(const line of String(text).replace(/\r/g,'').split('\n')){
   const match=line.match(/^\s*(?:\(([A-F])\)|([A-F])[.)\]:]|([A-F])(?=\s|$))\s*(.*)$/);
   if(match){const index=LETTERS.indexOf(match[1]||match[2]||match[3]);if(index!==options.length)return null;options.push(match[4].trim());current=index}
   else if(line.trim()){if(current<0)return null;options[current]+=(options[current]?'\n':'')+line.trim()}
  }
  return options.length>=2&&options.every(s=>s.trim())?options:null;
 }
 let libraryPromise;
 function load(){
  if(root.Tesseract)return Promise.resolve(root.Tesseract);
  if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
   const timer=setTimeout(()=>{script.remove();reject(Error('OCR download timed out. Retry or enter the option text manually.'))},45000);
   script.onload=()=>{clearTimeout(timer);root.Tesseract?resolve(root.Tesseract):reject(Error('OCR did not load.'))};
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('OCR could not load. Check your connection or enter options manually.'))};document.head.append(script);
  }).catch(e=>{libraryPromise=null;throw e});
  return libraryPromise;
 }
 async function recognize(image,onProgress=()=>{}){
  const T=await load();let worker;
  try{worker=await T.createWorker('eng',1,{logger:m=>onProgress(m.status, m.progress)});await worker.setParameters({tessedit_pageseg_mode:T.PSM.SINGLE_BLOCK});const {data}=await worker.recognize(image);return data.text}
  finally{if(worker)await worker.terminate()}
 }
 const api={parseOptions,recognize};if(typeof module!=='undefined')module.exports=api;else root.MockLabOptions=api;
})(typeof window==='undefined'?globalThis:window);
