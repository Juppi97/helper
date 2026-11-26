/* Guided setup, one action per screen. Replaces check.js (v2.0).
   Stores only pass/fail per step on this phone (localStorage hhc.wiz). No paper text is stored.
   Steps: 1 shortcut installed, 2 test bill saved, 3 test bill read back, 4 share handoff (newest paper),
   5 due list round trip (papers file), 6 backup copy. */
(function(){
const box=document.getElementById('wiz');if(!box)return;
const q=new URLSearchParams(location.search),self=location.origin+location.pathname;
const S={get(k,d){try{const v=localStorage.getItem('hhc.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('hhc.'+k,JSON.stringify(v))}catch(e){}}};
const L=()=>(S.get('lang','en')==='es'?'es':'en');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const testBill=()=>{const d=new Date(Date.now()+20*864e5);return 'TESTDOKUMENT Fjellkraft Strøm AS (fiktiv)\nFaktura\nTotalt å betale: kr 500,00\nForfallsdato: '+pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()};
const today=new Date().toISOString().slice(0,10);

const STEPS=[
 {id:'s1',mode:()=>'setup:CHECK',
  t:{en:'Is the Family shortcut installed?',es:'¿Está instalado el atajo Family?'},
  d:{en:'Tap the button. iPhone opens Shortcuts for a second, runs Family, and brings you back here. If iPhone asks to allow something, tap Allow.',es:'Toca el botón. El iPhone abre Atajos un segundo, ejecuta Family y te devuelve aquí. Si el iPhone pide permiso, toca Permitir.'},
  judge:r=>{const m=r.trim().match(/^(?:FAM|HH)-v2-SETUP-CHECK-F(\d+)-M(.*)$/);if(!m)return'none';if(m[1]!=='3')return'folders';if(!m[2]||/sorry|can.?t|cannot|unable|lo siento|no puedo/i.test(m[2]))return'model';return''}},
 {id:'s2',mode:()=>'file:'+testBill(),
  t:{en:'Can it save a file?',es:'¿Puede guardar un archivo?'},
  d:{en:'The shortcut saves a made-up test bill in the Family folder. Nothing real is used.',es:'El atajo guarda una factura de prueba inventada en la carpeta Family. No se usa nada real.'},
  judge:r=>/^(?:FAM|HH)-v2-FILE-OK$/.test(r.trim())?'':'none'},
 {id:'s3',mode:()=>'scan:test',
  t:{en:'Can it read the file back?',es:'¿Puede leer el archivo de vuelta?'},
  d:{en:'The shortcut reads the test bill and hands the text to this page. This proves text can travel from the shortcut to here.',es:'El atajo lee la factura de prueba y entrega el texto a esta página. Prueba que el texto puede viajar del atajo a aquí.'},
  judge:r=>/TESTDOKUMENT/.test(r)?'':(r.trim()===''?'empty':'none')},
 {id:'s4',mode:()=>'scan:inbox',manual:true,share:true,
  t:{en:'Share a paper to Family, then read it',es:'Comparte un papel con Family y léelo'},
  d:{en:'1. Tap "Share a sample bill". 2. In the share sheet that opens, tap Family (swipe the row of apps if needed). 3. Wait for the banner from Family. 4. Come back here and tap "Check". The sample is invented; you can also share a real PDF, photo or email.',es:'1. Toca "Compartir factura de ejemplo". 2. En el menú que se abre, toca Family (desliza la fila de apps si hace falta). 3. Espera el aviso de Family. 4. Vuelve aquí y toca "Comprobar". El ejemplo es inventado; también puedes compartir un PDF, foto o correo real.'},
  judge:r=>r.trim().length>10?'':(r.trim()===''?'empty4':'none')},
 {id:'s5',mode:()=>null,chain:true,
  t:{en:'Does the due list work?',es:'¿Funciona la lista de pendientes?'},
  d:{en:'The page writes one test line to your papers file, closes it again, and reads the file back. Takes about five seconds.',es:'La página escribe una línea de prueba en tu archivo de papeles, la cierra y lo lee de vuelta. Tarda unos cinco segundos.'},
  judge:r=>r.indexOf('"id":"selftest"')>=0?'':(r.trim()===''?'empty':'none')},
 {id:'s6',local:true,
  t:{en:'Back up your list',es:'Copia de seguridad'},
  d:{en:'Copies your whole papers file as text. Paste it into Notes to keep a backup. It contains only amounts, dates and sender names you added.',es:'Copia todo tu archivo de papeles como texto. Pégalo en Notas como copia. Solo contiene importes, fechas y remitentes que añadiste.'}}
];
const FIX={
 none:{en:'The shortcut did not hand anything back. Make sure the shortcut is named exactly Family, then tap Try again and let Shortcuts finish before returning.',es:'El atajo no devolvió nada. Comprueba que se llama exactamente Family, toca Reintentar y deja que Atajos termine.'},
 folders:{en:'The Family folders are missing. Open Files > Shortcuts (iCloud Drive) and check a folder Family exists, then Try again.',es:'Faltan las carpetas de Family. Abre Archivos > Atajos (iCloud Drive), comprueba que existe la carpeta Family y Reintentar.'},
 model:{en:'The on-device model did not answer. Turn on Apple Intelligence in Settings > Apple Intelligence & Siri, wait for the download, then Try again. You can also skip: reading papers still works without it.',es:'El modelo del móvil no respondió. Activa Apple Intelligence en Ajustes, espera la descarga y Reintentar. También puedes saltar este paso.'},
 empty:{en:'The shortcut ran but found no text. For step 3 or 5, go back and pass step 2 first. For step 4, it means nothing has been shared to Family yet, or the share failed (Family shows "Could not read text" if the item has no readable text). Share a PDF, a screenshot or an email, wait for it to finish, then Try again.',es:'El atajo se ejecutó pero no encontró texto. En los pasos 3 y 5, supera antes el paso 2. En el 4, aún no has compartido nada con Family o falló (muestra "Could not read text" si no hay texto). Comparte un PDF, una captura o un correo, espera a que termine y Reintentar.'},
 cancel:{en:'Shortcuts was closed before it finished. Tap Try again and wait on the Shortcuts screen until it returns by itself.',es:'Atajos se cerró antes de terminar. Reintentar y espera en Atajos hasta que vuelva solo.'}
};
FIX.empty4={en:'Check ran fine, but the share did not save any text. The test file from step 3 works, so only the share part is missing. Tell me what you saw when you shared:',es:'La comprobación funcionó, pero el compartir no guardó texto. El archivo de prueba del paso 3 funciona, así que falla solo la parte de compartir. Dime qué viste al compartir:'};
FIX.empty3={en:'The test bill file is missing. Go back to step 2 and run it again.',es:'Falta el archivo de prueba. Vuelve al paso 2 y repítelo.'};
FIX.empty5={en:'The papers file came back empty, so the write did not happen. Run step 5 again; if it repeats, open Files > Shortcuts > Family and check papers.log exists.',es:'El archivo de papeles volvió vacío. Repite el paso 5; si sigue igual, abre Archivos > Atajos > Family y comprueba que existe papers.log.'};
const DIAG=[
 {q:{en:'Family was not in the share sheet',es:'Family no aparecía en el menú compartir'},a:{en:'Scroll the share sheet to the bottom, tap Edit Actions, and add Family to Favourites. If it is not listed: Shortcuts app > hold Family > Details (i) > turn on Show in Share Sheet. Then share again.',es:'Desliza el menú compartir hasta abajo, toca Editar acciones y añade Family a Favoritos. Si no está: app Atajos > mantén pulsado Family > Detalles (i) > activa Mostrar en menú compartir. Luego comparte otra vez.'}},
 {q:{en:'A banner said "Could not read text"',es:'Un aviso decía "Could not read text"'},a:{en:'That item has no readable text (often a link or a photo of something blurry). Use the sample bill button, or share the PDF itself, a screenshot, or the email text.',es:'Ese elemento no tiene texto legible (suele ser un enlace o una foto borrosa). Usa el botón de la factura de ejemplo o comparte el PDF, una captura o el texto del correo.'}},
 {q:{en:'Shortcuts asked a question or showed an error',es:'Atajos hizo una pregunta o mostró un error'},a:{en:'Tap Always Allow / Allow on any permission question (Files, Calendar, Reminders), then share again. If an error stays, take a screenshot and send it to Claude: it names the step that failed.',es:'Toca Permitir siempre / Permitir en cualquier pregunta de permisos (Archivos, Calendario, Recordatorios) y comparte otra vez. Si queda un error, haz una captura y envíasela a Claude: indica el paso que falla.'}},
 {q:{en:'A banner said it was added, but this check is still empty',es:'Un aviso dijo que se añadió, pero la comprobación sigue vacía'},a:{en:'Open Files > iCloud Drive (or On My iPhone) > Shortcuts > Family > Inbox and look for latest.txt. Send Claude a screenshot of that folder: then I can see whether the file is saved in another place.',es:'Abre Archivos > iCloud Drive (o En mi iPhone) > Atajos > Family > Inbox y busca latest.txt. Envía una captura de esa carpeta a Claude para ver si se guardó en otro sitio.'}},
 {q:{en:'Nothing happened at all',es:'No pasó nada'},a:{en:'Family probably did not start. Open the Shortcuts app, tap Family once by hand and allow every permission it asks for, then share the sample again.',es:'Family probablemente no se inició. Abre Atajos, toca Family una vez a mano, permite todos los permisos y comparte de nuevo el ejemplo.'}}];
let diagOpen=-1;
const W={en:{step:'Step',of:'of',go:'Run this step',again:'Try again',skip:'Skip this step',ok:'Passed',done:'Setup complete. Everything below works on this phone.',redo:'Run the setup check again',copy:'Copy my papers file',copied:'Copied. Paste it into Notes to keep it.',copyFail:'Could not copy. Tap and hold in a note and paste instead.',list:'All steps',back:'Back',s4b:'Read the newest paper',title:'Set up this phone',shareB:'Share a sample bill',check:'Check'},
         es:{step:'Paso',of:'de',go:'Hacer este paso',again:'Reintentar',skip:'Saltar este paso',ok:'Superado',done:'Configuración completa. Todo lo de abajo funciona en este móvil.',redo:'Repetir la comprobación',copy:'Copiar mi archivo de papeles',copied:'Copiado. Pégalo en Notas para guardarlo.',copyFail:'No se pudo copiar. Mantén pulsado en una nota y pega.',list:'Todos los pasos',back:'Atrás',s4b:'Leer el papel más nuevo',title:'Configurar este móvil',shareB:'Compartir factura de ejemplo',check:'Comprobar'}};

const cbUrl=(mode,tag)=>'shortcuts://x-callback-url/run-shortcut?name=Family&input=text&text='+encodeURIComponent('cb:'+mode)
 +'&x-success='+encodeURIComponent(self+'?v=20&r='+tag)+'&x-cancel='+encodeURIComponent(self+'?v=20&r='+tag+'&cancel=1')+'&x-error='+encodeURIComponent(self+'?v=20&r='+tag+'&error=1');
// chain several runs: each success link launches the next
function chain(modes,tag){let next=self+'?v=20&r='+tag;for(let i=modes.length-1;i>=0;i--){next='shortcuts://x-callback-url/run-shortcut?name=Family&input=text&text='+encodeURIComponent('cb:'+modes[i])+'&x-success='+encodeURIComponent(next)+'&x-cancel='+encodeURIComponent(self+'?v=20&r='+tag+'&cancel=1')+'&x-error='+encodeURIComponent(self+'?v=20&r='+tag+'&error=1')}return next}

let st=S.get('wiz',{});
const sum=l=>{let t=0;for(const c of 'FAM-OK-'+l)t+=c.charCodeAt(0);return String((t*7)%97).padStart(2,'0')};
const okAll=ids=>ids.every(i=>st[i]&&st[i].ok);
function codes(){const lg=L(),out=[];
 const mk=(l,ids,en,es)=>{if(okAll(ids)){const c='FAM-OK-'+l+'-'+sum(l);out.push('<div style="margin-top:10px"><p class="ok"><b>'+(lg==='es'?es:en)+'</b></p><code style="display:block;font-size:20px;padding:8px 0">'+c+'</code><button class="s" data-copy="'+c+'">'+(lg==='es'?'Copiar código':'Copy code')+'</button></div>')}};
 mk('A',['s1','s2','s3'],'Steps 1 to 3 passed. Copy this code and paste it in the app (Settings, Test the shortcut):','Pasos 1 a 3 superados. Copia este código y pégalo en la app (Ajustes, Probar el atajo):');
 mk('B',['s4','s5'],'Steps 4 and 5 passed. Copy this code and paste it in the app (Settings, Test reading a real paper):','Pasos 4 y 5 superados. Copia este código y pégalo en la app (Ajustes, Probar la lectura):');
 return out.join('')}
function wireCopy(){box.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);b.textContent=L()==='es'?'Copiado':'Copied'}catch(e){b.textContent=b.dataset.copy}})}
const idx=id=>STEPS.findIndex(s=>s.id===id);
const firstOpen=()=>{const i=STEPS.findIndex(s=>!(st[s.id]&&(st[s.id].ok||st[s.id].skip)));return i<0?STEPS.length:i};

// handle a return from the shortcut
const ret=q.get('r')||'';
let msg=null,cur=null;
if(/^w-s\d$/.test(ret)){
 const id=ret.slice(2),s=STEPS[idx(id)],res=q.get('result')||'';history.replaceState(null,'',self+'?wiz=1');
 if(s){let fix=q.get('cancel')?'cancel':(q.get('error')?'none':s.judge(res));if(fix==='empty'&&FIX['empty'+id.slice(1)])fix='empty'+id.slice(1);
  st[id]={ok:!fix,fix:fix||null,n:res.length,at:Date.now()};S.set('wiz',st);
  if(id==='s5'&&!fix&&window.HHL)HHL.merge(res);
  msg={id,ok:!fix,fix:fix||null,n:res.length};cur=fix?idx(id):firstOpen()}}
if(cur==null){if(!q.get('wiz')&&firstOpen()>=STEPS.length&&!q.get('setup')){renderDone();return}cur=q.get('step')?+q.get('step'):firstOpen();if(cur>=STEPS.length)cur=STEPS.length-1}
render(cur);

function renderDone(){const w=W[L()];box.className='c';box.innerHTML='<p class="ok" style="margin:0">✓ '+esc(w.done)+'</p>'+codes()+'<button class="s" id="wiz-redo">'+esc(w.redo)+'</button>';
 wireCopy();document.getElementById('wiz-redo').onclick=()=>{st={};S.set('wiz',st);location.href=self+'?wiz=1'}}
function render(i){const w=W[L()],s=STEPS[i],r=st[s.id],lg=L();
 const dots=STEPS.map((x,j)=>'<span style="display:inline-block;width:26px;height:6px;border-radius:3px;margin-right:4px;background:'+(st[x.id]&&st[x.id].ok?'var(--ok)':st[x.id]&&st[x.id].skip?'var(--warn)':j===i?'var(--acc)':'var(--line)')+'"></span>').join('');
 let html='<div class="m" style="margin-bottom:6px">'+dots+'</div><p class="m">'+w.step+' '+(i+1)+' '+w.of+' '+STEPS.length+'</p><h2>'+esc(s.t[lg])+'</h2><p>'+esc(s.d[lg])+'</p>';
 if(msg&&msg.id===s.id)html+=msg.ok?'<p class="ok"><b>✓ '+w.ok+'</b></p>':'<p class="no"><b>✗</b> '+esc(FIX[msg.fix][lg])+'</p>';
 else if(r&&!r.ok&&!r.skip&&r.fix)html+='<p class="no"><b>✗</b> '+esc(FIX[r.fix][lg])+'</p>';
 const failed=r&&!r.ok&&!r.skip;
 if(s.local){html+='<button id="wiz-copy">'+esc(w.copy)+'</button><p class="m" id="wiz-copyr"></p>'}
 else{const label=failed?w.again:(s.manual?w.s4b:w.go);
  if(s.share)html+='<button id="wiz-share">'+esc(w.shareB)+'</button><textarea id="wiz-sample" readonly style="display:none;margin-top:8px"></textarea>';
  html+='<a class="b'+(s.share?' s':'')+'" id="wiz-go" href="#"'+(s.share?' style="background:transparent;color:var(--acc);border:1px solid var(--line)"':'')+'>'+esc(s.share&&!failed?w.check:label)+'</a>';
  if(s.share&&failed&&(r.fix==='empty4')){html+='<div style="margin-top:8px">'+DIAG.map((d,j)=>'<button class="s" data-diag="'+j+'">'+esc(d.q[lg])+'</button>'+(diagOpen===j?'<p class="m" style="margin:4px 0 8px">'+esc(d.a[lg])+'</p>':'')).join('')+'</div>'}}
 if(!(r&&r.ok)||!s.local)html+='<button class="s" id="wiz-skip">'+esc(w.skip)+'</button>';
 if(i>0)html+='<button class="s" id="wiz-back">'+esc(w.back)+'</button>';
 html+=codes();box.className='c';box.innerHTML=html;wireCopy();
 const go=document.getElementById('wiz-go');
 box.querySelectorAll('[data-diag]').forEach(b=>b.onclick=()=>{diagOpen=+b.dataset.diag;render(i)});
 const sh=document.getElementById('wiz-share');
 if(sh)sh.onclick=async()=>{const t='TESTDOKUMENT Fjellkraft Strøm AS (fiktiv)\nFaktura\nTotalt å betale: kr 500,00';try{if(navigator.share){await navigator.share({title:'Family test',text:t})}else throw 0}catch(e){if(e&&e.name==='AbortError')return;const ta=document.getElementById('wiz-sample');ta.style.display='block';ta.value=t;ta.select()}};
 if(go){go.onclick=e=>{e.preventDefault();let url;
   if(s.chain){const add=JSON.stringify({t:'add',id:'selftest',d:today,s:'Setup test',k:'bill',a:0,due:null}),done=JSON.stringify({t:'done',id:'selftest',d:today});url=chain(['log:'+add,'log:'+done,'papers:read'],'w-s5')}
   else url=cbUrl(s.mode().replace(/^/,''),'w-'+s.id);
   location.href=url}}
 const cp=document.getElementById('wiz-copy');
 if(cp)cp.onclick=async()=>{const out=document.getElementById('wiz-copyr');try{await navigator.clipboard.writeText(window.HHL?HHL.exportText():'');st.s6={ok:true,at:Date.now()};S.set('wiz',st);out.textContent=w.copied;out.className='ok';setTimeout(()=>location.href=self+'?wiz=1',1200)}catch(e){out.textContent=w.copyFail;out.className='no'}};
 const sk=document.getElementById('wiz-skip');if(sk)sk.onclick=()=>{st[s.id]={skip:true,at:Date.now()};S.set('wiz',st);location.href=self+'?wiz=1'};
 const bk=document.getElementById('wiz-back');if(bk)bk.onclick=()=>{location.href=self+'?wiz=1&step='+(i-1)};
}
})();
