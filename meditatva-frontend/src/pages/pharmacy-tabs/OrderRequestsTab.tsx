import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  Package, Search, Filter, CheckCircle, XCircle, Eye,
  MapPin, Phone, Calendar, Clock, Truck,
  AlertCircle, TrendingUp, Activity, Download, ChevronDown,
  ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { mockOrderRequests, getOrderStats, type OrderRequest } from "@/data/mockOrderRequests";

export const OrderRequestsTab = () => {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<OrderRequest[]>(mockOrderRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const stats = getOrderStats(orders);

  // Dynamic status color function that works for both light and dark modes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': 
        return theme === 'dark' 
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          : 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed': 
        return theme === 'dark'
          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
          : 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Delivered': 
        return theme === 'dark'
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': 
        return theme === 'dark'
          ? 'bg-red-500/20 text-red-300 border-red-500/30'
          : 'bg-red-100 text-red-800 border-red-200';
      default: 
        return theme === 'dark'
          ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
          : 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.medicines.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleConfirmOrder = (order: OrderRequest) => {
    setSelectedOrder(order);
    setShowConfirmModal(true);
  };

  const handleRejectOrder = (order: OrderRequest) => {
    setSelectedOrder(order);
    setShowRejectModal(true);
  };

  const confirmOrder = () => {
    if (selectedOrder) {
      setOrders(orders.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, status: 'Confirmed' as const, isNew: false }
          : o
      ));
      toast.success(`Order ${selectedOrder.orderId} confirmed!`, {
        description: `${selectedOrder.patientName} will be notified.`
      });
      setShowConfirmModal(false);
      setSelectedOrder(null);
    }
  };

  const rejectOrder = () => {
    if (selectedOrder) {
      setOrders(orders.map(o => 
        o.id === selectedOrder.id 
          ? { 
              ...o, 
              status: 'Cancelled' as const, 
              isNew: false,
              notes: rejectionReason || 'Order cancelled by pharmacy'
            }
          : o
      ));
      toast.error(`Order ${selectedOrder.orderId} rejected`, {
        description: `${selectedOrder.patientName} will be notified.`
      });
      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectionReason("");
    }
  };

  const viewOrderDetails = (order: OrderRequest) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Filter and search orders
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      {/* Modern Glassmorphic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-4 bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 rounded-2xl shadow-2xl shadow-emerald-500/20"
            >
              <Package className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h1 className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${theme === 'dark' ? 'from-emerald-400 via-cyan-400 to-blue-400' : 'from-emerald-600 via-cyan-600 to-blue-600'} bg-clip-text text-transparent`}>
                Order Requests
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                Manage and track all pharmacy orders
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30"
            >
              <Sparkles className="h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Premium Glassmorphic KPI Dashboard */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
      >
        {[
          { 
            icon: Activity, 
            label: "Total Orders", 
            value: stats.total, 
            change: "+12%", 
            trend: "up" as const, 
            gradient: "from-blue-500 via-cyan-500 to-emerald-500",
            glow: "shadow-blue-500/20",
            badgeBg: theme === 'dark' ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
          },
          { 
            icon: Clock, 
            label: "Pending", 
            value: stats.pending, 
            change: "Action needed", 
            trend: "neutral" as const, 
            gradient: "from-amber-400 via-orange-500 to-red-500",
            glow: "shadow-amber-500/20",
            badgeBg: theme === 'dark' ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"
          },
          { 
            icon: CheckCircle, 
            label: "Confirmed", 
            value: stats.confirmed, 
            change: "+8%", 
            trend: "up" as const, 
            gradient: "from-cyan-400 via-blue-500 to-indigo-500",
            glow: "shadow-cyan-500/20",
            badgeBg: theme === 'dark' ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-100 text-cyan-700"
          },
          { 
            icon: TrendingUp, 
            label: "Delivered", 
            value: stats.delivered, 
            change: "+15%", 
            trend: "up" as const, 
            gradient: "from-emerald-400 via-green-500 to-teal-500",
            glow: "shadow-emerald-500/20",
            badgeBg: theme === 'dark' ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
          },
          { 
            icon: XCircle, 
            label: "Cancelled", 
            value: stats.cancelled, 
            change: "-5%", 
            trend: "down" as const, 
            gradient: "from-red-400 via-rose-500 to-pink-500",
            glow: "shadow-red-500/20",
            badgeBg: theme === 'dark' ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 100, damping: 15 }
                }
              }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="group relative"
            >
              <Card className={`relative overflow-hidden border-0 shadow-2xl ${stat.glow} ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100/50'} backdrop-blur-xl ${theme === 'dark' ? 'border border-white/10' : 'border border-slate-200'} p-6 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition-all duration-300`}>
                {/* Animated Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} ${theme === 'dark' ? 'opacity-0 group-hover:opacity-10' : 'opacity-0 group-hover:opacity-5'} transition-opacity duration-500`} />
                
                {/* Holographic Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-500/0 via-cyan-500/10 to-emerald-500/0 blur-xl ${theme === 'dark' ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'} transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {stat.trend !== "neutral" && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.badgeBg}`}>
                        {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <motion.div
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}
                  >
                    {stat.value}
                  </motion.div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} font-medium`}>{stat.label}</div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filters & Search Section - Glassmorphic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={`border-0 shadow-2xl backdrop-blur-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'} p-6 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              <Input
                placeholder="Search by patient, order ID, or medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 backdrop-blur-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-slate-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-cyan-500/30`}
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full md:w-[180px] backdrop-blur-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-gray-900'}`}>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? "bg-gray-900 border-white/10" : "bg-white border-slate-200"}>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                className={`${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Orders Table - Premium Glassmorphic Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className={`border-0 shadow-2xl backdrop-blur-xl border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
                <tr>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Order ID</th>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Patient</th>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Items</th>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Total</th>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Date</th>
                  <th className={`text-left px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-200'}`}>
                <AnimatePresence mode="popLayout">
                  {currentOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100/50'}`}
                      onClick={() => viewOrderDetails(order)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-cyan-400">{order.orderId}</span>
                          {order.isNew && (
                            <Badge className={theme === 'dark' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-emerald-100 text-emerald-800 border-emerald-200"}>
                              NEW
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.patientName}</div>
                          <div className={`text-sm flex items-center gap-1 mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            <MapPin className="h-3 w-3" />
                            {order.location}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {order.medicines.length} item{order.medicines.length > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-emerald-400">
                          ₹{order.totalAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusColor(order.status)} border backdrop-blur-sm`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                          ₹{order.total}
                          <Calendar className="h-4 w-4 text-cyan-400" />
                          {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </div>
                        <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                          {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewOrderDetails(order);
                            }}
                            className={`border transition-all ${theme === 'dark' ? 'hover:bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:text-cyan-300' : 'hover:bg-cyan-100/50 border-cyan-200 text-cyan-700 hover:text-cyan-800'}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'Pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmOrder(order);
                                }}
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectOrder(order);
                                }}
                                className={theme === 'dark' ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-700 hover:bg-red-100/50"}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-6 py-4 border-t ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/30'}`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200"}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200"}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Modals remain the same but with dark theme styling */}
      {/* ... (keep existing modal implementations with updated styling) */}

      {/* Order Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className={`max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto border-emerald-500/30 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-2xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Package className="h-6 w-6 text-emerald-500" />
              Order Details - {selectedOrder?.orderId}
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className={`p-4 border-emerald-500/20 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100/50'}`}>
                <h3 className={`font-semibold flex items-center gap-2 mb-3 ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
                  <Phone className="h-4 w-4 text-cyan-400" />
                  Patient Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? "text-gray-400" : "text-slate-600"}>Name:</span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>{selectedOrder.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Contact:</span>
                    <span className="font-medium text-emerald-400">{selectedOrder.patientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Email:</span>
                    <span className="font-medium text-cyan-400">{selectedOrder.patientEmail}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Delivery Address:</span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>{selectedOrder.deliveryAddress || selectedOrder.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Order Date:</span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })} at {selectedOrder.orderTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Delivery Type:</span>
                    <Badge className={theme === 'dark' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800 border-blue-200"}>
                      {selectedOrder.deliveryType}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Medicines */}
              <Card className={`p-4 border-cyan-500/20 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100/50'}`}>
                <h3 className={`font-semibold flex items-center gap-2 mb-3 ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
                  <Package className="h-4 w-4 text-purple-400" />
                  Medicines Ordered
                </h3>
                <div className="space-y-2">
                  {selectedOrder.medicines.map((med, index) => (
                    <div key={index} className={`flex justify-between items-center p-2 rounded ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100/50'}`}>
                      <span className={theme === 'dark' ? "text-gray-900 dark:text-white" : "text-gray-900"}>{med.name} x {med.quantity}</span>
                      <span className="font-semibold text-emerald-400">₹{med.price * med.quantity}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Prescription with PDF Viewer */}
              {selectedOrder.prescriptionUrl && (
                <Card className={`p-4 bg-gradient-to-br border-2 border-emerald-500/30 ${theme === 'dark' ? 'from-emerald-950/20 to-cyan-950/20' : 'from-emerald-100/50 to-cyan-100/50'}`}>
                  <h3 className={`font-semibold flex items-center gap-2 mb-3 ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>
                    <Download className="h-4 w-4 text-emerald-400" />
                    Prescription Document
                  </h3>
                  <div className="space-y-3">
                    <div className={`rounded-lg border-2 border-emerald-500/20 overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                      <iframe
                        src={selectedOrder.prescriptionUrl}
                        className="w-full h-[400px]"
                        title="Prescription Document"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                        onClick={() => window.open(selectedOrder.prescriptionUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Screen
                      </Button>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedOrder.prescriptionUrl;
                          link.download = `prescription-${selectedOrder.orderId}.pdf`;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <Card className={`p-4 border-blue-500/20 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100/50'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Subtotal:</span>
                    <span className={theme === 'dark' ? "text-gray-900 dark:text-white" : "text-gray-900"}>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>Delivery:</span>
                    <span className={theme === 'dark' ? "text-gray-900 dark:text-white" : "text-gray-900"}>₹{selectedOrder.deliveryCharge}</span>
                  </div>
                  <div className={`border-t pt-2 flex justify-between ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                    <span className={`font-bold ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>Total Amount:</span>
                    <span className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      ₹{(selectedOrder.totalAmount + selectedOrder.deliveryCharge).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)} className={theme === 'dark' ? "border-white/20 text-white hover:bg-white/10" : "border-slate-200 text-gray-900 hover:bg-slate-100"}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Order Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className={`border-emerald-500/30 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              Confirm Order
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>
              Are you sure you want to confirm this order?
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Card className={`p-4 border-emerald-500/30 ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-100/30'}`}>
              <p className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>{selectedOrder.orderId}</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-700 dark:text-gray-300' : 'text-slate-600'}`}>Patient: {selectedOrder.patientName}</p>
              <p className="text-sm text-emerald-400 font-semibold">
                Total Amount: ₹{(selectedOrder.totalAmount + selectedOrder.deliveryCharge).toFixed(2)}
              </p>
            </Card>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className={theme === 'dark' ? "border-white/20 text-white hover:bg-white/10" : "border-slate-200 text-gray-900 hover:bg-slate-100"}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600" onClick={confirmOrder}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Order Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className={`border-red-500/30 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              Reject Order
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? "text-slate-700 dark:text-gray-400" : "text-slate-600"}>
              Please provide a reason for rejecting this order (optional)
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <Card className={`p-4 border-red-500/30 ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-100/30'}`}>
                <p className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>{selectedOrder.orderId}</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-700 dark:text-gray-300' : 'text-slate-600'}`}>Patient: {selectedOrder.patientName}</p>
              </Card>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-700 dark:text-gray-300' : 'text-gray-700'}`}>
                  Reason for Rejection
                </label>
                <Input
                  className={`backdrop-blur-sm focus:border-red-500 ${theme === 'dark' ? 'bg-white/5 border-red-500/30 text-gray-900 dark:text-white placeholder:text-gray-500' : 'bg-white border-red-200 text-gray-900 placeholder:text-gray-400'}`}
                  placeholder="e.g., Out of stock, incorrect prescription, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }} className={theme === 'dark' ? "border-white/20 text-white hover:bg-white/10" : "border-slate-200 text-gray-900 hover:bg-slate-100"}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectOrder} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700">
              <XCircle className="h-4 w-4 mr-2" />
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
