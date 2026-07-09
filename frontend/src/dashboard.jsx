import React, { useState, useEffect } from 'react';
import EventChart from './EventChart.jsx';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsResponse = await fetch('/api/events');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        const alertsResponse = await fetch('/api/alerts');
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      } catch (error) {
        console.error("Veri çekilirken hata oluştu, Karahan backend'i henüz açmamış olabilir", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    return event.eventType === filter;
  });

  const sortedEvents = [...filteredEvents].reverse();

  return (
    <div className="dashboard-container">

      <header className="main-header">
        <div>
          <h1 className="baslik">SentinelWatch Lite</h1>
          <p className="text-xs text-gray-500 mt-0.5">Sistem İzleme ve Anomali Tespit Paneli</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Filtre:</span>
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">Tüm Olaylar</option>
            <option value="LOGIN_FAILED">Başarısız Giriş</option>
            <option value="LOGIN_SUCCESS">Başarılı Giriş</option>
            <option value="HIGH_CPU">Yüksek Cpu</option>
            <option value="REQUEST">Talepler</option>
          </select>
        </div>
      </header>

      {alerts.length > 0 ? (
        <div className="alarm-box">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">⚠️</span>
            <div>
              <span className="font-bold text-red-800 text-sm">Kritik Alarm: {alerts[0].type} Tespit Edildi</span>
              <p className="text-xs text-red-700 mt-0.5">{alerts[0].description}</p>
            </div>
          </div>
          <span className="alarm-badge">
            {alerts[0].severity === 'high' ? 'Yüksek Seviye' : 'Normal Seviye'}
          </span>
        </div>
      ) : (
        <div className="alarm-box">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">⚠️</span>
            <div>
              <span className="font-bold text-red-800 text-sm">Kritik Alarm: BRUTE_FORCE Tespit Edildi</span>
              <p className="text-xs text-red-700 mt-0.5">185.23.11.4 IP adresinden son 5 dakikada 10 başarısız giriş yapıldı.</p>
            </div>
          </div>
          <span className="alarm-badge">Yüksek Seviye</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="chart-card">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Olay Yoğunluğu Zaman Grafiği</h2>
            <p className="text-xs text-gray-400 mt-0.5">Dakikalık bazda sisteme düşen log sayıları</p>
          </div>
          <div className="chart-wrapper">
            <EventChart events={events} />
          </div>
        </div>

        <div className="log-card">
          <div className="border-b border-gray-100 pb-2 mb-3 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900">Canlı Olay Akışı</h2>
            <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">CANLI</span>
          </div>

          <div className="log-list-wrapper">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event, index) => {
                let badgeStyle = "text-gray-600 bg-gray-100 border-gray-200";
                if (event.eventType === "LOGIN_FAILED") badgeStyle = "text-red-600 bg-red-50 border-red-100";
                if (event.eventType === "HIGH_CPU") badgeStyle = "text-amber-600 bg-amber-50 border-amber-100";

                const formattedTime = new Date(event.timestamp).toLocaleTimeString('tr-TR');

                return (
                  <div className="log-row" key={event.id || index}>
                    <div className="flex flex-col gap-1">
                      <span className={`log-badge-base ${badgeStyle}`}>{event.eventType}</span>
                      <div className="text-xs text-gray-500 font-medium">
                        IP: {event.sourceIp} | User: {event.username || '-'}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{formattedTime}</span>
                  </div>
                );
              })
            ) : (
              <>
                <div className="log-row">
                  <div className="flex flex-col gap-1">
                    <span className="log-badge-base text-red-600 bg-red-50 border-red-100">LOGIN_FAILED</span>
                    <div className="text-xs text-gray-500 font-medium">IP: 185.23.11.4 | User: admin</div>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">14:32:10</span>
                </div>

                <div className="log-row">
                  <div className="flex flex-col gap-1">
                    <span className="log-badge-base text-gray-600 bg-gray-100 border-gray-200">REQUEST</span>
                    <div className="text-xs text-gray-500 font-medium">IP: 91.44.10.2 | User: -</div>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">14:32:08</span>
                </div>

                <div className="log-row">
                  <div className="flex flex-col gap-1">
                    <span className="log-badge-base text-amber-600 bg-amber-50 border-amber-100">HIGH_CPU</span>
                    <div className="text-xs text-gray-500 font-medium">IP: 127.0.0.1 | User: system</div>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">14:31:55</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}