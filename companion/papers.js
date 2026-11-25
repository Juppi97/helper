/* Papers log: append-only, one JSON per line, in Files > Shortcuts > Home Hunt > papers.log (via HH cb:log / cb:papers:read).
   A copy of the lines is mirrored in this browser so the page works between syncs. Nothing leaves the phone. */
const HHL=(()=>{
const S={get(k,d){try{const v=localStorage.getItem('hhc.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('hhc.'+k,JSON.stringify(v))}catch(e){}}};
const hash=s=>{let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))>>>0;return h.toString(36)};
const idOf=d=>hash([(d.sender||'').toLowerCase(),d.due||'',d.amount==null?'':d.amount,d.type].join('|'));
const lines=()=>S.get('log',[]);
function merge(txt){const have=new Set(lines().map(l=>JSON.stringify(l)));const L=lines();let n=0;
  String(txt||'').split(/\r?\n/).forEach(x=>{x=x.trim();if(!x.startsWith('{'))return;try{const o=JSON.parse(x);const k=JSON.stringify(o);if(o.t&&o.id&&!have.has(k)){L.push(o);have.add(k);n++}}catch(e){}});
  S.set('log',L);return n}
function state(){const m=new Map();for(const o of lines()){if(o.t==='add'&&!m.has(o.id))m.set(o.id,Object.assign({open:true},o));else if((o.t==='paid'||o.t==='done')&&m.has(o.id))m.get(o.id).open=false}return[...m.values()]}
function open(){return state().filter(x=>x.open).sort((a,b)=>(a.due||'9')<(b.due||'9')?-1:1)}
function addLine(d,today){const id=idOf(d);if(state().some(x=>x.id===id))return null;const o={t:'add',id,d:today,s:d.sender||'',k:d.type,a:d.amount,due:d.due||null};const L=lines();L.push(o);S.set('log',L);return o}
function closeLine(id,today,kind){const o={t:kind||'paid',id,d:today};const L=lines();L.push(o);S.set('log',L);return o}
function exportText(){return lines().map(o=>JSON.stringify(o)).join('\n')}
return{idOf,merge,state,open,addLine,closeLine,exportText}})();
