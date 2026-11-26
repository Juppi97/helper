/* Phone setup (companion v3). ONE list, one step on screen, one big button, no codes to copy.
   Every shortcut answer comes back by URL callback (x-success) and is judged here. Only pass/skip per step is stored on this phone.
   Steps: 1 shortcut + files detected, 2 Family Setup (calendar, list, notes, folders), 3 self-test (save, read, due list), 4 share a paper (optional). */
(function(){
window.WIZ_V='3.3';
const box=document.getElementById('wiz');if(!box)return;
const daily=document.getElementById('daily');
const q=new URLSearchParams(location.search),self=location.origin+location.pathname;
const S={get(k,d){try{const v=localStorage.getItem('hhc.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('hhc.'+k,JSON.stringify(v))}catch(e){}}};
const lg=S.get('lang','en')==='es'?'es':'en';
const T=(e,s)=>lg==='es'?s:e;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const today=new Date().toISOString().slice(0,10);
const testBill=()=>{const d=new Date(Date.now()+20*864e5);return 'TESTDOKUMENT Fjellkraft Strøm AS (fiktiv)\nFaktura\nTotalt å betale: kr 500,00\nForfallsdato: '+pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()};
const IMP=(f,n)=>'shortcuts://import-shortcut?url='+encodeURIComponent('https://juppi97.github.io/helper/shortcuts/'+f)+'&name='+encodeURIComponent(n);
const APP='https://claude.ai/artifact/N99WuDAMn956tCCD8XPFaX';
const SHORTCUTS=IMP(lg==='es'?'es/Family.shortcut':'Family.shortcut','Family'),SHORTCUTS_SETUP=IMP('Family-Setup.shortcut','Family Setup');
const cbUrl=(name,text,tag)=>'shortcuts://x-callback-url/run-shortcut?name='+encodeURIComponent(name)+'&input=text&text='+encodeURIComponent(text)
 +'&x-success='+encodeURIComponent(self+'?v=33&r='+tag)+'&x-cancel='+encodeURIComponent(self+'?v=33&r='+tag+'&cancel=1')+'&x-error='+encodeURIComponent(self+'?v=33&r='+tag+'&error=1');
function chain(modes,tag){let next=self+'?v=33&r='+tag;for(let i=modes.length-1;i>=0;i--){next='shortcuts://x-callback-url/run-shortcut?name=Family&input=text&text='+encodeURIComponent('cb:'+modes[i])+'&x-success='+encodeURIComponent(next)+'&x-cancel='+encodeURIComponent(self+'?v=33&r='+tag+'&cancel=1')+'&x-error='+encodeURIComponent(self+'?v=33&r='+tag+'&error=1')}return next}
if(q.get('t')&&/^[\w-]{8,64}$/.test(q.get('t')))S.set('topic',q.get('t'));
const flagsNow=()=>S.get('flags',{});
const flagWords=()=>Object.keys(flagsNow()).filter(k=>flagsNow()[k]).join(' ');

/* ---------- state: {id:{s:'ok'|'pre'|'skip'}} ---------- */
let st=S.get('p',{});const save=()=>S.set('p',st);
const done=id=>!!st[id]&&(st[id].s==='ok'||st[id].s==='pre');
const STEPS=[
 {id:'sc',t:T('Your phone','Tu móvil'),title:T('Check what is already on this phone','Comprueba qué hay ya en este móvil'),
  say:T('Tap the button. It looks for the Family shortcut and your Family files. Whatever exists is skipped.','Toca el botón. Busca el atajo Family y tus archivos Family. Lo que ya existe se salta.'),btn:T('Check my phone','Comprobar mi móvil')},
 {id:'setup',t:T('Calendar, list, folders','Calendario, lista, carpetas'),title:T('Create the Family calendar, list and folders','Crear calendario, lista y carpetas Family'),
  say:T('Tick what already exists, then tap the button. Only what is missing gets created.','Marca lo que ya existe y toca el botón. Solo se crea lo que falta.'),btn:T('Run Family Setup','Ejecutar Family Setup'),flags:true},
 {id:'test',t:T('Self-test','Autoprueba'),title:T('Test saving, reading and the due list','Probar guardar, leer y la lista de pendientes'),
  say:T('Tap the button. It saves a made-up bill, reads it back and tests the due list. Takes about ten seconds.','Toca el botón. Guarda una factura inventada, la lee y prueba la lista de pendientes. Tarda unos diez segundos.'),btn:T('Run the self-test','Hacer la autoprueba')},
 {id:'share',t:T('Share a paper','Compartir un papel'),title:T('Share a paper to the phone (optional)','Compartir un papel al móvil (opcional)'),
  say:T('Tap Share a sample bill, choose Family Share in the sheet, wait for its banner, come back and tap Check. Or paste text below.','Toca Compartir factura de ejemplo, elige Family Share, espera su aviso, vuelve y toca Comprobar. O pega texto abajo.'),btn:T('Check','Comprobar'),share:true},
 {id:'push',t:T('Phone alerts','Avisos'),title:T('Get alerts on this phone (optional)','Recibir avisos en este móvil (opcional)'),
  say:T('Tap Subscribe in ntfy. The ntfy app opens with your topic ready: tap Subscribe there and allow notifications. Then tap Send a test alert.','Toca Suscribirse en ntfy. Se abre la app ntfy con tu tema listo: toca Suscribir y permite notificaciones. Luego toca Enviar aviso de prueba.'),btn:T('Subscribe in ntfy','Suscribirse en ntfy'),push:true}
];
const idx=id=>STEPS.findIndex(s=>s.id===id);
function firstOpen(){const i=STEPS.findIndex(s=>!(st[s.id]&&st[s.id].s));return i<0?STEPS.length:i}
let cur=null,msg=null,diag=null;

const FIXES={
 notinstalled:T('The Family shortcut is not installed. Tap Install Family, add it, then come back and tap the button again.','El atajo Family no está instalado. Toca Instalar Family, añádelo y vuelve a tocar el botón.'),
 old:T('Your Family shortcut is the old version. Delete it in the Shortcuts app (hold Family, Delete), tap Install Family, then come back and tap the button again.','Tu atajo Family es la versión antigua. Elimínalo en Atajos (mantén Family, Eliminar), toca Instalar Family y vuelve a tocar el botón.'),
 cancel:T('Shortcuts was closed before it finished. Tap the button again and stay on the Shortcuts screen until it returns by itself.','Atajos se cerró antes de terminar. Toca el botón otra vez y espera en Atajos hasta que vuelva solo.'),
 setupmissing:T('Family Setup is not installed. Tap Install Family Setup, add it, then tap the button again.','Family Setup no está instalado. Toca Instalar Family Setup, añádelo y vuelve a tocar el botón.'),
 setupbad:T('Family Setup did not report back. If iPhone showed an error, tap the button again (it skips what exists).','Family Setup no respondió. Si el iPhone mostró un error, toca el botón otra vez (salta lo que existe).'),
 testold:T('Nothing came back. Update the Family shortcut (delete it, tap Install Family) and try again.','No volvió nada. Actualiza el atajo Family (elimínalo y toca Instalar Family) y reintenta.'),
 testempty:T('The shortcut wrote the line but the papers file is empty when read back. Tap Find out why.','El atajo escribió la línea pero el archivo de papeles está vacío al leerlo. Toca Averiguar por qué.'),
 testbad:T('Unexpected answer. Tap Find out why.','Respuesta inesperada. Toca Averiguar por qué.'),
 shareempty:T('Nothing was saved by the share yet. Did a banner from Family Share appear? If it said "failed", follow the banner. If nothing appeared, open Family Share once by hand in the Shortcuts app and allow every permission. Or use the paste box below.','El compartir aún no guardó nada. ¿Apareció un aviso de Family Share? Si dijo "failed", sigue el aviso. Si no apareció nada, abre Family Share a mano en Atajos y permite todo. O usa la caja de pegar.')
};

/* ---------- return from a shortcut ---------- */
const ret=q.get('r')||'';
const m=/^p-(\w+)$/.exec(ret);
if(m){history.replaceState(null,'',self+'?wiz=1');const kind=m[1],res=(q.get('result')||'').trim(),bad=q.get('error')||q.get('cancel');
 const fail=(id,key)=>{msg={id,ok:false,text:FIXES[key]};cur=idx(id)};
 const pass=(id,state,text)=>{st[id]={s:state||'ok',at:Date.now()};save();msg={id,ok:true,text:text||''};let n=idx(id)+1;while(n<STEPS.length&&st[STEPS[n].id]&&st[STEPS[n].id].s==='pre')n++;cur=n};
 if(kind==='sc'){const d=res.match(/FAM-v2-DIAG-log(\d+)-latest(\d+)-test(\d+)-keep(\d+)-cal(\d+)-rem(\d+)-notes(\d+)-old(\d+)/);
  if(q.get('error'))fail('sc','notinstalled');else if(q.get('cancel'))fail('sc','cancel');else if(!d)fail('sc','old');
  else{const n=d.slice(1).map(Number);const calOk=n[4]>0||n[7]>0,allThree=calOk&&n[5]>0&&n[6]>0;
   S.set('flags',Object.assign(flagsNow(),n[4]>0||n[7]>0?{nocal:true}:{},n[5]>0?{norem:true}:{},n[6]>0?{nonotes:true}:{}));
   if(allThree){st.setup={s:'pre',at:Date.now()}}
   pass('sc','pre',T('Found the Family shortcut'+(allThree?', your calendar, list and folders. They are already set up.':'.'),'Encontré el atajo Family'+(allThree?', tu calendario, lista y carpetas. Ya están configurados.':'.')));
   let n2=idx('sc')+1;while(n2<STEPS.length&&st[STEPS[n2].id]&&st[STEPS[n2].id].s==='pre')n2++;cur=n2}}
 else if(kind==='setup'){if(bad)fail('setup',q.get('error')?'setupmissing':'cancel');else if(!/^FAM-SETUP(-[A-Z]\d+){2,}$/.test(res))fail('setup','setupbad');else pass('setup','ok',T('Calendar, list and folders are ready.','Calendario, lista y carpetas listos.'))}
 else if(kind==='test'){if(bad)fail('test',q.get('error')?'notinstalled':'cancel');else if(res.indexOf('"id":"selftest"')>=0){if(window.HHL)HHL.merge(res);pass('test','ok',T('Saving, reading and the due list all work.','Guardar, leer y la lista de pendientes funcionan.'))}
  else if(res.indexOf('FAM-v2-PAPERS-EMPTY')>=0)fail('test','testempty');else if(!res)fail('test','testold');else fail('test','testbad')}
 else if(kind==='share'){if(bad)fail('share','cancel');else if(res.length>10)pass('share','ok',T('The paper arrived: '+res.length+' characters read.','El papel llegó: '+res.length+' caracteres leídos.'));else fail('share','shareempty')}
 else if(kind==='diag'){cur=idx('test');
  const d=res.match(/log(\d+)-latest(\d+)-test(\d+)-keep(\d+)/);
  diag=!res?T('No answer: your Family shortcut is the old version. Delete it and tap Install Family.','Sin respuesta: tu atajo Family es la versión antigua. Elimínalo y toca Instalar Family.')
   :!d?T('Unexpected answer: '+res.slice(0,60),'Respuesta inesperada: '+res.slice(0,60))
   :(d[4]==='0'&&d[3]==='0')?T('The Family folders do not exist yet. Tap Create the folders below, then run the self-test again.','Las carpetas Family aún no existen. Toca Crear las carpetas y repite la autoprueba.')
   :d[1]==='0'?T('The papers file does not exist: Shortcuts could not write it. Tap Create the folders, allow Files access if asked, then run the self-test again.','El archivo de papeles no existe: Atajos no pudo escribirlo. Toca Crear las carpetas, permite el acceso a Archivos y repite.')
   :T('The files exist (papers file: '+d[1]+' characters). Probably timing: run the self-test again.','Los archivos existen (archivo de papeles: '+d[1]+' caracteres). Probablemente fue cuestión de tiempo: repite la autoprueba.')}
}
if(cur==null){const qs=q.get('step');cur=qs!=null?Math.max(0,Math.min(STEPS.length-1,+qs||0)):firstOpen()}

/* ---------- run page for Family Setup ---------- */
if(q.get('run')==='setup'){const ok=['nocal','norem','nonotes'];const fl=(q.get('flags')||'').split(',').filter(x=>ok.includes(x));S.set('flags',Object.fromEntries(fl.map(k=>[k,true])));
 location.replace(cbUrl('Family Setup',fl.concat(['cb']).join(' '),'p-setup'));return}

if(q.get('run')==='test'){const add=JSON.stringify({t:'add',id:'selftest',d:today,s:'Setup test',k:'bill',a:0,due:null}),dn=JSON.stringify({t:'done',id:'selftest',d:today});location.replace(chain(['file:'+testBill(),'ensure:','log:'+add,'log:'+dn,'papers:read'],'p-test'));return}
if(q.get('run')==='share'){location.replace(cbUrl('Family','cb:scan:inbox','p-share'));return}
render();

function render(){
 const finished=firstOpen()>=STEPS.length&&cur>=STEPS.length;
 if(daily){daily.hidden=!(finished||q.get('daily')||(ret&&!m&&ret!==''))}
 /* progress list */
 let h='<a class="b" href="'+APP+'" style="margin-bottom:10px">'+T('← Back to the family app (Settings)','← Volver a la app familiar (Ajustes)')+'</a><span style="float:right;font-size:12px" class="m">v'+window.WIZ_V+'</span><h2 style="margin-bottom:6px">'+T('Set up this phone','Configurar este móvil')+'</h2>';
 h+='<div style="margin:6px 0 12px">'+STEPS.map((s,i)=>{const x=st[s.id];const icon=x&&(x.s==='ok'||x.s==='pre')?'<span class="ok">✓</span>':x&&x.s==='skip'?'<span class="warn">↷</span>':'○';
  const note=x&&x.s==='pre'?' <span class="m" style="font-size:13px">'+T('already set up','ya configurado')+'</span>':'';
  return '<div class="row" style="padding:6px 0'+(i===cur?';font-weight:700':'')+'"><span>'+icon+'  '+esc(s.t)+note+'</span><span><a href="'+self+'?wiz=1&step='+i+'" style="color:var(--acc);font-size:14px">'+(i===cur?'':T('open','abrir'))+'</a></span></div>'}).join('')+'</div>';
 if(finished){h+='<p class="ok big">✓ '+T('The phone is ready.','El móvil está listo.')+'</p><p class="m">'+T('Next: open the app, Settings, tap Check app connections.','Siguiente: abre la app, Ajustes, y toca Comprobar conexiones de la app.')+'</p><a class="b" href="https://claude.ai/artifact/N99WuDAMn956tCCD8XPFaX">'+T('Open the family app','Abrir la app familiar')+'</a><button class="s" id="redo">'+T('Run the checks again','Repetir las comprobaciones')+'</button>';box.className='c';box.innerHTML=h;const r=document.getElementById('redo');if(r)r.onclick=()=>{st={};save();location.href=self+'?wiz=1'};return}
 const s=STEPS[Math.min(cur,STEPS.length-1)],i=idx(s.id);
 h+='<div class="m">'+T('Step','Paso')+' '+(i+1)+' '+T('of','de')+' '+STEPS.length+'</div><h2>'+esc(s.title)+'</h2><p>'+esc(s.say)+'</p>';
 if(msg&&msg.id===s.id)h+=msg.ok?'<p class="ok"><b>✓ '+esc(msg.text||'')+'</b></p>':'<p class="no"><b>✗</b> '+esc(msg.text)+'</p>';
 if(diag&&s.id==='test')h+='<p class="m"><b>'+esc(diag)+'</b></p>';
 const failed=msg&&msg.id===s.id&&!msg.ok;
 if(s.flags){const f=flagsNow();h+=[['nocal',T('A calendar named Family already exists','Ya existe un calendario llamado Family')],['norem',T('A Reminders list named Family already exists','Ya existe una lista de Recordatorios llamada Family')],['nonotes',T('A Notes folder named Family already exists','Ya existe una carpeta de Notas llamada Family')]].map(x=>'<button class="s" data-flag="'+x[0]+'" style="text-align:left">'+(f[x[0]]?'☑':'☐')+' '+esc(x[1])+'</button>').join('')}
 const tp=S.get('topic','');if(s.push&&!tp){h+='<p class="no">'+T('Open this step from the family app (Settings, Phone alerts) so it knows your topic.','Abre este paso desde la app familiar (Ajustes, Avisos) para que conozca tu tema.')+'</p>'}
 if(s.push&&tp)h+='<a class="b" href="ntfy://ntfy.sh/'+encodeURIComponent(tp)+'">'+T('Subscribe in ntfy','Suscribirse en ntfy')+'</a><a class="b s" href="https://apps.apple.com/app/ntfy/id1625396347" style="background:transparent;color:var(--acc);border:1px solid var(--line)">'+T('Install ntfy (only if you do not have it)','Instalar ntfy (solo si no la tienes)')+'</a><a class="b s" href="https://ntfy.sh/'+encodeURIComponent(tp)+'/publish?title=Family&message=Setup+test+alert" style="background:transparent;color:var(--acc);border:1px solid var(--line)">'+T('Send a test alert','Enviar aviso de prueba')+'</a><button class="s" id="pushdone">'+T('The alert arrived','El aviso llegó')+'</button>'
 if(!s.push)h+='<a class="b" id="go" href="#">'+esc(failed&&!s.share?T('Try again','Reintentar'):s.btn)+'</a>';
 if(s.share){h+='<button class="s" id="sharebtn">'+T('Share a sample bill','Compartir factura de ejemplo')+'</button><textarea id="sample" readonly style="display:none;margin-top:8px"></textarea><p class="m" style="margin-top:12px"><b>'+T('Fallback only, if the share sheet does not work: paste text of a bill or letter:','¿Sin menú compartir? Pega el texto de una factura o carta:')+'</b></p><textarea id="paste"></textarea><button class="s" id="pasteok">'+T('Use pasted text','Usar el texto pegado')+'</button><p class="m" id="pasteout"></p>'}
 if(failed||diag){if(s.id==='test'||s.id==='setup'){if(s.id==='test')h+='<a class="b s" id="diagbtn" href="#" style="background:transparent;color:var(--acc);border:1px solid var(--line)">'+T('Find out why','Averiguar por qué')+'</a>';h+='<a class="b s" href="'+self+'?run=setup&flags=nocal%2Cnorem%2Cnonotes" style="background:transparent;color:var(--acc);border:1px solid var(--line)">'+T('Create the folders','Crear las carpetas')+'</a>'}}
 if(failed&&(msg.text===FIXES.notinstalled||msg.text===FIXES.old))h+='<a class="b s" href="'+SHORTCUTS+'" style="background:transparent;color:var(--acc);border:1px solid var(--line)">'+T('Install Family','Instalar Family')+'</a>';
 if(failed&&msg.text===FIXES.setupmissing)h+='<a class="b s" href="'+SHORTCUTS_SETUP+'" style="background:transparent;color:var(--acc);border:1px solid var(--line)">'+T('Install Family Setup','Instalar Family Setup')+'</a>';
 if(s.id==='share')h+='<a class="m" href="'+IMP('Family-Share.shortcut','Family Share')+'" style="display:block;margin-top:10px">'+T('Install Family Share (only if you do not have it)','Instalar Family Share (solo si no lo tienes)')+'</a>';
 if(s.id==='sc'&&!failed)h+='<a class="m" href="'+SHORTCUTS+'" style="display:block;margin-top:10px">'+T('Not installed yet? Install Family (only if you do not have it)','¿Aún no está instalado? Instalar Family (solo si no lo tienes)')+'</a>';
 if(s.id==='setup'&&!failed)h+='<a class="m" href="'+SHORTCUTS_SETUP+'" style="display:block;margin-top:10px">'+T('Install Family Setup (only if you do not have it)','Instalar Family Setup (solo si no lo tienes)')+'</a>';
 h+='<div style="display:flex;gap:8px;margin-top:10px">'+(i>0?'<button class="s" id="back">'+T('Back','Atrás')+'</button>':'')+'<button class="s" id="skip">'+T('Skip','Saltar')+'</button></div>';
 h+='<a class="m" href="'+self+'?daily=1" style="display:block;margin-top:10px;text-align:center">'+T('Skip setup, go to daily use','Saltar la configuración, ir al uso diario')+'</a>';
 box.className='c';box.innerHTML=h;
 const pd=document.getElementById('pushdone');if(pd)pd.onclick=()=>{st.push={s:'ok',at:Date.now()};save();location.href=self+'?wiz=1&step='+STEPS.length};
 const go=document.getElementById('go');
 if(go)go.onclick=e=>{e.preventDefault();
  if(s.id==='sc')location.href=cbUrl('Family','cb:diag:','p-sc');
  else if(s.id==='setup'){const w=flagWords();location.href=cbUrl('Family Setup',(w?w+' ':'')+'cb','p-setup')}
  else if(s.id==='test'){const add=JSON.stringify({t:'add',id:'selftest',d:today,s:'Setup test',k:'bill',a:0,due:null}),dn=JSON.stringify({t:'done',id:'selftest',d:today});location.href=chain(['file:'+testBill(),'ensure:','log:'+add,'log:'+dn,'papers:read'],'p-test')}
  else if(s.id==='share')location.href=cbUrl('Family','cb:scan:inbox','p-share')};
 /* Family shortcut modes take text starting with cb: ; cbUrl adds nothing, so wrap here */
 box.querySelectorAll('[data-flag]').forEach(b=>b.onclick=()=>{const f=flagsNow();f[b.dataset.flag]=!f[b.dataset.flag];S.set('flags',f);render()});
 const d=document.getElementById('diagbtn');if(d)d.onclick=e=>{e.preventDefault();location.href=cbUrl('Family','cb:diag:','p-diag')};
 const sh=document.getElementById('sharebtn');if(sh)sh.onclick=async()=>{const t='TESTDOKUMENT Fjellkraft Strøm AS (fiktiv)\nFaktura\nTotalt å betale: kr 500,00';try{if(navigator.share)await navigator.share({title:'Family test',text:t});else throw 0}catch(e){if(e&&e.name==='AbortError')return;const ta=document.getElementById('sample');ta.style.display='block';ta.value=t;ta.select()}};
 const po=document.getElementById('pasteok');if(po)po.onclick=()=>{const v=document.getElementById('paste').value,out=document.getElementById('pasteout');let n=0;try{n=window.HHS?HHS.parse(v,{today,lang:lg}).docs.length:0}catch(e){}
  if(v.trim().length>10&&n>0){document.getElementById('paste').value='';st.share={s:'ok',paste:true,at:Date.now()};save();location.href=self+'?wiz=1&step='+STEPS.length}else{out.className='m no';out.textContent=T('I could not read that text. Paste the whole text of a bill or letter.','No pude leer ese texto. Pega el texto completo de una factura o carta.')}};
 const sk=document.getElementById('skip');if(sk)sk.onclick=()=>{if(!done(s.id))st[s.id]={s:'skip'};save();location.href=self+'?wiz=1&step='+(i+1)};
 const bk=document.getElementById('back');if(bk)bk.onclick=()=>{location.href=self+'?wiz=1&step='+(i-1)};
}
})();
