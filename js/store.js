/* All writes stay in this browser. This is not a server authentication system. */
import { CINEMATCH_DATA } from './data.js';
export const Store = (() => {
 const prefix='cinematch-local-v2:'; const memory=new Map();
 const clone=o=>JSON.parse(JSON.stringify(o));
 function read(k,fallback){try{const s=localStorage.getItem(prefix+k);return s?JSON.parse(s):clone(fallback);}catch{return memory.has(k)?clone(memory.get(k)):clone(fallback);}}
 function write(k,v){try{localStorage.setItem(prefix+k,JSON.stringify(v));}catch(e){if(e.name==='QuotaExceededError')throw new Error('Storage full. Export your data or use a smaller image.');memory.set(k,clone(v));}return v;}
 const data=CINEMATCH_DATA; let series=[];
 function seed(key){
  if(['movies','tvshows','videos'].includes(key))return clone(data.catalog.filter(c=>c.type===({movies:'movie',tvshows:'tvshow',videos:'video'}[key])));
  const collection={genres:'genres','castcrew/actor':'actors','tv-channel':'channels',constants:'languages'}[key];
  if(collection)return clone(data.collections[collection]).map(r=>({...r,Name:r.name,Description:'',Status:true}));
  if(key==='plans')return [{id:'basic',name:'Basic',Name:'Basic',Duration:'1 month',Level:1,Price:9.99,Discount:0,'Total Price':9.99,Status:true},{id:'premium',name:'Premium',Name:'Premium',Duration:'1 month',Level:2,Price:19.99,Discount:0,'Total Price':19.99,Status:true},{id:'ultimate',name:'Ultimate Plan',Name:'Ultimate Plan',Duration:'1 month',Level:3,Price:29.99,Discount:0,'Total Price':29.99,Status:true}];
  if(key==='planlimitation')return ['Supported devices','Video quality','Downloads','Simultaneous screens'].map((name,i)=>({id:'limit-'+i,name,Title:name,Status:true}));
  if(key==='tv-category')return ['News & Current Affairs','Sports & Action','Entertainment & Variety','Music & Concerts','Educational & Documentary'].map((name,i)=>({id:'tv-category-'+i,name,'TV Category':name,Description:'',Status:true}));
  if(key==='pages')return ['Privacy Policy','Terms & Conditions','Help and Support','Refund and Cancellation Policy','Data Deletion Request','About Us'].map((name,i)=>({id:'page-'+i,name,Name:name,Content:'Local demonstration. Replace this content with your own approved text.',Status:true}));
  if(key==='faqs')return [{id:'faq-1',name:'How can I add content to my watchlist?',Question:'How can I add content to my watchlist?',Answer:'Open a title and select the + button. Your list is saved in this browser.',Status:true},{id:'faq-2',name:'How do I watch a trailer?',Question:'How do I watch a trailer?',Answer:'Open a title and select Watch trailer. An internet connection is required for embedded trailers.',Status:true}];
  if(key==='banners')return (data.heroes.home||[]).map((h,i)=>({id:'banner-'+i,name:h.name,image:h.image,Title:h.name,Type:'movie','Type Name':h.name,'Banner For':'Web',Status:true}));
  return [];
 }
 function list(k){return read('table:'+k,seed(k));}
 function save(k,rows){write('table:'+k,rows);window.dispatchEvent(new CustomEvent('storechange',{detail:k}));}
 function catalog(){return [...['movies','videos'].flatMap(k=>list(k)),...series].filter(c=>c.status!==false&&c.Status!==false&&!c.deleted);} function setSeries(dados){series=dados;}
 function favourites(){return read('favourites',[]);}
 function toggleFavourite(id){const a=favourites();write('favourites',a.includes(id)?a.filter(x=>x!==id):[...a,id]);return !a.includes(id);}
 return {read,write,list,save,catalog,setSeries,favourites,toggleFavourite,clone};
})();
