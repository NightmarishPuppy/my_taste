/* Интеграция с TMDB: постеры, описания на русском, трейлеры, точная разметка аниме.
   Ключ хранится только на этом устройстве (localStorage), никуда не отправляется, кроме запросов к TMDB. */
(function(){
if(window.claude)return;
var KK='moy_vkus_tmdb',API='https://api.themoviedb.org/3',IMG='https://image.tmdb.org/t/p/',MAXIMG=250,TTL_OK=90*864e5,TTL_NO=14*864e5;
var key='',db=null,mem={},inflight={},bad=false,msgT='',msgK='';
try{key=localStorage.getItem(KK)||''}catch(e){}
function idb(){if(db)return Promise.resolve(db);return new Promise(function(res,rej){try{var r=indexedDB.open('moy_vkus_tmdb',1);r.onupgradeneeded=function(){var d=r.result;d.createObjectStore('tm');d.createObjectStore('img')};r.onsuccess=function(){db=r.result;res(db)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}})}
function gt(st,k){return idb().then(function(d){return new Promise(function(res,rej){var q=d.transaction(st).objectStore(st).get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}).catch(function(){return undefined})}
function pt(st,k,v){return idb().then(function(d){return new Promise(function(res){var t=d.transaction(st,'readwrite');t.objectStore(st).put(v,k);t.oncomplete=function(){res()};t.onerror=function(){res()}})}).catch(function(){})}
function cnt(st){return idb().then(function(d){return new Promise(function(res){var q=d.transaction(st).objectStore(st).count();q.onsuccess=function(){res(q.result)};q.onerror=function(){res(0)}})}).catch(function(){return 0})}
function clr(){return idb().then(function(d){return new Promise(function(res){var t=d.transaction(['tm','img'],'readwrite');t.objectStore('tm').clear();t.objectStore('img').clear();t.oncomplete=function(){res()};t.onerror=function(){res()}})}).catch(function(){})}
function trimImg(){return idb().then(function(d){return new Promise(function(res){var os=d.transaction('img').objectStore('img'),all=[];var c=os.openCursor();c.onsuccess=function(){var cur=c.result;if(cur){all.push([cur.key,cur.value.ts||0]);cur.continue()}else{if(all.length<=MAXIMG){res();return}all.sort(function(a,b){return a[1]-b[1]});var t=d.transaction('img','readwrite'),o=t.objectStore('img');all.slice(0,all.length-MAXIMG+20).forEach(function(z){o.delete(z[0])});t.oncomplete=function(){res()};t.onerror=function(){res()}}};c.onerror=function(){res()}})}).catch(function(){})}
function norm2(s){return String(s||'').toLowerCase().replace(/[^a-zа-яё0-9]+/g,' ').trim()}
function api(path,params){var u=API+path+'?api_key='+encodeURIComponent(key);for(var k in params)u+='&'+k+'='+encodeURIComponent(params[k]);
 return fetch(u).then(function(r){if(r.status===401){bad=true;status('⚠️ Ключ TMDB не принят (401). Проверьте ключ на вкладке «Данные».','err');throw new Error('401')}if(r.status===429)throw new Error('429');if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function yr(d){return d?+String(d).slice(0,4):0}
function pickKind(type){return type==='Сериал'?['tv','movie']:(type==='Фильм'?['movie','tv']:['movie','tv'])}
function details(kind,id){return api('/'+kind+'/'+id,{language:'ru-RU',append_to_response:'videos',include_video_language:'ru,en,null'}).then(function(j){
 var vs=(j.videos&&j.videos.results||[]).filter(function(v){return v.site==='YouTube'});
 var tr=vs.filter(function(v){return v.type==='Trailer'}).sort(function(a,b){return (b.iso_639_1==='ru')-(a.iso_639_1==='ru')||(b.official?1:0)-(a.official?1:0)})[0]||vs.filter(function(v){return v.type==='Teaser'})[0];
 return{k:kind,id:j.id,ti:j.title||j.name||'',ot:j.original_title||j.original_name||'',ov:j.overview||'',po:j.poster_path||'',ol:j.original_language||'',g:(j.genres||[]).map(function(x){return x.id}),tr:tr?tr.key:'',ts:Date.now()}})}
function lookup(x){var title=x.n||x.t||'',y=+x.y||0,kinds=pickKind(x.type);
 if(x.imdb){var id='tt'+('0000000'+x.imdb).slice(-7);return api('/find/'+id,{external_source:'imdb_id',language:'ru-RU'}).then(function(j){
   var order=kinds.map(function(k){return[k,(j[k+'_results']||[])[0]]}).filter(function(z){return z[1]})[0];if(!order)return null;return details(order[0],order[1].id)})}
 var i=0;function tryKind(){if(i>=kinds.length)return Promise.resolve(null);var k=kinds[i++],p={query:title,language:'ru-RU'};if(y)p[k==='tv'?'first_air_date_year':'year']=y;
  return api('/search/'+k,p).then(function(j){var rs=j.results||[];var m=rs.filter(function(r){var ry=yr(r.release_date||r.first_air_date);return(!y||Math.abs(ry-y)<=1)&&(norm2(r.original_title||r.original_name)===norm2(title)||norm2(r.title||r.name)===norm2(title)||rs.length===1||r===rs[0])})[0];
   return m?details(k,m.id):tryKind()})}
 return tryKind()}
function get(x){if(!key||bad)return Promise.resolve(null);var ck=x.imdb?'i'+x.imdb:'s|'+norm2(x.n||x.t)+'|'+(x.y||'')+'|'+(x.type==='Сериал'?'tv':'m');
 if(mem[ck]!==undefined)return Promise.resolve(mem[ck]);if(inflight[ck])return inflight[ck];
 var p=gt('tm',ck).then(function(c){var now=Date.now();if(c&&(c.no?now-c.ts<TTL_NO:now-c.ts<TTL_OK)){mem[ck]=c.no?null:c;return mem[ck]}
  if(navigator.onLine===false){mem[ck]=c&&!c.no?c:null;return mem[ck]}
  return lookup(x).then(function(r){mem[ck]=r;return pt('tm',ck,r||{no:1,ts:Date.now()}).then(function(){return r})},function(e){return c&&!c.no?c:null})}).then(function(r){delete inflight[ck];return r},function(){delete inflight[ck];return null});
 inflight[ck]=p;return p}
/* картинки: храним копию на устройстве, чтобы показывались без интернета */
var urls={};
function imgSrc(po,w){var u=IMG+(w||'w342')+po;if(urls[u])return Promise.resolve(urls[u]);
 return gt('img',u).then(function(c){if(c&&c.b){return urls[u]=URL.createObjectURL(c.b)}
  if(navigator.onLine===false)return null;
  return fetch(u,{mode:'cors'}).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){pt('img',u,{b:b,ts:Date.now()}).then(trimImg);return urls[u]=URL.createObjectURL(b)}).catch(function(){return u})})}
function typeFix(x,r){if(r&&r.ol==='ja'&&r.g.indexOf(16)>-1&&x.type==='Мультфильм / мультсериал'){x.type='Аниме';return true}
 if(r&&r.g.indexOf(16)>-1&&r.ol&&r.ol!=='ja'&&x.type==='Аниме'){x.type='Мультфильм / мультсериал';return true}return false}
function decorate(el,x,mode){if(!key||bad||!el)return;var tk={n:x.n||x.t,t:x.t,y:x.y,type:x.type,imdb:x.imdb};
 get(tk).then(function(r){if(!r||!el.isConnected)return;
  if(x.type!==undefined&&typeFix(x,r)){var ty=el.querySelector('.ty');if(ty&&/мульт/i.test(ty.textContent))ty.textContent='аниме'}
  var box=document.createElement('div');box.className='tmx';box.style.cssText='display:flex;gap:12px;align-items:flex-start;margin:8px 0;text-align:left';
  var right=document.createElement('div');right.style.cssText='flex:1;min-width:0';
  var bits=[];if(r.ti&&norm2(r.ti)!==norm2(x.n||x.t)&&!x.ru)bits.push('<div class="m" style="margin:0 0 4px"><b>'+esc(r.ti)+'</b></div>');
  if(r.ov)bits.push('<div class="m" style="margin:0 0 6px">'+esc(r.ov.length>420?r.ov.slice(0,417)+'…':r.ov)+'</div>');
  if(r.tr)bits.push('<div class="m" style="margin:0"><a href="https://www.youtube.com/watch?v='+esc(r.tr)+'" target="_blank" rel="noopener noreferrer">▶ Трейлер на YouTube</a></div>');
  right.innerHTML=bits.join('');
  var done=function(src){if(src){var im=document.createElement('img');im.alt='';im.draggable=false;im.src=src;im.style.cssText='width:96px;max-width:30%;border-radius:8px;flex:none;pointer-events:none;-webkit-user-drag:none;background:var(--bd)';box.appendChild(im)}
   box.appendChild(right);if(!src&&!bits.length)return;
   if(mode==='sw'){var t=el.querySelector('b'),at=t;if(t&&t.nextElementSibling&&/по-русски/.test(t.nextElementSibling.textContent))at=t.nextElementSibling;if(at&&at.parentNode)at.parentNode.insertBefore(box,at.nextSibling);else el.appendChild(box)}
   else{var gb=el.querySelector('.gb')||el;gb.insertBefore(box,gb.children[1]||null)}};
  if(r.po)imgSrc(r.po).then(done);else done(null)}).catch(function(){})}
function prefetch(list){if(!key||bad)return;(list||[]).forEach(function(x){if(x&&x.k==='work'){get({n:x.n,t:x.n,y:x.y,type:x.type,imdb:x.imdb}).then(function(r){if(r&&r.po)imgSrc(r.po)})}})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* карточка настроек */
function status(t,k){msgT=t;msgK=k||'';var e=document.getElementById('tmmsg');if(!e)return;e.className='m '+(k==='ok'?'syok':k==='err'?'syerr':'');e.textContent=t}
function counts(){cnt('tm').then(function(a){cnt('img').then(function(b){var e=document.getElementById('tmcnt');if(e)e.textContent='В памяти устройства: описаний '+a+', постеров '+b+' (максимум '+MAXIMG+').'})})}
function ui(){var d=document.getElementById('s-data');if(!d||document.getElementById('tmcard'))return;var c=document.createElement('div');c.className='c';c.id='tmcard';
 c.innerHTML='<h2>Постеры и описания (TMDB)</h2><div class="m">Подгружает постеры, описания на русском и трейлеры, уточняет аниме. Нужен бесплатный ключ TMDB (API Key). Ключ хранится только на этом устройстве и не попадает в синхронизацию.</div><input id="tmkey" type="password" placeholder="Ключ TMDB (API Key)" autocapitalize="off" autocorrect="off" spellcheck="false"><div class="row"><button class="pri" id="tmsave">Сохранить и проверить</button><button id="tmdel">Удалить ключ</button><button id="tmclr">Очистить память постеров</button></div><div class="m" id="tmmsg"></div><div class="m" id="tmcnt"></div><div class="m" style="font-size:12px">This product uses the TMDB API but is not endorsed or certified by TMDB. Данные о фильмах: The Movie Database (themoviedb.org).</div>';
 d.insertBefore(c,document.getElementById('bscard')?document.getElementById('bscard').nextSibling:d.firstChild);
 var inp=document.getElementById('tmkey');inp.value=key?'••••••••••••':'';
 document.getElementById('tmsave').onclick=function(){var v=inp.value.trim();if(v&&v.charAt(0)!=='•')key=v;if(!key){status('Вставьте ключ','err');return}status('Проверяю ключ…','');bad=false;
  fetch(API+'/configuration?api_key='+encodeURIComponent(key)).then(function(r){if(r.status===401)throw new Error('401');if(!r.ok)throw new Error('HTTP '+r.status);try{localStorage.setItem(KK,key)}catch(e){}inp.value='••••••••••••';mem={};status('✅ Ключ принят. Постеры и описания появятся на карточках.','ok');try{render()}catch(e){}},function(){throw new Error('net')}).catch(function(e){if(e.message==='401'){key='';status('⚠️ Ключ не принят. Проверьте, что это «API Key» (не «Read Access Token»).','err')}else if(e.message==='net'){status('⚠️ Нет связи с TMDB. Проверьте интернет (возможно, нужен VPN).','err')}else status('⚠️ TMDB ответил ошибкой: '+e.message,'err')})};
 document.getElementById('tmdel').onclick=function(){key='';bad=false;mem={};try{localStorage.removeItem(KK)}catch(e){}inp.value='';status('Ключ удалён','')};
 document.getElementById('tmclr').onclick=function(){clr().then(function(){mem={};urls={};status('Память постеров очищена','ok');counts()})};
 if(msgT)status(msgT,msgK);else if(key)status('Ключ сохранён.','ok');counts()}
ui();
window.TMDB={decorate:decorate,prefetch:prefetch,has:function(){return !!key&&!bad}};
})();
