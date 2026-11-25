/* Setup checks over x-callback. companion/?check=setup|file|note|event|all . Stores only pass/fail per check on this phone. */
(function(){
const box=document.getElementById('check');if(!box)return;
const q=new URLSearchParams(location.search),self=location.origin+location.pathname;
const S={get(k,d){try{const v=localStorage.getItem('hhc.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('hhc.'+k,JSON.stringify(v))}catch(e){}}};
const L=()=>(S.get('lang','en')==='es'?'es':'en');
const tomorrow=()=>{const d=new Date(Date.now()+864e5);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const testBill=()=>{const d=new Date(Date.now()+20*864e5),f=n=>String(n).padStart(2,'0');return 'TESTDOKUMENT Fjellkraft Strøm AS (fiktiv)\nFaktura\nTotalt å betale: kr 500,00\nForfallsdato: '+f(d.getDate())+'.'+f(d.getMonth()+1)+'.'+d.getFullYear()};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const W={en:{run:'Run the check',again:'Run again',ok:'Works',next:'Next check',all:'Phone setup check',done:'All four checks pass. Your phone is ready.',one:'This check works.',wait:'Not run yet',got:'Shortcut answered'},
         es:{run:'Hacer la prueba',again:'Repetir',ok:'Funciona',next:'Siguiente prueba',all:'Prueba de configuración',done:'Las cuatro pruebas funcionan. Tu móvil está listo.',one:'Esta prueba funciona.',wait:'Aún no probado',got:'Respuesta del atajo'}};
fetch('checks.json?v=19').then(r=>r.json()).then(({checks})=>{
 const want=q.get('check'),ret=q.get('r')||'',res=q.get('result')||'';
 let mode=want;if(ret.startsWith('chk-')&&!mode)mode=S.get('chkMode',ret.slice(4));
 if(!mode)return;S.set('chkMode',mode);
 const list=mode==='all'?checks:checks.filter(c=>c.id===mode);if(!list.length)return;
 const st=S.get('chk',{});
 if(ret.startsWith('chk-')){const id=ret.slice(4),c=checks.find(x=>x.id===id);history.replaceState(null,'',self+'?check='+mode);
  if(c){let fix=null;const m=res.trim().match(new RegExp(c.expect));
   if(q.get('r')==='chk-'+id&&!m)fix='x';
   if(m&&id==='setup'){if(m[1]!=='3')fix='F';else if(!m[2]||/sorry|can.?t|cannot|unable|lo siento|no puedo/i.test(m[2]))fix='M'}
   st[id]={ok:!fix,fix,at:Date.now()};S.set('chk',st)}}
 const w=W[L()];
 const back=(c,x)=>encodeURIComponent(self+'?v=19&check='+mode+'&r=chk-'+c.id+(x||''));
 const href=c=>'shortcuts://x-callback-url/run-shortcut?name=Family&input=text&text='+encodeURIComponent('cb:'+c.mode.replace('{TOMORROW}',tomorrow()).replace('{TESTBILL}',testBill()))
   +'&x-success='+back(c)+'&x-cancel='+back(c,'&cancel=1')+'&x-error='+back(c,'&error=1');
 const nextC=list.find(c=>!(st[c.id]&&st[c.id].ok));
 box.className='c';box.innerHTML='<h2>'+esc(mode==='all'?w.all:list[0].t[L()])+'</h2>'+list.map(c=>{const r=st[c.id];
   return '<div class="row"><span>'+esc(c.t[L()])+(r&&!r.ok&&c.fix[r.fix]?'<br><span class="no" style="font-size:15px">'+esc(c.fix[r.fix][L()])+'</span>':'')+'</span><span class="'+(r?(r.ok?'ok':'no'):'m')+'">'+(r?(r.ok?'✓ '+w.ok:'✗'):w.wait)+'</span></div>'}).join('')
  +(nextC?'<a class="b" href="'+esc(href(nextC))+'">'+esc((st[nextC.id]?w.again:w.run)+(mode==='all'?': '+nextC.t[L()]:''))+'</a>':'<p class="ok big" style="margin-top:8px">'+esc(mode==='all'&&list.length===4?w.done:w.one)+'</p>');
 box.scrollIntoView();
}).catch(()=>{});
})();
