import React, { useMemo } from 'react';
import { Box, Typography, Stack, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import WrongLocationIcon from '@mui/icons-material/WrongLocation';

const GeofenceListCard = ({ deviceDetails, eventsGeofenceExit }) => {
  const theme = useTheme();

  const data = useMemo(() => {
    const map = {};
    eventsGeofenceExit.forEach(e => {
      if (!map[e.deviceId]) map[e.deviceId] = 0;
      map[e.deviceId]++;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([id, count]) => {
        const dev = deviceDetails.find(d => d.id === parseInt(id));
        return { name: dev?.name || `#${id}`, count };
      });
  }, [eventsGeofenceExit, deviceDetails]);

  if (!data.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 3, color: theme.palette.success.main }}>
        <ThumbUpOffAltIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="caption" display="block" color="text.secondary">Bölge ihlali yok</Typography>
      </Box>
    );
  }

  const max = data[0]?.count || 1;
  const color = theme.palette.secondary.main;

  return (
    <Box>
      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
        {data.map((item, i) => (
          <Box key={item.name}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
              <Typography variant="caption" sx={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                {item.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <WrongLocationIcon sx={{ fontSize: 11, color }} />
                <Typography variant="caption" sx={{ fontSize: 12, fontWeight: 800, color }}>{item.count}</Typography>
              </Stack>
            </Box>
            <Box sx={{ height: 5, borderRadius: 99, bgcolor: alpha(color, 0.1), overflow: 'hidden' }}>
              <Box sx={{
                height: '100%', borderRadius: 99,
                width: `${(item.count / max) * 100}%`,
                bgcolor: i === 0 ? color : alpha(color, 0.55 - i * 0.07),
                transition: 'width .6s cubic-bezier(.34,1.56,.64,1)',
              }} />
            </Box>
          </Box>
        ))}
      </Stack>

      {data.length > 1 && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 1)} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} width={80} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: `1px solid ${alpha(theme.palette.divider, 1)}`, boxShadow: 'none' }}
              formatter={v => [v, 'İhlal']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={i === 0 ? color : alpha(color, 0.5)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default GeofenceListCard;