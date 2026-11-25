/* SCAN: deterministic parser for text a shortcut copied from a bill or letter (Norwegian/English). No AI, no network, nothing stored.
   HHS.parse(raw, {today:'YYYY-MM-DD', lang:'en'|'es'}) -> {docs:[...]}  Each doc: {type:'bill'|'letter', sender, amount, due, paid, deadlines:[{iso,title}], key:[...], claim, lines:[calendar lines]}
   Account numbers, KID and ID numbers are never extracted. Testable in node: scripts/support/test_scan.js */
const HHS=(()=>{
const MON={jan:1,januar:1,january:1,feb:2,februar:2,february:2,mar:3,mars:3,march:3,apr:4,april:4,mai:5,may:5,jun:6,juni:6,june:6,jul:7,juli:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,okt:10,oktober:10,oct:10,october:10,nov:11,november:11,des:12,desember:12,dec:12,december:12};
const MN='januar|february|februar|january|mars|march|april|mai|may|juni|june|juli|july|august|september|sept|oktober|october|november|desember|december|jan|feb|mar|apr|jun|jul|aug|sep|okt|oct|nov|des|dec';
const pad=n=>String(n).padStart(2,'0');
const okD=(y,m,d)=>{if(m<1||m>12||d<1||d>31||y<2000||y>2100)return null;const t=new Date(Date.UTC(y,m-1,d));return t.getUTCMonth()===m-1?y+'-'+pad(m)+'-'+pad(d):null};
function dates(line,today){const out=[],ty=+today.slice(0,4);let m;
 const A=/\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4}|\d{2})\b/g;while((m=A.exec(line))){let y=+m[3];if(y<100)y+=2000;const d=okD(y,+m[2],+m[1]);if(d)out.push({iso:d,i:m.index,l:m[0].length})}
 const B=/\b(\d{4})-(\d{2})-(\d{2})\b/g;while((m=B.exec(line))){const d=okD(+m[1],+m[2],+m[3]);if(d)out.push({iso:d,i:m.index,l:m[0].length})}
 const C=new RegExp('\\b(\\d{1,2})\\.?\\s*('+MN+')\\.?(?:\\s*(\\d{4}))?\\b','gi');while((m=C.exec(line))){let y=m[3]?+m[3]:ty;let d=okD(y,MON[m[2].toLowerCase()],+m[1]);if(d&&!m[3]&&d<today)d=okD(ty+1,MON[m[2].toLowerCase()],+m[1]);if(d)out.push({iso:d,i:m.index,l:m[0].length})}
 return out.sort((a,b)=>a.i-b.i)}
const num=s=>{s=s.replace(/[\s ]/g,'');if(/,/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/\.\d{3}$/.test(s)&&!/\.\d{2}$/.test(s))s=s.replace(/\./g,'');const v=parseFloat(s);return isNaN(v)?null:v};
const AMT=/(?:kr\.?|nok|eur|usd)\s*(\d{1,3}(?:[ . ]\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)|(\d{1,3}(?:[ . ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:kr\b|nok\b|,-)/gi;
function amounts(line){const o=[];let m;AMT.lastIndex=0;while((m=AMT.exec(line))){const v=num(m[1]||m[2]);if(v!=null&&v>0&&v<10000000)o.push(v)}return o}
const KW_TOTAL=/(?:å|at|til)\s*betal|totalt|total\b|sum\b|beløp|amount due|to pay/i,KW_DUE=/forfall|betalingsfrist|due date|due\b|betales innen|må være betalt/i,KW_DL=/frist|innen|senest|forfall|avholdes|møte|må (?:være|leveres|sendes)|deadline|due\b|påmelding|søknad|levere|betalt innen|kl\./i;
const ORG=/\b(AS|ASA|kommune|skole|skule|bank|forsikring|NAV|bredbånd|strøm|energi|mobil|telenor|telia|skatteetaten|sykehus|legesenter|barnevern|fylke|vgs|videregående|barnehage|sfo|sparebank|dnb|nordea|if|gjensidige|tryg)\b/i;
const caps=s=>s.replace(/\s*\(.*?\)\s*/g,' ').replace(/\s+/g,' ').trim().split(' ').map(w=>/^(AS|ASA|NAV|SFO|DNB|IF|BA|SA)$/i.test(w)?w.toUpperCase():(w===w.toUpperCase()&&w.length>2?w[0]+w.slice(1).toLowerCase():w)).join(' ');
function sender(lines){const c=lines.slice(0,6).filter(l=>l.length>2&&l.length<70&&!/^(faktura|dato|kunde|til |hei|kjære|invoice)/i.test(l)&&!/^\d/.test(l));return caps(c.find(l=>ORG.test(l))||c[0]||'')}
const fmtNb=iso=>iso?iso.slice(8)+'.'+iso.slice(5,7)+'.'+iso.slice(0,4):'';
const fmtAmt=v=>v==null?'':v.toLocaleString('nb-NO',{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2}).replace(/ | /g,' ');
function parseOne(raw,o){const today=o.today,lines=raw.split(/\r?\n/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean),txt=lines.join('\n');
 const paid=/\bbetalt\b/i.test(txt.replace(/ikke\s+betalt|ubetalt|å betale|til betaling|betalt innen|må være betalt|betales/gi,''))&&!/ikke\s+betalt|ubetalt/i.test(txt);
 let amount=null;for(const re of [/(?:å|at)\s*betal|totalt|amount due|to pay/i,/sum\b|beløp|total\b|til betaling/i]){for(const l of lines){if(re.test(l)){const a=amounts(l);if(a.length){amount=a[a.length-1];break}}}if(amount!=null)break}
 const all=lines.flatMap(amounts);if(amount==null&&all.length)amount=Math.max(...all);
 let due=null;for(const l of lines){if(KW_DUE.test(l)){const d=dates(l,today);if(d.length){due=d[0].iso;break}}}
 const bill=amount!=null&&/faktura|forfall|å betale|regning|invoice|betalingsfrist/i.test(txt);
 const dl=[],seen={};lines.forEach(l=>{if(!KW_DL.test(l))return;dates(l,today).forEach(d=>{const k=d.iso+l;if(seen[k])return;seen[k]=1;
   let t=l.replace(/\s*\(?testdokument[^)]*\)?/i,'');t=t.length>90?t.slice(0,87)+'…':t;dl.push({iso:d.iso,title:t})})});
 dl.sort((a,b)=>a.iso<b.iso?-1:a.iso>b.iso?1:0);
 const snd=sender(lines),type=bill?'bill':'letter',L=o.lang==='es'?{pay:'Pagar',inv:'Factura vence'}:{pay:'Pay',inv:'Bill due'};
 const cal=[];if(type==='bill'&&due&&due>=today&&!paid)cal.push(due+' | '+L.pay+' '+snd+(amount!=null?' (kr '+fmtAmt(amount)+')':'')+' | '+L.inv);
 else if(type==='letter')dl.filter(d=>d.iso>=today).forEach(d=>cal.push(d.iso+' | '+d.title+' | '+snd));
 const claim=type==='bill'?`Hei,\n\njeg ber om at NAV vurderer å dekke denne utgiften: ${snd}${amount!=null?', kr '+fmtAmt(amount):''}${due?', forfall '+fmtNb(due):''}.\nJeg kan sende dokumentasjon ved behov.\n\nMed vennlig hilsen`:'';
 const key=lines.filter(l=>KW_DL.test(l)||/vi minner|husk|må |ta kontakt|informasjon om/i.test(l)).filter(l=>!/^dato:/i.test(l)).slice(0,6);
 return{type,sender:snd,amount,due,paid,deadlines:dl,key,claim,cal}}
function parse(raw,o){o=Object.assign({today:new Date().toISOString().slice(0,10),lang:'en'},o||{});
 const parts=String(raw||'').split(/^=+\s*HH-FILE\s*=+\s*$/m).map(s=>s.trim()).filter(s=>s.length>10);
 return{docs:parts.map(p=>parseOne(p,o))}}
return{parse,dates,amounts,fmtNb,fmtAmt}})();
