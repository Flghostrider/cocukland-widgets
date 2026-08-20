# cocukland-widgets

Cocukland (cocukland.com.tr) storefront icin konsolide JS widget bundle'i.
Ikas Scriptler'daki ayri ayri scriptler yerine tek dosyada birlestirildi.

## Guncelleme
1. build.js icindeki ilgili fonksiyonu duzenle (build.js KAYNAK, bundle.js URETILIR)
2. `node build.js` -> bundle.js yeniden uretilir
3. `git add -A && git commit -m "..." && git push`
4. `curl -s https://purge.jsdelivr.net/gh/Flghostrider/cocukland-widgets@master/bundle.js`
   ile jsDelivr onbellegini temizle (yoksa ~dakikalar surer)

## !!! TUZAK 1: __NEXT_DATA__ SPA gecislerinde BAYAT kalir

Next.js, yumusak (client-side) gecislerde sayfadaki `__NEXT_DATA__` script
etiketini **GUNCELLEMIYOR** - ilk sunucu render'indan kalan veri orada oyle
duruyor. Kullanici urun A'dan urun B'ye gecince `__NEXT_DATA__` hala A'yi
gosterir.

2026-08-19'da bu yuzden **yorumlar yanlis urunlere yapisiyordu**: jean
sayfasindan silte sayfasina gecilince siltede jean'in yorumlari cikiyordu.
Aylardir "ayni yorum butun urunlerde cikiyor" seklinde bildirilen hatanin
kok nedeni buydu.

**Asla** `document.getElementById('__NEXT_DATA__')` icerigine dogrudan
guvenme. Bunun yerine `cc_sayfaVerisi()` kullan:
- `pageProps.pageTitle === document.title` tazelik kapisi
- bayatsa mevcut yolun HTML'i bir kez cekilip ayristirilir, yol bazinda
  onbelleklenir (en fazla 8 yol)
- veri hazir degilken `null` doner -> widget'lar ONCEKI urunun icerigini
  ekranda BIRAKMAMALI, temizleyip beklemeli

## !!! TUZAK 2: jsDelivr 7 GUN tarayici onbellegi

jsDelivr `Cache-Control: max-age=604800` gonderir. Sabit bir URL kullanilirsa
bundle.js'i bir kez indirmis ziyaretcinin tarayicisi **7 gun** boyunca yeni
surumu almaz - CDN purge edilse bile. Duzeltmeler canliya cikar ama musteri
eski bozuk kodu gormeye devam eder.

Bu yuzden Ikas'taki script etiketi artik URL'e **gunluk donen** bir surum
parametresi ekleyen bir yukleyici (2026-08-19):

```html
<script>(function(){var g=new Date();
var v=g.getUTCFullYear()+'-'+(g.getUTCMonth()+1)+'-'+g.getUTCDate();
var s=document.createElement('script');
s.src='https://cdn.jsdelivr.net/gh/Flghostrider/cocukland-widgets@master/bundle.js?g='+v;
document.head.appendChild(s);})();</script>
```

Ayni gun icinde tarayici onbellekten okur (ek yuk yok), ertesi gun taze
indirir. Degistirmek icin: `cocukland-seo/ikas_script_guncelle.py`
(`dry` / `apply` / `restore`; yedek `ikas_script_yedek.json`).

Not: Ikas sayfa HTML'i Cloudflare'de `s-maxage=200` ile onbelleklenir -
script etiketi degisiklikleri birkac dakika sonra gorunur.

## Zengin Icerik (A+ gorsel)

Urun ozniteligi `67c8a4df-47a0-4fd4-9e96-c7f1ccc4f27d` altindaki tek uzun
gorsel (ornek: 1080x9641) beyaz bosluklardan dilimlenip kart izgarasi olarak
gosterilir. Konum: urun gorsellerinin ardinda, TAM GENISLIK, max-width 1000px.
Sayfa sirasi: **gorseller -> zengin icerik -> yorumlar**.

- **Kesim esigi 60px**: olculdu (2026-08-19) blok ARASI bosluklar 65-180px,
  blok ICI 14-40px. Onceden "en buyuk 9 bosluk" seciliyordu ve iki ozellik
  ayni karta sikisiyordu.
- **Iki sutun** (>=900px): tek sutunda okunakli genislik sayfayi ~8000px'e
  cikariyor. Iki sutun ~3700px'te tutuyor, kartlar ~490px.
- **Yuzde tabanli arka plan konumu**: `padding-top = dilimH/gorselW`,
  `background-position-y = dilimUst/(gorselH-dilimH)`. Piksel hesabi pencere
  yeniden boyutlandirilinca bozuluyordu; yuzde her genislikte dogru.
- **Tembel yukleme**: `zi_yakinMi()` + getBoundingClientRect.
  IntersectionObserver KULLANMA - sayfa compositing yapmadiginda (arka plan
  sekmesi, gomulu webview, basliksiz tarayici) callback HIC tetiklenmiyor ve
  blok sonsuza kadar bos kaliyor (canli dogrulandi).
- **min-height yer tutucu** zorunlu: yuksekligi 0 olan blok hem gorunurluk
  kontrollerini bozar hem yuklenince sayfayi ziplatir.

KAPSAM: 438 urunun sadece 4'unde bu oznitelik dolu. Geri kalani icin urun
basina A+ gorseli hazirlanip Ikas'ta oznitelige yuklenmesi gerekiyor - kod
tarafinda yapilacak bir sey yok.

## Trendyol yorum verisi

Veri bundle'a GOMULU DEGIL; `data/yorumlar.json` urun sayfalarinda
lazy-fetch edilir. Yapisi:

```
{ barkodCid: {barkod: cid},
  icerikler: {cid: {yorumlar:[{yazan,tarih,metin,puan}],
                    ortalamaPuan, toplamDegerlendirme, toplamYorum}} }
```

- `toplamDegerlendirme` = yildiz veren toplam kisi (Trendyol ratingCount)
- `toplamYorum` = YAZILI yorum sayisi (reviewCount) -> **arayuzde bu gosterilir**
- `yorumlar` dizisi sayfaya gomulu ornektir (~20-30), toplamin tamami degil;
  bu yuzden sayac dizinin uzunlugundan DEGIL bu alanlardan okunur
- `barkodCid` yalnizca yorumu OLAN urunlerin barkodlarini icerir (budanmis;
  1575 -> 137, dosya 116KB -> 88KB)

### Tazeleme
`.github/scripts/yorumlar_topla.py` - Ikas'tan barkodlar, Trendyol resmi
Marketplace API'siyle productUrl, sonra her urun sayfasinin JSON-LD'si.

**Zamanlama YEREL makinede** (Windows Task Scheduler ->
`yerel_yorum_tazele.ps1`). GitHub Actions cron'u KALDIRILDI: runner'larin
paylasimli IP'si Trendyol tarafindan engelleniyor (368/368 urun 429).

Guvenlik esigi: yeni tarama eski dosyadaki urun sayisinin yarisindan az
getirirse script hata verip dosyaya **hic dokunmaz** - 2026-08-19'da bir
429 dalgasi veriyi 44 urunden 0'a dusurup canli sitede yorumlari tamamen
sildigi icin eklendi.
