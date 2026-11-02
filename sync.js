/* Синхронизация оценок с закрытым репозиторием GitHub (файл data.json).
   Правила: менялось только у меня -> отправляем; менялось только на GitHub -> забираем;
   менялось и там и тут -> объединяем (ничего не теряется) и отправляем. */
(function(){
if(window.claude)return;
// сохранение резервного файла: вне Claude делаем обычное скачивание
try{DL={save:function(o){return new Promise(function(res){var b=new Blob([o.data],{type:'application/json'}),a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=o.filename;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove()},5000);res()})}};var ds=document.getElementById('dsave');if(ds)ds.style.display=''}catch(e){} // внутри Claude внешние запросы запрещены
var css=document.createElement('style');css.textContent='.syok{color:#1b7f37!important;font-weight:600}.syerr{color:var(--red)!important;font-weight:600}.sybusy{color:var(--mut)}@media(prefers-color-scheme:dark){.syok{color:#6fdc8c!important}}#sytoast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translate(-50%,30px);padding:12px 18px;border-radius:24px;background:#1b7f37;color:#fff;font-weight:600;opacity:0;transition:opacity .25s,transform .25s;z-index:9999;pointer-events:none;max-width:90vw;text-align:center}#sytoast.on{opacity:1;transform:translate(-50%,0)}#sytoast.err{background:#b3261e}.spin{display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:sps .7s linear infinite;vertical-align:-2px;margin-right:6px}@keyframes sps{to{transform:rotate(360deg)}}';document.head.appendChild(css);
var toastT=null;function toast(t,err){var e=document.getElementById('sytoast');if(!e){e=document.createElement('div');e.id='sytoast';document.body.appendChild(e)}e.textContent=t;e.className=(err?'err ':'')+'on';clearTimeout(toastT);toastT=setTimeout(function(){e.className=''},2800)}
var SK='moy_vkus_sync',SY={repo:'',token:'',sha:'',dirty:0,last:0},busy=false,again=false,manual=false,lastMsg='',timer=null,applying=false,lastTry=0,status='',statusErr=false;
function ld(){try{var o=JSON.parse(localStorage.getItem(SK));if(o&&typeof o==='object')SY={repo:o.repo||'',token:o.token||'',sha:o.sha||'',dirty:+o.dirty||0,last:+o.last||0}}catch(e){}}
function sv(){try{localStorage.setItem(SK,JSON.stringify(SY))}catch(e){}}
function on(){return !!(SY.repo&&SY.token)}
function api(path,opt){opt=opt||{};opt.headers={'Authorization':'Bearer '+SY.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 return fetch('https://api.github.com/repos/'+SY.repo+path,opt)}
function u8b64(str){var a=new TextEncoder().encode(str),s='';for(var i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)}
function b64u8(b){var s=atob(b.replace(/\s+/g,'')),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return new TextDecoder().decode(a)}
function E(code,msg){var e=new Error(msg||code);e.code=code;return e}
function http(r){if(r.status===401)throw E('auth','Токен не подошёл или истёк. Создайте новый токен и вставьте его заново.');
 if(r.status===403)throw E('auth','GitHub отказал в доступе (403). Проверьте права токена: Contents → Read and write.');
 if(r.status===404)throw E('nf','Репозиторий не найден. Проверьте имя вида ИМЯ/РЕПОЗИТОРИЙ и что токен выдан именно для него.');
 return r}
function getRemote(){return api('/contents/data.json?t='+Date.now()).then(function(r){if(r.status===404){return api('').then(function(x){http(x);return null})}http(r);if(!r.ok)throw E('http','GitHub вернул ошибку '+r.status);return r.json()}).then(function(j){
  if(!j)return null;if(j.content)return{sha:j.sha,text:b64u8(j.content)};
  return api('/git/blobs/'+j.sha).then(function(r){http(r);return r.json()}).then(function(b){return{sha:j.sha,text:b64u8(b.content)}})})}
function putRemote(sha){var body={message:'sync '+new Date().toISOString(),content:u8b64(JSON.stringify(S))};if(sha)body.sha=sha;
 return api('/contents/data.json',{method:'PUT',body:JSON.stringify(body)}).then(function(r){if(r.status===409||r.status===422)throw E('conf','conflict');http(r);if(!r.ok)throw E('http','GitHub вернул ошибку '+r.status);return r.json()}).then(function(j){return j.content.sha})}
function empty(){return !(S.items&&S.items.length)&&!(S.coll&&S.coll.length)&&!(S.ppl&&Object.keys(S.ppl).length)}
function replaceWith(d){var o={items:d.items.filter(valid)};if(d.prof&&typeof d.prof==='object')o.prof=d.prof;if(d.uscore&&typeof d.uscore==='object')o.uscore=d.uscore;if(d.ppl&&typeof d.ppl==='object')o.ppl=d.ppl;if(d.off)o.off=d.off;if(Array.isArray(d.coll))o.coll=d.coll;S=o;offered=Array.isArray(S.off)?S.off.slice():[]}
function mergeIn(d){if(d.ppl&&typeof d.ppl==='object'){if(!S.ppl)S.ppl={};Object.keys(d.ppl).forEach(function(k){if(!S.ppl[k])S.ppl[k]=d.ppl[k]})}
 if(d.uscore&&typeof d.uscore==='object'){if(!S.uscore)S.uscore={};Object.keys(d.uscore).forEach(function(k){S.uscore[k]=Math.max(us(k),+d.uscore[k]||0)})}
 if(d.prof&&typeof d.prof==='object'&&!(S.prof&&(S.prof.done||Object.keys(S.prof.g||{}).length)))S.prof=d.prof;
 if(Array.isArray(d.off)){d.off.forEach(function(z){if(offered.indexOf(z)<0)offered.push(z)})}
 if(Array.isArray(d.coll)){var cks={};collArr().forEach(function(z){cks[ckey(z)]=1});d.coll.forEach(function(z){if(z&&z.t&&!cks[ckey(z)]){S.coll.push(z);cks[ckey(z)]=1}})}
 var ids={},keys={};S.items.forEach(function(x){ids[x.id]=1;keys[kk(x)]=1});d.items.forEach(function(x){if(valid(x)&&!ids[x.id]&&!keys[kk(x)]){S.items.push(x);ids[x.id]=1;keys[kk(x)]=1}})}
function applied(){applying=true;try{save()}finally{applying=false}try{render()}catch(e){}}
function run(){return getRemote().then(function(rm){
  if(!rm){return putRemote('').then(function(sha){SY.sha=sha;SY.dirty=0;return'Создан файл на GitHub'})}
  var d;try{d=JSON.parse(rm.text)}catch(e){throw E('bad','Файл data.json на GitHub повреждён или не является данными программы.')}
  if(!d||!Array.isArray(d.items))throw E('bad','Файл data.json на GitHub не похож на данные программы.');
  if(rm.sha===SY.sha){if(SY.dirty>0)return putRemote(rm.sha).then(function(sha){SY.sha=sha;SY.dirty=0;return'Отправлено'});return'Без изменений'}
  if(empty()||(SY.dirty===0&&SY.sha)){replaceWith(d);applied();SY.sha=rm.sha;SY.dirty=0;return'Загружено с GitHub'}
  mergeIn(d);applied();return putRemote(rm.sha).then(function(sha){SY.sha=sha;SY.dirty=0;return'Объединено и отправлено'})})}
function sync(force,man){if(!on())return Promise.resolve();if(busy){again=true;if(man)manual=true;return Promise.resolve()}manual=!!man;
 if(!force&&Date.now()-lastTry<20000)return Promise.resolve();lastTry=Date.now();busy=true;setSt('Синхронизация…','busy');lock(true);
 return run().catch(function(e){if(e&&e.code==='conf')return run();throw e}).then(function(m){SY.last=Date.now();sv();try{didBackup()}catch(e){}var tm=new Date(SY.last).toLocaleTimeString('ru-RU'),same=(m==='Без изменений');if(!same)lastMsg=m+' в '+tm;setSt('✅ '+(same?'Подключено, всё актуально ('+tm+')'+(lastMsg?'. Последнее: '+lastMsg:''):m+' ('+tm+')'),'ok');if(!same||manual)toast('✅ '+(same?'Всё синхронизировано':m),false)},function(e){sv();var off=!(e&&e.code);var em=off?'Нет связи с GitHub. Данные сохранены на этом устройстве и отправятся позже.':e.message;setSt('⚠️ '+em,'err');if(manual||!off)toast('⚠️ '+(off?'Нет связи с GitHub':'Ошибка синхронизации'),true)}).then(function(){busy=false;lock(false);if(again){again=false;sync(false)}})}
function touch(){if(applying||!on())return;SY.dirty++;sv();clearTimeout(timer);timer=setTimeout(function(){sync(true)},4000)}
var _save=save;save=function(){var r=_save.apply(this,arguments);touch();return r};
function setSt(t,k){status=t;statusErr=k;var e=document.getElementById('syst');if(!e)return;e.className='m '+(k==='ok'?'syok':k==='err'?'syerr':k==='busy'?'sybusy':'');e.textContent='';if(k==='busy'){var sp=document.createElement('span');sp.className='spin';e.appendChild(sp)}e.appendChild(document.createTextNode(t))}
function lock(b){['sygo','synow'].forEach(function(id){var x=document.getElementById(id);if(x)x.disabled=b})}
function ui(){var d=document.getElementById('s-data');if(!d||document.getElementById('sycard'))return;var c=document.createElement('div');c.className='c';c.id='sycard';
 c.innerHTML='<h2>Синхронизация с GitHub</h2><div class="m">Оценки автоматически сохраняются в вашем закрытом репозитории и подтягиваются на другом устройстве. Если данные на устройстве пропали, достаточно снова ввести токен.</div>'
 +'<div class="m">Репозиторий с данными (ИМЯ/РЕПОЗИТОРИЙ):</div><input id="syrepo" placeholder="NightmarishPuppy/my_taste_private" autocapitalize="off" autocorrect="off" spellcheck="false">'
 +'<div class="m">Токен доступа:</div><input id="sytok" type="password" placeholder="github_pat_…" autocapitalize="off" autocorrect="off" spellcheck="false">'
 +'<div class="row"><button class="pri" id="sygo">Подключить и синхронизировать</button><button id="synow">Синхронизировать сейчас</button><button id="syoff">Отключить</button></div><div class="m" id="syst"></div>';
 d.insertBefore(c,d.firstChild);
 var r=document.getElementById('syrepo'),t=document.getElementById('sytok');r.value=SY.repo;t.value=SY.token?'••••••••':'';
 document.getElementById('sygo').onclick=function(){var rv=r.value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\/+$/,''),tv=t.value.trim();if(!/^[\w.-]+\/[\w.-]+$/.test(rv)){setSt('Введите имя репозитория в виде ИМЯ/РЕПОЗИТОРИЙ','err');return}
  if(tv&&tv!=='••••••••')SY.token=tv;if(!SY.token){setSt('Вставьте токен','err');return}
  if(SY.repo!==rv){SY.sha=''}SY.repo=rv;if(!SY.sha)SY.dirty=Math.max(SY.dirty,1);sv();t.value='••••••••';sync(true,true)};
 document.getElementById('synow').onclick=function(){if(!on()){setSt('Сначала подключите репозиторий','err');return}sync(true,true)};
 document.getElementById('syoff').onclick=function(){if(!confirm('Отключить синхронизацию? Данные на устройстве и на GitHub останутся.'))return;SY={repo:'',token:'',sha:'',dirty:0,last:0};sv();r.value='';t.value='';setSt('Синхронизация отключена','')};
 if(status)setSt(status,statusErr);else if(on()&&SY.last)setSt('✅ Подключено. Последняя синхронизация: '+new Date(SY.last).toLocaleString('ru-RU'),'ok')}
ld();ui();
document.addEventListener('visibilitychange',function(){if(!document.hidden)sync(false)});
window.addEventListener('online',function(){sync(true)});
setTimeout(function(){sync(true)},800);
})();
