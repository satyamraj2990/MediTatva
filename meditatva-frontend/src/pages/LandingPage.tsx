import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Shield, Clock, Pill, Heart,
  CheckCircle2, Menu, X, ArrowRight,
  Lock, Zap, BarChart3, Settings, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

// Header Component
const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Pharmacies', href: '#pharmacies' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <motion.header
      className={`sticky top-0 z-50 border-b backdrop-blur-md bg-opacity-95 ${
        theme === 'dark' 
          ? 'bg-gray-950 border-white/10' 
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div className="flex items-center gap-2">
            <img 
              src="/meditatva-logo.png?v=3" 
              alt="MediTatva Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className={`font-semibold text-xl ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              MediTatva
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm font-medium hover:opacity-100 opacity-80 transition-opacity ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-gray-800'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>

            {/* CTA Buttons */}
            <div className="hidden sm:flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className={`${
                  theme === 'dark'
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-slate-300 text-gray-900 hover:bg-slate-100'
                }`}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/login?role=patient')}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:opacity-90"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
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
            className={`md:hidden border-t py-4 space-y-3 ${
              theme === 'dark'
                ? 'bg-gray-900 border-white/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`block text-sm font-medium py-2 hover:opacity-100 opacity-80 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
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
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <motion.section
      id="home"
      className={`py-20 sm:py-32 ${
        theme === 'dark' 
          ? 'bg-gray-900' 
          : 'bg-gradient-to-b from-white to-slate-50'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 bg-emerald-500/10 border-emerald-500/30 text-emerald-500 text-sm font-semibold">
            <Shield className="w-4 h-4" />
            Trusted by 10,000+ healthcare users
          </div>

          <motion.h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            Find Your Medicines
            <span className="block bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent mt-2">
              Instantly & Safely
            </span>
          </motion.h1>

          <motion.p
            className={`text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            AI-powered healthcare platform connecting you to verified medicines, nearby pharmacies, and trusted medical information in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/login?role=patient')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-6 text-lg hover:opacity-90 flex items-center justify-center gap-2"
            >
              Login as Patient
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/login?role=pharmacy')}
              className={`px-8 py-6 text-lg ${
                theme === 'dark'
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-slate-300 text-gray-900 hover:bg-slate-100'
              }`}
            >
              Login as Pharmacy
            </Button>
          </motion.div>

          {/* Hero Image / Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`mt-16 rounded-2xl border p-8 sm:p-12 max-w-4xl mx-auto ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-white/10'
                : 'bg-slate-100/50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-emerald-600" />
                <span className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Search</span>
              </div>
              <ArrowRight className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-emerald-500" />
                <span className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Find</span>
              </div>
              <ArrowRight className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-emerald-600" />
                <span className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Connect</span>
              </div>
            </div>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Medicines Indexed', value: '2L+' },
              { label: 'Partner Pharmacies', value: '8,500+' },
              { label: 'Avg Search Time', value: '< 3 sec' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-white/10'
                    : 'bg-white border-slate-200'
                }`}
              >
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {item.value}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

// Features Section
const FeaturesSection: React.FC = () => {
  const { theme } = useTheme();

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
      className={`py-20 sm:py-32 ${
        theme === 'dark' ? 'bg-gray-950' : 'bg-white'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Powerful Features for Your Health
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
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
              className={`p-8 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-white/10 hover:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
              } group cursor-pointer`}
            >
              <motion.div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-500"
                whileHover={{ scale: 1.1 }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </motion.div>

              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {feature.title}
              </h3>
              <p className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
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
  const { theme } = useTheme();

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
      className={`py-20 sm:py-32 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-slate-50 to-white'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            How MediTatva Works
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
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
                  className={`hidden lg:block absolute top-1/4 -right-3 w-6 h-0.5 ${
                    theme === 'dark' ? 'bg-white/10' : 'bg-slate-300'
                  }`}
                />
              )}

              <div
                className={`p-8 rounded-xl border h-full ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-white/10'
                    : 'bg-white border-slate-200'
                }`}
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  {step.number}
                </motion.div>

                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
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
  const { theme } = useTheme();
  const navigate = useNavigate();

  const benefits = [
    'Increase customer reach and orders',
    'Real-time inventory management',
    'Automated billing and invoicing',
    'Customer analytics and insights',
  ];

  return (
    <motion.section
      id="pharmacies"
      className={`py-20 sm:py-32 ${
        theme === 'dark' ? 'bg-gray-950' : 'bg-white'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={`text-3xl sm:text-4xl font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Grow Your Pharmacy with MediTatva
            </h2>
            <p className={`text-lg mb-8 leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
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
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <Button 
              onClick={() => navigate('/login?role=pharmacy')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-6 text-lg hover:opacity-90"
            >
              Join as Pharmacy Partner
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`p-8 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-white/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-6">
              {[
                { icon: BarChart3, label: 'Analytics Dashboard', color: 'text-emerald-600' },
                { icon: Settings, label: 'Inventory Management', color: 'text-emerald-500' },
                { icon: Clock, label: 'Order Management', color: 'text-emerald-600' },
                { icon: Heart, label: 'Customer Support', color: 'text-emerald-500' },
              ].map(({ icon: Icon, label, color }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    theme === 'dark'
                      ? 'bg-emerald-900/50'
                      : 'bg-emerald-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <span className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
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
  const { theme } = useTheme();

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
      className={`py-20 sm:py-32 border-t ${
        theme === 'dark'
          ? 'bg-gray-900 border-white/10'
          : 'bg-gradient-to-b from-white to-slate-50 border-slate-200'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Trusted by Healthcare Professionals
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
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
              className={`p-8 rounded-xl border text-center ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-white/10'
                  : 'bg-white border-slate-200'
              }`}
            >
              <motion.div
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center mx-auto mb-4"
                whileHover={{ scale: 1.1 }}
              >
                <point.icon className="w-6 h-6 text-white" />
              </motion.div>

              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {point.title}
              </h3>
              <p className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
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
  const { theme } = useTheme();

  const footerLinks = [
    {
      section: 'Product',
      links: ['Features', 'Pricing', 'Security'],
    },
    {
      section: 'Company',
      links: ['About', 'Blog', 'Careers'],
    },
    {
      section: 'Legal',
      links: ['Privacy', 'Terms', 'Contact'],
    },
  ];

  return (
    <motion.footer
      className={`border-t py-12 sm:py-16 ${
        theme === 'dark'
          ? 'bg-gray-900 border-white/10'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-6 h-6 text-emerald-600" />
              <span className={`font-bold text-lg ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                MediTatva
              </span>
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Making healthcare accessible and affordable for everyone.
            </p>
          </motion.div>

          {/* Links Sections */}
          {footerLinks.map((section) => (
            <motion.div
              key={section.section}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className={`font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {section.section}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className={`text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-emerald-400'
                          : 'text-gray-600 hover:text-emerald-600'
                      }`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`border-t pt-8 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
        >
          <p className={`text-sm text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            © 2024 MediTatva. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

// Main Landing Page Component
export const LandingPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`relative ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Background gradient effect matching theme */}
      <div
        className={`fixed inset-0 pointer-events-none ${
          theme === 'dark'
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-900 opacity-60'
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-white to-slate-100 opacity-90'
        }`}
      />
      
      <div className="relative z-10">
        <Header />
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <PharmaciesSection />
        <TrustSection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
