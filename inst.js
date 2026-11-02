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

/* iPad/iPhone, запуск с иконки: внешние ссылки по умолчанию открываются во встроенном окне, которое часто остаётся белым.
   Даём выбор: открыть в Safari / скопировать / открыть здесь. Больше нигде логика не меняется. */
if(iOS&&standalone){
 var lov=null;
 function lclose(){if(lov)lov.className=''}
 function lopen(url){if(!lov){lov=document.createElement('div');lov.id='instov';lov.onclick=function(e){if(e.target===lov)lclose()};document.body.appendChild(lov)}
  var host=url.replace(/^https?:\/\//,'').split('/')[0];
  lov.innerHTML='<div id="instdlg"><h2>Открыть ссылку</h2><div class="m"></div><div class="row"></div></div>';
  lov.querySelector('.m').textContent=host;var row=lov.querySelector('.row');
  var b1=document.createElement('button');b1.className='pri';b1.textContent='Открыть в Safari';b1.onclick=function(){lclose();var a=document.createElement('a');a.href='x-safari-'+url;a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},500)};row.appendChild(b1);
  var b2=document.createElement('button');b2.textContent='Скопировать ссылку';b2.onclick=function(){try{navigator.clipboard.writeText(url).then(function(){b2.textContent='Скопировано'})}catch(e){}};row.appendChild(b2);
  var b3=document.createElement('button');b3.textContent='Открыть здесь';b3.onclick=function(){lclose();window.open(url,'_blank','noopener')};row.appendChild(b3);
  var b4=document.createElement('button');b4.textContent='Отмена';b4.onclick=lclose;row.appendChild(b4);
  lov.className='on'}
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented)return;var h=a.href||'';if(!/^https?:/i.test(h))return;
  try{if(new URL(h).host===location.host)return}catch(x){return}
  e.preventDefault();e.stopPropagation();lopen(h)},true)}
init();
})();
