import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Shield, Clock, Pill, Heart,
  CheckCircle2, Moon, Sun, Menu, X, ArrowRight,
  Lock, Zap, BarChart3, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Color tokens for themes
const colors = {
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgTertiary: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    border: '#E2E8F0',
    accent: 'from-blue-600 to-purple-600',
    accentLight: 'from-blue-50 to-purple-50',
  },
  dark: {
    bg: '#0B1220',
    bgSecondary: '#0F172A',
    bgTertiary: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    border: '#334155',
    accent: 'from-blue-500 to-purple-500',
    accentLight: 'from-blue-950 to-purple-950',
  }
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | null>(null);

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Header Component
const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = isDark ? colors.dark : colors.light;

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Pharmacies', href: '#pharmacies' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <motion.header
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
      }}
      className="sticky top-0 z-50 border-b backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.light.accent} flex items-center justify-center`}>
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span style={{ color: theme.text }} className="font-semibold text-xl">
              MediTatva
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{ color: theme.textSecondary }}
                className="text-sm font-medium hover:opacity-100 opacity-80 transition-opacity"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                backgroundColor: theme.bgTertiary,
                color: theme.text,
              }}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* CTA Buttons */}
            <div className="hidden sm:flex gap-3">
              <Button
                variant="outline"
                style={{
                  color: theme.text,
                  borderColor: theme.border,
                }}
                className="hover:opacity-80"
              >
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90">
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              style={{ color: theme.text }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}
            className="md:hidden border-t py-4 space-y-3"
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{ color: theme.textSecondary }}
                className="block text-sm font-medium py-2 hover:opacity-100 opacity-80"
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

// Hero Section
const HeroSection: React.FC = () => {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <motion.section
      id="home"
      style={{ backgroundColor: theme.bgSecondary }}
      className="py-20 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h1
            style={{ color: theme.text }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
          >
            Find Your Medicines
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
              Instantly & Safely
            </span>
          </motion.h1>

          <motion.p
            style={{ color: theme.textSecondary }}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            AI-powered healthcare platform connecting you to verified medicines, nearby pharmacies, and trusted medical information in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg hover:opacity-90 flex items-center justify-center gap-2">
              Login as Patient
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              style={{
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.bgTertiary,
              }}
              className="px-8 py-6 text-lg hover:opacity-80"
            >
              Login as Pharmacy
            </Button>
          </motion.div>

          {/* Hero Image / Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              backgroundColor: theme.bgTertiary,
              borderColor: theme.border,
            }}
            className="mt-16 rounded-2xl border p-8 sm:p-12 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-blue-600" />
                <span style={{ color: theme.text }} className="font-semibold">Search</span>
              </div>
              <ArrowRight style={{ color: theme.textTertiary }} className="w-5 h-5" />
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-purple-600" />
                <span style={{ color: theme.text }} className="font-semibold">Find</span>
              </div>
              <ArrowRight style={{ color: theme.textTertiary }} className="w-5 h-5" />
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <span style={{ color: theme.text }} className="font-semibold">Connect</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

// Features Section
const FeaturesSection: React.FC = () => {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;

  const features = [
    {
      icon: Search,
      title: 'AI Medicine Search',
      description: 'Find any medicine instantly with our intelligent search powered by medical-grade AI',
    },
    {
      icon: MapPin,
      title: 'Nearby Pharmacies',
      description: 'Discover verified pharmacies near you with real-time availability and pricing',
    },
    {
      icon: Shield,
      title: 'Verified Information',
      description: 'Medical information verified by healthcare professionals, not just algorithms',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Access our platform anytime, anywhere for your healthcare needs',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with medical-grade security',
    },
    {
      icon: Heart,
      title: 'Patient Focused',
      description: 'Designed by healthcare professionals, for better patient outcomes',
    },
  ];

  return (
    <motion.section
      id="features"
      style={{ backgroundColor: theme.bg }}
      className="py-20 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 style={{ color: theme.text }} className="text-3xl sm:text-4xl font-bold mb-4">
            Powerful Features for Your Health
          </h2>
          <p style={{ color: theme.textSecondary }} className="text-lg max-w-2xl mx-auto">
            Everything you need to find medicines, connect with pharmacies, and access trusted healthcare information
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                backgroundColor: theme.bgSecondary,
                borderColor: theme.border,
              }}
              className="p-8 rounded-xl border hover:border-blue-500 transition-colors group cursor-pointer"
            >
              <motion.div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600"
                whileHover={{ scale: 1.1 }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </motion.div>

              <h3 style={{ color: theme.text }} className="text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p style={{ color: theme.textSecondary }} className="text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// How It Works Section
const HowItWorks: React.FC = () => {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;

  const steps = [
    {
      number: '1',
      title: 'Search Medicine',
      description: 'Type the medicine name or symptoms and let AI help you find what you need',
    },
    {
      number: '2',
      title: 'Find Pharmacies',
      description: 'Get nearby pharmacies with availability and pricing in real-time',
    },
    {
      number: '3',
      title: 'Connect Instantly',
      description: 'Reserve, order, or get expert advice directly from pharmacies',
    },
    {
      number: '4',
      title: 'Easy Delivery',
      description: 'Receive your medicines safely with tracking and delivery confirmation',
    },
  ];

  return (
    <motion.section
      id="how-it-works"
      style={{ backgroundColor: theme.bgSecondary }}
      className="py-20 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 style={{ color: theme.text }} className="text-3xl sm:text-4xl font-bold mb-4">
            How MediTatva Works
          </h2>
          <p style={{ color: theme.textSecondary }} className="text-lg max-w-2xl mx-auto">
            Simple, intuitive steps to find medicines and connect with healthcare
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  style={{ backgroundColor: theme.border }}
                  className="hidden lg:block absolute top-1/4 -right-3 w-6 h-0.5"
                />
              )}

              <div
                style={{
                  backgroundColor: theme.bgTertiary,
                  borderColor: theme.border,
                }}
                className="p-8 rounded-xl border h-full"
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  {step.number}
                </motion.div>

                <h3 style={{ color: theme.text }} className="text-lg font-semibold mb-2">
                  {step.title}
                </h3>
                <p style={{ color: theme.textSecondary }} className="text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Pharmacies Section
const PharmaciesSection: React.FC = () => {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;

  const benefits = [
    'Increase customer reach and orders',
    'Real-time inventory management',
    'Automated billing and invoicing',
    'Customer analytics and insights',
  ];

  return (
    <motion.section
      id="pharmacies"
      style={{ backgroundColor: theme.bg }}
      className="py-20 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ color: theme.text }} className="text-3xl sm:text-4xl font-bold mb-6">
              Grow Your Pharmacy with MediTatva
            </h2>
            <p style={{ color: theme.textSecondary }} className="text-lg mb-8 leading-relaxed">
              Join thousands of pharmacies using MediTatva to increase their customer base, streamline operations, and provide better service.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span style={{ color: theme.text }}>{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg hover:opacity-90">
              Join as Pharmacy Partner
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              backgroundColor: theme.bgSecondary,
              borderColor: theme.border,
            }}
            className="p-8 rounded-2xl border"
          >
            <div className="space-y-6">
              {[
                { icon: BarChart3, label: 'Analytics Dashboard', color: 'text-blue-600' },
                { icon: Settings, label: 'Inventory Management', color: 'text-purple-600' },
                { icon: Clock, label: 'Order Management', color: 'text-blue-600' },
                { icon: Heart, label: 'Customer Support', color: 'text-purple-600' },
              ].map(({ icon: Icon, label, color }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <span style={{ color: theme.text }} className="font-semibold">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// Trust Section
const TrustSection: React.FC = () => {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;

  const trustPoints = [
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Your health data meets international healthcare privacy standards',
    },
    {
      icon: Lock,
      title: 'End-to-End Encrypted',
      description: 'Military-grade encryption protects all your information',
    },
    {
      icon: CheckCircle2,
      title: 'Verified Medicines',
      description: 'All medicines are verified and sourced from licensed distributors',
    },
  ];

  return (
    <motion.section
      className="py-20 sm:py-32 border-t"
      style={{
        backgroundColor: theme.bgSecondary,
        borderColor: theme.border,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 style={{ color: theme.text }} className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by Healthcare Professionals
          </h2>
          <p style={{ color: theme.textSecondary }} className="text-lg max-w-2xl mx-auto">
            Security, privacy, and reliability are at the heart of everything we do
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
              }}
              className="p-8 rounded-xl border text-center"
            >
              <motion.div
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4"
                whileHover={{ scale: 1.1 }}
              >
                <point.icon className="w-6 h-6 text-white" />
              </motion.div>

              <h3 style={{ color: theme.text }} className="text-lg font-semibold mb-2">
                {point.title}
              </h3>
              <p style={{ color: theme.textSecondary }} className="text-sm leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Footer Component
const Footer: React.FC = () => {
  const { isDark } = useTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <motion.footer
      style={{
        backgroundColor: theme.bgSecondary,
        borderColor: theme.border,
      }}
      className="border-t"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h4 style={{ color: theme.text }} className="font-semibold mb-4">
              MediTatva
            </h4>
            <p style={{ color: theme.textSecondary }} className="text-sm leading-relaxed">
              Making healthcare accessible and affordable for everyone.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ color: theme.text }} className="font-semibold mb-4">
              Product
            </h4>
            <ul style={{ color: theme.textSecondary }} className="space-y-2 text-sm">
              <li><a href="#" className="hover:opacity-100 opacity-80">Features</a></li>
              <li><a href="#" className="hover:opacity-100 opacity-80">Pricing</a></li>
              <li><a href="#" className="hover:opacity-100 opacity-80">Security</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: theme.text }} className="font-semibold mb-4">
              Company
            </h4>
            <ul style={{ color: theme.textSecondary }} className="space-y-2 text-sm">
              <li><a href="#" className="hover:opacity-100 opacity-80">About</a></li>
              <li><a href="#" className="hover:opacity-100 opacity-80">Blog</a></li>
              <li><a href="#" className="hover:opacity-100 opacity-80">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: theme.text }} className="font-semibold mb-4">
              Legal
            </h4>
            <ul style={{ color: theme.textSecondary }} className="space-y-2 text-sm">
              <li><a href="#" className="hover:opacity-100 opacity-80">Privacy</a></li>
              <li><a href="#" className="hover:opacity-100 opacity-80">Terms</a></li>
              <li><a href="#" className="hover:opacity-100 opacity-80">Contact</a></li>
            </ul>
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.bgTertiary,
            borderColor: theme.border,
          }}
          className="border-t pt-8 mt-8"
        >
          <p style={{ color: theme.textTertiary }} className="text-sm text-center">
            © 2024 MediTatva. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

// Main Landing Page Component
export const LandingPage: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(stored ? stored === 'dark' : prefersDark);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      <div style={{ backgroundColor: isDark ? colors.dark.bg : colors.light.bg }}>
        <Header />
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <PharmaciesSection />
        <TrustSection />
        <Footer />
      </div>
    </ThemeContext.Provider>
  );
};

export default LandingPage;
