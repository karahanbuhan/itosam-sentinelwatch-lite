import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


export default function EventChart({ events = [], newEvents = [], isDarkMode = false, highlightedTimestamps = [] }) {

  // Olayın hangi 5 dakikalık kovaya girdiğini belirleyen ortak fonksiyon.
  // Hem grafik verisini oluştururken hem de vurgulanacak noktaları bulurken
  // AYNI mantığı kullanıyoruz ki kova anahtarları birebir eşleşsin.
  const getBucketKey = (timestamp) => {
    if (!timestamp) return '00:00';
    if (typeof timestamp === 'string' && !timestamp.includes('-') && !timestamp.includes('T')) {
      return timestamp.substring(0, 5);
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '00:00';
    date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

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
      const minuteStr = getBucketKey(event.timestamp);
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

  // Seçili alarm veya tıklanan olayla ilişkili kovaları belirliyoruz.
  const highlightedMinutes = new Set(highlightedTimestamps.map(getBucketKey));


  const strokeColor = isDarkMode ? '#38bdf8' : '#2563eb';  
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';     
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';    
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0'; 
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';     

  // Vurgulanan kovalar için normalden büyük, kırmızı bir nokta çiziyoruz.
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (highlightedMinutes.has(payload.time)) {
      return <circle key={`dot-${payload.time}`} cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />;
    }
    return <circle key={`dot-${payload.time}`} cx={cx} cy={cy} r={4} fill={isDarkMode ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth={2} />;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
  
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          
          <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} allowDecimals={false} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
            labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#1e293b' }}
          />
          
          <Legend wrapperStyle={{ fontSize: '11px', color: textColor, paddingTop: '5px' }} />
          
         
          <Line 
            type="monotone" 
            dataKey="Olay Sayısı" 
            stroke={strokeColor} 
            strokeWidth={2.5}
            dot={renderDot}
            activeDot={{ r: 6, fill: strokeColor }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}