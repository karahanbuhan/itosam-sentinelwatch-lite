import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import EventChart from './EventChart.jsx';

// Ayrı "Tüm Eventler" sayfasını, kullanıcı gerçekten oraya gitmek isteyene kadar
// ana bundle'a dahil etmiyoruz (code-splitting) - anasayfanın ilk yükünü hafifletir.
const AllEventsPage = lazy(() => import('./AllEventsPage.jsx'));

export default function Dashboard() {
  // Canlı Olay Akışı ve grafik artık backend'den TÜM geçmişi değil, sadece
  // son 30 dakikayı çekiyor. Zaman geçtikçe eski kayıtlar backend'in kendi
  // "before" penceresinden düşüyor, liste kendini sürekli güncel tutuyor.
  // Tüm geçmişe bakmak isteyenler "Tüm Eventleri Gör" ile ayrı sayfaya gidiyor.
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAllEventsPage, setShowAllEventsPage] = useState(false);

  // Faz 2 (PRD v2): Dinamik Kural Motoru
  const [rules, setRules] = useState([]);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleEventType, setNewRuleEventType] = useState('LOGIN_FAILED');
  const [newRuleThreshold, setNewRuleThreshold] = useState('');
  const [newRuleWindow, setNewRuleWindow] = useState('');
  const [newRuleSeverity, setNewRuleSeverity] = useState('medium');
  const [isSavingRule, setIsSavingRule] = useState(false);

  // Alarm geçmişi filtreleri (/api/alerts/history sözleşmesindeki severity/isResolved/from/to)
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('ALL');
  const [alertResolvedFilter, setAlertResolvedFilter] = useState('unresolved');
  const [alertFromDate, setAlertFromDate] = useState('');
  const [alertToDate, setAlertToDate] = useState('');

  const loadRules = async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) setRules(await res.json());
    } catch (error) {
      console.error('Kurallar çekilemedi:', error);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsResponse = await fetch('/api/events?before=1800');
        if (eventsResponse.ok) {
          const data = await eventsResponse.json();
          // Backend'in "before" davranışına bağlı kalmadan, istemci tarafında da
          // gerçek zamana göre son 30 dakikayı zorluyoruz. Böylece zaman ilerledikçe
          // eskiyen kayıtlar backend ne dönerse dönsün listeden görsel olarak düşüyor.
          const cutoff = Date.now() - 30 * 60 * 1000;
          const recentEvents = data.filter(ev => {
            const t = ev.timestamp ? new Date(ev.timestamp).getTime() : NaN;
            return !isNaN(t) && t >= cutoff;
          });
          setEvents(recentEvents);
        }

        const alertParams = new URLSearchParams();
        if (alertSeverityFilter !== 'ALL') alertParams.set('severity', alertSeverityFilter);
        if (alertResolvedFilter === 'unresolved') alertParams.set('isResolved', 'false');
        if (alertFromDate) alertParams.set('from', new Date(alertFromDate).toISOString());
        if (alertToDate) alertParams.set('to', new Date(alertToDate).toISOString());
        const alertsResponse = await fetch(`/api/alerts/history?${alertParams.toString()}`);
        if (alertsResponse.ok) setAlerts(await alertsResponse.json());
      } catch (error) {
        console.error("Veri akış hatası:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [alertSeverityFilter, alertResolvedFilter, alertFromDate, alertToDate]);

  const filteredEvents = useMemo(() => events.filter(event => {
    if (filter === 'ALL') return true;
    const type = event.event_type || event.eventType || event.type;
    return type === filter;
  }), [events, filter]);

  const sortedEvents = useMemo(() => [...filteredEvents].reverse(), [filteredEvents]);

  const filteredChartEvents = filteredEvents;

  const [selectedAlertKey, setSelectedAlertKey] = useState(null);
  const [selectedEventKey, setSelectedEventKey] = useState(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Ana ekranda her alarm tipinden en fazla 5 tane gösteriyoruz, fazlası
  // "Daha Fazla Göster" ile açılan ayrı sayfada listeleniyor.
  const MAX_ALERTS_PER_TYPE = 5;
  const displayedAlerts = useMemo(() => {
    const countByRule = {};
    const result = [];
    for (const alert of alerts) {
      const key = alert.ruleName || alert.rule_id || alert.ruleId || 'diger';
      countByRule[key] = (countByRule[key] || 0) + 1;
      if (countByRule[key] <= MAX_ALERTS_PER_TYPE) {
        result.push(alert);
      }
    }
    return result;
  }, [alerts]);
  const hasMoreAlerts = alerts.length > displayedAlerts.length;

  // Rules tablosundan (dinamik, artık kod içinde sabit değil) kural -> izlenen olay tipi
  // haritasını çıkarıyoruz. Hem ruleId hem ruleName ile eşleştirebiliyoruz çünkü
  // /api/alerts/history yanıtı örneğinde sadece ruleName var, ruleId opsiyonel.
  const ruleEventTypeById = useMemo(() => {
    const map = {};
    rules.forEach(r => {
      const type = r.event_type || r.eventType;
      if (r.id != null && type) map[r.id] = type;
    });
    return map;
  }, [rules]);

  const ruleEventTypeByName = useMemo(() => {
    const map = {};
    rules.forEach(r => {
      const type = r.event_type || r.eventType;
      if (r.name && type) map[r.name] = type;
    });
    return map;
  }, [rules]);

  const selectedAlert = selectedAlertKey != null
    ? alerts.find((a, i) => (a.id ?? i) === selectedAlertKey)
    : null;
  const selectedAlertIp = selectedAlert ? (selectedAlert.sourceIp ?? selectedAlert.source_ip ?? null) : null;
  const selectedAlertRuleId = selectedAlert ? (selectedAlert.ruleId ?? selectedAlert.rule_id ?? null) : null;
  const selectedAlertEventType = selectedAlert && !selectedAlertIp
    ? (selectedAlertRuleId != null ? ruleEventTypeById[selectedAlertRuleId] : null) || ruleEventTypeByName[selectedAlert.ruleName]
    : null;

  const isEventMatchingSelectedAlert = (event) => {
    if (!selectedAlert) return false;
    const type = event.event_type || event.eventType || event.type;
    if (selectedAlertIp) return event.source_ip === selectedAlertIp;
    if (selectedAlertEventType) return type === selectedAlertEventType;
    return false;
  };

  const selectedEvent = selectedEventKey != null
    ? sortedEvents.find((e, i) => (e.id ?? i) === selectedEventKey)
    : null;

  // "Tüm Eventleri Gör" sayfasından tıklanan olay, ana ekranın kendi 30 dakikalık
  // penceresinde olmayabilir; bu yüzden onu sortedEvents içinde aramak yerine
  // tıklanan olayın tamamını doğrudan burada saklıyoruz.
  const [externalHighlightEvent, setExternalHighlightEvent] = useState(null);

  const highlightedEvents = useMemo(() => (
    externalHighlightEvent
      ? [externalHighlightEvent]
      : (selectedEvent
        ? [selectedEvent]
        : (selectedAlert ? events.filter(isEventMatchingSelectedAlert) : []))
  ), [externalHighlightEvent, selectedEvent, selectedAlert, selectedAlertIp, selectedAlertEventType, events]);
  const highlightedTimestamps = useMemo(
    () => highlightedEvents.map(e => e.timestamp).filter(Boolean),
    [highlightedEvents]
  );

  // Sağdaki mini istatistik kartı için özet sayılar - sadece ilgili veriler değiştiğinde yeniden hesaplanır.
  const riskyEventTypes = ['LOGIN_FAILED', 'HIGH_CPU', 'HIGH_MEMORY', 'HIGH_DISK', 'BANDWIDTH_LIMIT'];
  const eventStats = useMemo(() => {
    const total = events.length;
    const risky = events.filter(ev => {
      const type = ev.event_type || ev.eventType || ev.type;
      return riskyEventTypes.includes(type);
    }).length;
    const highAlerts = alerts.filter(a => (a.severity || '').toLowerCase() === 'high').length;
    const mediumAlerts = alerts.filter(a => (a.severity || '').toLowerCase() === 'medium').length;
    const lowAlerts = alerts.filter(a => (a.severity || '').toLowerCase() === 'low').length;
    return { total, risky, totalAlerts: alerts.length, highAlerts, mediumAlerts, lowAlerts };
  }, [events, alerts]);

  useEffect(() => {
    if (!selectedAlert) return;
    const target = document.querySelector('[data-matched-alert="true"]');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedAlertKey, sortedEvents]);

  const alertStyles = {
    HIGH: { box: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/60", icon: "bg-red-100 dark:bg-red-950/40 text-red-600", title: "text-red-800 dark:text-red-400", badge: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900", text: "Yüksek Seviye" },
    MEDIUM: { box: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/60", icon: "bg-orange-100 dark:bg-orange-950/40 text-orange-600", title: "text-orange-800 dark:text-orange-400", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900", text: "Orta Seviye" },
    LOW: { box: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60", icon: "bg-amber-100 dark:bg-amber-950/40 text-amber-600", title: "text-amber-800 dark:text-amber-400", badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 dark:border-orange-900", text: "Düşük Seviye" }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!newRuleName || !newRuleThreshold || !newRuleWindow) return;
    setIsSavingRule(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRuleName,
          eventType: newRuleEventType,
          thresholdCount: Number(newRuleThreshold),
          timeWindowSeconds: Number(newRuleWindow),
          severity: newRuleSeverity,
        }),
      });
      if (res.ok) {
        setNewRuleName('');
        setNewRuleThreshold('');
        setNewRuleWindow('');
        setNewRuleSeverity('medium');
        await loadRules();
      }
    } catch (error) {
      console.error('Kural oluşturulamadı:', error);
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleToggleRule = async (rule) => {
    const currentlyActive = rule.is_active ?? rule.isActive ?? true;
    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      if (res.ok) {
        setRules(prev => prev.map(r => (r.id === rule.id ? { ...r, is_active: !currentlyActive, isActive: !currentlyActive } : r)));
      }
    } catch (error) {
      console.error('Kural güncellenemedi:', error);
    }
  };

  const handleResolveAlert = async (alertId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' });
      if (res.ok) {
        setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, isResolved: true, is_resolved: true } : a)));
      }
    } catch (error) {
      console.error('Alarm çözümlenemedi:', error);
    }
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

      {/* Sadece Başlığın yer aldığı sadeleştirilmiş Header */}
      <header className="main-header sticky top-0 z-20 bg-[#f8fafc]/95 dark:bg-[#0f172a]/95 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SentinelWatch <span className="text-blue-600 font-medium text-lg">Lite</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Sistem İzleme ve Anomali Analizi</p>
        </div>
        <button
          onClick={() => setShowRulesPanel(true)}
          className="text-xs font-bold px-3 py-2 rounded-lg border transition-all shadow-sm bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          ⚙ Kural Yönetimi
        </button>
      </header>

      {showAllEventsPage ? (
        <Suspense fallback={<div className="text-sm text-slate-400 dark:text-slate-500 px-1 py-6">Yükleniyor...</div>}>
          <AllEventsPage
            isDarkMode={isDarkMode}
            getBadgeStyle={getBadgeStyle}
            onBack={() => setShowAllEventsPage(false)}
            onSelectEvent={(event) => {
              setExternalHighlightEvent(event);
              setSelectedEventKey(null);
              setSelectedAlertKey(null);
              setShowAllEventsPage(false);
            }}
          />
        </Suspense>
      ) : showAllAlerts ? (
        <div className="mb-6">
          <button
            onClick={() => setShowAllAlerts(false)}
            className="text-xs font-bold px-3 py-2 rounded-lg border transition-all shadow-sm mb-4 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            ← Geri Dön
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Tüm Alarmlar ({alerts.length})
          </h2>
          <div className="flex flex-col gap-3">
            {alerts.map((alert, index) => {
              const activeStyle = alertStyles[(alert.severity || '').toUpperCase()] || alertStyles.LOW;
              const alertKey = alert.id ?? index;
              const isSelected = selectedAlertKey === alertKey;
              const isResolved = alert.isResolved ?? alert.is_resolved ?? false;
              return (
                <div
                  onClick={() => {
                    setSelectedAlertKey(alertKey);
                    setSelectedEventKey(null);
                    setExternalHighlightEvent(null);
                    setShowAllAlerts(false);
                  }}
                  className={`alarm-box cursor-pointer transition-all ${activeStyle.box} ${
                    isSelected ? 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-950' : ''
                  } ${isResolved ? 'opacity-50' : ''}`}
                  key={alertKey}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg font-bold ${activeStyle.icon}`}>⚠️</div>
                    <div>
                      <span className={`font-bold text-xs uppercase tracking-wide ${activeStyle.title}`}>
                        Risk Tespit Edildi: {alert.ruleName || 'Bilinmeyen Kural'}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`alarm-badge ${activeStyle.badge}`}>
                      {activeStyle.text}
                    </span>
                    {isResolved ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border text-slate-400 border-slate-200 dark:border-slate-700 dark:text-slate-500">
                        Çözüldü
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleResolveAlert(alert.id, e)}
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-all bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                      >
                        İncelendi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : showRulesPanel ? (
        <div className="mb-6">
          <button
            onClick={() => setShowRulesPanel(false)}
            className="text-xs font-bold px-3 py-2 rounded-lg border transition-all shadow-sm mb-4 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            ← Geri Dön
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Kural Yönetimi
          </h2>

          <form
            onSubmit={handleCreateRule}
            className="flex flex-col sm:flex-row flex-wrap gap-2 mb-6 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <select
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              required
              className="filter-select flex-1 min-w-[200px] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            >
              <option value="" disabled>Kural adı seçin</option>
              <option value="Brute Force Girişi">Brute Force Girişi</option>
              <option value="Anormal Trafik Artışı">Anormal Trafik Artışı</option>
              <option value="Yüksek CPU Kullanımı">Yüksek CPU Kullanımı</option>
              <option value="Yüksek Bellek Kullanımı">Yüksek Bellek Kullanımı</option>
              <option value="Yüksek Disk Kullanımı">Yüksek Disk Kullanımı</option>
              <option value="Bant Genişliği Aşımı">Bant Genişliği Aşımı</option>
            </select>
            <select
              value={newRuleEventType}
              onChange={(e) => setNewRuleEventType(e.target.value)}
              className="filter-select dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            >
              <option value="LOGIN_FAILED">Başarısız Girişler</option>
              <option value="LOGIN_SUCCESS">Başarılı Girişler</option>
              <option value="HIGH_CPU">Yüksek CPU</option>
              <option value="HIGH_MEMORY">Yüksek Bellek</option>
              <option value="HIGH_DISK">Yüksek Disk</option>
              <option value="BANDWIDTH_LIMIT">Bant Limiti</option>
              <option value="REQUEST">HTTP İstekleri</option>
            </select>
            <input
              type="number"
              min="1"
              placeholder="Eşik (adet)"
              value={newRuleThreshold}
              onChange={(e) => setNewRuleThreshold(e.target.value)}
              required
              className="filter-select w-32 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            />
            <input
              type="number"
              min="1"
              placeholder="Pencere (sn)"
              value={newRuleWindow}
              onChange={(e) => setNewRuleWindow(e.target.value)}
              required
              className="filter-select w-32 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            />
            <select
              value={newRuleSeverity}
              onChange={(e) => setNewRuleSeverity(e.target.value)}
              className="filter-select dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
            <button
              type="submit"
              disabled={isSavingRule}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 shrink-0"
            >
              {isSavingRule ? 'Ekleniyor...' : '+ Kural Ekle'}
            </button>
          </form>

          <div className="flex flex-col gap-3">
            {rules.map((rule) => {
              const active = rule.is_active ?? rule.isActive ?? true;
              const eventType = rule.event_type || rule.eventType;
              const threshold = rule.threshold_count ?? rule.thresholdCount;
              const windowSeconds = rule.time_window_seconds ?? rule.timeWindowSeconds;
              return (
                <div className="alarm-box" key={rule.id}>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-200">
                      {rule.name}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {eventType} · eşik {threshold} · {windowSeconds} sn pencere · {rule.severity}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {active ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
              );
            })}
            {rules.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">Henüz kural tanımlanmamış.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Alarm Kutuları (kural başına en fazla 5) - grid'in ilk hücresi, her zaman render edilir ki hizalama bozulmasın */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <select
                value={alertSeverityFilter}
                onChange={(e) => setAlertSeverityFilter(e.target.value)}
                className="filter-select h-[30px] leading-[28px] px-2.5 py-0 text-[10px] font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
              >
                <option value="ALL">Tüm Seviyeler</option>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="datetime-local"
                  value={alertFromDate}
                  onChange={(e) => setAlertFromDate(e.target.value)}
                  className="h-[27px] px-1.5 text-[10px] font-bold border border-slate-200 rounded outline-none bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                />
                <span className="text-[10px] text-slate-400">-</span>
                <input
                  type="datetime-local"
                  value={alertToDate}
                  onChange={(e) => setAlertToDate(e.target.value)}
                  className="h-[27px] px-1.5 text-[10px] font-bold border border-slate-200 rounded outline-none bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                />
                {(alertFromDate || alertToDate) && (
                  <button
                    onClick={() => { setAlertFromDate(''); setAlertToDate(''); }}
                    title="Tarih filtresini temizle"
                    className="h-[27px] px-2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>

              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertResolvedFilter === 'unresolved'}
                  onChange={(e) => setAlertResolvedFilter(e.target.checked ? 'unresolved' : 'all')}
                />
                Sadece çözülmemiş
              </label>
            </div>
            <div className="alarm-list-wrapper flex flex-col gap-3">
              {displayedAlerts.map((alert, index) => {
                const activeStyle = alertStyles[(alert.severity || '').toUpperCase()] || alertStyles.LOW;
                const alertKey = alert.id ?? index;
                const isSelected = selectedAlertKey === alertKey;
                const isResolved = alert.isResolved ?? alert.is_resolved ?? false;
                return (
                  <div
                    onClick={() => {
                      setSelectedAlertKey(prev => (prev === alertKey ? null : alertKey));
                      setSelectedEventKey(null);
                      setExternalHighlightEvent(null);
                    }}
                    className={`alarm-box cursor-pointer transition-all ${activeStyle.box} ${
                      isSelected ? 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-950' : ''
                    } ${isResolved ? 'opacity-50' : ''}`}
                    key={alertKey}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg font-bold ${activeStyle.icon}`}>⚠️</div>
                      <div>
                        <span className={`font-bold text-xs uppercase tracking-wide ${activeStyle.title}`}>
                          Risk Tespit Edildi: {alert.ruleName || 'Bilinmeyen Kural'}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`alarm-badge ${activeStyle.badge}`}>
                        {activeStyle.text}
                      </span>
                      {isResolved ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border text-slate-400 border-slate-200 dark:border-slate-700 dark:text-slate-500">
                          Çözüldü
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleResolveAlert(alert.id, e)}
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-all bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                          İncelendi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {hasMoreAlerts && (
              <button
                onClick={() => setShowAllAlerts(true)}
                className="self-start text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-1"
              >
                Daha Fazla Göster ({alerts.length - displayedAlerts.length} tane daha) →
              </button>
            )}
          </div>

          {/* Mini İstatistik Kartı - her zaman canlı olay akışı log kartının tam üstünde, aynı sütunda */}
          <div className="stats-mini-card dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">Özet</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="stats-mini-item dark:bg-slate-800/60">
                <span className="stats-mini-value text-slate-800 dark:text-white">{eventStats.total}</span>
                <span className="stats-mini-label">Toplam Olay</span>
              </div>
              <div className="stats-mini-item dark:bg-slate-800/60">
                <span className="stats-mini-value text-red-600 dark:text-red-400">{eventStats.risky}</span>
                <span className="stats-mini-label">Riskli Olay</span>
              </div>
              <div className="stats-mini-item dark:bg-slate-800/60">
                <span className="stats-mini-value text-amber-600 dark:text-amber-400">{eventStats.totalAlerts}</span>
                <span className="stats-mini-label">Aktif Alarm</span>
              </div>
              <div className="stats-mini-item dark:bg-slate-800/60">
                <span className="stats-mini-value text-orange-600 dark:text-orange-400">{eventStats.highAlerts}</span>
                <span className="stats-mini-label">Yüksek Seviye</span>
              </div>
            </div>
          </div>

          {/* Grafik Kartı */}
          <div className="lg:col-span-2 chart-card dark:bg-slate-900 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Olay Trafik Dağılımı</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Sisteme düşen anlık logların zaman bazlı yoğunluğu</p>
            </div>
            <div className="chart-wrapper dark:bg-slate-950 dark:border-slate-800/60">
              <EventChart events={filteredChartEvents} newEvents={events} isDarkMode={isDarkMode} highlightedTimestamps={highlightedTimestamps} />
            </div>
          </div>

          {/* Canlı Olay Akışı Log Kartı - Kontroller ve Filtreleme Sağ Üstüne Çekildi */}
          <div className="log-card dark:bg-slate-900 dark:border-slate-800">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 flex flex-col sm:flex-row gap-2 justify-between sm:items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Canlı Olay Akışı</h2>
                <span className="bg-blue-50 dark:bg-blue-950/40 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/60 text-[9px] px-2 py-0.5 rounded-md font-mono font-bold tracking-wider">
                  CANLI
                </span>
              </div>

              {/* Filtre ve Tema Değiştirici Butonlar */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setShowAllEventsPage(true)}
                  className="text-[10px] font-bold px-2 h-[35px] rounded-lg border transition-all shadow-sm flex items-center justify-center gap-1 whitespace-nowrap bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  Tüm Eventleri Gör →
                </button>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className={`text-[10px] font-bold px-2 h-[35px] rounded-lg border transition-all shadow-sm flex items-center justify-center gap-1 whitespace-nowrap ${
                    isDarkMode ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>

                <select 
                  className="filter-select h-[35px] leading-[33px] px-2.5 py-0 text-[10px] font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300" 
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

            <div className="log-list-wrapper">
              {sortedEvents.map((event, index) => {
                const type = event.event_type || event.eventType || event.type;
                const formattedTime = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('tr-TR') : '14:32';
                const eventKey = event.id ?? index;
                const isMatchedAlert = isEventMatchingSelectedAlert(event);
                const isSelectedEvent = selectedEventKey === eventKey;

                return (
                  <div
                    onClick={() => {
                      setSelectedEventKey(prev => (prev === eventKey ? null : eventKey));
                      setSelectedAlertKey(null);
                      setExternalHighlightEvent(null);
                    }}
                    data-matched-alert={isMatchedAlert ? 'true' : 'false'}
                    className={`log-row dark:bg-slate-950/40 dark:border-slate-800/60 dark:hover:bg-slate-900 transition-all cursor-pointer ${
                      (isMatchedAlert || isSelectedEvent) ? 'ring-2 ring-blue-400 bg-blue-50/70 dark:bg-blue-950/40' : ''
                    }`}
                    key={event.id || index}
                  >
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
      )}
    </div>
  );
}