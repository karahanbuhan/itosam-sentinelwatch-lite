import React, { useState, useEffect } from 'react';
import './style.css';

export default function Dashboard() {
  // PRD'de anlaşılan API formatına göre state'lerimizi tanımlıyoruz
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
        console.error("Veri çekilirken hata oluştu kanka, yerel sahte veriler yükleniyor:", error);
        
        // Backend henüz bağlanmadıysa ekranın boş kalmaması için PRD formatında örnek veriler basıyoruz:
        setEvents([
          { id: 1, eventType: "LOGIN_FAILED", sourceIp: "185.23.11.4", username: "admin", timestamp: new Date().toISOString() },
          { id: 2, eventType: "REQUEST", sourceIp: "91.44.10.2", username: "", timestamp: new Date().toISOString() },
          { id: 3, eventType: "HIGH_CPU", sourceIp: "127.0.0.1", username: "system", timestamp: new Date().toISOString() }
        ]);
        setAlerts([
          { type: "BRUTE_FORCE", description: "185.23.11.4 IP adresinden son 5 dakikada 6 başarısız giriş yapıldı.", severity: "high" }
        ]);
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
      
      {/* 1. ÜST BAŞLIK VE FİLTRE BARIDIR */}
      <header className="main-header">
        <div>
          <h1 className="project-title">SentinelWatch Lite</h1>
          <p className="project-subtitle">Sistem İzleme ve Anomali Tespit Paneli</p>
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

      {/* 2. DİNAMİK ALARM KUTUSU */}
      {/* Backend'den veya yerel veriden aktif bir alarm gelirse (boş liste değilse) render et */}
      {alerts.length > 0 && (
        <div className="alarm-box">
          <div className="alarm-content">
            <span className="alarm-icon">⚠️</span>
            <div>
              <span className="alarm-title">
                Kritik Alarm: {alerts[0].type} Tespit Edildi
              </span>
              <p className="alarm-desc">{alerts[0].description}</p>
            </div>
          </div>
          <span className="alarm-badge">
            {alerts[0].severity === 'high' ? 'Yüksek Seviye' : 'Normal Seviye'}
          </span>
        </div>
      )}

      {/* 3. PANEL İÇERİĞİ (GRAFİK & LİSTE) */}
      <div className="main-grid">
        
        {/* GRAFİK KARTI (Sol Taraf) */}
        <div className="chart-card">
          <div>
            <h2 className="card-title">Olay Yoğunluğu Zaman Grafiği</h2>
            <p className="card-desc">Dakikalık bazda sisteme düşen log sayıları</p>
          </div>
          
          <div className="chart-placeholder">
            {/* 2. Hafta buraya gerçek Recharts kütüphanesini gömeceğiz */}
            [ Recharts Çizgi Grafiği Buraya Gelecek ]
          </div>
        </div>

        {/* CANLI LOG LİSTESİ KARTI (Sağ Taraf) */}
        <div className="log-card">
          <div className="log-header">
            <h2 className="card-title">Canlı Olay Akışı</h2>
            <span className="live-badge">CANLI</span>
          </div>

          <div className="log-list">
            {/* Filtrelenmiş logları dinamik olarak listeliyoruz */}
            {filteredEvents.map((event) => {
              // Dinamik class ismini olay tipine göre seçiyoruz
              let badgeClass = "badge-request";
              if (event.eventType === "LOGIN_FAILED") badgeClass = "badge-failed";
              if (event.eventType === "HIGH_CPU") badgeClass = "badge-cpu";

              // ISO Saat formatını (2026-07-06T14:32:10Z) sadece saate (14:32:10) çeviriyoruz
              const formattedTime = new Date(event.timestamp).toLocaleTimeString('tr-TR');

              return (
                <div className="log-item" key={event.id}>
                  <div className="log-info">
                    <span className={badgeClass}>{event.eventType}</span>
                    <div className="log-meta">
                      IP: {event.sourceIp} | User: {event.username || '-'}
                    </div>
                  </div>
                  <span className="log-time">{formattedTime}</span>
                </div>
              );
            })}

            {/* Eğer filtreye uygun hiç log yoksa kullanıcıya bilgi ver */}
            {filteredEvents.length === 0 && (
              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '20px' }}>
                Gösterilecek olay kaydı bulunamadı kanka.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}