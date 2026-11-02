/* Большая офлайн-база фильмов и сериалов: загрузка кусками в IndexedDB, подключение к приложению */
(function(){
if(window.claude)return;
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
var DB='moy_vkus_base',ST='kv',meta=null,rows=null,busy=false,msg='',kind='';
function idb(){return new Promise(function(res,rej){try{var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){r.result.createObjectStore(ST)};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}})}
function get(db,k){return new Promise(function(res,rej){var q=db.transaction(ST).objectStore(ST).get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}
function put(db,k,v){return new Promise(function(res,rej){var t=db.transaction(ST,'readwrite');t.objectStore(ST).put(v,k);t.oncomplete=function(){res()};t.onerror=function(){rej(t.error)}})}
function clearAll(db){return new Promise(function(res,rej){var t=db.transaction(ST,'readwrite');t.objectStore(ST).clear();t.oncomplete=function(){res()};t.onerror=function(){rej(t.error)}})}
function fj(u){return fetch(u,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function setMsg(t,k){msg=t;kind=k||'';var e=document.getElementById('bsmsg');if(e){e.className='m '+(k==='ok'?'syok':k==='err'?'syerr':k==='busy'?'sybusy':'');e.textContent='';if(k==='busy'){var sp=document.createElement('span');sp.className='spin';e.appendChild(sp)}e.appendChild(document.createTextNode(t))}}
function activate(all){var r=[];all.forEach(function(c){for(var i=0;i<c.length;i++)r.push(c[i])});rows=r;window.BASE_ROWS=r;try{REF=null}catch(e){}try{render()}catch(e){}}
function ready(){return !!rows}
/* прочитать из хранилища; если чего-то нет, докачать */
function sync(force,explicit){if(busy)return Promise.resolve();busy=true;lock(true);var db=null,all=[],downloaded=0,putFail=false,upToDate=false,hadFlag=false;try{hadFlag=localStorage.getItem('moy_vkus_base_ok')==='1'}catch(e){}
 return idb().catch(function(){return null}).then(function(d){db=d;return d?get(d,'meta'):null}).catch(function(){return null}).then(function(sm){
  var online=navigator.onLine!==false;
  var p=(online?fj('base/meta.json').catch(function(){return null}):Promise.resolve(null));
  return p.then(function(rm){var m=rm||sm;if(!m){throw new Error('Нет связи. База ещё не загружена.')}
   var upd=rm&&(!sm||sm.built!==rm.built||sm.n!==rm.n||sm.v!==rm.v);if(force||upd){return db?clearAll(db).then(function(){return m}):m}return m})})
 .then(function(m){meta=m;var i=0;function next(){if(i>=m.chunks)return Promise.resolve();var k='c'+i;
   return (db?get(db,k):Promise.resolve(null)).catch(function(){return null}).then(function(c){
    if(c){all[i]=c;i++;return next()}
    if(navigator.onLine===false)throw new Error('Нет связи: база загружена не полностью ('+i+' из '+m.chunks+' частей). Докачается, когда появится интернет.');
    downloaded++;setMsg('Загружаю базу… часть '+(i+1)+' из '+m.chunks,'busy');
    return fj('base/b'+i+'.json').then(function(c){all[i]=c;return db?put(db,k,c).catch(function(){putFail=true}):(putFail=true)}).then(function(){i++;return next()})})}
   return next().then(function(){return db&&!putFail?put(db,'meta',m).catch(function(){putFail=true}):0})})
 .then(function(){activate(all);try{if(!putFail)localStorage.setItem('moy_vkus_base_ok','1')}catch(e){}var info=rows.length.toLocaleString('ru-RU')+' произведений, версия от '+(meta&&meta.built||'?');
   if(putFail)setMsg('⚠️ База загружена ('+info+'), но устройство не даёт её сохранить (мало места или запрет браузера). Она будет скачиваться при каждом запуске, офлайн не заработает.','err');
   else if(downloaded)setMsg('✅ База загружена: '+info+'. Работает без интернета.'+(hadFlag&&!force&&!explicit?' (Система очистила прошлую копию, поэтому загрузил заново.)':''),'ok');
   else setMsg('✅ '+(explicit?'Установлена последняя версия базы: ':'База готова: ')+info+'. Работает без интернета.','ok')},function(e){
   var got=all.filter(Boolean);if(got.length&&!rows){activate(got);setMsg('⚠️ Загружена часть базы ('+rows.length.toLocaleString('ru-RU')+' самых известных). '+(e&&e.message||''),'err')}else setMsg('⚠️ '+(e&&e.message||'Не удалось загрузить базу'),'err')})
 .then(function(){busy=false;lock(false)})}
function lock(b){['bsgo','bsre'].forEach(function(id){var x=document.getElementById(id);if(x)x.disabled=b})}
function ui(){var d=document.getElementById('s-data');if(!d||document.getElementById('bscard'))return;var c=document.createElement('div');c.className='c';c.id='bscard';
 c.innerHTML='<h2>Офлайн-база фильмов и сериалов</h2><div class="m">Около 50 тысяч самых известных фильмов, сериалов, мультфильмов и аниме с жанрами, режиссёрами, актёрами и русскими названиями. Один раз загружается по интернету (около 12 МБ), потом хранится на устройстве и работает без связи. Используется в «Свайпе» и «Коллекции».</div><div class="row"><button id="bsgo">Проверить обновление</button><button id="bsre">Загрузить заново</button></div><div class="m" id="bsmsg"></div>';
 var sc=document.getElementById('sycard');if(sc&&sc.nextSibling)d.insertBefore(c,sc.nextSibling);else d.insertBefore(c,d.firstChild);
 document.getElementById('bsgo').onclick=function(){if(navigator.onLine===false){setMsg('Нет связи: проверить обновление не получится.','err');return}sync(false,true)};
 document.getElementById('bsre').onclick=function(){if(confirm('Стереть базу на устройстве и скачать заново (около 12 МБ)?'))sync(true,true)};if(msg)setMsg(msg,kind)}
ui();
window.addEventListener('online',function(){if(!ready())sync(false)});
setTimeout(function(){sync(false)},300);
window.VKBASE={ready:ready};
})();
