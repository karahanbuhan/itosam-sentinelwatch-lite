import React, { useState, useEffect } from 'react';
import EventChart from './EventChart.jsx';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);


  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsResponse = await fetch('/api/events');
        if (!eventsResponse.ok) throw new Error('Olaylar çekilemedi');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        const alertsResponse = await fetch('/api/alerts');
        if (!alertsResponse.ok) throw new Error('Alarmlar çekilemedi');
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
        
        setError(null);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        setError("Sistem veri akışı kesildi. Backend bağlantısı aranıyor...");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    const type = event.eventType || event.type;
    return type === filter;
  });

  const sortedEvents = [...filteredEvents].reverse();

  return (
   
    <div className="dashboard-container">
  
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
              isDarkMode 
                ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isDarkMode ? '☀️ Açık' : '🌙 Koyu'}
          </button>

          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">Tüm Olay Kayıtları</option>
            <option value="LOGIN_FAILED">Başarısız Girişler</option>
            <option value="LOGIN_SUCCESS">Başarılı Girişler</option>
            <option value="HIGH_CPU">Yüksek CPU Yükü</option>
            <option value="REQUEST">HTTP Talepleri</option>
          </select>
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs rounded-xl p-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {alerts.length > 0 ? (
        <div className="alarm-box">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600 font-bold">⚠️</div>
            <div>
              <span className="font-bold text-red-800 dark:text-red-400 text-xs uppercase tracking-wide">Kritik Durum: {alerts[0].type}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{alerts[0].description}</p>
            </div>
          </div>
          <span className="alarm-badge">{alerts[0].severity} İhlal</span>
        </div>
      ) : (
        <div className="alarm-box">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600 font-bold">⚠️</div>
            <div>
              <span className="font-bold text-red-800 dark:text-red-400 text-xs uppercase tracking-wide">Kritik Alarm: BRUTE_FORCE</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">185.23.11.4 IP adresinden son 5 dakikada çok sayıda hatalı giriş saptandı.</p>
            </div>
          </div>
          <span className="alarm-badge">Yüksek Seviye</span>
        </div>
      )}

    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
       
        <div className="lg:col-span-2 chart-card">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Olay Trafik Dağılımı</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Sisteme düşen anlık logların zaman bazlı yoğunluğu</p>
          </div>
          <div className="chart-wrapper">
            <EventChart events={events} isDarkMode={isDarkMode} />
          </div>
        </div>

       
        <div className="log-card">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Canlı Olay Akışı</h2>
            <span className="bg-blue-50 text-green-600 border border-green-100 text-[9px] px-2 py-0.5 rounded-md font-mono font-bold tracking-wider">
              CANLI
            </span>
          </div>

          <div className="log-list-wrapper">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event, index) => {
                const type = event.event_type || event.type;
                let badgeStyle = isDarkMode ? "text-slate-300 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-50 border-slate-200/60";
                if (type === "LOGIN_FAILED") badgeStyle = isDarkMode ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-red-700 bg-red-50 border-red-100";
                if (type === "HIGH_CPU") badgeStyle = isDarkMode ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-700 bg-amber-50 border-amber-200/60";
                if (type === "LOGIN_SUCCESS") badgeStyle = isDarkMode ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-100";
                if (type === "HIGH_MEMORY") badgeStyle = isDarkMode ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-orange-700 bg-orange-50 border border-orange-100";
                if (type === "HIGH_DISK") badgeStyle = isDarkMode ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" : "text-indigo-700 bg-indigo-50 border border-indigo-100";
                if (type === "BANDWIDTH_LIMIT") badgeStyle = isDarkMode ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-700 bg-amber-50 border border-amber-100";
                if (type === "REQUEST") badgeStyle = isDarkMode ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-purple-700 bg-purple-50 border border-purple-100";

                const formattedTime = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('tr-TR') : '14:32';

                return (
                  <div className="log-row" key={event.id || index}>
                    <div className="flex flex-col gap-1.5">
                      <span className={`log-badge-base w-fit -ml-1 ${badgeStyle}`}>{type}</span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        IP: <span className="text-slate-700 dark:text-slate-200 font-mono">{event.source_ip || '0.0.0.0'}</span> {event.username && `| Usr: ${event.username}`}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{formattedTime}</span>
                  </div>
                );
              })
            ) : (
              
              <>
                <div className="log-row">
                  <div className="flex flex-col gap-1.5">
                    <span className={`log-badge-base w-fit -ml-2 ${isDarkMode ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-700 bg-red-50 border-red-100'}`}>LOGIN_FAILED</span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">IP: 185.23.11.4 | Usr: admin</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">14:32:10</span>
                </div>
                <div className="log-row">
                  <div className="flex flex-col gap-1.5">
                    <span className={`log-badge-base w-fit -ml-2 ${isDarkMode ? 'text-slate-300 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200/60'}`}>REQUEST</span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">IP: 91.44.10.2 | Usr: -</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">14:32:08</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}