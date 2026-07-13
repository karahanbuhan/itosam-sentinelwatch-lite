import React, { useState, useEffect } from 'react';
import EventChart from './EventChart.jsx';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsResponse = await fetch('/api/events');
        if (eventsResponse.ok) setEvents(await eventsResponse.json());

        const alertsResponse = await fetch('/api/alerts');
        if (alertsResponse.ok) setAlerts(await alertsResponse.json());
      } catch (error) {
        console.error("Veri akış hatası:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);


  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    const type = event.event_type || event.eventType || event.type;
    return type === filter;
  });
  const sortedEvents = [...filteredEvents].reverse();

  const alertStyles = {
    HIGH: { box: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/60", icon: "bg-red-100 dark:bg-red-950/40 text-red-600", title: "text-red-800 dark:text-red-400", badge: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900", text: "Yüksek Seviye" },
    MEDIUM: { box: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/60", icon: "bg-orange-100 dark:bg-orange-950/40 text-orange-600", title: "text-orange-800 dark:text-orange-400", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900", text: "Orta Seviye" },
    LOW: { box: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60", icon: "bg-amber-100 dark:bg-amber-950/40 text-amber-600", title: "text-amber-800 dark:text-amber-400", badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 dark:border-orange-900", text: "Düşük Seviye" }
  };


  
  const getBadgeStyle = (type) => {
    const styles = {
      LOGIN_FAILED: isDarkMode ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-red-700 bg-red-50 border-red-100",
      HIGH_CPU: isDarkMode ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-700 bg-amber-50 border-amber-200/60",
      LOGIN_SUCCESS: isDarkMode ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-100",
      HIGH_MEMORY: isDarkMode ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-orange-700 bg-orange-50 border-orange-100",
      HIGH_DISK: isDarkMode ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" : "text-indigo-700 bg-indigo-50 border-indigo-100",
      BANDWIDTH_LIMIT: isDarkMode ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-700 bg-amber-50 border-amber-100",
      REQUEST: isDarkMode ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-purple-700 bg-purple-50 border-purple-100"
    };
    return styles[type] || (isDarkMode ? "text-slate-300 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-50 border-slate-200/60");
  };

  return (
    <div className="dashboard-container dark:bg-slate-950">

      <header className="main-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SentinelWatch <span className="text-blue-600 font-medium text-lg">Lite</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Sistem İzleme ve Anomali Analizi</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all shadow-sm flex items-center gap-1.5 ${
              isDarkMode ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isDarkMode ? '☀️ Açık' : '🌙 Koyu'}
          </button>

          <select 
            className="filter-select h-[34px] self-center py-1.5 text-xs font-semibold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">Tüm Olay Kayıtları</option>
            <option value="LOGIN_FAILED">Başarısız Giriş Denemeleri</option>
            <option value="LOGIN_SUCCESS">Başarılı Girişler</option>
            <option value="HIGH_CPU">Yüksek CPU Kullanımı</option>
            <option value="HIGH_MEMORY">Yüksek Bellek (RAM) Kullanımı</option>
            <option value="HIGH_DISK">Yüksek Disk Kullanımı</option>
            <option value="BANDWIDTH_LIMIT">Bant Genişliği Sınırı</option>
            <option value="REQUEST">HTTP İstekleri</option>
          </select>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {alerts.map((alert, index) => {
            const activeStyle = alertStyles[alert.severity] || alertStyles.LOW;
            return (
              <div className={`alarm-box ${activeStyle.box}`} key={alert.id || index}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg font-bold ${activeStyle.icon}`}>⚠️</div>
                  <div>
                    <span className={`font-bold text-xs uppercase tracking-wide ${activeStyle.title}`}>
                      Risk Tespit Edildi: {alert.type}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <span className={`alarm-badge ${activeStyle.badge}`}>
                  {activeStyle.text}
                </span>
              </div>
            );
          })}
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        

        <div className="lg:col-span-2 chart-card dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Olay Trafik Dağılımı</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Sisteme düşen anlık logların zaman bazlı yoğunluğu</p>
          </div>
          <div className="chart-wrapper dark:bg-slate-950 dark:border-slate-800/60">
            <EventChart events={events} isDarkMode={isDarkMode} />
          </div>
        </div>

    
        <div className="log-card dark:bg-slate-900 dark:border-slate-800">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Canlı Olay Akışı</h2>
            <span className="bg-blue-50 dark:bg-blue-950/40 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/60 text-[9px] px-2 py-0.5 rounded-md font-mono font-bold tracking-wider">
              CANLI
            </span>
          </div>

          <div className="log-list-wrapper">
            {sortedEvents.map((event, index) => {
              const type = event.event_type || event.eventType || event.type;
              const formattedTime = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('tr-TR') : '14:32';

              return (
                <div className="log-row dark:bg-slate-950/40 dark:border-slate-800/60 dark:hover:bg-slate-900 transition-all" key={event.id || index}>
                  <div className="flex flex-col gap-1.5">
                    <span className={`log-badge-base w-fit -ml-1 ${getBadgeStyle(type)}`}>{type}</span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      IP: <span className="text-slate-700 dark:text-slate-200 font-mono">{event.source_ip || '0.0.0.0'}</span> {event.username && `| Usr: ${event.username}`}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{formattedTime}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}