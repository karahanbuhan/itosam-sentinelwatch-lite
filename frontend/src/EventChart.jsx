import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function EventChart({ events = [] }) {
  
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

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
          {/* Açık gri, minimal arka plan çizgileri */}
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          
          <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} allowDecimals={false} />
          
          {/* Temiz, beyaz gölgeli Tooltip yapısı */}
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
          />
          
          <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '5px' }} />
          
          {/* Safir Mavisi Çizgi */}
          <Line 
            type="monotone" 
            dataKey="Olay Sayısı" 
            stroke="#2563eb" 
            strokeWidth={2.5}
            dot={{ fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#2563eb' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}