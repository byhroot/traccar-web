import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Switch,
  FormControlLabel,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import { useTranslation } from "../common/components/LocalizationProvider";

const COLORS = ["#f5ac0f", "#ff9800", "#4caf50", "#f44336", "#9c27b0", "#607d8b"];

const DeviceChart = ({ devices }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const t = useTranslation();

  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState("distance");
  const [timeRange, setTimeRange] = useState("reportThisWeek");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [showPie, setShowPie] = useState(true);

  // Animasyonlu KPI state
  const [displayValue, setDisplayValue] = useState(0);
  const [displayDevice, setDisplayDevice] = useState("");

  // PieChart dialog state
  const [openDialog, setOpenDialog] = useState(false);

  const timeRanges = [
    { key: "reportThisWeek", label: t("reportThisWeek") },
    { key: "reportPreviousWeek", label: t("reportPreviousWeek") },
    { key: "reportThisMonth", label: t("reportThisMonth") },
    { key: "reportPreviousMonth", label: t("reportPreviousMonth") },
  ];
  const metrics = [
    { key: "distance", label: "deviceTotalDistance" },
    { key: "engineHours", label: "positionHours" },
    { key: "maxSpeed", label: "reportMaximumSpeed" },
  ];

  // Tarih aralıklarını hesapla
  const getDateRange = (rangeKey) => {
    const now = dayjs();
    switch (rangeKey) {
      case "reportThisWeek":
        return { from: now.startOf("week").toDate(), to: now.endOf("week").toDate() };
      case "reportPreviousWeek":
        return { from: now.subtract(1, "week").startOf("week").toDate(), to: now.subtract(1, "week").endOf("week").toDate() };
      case "reportThisMonth":
        return { from: now.startOf("month").toDate(), to: now.endOf("month").toDate() };
      case "reportPreviousMonth":
        return { from: now.subtract(1, "month").startOf("month").toDate(), to: now.subtract(1, "month").endOf("month").toDate() };
      default:
        return { from: now.startOf("week").toDate(), to: now.endOf("week").toDate() };
    }
  };

  // Fetch
  useEffect(() => {
    const fetchSummary = async () => {
      if (!devices || devices.length === 0) return;

      setLoading(true);
      try {
        const { from, to } = getDateRange(timeRange);
        const params = new URLSearchParams();
        params.append("from", from.toISOString());
        params.append("to", to.toISOString());
        params.append("daily", "true");

        const filteredDevices = selectedDevice === "all"
          ? devices
          : devices.filter((d) => d.id === selectedDevice);

        filteredDevices.forEach((d) => params.append("deviceId", d.id));

        const res = await fetch(`/api/reports/summary?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error(err);
        setSummary([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [devices, timeRange, selectedDevice]);

  // AreaChart için data
  // AreaChart için data (günlük toplama)
  const chartData = React.useMemo(() => {
    if (!summary || summary.length === 0) return [];

    const { from, to } = getDateRange(timeRange);
    const days = [];
    let cursor = dayjs(from);

    // tarih aralığındaki tüm günleri hazırla
    while (cursor.isBefore(to) || cursor.isSame(to, "day")) {
      days.push(cursor.format("DD/MM"));
      cursor = cursor.add(1, "day");
    }

    // summary -> gün bazlı toplama
    const grouped = {};
    summary.forEach((s) => {
      const day = dayjs(s.startTime).format("DD/MM");
      if (!grouped[day]) {
        grouped[day] = { distance: 0, engineHours: 0, maxSpeed: 0 };
      }
      grouped[day].distance += s.distance / 1000;
      grouped[day].engineHours += s.engineHours / 3600000;
      // maxSpeed için günün en yüksek hızını al
      grouped[day].maxSpeed = Math.max(grouped[day].maxSpeed, s.maxSpeed * 1.852);
    });

    // her günü sırayla doldur (yoksa 0)
    return days.map((d) => ({
      name: d,
      distance: grouped[d]?.distance || 0,
      engineHours: grouped[d]?.engineHours || 0,
      maxSpeed: grouped[d]?.maxSpeed || 0,
    }));
  }, [summary, timeRange]);


  // PieChart için dataf
  // PieChart için data (summary üzerinden hesapla)
  const pieData = devices
    .map((d) => {
      const deviceSummary = summary.filter((s) => s.deviceId === d.id);
      if (!deviceSummary.length) return { name: d.name, value: 0 };

      let value = 0;
      switch (metric) {
        case "distance":
          value = deviceSummary.reduce((acc, s) => acc + s.distance / 1000, 0);
          break;
        case "engineHours":
          value = deviceSummary.reduce((acc, s) => acc + s.engineHours / 3600000, 0);
          break;
        case "maxSpeed":
          value = deviceSummary.reduce(
            (acc, s) => Math.max(acc, s.maxSpeed * 1.852),
            0
          );
          break;
        default:
          value = 0;
      }

      return { name: d.name, value };
    })
    .filter((d) => d.value > 0);


  // Animasyon fonksiyonu
  const animateValue = (targetValue) => {
    const initialValue = displayValue;
    const startTime = performance.now();
    const duration = 100;
    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const value = initialValue + (targetValue - initialValue) * progress;
      setDisplayValue(value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const coloredPieData = pieData.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));
  // KPI hesaplama
  useEffect(() => {
    if (chartData.length === 0) return;

    let newValue = 0;
    let deviceName = "";

    switch (metric) {
      case "distance":
        newValue = chartData.reduce((acc, s) => acc + s.distance, 0);
        deviceName = "";
        break;
      case "engineHours":
        newValue = chartData.reduce((acc, s) => acc + s.engineHours, 0);
        deviceName = "";
        break;
      case "maxSpeed":
        const maxSpeedItem = chartData.reduce(
          (prev, s) => (s.maxSpeed > prev.maxSpeed ? s : prev),
          chartData[0]
        );
        newValue = maxSpeedItem.maxSpeed;
        deviceName = devices.find((d) => d.id === maxSpeedItem.deviceId)?.name || "";
        break;
    }

    setDisplayDevice(deviceName);
    animateValue(newValue, 800);
  }, [chartData, metric]);

  return (
    <>
      <Card sx={{ p: 2, borderRadius: 2 }}>
        <CardContent>
          {/* KPI */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{t("reportSummary")} {t("reportChart")}</Typography>
            <Box textAlign="right">
              <Typography variant="subtitle2">
                {t(
                  metric === "distance"
                    ? "deviceTotalDistance"
                    : metric === "engineHours"
                      ? "positionHours"
                      : "reportMaximumSpeed"
                )}
                {displayDevice ? ` (${displayDevice})` : ""}:
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {displayValue.toFixed(1)}
              </Typography>
            </Box>
          </Box>

          {/* Filtreler */}
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <FormControl size="small">
              <InputLabel>{t("stateValue")}</InputLabel>
              <Select value={metric} onChange={(e) => setMetric(e.target.value)}>
                {metrics.map((m) => (
                  <MenuItem key={m.key} value={m.key}>
                    {t(m.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>{t("timeRange")}</InputLabel>
              <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                {timeRanges.map((r) => (
                  <MenuItem key={r.key} value={r.key}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>{t("sharedDevice")}</InputLabel>
              <Select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
                <MenuItem value="all">{t("eventAll")}</MenuItem>
                {devices.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!isDesktop && (
              <FormControlLabel
                control={<Switch checked={showPie} onChange={() => setShowPie(!showPie)} />}
                label={showPie ? "PieChart" : t("reportChart")}
              />
            )}
          </Box>

          {/* Chart */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : chartData.length === 0 ? (
            <Typography align="center" py={6}>
              {t("sharedNoData")}
            </Typography>
          ) : (
            <Box display={isDesktop ? "flex" : "block"} gap={2}>
              {/* AreaChart */}
              {((!isDesktop && !showPie) || isDesktop) && (
                <Box flex={1} height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => {
                          const key =
                            metric === "distance"
                              ? "deviceTotalDistance"
                              : metric === "engineHours"
                                ? "positionHours"
                                : "reportMaximumSpeed";
                          return [`${Number(value).toFixed(1)}`, t(key)];
                        }}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Area type="monotone" dataKey={metric} stroke="#1976d2" fill="#1976d2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}

              {/* PieChart */}
              {((!isDesktop && showPie) || isDesktop) && (
                <Box flex={1} height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart onClick={() => setOpenDialog(true)}>
                      <Pie
                        data={coloredPieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        labelLine={true} // segmentten dışarı çıkan çizgi
                        label={({ cx, cy, midAngle, outerRadius, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 5; // +20 ile segmentin dışına çıkar
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          const item = coloredPieData[index];

                          return (
                            <text
                              x={x}
                              y={y}
                              fill={theme.palette.text.primary}
                              textAnchor={x > cx ? "start" : "end"} // dışa doğru hizalama
                              dominantBaseline="central"
                              fontSize={14} // biraz büyüttük
                              fontWeight="bold"
                            >
                              {item?.value?.toFixed(1)} km
                            </text>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {t("reportSummary")}
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[300],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box>
            {pieData.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  py: 0.5,
                  borderBottom: index < pieData.length - 1 ? "1px solid #ddd" : "none",
                }}
              >
                <span>{item.name}</span>
                <span>{item.value.toFixed(1)}</span>
              </Box>
            ))}
          </Box>




        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeviceChart;
