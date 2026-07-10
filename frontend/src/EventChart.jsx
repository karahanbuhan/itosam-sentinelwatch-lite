import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// isDarkMode prop'unu ekledik, varsayılan olarak false bıraktık
export default function EventChart({ events = [], isDarkMode = false }) {
  
  const processData = () => {
    if (!events || events.length === 0) {
      return [
        { time: '14:30', 'Olay Sayısı': 2 },
        { time: '14:31', 'Olay Sayısı': 5 },
        { time: '14:32', 'Olay Sayısı': 3 },
      ];
    }

    const countsByMinute = {};

    events.forEach(event => {
      let minuteStr = '00:00';
      if (event.timestamp) {
        if (typeof event.timestamp === 'string' && !event.timestamp.includes('-') && !event.timestamp.includes('T')) {
          minuteStr = event.timestamp.substring(0, 5);
        } else {
          const date = new Date(event.timestamp);
          if (!isNaN(date.getTime())) {
            minuteStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          }
        }
      }
      countsByMinute[minuteStr] = (countsByMinute[minuteStr] || 0) + 1;
    });

    return Object.keys(countsByMinute)
      .sort()
      .map(minute => ({
        time: minute,
        'Olay Sayısı': countsByMinute[minute]
      }));
  };

  const chartData = processData();

  // Temaya göre dinamik grafik renk ayarları
  const strokeColor = isDarkMode ? '#38bdf8' : '#2563eb';    // Çizgi: Koyu modda açık mavi, açık modda safir mavi
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';      // Izgara çizgileri
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';      // Tooltip arka planı
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';  // Tooltip kenarlığı
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';      // Yazı renkleri

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
          {/* Temaya göre değişen arka plan çizgileri */}
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          
          <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} allowDecimals={false} />
          
          {/* Temaya göre değişen gölgeli Tooltip yapısı */}
          <Tooltip 
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
            labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#1e293b' }}
          />
          
          <Legend wrapperStyle={{ fontSize: '11px', color: textColor, paddingTop: '5px' }} />
          
          {/* Dinamik Renkli Çizgi Yapısı */}
          <Line 
            type="monotone" 
            dataKey="Olay Sayısı" 
            stroke={strokeColor} 
            strokeWidth={2.5}
            dot={{ fill: isDarkMode ? '#0f172a' : '#ffffff', stroke: strokeColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: strokeColor }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}