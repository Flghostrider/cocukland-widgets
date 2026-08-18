// Cocukland site widget'lari - tek konsolide bundle
// Kaynak: eskiden Ikas Scriptler'da 5 ayri script + 5 ayri MutationObserver/setInterval olarak calisiyordu.
// Bu dosya hepsini TEK gozlemci + TEK interval altinda birlestirir.
//
// Trendyol yorum verisi ARTIK GOMULU DEGIL - data/yorumlar.json'dan fetch
// ile cekiliyor (2026-08-18). Once statik olarak baka bir oturumun gecici
// klasorundeki dosyadan uretiliyordu, o klasor silinince guncellenemez
// hale gelmisti. .github/workflows/yorumlar.yml her 3 gunde bir
// data/yorumlar.json'i tazeler, bu bundle her sayfa yuklemesinde en
// guncel halini fetch eder - GitHub'da calisir, yerel makine kapali
// olsa bile durmaz.
const fs = require('fs');
const path = require('path');

const bundle = `/* Cocukland Site Widgetleri - konsolide bundle. Deploy: cocukland-widgets/ -> jsDelivr CDN */
(function(){
'use strict';

/* ---------- 1) Kargo cubugu + marka seridi + magaza bilgisi + checkout guven + kategori sayisi + teslimat suresi ---------- */
function ccShippingBar(){
  var THRESHOLD=1000;
  function parseAmount(str){if(!str)return null;var cleaned=str.replace(/[^\\d.,]/g,'').replace(/,/g,'');var n=parseFloat(cleaned);return isNaN(n)?null:n;}
  function formatTL(n){return Math.ceil(n).toLocaleString('tr-TR');}
  if(location.pathname.indexOf('/cart')!==0)return;
  var summary=document.querySelector('.basket-summary');
  if(!summary)return;
  var remaining=0;
  var spans=document.querySelectorAll('span');
  var found=false;
  for(var i=0;i<spans.length;i++){
    var m=spans[i].textContent.match(/sepetine[^\\d]*([\\d.,]+)\\s*daha/);
    if(m){var amt=parseAmount(m[1]);if(amt!==null){remaining=amt;found=true;}break;}
  }
  if(!found)remaining=0;
  var achieved=remaining<=0;
  var percent=Math.max(0,Math.min(100,((THRESHOLD-remaining)/THRESHOLD)*100));
  var bar=summary.querySelector('#cc-shipping-bar');
  if(!bar){
    bar=document.createElement('div');bar.id='cc-shipping-bar';bar.style.cssText='width:100%;box-sizing:border-box;padding:8px 0 16px;';
    var h3=summary.querySelector('h3');
    if(h3){h3.insertAdjacentElement('afterend',bar);}else{summary.insertBefore(bar,summary.firstChild);}
  }
  var labelHtml=achieved?'<span style="display:flex;align-items:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4AA57B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Ücretsiz kargo kazandınız</span></span>':'<span>Ücretsiz kargoya <strong>'+formatTL(remaining)+' TL</strong> kaldı</span>';
  bar.innerHTML='<div style="font-size:14px;color:#1C274B;margin-bottom:8px;font-family:inherit;">'+labelHtml+'</div><div style="width:100%;height:8px;border-radius:4px;background:#E5E7EB;overflow:hidden;"><div style="height:100%;border-radius:4px;background:'+(achieved?'#4AA57B':'#1C274B')+';width:'+percent.toFixed(1)+'%;transition:width 0.4s ease;"></div></div>';
}

function ccBrandStrip(){
  var BRANDS=[{name:'Kanz',slug:'kanz',tag:'Yetkili Satıcı'},{name:'Pierre Cardin',slug:'pierre-cardin',tag:'Yetkili Satıcı'},{name:'Chicco',slug:'chicco'},{name:'Philips Avent',slug:'avent'},{name:'Mustela',slug:'mustela'},{name:'Lansinoh',slug:'lansinoh'},{name:'Baby2Go',slug:'baby2go'},{name:'DMB',slug:'dmb'},{name:'Mini Cotton',slug:'mini-cotton'}];
  function buildBadge(b){var tagHtml=b.tag?'<div style="font-size:10px;color:#4AA57B;font-weight:700;margin-top:4px;">'+b.tag+'</div>':'';return '<a href="/'+b.slug+'" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-width:150px;height:72px;margin:0 8px;padding:0 18px;background:#fff;border:1px solid #E5E7EB;border-radius:10px;text-decoration:none;flex-shrink:0;transition:border-color .2s;">'+'<span style="font-size:15px;font-weight:700;color:#1C274B;font-family:inherit;white-space:nowrap;">'+b.name+'</span>'+tagHtml+'</a>';}
  if(location.pathname!=='/')return;
  if(document.getElementById('cc-brand-strip'))return;
  var footer=document.querySelector('footer');
  if(!footer)return;
  var wrap=document.createElement('div');wrap.id='cc-brand-strip';wrap.style.cssText='width:100%;overflow:hidden;padding:28px 0;background:#F9FAFB;border-top:1px solid #EEE;border-bottom:1px solid #EEE;';
  var title='<div style="text-align:center;font-size:15px;font-weight:700;color:#1C274B;margin-bottom:18px;">Mağazamızda Bulunan Markalar</div>';
  var badges=BRANDS.map(buildBadge).join('');
  var track='<div class="cc-brand-track" style="display:flex;width:max-content;animation:cc-brand-scroll 28s linear infinite;">'+badges+badges+'</div>';
  wrap.innerHTML=title+'<div style="overflow:hidden;">'+track+'</div>';
  footer.parentNode.insertBefore(wrap,footer);
  if(!document.getElementById('cc-brand-strip-style')){
    var style=document.createElement('style');style.id='cc-brand-strip-style';
    style.textContent='@keyframes cc-brand-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}#cc-brand-strip a:hover{border-color:#1C274B;}#cc-brand-strip:hover .cc-brand-track{animation-play-state:paused;}';
    document.head.appendChild(style);
  }
}

function ccStoreInfo(){
  var STORES=[{name:'Nilüfer Şube',address:'Fatih Sultan Mehmet Bulvarı No:9B/C, Nilüfer / Bursa',phone:'0531 236 96 91',tel:'+905312369691'},{name:'Osmangazi Şube',address:'Şehreküstü Mah. Küfeciler Sok. No:6-10, Osmangazi / Bursa',phone:'0533 201 82 27',tel:'+905332018227'}];
  if(!document.body.querySelector('#cc-footer-stores')){
    var line=document.createElement('div');line.id='cc-footer-stores';line.style.cssText='text-align:center;font-size:12px;color:#1C274B;background:#F9FAFB;border-top:1px solid #EEE;padding:10px 16px;';
    line.innerHTML='🏬 2 Fiziksel Mağazamız var: Bursa Nilüfer &amp; Osmangazi — <a href="/pages/iletisim" style="text-decoration:underline;color:#1C274B;">adres ve telefon</a>';
    document.body.appendChild(line);
  }
  var existing=document.body.querySelector('#cc-store-list');
  if(location.pathname==='/pages/iletisim'){
    if(!existing){
      var sec=document.createElement('div');sec.id='cc-store-list';sec.style.cssText='max-width:900px;margin:0 auto;padding:32px 16px;background:#fff;';
      var cards=STORES.map(function(s){return '<div style="flex:1;min-width:260px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;">'+'<div style="font-size:16px;font-weight:700;color:#1C274B;margin-bottom:6px;">'+s.name+'</div>'+'<div style="font-size:14px;color:#444;margin-bottom:10px;line-height:1.4;">'+s.address+'</div>'+'<a href="tel:'+s.tel+'" style="font-size:14px;color:#1C274B;font-weight:600;text-decoration:none;">📞 '+s.phone+'</a></div>';}).join('');
      sec.innerHTML='<div style="text-align:center;font-size:22px;font-weight:700;color:#1C274B;margin-bottom:20px;">Mağazalarımız</div>'+'<div style="display:flex;gap:16px;flex-wrap:wrap;">'+cards+'</div>';
      var footerEl=document.body.querySelector('#cc-footer-stores');
      document.body.insertBefore(sec,footerEl);
    }
  } else if(existing){existing.remove();}
}

function ccCheckoutTrust(){
  var existing=document.body.querySelector('#cc-checkout-trust');
  if(location.pathname.indexOf('/checkout')!==0){if(existing)existing.remove();return;}
  if(existing)return;
  var box=document.createElement('div');box.id='cc-checkout-trust';box.style.cssText='max-width:900px;margin:0 auto;padding:20px 16px;display:flex;gap:24px;flex-wrap:wrap;justify-content:center;border-top:1px solid #EEE;background:#fff;';
  var items=[{icon:'🔒',text:'256 Bit SSL ile güvende alışveriş'},{icon:'🚚',text:'1.000 TL üzeri ücretsiz kargo'},{icon:'📦',text:'DHL eCommerce ile 1-3 iş günü içinde teslimat'},{icon:'↩️',text:'14 gün içinde iade hakkı'}];
  box.innerHTML=items.map(function(i){return '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#1C274B;"><span style="font-size:16px;">'+i.icon+'</span>'+i.text+'</div>';}).join('');
  var footerEl=document.body.querySelector('#cc-footer-stores');
  document.body.insertBefore(box,footerEl);
}

function ccCategoryCount(){
  var existing=document.body.querySelector('#cc-category-count');
  var nextDataEl=document.getElementById('__NEXT_DATA__');
  var count=null;
  if(nextDataEl){
    try{
      var d=JSON.parse(nextDataEl.textContent);
      var pp=d.props&&d.props.pageProps;
      if(pp&&pp.pageTitle===document.title&&pp.propValues){
        var arr=pp.propValues;
        for(var i=0;i<arr.length;i++){
          var block=arr[i].propValues;
          if(block&&block.productsList&&block.productsList.pageType==='CATEGORY'&&typeof block.headerBgColor==='undefined'){count=block.productsList.count;break;}
        }
      }
    }catch(e){}
  }
  if(count===null||count===undefined){if(existing)existing.remove();return;}
  if(!existing){
    existing=document.createElement('div');existing.id='cc-category-count';existing.style.cssText='text-align:center;font-size:12px;color:#1C274B;background:#F9FAFB;padding:6px 16px;border-bottom:1px solid #EEE;';
    document.body.insertBefore(existing,document.body.firstChild);
  }
  var text=count.toLocaleString('tr-TR')+' ürün bulundu';
  if(existing.textContent!==text)existing.textContent=text;
}

function ccProductDelivery(){
  var existing=document.body.querySelector('#cc-product-delivery');
  var nextDataEl=document.getElementById('__NEXT_DATA__');
  var isProduct=false;
  if(nextDataEl){
    try{
      var d=JSON.parse(nextDataEl.textContent);
      var pp=d.props&&d.props.pageProps;
      if(pp&&pp.pageTitle===document.title&&pp.pageType==='PRODUCT'){isProduct=true;}
    }catch(e){}
  }
  if(!isProduct){if(existing)existing.remove();return;}
  if(existing)return;
  var box=document.createElement('div');box.id='cc-product-delivery';box.style.cssText='max-width:900px;margin:0 auto;padding:14px 16px;text-align:center;font-size:13px;color:#1C274B;background:#F9FAFB;border-top:1px solid #EEE;border-bottom:1px solid #EEE;';
  box.innerHTML='📦 DHL eCommerce ile <strong>1-3 iş günü</strong> içinde teslimat';
  var footerEl=document.body.querySelector('#cc-footer-stores');
  document.body.insertBefore(box,footerEl);
}

/* ---------- 2) Beden Tablosu modal gorseli - mobil/masaustu otomatik secim ---------- */
function ccBedenTablosu(){
  var DESKTOP='https://cdn.myikas.com/images/96c43624-0d17-4eb1-b5bd-60d0743043e7/bcbbf679-cf12-4cda-92f8-7568fb7fe7a4/image_1080.webp';
  var MOBILE='https://cdn.myikas.com/images/96c43624-0d17-4eb1-b5bd-60d0743043e7/7e915d55-364b-4431-b50a-16229bbd6272/image_1080.webp';
  var MARKS=['bcbbf679','7e915d55'];
  function isMobile(){return window.innerWidth<=650;}
  var modal=document.querySelector('.custom__image-modal');
  if(!modal)return;
  var img=modal.querySelector('img');
  if(!img)return;
  var target=isMobile()?MOBILE:DESKTOP;
  var ours=img.src.indexOf('data:image')===0;
  for(var i=0;i<MARKS.length;i++){if(img.src.indexOf(MARKS[i])!==-1)ours=true;}
  if(ours&&img.src!==target){img.src=target;img.srcset='';}
}

/* ---------- 3) Urun sayfasi zengin icerik gorseli (parcalara ayirip kart olarak gosterir) ---------- */
var zi_lastPath=null;
var ZI_ATTR_ID='67c8a4df-47a0-4fd4-9e96-c7f1ccc4f27d';
var ZI_MERCHANT='96c43624-0d17-4eb1-b5bd-60d0743043e7';
function zi_findPageSpecificData(obj, depth){
  if(!obj || typeof obj !== 'object' || depth > 30) return null;
  if(obj.pageSpecificData && obj.pageSpecificData.attributes) return obj.pageSpecificData;
  for(var k in obj){
    if(!Object.prototype.hasOwnProperty.call(obj,k)) continue;
    var v = obj[k];
    if(v && typeof v === 'object'){var found = zi_findPageSpecificData(v, depth+1);if(found) return found;}
  }
  return null;
}
function zi_imageIdFromAttributes(attrs){
  if(!attrs) return null;
  for(var i=0;i<attrs.length;i++){var a = attrs[i];if(a.productAttributeId === ZI_ATTR_ID && a.imageIds && a.imageIds[0]) return a.imageIds[0];}
  return null;
}
function zi_computeSegments(img){
  var w = img.naturalWidth, h = img.naturalHeight;
  var canvas = document.createElement('canvas');
  var scale = Math.min(1, 300 / w);
  var cw = Math.max(1, Math.round(w*scale)), ch = Math.max(1, Math.round(h*scale));
  canvas.width = cw; canvas.height = ch;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, cw, ch);
  var data = ctx.getImageData(0, 0, cw, ch).data;
  var rowMean = new Array(ch), rowStd = new Array(ch);
  for(var y=0;y<ch;y++){
    var sum=0, sumSq=0, n=cw;
    for(var x=0;x<cw;x++){var i = (y*cw+x)*4;var g = (data[i]+data[i+1]+data[i+2])/3;sum += g; sumSq += g*g;}
    var mean = sum/n;var variance = sumSq/n - mean*mean;
    rowMean[y] = mean;rowStd[y] = Math.sqrt(Math.max(0,variance));
  }
  var bos = [];
  for(var y2=0;y2<ch;y2++) bos.push(rowMean[y2] > 235 && rowStd[y2] < 8);
  var bloklar = [];
  var i2=0;
  while(i2<ch){
    if(bos[i2]){var j=i2;while(j<ch && bos[j]) j++;if(j-i2 >= 4) bloklar.push([i2,j,j-i2]);i2=j;} else i2++;
  }
  bloklar.sort(function(a,b){ return b[2]-a[2]; });
  var secili = bloklar.slice(0,9).sort(function(a,b){ return a[0]-b[0]; });
  var kesim = [0];
  for(var k=0;k<secili.length;k++) kesim.push(Math.round((secili[k][0]+secili[k][1])/2));
  kesim.push(ch);
  var kesimOrijinal = kesim.map(function(v){ return Math.round(v/scale); });
  var parcalar = [];
  for(var k2=0;k2<kesimOrijinal.length-1;k2++){
    var top = kesimOrijinal[k2], bot = kesimOrijinal[k2+1];
    if(parcalar.length && (bot-top) < 150){parcalar[parcalar.length-1][1] = bot;} else {parcalar.push([top, bot]);}
  }
  if(!parcalar.length) parcalar = [[0, h]];
  return parcalar;
}
function zi_buildCards(wrap, src, naturalW, naturalH, segments){
  wrap.innerHTML = '';
  var displayW = Math.min(wrap.clientWidth || 480, 480);
  var scaleDisp = displayW / naturalW;
  var totalDispH = naturalH * scaleDisp;
  segments.forEach(function(seg, idx){
    var segH = (seg[1]-seg[0]) * scaleDisp;
    var card = document.createElement('div');
    card.style.cssText = ['width:100%','height:'+Math.round(segH)+'px','background-image:url(' + src + ')','background-repeat:no-repeat','background-size:' + Math.round(displayW) + 'px ' + Math.round(totalDispH) + 'px','background-position:0 -' + Math.round(seg[0]*scaleDisp) + 'px','border-radius:14px','box-shadow:0 4px 18px rgba(0,0,0,0.10)','margin-bottom:' + (idx === segments.length-1 ? '8px' : '14px'),'overflow:hidden'].join(';');
    wrap.appendChild(card);
  });
}
function zi_buildFallbackImg(wrap, src){
  wrap.innerHTML = '';
  var img = document.createElement('img');
  img.src = src;img.alt = 'Urun Detaylari';
  img.style.cssText = 'display:block;width:100%;max-width:480px;height:auto;border-radius:14px;box-shadow:0 4px 18px rgba(0,0,0,0.10);';
  wrap.appendChild(img);
}
function zi_renderSliced(wrap, src){
  var img = new Image();img.crossOrigin = 'anonymous';
  img.onload = function(){
    try {var segments = zi_computeSegments(img);zi_buildCards(wrap, src, img.naturalWidth, img.naturalHeight, segments);} catch(e){zi_buildFallbackImg(wrap, src);}
  };
  img.onerror = function(){};
  img.src = src;
}
function zi_applyImage(imgId){
  var existing = document.getElementById('zengin-icerik-blok');
  var tabContent = document.querySelector('.product-detail-tabs-main .tab-content');
  if(!imgId){if(existing) existing.remove();return;}
  if(!tabContent){ return; }
  var src = 'https://cdn.myikas.com/images/'+ZI_MERCHANT+'/'+imgId+'/image_1080.webp';
  if(existing && existing.getAttribute('data-imgid') === imgId) return;
  if(existing) existing.remove();
  var wrap = document.createElement('div');
  wrap.id = 'zengin-icerik-blok';wrap.setAttribute('data-imgid', imgId);
  wrap.style.cssText = 'display:block;width:100%;max-width:480px;margin:20px auto 8px auto;';
  tabContent.insertBefore(wrap, tabContent.firstChild);
  zi_renderSliced(wrap, src);
}
function zi_parseNextDataFromHtml(html){
  try {var doc = new DOMParser().parseFromString(html, 'text/html');var el = doc.getElementById('__NEXT_DATA__');if(!el){ return null; }return JSON.parse(el.textContent);} catch(e){ return null; }
}
function zi_applyFromNextDataObject(dataObj){
  var psd = zi_findPageSpecificData(dataObj, 0);
  var imgId = psd ? zi_imageIdFromAttributes(psd.attributes) : null;
  zi_applyImage(imgId);
}
function zi_refetchAndApply(){
  fetch(location.pathname, {credentials:'same-origin'}).then(function(r){return r.text();}).then(function(html){
    var data = zi_parseNextDataFromHtml(html);if(data) zi_applyFromNextDataObject(data);
  }).catch(function(e){});
}
function zi_applyFromLocalNextData(){
  try {
    var el = document.getElementById('__NEXT_DATA__');
    if(!el) return false;
    var data = JSON.parse(el.textContent);
    var pp = data.props && data.props.pageProps;
    if(!pp || pp.pageTitle !== document.title) return false;
    zi_applyFromNextDataObject(data);
    return true;
  } catch(e){ return false; }
}
function ccZenginIcerik(){
  var isProductPage = !!document.querySelector('.product-detail-tabs-main');
  if(!isProductPage) return;
  var path = location.pathname;
  if(path === zi_lastPath) return;
  zi_lastPath = path;
  if(!zi_applyFromLocalNextData()) zi_refetchAndApply();
}

/* ---------- 4) Trendyol yorum vitrini - urun gorsellerinin ALTINDA, surekli donen kart seridi ---------- */
/* Veri artik bundle'a gomulu degil - her sayfa yuklemesinde jsDelivr'dan
   fetch edilir. .github/workflows/yorumlar.yml bu dosyayi 3 gunde bir
   tazeler (GitHub'in kendi sunucusunda calisir - yerel makine kapali
   olsa da durmaz). jsDelivr CDN ~birkac dakikada bir onbellek yeniler. */
var TY_VITRIN_ID = "trendyol-yorum-vitrin";
var TY_OZET_ID = "trendyol-yorum-ozet";
var TY_TURUNCU = "#f27a1a";
var TY_VERI_URL = "https://cdn.jsdelivr.net/gh/Flghostrider/cocukland-widgets@master/data/yorumlar.json";
var ty_veri = null;      // null = henuz cekilmedi, false = cekme basarisiz, object = hazir
var ty_veriIsteAtildi = false;
function ty_veriGetir(){
  if(ty_veriIsteAtildi) return;
  ty_veriIsteAtildi = true;
  fetch(TY_VERI_URL).then(function(r){ return r.json(); }).then(function(d){
    ty_veri = d;
  }).catch(function(){ ty_veri = false; });
}
function ty_tumBarkodlar(){
  try {
    var el = document.getElementById("__NEXT_DATA__");
    if(!el) return [];
    var veri2 = JSON.parse(el.textContent);
    var psd = veri2.props && veri2.props.pageProps && veri2.props.pageProps.pageSpecificData;
    if(!psd || !psd.variants) return [];
    var sonuc = [];
    psd.variants.forEach(function(v){(v.barcodeList || []).forEach(function(b){ sonuc.push(b); });});
    return sonuc;
  } catch(e){ return []; }
}
function ty_yildizYap(puan, boyut){
  var dolu = Math.round(puan);
  var wrap = document.createElement("span");wrap.style.cssText = "letter-spacing:1px;white-space:nowrap;";
  for(var i=0;i<5;i++){
    var s = document.createElement("span");s.textContent = String.fromCharCode(9733);
    s.style.cssText = "font-size:" + (boyut||18) + "px;color:" + (i<dolu ? TY_TURUNCU : "#e0e0e0") + ";";
    wrap.appendChild(s);
  }
  return wrap;
}
function ty_ortalamaHesapla(yorumlar){
  var toplam = 0;(yorumlar || []).forEach(function(y){ toplam += (y.puan || 0); });
  return (yorumlar && yorumlar.length) ? (toplam / yorumlar.length) : 0;
}
function ty_ozetKartiOlustur(yorumlar){
  var ortalama = ty_ortalamaHesapla(yorumlar);
  var wrap = document.createElement("div");wrap.id = TY_OZET_ID;
  wrap.style.cssText = "display:flex;align-items:center;gap:8px;margin:10px 0 4px;padding:10px 12px;background:#fff8f0;border-radius:10px;cursor:pointer;flex-wrap:wrap;";
  var rozet = document.createElement("span");rozet.textContent = "Trendyol";
  rozet.style.cssText = "background:" + TY_TURUNCU + ";color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;";
  wrap.appendChild(rozet);
  var sayi = document.createElement("span");sayi.textContent = ortalama.toFixed(1);
  sayi.style.cssText = "font-size:15px;font-weight:700;color:#1a1a1a;";
  wrap.appendChild(sayi);
  wrap.appendChild(ty_yildizYap(ortalama, 14));
  var sayac = document.createElement("span");sayac.textContent = "(" + (yorumlar ? yorumlar.length : 0) + " degerlendirme)";
  sayac.style.cssText = "font-size:12px;color:#999;text-decoration:underline;";
  wrap.appendChild(sayac);
  wrap.addEventListener("click", function(){var hedefEl = document.getElementById(TY_VITRIN_ID);if(hedefEl) hedefEl.scrollIntoView({behavior:"smooth", block:"start"});});
  return wrap;
}
function ty_miniKart(y){
  var kart = document.createElement("div");
  kart.style.cssText = "flex:0 0 auto;width:280px;margin:0 8px;padding:14px 16px;background:#fff;border:1px solid #eee;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);";
  var ust = document.createElement("div");ust.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:6px;";
  ust.appendChild(ty_yildizYap(y.puan, 14));
  var isim = document.createElement("span");isim.textContent = y.yazan || "Musteri";
  isim.style.cssText = "font-size:12px;color:#888;font-weight:600;";
  ust.appendChild(isim);kart.appendChild(ust);
  var govde = document.createElement("div");
  govde.style.cssText = "font-size:13px;color:#333;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;";
  govde.textContent = y.metin || "";kart.appendChild(govde);
  return kart;
}
function ty_vitrinOlustur(yorumlar){
  var wrap = document.createElement("div");wrap.id = TY_VITRIN_ID;
  wrap.style.cssText = "margin:20px 0 28px;font-family:inherit;";
  var ustSatir = document.createElement("div");ustSatir.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:2px;padding:0 4px;flex-wrap:wrap;";
  var rozet = document.createElement("span");rozet.textContent = "Trendyol";
  rozet.style.cssText = "background:" + TY_TURUNCU + ";color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px;letter-spacing:0.3px;";
  var baslik = document.createElement("span");baslik.textContent = "Musteri Yorumlari";
  baslik.style.cssText = "font-weight:700;font-size:15px;color:#1a1a1a;";
  var ortalama = ty_ortalamaHesapla(yorumlar);
  var ozetSayi = document.createElement("span");ozetSayi.textContent = ortalama.toFixed(1);
  ozetSayi.style.cssText = "font-size:14px;font-weight:700;color:#1a1a1a;margin-left:4px;";
  var sayac = document.createElement("span");sayac.textContent = "(" + yorumlar.length + ")";
  sayac.style.cssText = "font-size:12px;color:#999;";
  ustSatir.appendChild(rozet);ustSatir.appendChild(baslik);ustSatir.appendChild(ozetSayi);ustSatir.appendChild(ty_yildizYap(ortalama, 13));ustSatir.appendChild(sayac);
  wrap.appendChild(ustSatir);
  var not_ = document.createElement("div");not_.style.cssText = "font-size:11px;color:#999;margin:2px 0 12px;padding:0 4px;";
  not_.textContent = "Bu urun baska bir satis kanalinda da satiliyor. Asagidaki yorumlar o kanaldan derlenmistir ve magaza puanimiza dahil degildir.";
  wrap.appendChild(not_);
  var kayan = document.createElement("div");
  kayan.style.cssText = "overflow:hidden;width:100%;";
  var track = document.createElement("div");
  track.className = "ty-vitrin-track";
  var hizSn = Math.max(18, yorumlar.length * 5);
  track.style.cssText = "display:flex;width:max-content;padding:4px 0;animation:ty-vitrin-scroll " + hizSn + "s linear infinite;";
  yorumlar.forEach(function(y){ track.appendChild(ty_miniKart(y)); });
  yorumlar.forEach(function(y){ track.appendChild(ty_miniKart(y)); }); // ikinci kopya - kesintisiz donus
  kayan.appendChild(track);
  wrap.appendChild(kayan);
  if(!document.getElementById("ty-vitrin-style")){
    var style = document.createElement("style");style.id = "ty-vitrin-style";
    style.textContent = "@keyframes ty-vitrin-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}#" + TY_VITRIN_ID + ":hover .ty-vitrin-track{animation-play-state:paused;}";
    document.head.appendChild(style);
  }
  return wrap;
}
function ccTrendyolVitrin(){
  var slider = document.querySelector(".product-detail-page-slider-main");
  var buyBox = document.querySelector(".product-detail-page-detail-price-box");
  var mevcut = document.getElementById(TY_VITRIN_ID);
  var mevcutOzet = document.getElementById(TY_OZET_ID);
  if(!slider){ if(mevcut) mevcut.remove(); if(mevcutOzet) mevcutOzet.remove(); return; }
  if(ty_veri === null){ ty_veriGetir(); return; } // henuz gelmedi, sonraki dongude tekrar denenir
  if(!ty_veri){ if(mevcut) mevcut.remove(); if(mevcutOzet) mevcutOzet.remove(); return; }
  var barkodlar = ty_tumBarkodlar();
  var cid = null;
  for(var i=0;i<barkodlar.length;i++){ if(ty_veri.barkodCid[barkodlar[i]]){ cid = ty_veri.barkodCid[barkodlar[i]]; break; } }
  if(!cid || !ty_veri.icerikler[cid] || !ty_veri.icerikler[cid].length){
    if(mevcut) mevcut.remove(); if(mevcutOzet) mevcutOzet.remove(); return;
  }
  var vitrinTamam = mevcut && mevcut.getAttribute("data-cid") === cid && mevcut.getAttribute("data-v") === "7";
  var ozetTamam = mevcutOzet && mevcutOzet.getAttribute("data-cid") === cid && mevcutOzet.getAttribute("data-v") === "7";
  if(vitrinTamam && ozetTamam) return;
  if(!vitrinTamam && mevcut){ mevcut.remove(); mevcut = null; }
  if(!ozetTamam && mevcutOzet){ mevcutOzet.remove(); mevcutOzet = null; }
  if(!vitrinTamam){
    var yeni = ty_vitrinOlustur(ty_veri.icerikler[cid]);
    yeni.setAttribute("data-cid", cid);yeni.setAttribute("data-v", "7");
    slider.insertAdjacentElement("afterend", yeni);
  }
  if(buyBox && !ozetTamam){
    var ozet = ty_ozetKartiOlustur(ty_veri.icerikler[cid]);
    ozet.setAttribute("data-cid", cid);ozet.setAttribute("data-v", "7");
    buyBox.insertAdjacentElement("beforebegin", ozet);
  }
}

/* ---------- Paylasilan tek gozlemci + tek dongu ---------- */
function isInsideOurs(node){
  var el=node&&node.nodeType===1?node:(node&&node.parentElement);
  return !!(el&&el.closest&&(el.closest('#cc-shipping-bar')||el.closest('#cc-brand-strip')||el.closest('#cc-footer-stores')||el.closest('#cc-store-list')||el.closest('#cc-checkout-trust')||el.closest('#cc-category-count')||el.closest('#cc-product-delivery')||el.closest('#'+TY_VITRIN_ID)||el.closest('#'+TY_OZET_ID)||el.closest('#zengin-icerik-blok')));
}
function renderAll(){
  ccShippingBar();ccBrandStrip();ccStoreInfo();ccCheckoutTrust();ccCategoryCount();ccProductDelivery();
  ccBedenTablosu();ccZenginIcerik();ccTrendyolVitrin();
}
var scheduled=false;
function schedule(){
  if(scheduled)return;scheduled=true;
  setTimeout(function(){scheduled=false;renderAll();},150);
}
var observer=new MutationObserver(function(mutations){
  var relevant=false;
  for(var i=0;i<mutations.length;i++){if(!isInsideOurs(mutations[i].target)){relevant=true;break;}}
  if(relevant)schedule();
});
observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['src']});
setInterval(renderAll, 2000);
window.addEventListener('resize', ccBedenTablosu);
schedule();
document.addEventListener('DOMContentLoaded',schedule);
})();
`;

fs.writeFileSync(path.join(__dirname, 'bundle.js'), bundle, 'utf-8');
console.log('bundle.js written, size:', bundle.length);
