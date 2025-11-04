import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chatbot } from "@/components/Chatbot";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Package, MessageCircle, TrendingUp, Users, LogOut,
  Plus, Edit, Trash2, AlertCircle, Pill, Sparkles, ArrowUp
} from "lucide-react";
import { mockMedicines, mockChatMessages, mockAnalytics, mockLowStockAlerts, mockPredictiveInsights } from "@/lib/mockData";
import { toast } from "sonner";

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventory");

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    if (!isAuth || role !== "pharmacy") {
      navigate("/login?role=pharmacy");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="glass-card sticky top-0 z-40 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-secondary flex items-center justify-center">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-heading font-bold gradient-text">MediTatva Pharmacy</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-bold mb-2">HealthPlus Pharmacy Dashboard</h2>
          <p className="text-muted-foreground">Manage your inventory and connect with patients</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-8 w-8 text-primary" />
              <Badge className="gradient-primary">+12%</Badge>
            </div>
            <p className="text-2xl font-bold">1,245</p>
            <p className="text-sm text-muted-foreground">Total Medicines</p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-secondary" />
              <Badge className="gradient-secondary">+8%</Badge>
            </div>
            <p className="text-2xl font-bold">342</p>
            <p className="text-sm text-muted-foreground">Active Patients</p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-accent" />
              <Badge className="gradient-accent">+23%</Badge>
            </div>
            <p className="text-2xl font-bold">₹48.5K</p>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              <Badge>3 New</Badge>
            </div>
            <p className="text-2xl font-bold">28</p>
            <p className="text-sm text-muted-foreground">Chat Requests</p>
          </Card>
        </div>

        {/* Low Stock Alerts Section */}
        {mockLowStockAlerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Inventory Threshold Alerts
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {mockLowStockAlerts.map((alert) => (
                <Card key={alert.id} className={`glass-card p-4 border-2 ${
                  alert.severity === "critical" 
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" 
                    : "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                        {alert.severity === "critical" ? "CRITICAL" : "WARNING"}
                      </Badge>
                    </div>
                    <AlertCircle className={`h-5 w-5 ${
                      alert.severity === "critical" ? "text-red-600" : "text-yellow-600"
                    }`} />
                  </div>
                  <h4 className="font-semibold mb-1">{alert.medicineName}</h4>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p>Current: <span className="font-bold text-foreground">{alert.currentStock}</span> units</p>
                    <p>Threshold: {alert.threshold} units</p>
                    <p className="text-xs">~{alert.daysUntilStockout} days until stockout</p>
                  </div>
                  <Button size="sm" className="w-full gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Reorder Now
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Predictive AI Insights */}
        <Card className="glass-card p-6 mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold">AI Predictive Insights</h3>
              <p className="text-sm text-muted-foreground">Smart forecasting based on trends & local data</p>
            </div>
          </div>
          <div className="space-y-4">
            {mockPredictiveInsights.map((insight) => (
              <div key={insight.id} className="bg-background/80 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{insight.title}</h4>
                  </div>
                  <Badge className="gradient-secondary">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm mb-2">{insight.description}</p>
                <div className="bg-muted/50 rounded p-3 mb-3">
                  <p className="text-sm font-semibold text-destructive flex items-center gap-1 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Prediction: {insight.prediction}
                  </p>
                  <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                </div>
                <div className="flex gap-2">
                  {insight.medicines.map((med, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["inventory", "analytics", "chat"].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? "default" : "outline"}
              className={activeTab === tab ? "gradient-primary" : ""}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-heading font-bold">Medicine Inventory</h3>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Medicine Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold">Price</th>
                      <th className="text-left py-3 px-4 font-semibold">Expiry</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMedicines.map((med) => (
                      <tr key={med.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{med.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{med.category}</td>
                        <td className="py-3 px-4">
                          <span className={med.quantity < 50 ? "text-destructive font-semibold" : ""}>
                            {med.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4">${med.price}</td>
                        <td className="py-3 px-4 text-sm">{med.expiryDate}</td>
                        <td className="py-3 px-4">
                          <Badge variant={med.inStock ? "default" : "secondary"}
                            className={med.inStock ? "gradient-secondary" : ""}>
                            {med.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Low Stock Alert */}
              <Card className="mt-6 p-4 border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Low Stock Alert</p>
                    <p className="text-sm text-muted-foreground">
                      2 medicines are running low on stock. Consider restocking soon.
                    </p>
                  </div>
                </div>
              </Card>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-xl font-heading font-bold mb-6">Top Selling Medicines</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockAnalytics.topSellingMedicines}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(263 85% 44%)" />
                      <stop offset="100%" stopColor="hsl(217 97% 57%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-xl font-heading font-bold mb-6">Daily Reservations</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockAnalytics.dailyReservations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="hsl(146 78% 58%)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-xl font-heading font-bold mb-6">Inventory Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockAnalytics.inventoryTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="stock" stroke="hsl(349 100% 73%)" 
                    fill="url(#areaGradient)" />
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(349 100% 73%)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(338 100% 75%)" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <Card className="glass-card p-6">
            <h3 className="text-xl font-heading font-bold mb-6">Patient Messages</h3>
            <div className="space-y-4">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isPatient ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.isPatient 
                      ? "bg-muted"
                      : "bg-gradient-to-br from-secondary to-secondary-light text-white"
                  }`}>
                    <p className="font-semibold text-sm mb-1">{msg.senderName}</p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Input placeholder="Type your reply..." />
              <Button className="gradient-secondary">Send</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default PharmacyDashboard;
