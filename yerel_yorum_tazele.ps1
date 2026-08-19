# Trendyol yorum tazeleme - YEREL calistirici.
#
# GitHub Actions runner'lari (paylasimli/datacenter IP) Trendyol tarafindan
# 429 ile TAMAMEN engelleniyor (2026-08-19 canli testte 368/368 urun 429
# aldi, guvenlik esigi devreye girip eski veriyi korudu ama yeni veri hic
# gelmedi). Bu makinenin IP'si engellenmedigi icin (daha once ayni script
# yerelden calistirildiginda 43 urun basariyla tarandi) is buraya tasindi.
#
# GitHub Actions workflow'undaki cron KALDIRILDI (bkz. yorumlar.yml),
# workflow_dispatch (manuel tetikleme) durdu. Zamanlama artik Windows
# Task Scheduler ile buradan yapiliyor.

$ErrorActionPreference = "Stop"
Set-Location "C:\Orvis\veri\cocukland-widgets"

git pull origin master
if ($LASTEXITCODE -ne 0) { throw "git pull basarisiz" }

python .github\scripts\yorumlar_topla.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Yorum toplama guvenlik esigine takildi ya da hata verdi - eski veri korunuyor, commit atilmayacak."
    exit 0
}

python -c @"
import json, datetime
p = 'data/yorumlar.json'
d = json.load(open(p, encoding='utf-8'))
d['guncelleme'] = datetime.datetime.utcnow().isoformat() + 'Z'
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
"@

git add data/yorumlar.json
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "degisiklik yok"
} else {
    git commit -m "Trendyol yorumlarini tazele [yerel-otomatik]"
    git push origin master
}
