import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Search, Filter, CheckCircle, XCircle, Eye, FileText,
  MapPin, Phone, Mail, Calendar, Clock, Truck, ShoppingBag,
  AlertCircle, TrendingUp, Activity, DollarSign, Download, ChevronDown,
  ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw, MoreVertical
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

  // Filter and search orders
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Modern Header with Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-2xl shadow-xl"
            >
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1
                className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent"
              >
                Order Requests
              </h1>
              <p
                className="text-sm text-muted-foreground mt-1"
              >
                Manage and track all pharmacy orders
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <Sparkles className="h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Premium KPI Dashboard */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
      >
        {[
          { icon: Activity, label: "Total Orders", value: stats.total, change: "+12%", trend: "up" as const, color: "from-blue-500 to-cyan-500" },
          { icon: Clock, label: "Pending", value: stats.pending, change: "Action needed", trend: "neutral" as const, color: "from-amber-400 to-orange-500" },
          { icon: CheckCircle, label: "Confirmed", value: stats.confirmed, change: "+8%", trend: "up" as const, color: "from-blue-500 to-indigo-500" },
          { icon: TrendingUp, label: "Delivered", value: stats.delivered, change: "+15%", trend: "up" as const, color: "from-emerald-500 to-green-500" },
          { icon: XCircle, label: "Cancelled", value: stats.cancelled, change: "-5%", trend: "down" as const, color: "from-red-400 to-rose-500" },
        ].map((stat, index) => {
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
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <Card className="relative overflow-hidden border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 hover:shadow-2xl transition-all duration-300">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Accent Border */}
                <motion.div
                  className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${stat.color}`}
                  initial={{ scaleY: 0.3 }}
                  whileHover={{ scaleY: 1 }}
                  transition={{ duration: 0.15 }}
                />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                    <motion.p
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {stat.value}
                    </motion.p>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : stat.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-semibold ${
                        stat.trend === 'up' ? 'text-emerald-600' : 
                        stat.trend === 'down' ? 'text-red-600' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  
                  {/* Animated Icon */}
                  <motion.div
                    className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}
                    whileHover={{
                      rotate: [0, -10, 10, 0],
                      scale: 1.1
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </motion.div>
                </div>

                {/* Hidden Sparkline */}
                <div className="mt-4 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-end justify-between h-full gap-1">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`flex-1 rounded-t bg-gradient-to-t ${stat.color} opacity-30`}
                        initial={{ height: 0 }}
                        whileHover={{ height: `${Math.random() * 100}%` }}
                        transition={{ duration: 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Premium Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              >
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Search by patient, order ID, or medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 rounded-xl text-base bg-white dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm focus:shadow-md"
              />
            </div>

            {/* Filter Dropdown */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[240px] h-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="confirmed">Confirmed Only</SelectItem>
                <SelectItem value="delivered">Delivered Only</SelectItem>
                <SelectItem value="cancelled">Cancelled Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div
            className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
          >
            <span>Showing <strong className="text-gray-900 dark:text-white">{filteredOrders.length}</strong> of <strong className="text-gray-900 dark:text-white">{orders.length}</strong> orders</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden border-2 border-blue-100 bg-white">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Medicines
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence mode="popLayout">
                  {currentOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{order.orderId}</p>
                              {order.isNew && (
                                <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {order.orderDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {order.orderTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.patientName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {order.patientPhone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {order.medicines.slice(0, 2).map((med, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-gray-700">{med.name}</span>
                              <span className="text-gray-500"> × {med.quantity}</span>
                            </div>
                          ))}
                          {order.medicines.length > 2 && (
                            <p className="text-xs text-blue-600">
                              +{order.medicines.length - 2} more
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {order.deliveryType === 'Home Delivery' ? (
                            <Truck className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {order.deliveryType}
                          </span>
                        </div>
                        {order.deliveryAddress && (
                          <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{order.deliveryAddress}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">
                            ₹{(order.totalAmount + order.deliveryCharge).toFixed(2)}
                          </p>
                          {order.deliveryCharge > 0 && (
                            <p className="text-xs text-gray-500">
                              +₹{order.deliveryCharge} delivery
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusColor(order.status)} border px-3 py-1`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewOrderDetails(order)}
                            className="hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'Pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmOrder(order)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRejectOrder(order)}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4" />
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-blue-600" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Order Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Order Details - {selectedOrder?.orderId}
            </DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedOrder.patientName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.patientPhone}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.patientEmail}</p>
                </div>
              </div>

              {/* Medicine List */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Medicines Ordered
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {selectedOrder.medicines.map((med, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {med.quantity}</p>
                      </div>
                      <p className="font-semibold">₹{med.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Breakdown
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Medicines Total:</span>
                    <span className="font-medium">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span className="font-medium">₹{selectedOrder.deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">
                      ₹{(selectedOrder.totalAmount + selectedOrder.deliveryCharge).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Type:</span> {selectedOrder.deliveryType}</p>
                  {selectedOrder.deliveryAddress && (
                    <p><span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}</p>
                  )}
                  {selectedOrder.notes && (
                    <p><span className="font-medium">Notes:</span> {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              {/* Prescription */}
              {selectedOrder.prescriptionUrl && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Prescription
                  </h3>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(selectedOrder.prescriptionUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Prescription
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Order Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this order?
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">{selectedOrder.orderId}</p>
              <p className="text-sm text-gray-700">Patient: {selectedOrder.patientName}</p>
              <p className="text-sm text-gray-700">
                Total Amount: ₹{(selectedOrder.totalAmount + selectedOrder.deliveryCharge).toFixed(2)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmOrder}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Order Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Order
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order (optional)
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">{selectedOrder.orderId}</p>
                <p className="text-sm text-gray-700">Patient: {selectedOrder.patientName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <Input
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
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectOrder}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
