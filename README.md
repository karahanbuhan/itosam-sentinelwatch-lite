# SentinelWatch Lite
SentinelWatch Lite, bir sisteme ait olay kayıtlarını (log/event) periyodik olarak izleyen, basit ama gerçek kurallara göre şüpheli davranışları (ör. brute-force giriş denemesi, anormal istek yoğunluğu) tespit eden ve bunları düzenli aralıklarla güncellenen bir dashboard üzerinde gösteren bir izleme panelidir.

## Ekran Görüntüleri
<img width="1267" height="692" alt="Screenshot 2026-07-13 171317" src="https://github.com/user-attachments/assets/c9f22c1a-2525-4065-9b33-1aa215be8b8e" />
<img width="1267" height="695" alt="Screenshot 2026-07-13 171409" src="https://github.com/user-attachments/assets/d98da461-2a15-4d04-8669-f93e1d83cf85" />

## Kullanılan Teknolojiler
- FastAPI (Python)
- SQLite3 (Alembic)
- React (Vite)
- Tailwind CSS

## Uç Noktalar
### /api/events (GET): 
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
Bu uç noktayı kullanırken iki opsiyonel parametre mevcuttur:
| Kullanım örneği  | Yaptığı iş |
| ------------- | ------------- |
| /api/events?before=300  | Son 5 dakika içerisinde oluşan olayları getirir  |
| /api/events?type=LOGIN_FAILED  | Sadece başarısız giriş olaylarını getirir  |
| /api/events?before=600&type=HIGH_CPU  | Son 10 dakikadaki yüksek CPU kullanım olaylarını getirir  |

### /api/alerts (GET):
```JSON
[
  ...
  {
    "rule_id": 2,
    "rule_name": "Trafik Artışı",
    "timestamp": "2026-07-24T07:14:43+00:00",
    "description": "Son 60 saniyede 105 adet Trafik Artışı kuralı tetiklendi",
    "event_count": 105,
    "event_type": "*",
    "username": null,
    "severity": "MEDIUM",
    "is_resolved": false
  },
  {
    "rule_id": 3,
    "rule_name": "Yüksek CPU Kullanımı",
    "timestamp": "2026-07-24T07:14:43+00:00",
    "description": "Son 120 saniyede 13 adet Yüksek CPU Kullanımı kuralı tetiklendi",
    "event_count": 13,
    "event_type": "HIGH_CPU",
    "username": null,
    "severity": "LOW",
    "is_resolved": false
  }
  ...
]
```

### /api/alerts/history (GET):
Tüm oluşmuş uyarıları liste halinde döndürür, örnek şu şekilde gözükmektedir:
```JSON
[
...
  {
    "id": 28,
    "rule_id": 1,
    "timestamp": "2026-07-24T06:32:01+00:00",
    "source_ip": "162.42.25.119",
    "description": "Son 300 saniyede 7 adet Brute Force Girişi kuralı tetiklendi",
    "is_resolved": 0
  },
  {
    "id": 29,
    "rule_id": 2,
    "timestamp": "2026-07-24T06:32:01+00:00",
    "source_ip": null,
    "description": "Son 60 saniyede 118 adet Trafik Artışı kuralı tetiklendi",
    "is_resolved": 0
  },
  {
    "id": 30,
    "rule_id": 3,
    "timestamp": "2026-07-24T06:32:01+00:00",
    "source_ip": null,
    "description": "Son 120 saniyede 35 adet Yüksek CPU Kullanımı kuralı tetiklendi",
    "is_resolved": 0
  }
...
]
```

### /api/alerts/{id}/resolve (PATCH):
İstenilen uyarının is_resolved alanını 1 yapar, çözülmüş ve okunmuş uyarılar içindir.

### /api/demo/{dos | brute-force} (GET):
DoS saldırısı ve Brute Force saldırılarını manuel olarak simüle etmeyi sağlar. **Bu uç noktanın çalışabilmesi için programdaki demo değişkeninin True değerinde olması gerekmektedir.**

### /api/rules (GET):
Mevcut tüm kuralları döndürür. Uyarılar bu kurallar ile oluşur, varsayılan kurallar şekilde gözükmektedir:
```JSON
[
  {
    "id": 1,
    "name": "Brute Force Girişi",
    "event_type": "LOGIN_FAILED",
    "threshold_count": 5,
    "time_window_seconds": 300,
    "severity": "HIGH",
    "is_same_ip_check": 1,
    "is_active": 1
  },
  {
    "id": 2,
    "name": "Trafik Artışı",
    "event_type": "*",
    "threshold_count": 100,
    "time_window_seconds": 60,
    "severity": "MEDIUM",
    "is_same_ip_check": 0,
    "is_active": 1
  },
  {
    "id": 3,
    "name": "Yüksek CPU Kullanımı",
    "event_type": "HIGH_CPU",
    "threshold_count": 3,
    "time_window_seconds": 120,
    "severity": "LOW",
    "is_same_ip_check": 0,
    "is_active": 1
  }
]
```

## Kurulum & Çalıştırma
SentinelWatch Lite sistemi, backend ve frontend olmak üzere iki ayrı sunucudan oluşmaktadır. Backend API sunucusu FastAPI (Python), frontend sunucusu ise React (Vite) ile geliştirilmiştir. Öncelikle gerekli kütüphane ve framework'ler yüklenir ve sonrasında iki sunucu ayrı ayrı çalıştırılır.
### Backend
0. Bilgisayarınıza gerekli yazılımları yükleyin.
Backend sunucusunu ayağa kaldırabilmek için bilgisayarınızda **git** ve **Python** yazılımlarının yüklü olması gerekmektedir. Proje geliştirilirken *git v2.53.0* ve *Python 3.14.3* kullanılmıştır ve minimum bu sürümlerin kullanılması tavsiye edilir.
- https://git-scm.com/install/
- https://www.python.org/downloads/

*Bir terminal/konsol açıp aşağıdaki komutları yazmadan önce gerekli yazılımları yüklediğinize emin olun. Terminal açıkken yükleme yaparsanız, terminal yeniden başlatılana kadar gerekli komutlar çevre değişkenlerinden okunmayacağı için komut bulunamadı hatasıyla karşılaşabilirsiniz.*

1. Projeyi bilgisayarınıza klonlayın ve klonladığınız projenin içine girin.
```bash
git clone https://github.com/karahanbuhan/itosam-sentinelwatch-lite.git
cd itosam-sentinelwatch-lite
```
2. Bir venv ortamı oluşturun. (Bazı kurulumlarda python yerine python3 yazmanız gerekebilir.)
```bash
python -m venv .
```
3. Öncelikle venv ortamını aktif edin.
```bash
.\Scripts\activate
```
4. Gerekli Python kütüphanelerini yükleyin.
```bash
python -m pip install -r ./requirements.txt
```
5. Alembic ile gerekli veritabanı migrasyonlarını çalıştırın.
```bash
alembic upgrade head
```
6. Sunucuyu FastAPI ile başlatın.
```bash
python -m fastapi dev ./src/main.py
```
### Frontend
0. Backend kurulum aşamasını tamamlayın ve bilgisayarınıza gerekli yazılımları yükleyin.
Frontend sunucusunda React (Vite) kullanılmaktadır ve kurulumun yapılabilmesi ve sunucunun çalıştırılabilmesi için **npm** kullanılmaktadır. Proje geliştirilirken *npm 11.16.0* kullanılmıştır, minimum bu sürümün ve Windows için kurulum yaparken NodeJS Installer kullanılması tavsiye edilir.
- https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
1. Frontend klasörünün içine girin.
```bash
cd frontend
```
2. Proje için gerekli paketleri yükleyin.
```bash
npm install
```
3. Sunucuyu başlatın.
```bash
npm run dev
```
