# -*- coding: utf-8 -*-
"""Cocukland Trendyol Yorum Motoru - toplayici.

Akis:
1. Ikas Admin API'den TUM urunlerin barkod listesini ceker.
2. Trendyol resmi Marketplace API'siyle (barcodes -> approved products)
   her barkodun Trendyol productUrl'sini cozer (RESMI, fuzzy/isim
   eslesmesi YOK - barkod satici hesabimizdan dogrudan sorgulaniyor).
3. Ayni Trendyol urunune (contentId, "-p-<id>" URL'den) baglanan barkodlar
   TEKILLESTIRILIR - bir kez taranir, sonuc tum barkodlara kopyalanir.
4. Her benzersiz Trendyol urun sayfasi duz HTTP GET ile cekilir (canli
   dogrulandi: Trendyol JSON-LD'yi sunucu tarafinda render ediyor, headless
   tarayiciya GEREK YOK), Product.review + aggregateRating cikarilir.
5. FILTRE YOK - Semih'in "hepsini gostersin" talimati (2026-08-18); Scrapive
   icin uygulanan >=4 yildiz esigi burada BILEREK yok.
6. Sonuc data/yorumlar.json'a yazilir (GitHub Actions bunu commit'ler).

Kimlik bilgileri: once ortam degiskenlerinden (GitHub Actions secrets),
yoksa yerel ORVIS keyring'inden ("orvis" servisi) okunur.

NOT: Ikas token ucu urllib'in varsayilan istegini 403 ile reddediyor
(WAF/bot-parmakizi farki) - bu yuzden Ikas cagrilari icin `requests`
kullaniliyor. Trendyol taraflari urllib ile sorunsuz calisiyor ama
tutarlilik icin hepsi requests'e cevrildi.
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

VERI_YOLU = Path(__file__).resolve().parent.parent.parent / "data" / "yorumlar.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


def _anahtar(ad: str) -> str | None:
    v = os.environ.get(ad.upper())
    if v:
        return v
    try:
        sys.path.insert(0, "C:/Orvis")
        from orvis.tools import anahtarlar as A  # noqa: PLC0415

        return A.al(ad)
    except Exception:  # noqa: BLE001
        return None


def _ikas_token(magaza: str, client_id: str, client_secret: str) -> str:
    url = f"https://{magaza}.myikas.com/api/admin/oauth/token"
    r = requests.post(
        url,
        data={"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        raise RuntimeError("Ikas token alinamadi")
    return token


def _ikas_graphql(token: str, sorgu: str, degiskenler: dict) -> dict:
    r = requests.post(
        "https://api.myikas.com/api/v1/admin/graphql",
        json={"query": sorgu, "variables": degiskenler},
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=45,
    )
    r.raise_for_status()
    d = r.json()
    if d.get("errors"):
        raise RuntimeError(f"Ikas graphql hatasi: {d['errors']}")
    return d["data"]


_IKAS_LISTELEME = """query($p: PaginationInput) {
  listProduct(pagination: $p) {
    count
    data { variants { barcodeList } }
  }
}"""


def _ikas_urunler() -> list[dict]:
    magaza = _anahtar("ikas_magaza")
    client_id = _anahtar("ikas_client_id")
    client_secret = _anahtar("ikas_client_secret")
    if not (magaza and client_id and client_secret):
        raise RuntimeError("Ikas kimlik bilgileri eksik (magaza/client_id/client_secret)")
    token = _ikas_token(magaza, client_id, client_secret)
    hepsi: list[dict] = []
    sayfa = 1
    while True:
        blok = _ikas_graphql(token, _IKAS_LISTELEME, {"p": {"page": sayfa, "limit": 100}})
        parca = (blok.get("listProduct") or {}).get("data") or []
        hepsi.extend(parca)
        sayim = (blok.get("listProduct") or {}).get("count")
        if not parca or (isinstance(sayim, int) and len(hepsi) >= sayim):
            break
        sayfa += 1
    return hepsi


def _tum_barkodlar() -> list[str]:
    urunler = _ikas_urunler()
    barkodlar: set[str] = set()
    for u in urunler:
        for v in u.get("variants") or []:
            for b in v.get("barcodeList") or []:
                if b:
                    barkodlar.add(b)
    return sorted(barkodlar)


def _trendyol_urun_url_coz(barkodlar: list[str]) -> dict[str, str]:
    """Barkod -> productUrl. 50'lik gruplar halinde resmi API'ye sorar."""
    satici_id = _anahtar("trendyol_satici_id")
    api_key = _anahtar("trendyol_api_key")
    api_secret = _anahtar("trendyol_api_secret")
    if not (satici_id and api_key and api_secret):
        raise RuntimeError("Trendyol kimlik bilgileri eksik (satici_id/api_key/api_secret)")

    auth = base64.b64encode(f"{api_key}:{api_secret}".encode()).decode()
    sonuc: dict[str, str] = {}
    for i in range(0, len(barkodlar), 50):
        grup = barkodlar[i : i + 50]
        url = f"https://apigw.trendyol.com/integration/product/sellers/{satici_id}/products/approved"
        try:
            r = requests.get(
                url,
                params={"barcodes": ",".join(grup)},
                headers={
                    "Authorization": f"Basic {auth}",
                    "User-Agent": f"{satici_id} - SelfIntegration",
                },
                timeout=30,
            )
            r.raise_for_status()
            veri = r.json()
        except requests.RequestException as e:
            print(f"  [uyari] barkod grubu {i}-{i+50}: {e}")
            continue
        for urun in veri.get("content", []):
            for varyant in urun.get("variants", []):
                bk = varyant.get("barcode")
                url_ = varyant.get("productUrl")
                if bk and url_:
                    sonuc[bk] = url_
        time.sleep(0.3)
    return sonuc


def _urun_yorumlarini_cek(trendyol_url: str) -> dict | None:
    try:
        r = requests.get(trendyol_url, headers={"User-Agent": UA}, timeout=20)
        r.raise_for_status()
        html = r.text
    except requests.RequestException as e:
        print(f"  [hata] {trendyol_url}: {e}")
        return None
    bloklar = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    for blok in bloklar:
        try:
            d = json.loads(blok)
        except json.JSONDecodeError:
            continue
        if isinstance(d, dict) and d.get("@type") == "Product":
            return {
                "aggregateRating": d.get("aggregateRating"),
                "reviews": d.get("review") or [],
            }
    return None


def _yorumlari_bicimlendir(veri: dict | None) -> list[dict]:
    if not veri or not veri.get("reviews"):
        return []
    sonuc = []
    for r in veri["reviews"]:
        try:
            puan = float(r["reviewRating"]["ratingValue"])
        except (KeyError, TypeError, ValueError):
            continue
        sonuc.append(
            {
                "yazan": (r.get("author") or {}).get("name", "") or "Müşteri",
                "tarih": r.get("datePublished", ""),
                "metin": (r.get("reviewBody", "") or "").strip()[:400],
                "puan": puan,
            }
        )
    sonuc.sort(key=lambda x: x["tarih"], reverse=True)
    return sonuc[:30]


def main() -> None:
    print("1/4 Ikas barkod listesi cekiliyor...")
    barkodlar = _tum_barkodlar()
    print(f"   {len(barkodlar)} barkod bulundu")

    print("2/4 Trendyol resmi API ile productUrl cozuluyor...")
    barkod_url = _trendyol_urun_url_coz(barkodlar)
    print(f"   {len(barkod_url)} barkod eslesti")

    print("3/4 Ayni Trendyol urunune baglanan barkodlar tekillestiriliyor...")
    gruplar: dict[str, dict] = {}
    for barkod, url in barkod_url.items():
        m = re.search(r"-p-(\d+)", url)
        cid = m.group(1) if m else url
        g = gruplar.setdefault(cid, {"url": url, "barkodlar": []})
        g["barkodlar"].append(barkod)
    print(f"   {len(gruplar)} benzersiz Trendyol urunu")

    print("4/4 Her urun taraniyor (duz HTTP, headless tarayici yok)...")
    icerikler: dict[str, list[dict]] = {}
    barkod_cid: dict[str, str] = {}
    for i, (cid, g) in enumerate(gruplar.items(), 1):
        veri = _urun_yorumlarini_cek(g["url"])
        yorumlar = _yorumlari_bicimlendir(veri)
        if yorumlar:
            icerikler[cid] = yorumlar
        for barkod in g["barkodlar"]:
            barkod_cid[barkod] = cid
        if i % 20 == 0 or i == len(gruplar):
            print(f"   [{i}/{len(gruplar)}] taranan urun, su ana kadar {len(icerikler)} urun yorumlu")
        time.sleep(0.15)

    cikti = {"barkodCid": barkod_cid, "icerikler": icerikler, "guncelleme": None}
    VERI_YOLU.parent.mkdir(parents=True, exist_ok=True)
    VERI_YOLU.write_text(json.dumps(cikti, ensure_ascii=False), encoding="utf-8")
    print(f"\nYazildi: {VERI_YOLU} ({len(icerikler)} urun yorumlu, {len(barkod_cid)} barkod eslesmesi)")


if __name__ == "__main__":
    main()
