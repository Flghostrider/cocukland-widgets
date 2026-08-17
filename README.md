# cocukland-widgets

Cocukland (cocukland.com.tr) storefront icin konsolide JS widget bundle'i.
Ikas Scriptler'daki ayri ayri scriptler yerine tek dosyada birlestirildi.

## Guncelleme
1. build.js icindeki ilgili fonksiyonu duzenle
2. `node build.js` -> bundle.js yeniden uretilir
3. `git add -A && git commit -m "..." && git push`
4. jsDelivr CDN link'i degismez, ~birkac dakika icinde otomatik guncellenir
   (aninda zorlamak icin @latest yerine commit hash kullanilabilir, ya da
   https://purge.jsdelivr.net/gh/USER/REPO@main/bundle.js ile purge edilir)
