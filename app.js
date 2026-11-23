'use strict';
/* =====================================================================
   متابعة الحفظ — تطبيق موحّد (v5)
   مسار الحفظ: عقلي ← لساني ← مراجعة متباعدة ← ورد أسبوعي
   + سجل الحفظ (الكمية والتقييم وإجراءات التقوية) + جدول الورد + التقرير الشهري
   بلا أدوات بناء. البيانات في localStorage، والتنبيهات عبر Service Worker / Push.
   ===================================================================== */

/* ---------- الثوابت ---------- */
const NAMES=["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];
const HAFS=[7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
let SD=NAMES.map((n,i)=>[n,HAFS[i]]);
const KEY='hifz-unified-v3';
const LEGACY={merged:'hifz-merged-v1',follow:'hifz_followup_v1',old:['hifz-pipeline-v1','hifz-plan-v1']};
const WD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const WK=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
const STG={aqli:'الحفظ العقلي',lisan:'الحفظ اللساني',near:'مراجعة متباعدة',stable:'مثبّت',wird:'في الورد'};
const MEM=['near','stable','wird'];
const REPS=['استماع مركّز لمصحف مجوَّد','تكرار نظرًا','تكرار عن ظهر قلب'];
const INT=[3,7,30];
const REVT=['بعد 3 أيام من إتمام الحفظ اللساني','بعد 7 أيام من المراجعة الأولى','بعد شهر من المراجعة الثانية'];
const QL={2:'متقن',1:'متردد',0:'ضعيف'};
const QC={2:'qg',1:'qm',0:'qw'};
const TYPES={new:'حفظ جديد',adj:'جوار الدرس',near:'مراجعة القريب',far:'مراجعة البعيد',q:'تقييم جودة'};
const LK=['تلقي','عرض'];
const TABS=['today','mem','near','w','log'];
const LEVELS=['الأول ابتدائي','الثاني ابتدائي','الثالث ابتدائي','الرابع ابتدائي','الخامس ابتدائي','السادس ابتدائي','الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع متوسط','الأول ثانوي','الثاني ثانوي','الثالث ثانوي','جامعي'];
const PROCS=[
 {id:'fix',t:'التثبيت',h:'مراجعة مكثّفة متقاربة خلال الأيام القادمة'},
 {id:'link',t:'الربط',h:'اربط آخر المقطع بأول الذي يليه وبما قبله'},
 {id:'rehifz',t:'إعادة الحفظ',h:'ارجع به إلى الحفظ اللساني من جديد'},
 {id:'split',t:'التجزئة',h:'قسّمه إلى أجزاء من 3 إلى 5 آيات'},
 {id:'listen',t:'الاستماع',h:'استمع لقارئ مجوِّد قبل أن تراجعه'},
 {id:'write',t:'الكتابة من الحفظ',h:'اكتبه من ذاكرتك ثم صحّحه من المصحف'},
 {id:'recite',t:'التسميع',h:'سمّعه على أستاذ أو زميل واطلب رصد الأخطاء'},
 {id:'spots',t:'ضبط المواضع',h:'سجّل مواضع التردد وركّز عليها'},
 {id:'prayer',t:'القراءة في الصلاة',h:'ثبّته بتلاوته في النوافل'},
 {id:'mut',t:'ضبط المتشابهات',h:'قارنه بالآيات المتشابهة في مواضع أخرى'}
];
const PM=Object.fromEntries(PROCS.map(x=>[x.id,x]));
const SUGGEST={2:['prayer'],1:['fix','link','recite'],0:['rehifz','split','listen','fix']};

/* ---------- أدوات عامة ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const D=d=>new Date(d+'T00:00:00');
const days=d=>d?Math.round((D(today())-D(d))/864e5):null;
const addDays=(d,n)=>{const x=D(d);x.setDate(x.getDate()+n);return ymd(x)};
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const fd=d=>d?WD[D(d).getDay()]+' '+d.split('-').reverse().join('/'):'';
const dws=n=>n==1?'يومًا واحدًا':n==2?'يومين':n<=10?n+' أيامٍ':n+' يومًا';
const num=(v,lo,hi,df=0)=>{v=Math.round(+v);return Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):df};
const nid=p=>(p||'')+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const en=t=>String(t).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const dots=(n,m)=>Array.from({length:m},(_,k)=>`<i class="${k<n?'on':''}"></i>`).join('');
const bar=p=>`<div class="bar"><i style="width:${p}%"></i></div>`;
const nm=i=>SD[i][0];
const rngT=i=>i.a?(i.a===i.b?`آية ${i.a}`:`الآيات ${i.a} – ${i.b}`):(i.p||'مقطع');
const rng=i=>esc(rngT(i));
const cnt=i=>i.a?i.b-i.a+1:0;
function runsArr(a){const o=[];if(!a.length)return o;let s=a[0],p=a[0];for(let i=1;i<=a.length;i++){if(a[i]!==p+1){o.push({f:s,t:p});s=a[i]}p=a[i]}return o}
const runsTxt=a=>runsArr(a).map(r=>r.f===r.t?r.f:r.f+'–'+r.t).join('، ');

/* ---------- تنظيف البيانات (يُستعمل عند التحميل والاستيراد) ---------- */
const cleanCounts=c=>Array.isArray(c)&&c.length===114&&c.every(v=>Number.isInteger(v)&&v>=1&&v<=400)?c.slice():null;
const cleanSet=o=>{o=o||{};return{lt:num(o.lt,1,999,30),rm:!!o.rm,hr:/^\d{2}:\d{2}$/.test(o.hr||'')?o.hr:'18:00',ln:isDate(o.ln)?o.ln:'',lb:isDate(o.lb)?o.lb:'',push:o.push?1:0,aw:o.aw!==false,theme:['light','dark'].includes(o.theme)?o.theme:'auto',counts:cleanCounts(o.counts)}};
const cleanTm=o=>{const r={};['mem','near','w'].forEach(k=>{const t=o&&o[k];if(t&&typeof t==='object')r[k]={run:t.run?1:0,t0:+t.t0||0,acc:Math.max(0,+t.acc||0),tg:num(t.tg,0,600,15),al:t.al?1:0}});return r};
const qv=v=>v!=null&&v!==''&&[0,1,2].includes(+v)?+v:null;
const clean={
 item(x){if(!x||typeof x!=='object')return null;const s=num(x.s,0,113,-1);if(s<0)return null;
  const a=num(x.a,0,400),b=num(x.b,0,400);if(a>b)return null;
  return{id:x.id!=null?String(x.id):nid('i'),s,a,b,p:x.p?String(x.p).slice(0,80):'',stage:STG[x.stage]?x.stage:'near',date:isDate(x.date)?x.date:today(),
   c:[0,1,2].map(k=>num(x.c&&x.c[k],0,3)),lisan:num(x.lisan,0,9999),lv:num(x.lv,0,3),lastRev:isDate(x.lastRev)?x.lastRev:null,tdate:isDate(x.tdate)?x.tdate:null,revs:num(x.revs,0,9999),bk:isDate(x.bk)?x.bk:null}},
 rec(x){if(!x||typeof x!=='object')return null;const s=num(x.s,0,113,-1);if(s<0||!isDate(x.d))return null;
  const a=num(x.a,0,400),b=num(x.b,0,400);if(a>b)return null;
  const act=(Array.isArray(x.act)?x.act:[]).filter(k=>PM[k]);
  return{id:x.id!=null?String(x.id):nid('r'),d:x.d,ty:TYPES[x.ty]?x.ty:'near',s,a,b,q:qv(x.q),post:x.post?1:0,act,done:(Array.isArray(x.done)?x.done:[]).filter(k=>act.includes(k)),
   er:num(x.er,0,999),ti:num(x.ti,0,999),li:String(x.li||'').slice(0,30),lk:LK.includes(x.lk)?x.lk:'',n:String(x.n||'').slice(0,300),auto:x.auto?1:0}},
 w(o){const r={};Object.keys(o||{}).forEach(k=>{const s=+k;if(!(s>=0&&s<=113))return;const v=o[k]||{};r[s]={last:isDate(v.last)?v.last:null,since:isDate(v.since)?v.since:today()};if(v.iv)r[s].iv=num(v.iv,1,60,7)});return r},
 err(o){const r={};Object.keys(o||{}).forEach(k=>{const s=+k;if(!(s>=0&&s<=113)||!Array.isArray(o[k]))return;r[s]=o[k].map(e=>e&&num(e.v,1,400,0)?{v:num(e.v,1,400),c:num(e.c,1,999,1),d:isDate(e.d)?e.d:today()}:null).filter(Boolean)});return r},
 wm(o){const r={};Object.keys(o||{}).forEach(k=>{const d=+k;if(!(d>=0&&d<7)||!Array.isArray(o[k]))return;r[d]=o[k].map(e=>{const s=num(e&&e.s,0,113,-1),f=num(e&&e.f,1,400,0),t=num(e&&e.t,1,400,0);return s>=0&&f&&t>=f?{s,f,t}:null}).filter(Boolean)});return r}
};
const newProfile=(name,extra)=>Object.assign({id:nid('p'),name,level:'',bd:'',bp:'',items:[],w:{},err:{},recs:[],act:[],wd:7,wu:'a',wmode:'a',wm:{}},extra||{});
function cleanProfile(p){if(!p||typeof p!=='object')return null;
 const q=newProfile(String(p.name||'متعلم').trim().slice(0,60)||'متعلم',{id:String(p.id||nid('p'))});
 ['level','bd','bp'].forEach(k=>q[k]=String(p[k]||'').slice(0,60));
 q.items=(Array.isArray(p.items)?p.items:[]).map(clean.item).filter(Boolean);
 q.recs=(Array.isArray(p.recs)?p.recs:[]).map(clean.rec).filter(Boolean);
 q.w=clean.w(p.w);q.err=clean.err(p.err);q.wm=clean.wm(p.wm);
 q.act=(Array.isArray(p.act)?p.act:[]).filter(isDate).slice(-400);
 q.wd=[5,6,7].includes(+p.wd)?+p.wd:7;q.wu=p.wu==='p'?'p':'a';q.wmode=p.wmode==='m'?'m':'a';
 return q}

/* ---------- الحالة ---------- */
const blank=()=>{const p=newProfile('حفظي');return{v:3,cur:p.id,set:cleanSet({}),tm:{},ses:[],profiles:[p]}};
let S=blank(),MIGRATED=0;
const ui={tab:'today',sel:0,wsub:'rev',lsub:'log',month:today().slice(0,7),bk:0};
function normalize(o){const st=blank();if(!o||typeof o!=='object')return st;
 const ps=(Array.isArray(o.profiles)?o.profiles:[]).map(cleanProfile).filter(Boolean),seen=new Set();
 ps.forEach(p=>{while(seen.has(p.id))p.id=nid('p');seen.add(p.id)});
 if(ps.length)st.profiles=ps;
 st.set=cleanSet(o.set);st.tm=cleanTm(o.tm);
 st.ses=(Array.isArray(o.ses)?o.ses:[]).map(x=>x&&isDate(x.d)&&['mem','near','w'].includes(x.k)?{d:x.d,k:x.k,s:num(x.s,0,86400),p:x.p?String(x.p):undefined}:null).filter(Boolean).slice(-600);
 st.cur=st.profiles.some(p=>p.id===o.cur)?o.cur:st.profiles[0].id;return st}
const applyCounts=()=>{SD=NAMES.map((n,i)=>[n,(S.set.counts||HAFS)[i]])};

/* ---------- الترحيل من التطبيقين القديمين ---------- */
function autoWird(p){const done=[];[...new Set(p.items.map(i=>i.s))].forEach(s=>{if(p.w[s])return;const its=p.items.filter(i=>i.s===s);
 if(coveredOf(p,s).size<SD[s][1]||!its.every(i=>i.stage==='stable'||i.stage==='wird'))return;
 its.forEach(i=>i.stage='wird');p.w[s]={last:null,since:today()};done.push(s)});return done}
function coveredOf(p,s){const set=new Set();p.items.filter(i=>i.s===s&&i.a).forEach(i=>{for(let k=i.a;k<=i.b;k++)set.add(k)});return set}
/* صيغ «مراحل الحفظ» وما قبلها */
function convOld(o){
 if(!o||!Array.isArray(o.items))return null;
 if(o.v===2)return o;
 const items=[],w={},ix=n=>NAMES.indexOf(String(n).trim());
 if(Array.isArray(o.wird)||o.items.some(x=>x.surah!==undefined)){
  o.items.forEach(x=>{const s=ix(x.surah);if(s<0)return;
   const m=en(x.part||'').match(/\d+/g);let a=0,b=0;
   if(m){a=+m[0];b=+(m[1]||m[0]);if(a>b)[a,b]=[b,a];if(a<1||b>HAFS[s])a=b=0}
   const g=x.stage==1?'aqli':x.stage==2?'lisan':x.stage==3?'near':'stable',r=x.rev||0;
   items.push({id:nid('i'),s,a,b,p:x.part||'',stage:g,date:x.created||x.last||today(),c:x.c||[0,0,0],lisan:x.lisan||0,lv:g==='near'?Math.min(2,r):g==='stable'?3:0,lastRev:g==='near'&&r>0?x.last:null,tdate:g==='near'&&r==0?x.last:null,revs:r,bk:null})});
  (o.wird||[]).forEach(r=>{const s=ix(r.surah);if(s>=0)w[s]={last:r.last||null,since:r.added||today()}});
  items.forEach(i=>{if(w[i.s]&&i.stage==='stable')i.stage='wird'});
  return{items,w,set:{},ses:[],err:{},log:[]}}
 const mp=[0,0,1,1,2];
 o.items.forEach(x=>{const g=x.stage==='tathbit'?'lisan':x.stage==='near'?'near':'wird';
  items.push({id:nid('i'),s:x.s,a:x.a,b:x.b,stage:g,date:x.date,c:[3,3,3],lisan:x.reps||0,lv:g==='near'?mp[x.lv||0]:g==='wird'?3:0,lastRev:x.lastRev||null,tdate:x.tdate||null,revs:x.revs||0,bk:x.bk||null})});
 const ss=o.set||{};
 return{items,w:o.w||{},set:{rm:ss.rm,hr:ss.hr},ses:o.ses||[],err:o.err||{},log:o.log||[]}}
const fromV2=(o,name)=>cleanProfile({name:name||'حفظي',items:o.items,w:o.w,err:o.err,act:[...new Set((o.log||[]).map(x=>x&&x.d).filter(isDate))]});
/* صيغة «متابعة مسار الحفظ» (المتعلمون) */
function fromFollowup(o){const out=[];
 (Array.isArray(o.l)?o.l:[]).forEach(l=>{if(!l||!l.name)return;
  const recs=[],mem={},first={};
  const R=(x,ty,ex)=>Object.assign({id:'m'+String(x.id||nid('')),d:isDate(x.d)?x.d:today(),ty,s:+x.s,a:+x.f,b:+x.t,q:null,post:x.st==='تأجيل'?1:0,act:[],done:[],er:0,ti:0,li:'',lk:'',n:'',auto:0},ex);
  const okS=x=>x&&+x.s>=0&&+x.s<=113;
  (l.new||[]).forEach(x=>{if(!okS(x))return;recs.push(R(x,'new',{lk:x.ty==='عرض'?'عرض':'تلقي',n:x.n||''}));
   if(x.st==='تم'){const s=+x.s;(mem[s]=mem[s]||new Set());for(let k=+x.f;k<=+x.t;k++)mem[s].add(k);if(!first[s]||x.d<first[s])first[s]=x.d}});
  (l.mush||[]).forEach(x=>{if(okS(x))recs.push(R(x,x.ty==='مراجعة القديم'?'far':x.ty==='جوار الدرس'?'adj':'near',{er:+x.er||0,ti:+x.ti||0,li:x.li||'',n:x.n||''}))});
  (l.qual||[]).forEach(x=>{if(!okS(x))return;const a={'تثبيت':'fix','ربط':'link','إعادة حفظ':'rehifz'}[x.n];
   recs.push(R(x,'q',{q:x.ql==='جيد'?2:x.ql==='متوسط'?1:0,act:a?[a]:[],done:a?[a]:[],n:a?'':(x.n||'')}))});
  const items=[];
  Object.keys(mem).forEach(s=>runsArr([...mem[s]].sort((x,y)=>x-y)).forEach(r=>items.push({id:nid('i'),s:+s,a:r.f,b:r.t,stage:'stable',date:isDate(first[s])?first[s]:today(),c:[3,3,3],lisan:30,lv:3,revs:0})));
  const p=cleanProfile(Object.assign({},l,{id:String(l.id||nid('p')),items,recs}));autoWird(p);out.push(p)});
 return out}
function parseImport(o){
 if(!o||typeof o!=='object')return null;
 if(o.v===3&&Array.isArray(o.profiles)){const n=normalize(o);return{kind:3,profiles:n.profiles,set:n.set,ses:n.ses}}
 if(Array.isArray(o.l)){const ps=fromFollowup(o);return ps.length?{kind:'A',profiles:ps}:null}
 const c=convOld(o);
 if(c&&Array.isArray(c.items))return{kind:'B',profiles:[fromV2(c,'حفظي (مستورد)')],set:cleanSet(c.set),ses:c.ses}
 return null}
function migrateLegacy(){
 const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
 const st=blank();st.profiles=[];let found=0,b=null;
 const m=rd(LEGACY.merged);
 if(m&&Array.isArray(m.items))b=m;
 else{const acc={items:[],w:{},set:{},ses:[],err:{},log:[]};let any=0;
  LEGACY.old.forEach(k=>{const c=convOld(rd(k));if(!c)return;any=1;acc.items.push(...c.items);Object.assign(acc.w,c.w);acc.ses.push(...(c.ses||[]));acc.log.push(...(c.log||[]));Object.assign(acc.err,c.err||{});if(c.set&&c.set.hr)acc.set=c.set});
  if(any)b=acc}
 if(b){const p=fromV2(b,'حفظي');st.profiles.push(p);found++;
  st.set=cleanSet(b.set);st.tm=cleanTm(b.tm);st.ses=(Array.isArray(b.ses)?b.ses:[]).map(x=>x&&isDate(x.d)?{d:x.d,k:['mem','near','w'].includes(x.k)?x.k:'mem',s:num(x.s,0,86400),p:p.id}:null).filter(Boolean)}
 const a=rd(LEGACY.follow);
 if(a&&Array.isArray(a.l)){const ps=fromFollowup(a);if(ps.length){st.profiles.push(...ps);found++}}
 if(!found)return null;
 st.cur=st.profiles[0].id;return normalize(st)}

/* ---------- التخزين ---------- */
function load(){
 try{const r=localStorage.getItem(KEY);
  if(r){try{S=normalize(JSON.parse(r));return}catch(e){try{localStorage.setItem(KEY+'-corrupt',r)}catch(_){}}}}catch(e){}
 try{const m=migrateLegacy();if(m){S=m;MIGRATED=1;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}}catch(e){}}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('تعذّر الحفظ: مساحة المتصفح ممتلئة. صدّر نسخة احتياطية الآن.')}
 idbSync();pushLater()}
function idbSync(){try{const q=indexedDB.open('hifz',1);q.onupgradeneeded=()=>q.result.createObjectStore('k');
 q.onsuccess=()=>{try{const tx=q.result.transaction('k','readwrite');tx.objectStore('k').put({rm:S.set.rm,hr:S.set.hr,g:gaps().map(x=>({d:x.d,m:x.m}))},'g')}catch(e){}}}catch(e){}}

/* =====================================================================
   المنطق: المتعلم الحالي، التغطية، الغفلة، عمليات المسار
   ===================================================================== */
const P=()=>S.profiles.find(p=>p.id===S.cur)||S.profiles[0];
const LT=()=>S.set.lt||30;
const covered=s=>coveredOf(P(),s);
function nextFree(s){const c=covered(s);for(let k=1;k<=SD[s][1];k++)if(!c.has(k))return k;return null}
function limit(s,a){const c=covered(s);for(let k=a+1;k<=SD[s][1];k++)if(c.has(k))return k-1;return SD[s][1]}
function opts(a,b,sel,dis){let h='';for(let k=a;k<=b;k++)h+=`<option value="${k}" ${k===sel?'selected':''} ${dis&&dis(k)?'disabled':''}>${k}</option>`;return h}
function memSet(p){const m={};p.items.filter(i=>MEM.includes(i.stage)&&i.a).forEach(i=>{(m[i.s]=m[i.s]||new Set());for(let k=i.a;k<=i.b;k++)m[i.s].add(k)});return m}
const memTotal=p=>Object.values(memSet(p)).reduce((a,s)=>a+s.size,0);
const cat=n=>n>=6236?'حافظ للقرآن كله':n>=2000?'متقن':n>=600?'متقدم':n>=150?'متوسط':'مبتدئ';
function age(bd){if(!bd)return'—';const b=new Date(bd),n=new Date();let m=(n.getFullYear()-b.getFullYear())*12+n.getMonth()-b.getMonth();if(n.getDate()<b.getDate())m--;return m<0?'—':Math.floor(m/12)+' سنة و '+m%12+' شهر'}

const inprog=i=>i.stage==='aqli'||i.stage==='lisan';
const rf=i=>i.lastRev||i.tdate||i.date;
const iv=i=>INT[Math.min(2,i.lv||0)];
const wiv=w=>w.iv||7;
const wd=s=>{const w=P().w[s];return w.last===null||days(w.last)>=wiv(w)};
const nd=i=>i.stage==='near'&&days(rf(i))>=iv(i);
const find=id=>P().items.find(i=>String(i.id)===String(id));
const findRec=id=>P().recs.find(r=>String(r.id)===String(id));
const markActive=()=>{const a=P().act;if(!a.includes(today())){a.push(today());if(a.length>400)a.splice(0,a.length-400)}};
function logRec(ty,s,a,b,q,extra){P().recs.push(Object.assign({id:nid('r'),d:today(),ty,s,a:a||0,b:b||0,q:q==null?null:q,post:0,act:[],done:[],er:0,ti:0,li:'',n:'',auto:1},extra||{}));markActive()}

/* ---------- الغفلة (لكل المتعلمين) ---------- */
function gapsOf(p,pre){const r=[];
 p.items.forEach(i=>{
  if(inprog(i))r.push({d:addDays(i.bk||i.date,3),m:`${pre}${nm(i.s)} ${rngT(i)}: ينتظر إتمام الحفظ`,tab:'mem',pid:p.id});
  if(i.stage==='near')r.push({d:addDays(addDays(rf(i),iv(i)),1),m:`${pre}${nm(i.s)} ${rngT(i)}: لم تُراجَع`,tab:'near',pid:p.id})});
 Object.keys(p.w).forEach(s=>{const w=p.w[s];r.push({d:addDays(w.last||w.since,wiv(w)+3),m:`${pre}سورة ${nm(+s)}: تأخرت مراجعتها الأسبوعية`,tab:'w',pid:p.id})});
 return r}
const gaps=()=>S.profiles.flatMap(p=>gapsOf(p,S.profiles.length>1?p.name+' — ':''));
const late=()=>gaps().filter(x=>x.d<=today());
const lateOf=p=>gapsOf(p,'').filter(x=>x.d<=today());
async function guardLate(){const l=lateOf(P());return !l.length||ask({title:'مراجعة متأخرة',msg:`لديك ${l.length} مقطع متأخر، والأولى مراجعته قبل حفظ جديد. هل تتابع؟`,ok:'أتابع'})}

/* ---------- عمليات المسار ---------- */
function startSeg(s,a,b,stage,date,noRec){
 const it={id:nid('i'),s,a,b,p:'',stage:stage||'aqli',date:date||today(),c:[0,0,0],lisan:0,lv:0,lastRev:null,tdate:null,revs:0,bk:null};
 if(it.stage==='near'){it.c=[3,3,3];it.lisan=LT();it.tdate=it.date;it.bk=it.date}
 P().items.push(it);if(!noRec)logRec('new',s,a,b,null,{d:it.date});markActive();return it}
async function addSeg(){
 const s=ui.sel,a=+($('#a')||{}).value,b=+($('#b')||{}).value,n=SD[s][1];
 if(!a||!b||a<1||b>n||a>b)return toast(`أدخل مقداراً صحيحاً بين 1 و ${n}`);
 if(!(await guardLate()))return;
 startSeg(s,a,b,'aqli');save();toast('✅ بدأ المقطع: 9 تكرارات للحفظ العقلي');render()}
function cn(id,k,d){const i=find(id);if(!i)return;i.c[k]=Math.max(0,Math.min(3,i.c[k]+d));save();render()}
function toL(id){const i=find(id);if(!i)return;i.stage='lisan';i.bk=today();markActive();save();toast('انتقل المقطع إلى الحفظ اللساني');render()}
function lis(id,n){const i=find(id);if(!i)return;const p=i.lisan;i.lisan=Math.max(0,i.lisan+n);
 if(p<LT()&&i.lisan>=LT()){navigator.vibrate&&navigator.vibrate(150);toast(`🎯 بلغت ${LT()} تكرارًا`)}save();render()}
async function toN(id){const i=find(id);if(!i)return;
 if(i.lisan<LT()&&!(await ask({title:'تأكيد الانتقال',msg:`التكرار ${i.lisan} من ${LT()}. هل تحقق الحفظ اللساني فعلاً؟`,ok:'نعم، تحقق'})))return;
 i.stage='near';i.tdate=today();i.lv=0;i.lastRev=null;markActive();save();toast('بدأت المراجعة المتباعدة: الأولى بعد 3 أيام');render()}
/* تُرجع رسالة النتيجة؛ o.noRec: لا تُنشئ سجلًا (يُنشئه المستدعي) */
function revNear(i,q,o){o=o||{};i.lastRev=today();i.revs++;if(!o.noRec)logRec('near',i.s,i.a,i.b,q);markActive();
 if(q===0){i.stage='lisan';i.lisan=0;i.bk=today();i.lv=0;i.tdate=null;return'عاد المقطع إلى الحفظ اللساني لتقويته'}
 if(q===2){i.lv++;if(i.lv>=3){i.stage='stable';return'🎉 ثُبّت المقطع بعد 3 مراجعات'+checkComplete(i.s)}return`أحسنت — المراجعة القادمة بعد ${iv(i)} يوم`}
 return`يُعاد في نفس المستوى بعد ${iv(i)} يوم`}
function checkComplete(s){if(!S.set.aw)return'';const d=autoWird(P());return d.includes(s)?` — اكتملت سورة ${nm(s)} وانتقلت إلى الورد الأسبوعي`:''}
async function toW(s){const c=covered(s).size,n=SD[s][1],p=P();
 if(!(await ask({title:'نقل إلى الورد',msg:`سورة ${nm(s)}: ${c} من ${n} آية مسجّلة. نقلها إلى الورد الأسبوعي؟`,ok:'انقل'})))return;
 p.items.filter(i=>i.s===s&&(i.stage==='near'||i.stage==='stable')).forEach(i=>i.stage='wird');p.w[s]=p.w[s]||{last:null,since:today()};save();toast(`انتقلت سورة ${nm(s)} إلى الورد`);render()}
function addW(){const s=+$('#ws').value,p=P();if(p.w[s])return toast('السورة في الورد بالفعل');p.w[s]={last:null,since:today()};save();toast('أُضيفت إلى الورد');render()}
async function rmW(s){const p=P();if(!(await ask({title:'إزالة من الورد',msg:`إزالة سورة ${nm(s)} من الورد؟`,ok:'أزل',danger:true})))return;
 delete p.w[s];p.items.filter(i=>i.s===s&&i.stage==='wird').forEach(i=>i.stage='stable');save();render()}
function revW(s,q,o){o=o||{};const p=P(),w=p.w[s],its=p.items.filter(i=>i.s===s&&i.stage==='wird');
 w.last=today();if(!o.noRec)logRec('far',s,1,SD[s][1],q);markActive();
 if(q===0&&its.length){its.forEach(i=>{i.stage='near';i.lv=0;i.lastRev=today();i.tdate=null});delete p.w[s];return`رجعت سورة ${nm(s)} إلى المراجعة المتباعدة`}
 w.iv=q===2?7:3;return q===2?'أحسنت — تمت المراجعة':'مراجعتها القادمة بعد 3 أيام'}
async function delSeg(id){if(!(await ask({title:'حذف المقطع',msg:'حذف هذا المقطع من المسار؟ تبقى سجلاته في السجل.',ok:'احذف',danger:true})))return;
 const p=P();p.items=p.items.filter(i=>String(i.id)!==String(id));save();render()}
function addErrAt(s,v){const e=P().err[s]=P().err[s]||[],x=e.find(y=>y.v===v);x?x.c++:e.push({v,c:1,d:today()})}
async function addErr(s){const n=SD[s][1],r=await ask({title:'موضع تردد',msg:`رقم الآية الموضع (1 – ${n})`,ok:'أضف',input:{type:'select',max:n,value:1}});
 const v=num(r,1,n,0);if(!r||!v)return;addErrAt(s,v);save();render()}
async function delErr(s,v){if(!(await ask({title:'إتقان الموضع',msg:`أتقنت موضع الآية ${v}؟ سيُحذف من السجل.`,ok:'أتقنته'})))return;
 P().err[s]=(P().err[s]||[]).filter(y=>y.v!==v);save();render()}

/* ---------- سجل الحفظ: إجراءات التقوية ---------- */
function ptoggle(id,k){const r=findRec(id);if(!r||!r.act.includes(k))return;
 r.done=r.done.includes(k)?r.done.filter(x=>x!==k):[...r.done,k];save();render()}
async function delRec(id){if(!(await ask({title:'حذف التسجيل',msg:'حذف هذا التسجيل من السجل؟',ok:'احذف',danger:true})))return;
 const p=P();p.recs=p.recs.filter(r=>String(r.id)!==String(id));save();render()}
const tasks=()=>{const f=addDays(today(),-21);return P().recs.filter(r=>!r.auto&&r.d>=f&&r.act.length&&r.done.length<r.act.length).sort((a,b)=>a.d<b.d?1:-1)};

/* ---------- المؤقت ---------- */
const tmo=k=>S.tm[k]||(S.tm[k]={run:0,t0:0,acc:0,tg:15,al:0});
const tsec=k=>{const t=tmo(k);return Math.floor(t.acc+(t.run?(Date.now()-t.t0)/1000:0))};
const fmt=s=>pad(Math.floor(s/60))+':'+pad(s%60);
const sesOf=()=>S.ses.filter(x=>(x.p||S.profiles[0].id)===S.cur);
function tgl(k){const t=tmo(k);if(t.run){t.acc+=(Date.now()-t.t0)/1000;t.run=0}else{t.t0=Date.now();t.run=1;t.al=0}save();render()}
function tmDone(k){const s=tsec(k);if(s<30)return toast('الجلسة قصيرة جدًا للحفظ');S.ses.push({d:today(),k,s,p:S.cur});if(S.ses.length>600)S.ses.splice(0,S.ses.length-600);
 S.tm[k]={run:0,t0:0,acc:0,tg:tmo(k).tg,al:0};markActive();save();toast(`حُفظت الجلسة: ${Math.round(s/60)} دقيقة`);render()}
function tset(k,v){tmo(k).tg=+v;tmo(k).al=0;save()}
function streak(){const p=P(),s=new Set([...p.recs.filter(r=>!r.post).map(r=>r.d),...p.act,...sesOf().map(x=>x.d)]);let d=today(),n=0;if(!s.has(d))d=addDays(d,-1);while(s.has(d)){n++;d=addDays(d,-1)}return n}

/* =====================================================================
   الشاشات
   ===================================================================== */
const rate=(f,attrs)=>`<div class="acts"><button data-a="${f}" ${attrs} data-q="2">✔ متقنة</button><button class="ghost" data-a="${f}" ${attrs} data-q="1">〰 متردد</button><button class="ghost" data-a="${f}" ${attrs} data-q="0">✖ ضعيفة</button></div>`;
const badge=r=>r.q!=null?`<span class="badge ${QC[r.q]}">${QL[r.q]}</span>`:r.post?'<span class="badge d">تأجيل</span>':'';

/* تنبيه النسخة الاحتياطية: البيانات في المتصفح فقط، فتُذكَّر بالتصدير كل 14 يومًا */
function bkDue(){const ds=S.profiles.flatMap(p=>[...p.items.map(i=>i.date),...p.recs.map(r=>r.d)]).filter(isDate).sort();
 if(!ds.length)return 0;const base=S.set.lb||ds[0];return days(base)>=14}
function bkBan(){if(!bkDue())return'';
 return `<div class="card bk"><div class="t">💾 احفظ نسخة من بياناتك</div><p class="m">${S.set.lb?'آخر نسخة احتياطية '+fd(S.set.lb):'لم تُصدَّر نسخة احتياطية بعد'}. بياناتك في هذا المتصفح فقط، وقد تضيع بمسح بيانات الموقع أو تغيير الهاتف.</p><div class="acts"><button data-a="exp">تصدير نسخة الآن</button></div></div>`}
function ban(){const l=late();if(!l.length)return bkBan();
 return bkBan()+`<div class="card warn"><div class="t">⚠ غفلة عن المراجعة (${l.length})</div>${l.slice(0,3).map(x=>`<button class="lnk gp" data-a="jump" data-pid="${esc(x.pid)}" data-t="${x.tab}">${esc(x.m)}</button>`).join('')}${l.length>3?`<div class="m">و${l.length-3} أخرى</div>`:''}</div>`}

function tbar(k){const t=tmo(k),td=Math.round(sesOf().filter(x=>x.d===today()&&x.k===k).reduce((a,x)=>a+x.s,0)/60);
 return `<div class="card tm"><div class="top"><span class="m">⏱ مؤقت الجلسة</span><span class="m">مجموع اليوم: ${td} د</span></div><div class="top"><b id="tmv">${fmt(tsec(k))}</b><select aria-label="هدف الجلسة" data-c="tset" data-k="${k}"><option value="0">بلا هدف</option>${[10,15,20,30,45,60].map(x=>`<option value="${x}" ${t.tg==x?'selected':''}>الهدف ${x} د</option>`).join('')}</select></div><div class="acts"><button data-a="tgl" data-k="${k}">${t.run?'⏸ إيقاف':'▶ ابدأ'}</button><button class="ghost" data-a="tmDone" data-k="${k}">💾 حفظ الجلسة</button></div></div>`}

function statCard(){const p=P(),f=addDays(today(),-6),l=p.recs.filter(x=>x.d>=f),r=l.filter(x=>x.q!=null&&x.ty!=='new'),g=r.filter(x=>x.q===2).length;
 return `<div class="card"><div class="top"><span class="t">🔥 ${streak()} يوم متتالٍ</span><span class="m">آخر 7 أيام</span></div><div class="m" style="margin-top:6px">مقاطع جديدة: <b>${l.filter(x=>x.ty==='new'&&!x.post).length}</b> &nbsp; مراجعات: <b>${r.length}</b> &nbsp; متقنة: <b>${r.length?Math.round(g/r.length*100):0}%</b></div></div>`}

function tasksCard(){const t=tasks();if(!t.length)return'';
 return `<h2>خطة التقوية</h2><p class="m hint">اضغط الإجراء بعد تنفيذه ليُعلَّم منجزًا.</p>`+t.slice(0,4).map(r=>`<div class="card"><div class="top"><span class="t sm">${esc(nm(r.s))}، ${rng(r)}</span>${badge(r)}</div><div class="meta"><span>${fd(r.d)}</span></div><div class="chips">${r.act.map(k=>`<button class="chip ${r.done.includes(k)?'dn':''}" data-a="ptoggle" data-id="${esc(r.id)}" data-k="${k}" aria-pressed="${r.done.includes(k)}">${r.done.includes(k)?'✓ ':''}${PM[k].t}</button>`).join('')}</div></div>`).join('')+(t.length>4?`<div class="m">و${t.length-4} أخرى في السجل</div>`:'')}

function errs(s){const e=(P().err[s]||[]).slice().sort((a,b)=>a.v-b.v);
 return `<div class="m" style="margin-top:8px">مواضع التردد: ${e.length?e.map(x=>`<button class="badge d bt" data-a="delErr" data-s="${s}" data-v="${x.v}" aria-label="أتقنت موضع الآية ${x.v}">${x.v}${x.c>1?' ×'+x.c:''}</button>`).join(' '):'لا شيء'} <button class="badge bt" data-a="addErr" data-s="${s}">＋ موضع</button></div>`}

function mcard(i){const tg=LT();let b;
 if(i.stage==='aqli'){
  b=REPS.map((n,k)=>`<div class="row"><span>${n}</span><span class="dots">${dots(i.c[k],3)}</span><span><button class="sm" data-a="cn" data-id="${esc(i.id)}" data-k="${k}" data-d="-1" aria-label="إنقاص">−</button><button class="sm" data-a="cn" data-id="${esc(i.id)}" data-k="${k}" data-d="1" aria-label="زيادة">+</button></span></div>`).join('');
  if(i.c.every(x=>x>=3))b+=`<button class="big" data-a="toL" data-id="${esc(i.id)}">اكتملت التكرارات التسعة ← الحفظ اللساني</button>`}
 else{
  b=`<div class="row"><span class="cnt">${i.lisan}<span class="m"> / ${tg} مرة</span></span><span><button class="sm" data-a="lis" data-id="${esc(i.id)}" data-n="-1" aria-label="إنقاص">−</button><button class="sm" data-a="lis" data-id="${esc(i.id)}" data-n="1">+1</button><button class="sm" data-a="lis" data-id="${esc(i.id)}" data-n="5">+5</button></span></div>${bar(Math.min(100,Math.round(i.lisan/tg*100)))}<button class="big ${i.lisan>=tg?'':'ghost'}" data-a="toN" data-id="${esc(i.id)}">تحقق الحفظ اللساني ← المراجعة المتباعدة</button>`}
 return `<div class="card"><div class="top"><span class="t">${esc(nm(i.s))}، ${rng(i)}</span><span class="badge">${STG[i.stage]}</span></div><div class="m">بدأ ${fd(i.date)}</div>${b}<div class="acts"><button class="lnk" data-a="delSeg" data-id="${esc(i.id)}">🗑 حذف المقطع</button></div></div>`}

function nrow(i){const k=iv(i)-days(rf(i)),ok=i.lastRev===today(),du=k<=0,lb=ok?'تمت اليوم':k<0?'متأخرة '+dws(-k):k===0?'تُستحق اليوم':'بعد '+dws(k);
 return `<div class="top"><span class="m">المراجعة ${(i.lv||0)+1} من 3: ${REVT[Math.min(2,i.lv||0)]}</span><span class="badge ${!ok&&k<0?'d':''}">${lb}</span></div>
 <div class="m" style="margin-top:4px">${i.lastRev?`آخر مراجعة ${fd(i.lastRev)}`:`ثُبّت لسانيًا ${fd(i.tdate)}`}، رُوجع ${i.revs} مرة</div>
 ${ok?'<div class="acts"><button disabled>✔ تمت اليوم</button></div>':du?rate('revNear',`data-id="${esc(i.id)}"`):'<div class="acts"><button disabled>لم يحن موعدها</button></div>'}`}

function wcard(s){const p=P(),w=p.w[s],ref=w.last||w.since,d=days(w.last),isD=wd(s);
 return `<div class="card"><div class="top"><span class="t">سورة ${esc(nm(+s))}</span><span class="badge ${isD?'d':''}">${isD?'مستحقة':'رُوجعت'}</span></div>
 <div class="m" style="margin-top:6px">${w.last?`آخر مراجعة: ${fd(w.last)} (قبل ${d} يوم)`:`دخلت الورد ${fd(w.since)}، لم تُراجع بعد`}، ${SD[s][1]} آية</div>
 <div class="m">الموعد القادم: <b>${fd(addDays(ref,wiv(w)))}</b></div>
 ${w.last===today()?'<div class="acts"><button disabled>✔ تمت اليوم</button></div>':rate('revW',`data-s="${s}"`)}${errs(+s)}<div class="acts"><button class="lnk" data-a="rmW" data-s="${s}">إزالة من الورد</button></div></div>`}

/* ---------- اليوم ---------- */
function vToday(){
 const p=P(),it=p.items,dn=it.filter(nd),dwk=Object.keys(p.w).filter(wd),pg=it.filter(inprog);let h=statCard();
 if(dn.length)h+='<h2>مراجعات مستحقة</h2>'+dn.map(i=>`<div class="card"><div class="top"><span class="t">${esc(nm(i.s))}، ${rng(i)}</span></div>${nrow(i)}</div>`).join('');
 if(dwk.length)h+='<h2>الورد الأسبوعي</h2>'+dwk.map(wcard).join('');
 h+=tasksCard();
 if(pg.length)h+='<h2>قيد الحفظ</h2>'+pg.map(mcard).join('');
 if(!dn.length&&!dwk.length&&!pg.length&&!tasks().length)h+='<div class="empty">لا مهام اليوم.<br>سجّل حفظك بزر «سجّل حفظي»، أو ابدأ مقطعًا من تبويب «الحفظ».</div>';
 return h}

/* ---------- الحفظ ---------- */
function vMem(){
 const s=ui.sel,n=SD[s][1],nx=nextFree(s),c=covered(s),pg=P().items.filter(inprog);
 const so=SD.map((x,i)=>`<option value="${i}" ${i===s?'selected':''}>${i+1}. ${esc(x[0])} (${x[1]})</option>`).join('');
 const form=nx?`<div class="two"><div><label for="a">من آية (1 – ${n})</label><select id="a" data-c="fixTo">${opts(1,n,nx,k=>c.has(k))}</select></div><div><label for="b">إلى آية</label><select id="b">${opts(nx,limit(s,nx),Math.min(limit(s,nx),nx+4))}</select></div></div><button class="big" data-a="addSeg">＋ ابدأ المقطع (9 تكرارات)</button>`:'<div class="empty">السورة مسجّلة بالكامل ✔</div>';
 return `<div class="card"><label for="s">السورة (عدد آياتها)</label><select id="s" data-c="sel">${so}</select><div class="m" style="margin-top:8px">${c.size} من ${n} آية في مسارك</div>${bar(Math.round(c.size/n*100))}${form}</div>
 <h2>قيد الحفظ</h2>${pg.length?pg.map(mcard).join(''):'<div class="empty">لا توجد مقاطع قيد الحفظ.</div>'}`}

/* ---------- المراجعة المتباعدة ---------- */
function vN(){
 const p=P(),ss=[...new Set(p.items.filter(i=>i.stage==='near'||i.stage==='stable').map(i=>i.s))].sort((a,b)=>a-b);
 if(!ss.length)return'<div class="empty">لا توجد مقاطع في المراجعة المتباعدة.<br>تظهر هنا بعد إتمام الحفظ اللساني.</div>';
 return ss.map(s=>{const c=covered(s).size,n=SD[s][1],its=p.items.filter(i=>i.s===s&&(i.stage==='near'||i.stage==='stable')).sort((a,b)=>a.a-b.a);
  return `<div class="card"><div class="top"><span class="t">سورة ${esc(nm(s))}</span><span class="badge">${c}/${n} آية</span></div>${bar(Math.round(c/n*100))}
  ${its.map(i=>`<div class="sep"><div class="top"><span class="t sm">${rng(i)}</span></div>${i.stage==='stable'?'<div class="ok">ثُبّت بعد 3 مراجعات ✓</div>':nrow(i)}</div>`).join('')}${errs(s)}
  <div class="m" style="margin-top:8px">${S.set.aw?'تنتقل السورة تلقائيًا إلى الورد الأسبوعي عند اكتمالها وتثبيت كل مقاطعها.':'نقل السورة إلى الورد يدوي (يمكن تفعيل النقل التلقائي من ⚙).'}</div>
  <button class="big ghost" data-a="toW" data-s="${s}">نقل السورة إلى الورد الأسبوعي الآن</button></div>`}).join('')}

/* ---------- الورد: المراجعة + جدول الأسبوع ---------- */
function vW(){
 const seg=`<div class="seg2" role="group" aria-label="أقسام الورد"><button class="${ui.wsub==='rev'?'on':''}" data-a="wsub" data-v="rev" aria-pressed="${ui.wsub==='rev'}">مراجعة السور</button><button class="${ui.wsub==='plan'?'on':''}" data-a="wsub" data-v="plan" aria-pressed="${ui.wsub==='plan'}">جدول الأسبوع</button></div>`;
 return seg+(ui.wsub==='plan'?vPlan():vWrev())}
function vWrev(){
 const p=P(),ks=Object.keys(p.w).map(Number).sort((a,b)=>a-b),due=ks.filter(wd);
 const add=`<div class="card"><label for="ws">إضافة سورة محفوظة سابقًا إلى الورد</label><div class="two"><div style="flex:3"><select id="ws">${SD.map((x,i)=>`<option value="${i}">${i+1}. ${esc(x[0])}</option>`).join('')}</select></div><div style="flex:1"><button style="width:100%" data-a="addW">إضافة</button></div></div></div>`;
 if(!ks.length)return'<div class="empty">لا توجد سور في الورد بعد.<br>تدخله السورة بعد اكتمالها وتثبيتها.</div>'+add;
 return `<div class="card"><div class="t">ورد هذا الأسبوع</div><div class="m">${ks.length-due.length} من ${ks.length} سور رُوجعت في موعدها</div>${bar(Math.round((ks.length-due.length)/ks.length*100))}</div>`+ks.map(wcard).join('')+add}
function memList(p){const m=memSet(p),all=[];Object.keys(m).map(Number).sort((a,b)=>a-b).forEach(s=>[...m[s]].sort((a,b)=>a-b).forEach(a=>all.push([s,a])));return all}
function chunkToEntries(ch){const by={};ch.forEach(([s,a])=>(by[s]=by[s]||[]).push(a));return Object.keys(by).map(Number).flatMap(s=>runsArr(by[s]).map(r=>({s,f:r.f,t:r.t})))}
function autoPlan(p){const all=memList(p),sz=Math.ceil(all.length/p.wd)||1;return Array.from({length:p.wd},(_,i)=>chunkToEntries(all.slice(i*sz,(i+1)*sz)))}
function vPlan(){
 const p=P(),u=p.wu,ds=WK.slice(0,p.wd),size=n=>u==='a'?n+' آية':(n/10.3).toFixed(1)+' صفحة تقريبًا';
 const ctl=`<div class="card np"><div class="two"><div><label for="pwd">عدد أيام الورد</label><select id="pwd" data-c="pw" data-f="wd">${[7,6,5].map(x=>`<option ${x===p.wd?'selected':''}>${x}</option>`).join('')}</select></div><div><label for="pwu">وحدة القياس</label><select id="pwu" data-c="pw" data-f="wu"><option value="a" ${u==='a'?'selected':''}>عدد الآيات</option><option value="p" ${u==='p'?'selected':''}>الصفحات (تقريبًا)</option></select></div></div>
  <label for="pwm">طريقة الورد</label><select id="pwm" data-c="pw" data-f="wmode"><option value="a" ${p.wmode!=='m'?'selected':''}>تلقائي متوازن</option><option value="m" ${p.wmode==='m'?'selected':''}>يحدده الأستاذ</option></select>
  <button class="big ghost" data-a="print">🖨 طباعة الجدول</button></div>`;
 const head=`<div class="ph"><b>الورد الأسبوعي — ${esc(p.name)}</b><span>${fd(today())}</span></div>`;
 if(p.wmode==='m')return ctl+head+planManual(p,ds,size);
 const plan=autoPlan(p);
 if(!plan.some(c=>c.length))return ctl+'<div class="card em empty">يُبنى الورد تلقائيًا من المقاطع التي أتممت حفظها (في المراجعة المتباعدة أو الورد).</div>';
 const rows=plan.map((c,i)=>{if(!c.length)return'';const n=c.reduce((a,r)=>a+r.t-r.f+1,0);
  return `<tr><th scope="row">${ds[i]}</th><td>${c.map(r=>`${esc(nm(r.s))} (${r.f===r.t?r.f:r.f+'–'+r.t})`).join('، ')}</td><td>${size(n)}</td></tr>`}).join('');
 return ctl+head+`<div class="card"><div class="t">الورد الأسبوعي</div><p class="m hint">يُوزَّع كل المحفوظ بالتساوي على أيام الأسبوع ويتغيّر مع كل تقدّم (الصفحة ≈ 10 آيات).</p><div class="sc"><table><tr><th>اليوم</th><th>المقدار</th><th>الحجم</th></tr>${rows}</table></div></div>`}
function planManual(p,ds,size){const wm=p.wm,op=SD.map((s,i)=>`<option value="${i}">${esc(s[0])}</option>`).join('');
 return `<div class="card np"><p class="m hint">أضف لكل يوم السور والآيات المطلوبة، أو انسخ التوزيع التلقائي ثم عدّله.</p><button class="ghost" data-a="seedPlan">نسخ التوزيع التلقائي</button></div>`+
 ds.map((d,i)=>{const L=wm[i]||[],n=L.reduce((a,r)=>a+r.t-r.f+1,0);
  return `<div class="card"><div class="top"><b>${d}</b><span class="m">${size(n)}</span></div><div>${L.map((r,j)=>`<div class="row"><span>${esc(nm(r.s))} (${r.f===r.t?r.f:r.f+'–'+r.t})</span><button class="lnk np" data-a="wdel" data-i="${i}" data-j="${j}" aria-label="حذف">✕</button></div>`).join('')}</div>
  <div class="np"><div class="two sp"><div style="flex:2"><select id="ws${i}" aria-label="السورة" data-c="ays" data-pa="#wf${i}" data-pb="#wt${i}">${op}</select></div><div><select id="wf${i}" aria-label="من آية" data-c="ayf" data-pb="#wt${i}">${ayOpts(SD[0][1],1)}</select></div><div><select id="wt${i}" aria-label="إلى آية">${ayOpts(SD[0][1],SD[0][1])}</select></div></div><button class="big ghost" data-a="wadd" data-i="${i}">＋ إضافة إلى ${d}</button></div></div>`}).join('')}


/* ---------- اختيار السور والآيات من قوائم ---------- */
const ayOpts=(n,sel)=>Array.from({length:n},(_,k)=>`<option value="${k+1}" ${k+1===sel?'selected':''}>${k+1}</option>`).join('');
const surahOpts=s=>SD.map((x,i)=>`<option value="${i}" ${i===s?'selected':''}>${i+1}. ${esc(x[0])}</option>`).join('');
/* حقول «السورة + من آية + إلى آية» كلها قوائم اختيار */
function ayFields(id,s,a,b){const n=SD[s][1];
 return `<label for="${id}-s">السورة</label><select id="${id}-s" data-c="ays" data-pa="#${id}-a" data-pb="#${id}-b" data-nw="${id==='nw'?1:0}">${surahOpts(s)}</select>
 <div class="two"><div><label for="${id}-a">من آية</label><select id="${id}-a" data-c="ayf" data-pb="#${id}-b">${ayOpts(n,a)}</select></div><div><label for="${id}-b">إلى آية</label><select id="${id}-b">${ayOpts(n,b)}</select></div></div>`}

/* ---------- ورقة «متابعة المحفوظ» (المعاهدة + الدرس الجديد) ---------- */
function vSheet(p,m){
 const all=p.recs.filter(r=>!r.auto&&r.d.startsWith(m)).map((r,i)=>[r,i]).sort((x,y)=>x[0].d.localeCompare(y[0].d)||x[1]-y[1]).map(x=>x[0]);
 const MU=all.filter(r=>r.ty==='adj'||r.ty==='near'||r.ty==='far'),NW=all.filter(r=>r.ty==='new');
 const lastMu=[...p.recs].reverse().find(r=>!r.auto&&['adj','near','far'].includes(r.ty)),sM=lastMu?lastMu.s:ui.sel,sN=ui.sel,aN=nextFree(sN)||1;
 const ay=r=>r.a===r.b?r.a:r.a+'–'+r.b,del=r=>`<td class="np"><button class="lnk" data-a="delRec" data-id="${esc(r.id)}" aria-label="حذف السطر">✕</button></td>`;
 const blank=(c,n)=>Array.from({length:n},()=>`<tr class="bl">${'<td>&nbsp;</td>'.repeat(c)}</tr>`).join('');
 const muRows=MU.map(r=>`<tr><td>${fd(r.d)}</td><td>${TYPES[r.ty]}</td><td>${esc(r.li)||'—'}</td><td>${esc(nm(r.s))}</td><td>${ay(r)}</td><td>${r.er}</td><td>${r.ti}</td><td class="nt">${r.q!=null?`<span class="badge ${QC[r.q]}">${QL[r.q]}</span> `:''}${esc(r.n)}</td>${del(r)}</tr>`).join('');
 const nwRows=NW.map(r=>`<tr><td>${fd(r.d)}</td><td>${esc(r.lk)||'—'}</td><td>${esc(nm(r.s))}</td><td>${ay(r)}</td><td class="nt">${r.q!=null?`<span class="badge ${QC[r.q]}">${QL[r.q]}</span> `:''}${esc(r.n)}</td><td>${r.post?'تأجيل':'تم'}</td>${del(r)}</tr>`).join('');
 const muForm=`<details class="card np fm"><summary>＋ سطر جديد في المعاهدة</summary>
  <div class="two"><div><label for="mu-d">اليوم والتاريخ</label><input type="date" id="mu-d" value="${today()}" max="${today()}"></div><div><label for="mu-ty">نوع المعاهدة</label><select id="mu-ty"><option value="adj">جوار الدرس</option><option value="near">مراجعة القريب</option><option value="far">مراجعة البعيد</option></select></div></div>
  <label for="mu-li">المستمع</label><select id="mu-li"><option>الولي</option><option>الأستاذ</option><option>الزميل</option></select>
  ${ayFields('mu',sM,1,Math.min(SD[sM][1],10))}
  <div class="two"><div><label for="mu-er">الأخطاء</label><input type="number" id="mu-er" inputmode="numeric" min="0" value="0"></div><div><label for="mu-ti">التنبيهات</label><input type="number" id="mu-ti" inputmode="numeric" min="0" value="0"></div></div>
  <label for="mu-n">الملاحظات</label><input id="mu-n" maxlength="300">
  <button class="big" data-a="sheetAdd" data-k="mu">حفظ السطر</button></details>`;
 const nwForm=`<details class="card np fm"><summary>＋ سطر جديد في الدرس الجديد</summary>
  <div class="two"><div><label for="nw-d">اليوم والتاريخ</label><input type="date" id="nw-d" value="${today()}" max="${today()}"></div><div><label for="nw-lk">نوع الدرس</label><select id="nw-lk">${LK.map(x=>`<option>${x}</option>`).join('')}</select></div></div>
  ${ayFields('nw',sN,aN,Math.min(limit(sN,aN),aN+4))}
  <label for="nw-n">الملاحظات</label><input id="nw-n" maxlength="300">
  <div class="two"><div><label for="nw-st">الإنجاز</label><select id="nw-st"><option value="تم">تم</option><option value="تأجيل">تأجيل</option></select></div><div><label for="nw-path">مسار المقطع</label><select id="nw-path"><option value="near">محفوظ: ادخل المراجعة المتباعدة</option><option value="aqli">ابدأ من الحفظ العقلي</option><option value="none">سجّل فقط</option></select></div></div>
  <button class="big" data-a="sheetAdd" data-k="nw">حفظ السطر</button></details>`;
 return `<div class="card shh"><div class="bis">بسم الله الرحمن الرحيم</div><div class="t">متابعة المحفوظ</div><div class="nmrow"><span>الاسم واللقب:</span><b>${esc(p.name)}</b><button class="lnk np" data-a="go" data-t="s">تعديل</button></div></div>
 ${muForm}${nwForm}
 <div class="sheet">
  <div class="card sh-mu"><div class="t">المعاهدة</div><div class="sc"><table class="ruled"><thead><tr><th rowspan="2">اليوم والتاريخ</th><th rowspan="2">نوع المعاهدة</th><th rowspan="2">المستمع</th><th colspan="2">المقدار</th><th rowspan="2">الأخطاء</th><th rowspan="2">التنبيهات</th><th rowspan="2">الملاحظات</th><th rowspan="2" class="np"></th></tr><tr><th>السورة</th><th>الآيات</th></tr></thead><tbody>${muRows}${blank(8,8)}</tbody></table></div></div>
  <div class="card sh-nw"><div class="t">الدرس الجديد</div><div class="sc"><table class="ruled"><thead><tr><th rowspan="2">اليوم والتاريخ</th><th rowspan="2">نوع الدرس</th><th colspan="2">المقدار</th><th rowspan="2">الملاحظات</th><th rowspan="2">الإنجاز</th><th rowspan="2" class="np"></th></tr><tr><th>السورة</th><th>الآيات</th></tr></thead><tbody>${nwRows}${blank(6,8)}</tbody></table></div></div>
 </div>
 <button class="big ghost np" data-a="printSheet">🖨 طباعة الورقة</button>`}

/* ---------- السجل والتقرير ---------- */
function qbar(R){const c=[2,1,0].map(v=>R.filter(r=>r.q===v).length);
 if(!c[0]+c[1]+c[2])return'<div class="m">لا تقييمات في هذا الشهر.</div>';
 return `<div class="qbar" role="img" aria-label="متقن ${c[0]}، متردد ${c[1]}، ضعيف ${c[2]}">${c.map((n,i)=>n?`<i class="q${2-i}" style="flex:${n}"></i>`:'').join('')}</div><div class="qleg"><span class="q2">متقن ${c[0]}</span><span class="q1">متردد ${c[1]}</span><span class="q0">ضعيف ${c[2]}</span></div>`}
function recCard(r){const n=r.b-r.a+1,det=[r.er?`أخطاء: ${r.er}`:'',r.ti?`تنبيهات: ${r.ti}`:'',r.li?`المستمع: ${esc(r.li)}`:''].filter(Boolean);
 return `<div class="card rec${r.auto?' auto':''}"><div class="top"><span class="t sm">${esc(nm(r.s))}، ${rng(r)}</span>${badge(r)}</div>
 <div class="meta"><span class="tag">${TYPES[r.ty]}</span>${r.lk?`<span>${r.lk}</span>`:''}<span>${fd(r.d)}</span>${n>0?`<span>${n} آية</span>`:''}${r.auto?'<span>تلقائي</span>':''}</div>
 ${r.act.length?`<div class="chips">${r.act.map(k=>`<button class="chip ${r.done.includes(k)?'dn':''}" data-a="ptoggle" data-id="${esc(r.id)}" data-k="${k}" aria-pressed="${r.done.includes(k)}">${r.done.includes(k)?'✓ ':''}${PM[k].t}</button>`).join('')}</div>`:''}
 ${det.length?`<div class="m">${det.join('&nbsp;&nbsp; ')}</div>`:''}${r.n?`<p class="m nt">${esc(r.n)}</p>`:''}
 <div class="acts"><button class="lnk" data-a="delRec" data-id="${esc(r.id)}">🗑 حذف</button></div></div>`}
function vLog(){
 const p=P(),m=ui.month;
 const seg=`<div class="seg2" role="group" aria-label="أقسام السجل"><button class="${ui.lsub==='log'?'on':''}" data-a="lsub" data-v="log" aria-pressed="${ui.lsub==='log'}">السجل</button><button class="${ui.lsub==='sheet'?'on':''}" data-a="lsub" data-v="sheet" aria-pressed="${ui.lsub==='sheet'}">ورقة المتابعة</button><button class="${ui.lsub==='rep'?'on':''}" data-a="lsub" data-v="rep" aria-pressed="${ui.lsub==='rep'}">التقرير</button></div>`;
 const mon=`<div class="card np"><label for="mo">الشهر</label><input type="month" id="mo" value="${esc(m)}" data-c="month"></div>`;
 return seg+mon+(ui.lsub==='rep'?vRep(p,m):ui.lsub==='sheet'?vSheet(p,m):vLogList(p,m))}
function vLogList(p,m){
 const R=p.recs.filter(r=>r.d.startsWith(m)),dys=new Set([...R.map(r=>r.d),...p.act.filter(d=>d.startsWith(m))]);
 const nw=R.filter(r=>r.ty==='new'&&!r.post).reduce((a,r)=>a+Math.max(0,r.b-r.a+1),0);
 const sum=`<div class="card"><div class="k"><div><b>${R.length}</b>تسجيل</div><div><b>${dys.size}</b>يوم متابعة</div><div><b>${nw}</b>آية جديدة</div></div><div class="sep">${qbar(R)}</div></div>`;
 if(!R.length)return sum+'<div class="empty">لا تسجيلات في هذا الشهر.<br>اضغط «سجّل حفظي» لإضافة أول تسجيل.</div>';
 const ord=R.map((r,i)=>[r,i]).sort((x,y)=>y[0].d.localeCompare(x[0].d)||y[1]-x[1]).map(x=>x[0]);let last='',h=sum;
 ord.forEach(r=>{if(r.d!==last){h+=`<h2 class="dh">${fd(r.d)}</h2>`;last=r.d}h+=recCard(r)});return h}
function vRep(p,m){
 const R=p.recs.filter(r=>r.d.startsWith(m)),N=R.filter(r=>r.ty==='new'),M=R.filter(r=>r.ty==='adj'||r.ty==='near'||r.ty==='far'),Q=R.filter(r=>r.ty==='q');
 const c=(a,v)=>a.filter(r=>!!r.post===v).length,nd_=c(N,false),np=c(N,true),md=c(M,false),mp=c(M,true);
 const er=R.reduce((a,r)=>a+r.er,0),ti=R.reduce((a,r)=>a+r.ti,0),dys=new Set([...R.map(r=>r.d),...p.act.filter(d=>d.startsWith(m))]).size;
 const ay=a=>a.filter(r=>!r.post).reduce((x,r)=>x+Math.max(0,r.b-r.a+1),0),qc=v=>R.filter(r=>r.q===v);
 const lbl=r=>nm(r.s)+' ('+(r.a===r.b?r.a:r.a+'–'+r.b)+')',uniq=a=>[...new Set(a.map(lbl))];
 const pend=R.filter(r=>!r.auto&&r.act.length&&r.done.length<r.act.length).length;
 const pc={};R.forEach(r=>r.act.forEach(k=>pc[k]=(pc[k]||0)+1));
 const top=Object.keys(pc).sort((a,b)=>pc[b]-pc[a]).slice(0,3).map(k=>`${PM[k].t} (${pc[k]})`);
 const X=[];
 if(!N.length&&!M.length&&!Q.length)X.push('لا توجد أي تسجيلات هذا الشهر: ابدأ بتسجيل حصصك وحدّد موعدًا ثابتًا للمتابعة.');
 else{
  if(dys<8)X.push(`عدد أيام المتابعة قليل (${dys} يومًا): يُنصح بالانتظام في أربعة أيام أسبوعيًا على الأقل.`);
  if(N.length&&np/N.length>.25)X.push(`نسبة التأجيل في الحفظ الجديد مرتفعة (${Math.round(100*np/N.length)}٪): خفّض المقدار وثبّت ما سبق قبل المتابعة.`);
  if(M.length&&mp/M.length>.25)X.push('تأجيل المراجعة مرتفع: حدّد وقتًا يوميًا ثابتًا للمراجعة.');
  if(N.length&&M.length<N.length)X.push('عدد حصص المراجعة أقل من حصص الحفظ الجديد: زد المراجعة لحماية المحفوظ.');
  if(!M.length&&N.length)X.push('لم تُسجَّل مراجعة هذا الشهر: أضف مراجعة القريب أسبوعيًا على الأقل.');
  if(M.length&&er/M.length>3)X.push(`متوسط الأخطاء في المراجعة مرتفع (${(er/M.length).toFixed(1)} للحصة): ركّز على التثبيت قبل الانتقال لمقطع جديد.`);
  if(qc(0).length)X.push('مقاطع ضعيفة تحتاج إلى إعادة حفظ: '+uniq(qc(0)).join('، ')+'.');
  if(qc(1).length)X.push('مقاطع متوسطة تحتاج إلى تثبيت وربط: '+uniq(qc(1)).join('، ')+'.');
  if(pend)X.push(`لديك ${pend} تسجيل فيه إجراءات تقوية لم تُنفَّذ بعد: أكملها قبل الانتقال لمقطع جديد.`);
  if(!X.length)X.push('أداء منتظم وجيد هذا الشهر: واصل بالوتيرة نفسها ويمكن زيادة الحفظ الجديد تدريجيًا.')}
 const n=memTotal(p);
 return `<div class="ph"><b>التقرير الشهري — ${esc(p.name)} — ${esc(m)}</b></div><div class="card"><div class="t">التقرير الشهري</div>
 <p class="m">المستوى: ${esc(p.level||'—')}، العمر: ${age(p.bd)}، الفئة: <span class="badge">${cat(n)}</span>، المحفوظ: ${n} آية</p>
 <div class="k"><div><b>${dys}</b>أيام المتابعة</div><div><b>${ay(N)}</b>آيات جديدة منجزة</div><div><b>${nd_}/${np}</b>تم / تأجيل (حفظ)</div><div><b>${md}/${mp}</b>تم / تأجيل (مراجعة)</div><div><b>${er}</b>الأخطاء</div><div><b>${ti}</b>التنبيهات</div></div>
 <div class="sep">${qbar(R)}</div>${top.length?`<p class="m">أكثر إجراءات التقوية: ${top.join('، ')}</p>`:''}</div>
 <div class="card"><div class="t">التوصيات</div><ul class="rl">${X.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="sig">اعتماد المشرف: ........................</p></div>
 <button class="big ghost np" data-a="print">🖨 طباعة التقرير</button>`}

/* ---------- الإعدادات ---------- */
function vS(){const ok='Notification' in window&&Notification.permission==='granted',s=S.set,push=s.push&&ok,p=P(),n=memTotal(p);
 return `<div class="card"><div class="t">👤 بيانات المتعلم</div>
 <label for="pf-name">الاسم</label><input id="pf-name" data-c="pf" data-f="name" value="${esc(p.name)}" maxlength="60">
 <div class="two"><div><label for="pf-lv">المستوى الدراسي</label><input id="pf-lv" data-c="pf" data-f="level" value="${esc(p.level)}" list="lv" maxlength="60"></div><div><label for="pf-bd">تاريخ الميلاد</label><input id="pf-bd" type="date" data-c="pf" data-f="bd" value="${esc(p.bd)}"></div></div>
 <label for="pf-bp">مكان الميلاد</label><input id="pf-bp" data-c="pf" data-f="bp" value="${esc(p.bp)}" maxlength="60">
 <datalist id="lv">${LEVELS.map(x=>`<option value="${x}">`).join('')}</datalist>
 <div class="k sep"><div><b>${age(p.bd)}</b>العمر</div><div><b>${n}</b>آية محفوظة</div><div><b>${cat(n)}</b>الفئة</div></div>
 <p class="m hint">الفئة: مبتدئ أقل من 150 آية، متوسط 150، متقدم 600، متقن 2000، وحافظ للقرآن كله عند 6236 آية.</p>
 <div class="acts"><button data-a="newP">＋ متعلم جديد</button><button class="ghost" data-a="delP" ${S.profiles.length<2?'disabled':''}>🗑 حذف المتعلم</button></div></div>
 <div class="card"><div class="t">⚙ إعدادات الحفظ</div><label for="s-lt">هدف التكرار في الحفظ اللساني (30 فأكثر)</label><input id="s-lt" type="number" inputmode="numeric" min="1" value="${LT()}" data-c="set" data-f="lt">
 <label class="ck"><input type="checkbox" data-c="set" data-f="aw" ${s.aw?'checked':''}> انقل السورة المكتملة إلى الورد تلقائيًا</label>
 <label for="s-th">المظهر</label><select id="s-th" data-c="set" data-f="theme"><option value="auto" ${s.theme==='auto'?'selected':''}>حسب الجهاز</option><option value="light" ${s.theme==='light'?'selected':''}>فاتح</option><option value="dark" ${s.theme==='dark'?'selected':''}>داكن</option></select>
 <label for="s-cm">ترقيم الآيات</label><select id="s-cm" data-c="cmode"><option value="hafs" ${s.counts?'':'selected'}>حفص عن عاصم (6236 آية)</option><option value="custom" ${s.counts?'selected':''}>مخصص (مثل رواية ورش)</option></select>
 ${s.counts?`<label for="cnt">أعداد آيات السور الـ 114 بترتيب المصحف</label><textarea id="cnt" rows="4" dir="ltr">${s.counts.join(', ')}</textarea><div class="acts"><button class="ghost" data-a="cntSave">تطبيق الترقيم</button></div><p class="m hint">الصق 114 رقمًا مفصولة بفواصل أو أسطر، من الفاتحة إلى الناس.</p>`:''}</div>
 <div class="card"><div class="t">🔔 التذكير</div><label for="s-hr">وقت التذكير اليومي</label><input id="s-hr" type="time" value="${esc(s.hr)}" data-c="set" data-f="hr">
 <div class="acts"><button data-a="enRm">${ok&&s.rm?'🔔 التذكير مفعّل':'🔔 تفعيل الإشعارات'}</button><button class="ghost" data-a="ics">📆 تذكير في التقويم</button></div>
 <div class="m" style="margin-top:8px">إشعارات المتصفح تعمل عند فتح التطبيق، وفي الخلفية فقط إن سمح بها النظام.</div></div>
 <div class="card"><div class="t">📡 إشعار مضمون من الخادم</div><div class="m">يصلك تنبيه الغفلة في وقت التذكير حتى لو كان التطبيق مغلقًا. يرسل الجهاز للخادم مواعيد المراجعة فقط (تواريخ وأسماء السور)، وتبقى بقية بياناتك على جهازك.</div>
 <div class="acts">${push?'<button class="ghost" data-a="pushOff">🔕 إيقاف</button><button class="ghost" data-a="pushNow">🔄 مزامنة الآن</button>':'<button data-a="pushOn">📡 تفعيل الإشعار المضمون</button>'}</div>${push?'<div class="m" style="margin-top:8px">✔ مفعّل على هذا الجهاز</div>':''}</div>
 <div class="card"><div class="t">💾 نسخة احتياطية</div><div class="m">بياناتك محفوظة في هذا المتصفح فقط، فاحتفظ بنسخة. يقبل الاستيراد نسخ هذا التطبيق ونسخ التطبيقين القديمين.</div>
 <div class="acts"><button class="ghost" data-a="exp">تصدير ملف</button><button class="ghost" data-a="impFile">استيراد ملف</button><button class="ghost" data-a="bkToggle">نسخ/لصق نص</button><input id="f" type="file" accept=".json,.txt" hidden data-c="impfile"></div>
 ${ui.bk?`<textarea id="bkt" rows="6" style="margin-top:10px">${esc(JSON.stringify(S))}</textarea><div class="acts"><button class="ghost" data-a="bkSel">تحديد النص للنسخ</button><button class="ghost" data-a="impText">استيراد من النص</button></div>`:''}</div>
 <div class="card"><button class="big ghost" data-a="go" data-t="m">📘 منهجية المسار وشرح الشاشات</button></div>`}

/* ---------- المنهجية ---------- */
function vM(){return `<div class="card"><div class="t">رحلة المحفوظ</div><div class="flow">📖 عقلي ← 👄 لساني ← 🔁 مراجعة متباعدة ← 📅 ورد أسبوعي</div><p class="m">الحفظ الجديد أول محطة لا آخرها. كل مقطع يمر بأربع مراحل حتى يستقر في ورد ثابت.</p></div>
<div class="card"><div class="t">١) الحفظ العقلي</div><p class="m">تسع تكرارات: ثلاثة استماعات مركّزة لمصحف مجوَّد، ثم ثلاث مرات نظرًا، ثم ثلاث عن ظهر قلب. تتابعها بالأزرار + و − على بطاقة المقطع.</p></div>
<div class="card"><div class="t">٢) الحفظ اللساني</div><p class="m">أكثر من 30 تكرارًا تُثبّت المقطع على اللسان (الهدف قابل للتعديل من ⚙). فإن بقي مقطع في الحفظ 3 أيام دون إتمام عُدّ غفلة.</p></div>
<div class="card"><div class="t">٣) المراجعة المتباعدة</div><p class="m">ثلاث مراجعات: بعد 3 أيام من الحفظ اللساني، ثم بعد 7 أيام من المراجعة الأولى، ثم بعد شهر من الثانية. قيّم كل مراجعة: «متقنة» تنقلك إلى التالية، و«متردد» تُبقيك في مستواك، و«ضعيفة» تُعيد المقطع إلى الحفظ اللساني. بعد الثالثة يصير المقطع «مثبّتًا».</p></div>
<div class="card"><div class="t">٤) الورد الأسبوعي</div><p class="m">تدخل السورة الورد حين تكتمل آياتها وتُثبَّت كل مقاطعها، أو تنقلها بنفسك. تُراجَع كل 7 أيام؛ «متردد» يقرّب موعدها إلى 3 أيام، و«ضعيفة» تعيدها إلى المراجعة المتباعدة. ومن تبويب «الورد ← جدول الأسبوع» يُوزَّع محفوظك على أيام الأسبوع تلقائيًا أو يدويًا مع طباعة الجدول.</p></div>
<div class="card"><div class="t">٥) سجّل حفظي: الكمية والتقييم والتقوية</div><p class="m">زر «سجّل حفظي» يفتح نافذة تُدخل فيها: ما حفظته أو راجعته (السورة والآيات)، ثم تقييمه: متقن أو متردد أو ضعيف. يقترح التطبيق إجراءات تقوية مناسبة للتقييم، وتظهر الإجراءات التي اخترتها في «خطة التقوية» بشاشة اليوم لتعلّمها منجزة. وإن وافق تسجيلك مقطعًا في المسار يمكنك اعتماده مراجعةً له بدل تكرار الإدخال.</p></div>
<div class="card"><div class="t">الغفلة والتذكير والمواضع</div><p class="m">عند وجود غفلة يظهر تنبيه أحمر أعلى كل شاشة، ويسألك التطبيق قبل بدء حفظ جديد وعندك مراجعة متأخرة. سجّل مواضع التردد بزر «＋ موضع» وركّز عليها عند المراجعة. لكل مرحلة مؤقت جلسة، وتعرض شاشة «اليوم» سلسلة أيامك.</p></div>
<div class="card"><div class="t">قاعدة ذهبية</div><p class="m">راجع أولاً ثم احفظ. المراجعة المنتظمة أنفع من كثرة الجديد.</p></div>
<button class="big ghost" data-a="go" data-t="s">رجوع إلى الإعدادات</button>`}

/* ---------- الإطار العام ---------- */
function renderHead(){const p=P(),it=p.items,dn=it.filter(nd),dwk=Object.keys(p.w).filter(wd);
 $('#hname').textContent=p.name;$('#hd').textContent=fd(today());
 $('#hs').innerHTML=`<div><b>${it.filter(inprog).length}</b>قيد الحفظ</div><div><b>${dn.length+dwk.length}</b>مستحقة اليوم</div><div><b>${memTotal(p)}</b>آية محفوظة</div>`}
function render(){
 const p=P(),it=p.items,pg=it.filter(inprog),dn=it.filter(nd),dwk=Object.keys(p.w).filter(wd),k=ui.tab,tk=tasks().length;
 renderHead();
 const tabs=[['today','🏠','اليوم',dn.length+dwk.length+tk],['mem','🧱','الحفظ',pg.length],['near','🔁','المراجعة',dn.length],['w','📅','الورد',dwk.length],['log','📒','السجل',0]];
 $('#nav').innerHTML=tabs.map(t=>`<button class="${k===t[0]?'on':''}" data-a="go" data-t="${t[0]}" ${k===t[0]?'aria-current="page"':''}><b aria-hidden="true">${t[1]}</b>${t[2]}${t[3]?`<em>${t[3]}</em>`:''}</button>`).join('');
 const views={today:vToday,mem:vMem,near:vN,w:vW,log:vLog,m:vM,s:vS};
 $('#app').innerHTML=ban()+(['mem','near','w'].includes(k)?tbar(k):'')+(views[k]||vToday)();
 document.body.dataset.tab=k;
}

/* =====================================================================
   واجهات مساعدة: toast، حوار التأكيد/الإدخال، المظهر
   ===================================================================== */
function toast(t){const e=$('#toast');e.textContent=t;e.className='s';clearTimeout(toast.t);toast.t=setTimeout(()=>e.className='',3200)}
/* بديل confirm/prompt: يُعيد true | false | 'alt' | النص (عند وجود input) */
function ask(o){return new Promise(res=>{
 const d=$('#dg-ask'),i=$('#ask-i'),ok=$('#ask-ok'),alt=$('#ask-alt');
 $('#ask-t').textContent=o.title||'';$('#ask-m').textContent=o.msg||'';
 ok.textContent=o.ok||'تأكيد';ok.className=o.danger?'danger':'';
 alt.hidden=!o.alt;alt.textContent=o.alt||'';$('#ask-no').textContent=o.no||'إلغاء';
 const sl=$('#ask-s'),isSel=!!(o.input&&o.input.type==='select');sl.hidden=!isSel;
 if(isSel){sl.innerHTML=ayOpts(o.input.max,o.input.value||1);i.hidden=true;i.required=false}
 else if(o.input){i.hidden=false;i.required=true;i.type=o.input.type||'text';i.min=o.input.min!=null?o.input.min:'';i.max=o.input.max!=null?o.input.max:'';i.value=o.input.value!=null?o.input.value:'';i.inputMode=o.input.mode||'text'}
 else{i.hidden=true;i.required=false}
 d.returnValue='';
 d.onclose=()=>{const v=d.returnValue;res(v==='ok'?(o.input?(isSel?sl.value:i.value):true):v==='alt'?'alt':(o.input?null:false))};
 d.showModal();if(o.input)setTimeout(()=>(isSel?sl:i).focus(),60)})}
function applyTheme(){const t=S.set.theme,r=document.documentElement;
 if(t==='light'||t==='dark')r.dataset.theme=t;else delete r.dataset.theme;
 const dark=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches),m=$('meta[name=theme-color]');if(m)m.content=dark?'#071512':'#0F3D36'}

/* =====================================================================
   نافذة «سجّل حفظي»: الكمية + التقييم + إجراءات التقوية
   ===================================================================== */
let RF={touched:false,pathTouched:false,spots:new Set()};
function recHtml(d){
 const so=SD.map((x,i)=>`<option value="${i}" ${i===d.s?'selected':''}>${i+1}. ${esc(x[0])} (${x[1]})</option>`).join('');
 const tyr=Object.keys(TYPES).map(k=>`<label class="seg"><input class="vh" type="radio" name="ty" value="${k}" ${k===d.ty?'checked':''}><span>${TYPES[k]}</span></label>`).join('');
 const qr=[[2,'✔','متقن','بلا تلعثم ولا تنبيه'],[1,'〰','متردد','تنبيهات أو أخطاء قليلة'],[0,'✖','ضعيف','أخطاء كثيرة أو نسيان']].map(([v,ic,t,h])=>`<label class="qt q${v}"><input class="vh" type="radio" name="q" value="${v}"><span class="tile"><span class="qi" aria-hidden="true">${ic}</span><b>${t}</b><small>${h}</small></span></label>`).join('');
 const pr=PROCS.map(x=>`<label class="pc" data-p="${x.id}"><input class="vh" type="checkbox" name="pr" value="${x.id}"><span class="pb"><b>${x.t}</b><small>${x.h}</small></span></label>`).join('');
 return `<form id="recf" novalidate>
 <div class="sh-h"><h3 id="rf-title">سجّل حفظي</h3><button type="button" class="x" data-a="dgClose" aria-label="إغلاق">✕</button></div>
 <div class="sh-b">
  <fieldset class="fs"><legend>نوع التسجيل</legend><div class="seg4">${tyr}</div></fieldset>
  <label for="rf-d">التاريخ</label><input type="date" id="rf-d" value="${today()}" max="${today()}">
  <fieldset class="fs"><legend>كمية الحفظ</legend>
   <label for="rf-s">السورة (عدد آياتها)</label><select id="rf-s">${so}</select>
   <div class="two"><div><label for="rf-a">من آية</label><select id="rf-a">${ayOpts(SD[d.s][1],d.a)}</select></div><div><label for="rf-b">إلى آية</label><select id="rf-b">${ayOpts(SD[d.s][1],d.b)}</select></div></div>
   <div class="qk"><button type="button" class="lnk" data-a="rfEnd">إلى آخر السورة</button><button type="button" class="lnk" data-a="rfAll">السورة كاملة</button></div>
   <div id="rf-sum" class="sumline" aria-live="polite"></div>
  </fieldset>
  <fieldset class="fs" id="rf-qbox"><legend>تقييم الحفظ</legend><div class="q3">${qr}</div></fieldset>
  <fieldset class="fs" id="rf-pbox"><legend>إجراءات تقوية الحفظ</legend>
   <p class="m hint" id="rf-sgh"></p>
   <div class="pg">${pr}</div>
   <button type="button" class="ghost sg-btn" id="rf-sgb" data-a="rfSg" hidden>طبّق الإجراءات المقترحة</button>
   <div id="rf-spw" hidden><label for="rf-spsel">مواضع التردد (اختر رقم الآية)</label><div class="two sp"><div style="flex:2"><select id="rf-spsel"></select></div><div><button type="button" class="ghost" style="width:100%" data-a="rfSpAdd">＋ أضف</button></div></div><div class="chips" id="rf-spc"></div></div>
  </fieldset>
  <fieldset class="fs" id="rf-lk" hidden><legend>الربط بمسار الحفظ</legend>
   <div id="rf-new" hidden><label for="rf-path">مسار المقطع</label><select id="rf-path"><option value="none">تسجيل فقط بلا مسار</option><option value="aqli">ابدأ من الحفظ العقلي (9 تكرارات)</option><option value="near">أتممت الحفظ اللساني، ابدأ المراجعة المتباعدة</option></select><div class="m" id="rf-pn"></div></div>
   <label class="ck" id="rf-rev" hidden><input type="checkbox" id="rf-cnt" checked><span id="rf-cl"></span></label>
   <label class="ck" id="rf-rh" hidden><input type="checkbox" id="rf-rhc" checked><span id="rf-rhl"></span></label>
  </fieldset>
  <details class="det"><summary>تفاصيل إضافية</summary>
   <div id="rf-lkw" hidden><label for="rf-kind">نوع الدرس</label><select id="rf-kind">${LK.map(x=>`<option>${x}</option>`).join('')}</select></div>
   <div class="two"><div><label for="rf-er">الأخطاء</label><input type="number" id="rf-er" inputmode="numeric" min="0" value="0"></div><div><label for="rf-ti">التنبيهات</label><input type="number" id="rf-ti" inputmode="numeric" min="0" value="0"></div></div>
   <label for="rf-li">المستمع</label><select id="rf-li"><option value="">—</option><option>الولي</option><option>الأستاذ</option><option>الزميل</option><option>نفسي</option></select>
   <label for="rf-n">ملاحظات</label><textarea id="rf-n" rows="2" maxlength="300"></textarea>
   <label class="ck"><input type="checkbox" id="rf-post"><span>لم يُنجَز (تأجيل)</span></label>
  </details>
 </div>
 <div class="sh-f"><button type="button" data-a="recSave">حفظ التسجيل</button><button type="button" class="ghost" data-a="dgClose">إلغاء</button></div>
 </form>`}
function openRec(pre){pre=pre||{};const p=P(),last=[...p.recs].reverse().find(r=>!r.auto),ty=pre.ty||'new';
 const s=pre.s!=null?pre.s:(last?last.s:ui.sel);let a=1,b=Math.min(SD[s][1],10);
 if(ty==='new'){a=nextFree(s)||1;b=Math.min(limit(s,a),a+4)}
 RF={touched:false,pathTouched:false,spots:new Set()};
 const g=$('#dg-rec');g.innerHTML=recHtml({ty,s,a,b});g.showModal();rfUpdate()}
function rfRead(){const F=$('#recf'),g=n=>F.querySelector(`[name=${n}]:checked`);
 return{ty:g('ty').value,d:$('#rf-d').value,s:+$('#rf-s').value,a:+$('#rf-a').value,b:+$('#rf-b').value,q:g('q')?+g('q').value:null,
  act:$$('[name=pr]:checked',F).map(x=>x.value),post:$('#rf-post').checked,er:num($('#rf-er').value,0,999),ti:num($('#rf-ti').value,0,999),li:$('#rf-li').value,lk:$('#rf-kind').value,n:$('#rf-n').value.trim(),sp:[...RF.spots]}}
function rfMatches(s,a,b){const p=P(),ov=i=>i.s===s&&i.a&&i.a<=b&&i.b>=a,c=covered(s);let cv=false;for(let k=a;k<=b;k++)if(c.has(k)){cv=true;break}
 return{ov:cv,near:p.items.filter(i=>i.stage==='near'&&ov(i)&&nd(i)),reset:p.items.filter(i=>MEM.includes(i.stage)&&ov(i)),wird:(p.w[s]&&a===1&&b===SD[s][1]&&wd(s))?s:null}}
function rfUpdate(e){
 const F=$('#recf');if(!F)return;const t=e&&e.target;let f=rfRead();
 if(t&&t.id==='rf-s'){const n=SD[f.s][1];let a=1,b=Math.min(n,10);if(f.ty==='new'){a=nextFree(f.s)||1;b=Math.min(limit(f.s,a),a+4)}$('#rf-a').innerHTML=ayOpts(n,a);$('#rf-b').innerHTML=ayOpts(n,b)}
 if(t&&t.id==='rf-a'&&+$('#rf-b').value<+$('#rf-a').value)$('#rf-b').value=$('#rf-a').value;
 if(t&&t.name==='pr')RF.touched=true;
 if(t&&t.id==='rf-path')RF.pathTouched=true;
 f=rfRead();
 const n=SD[f.s][1],ok=f.a>=1&&f.b>=f.a&&f.b<=n;

 const sum=$('#rf-sum');sum.textContent=ok?`${nm(f.s)}: ${f.a===f.b?'آية '+f.a:'الآيات '+f.a+' – '+f.b} (${f.b-f.a+1} آية)`:`أدخل مقدارًا صحيحًا بين 1 و ${n}`;sum.classList.toggle('bad',!ok);
 $('#rf-qbox').hidden=f.post;
 const sg=f.post||f.q==null?[]:SUGGEST[f.q];
 if(t&&t.name==='q'&&!RF.touched)$$('[name=pr]',F).forEach(c=>c.checked=f.q<2&&sg.includes(c.value));
 f=rfRead();
 $$('.pc',F).forEach(l=>l.classList.toggle('sg',sg.includes(l.dataset.p)));
 $('#rf-sgb').hidden=!sg.length||sg.every(k=>f.act.includes(k))&&f.act.length===sg.length;
 $('#rf-sgh').textContent=f.post?'':f.q==null?'اختر التقييم ليقترح التطبيق إجراءات مناسبة.':f.q===2?'تقييمك ممتاز: لا حاجة لإجراء. يمكنك اختيار ما يزيده رسوخًا (مميّز بنقطة).':'الإجراءات المقترحة لتقييمك مميّزة بنقطة ذهبية، وقد اخترناها لك.';
 $('#rf-spw').hidden=f.post||!(f.q===0||f.q===1||f.act.includes('spots'));
 $('#rf-lkw').hidden=f.ty!=='new';
 {const sel=$('#rf-spsel'),key=f.s+'-'+f.a+'-'+f.b;
  if(sel.dataset.r!==key){let h='';if(ok)for(let k=f.a;k<=f.b;k++)h+=`<option value="${k}">${k}</option>`;sel.innerHTML=h;sel.dataset.r=key}
  RF.spots=new Set([...RF.spots].filter(v=>v>=f.a&&v<=f.b));
  $('#rf-spc').innerHTML=[...RF.spots].sort((x,y)=>x-y).map(v=>`<button type="button" class="chip dn" data-a="rfSpDel" data-v="${v}" aria-label="حذف الموضع ${v}">${v} ✕</button>`).join('')}
 /* الربط بالمسار */
 const mt=ok?rfMatches(f.s,f.a,f.b):{ov:false,near:[],reset:[],wird:null};
 const showNew=f.ty==='new'&&!f.post&&ok,path=$('#rf-path');
 $('#rf-new').hidden=!showNew;
 if(showNew){
  if(mt.ov){path.value='none';path.disabled=true;$('#rf-pn').textContent='جزء من هذه الآيات موجود في مسارك بالفعل، فيُسجَّل في السجل فقط.'}
  else{if(path.disabled){path.disabled=false;RF.pathTouched=false}
   if(!RF.pathTouched)path.value=f.q==null?'none':f.q===0?'aqli':'near';
   $('#rf-pn').textContent={none:'يُسجَّل في السجل فقط، ولا تُجدول له مراجعات.',aqli:'يبدأ المقطع من الحفظ العقلي (9 تكرارات).',near:'يدخل المراجعة المتباعدة: الأولى بعد 3 أيام.'}[path.value]}}
 const showRev=['adj','near','far','q'].includes(f.ty)&&!f.post&&ok&&f.q!=null&&(mt.near.length>0||mt.wird!=null);
 $('#rf-rev').hidden=!showRev;
 if(showRev){const L=[...mt.near.map(i=>nm(i.s)+' '+rngT(i)),...(mt.wird!=null?['سورة '+nm(mt.wird)+' (الورد)']:[])];
  $('#rf-cl').textContent='اعتمد هذا التقييم مراجعةً مستحقة لـ: '+L.join('، ')+(f.q===0?'. التقييم «ضعيف» يعيدها إلى الحفظ اللساني.':'.')}
 const showRh=f.ty!=='new'&&!f.post&&ok&&f.act.includes('rehifz')&&mt.reset.length>0;
 $('#rf-rh').hidden=!showRh;
 if(showRh)$('#rf-rhl').textContent=`أعد ${mt.reset.length===1?'المقطع':mt.reset.length+' مقاطع'} (${mt.reset.map(i=>nm(i.s)+' '+rngT(i)).join('، ')}) إلى الحفظ اللساني`;
 $('#rf-lk').hidden=$('#rf-new').hidden&&$('#rf-rev').hidden&&$('#rf-rh').hidden}
async function recSave(){
 const f=rfRead(),n=SD[f.s][1];
 if(!isDate(f.d)||f.d>today())return toast('اختر تاريخًا صحيحًا لا يتجاوز اليوم');
 if(!(f.a>=1&&f.b>=f.a&&f.b<=n))return toast(`المقدار غير صحيح: سورة ${nm(f.s)} فيها ${n} آية`);
 if(!f.post&&f.q==null&&f.ty!=='new')return toast('اختر تقييم الحفظ: متقن أو متردد أو ضعيف');
 const mt=rfMatches(f.s,f.a,f.b),p=P(),out=[],path=$('#rf-new').hidden?'none':$('#rf-path').value;
 if(f.ty==='new'&&!f.post&&!mt.ov&&path==='aqli'&&!(await guardLate()))return;
 p.recs.push({id:nid('r'),d:f.d,ty:f.ty,s:f.s,a:f.a,b:f.b,q:f.post?null:f.q,post:f.post?1:0,act:f.post?[]:f.act.slice(),done:[],er:f.er,ti:f.ti,li:f.li,lk:f.ty==='new'?f.lk:'',n:f.n.slice(0,300),auto:0});
 if(f.ty==='new'&&!f.post&&!mt.ov&&(path==='aqli'||path==='near')){startSeg(f.s,f.a,f.b,path,f.d,true);out.push(path==='aqli'?'بدأ مسار الحفظ':'دخل المراجعة المتباعدة')}
 const reset=new Set();
 if(!$('#rf-rh').hidden&&$('#rf-rhc').checked){
  mt.reset.forEach(i=>{i.stage='lisan';i.lisan=0;i.bk=today();i.lv=0;i.tdate=null;i.lastRev=null;reset.add(i)});
  [...new Set(mt.reset.map(i=>i.s))].forEach(s=>{if(p.w[s]){delete p.w[s];p.items.filter(i=>i.s===s&&i.stage==='wird').forEach(i=>i.stage='stable')}});
  out.push('أُعيد '+reset.size+' مقطع إلى الحفظ اللساني')}
 if(!$('#rf-rev').hidden&&$('#rf-cnt').checked&&!f.post&&f.q!=null){
  mt.near.filter(i=>!reset.has(i)).forEach(i=>{revNear(i,f.q,{noRec:true});out.push('حُسبت مراجعة')});
  if(mt.wird!=null&&p.w[mt.wird]){revW(mt.wird,f.q,{noRec:true});out.push('حُسبت مراجعة الورد')}}
 if(!f.post&&(f.act.includes('spots')||f.q===0||f.q===1)){
  const vs=new Set(f.sp.filter(v=>v>=f.a&&v<=f.b));
  vs.forEach(v=>addErrAt(f.s,v));if(vs.size)out.push(vs.size+' موضع تردد')}
 markActive();save();$('#dg-rec').close();
 toast(`سُجّل: ${nm(f.s)} ${f.a===f.b?f.a:f.a+'–'+f.b}${!f.post&&f.q!=null?' ('+QL[f.q]+')':f.post?' (تأجيل)':''}${out.length?' — '+[...new Set(out)].join('، '):''}`);render()}

/* =====================================================================
   المتعلمون (الملفات)
   ===================================================================== */
function openProfiles(){$('#prof-b').innerHTML=S.profiles.map(p=>{const l=lateOf(p).length;
 return `<button class="pitem ${p.id===S.cur?'on':''}" data-a="switchP" data-pid="${esc(p.id)}"><b>${esc(p.name)}</b><small>${memTotal(p)} آية محفوظة${l?'، غفلة '+l:''}</small></button>`}).join('');$('#dg-prof').showModal()}
function switchP(pid){if(!S.profiles.some(p=>p.id===pid))return;S.cur=pid;ui.sel=0;save();$('#dg-prof').close();render()}
async function newP(){const r=await ask({title:'متعلم جديد',msg:'اسم المتعلم',ok:'أضف',input:{type:'text',mode:'text',value:''}});
 const v=(r||'').trim();if(!v)return;const p=newProfile(v.slice(0,60));S.profiles.push(p);S.cur=p.id;ui.sel=0;save();const g=$('#dg-prof');if(g.open)g.close();ui.tab='s';render();toast('أُضيف المتعلم: '+p.name)}
async function delP(){if(S.profiles.length<2)return;const p=P();
 if(!(await ask({title:'حذف المتعلم',msg:`حذف «${p.name}» وكل بياناته؟ لا يمكن التراجع.`,ok:'احذف',danger:true})))return;
 S.profiles=S.profiles.filter(x=>x!==p);S.ses=S.ses.filter(x=>x.p!==p.id);S.cur=S.profiles[0].id;save();render()}

/* =====================================================================
   التذكير والإشعارات
   ===================================================================== */
function ntf(t,b){if('Notification' in window&&Notification.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(r=>r.showNotification(t,{body:b,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'hifz',lang:'ar',dir:'rtl'})).catch(()=>{})}
async function enRm(){if(!('Notification' in window))return toast('المتصفح لا يدعم الإشعارات');if(await Notification.requestPermission()!=='granted')return toast('لم يُمنح إذن الإشعارات');
 S.set.rm=true;save();try{const r=await navigator.serviceWorker.ready;if(r.periodicSync)await r.periodicSync.register('hifz-check',{minInterval:12*36e5})}catch(e){}toast('فُعّل التذكير');render()}
function remind(){const l=late(),n=new Date(),hm=pad(n.getHours())+':'+pad(n.getMinutes());
 if(S.set.rm&&l.length&&S.set.ln!==today()&&hm>=S.set.hr){S.set.ln=today();save();ntf('⚠ غفلة عن المراجعة',l.length+' من محفوظك يحتاج مراجعة: '+l[0].m)}}
const b64u=t=>{const r=atob((t+'='.repeat((4-t.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))};
const pushOk=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const post=b=>fetch('/api/push-sync',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(r=>{if(!r.ok)throw 0});
async function pushSync(){if(!S.set.push||!pushOk()||Notification.permission!=='granted')return;
 try{const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
  if(!sub){const k=await(await fetch('/api/vapid')).json();sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(k.key)})}
  await post({sub:sub.toJSON(),hr:S.set.hr,tz:Intl.DateTimeFormat().resolvedOptions().timeZone,gaps:gaps().map(x=>({d:x.d,m:x.m}))});return true}catch(e){return false}}
let psT;function pushLater(){if(!S.set.push)return;clearTimeout(psT);psT=setTimeout(pushSync,3000)}
async function pushOn(){
 if(!pushOk())return toast('المتصفح لا يدعم Push. على آيفون: أضف التطبيق إلى الشاشة الرئيسية أولًا');
 if(await Notification.requestPermission()!=='granted')return toast('لم يُمنح إذن الإشعارات');
 try{const k=await(await fetch('/api/vapid')).json();if(!k.key)throw 0;
  const reg=await navigator.serviceWorker.ready,old=await reg.pushManager.getSubscription();if(old)await old.unsubscribe();
  await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(k.key)})}
 catch(e){return toast('تعذّر الاشتراك: تأكد من نشر الخادم وضبط مفاتيح VAPID')}
 S.set.push=1;S.set.rm=true;save();toast(await pushSync()?'✅ فُعّل الإشعار المضمون من الخادم':'تعذّرت المزامنة مع الخادم');render()}
async function pushOff(){
 try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(sub){await post({action:'unsub',endpoint:sub.endpoint}).catch(()=>{});await sub.unsubscribe()}}catch(e){}
 S.set.push=0;save();toast('أُلغي إشعار الخادم');render()}

/* =====================================================================
   التصدير والاستيراد والتقويم
   ===================================================================== */
function dl(n,t,m){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([t],{type:m}));a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function ics(){const h=S.set.hr.replace(':',''),d=today().replace(/-/g,'');
 dl('hifz-reminder.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//hifz//AR','BEGIN:VEVENT','UID:hifz-daily@local','DTSTAMP:'+d+'T000000Z','DTSTART:'+d+'T'+h+'00','DURATION:PT15M','RRULE:FREQ=DAILY','SUMMARY:راجع محفوظك - متابعة الحفظ','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:وقت المراجعة','TRIGGER:PT0S','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n'),'text/calendar')}
const exp=()=>{S.set.lb=today();save();dl('hifz-backup-'+today()+'.json',JSON.stringify(S),'application/json');toast('تم تصدير النسخة الاحتياطية');render()};
async function importText(t){let o;try{o=JSON.parse(t)}catch(e){return toast('ملف أو نص غير صالح')}
 const imp=parseImport(o);if(!imp)return toast('النص لا يطابق صيغة نسخة احتياطية معروفة');
 const r=await ask({title:'استيراد البيانات',msg:`سيُستورد: ${imp.profiles.map(p=>p.name).join('، ')}. هل تدمجه مع بياناتك الحالية أم تستبدل بها كل البيانات؟`,ok:'دمج مع الموجود',alt:'استبدال كل البيانات'});
 if(!r)return;
 const ses=(Array.isArray(imp.ses)?imp.ses:[]).filter(x=>x&&isDate(x.d)).map(x=>({d:x.d,k:['mem','near','w'].includes(x.k)?x.k:'mem',s:num(x.s,0,86400),p:x.p}));
 if(r==='alt'){
  if(!(await ask({title:'تأكيد الاستبدال',msg:'سيحذف هذا بيانات الجهاز الحالية. متابعة؟',ok:'استبدل',danger:true})))return;
  if(imp.kind==='B')imp.profiles[0].name='حفظي';
  S.profiles=imp.profiles;S.cur=S.profiles[0].id;
  S.ses=ses.map(x=>Object.assign(x,{p:x.p||S.cur}));
  if(imp.set)S.set=Object.assign({},imp.set,{push:S.set.push,rm:S.set.rm,ln:S.set.ln})}
 else{imp.profiles.forEach(p=>{const i=S.profiles.findIndex(x=>x.id===p.id);i<0?S.profiles.push(p):S.profiles[i]=p});
  if(imp.kind===3)S.ses=S.ses.filter(x=>!imp.profiles.some(p=>p.id===x.p)).concat(ses)}
 applyCounts();applyTheme();save();ui.tab='s';render();toast('تم الاستيراد')}

/* =====================================================================
   الورد اليدوي
   ===================================================================== */
async function seedPlan(){if(!(await ask({title:'نسخ التوزيع التلقائي',msg:'سيستبدل هذا الورد اليدوي الحالي. متابعة؟',ok:'انسخ'})))return;
 const p=P();p.wm={};autoPlan(p).forEach((c,i)=>{p.wm[i]=c});save();render()}
function wadd(i){const s=+$('#ws'+i).value,f=+$('#wf'+i).value,t=+$('#wt'+i).value;
 if(!(f>=1&&t>=f&&t<=SD[s][1]))return toast(`رقم الآية غير صحيح: سورة ${nm(s)} فيها ${SD[s][1]} آية`);
 const p=P();(p.wm[i]=p.wm[i]||[]).push({s,f,t});save();render()}
function wdel(i,j){const p=P();if(p.wm[i]){p.wm[i].splice(j,1);save();render()}}
function cntSave(){const v=(en($('#cnt').value).match(/\d+/g)||[]).map(Number),c=cleanCounts(v);
 if(!c)return toast(`يجب إدخال 114 رقمًا صحيحًا (أدخلت ${v.length})`);S.set.counts=c;applyCounts();save();render();toast('طُبّق ترقيم الآيات المخصص')}


/* =====================================================================
   ورقة «متابعة المحفوظ»: إضافة سطر في المعاهدة أو الدرس الجديد
   ===================================================================== */
async function sheetAdd(k){
 const g=id=>$('#'+k+'-'+id),d=g('d').value,s=+g('s').value,a=+g('a').value,b=+g('b').value,n=SD[s][1],p=P(),out=[];
 if(!isDate(d)||d>today())return toast('اختر تاريخًا صحيحًا لا يتجاوز اليوم');
 if(!(a>=1&&b>=a&&b<=n))return toast('اختر آيات صحيحة: «من» لا تزيد على «إلى»');
 const r={id:nid('r'),d,ty:'new',s,a,b,q:null,post:0,act:[],done:[],er:0,ti:0,li:'',lk:'',n:(g('n').value||'').trim().slice(0,300),auto:0};
 let path='none';
 if(k==='mu'){r.ty=g('ty').value;r.li=g('li').value;r.er=num(g('er').value,0,999);r.ti=num(g('ti').value,0,999)}
 else{r.lk=g('lk').value;r.post=g('st').value==='تأجيل'?1:0;path=r.post?'none':g('path').value;
  if(path!=='none'){const c=covered(s);let ov=false;for(let v=a;v<=b;v++)if(c.has(v)){ov=true;break}
   if(ov){out.push('الآيات موجودة في مسارك بالفعل فسُجّلت دون إضافة');path='none'}
   else if(path==='aqli'&&!(await guardLate()))return}}
 p.recs.push(r);
 if(path==='aqli'||path==='near'){startSeg(s,a,b,path,d,true);out.push(path==='aqli'?'بدأ مسار الحفظ':'دخل المراجعة المتباعدة')}
 markActive();save();toast('أُضيف السطر'+(out.length?' — '+out.join('، '):''));render()}
function printSheet(){const st=document.createElement('style');st.textContent='@page{size:A4 landscape;margin:10mm}';document.head.appendChild(st);document.body.classList.add('ps');
 const done=()=>{st.remove();document.body.classList.remove('ps');removeEventListener('afterprint',done)};addEventListener('afterprint',done);window.print()}

/* =====================================================================
   توزيع الأحداث
   ===================================================================== */
const ACT={
 go:d=>{ui.tab=d.t;render();scrollTo(0,0)},
 jump:d=>{if(S.profiles.some(p=>p.id===d.pid)){S.cur=d.pid;save()}ui.tab=d.t;render();scrollTo(0,0)},
 openRec:()=>openRec(),
 dgClose:(d,b)=>{const g=b.closest('dialog');if(g)g.close()},
 recSave:()=>recSave(),
 rfEnd:()=>{const s=+$('#rf-s').value;$('#rf-b').value=SD[s][1];rfUpdate()},
 rfAll:()=>{const s=+$('#rf-s').value;$('#rf-a').value=1;$('#rf-b').value=SD[s][1];rfUpdate()},
 rfSg:()=>{const q=rfRead().q;if(q==null)return;RF.touched=false;$$('[name=pr]',$('#recf')).forEach(c=>c.checked=SUGGEST[q].includes(c.value));rfUpdate()},
 addSeg:()=>addSeg(),
 cn:d=>cn(d.id,+d.k,+d.d),toL:d=>toL(d.id),lis:d=>lis(d.id,+d.n),toN:d=>toN(d.id),delSeg:d=>delSeg(d.id),
 revNear:d=>{const i=find(d.id);if(!i)return;const m=revNear(i,+d.q);save();toast(m);render()},
 revW:d=>{const s=+d.s;if(!P().w[s])return;const m=revW(s,+d.q);save();toast(m);render()},
 toW:d=>toW(+d.s),addW:()=>addW(),rmW:d=>rmW(+d.s),addErr:d=>addErr(+d.s),delErr:d=>delErr(+d.s,+d.v),
 tgl:d=>tgl(d.k),tmDone:d=>tmDone(d.k),
 ptoggle:d=>ptoggle(d.id,d.k),delRec:d=>delRec(d.id),
 wsub:d=>{ui.wsub=d.v;render()},lsub:d=>{ui.lsub=d.v;render()},
 print:()=>window.print(),
 seedPlan:()=>seedPlan(),wadd:d=>wadd(+d.i),wdel:d=>wdel(+d.i,+d.j),
 profiles:()=>openProfiles(),switchP:d=>switchP(d.pid),newP:()=>newP(),delP:()=>delP(),
 enRm:()=>enRm(),ics:()=>ics(),pushOn:()=>pushOn(),pushOff:()=>pushOff(),pushNow:()=>pushSync().then(o=>toast(o?'تمت المزامنة':'تعذّرت المزامنة')),
 exp:()=>exp(),impFile:()=>$('#f').click(),bkToggle:()=>{ui.bk=!ui.bk;render()},bkSel:()=>{const x=$('#bkt');x.focus();x.select()},impText:()=>importText($('#bkt').value),
 cntSave:()=>cntSave(),sheetAdd:d=>sheetAdd(d.k),printSheet:()=>printSheet(),
 rfSpAdd:()=>{const v=+$('#rf-spsel').value;if(v){RF.spots.add(v);rfUpdate()}},rfSpDel:d=>{RF.spots.delete(+d.v);rfUpdate()}
};
const CHG={
 sel:v=>{ui.sel=+v;render()},
 fixTo:()=>{const a=+$('#a').value,l=limit(ui.sel,a),c=+$('#b').value;$('#b').innerHTML=opts(a,l,c>=a&&c<=l?c:Math.min(l,a+4))},
 tset:(v,d)=>tset(d.k,v),
 month:v=>{if(/^\d{4}-\d{2}$/.test(v)){ui.month=v;render()}},
 pf:(v,d)=>{const p=P();p[d.f]=d.f==='name'?(v.trim().slice(0,60)||p.name):String(v).slice(0,60);save();if(['name','bd'].includes(d.f))render()},
 pw:(v,d)=>{const p=P();p[d.f]=d.f==='wd'?num(v,5,7,7):v;save();render()},
 set:(v,d)=>{const f=d.f;
  if(f==='lt')S.set.lt=num(v,1,999,30);else if(f==='aw')S.set.aw=!!v;else if(f==='theme'){S.set.theme=v;applyTheme()}else if(f==='hr'&&/^\d{2}:\d{2}$/.test(v))S.set.hr=v;
  save();render()},
 cmode:v=>{S.set.counts=v==='custom'?HAFS.slice():null;applyCounts();save();render()},
 ays:(v,d)=>{const s=+v,n=SD[s][1];let a=1,b=Math.min(n,10);if(d.nw==='1'){a=nextFree(s)||1;b=Math.min(limit(s,a),a+4)}$(d.pa).innerHTML=ayOpts(n,a);$(d.pb).innerHTML=ayOpts(n,b)},
 ayf:(v,d)=>{const b=$(d.pb);if(+b.value<+v)b.value=v},
 impfile:(v,d,el)=>{const f=el.files&&el.files[0];if(f)f.text().then(importText);el.value=''}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const f=ACT[b.dataset.a];if(f)f(b.dataset,b,e)});
document.addEventListener('change',e=>{const t=e.target.closest('[data-c]');if(t&&CHG[t.dataset.c])CHG[t.dataset.c](t.type==='checkbox'?t.checked:t.value,t.dataset,t)});
$('#dg-rec').addEventListener('input',rfUpdate);$('#dg-rec').addEventListener('change',rfUpdate);

/* ---------- مؤقتات خلفية ---------- */
setInterval(()=>{Object.keys(S.tm).forEach(k=>{const t=S.tm[k];if(!t.run)return;const s=tsec(k);
 if(k===ui.tab&&$('#tmv'))$('#tmv').textContent=fmt(s);
 if(t.tg&&!t.al&&s>=t.tg*60){t.al=1;save();navigator.vibrate&&navigator.vibrate([200,100,200]);toast('⏰ انتهى وقت الجلسة المحدد');ntf('متابعة الحفظ','انتهى وقت الجلسة المحدد')}})},1000);
setInterval(remind,6e4);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!$('#dg-rec').open)render();remind()}});

/* =====================================================================
   التشغيل
   ===================================================================== */
function registerSW(){
 if(!('serviceWorker' in navigator)||!(location.protocol==='https:'||location.hostname==='localhost'))return;
 let had=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)toast('تم تحديث التطبيق إلى أحدث إصدار');had=true});
 addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
function boot(){
 load();applyCounts();applyTheme();
 const q=new URLSearchParams(location.search);
 if(TABS.includes(q.get('tab')))ui.tab=q.get('tab');
 render();remind();pushSync();
 /* يطلب من المتصفح عدم حذف البيانات تلقائيًا عند ضيق المساحة */
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
 if(MIGRATED)setTimeout(()=>toast('نُقلت بياناتك من التطبيقين السابقين إلى التطبيق الموحّد'),500);
 if(q.get('add')==='1'||q.has('tab'))history.replaceState(null,'',location.pathname);
 if(q.get('add')==='1')setTimeout(()=>openRec(),200);
 registerSW()}
boot();
