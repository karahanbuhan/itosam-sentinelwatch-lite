import React, { useState, useEffect, useMemo } from 'react';

export default function AllEventsPage({ onBack, isDarkMode, getBadgeStyle, onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Tarih Filtresi State'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sayfalama State'leri
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 300;

  // Tarih filtresi aktif mi kontrolü
  const isDateFiltered = Boolean(startDate || endDate);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', new Date(startDate).toISOString());
        if (endDate) params.append('endDate', new Date(endDate).toISOString());

        // Eğer tarih seçilmediyse varsayılan 24 saatliği (86400) koru
        if (!startDate && !endDate) params.append('before', '86400');

        const response = await fetch(`/api/events?${params.toString()}`);
        if (response.ok) setEvents(await response.json());
      } catch (error) {
        console.error('Veri akış hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Tarih filtresi aktifse interval ÇALIŞMAZ (canlı akış durur), böylece liste karışmaz.
    if (!isDateFiltered) {
      const interval = setInterval(fetchEvents, 5000);
      return () => clearInterval(interval);
    }
  }, [startDate, endDate, isDateFiltered]);

  // IP Arama ve Filtreleme Mantığı
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Tip Filtreleme
      const type = event.event_type || event.eventType || event.type;
      const matchesFilter = filter === 'ALL' || type === filter;

      // IP Arama Filtreleme
      const ip = event.source_ip || '0.0.0.0';
      const matchesSearch = ip.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [events, filter, searchTerm]);

  // Filtre/Arama değiştiğinde 1. sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, startDate, endDate]);

  const sortedEvents = useMemo(() => [...filteredEvents].reverse(), [filteredEvents]);

  // Sayfalama Hesabı
  const totalPages = Math.ceil(sortedEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedEvents, currentPage]);

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs font-bold px-3 py-2 rounded-lg border transition-all shadow-sm bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            ← Geri Dön
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tüm Olaylar ({filteredEvents.length})
            </h2>
            {isDateFiltered && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                Filtre Aktif (Canlı Akış Durduruldu)
              </span>
            )}
          </div>
        </div>

        {/* Search Bar, Tarih ve Filtreleme Alanı */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          
          {/* Tarih Aralığı Seçicileri */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-[27px] px-1.5 text-[10px] font-bold border border-slate-200 rounded outline-none bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
            />
            <span className="text-[10px] text-slate-400">-</span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-[27px] px-1.5 text-[10px] font-bold border border-slate-200 rounded outline-none bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
            />
            {isDateFiltered && (
              <button
                onClick={clearDateFilter}
                title="Tarih filtresini temizle"
                className="h-[27px] px-2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded transition-all"
              >
                ✕
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="IP Adresi Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-[35px] px-3 text-[11px] font-bold border border-slate-200 rounded-lg outline-none shadow-sm focus:border-blue-500 transition-all bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:focus:border-blue-500"
          />

          <select 
            className="filter-select h-[35px] py-1 pl-2 pr-6 text-[10px] font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">Tüm Olay Kayıtları</option>
            <option value="LOGIN_FAILED">Başarısız Girişler</option>
            <option value="LOGIN_SUCCESS">Başarılı Girişler</option>
            <option value="HIGH_CPU">Yüksek CPU</option>
            <option value="HIGH_MEMORY">Yüksek Bellek</option>
            <option value="HIGH_DISK">Yüksek Disk</option>
            <option value="BANDWIDTH_LIMIT">Bant Limiti</option>
            <option value="REQUEST">HTTP İstekleri</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Yükleniyor...</p>
      ) : (
        <>
          <div className="log-list-wrapper" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {paginatedEvents.map((event, index) => {
              const type = event.event_type || event.eventType || event.type;
              const formattedTime = event.timestamp
                ? new Date(event.timestamp).toLocaleTimeString('tr-TR')
                : '—';
              return (
                <div
                  onClick={() => onSelectEvent && onSelectEvent(event)}
                  className="log-row dark:bg-slate-950/40 dark:border-slate-800/60 cursor-pointer transition-all"
                  key={event.id || index}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className={`log-badge-base w-fit -ml-1 ${getBadgeStyle(type)}`}>
                      {type}
                    </span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      IP: <span className="text-slate-700 dark:text-slate-200 font-mono">{event.source_ip || '0.0.0.0'}</span>
                      {event.username && ` | Usr: ${event.username}`}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                    {formattedTime}
                  </span>
                </div>
              );
            })}
            {sortedEvents.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Eşleşen olay kaydı bulunamadı.</p>
            )}
          </div>

          {/* Sayfalama (Pagination) Kontrolü */}
          {sortedEvents.length > 0 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Sayfa {currentPage} / {totalPages} ({sortedEvents.length} kayıt)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-[11px]"
                >
                  Önceki
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-[11px]"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}