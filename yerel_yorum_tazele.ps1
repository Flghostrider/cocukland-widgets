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

# Task Scheduler'in PATH'i "python"u agent-reach venv'ine (keyring YOK)
# cozuyor, interaktif kabuktaki gercek Python 3.12 kurulumuna degil - bu
# yuzden tam yol kullaniliyor (2026-08-19 tanida bulundu).
$PY = "C:\Users\numum\AppData\Local\Programs\Python\Python312\python.exe"

# keyring paketi %APPDATA%\Roaming\Python\Python312\site-packages altinda
# (kullanici-site-packages) - Task Scheduler'in surectinde APPDATA farkli/
# eksik geliyor, python bu yuzden keyring'i bulamiyordu. Acikca sabitliyoruz.
$env:APPDATA = "C:\Users\numum\AppData\Roaming"
$env:LOCALAPPDATA = "C:\Users\numum\AppData\Local"
$env:USERPROFILE = "C:\Users\numum"

$ErrorActionPreference = "Stop"
Set-Location "C:\Orvis\veri\cocukland-widgets"
Start-Transcript -Path "C:\Orvis\veri\cocukland-widgets\son_calisma.log" -Append

git pull origin master
if ($LASTEXITCODE -ne 0) { throw "git pull basarisiz" }

& $PY .github\scripts\yorumlar_topla.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Yorum toplama guvenlik esigine takildi ya da hata verdi - eski veri korunuyor, commit atilmayacak."
    Stop-Transcript
    exit 0
}

& $PY -c @"
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

Stop-Transcript
