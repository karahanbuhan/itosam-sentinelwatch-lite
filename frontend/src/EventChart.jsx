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
      if (!event.timestamp) return;
      const date = new Date(event.timestamp);
      const minuteStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
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
    <div style={{ width: '100%', height: '100%', minHeight: '280px' }}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          
          <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} allowDecimals={false} />
          
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px' }}
            labelStyle={{ fontWeight: 'bold', color: '#111827' }}
          />
          
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          
          <Line 
            type="monotone" 
            dataKey="Olay Sayısı" 
            stroke="#3b82f6" 
            strokeWidth={3}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}