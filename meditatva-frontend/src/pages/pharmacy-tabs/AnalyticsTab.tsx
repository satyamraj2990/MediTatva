import { memo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList
} from "recharts";
import {
  Package, Users, TrendingUp, MessageCircle, ArrowUp, Pill,
  AlertCircle, Sparkles, AlertTriangle
} from "lucide-react";

// Mock Data
const statsData = {
  totalMedicines: { value: 1245, change: 12 },
  activePatients: { value: 342, change: 8 },
  monthlyRevenue: { value: 48.5, change: 23 },
  chatRequests: { value: 28, new: 3 }
};

const inventoryAlerts = [
  { id: 1, name: "Ibuprofen 400mg", current: 5, threshold: 20, status: "CRITICAL" },
  { id: 2, name: "Amoxicillin 250mg", current: 15, threshold: 50, status: "WARNING" },
  { id: 3, name: "Cetirizine 10mg", current: 8, threshold: 30, status: "CRITICAL" },
  { id: 4, name: "Paracetamol 500mg", current: 25, threshold: 100, status: "WARNING" },
];

const salesData = [
  { month: "Jan", revenue: 45000, orders: 320 },
  { month: "Feb", revenue: 52000, orders: 380 },
  { month: "Mar", revenue: 48000, orders: 340 },
  { month: "Apr", revenue: 61000, orders: 420 },
  { month: "May", revenue: 55000, orders: 390 },
  { month: "Jun", revenue: 67000, orders: 460 },
];

const topMedicines = [
  { name: "Paracetamol", sales: 1240, revenue: 15500 },
  { name: "Azithromycin", sales: 890, revenue: 24800 },
  { name: "Cetirizine", sales: 750, revenue: 9200 },
  { name: "Amoxicillin", sales: 680, revenue: 18400 },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.05 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export const AnalyticsTab = memo(() => {
  const { theme } = useTheme();
  const lowStockChartData = inventoryAlerts.map((alert) => {
    const ratio = Math.round((alert.current / alert.threshold) * 100);
    const gap = Math.max(alert.threshold - alert.current, 0);
    return {
      ...alert,
      ratio,
      gap,
      severity: ratio <= 30 ? "critical" : "warning",
    };
  });

  const chartTextColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const chartGridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.20)';
  const maxThreshold = Math.max(...lowStockChartData.map((item) => item.threshold), 10);
  const xAxisMax = Math.ceil((maxThreshold * 1.2) / 10) * 10;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4 sm:space-y-5 lg:space-y-6"
      style={{ filter: 'none', WebkitFilter: 'none' }}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <motion.div variants={cardVariants}>
          <Card
            className="p-3 sm:p-4 lg:p-5 relative overflow-hidden group cursor-pointer bg-white/95 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 hover:border-cyan-500/30 hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-semibold">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {statsData.totalMedicines.change}%
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{statsData.totalMedicines.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Medicines</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card
            className="p-5 relative overflow-hidden group cursor-pointer bg-white/95 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 hover:border-emerald-500/30 hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-semibold">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {statsData.activePatients.change}%
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{statsData.activePatients.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Patients</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card
            className="p-5 relative overflow-hidden group cursor-pointer bg-white/95 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 hover:border-amber-500/30 hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-semibold">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {statsData.monthlyRevenue.change}%
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₹{statsData.monthlyRevenue.value}K</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Monthly Revenue</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card
            className="p-5 relative overflow-hidden group cursor-pointer bg-white/95 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 hover:border-cyan-500/30 hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                {statsData.chatRequests.new > 0 && (
                  <Badge className="bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30 font-semibold">
                    {statsData.chatRequests.new} New
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{statsData.chatRequests.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Chat Requests</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={cardVariants}>
          <Card
            className="p-6 bg-white/95 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-2xl"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B6CA8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="month" stroke="#5A6A85" />
                <YAxis stroke="#5A6A85" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid rgba(27, 108, 168, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1B6CA8"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card
            className="p-6 bg-white/95 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-2xl"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
              Top Selling Medicines
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topMedicines}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" stroke="#5A6A85" />
                <YAxis stroke="#5A6A85" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid rgba(27, 108, 168, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                  {topMedicines.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#1B6CA8" : "#4FC3F7"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Alerts - Enhanced with AI Insights Theme */}
      <motion.div variants={cardVariants}>
        <Card
          className="p-6 bg-white/95 dark:bg-white/5 backdrop-blur-xl border-amber-500/30 dark:border-amber-500/20 shadow-[0_0_60px_rgba(245,158,11,0.4)]"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Low Stock Alerts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current stock vs threshold for the medicines that need attention first</p>
            </div>
            <Badge className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-3 py-1 font-semibold">
              {inventoryAlerts.length} items to review
            </Badge>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Stock vs threshold</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Available stock and shortage gap to reorder level</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 ml-2" /> Warning
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lowStockChartData} layout="vertical" margin={{ top: 6, right: 24, left: 8, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, xAxisMax]}
                      tick={{ fill: chartTextColor, fontSize: 12 }}
                      stroke={chartGridColor}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={145}
                      tick={{ fill: chartTextColor, fontSize: 12 }}
                      stroke={chartGridColor}
                    />
                    <Tooltip
                      cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Current Stock') return [`${value} units`, 'Current Stock'];
                        if (name === 'Gap to Threshold') return [`${value} units`, 'Gap to Threshold'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Medicine: ${label}`}
                      contentStyle={{
                        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255,255,255,0.98)',
                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(148,163,184,0.24)',
                        borderRadius: 16,
                        color: theme === 'dark' ? '#fff' : '#0f172a',
                        boxShadow: theme === 'dark' ? '0 20px 50px rgba(0,0,0,0.35)' : '0 20px 50px rgba(15,23,42,0.10)',
                      }}
                      labelStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a', fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12 }} />

                    <Bar dataKey="current" name="Current Stock" stackId="stock" radius={[0, 0, 0, 0]} barSize={18}>
                      {lowStockChartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.severity === 'critical' ? '#ef4444' : '#f59e0b'} />
                      ))}
                      <LabelList dataKey="current" position="insideRight" formatter={(value: number) => `${value}`} fill="#ffffff" fontSize={11} />
                    </Bar>

                    <Bar
                      dataKey="gap"
                      name="Gap to Threshold"
                      stackId="stock"
                      radius={[0, 999, 999, 0]}
                      barSize={18}
                      fill={theme === 'dark' ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.55)'}
                    >
                      <LabelList dataKey="threshold" position="right" formatter={(value: number) => `${value}`} fill={chartTextColor} fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-3">
              {lowStockChartData.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{alert.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.current} in stock • {alert.gap} short</p>
                    </div>
                    <Badge className={alert.severity === 'critical' ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'}>
                      {alert.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Threshold</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{alert.threshold} units</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${alert.severity === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                      style={{ width: `${Math.max(8, Math.min(alert.ratio, 100))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{alert.ratio}% of threshold</span>
                    <span>Restock recommended</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
});

AnalyticsTab.displayName = "AnalyticsTab";
