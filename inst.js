/* Кнопка «Установить приложение» с инструкциями под устройство */
(function(){
if(window.claude)return;
var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
var ua=navigator.userAgent||'',pf=navigator.platform||'',touch=navigator.maxTouchPoints>1;
var iOS=/iPhone|iPad|iPod/.test(ua)||(pf==='MacIntel'&&touch);
var android=/Android/.test(ua),mac=!iOS&&/Mac/.test(pf),win=/Win/.test(pf);
var edge=/Edg\//.test(ua),chromeIOS=/CriOS/.test(ua),ffIOS=/FxiOS/.test(ua),firefox=/Firefox\//.test(ua)&&!ffIOS,
 chrome=(/Chrome\//.test(ua)||chromeIOS)&&!edge&&!/OPR\//.test(ua),safari=/Safari\//.test(ua)&&!chrome&&!edge&&!firefox&&!ffIOS&&!/OPR\//.test(ua);
var dp=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;upd()});
window.addEventListener('appinstalled',function(){dp=null;try{localStorage.setItem('moy_vkus_inst','1')}catch(x){}upd();closeDlg()});
var css=document.createElement('style');css.textContent='#instbar{margin:10px 0}#instbar button{width:100%;padding:12px;border-radius:10px;border:1px solid var(--ac);background:var(--card);color:var(--ac);font-weight:600}#instov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:none;align-items:center;justify-content:center;padding:16px}#instov.on{display:flex}#instdlg{background:var(--card);color:var(--fg);border-radius:14px;max-width:460px;width:100%;max-height:88vh;overflow:auto;padding:18px;box-sizing:border-box}#instdlg h2{margin:0 0 8px}#instdlg ol{padding-left:22px;margin:8px 0}#instdlg li{margin:6px 0}#instdlg .ic{display:inline-block;padding:0 6px;border:1px solid var(--bd);border-radius:6px;font-size:.9em}';document.head.appendChild(css);
function steps(){var h='',t='';
 if(iOS){
  if(safari){t='iPhone / iPad, Safari';h='<ol><li>Нажмите кнопку <b>«Поделиться»</b> <span class="ic">⬆︎</span> (квадрат со стрелкой: на iPad справа в адресной строке, на iPhone внизу экрана).</li><li>Прокрутите меню вниз и выберите <b>«На экран „Домой“»</b>.</li><li>Нажмите <b>«Добавить»</b>. Иконка «Мой вкус» появится на экране «Домой».</li></ol><div class="m">Откройте приложение с этой иконки. Оценки внутри иконки хранятся отдельно от Safari: подключите синхронизацию на вкладке «Данные» или перенесите оценки кодом.</div>'}
  else{t='iPhone / iPad, не Safari';h='<ol><li>В вашем браузере нажмите <b>«Поделиться»</b> и поищите пункт <b>«На экран „Домой“»</b>. На iOS 16.4 и новее он есть и в Chrome.</li><li>Если такого пункта нет, скопируйте адрес страницы и откройте его в <b>Safari</b>, затем: Поделиться → «На экран „Домой“».</li></ol>'}}
 else if(android){t='Android';h=dp?'<div class="m">Нажмите кнопку ниже, и браузер предложит установить приложение.</div>':'<ol><li>Откройте меню браузера <span class="ic">⋮</span> (три точки).</li><li>Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.</li><li>Подтвердите.</li></ol>'+(firefox?'':'<div class="m">Если пункта нет, подождите несколько секунд после открытия страницы и попробуйте снова.</div>')}
 else if(mac&&safari){t='Mac, Safari';h='<ol><li>В меню сверху выберите <b>«Файл» → «Добавить в Dock»</b> (нужен Safari 17 или новее, macOS Sonoma и новее).</li><li>Нажмите <b>«Добавить»</b>.</li></ol>'}
 else if(firefox){t='Firefox на компьютере';h='<div class="m">Firefox на компьютере не умеет устанавливать такие приложения. Откройте эту страницу в <b>Chrome</b>, <b>Edge</b> (или в Safari на Mac) и установите оттуда. Либо просто добавьте страницу в закладки.</div>'}
 else{t=(edge?'Компьютер, Edge':win||mac?'Компьютер, Chrome':'Компьютер');h=dp?'<div class="m">Нажмите кнопку ниже, и браузер предложит установить приложение.</div>':'<ol><li>В адресной строке справа найдите значок установки (монитор со стрелкой или «⊕») и нажмите его.</li><li>Либо меню браузера <span class="ic">⋮</span> → <b>«Установить „Мой вкус“»</b> (в Edge: «Приложения» → «Установить этот сайт как приложение»).</li></ol>'}
 return{t:t,h:h}}
var ov,bar;
function closeDlg(){if(ov)ov.className=''}
function open(){var s=steps();if(!ov){ov=document.createElement('div');ov.id='instov';ov.onclick=function(e){if(e.target===ov)closeDlg()};document.body.appendChild(ov)}
 ov.innerHTML='<div id="instdlg"><h2>Установить приложение</h2><div class="m">'+s.t+'</div>'+s.h+'<div class="row"></div><div class="m">Адрес: <b>'+location.href.replace(/[?#].*$/,'')+'</b></div></div>';
 var row=ov.querySelector('.row');
 if(dp){var b=document.createElement('button');b.className='pri';b.textContent='Установить';b.onclick=function(){dp.prompt();dp.userChoice.then(function(){dp=null;upd();closeDlg()})};row.appendChild(b)}
 var c=document.createElement('button');c.textContent='Скопировать адрес';c.onclick=function(){try{navigator.clipboard.writeText(location.href.replace(/[?#].*$/,'')).then(function(){c.textContent='Скопировано'})}catch(e){}};row.appendChild(c);
 var x=document.createElement('button');x.textContent='Закрыть';x.onclick=closeDlg;row.appendChild(x);ov.className='on'}
function upd(){if(!bar)return;bar.style.display=standalone?'none':''}
function init(){var tabs=document.getElementById('tabs');if(!tabs||standalone)return;bar=document.createElement('div');bar.id='instbar';var b=document.createElement('button');b.textContent='📲 Установить приложение на экран устройства';b.onclick=open;bar.appendChild(b);tabs.parentNode.insertBefore(bar,tabs);upd()}

/* iPad/iPhone, запуск с иконки: Википедия по умолчанию открывается во встроенном окне, которое часто остаётся белым.
   Её ссылки передаём сразу во внешний Safari. Остальные ссылки (YouTube и др.) не трогаем. */
if(iOS&&standalone){
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented)return;var h=a.href||'';if(!/^https?:/i.test(h))return;
  var host='';try{host=new URL(h).host}catch(x){return}
  if(!/(^|\.)wikipedia\.org$/i.test(host))return;
  e.preventDefault();e.stopPropagation();var l=document.createElement('a');l.href='x-safari-'+h;l.rel='noopener';document.body.appendChild(l);l.click();setTimeout(function(){l.remove()},500)},true)}

/* Версия приложения и принудительное обновление (сброс кэша и служебного скрипта) */
(function(){var d=document.getElementById('s-data');if(!d||document.getElementById('vercard'))return;var c=document.createElement('div');c.className='c';c.id='vercard';
 c.innerHTML='<h2>Версия приложения</h2><div class="m">Версия: <b>'+(window.APP_VER||'?')+'</b>. Если после обновления на GitHub что-то не поменялось, нажмите кнопку: она сбросит сохранённые копии страницы и загрузит свежие. Оценки и база не затрагиваются.</div><div class="row"><button id="verbtn">Обновить приложение</button></div><div class="m" id="vermsg"></div>';
 d.appendChild(c);
 document.getElementById('verbtn').onclick=function(){var m=document.getElementById('vermsg');m.textContent='Обновляю…';
  var p=[];try{if(navigator.serviceWorker)p.push(navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister()}))}))}catch(e){}
  try{if(window.caches)p.push(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}))}catch(e){}
  Promise.all(p).catch(function(){}).then(function(){m.textContent='Готово, перезагружаю…';setTimeout(function(){location.replace(location.pathname+'?u='+Date.now())},400)})}})();
init();
})();
