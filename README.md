# SentinelWatch Lite
SentinelWatch Lite, bir sisteme ait olay kayıtlarını (log/event) periyodik olarak izleyen, basit ama gerçek kurallara göre şüpheli davranışları (ör. brute-force giriş denemesi, anormal istek yoğunluğu) tespit eden ve bunları düzenli aralıklarla güncellenen bir dashboard üzerinde gösteren bir izleme panelidir.

## Ekran Görüntüleri
<img width="1279" height="695" alt="Screenshot 2026-07-09 163127" src="https://github.com/user-attachments/assets/7726284c-b753-476f-a47a-13dd08a2b634" />
<img width="1279" height="694" alt="Screenshot 2026-07-09 163116" src="https://github.com/user-attachments/assets/3b3449c5-7bb7-452f-97d4-ef967fd6f746" />

## Uç Noktaların JSON Formatları
### /api/events:
```JSON
[
  {
    "id": 1,
    "timestamp": "2026-07-09T13:20:05+00:00",
    "source_ip": "61.65.67.167",
    "event_type": "LOGIN_FAILED",
    "username": "oblitum"
  },
  {
    "id": 2,
    "timestamp": "2026-07-09T13:20:07+00:00",
    "source_ip": "141.252.155.199",
    "event_type": "HIGH_DISK",
    "username": null
  },
  {
    "id": 3,
    "timestamp": "2026-07-09T13:20:09+00:00",
    "source_ip": "139.59.236.250",
    "event_type": "REQUEST",
    "username": null
  },
  {
    "id": 4,
    "timestamp": "2026-07-09T13:20:11+00:00",
    "source_ip": "183.10.54.87",
    "event_type": "LOGIN_SUCCESS",
    "username": "abedigram"
  }
]
```
### /api/alerts:
```JSON
[
  {
    "type": "BRUTE_FORCE",
    "severity": "HIGH",
    "source_ip": "132.50.137.216",
    "description": "132.50.137.216 adresinden 5 dakikada 8 basarisiz giris"
  }
]
```

## Kullanılan Teknolojiler
Back-end'de Python ve FastAPI kullanılmıştır, veritabanında SQLite3 yeterli görülmüştür.
Front-end'de React (Vite) ve Tailwind CSS kullanılmıştır.
