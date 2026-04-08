import { memo, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ResponsiveDashboardLayout } from "@/components/ResponsiveDashboardLayout";
import type { SidebarItem } from "@/components/ResponsiveDashboardLayout";
import {
  ShoppingCart, Receipt, PackageSearch, BarChart3, MessageCircle,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

type Tab = "order-requests" | "billing" | "inventory" | "analytics" | "chat" | "ai";

export const PharmacyDashboardResponsive = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("order-requests");

  // Auth check - run first and immediately
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    if (!isAuth || role !== "pharmacy") {
      navigate("/login?role=pharmacy", { replace: true });
    }
  }, [navigate]);

  const menuItems: SidebarItem[] = [
    {
      id: "order-requests",
      icon: ShoppingCart,
      label: "Order Requests",
      description: "Manage customer orders",
      badge: 12,
    },
    {
      id: "billing",
      icon: Receipt,
      label: "Billing & Invoices",
      description: "Payment management",
    },
    {
      id: "inventory",
      icon: PackageSearch,
      label: "Inventory",
      description: "Stock management",
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      description: "Performance insights",
    },
    {
      id: "chat",
      icon: MessageCircle,
      label: "Patient Chat",
      description: "Customer support",
    },
    {
      id: "ai",
      icon: Sparkles,
      label: "AI Insights",
      description: "Smart recommendations",
    },
  ];

  useEffect(() => {
    const path = location.pathname.split('/').pop() as Tab;
    if (path && ['order-requests', 'billing', 'inventory', 'analytics', 'chat', 'ai'].includes(path)) {
      setActiveTab(path);
    } else if (location.pathname === "/pharmacy/dashboard" || location.pathname === "/pharmacy/dashboard/") {
      navigate("/pharmacy/dashboard/order-requests", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    try { 
      sessionStorage.removeItem("pharmacyLocationData");
      sessionStorage.removeItem("pharmacyLocation");
    } catch (e) { /* ignore */ }
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleItemClick = (id: string) => {
    setActiveTab(id as Tab);
    navigate(`/pharmacy/dashboard/${id}`);
  };

  return (
    <ResponsiveDashboardLayout
      sidebarItems={menuItems}
      activeItem={activeTab}
      onItemClick={handleItemClick}
      userName="Pharmacist"
      userEmail="pharmacist@meditatva.com"
      theme="pharmacy"
      logoText="MediTatva"
      logoSubtext="Pharmacy Portal"
      onLogout={handleLogout}
    >
      <Outlet />
    </ResponsiveDashboardLayout>
  );
});

PharmacyDashboardResponsive.displayName = "PharmacyDashboardResponsive";
