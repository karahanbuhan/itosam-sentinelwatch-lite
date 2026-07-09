import React, { useState, useEffect } from 'react';
import './style.css'; // CSS dosyan doğrudan bağlanıyor

export default function Dashboard() {
  // PRD standartlarına tam uyumlu React state'lerimiz
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // 5 saniyede bir tetiklenecek olan Polling fonksiyonu
    const fetchData = async () => {
      try {
        // 1. Canlı Olayları Çek (GET /api/events)
        const eventsResponse = await fetch('/api/events');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        // 2. Aktif Alarmları Çek (GET /api/alerts)
        const alertsResponse = await fetch('/api/alerts');
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      } catch (error) {
        console.error("Veri çekilirken hata oluştu, Karahan backend'i henüz açmamış olabilir", error);
      }
    };

    // Sayfa ilk açıldığında verileri hemen çekmesi için ilk tetikleme
    fetchData();

    // PRD Gereksinimi: WebSocket yok, her 5 saniyede bir polling (5000 ms)
    const interval = setInterval(fetchData, 5000);

    // Bileşen kapandığında hafıza sızıntısı olmaması için interval'i temizliyoruz
    return () => clearInterval(interval);
  }, []);

  // Dropdown filtresine göre log listesini süzüyoruz
  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    return event.eventType === filter;
  });

  return (
    <div className="dashboard-body">

      <header className="main-header">
        <div>
          <h1 className="project-title">
            SentinelWatch Lite
          </h1>
          <p className="project-subtitle">
            Sistem İzleme ve Anomali Tespit Paneli
          </p>
        </div>

        <div className="filter-container">
          <span className="filter-label">Filtre:</span>
          {/* Select değiştikçe filter state'imizi güncelliyoruz */}
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">Tüm Olaylar</option>
            <option value="LOGIN_FAILED">Başarısız Giriş</option>
            <option value="LOGIN_SUCCESS">Başarılı Giriş</option>
            <option value="HIGH_CPU">Yüksek Cpu</option>
            <option value="REQUEST">Talepler</option>
          </select>
        </div>
      </header>

      {/* Alarm Kutusunu Güncelleme Alanı */}
      {/* Backend'den aktif alarm gelirse dinamik içerik basılır, henüz bağlanmadıysa senin orijinal statik alarmın ekranda kalır */}
      {alerts.length > 0 ? (
        <div className="alarm-box">
          <div className="alarm-content">
            <span className="alarm-icon">⚠️</span>
            <div>
              <span className="alarm-title">
                Kritik Alarm: {alerts[0].type} Tespit Edildi
              </span>
              <p className="alarm-desc">
                {alerts[0].description}
              </p>
            </div>
          </div>
          <span className="alarm-badge">
            {alerts[0].severity === 'high' ? 'Yüksek Seviye' : 'Normal Seviye'}
          </span>
        </div>
      ) : (
        <div className="alarm-box">
          <div className="alarm-content">
            <span className="alarm-icon">⚠️</span>
            <div>
              <span className="alarm-title">
                Kritik Alarm: BRUTE_FORCE Tespit Edildi
              </span>
              <p className="alarm-desc">
                185.23.11.4 IP adresinden son 5 dakikada 6 başarısız giriş yapıldı.
              </p>
            </div>
          </div>
          <span className="alarm-badge">
            Yüksek Seviye
          </span>
        </div>
      )}

      <div className="main-grid">
        
        <div className="chart-card">
          <div>
            <h2 className="card-title">Olay Yoğunluğu Zaman Grafiği</h2>
            <p className="card-desc">Dakikalık bazda sisteme düşen log sayıları</p>
          </div>
          
          <div className="chart-placeholder">
            [ Recharts Çizgi Grafiği Buraya Gelecek ]
          </div>
        </div>

        <div className="log-card">
          <div className="log-header">
            <h2 className="card-title">Canlı Olay Akışı</h2>
            <span className="live-badge">CANLI</span>
          </div>

          <div className="log-list">
            {/* Backend'den dinamik veri geldiyse onları listele, yoksa ilk baştaki orijinal 3 statik logu göster */}
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => {
                let badgeClass = "badge-request";
                if (event.eventType === "LOGIN_FAILED") badgeClass = "badge-failed";
                if (event.eventType === "HIGH_CPU") badgeClass = "badge-cpu";

                const formattedTime = new Date(event.timestamp).toLocaleTimeString('tr-TR');

                return (
                  <div className="log-item" key={event.id || index}>
                    <div className="log-info">
                      <span className={badgeClass}>{event.eventType}</span>
                      <div className="log-meta">IP: {event.sourceIp} | User: {event.username || '-'}</div>
                    </div>
                    <span className="log-time">{formattedTime}</span>
                  </div>
                );
              })
            ) : (
              /* Backend bağlanana kadar arayüzün pürüzsüz durmasını sağlayan orijinal logların */
              <>
                <div className="log-item">
                  <div className="log-info">
                    <span className="badge-failed">LOGIN_FAILED</span>
                    <div className="log-meta">IP: 185.23.11.4 | User: admin</div>
                  </div>
                  <span className="log-time">14:32:10</span>
                </div>

                <div className="log-item">
                  <div className="log-info">
                    <span className="badge-request">REQUEST</span>
                    <div className="log-meta">IP: 91.44.10.2 | User: -</div>
                  </div>
                  <span className="log-time">14:32:08</span>
                </div>

                <div className="log-item">
                  <div className="log-info">
                    <span className="badge-cpu">HIGH_CPU</span>
                    <div className="log-meta">IP: 127.0.0.1 | User: system</div>
                  </div>
                  <span className="log-time">14:31:55</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}