import { memo, useEffect } from "react";
import { useNavigate, useLocation, NavLink, Outlet } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BarChart3, PackageSearch, MessageCircle, Sparkles, Receipt, MapPin,
  LogOut, Pill, Bell, User, Menu
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

type Tab = "analytics" | "inventory" | "chat" | "ai" | "billing" | "nearby-stores";

// Reordered menu items as per requirements
const menuItems: Array<{ id: Tab; icon: LucideIcon; label: string; section?: 'main' | 'secondary' }> = [
  { id: "nearby-stores", icon: MapPin, label: "Nearby Medical Stores", section: 'main' },
  { id: "billing", icon: Receipt, label: "Billing & Invoices", section: 'main' },
  { id: "inventory", icon: PackageSearch, label: "Inventory Management", section: 'main' },
  { id: "analytics", icon: BarChart3, label: "Analytics & Reports", section: 'secondary' },
  { id: "chat", icon: MessageCircle, label: "Patient Chat", section: 'secondary' },
  { id: "ai", icon: Sparkles, label: "AI Insights", section: 'secondary' },
];

export const DashboardLayout = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to nearby-stores if on base dashboard route (changed from analytics)
  useEffect(() => {
    if (location.pathname === "/pharmacy/dashboard" || location.pathname === "/pharmacy/dashboard/") {
      navigate("/pharmacy/dashboard/nearby-stores", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Auth check
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

  const currentTab: Tab = (() => {
    const segment = location.pathname.replace(/\/$/, "").split("/").pop() as Tab | undefined;
    return segment && ["analytics", "inventory", "chat", "ai", "billing", "nearby-stores"].includes(segment)
      ? segment
      : "nearby-stores"; // Changed default from analytics
  })();

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Professional Healthcare Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F8] via-[#F7F9FC] to-[#FFFFFF]" />
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4FC3F7]/60 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1B6CA8]/40 to-transparent"
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Sidebar - Premium Medical Theme */}
      <motion.aside
        className="w-72 relative z-10 flex-shrink-0"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          className="fixed top-0 left-0 h-full w-72 flex flex-col"
          style={{
            background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 253, 0.95) 100%)',
            backdropFilter: 'blur(30px)',
            borderRight: '1px solid rgba(79, 195, 247, 0.15)',
            boxShadow: '4px 0 24px rgba(27, 108, 168, 0.08), inset -1px 0 1px rgba(255, 255, 255, 0.5)',
          }}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-[#4FC3F7]/10">
            <motion.div
              className="flex items-center gap-3 mb-2"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div 
                className="h-14 w-14 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)',
                }}
              >
                <div className="absolute inset-0 bg-white/20" />
                <Pill className="h-7 w-7 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] bg-clip-text text-transparent">
                  MediTatva
                </h1>
                <p className="text-xs text-[#5A6A85] font-semibold tracking-wide uppercase">Pharmacy Portal</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Navigation Header */}
            <div className="px-3 mb-4">
              <p className="text-[10px] font-bold text-[#5A6A85] uppercase tracking-wider">
                Navigation
              </p>
            </div>

            <LayoutGroup>
              <nav className="space-y-1">
                {menuItems.map((item, index) => {
                  const isActive = currentTab === item.id;
                  const isMainSection = item.section === 'main';
                  const showDivider = index === 2; // After Inventory Management
                  
                  return (
                    <div key={item.id}>
                      <NavLink
                        to={`/pharmacy/dashboard/${item.id}`}
                        className="block"
                      >
                        <motion.div
                          whileHover={{ x: 4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className={`
                            relative flex items-center gap-3 px-4 py-3.5 rounded-xl
                            transition-all duration-300 group
                            ${isActive 
                              ? 'shadow-lg' 
                              : 'hover:shadow-md'
                            }
                          `}
                          style={{
                            background: isActive 
                              ? 'linear-gradient(135deg, rgba(79, 195, 247, 0.15) 0%, rgba(27, 108, 168, 0.08) 100%)'
                              : 'transparent',
                            border: isActive
                              ? '1px solid rgba(79, 195, 247, 0.3)'
                              : '1px solid transparent',
                          }}
                        >
                          {/* Active Indicator - Left Accent Bar */}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-accent"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full"
                              style={{
                                background: 'linear-gradient(to bottom, #4FC3F7 0%, #1B6CA8 100%)',
                                boxShadow: '0 0 20px rgba(79, 195, 247, 0.6), 0 0 40px rgba(79, 195, 247, 0.3)',
                              }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}

                          {/* Icon with Gradient Background */}
                          <div 
                            className={`
                              h-10 w-10 rounded-xl flex items-center justify-center
                              transition-all duration-300 relative overflow-hidden
                              ${isActive ? 'shadow-lg' : 'group-hover:shadow-md'}
                            `}
                            style={{
                              background: isActive
                                ? 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)'
                                : 'rgba(232, 244, 248, 0.5)',
                            }}
                          >
                            {isActive && (
                              <div className="absolute inset-0 bg-white/20" />
                            )}
                            <item.icon
                              className={`
                                h-5 w-5 transition-all duration-300 relative z-10
                                ${isActive 
                                  ? 'text-white' 
                                  : 'text-[#5A6A85] group-hover:text-[#1B6CA8]'
                                }
                              `}
                            />
                          </div>

                          {/* Label */}
                          <span
                            className={`
                              text-sm font-semibold transition-all duration-300 flex-1
                              ${isActive 
                                ? 'text-[#0A2342]' 
                                : 'text-[#5A6A85] group-hover:text-[#1B6CA8]'
                              }
                            `}
                          >
                            {item.label}
                          </span>

                          {/* Active Glow Indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-glow"
                              className="h-2 w-2 rounded-full"
                              style={{
                                background: 'linear-gradient(135deg, #4FC3F7 0%, #1B6CA8 100%)',
                                boxShadow: '0 0 12px rgba(79, 195, 247, 0.8), 0 0 24px rgba(79, 195, 247, 0.4)',
                              }}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.8, 1, 0.8],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          )}

                          {/* Hover Gradient Effect */}
                          {!isActive && (
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div 
                                className="absolute inset-0 rounded-xl"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.05) 0%, rgba(27, 108, 168, 0.03) 100%)',
                                }}
                              />
                            </div>
                          )}
                        </motion.div>
                      </NavLink>

                      {/* Section Divider */}
                      {showDivider && (
                        <div className="my-4 px-3">
                          <div 
                            className="h-px"
                            style={{
                              background: 'linear-gradient(to right, transparent 0%, rgba(79, 195, 247, 0.3) 50%, transparent 100%)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </LayoutGroup>
          </div>

          {/* Logout Section - Bottom */}
          <div className="p-4 border-t border-[#4FC3F7]/10">
            <motion.div
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-4 rounded-xl group relative overflow-hidden
                  text-[#E74C3C] hover:text-white hover:bg-gradient-to-r hover:from-[#E74C3C] hover:to-[#C0392B]
                  border border-[#E74C3C]/20 hover:border-[#E74C3C] transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#E74C3C]/10 group-hover:bg-white/20 transition-colors duration-300">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Logout</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto bg-gradient-to-br from-[#E8F4F8]/50 via-[#F7F9FC]/30 to-[#FFFFFF]/10">
        {/* Top Bar - Enhanced */}
        <div
          className="sticky top-0 z-20 border-b"
          style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 253, 0.95) 100%)',
            backdropFilter: 'blur(30px)',
            borderBottom: '1px solid rgba(79, 195, 247, 0.15)',
            boxShadow: '0 4px 24px rgba(27, 108, 168, 0.06)',
          }}
        >
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#5A6A85] font-medium">Dashboard</span>
                <span className="text-[#5A6A85]">/</span>
                <div className="flex items-center gap-2">
                  {menuItems.find(m => m.id === currentTab)?.icon && (
                    <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-[#1B6CA8] to-[#4FC3F7] flex items-center justify-center">
                      {(() => {
                        const Icon = menuItems.find(m => m.id === currentTab)?.icon;
                        return Icon ? <Icon className="h-3 w-3 text-white" /> : null;
                      })()}
                    </div>
                  )}
                  <span className="text-[#1B6CA8] font-bold">
                    {menuItems.find(m => m.id === currentTab)?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-xl text-[#5A6A85] hover:text-[#1B6CA8] hover:bg-[#E8F4F8] transition-all duration-300"
                >
                  <Bell className="h-5 w-5" />
                  <motion.span 
                    className="absolute top-2 right-2 h-2 w-2 bg-[#E74C3C] rounded-full shadow-lg"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </Button>
              </motion.div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Avatar */}
              <motion.div 
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm cursor-pointer relative overflow-hidden shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-white/20" />
                <span className="relative z-10">HP</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area - Only this changes */}
        <div className="p-6 md:p-8 lg:p-10 max-w-[1800px] mx-auto min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
});

DashboardLayout.displayName = "DashboardLayout";
