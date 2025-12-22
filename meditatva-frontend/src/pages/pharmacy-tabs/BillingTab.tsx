import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, ShoppingCart, Trash2, FileText, Clock,
  Download, X, User, Phone, Mail, CreditCard, AlertTriangle, Package, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔧 BillingTab API_URL:', API_URL); // Debug log

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  brand?: string;
  price: number;
  current_stock: number;
  inStock: boolean;
  requiresPrescription: boolean;
}

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  current_stock: number;
}

interface InvoiceHistory {
  _id: string;
  invoiceNumber: string;
  patientName: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
}

export const BillingTab = memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistory[]>([]);
  const [showInventoryMedicines, setShowInventoryMedicines] = useState(true);

  // Fetch available medicines from backend (in-stock, non-expired)
  const fetchAvailableMedicines = async () => {
    console.log('📦 Fetching available medicines from:', `${API_URL}/invoices/available-medicines`);
    setIsLoadingAvailable(true);
    try {
      const response = await fetch(`${API_URL}/invoices/available-medicines`);
      console.log('📦 Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        setAvailableMedicines(data.data || []);
        console.log('✅ Loaded', data.data?.length || 0, 'medicines');
      } else {
        console.error('❌ Failed to fetch available medicines:', data.message);
        toast.error('Failed to load medicines');
      }
    } catch (error) {
      console.error('❌ Error fetching available medicines:', error);
      console.error('❌ Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      toast.error('Failed to connect to server');
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  // Load available medicines on mount
  useEffect(() => {
    fetchAvailableMedicines();
  }, []);

  // Search medicines from API
  useEffect(() => {
    const searchMedicines = async () => {
      if (searchQuery.length < 2) {
        setMedicines([]);
        return;
      }

      console.log('🔍 Searching medicines:', searchQuery);
      setIsSearching(true);
      try {
        setSearchError(null);
        const url = `${API_URL}/medicines/search?q=${encodeURIComponent(searchQuery)}`;
        console.log('🔍 Search URL:', url);
        const response = await fetch(url);
        console.log('🔍 Search response:', response.status);
        const data = await response.json();
        
        if (data.success) {
          setMedicines(data.data || []);
          console.log('✅ Found', data.data?.length || 0, 'medicines');
        } else {
          setMedicines([]);
          setSearchError(data.message || 'Failed to search medicines');
          toast.error(data.message || 'Failed to search medicines');
          console.error('❌ Search failed:', data.message);
        }
      } catch (error: any) {
        console.error('❌ Search error:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setMedicines([]);
        setSearchError('Failed to connect to server');
        toast.error('Failed to connect to server');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchMedicines, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch invoice history
  const fetchInvoiceHistory = async () => {
    console.log('📋 Fetching invoice history from:', `${API_URL}/invoices`);
    try {
      const response = await fetch(`${API_URL}/invoices`);
      console.log('📋 Invoice history response:', response.status);
      const data = await response.json();
      
      if (data.success) {
        setInvoiceHistory(data.data || []);
        console.log('✅ Loaded', data.data?.length || 0, 'invoices');
      } else {
        console.error('❌ Failed to fetch invoice history:', data.message);
      }
    } catch (error) {
      console.error('❌ Failed to fetch invoice history:', error);
      console.error('❌ Error details:', {
        name: (error as Error).name,
        message: (error as Error).message
      });
    }
  };

  useEffect(() => {
    fetchInvoiceHistory();
  }, []);

  const addToCart = (medicine: Medicine) => {
    // Check stock availability
    if (medicine.current_stock === 0) {
      toast.error(`${medicine.name} is out of stock`);
      return;
    }

    const existingItem = cart.find(item => item._id === medicine._id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      
      // Validate against current stock
      if (newQuantity > medicine.current_stock) {
        toast.error(`Only ${medicine.current_stock} units available in stock`);
        return;
      }

      setCart(cart.map(item =>
        item._id === medicine._id
          ? { ...item, quantity: newQuantity }
          : item
      ));
      toast.success(`${medicine.name} quantity increased`);
    } else {
      setCart([...cart, { 
        _id: medicine._id,
        name: medicine.name, 
        price: medicine.price,
        quantity: 1,
        current_stock: medicine.current_stock
      }]);
      toast.success(`${medicine.name} added to cart`);
    }
  };

  const removeFromCart = (id: string) => {
    const item = cart.find(i => i._id === id);
    setCart(cart.filter(item => item._id !== id));
    toast.success(`${item?.name} removed from cart`);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const item = cart.find(i => i._id === id);
    
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    if (item && newQuantity > item.current_stock) {
      toast.error(`Only ${item.current_stock} units available`);
      return;
    }
    
    setCart(cart.map(item =>
      item._id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // ==================== CALCULATION FUNCTIONS ====================
  const calculateSubtotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return Math.round(subtotal * 100) / 100; // Round to 2 decimal places
  };

  const calculateTax = () => {
    const tax = calculateSubtotal() * 0.05; // 5% GST
    return Math.round(tax * 100) / 100;
  };

  const calculateCGST = () => {
    const cgst = calculateTax() / 2; // 2.5% CGST
    return Math.round(cgst * 100) / 100;
  };

  const calculateSGST = () => {
    const sgst = calculateTax() / 2; // 2.5% SGST
    return Math.round(sgst * 100) / 100;
  };

  const calculatePlatformFee = () => {
    const fee = calculateSubtotal() * 0.02; // 2% platform fee
    return Math.round(fee * 100) / 100;
  };

  const calculateTotal = () => {
    // Ensure exact match: Subtotal + CGST + SGST + Service Charge
    const total = calculateSubtotal() + calculateCGST() + calculateSGST() + calculatePlatformFee();
    return Math.round(total * 100) / 100;
  };

  // ==================== CURRENCY FORMATTING HELPER ====================
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }
    setShowBillingModal(true);
  };

  const handleConfirmInvoice = async () => {
    if (!patientName || !contactNumber) {
      toast.error("Please fill in patient details");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    setIsProcessing(true);

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      const currentDate = new Date();

      // Try to save to backend (if available)
      let backendSaved = false;
      let savedInvoiceNumber = invoiceNumber;
      
      try {
        const invoiceData = {
          customerName: patientName,
          customerPhone: contactNumber,
          paymentMethod: paymentType,
          items: cart.map(item => ({
            medicineId: item._id,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          notes: email ? `Customer email: ${email}` : undefined
        };

        console.log('Sending invoice data:', invoiceData);

        const response = await fetch(`${API_URL}/invoices/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData)
        });

        const result = await response.json();
        
        if (result.success) {
          backendSaved = true;
          savedInvoiceNumber = result.data.invoiceNumber;
          toast.success("✅ Invoice saved to database!");
          console.log('Invoice saved successfully:', result.data);
        } else {
          console.error('Backend save failed:', result);
          toast.error(`Failed to save invoice: ${result.message || 'Unknown error'}`);
          throw new Error(result.message || 'Failed to save invoice');
        }
      } catch (error: any) {
        console.error("Backend save error:", error);
        toast.error(`Invoice creation failed: ${error.message}`);
        setIsProcessing(false);
        return; // Don't generate PDF if backend fails
      }

      // ==================== PROFESSIONAL INVOICE GENERATION ====================
      // A4 Page setup with proper margins
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // Consistent margins
      const contentWidth = pageWidth - (2 * margin);
      
      // ==================== PREMIUM HEADER SECTION ====================
      // Professional gradient header (reduced height from 55 to 48)
      pdf.setFillColor(21, 101, 192); // Primary blue
      pdf.rect(0, 0, pageWidth, 48, 'F');
      
      // Accent top border
      pdf.setFillColor(13, 189, 139); // Teal accent
      pdf.rect(0, 0, pageWidth, 2, 'F');
      
      // Company branding section
      // Logo circle (white background)
      pdf.setFillColor(255, 255, 255);
      pdf.circle(margin + 10, 18, 9, 'F');
      
      // Logo initial
      pdf.setTextColor(21, 101, 192);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text("M", margin + 10, 21, { align: 'center' });
      
      // Company name and details (white text on blue)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text("MEDITATVA HEALTHCARE", margin + 24, 14);
      
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Premium Pharmacy & Medical Services", margin + 24, 20);
      
      pdf.setFontSize(7.5);
      pdf.text("123 Medical Plaza, Healthcare District, New Delhi - 110001", margin + 24, 25);
      pdf.text("Phone: +91-9876-543-210  |  Email: info@meditatva.com", margin + 24, 30);
      
      // Compliance details (smaller font, line wrapping handled)
      pdf.setFontSize(6.5);
      pdf.text("Drug License: DL-2024-MH-12345-67890  |  GSTIN: 29ABCDE1234F1Z5", margin + 24, 35);
      pdf.text("FSSAI: 10012345678901", margin + 24, 39);
      
      // ==================== INVOICE TITLE BAR ====================
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, 48, pageWidth, 13, 'F');
      
      // Invoice title (left)
      pdf.setTextColor(21, 101, 192);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text("TAX INVOICE", margin, 57);
      
      // PAID badge (right) - professional design
      pdf.setDrawColor(34, 197, 94); // Green border
      pdf.setLineWidth(1.2);
      pdf.roundedRect(pageWidth - margin - 28, 51, 28, 9, 2, 2, 'S');
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("✓ PAID", pageWidth - margin - 14, 57, { align: 'center' });
      
      // ==================== INVOICE & PATIENT DETAILS ====================
      let yPos = 68; // Adjusted for reduced header height
      
      // Box dimensions for perfect consistency
      const boxWidth = (contentWidth - 8) / 2; // 8mm gap between boxes
      const boxHeight = 32; // Same height for both boxes
      const boxPadding = 3; // Same padding for both
      
      // Left box - Invoice details
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(250, 251, 252);
      pdf.roundedRect(margin, yPos, boxWidth, boxHeight, 1.5, 1.5, 'FD');
      
      pdf.setTextColor(21, 101, 192);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text("INVOICE DETAILS", margin + boxPadding, yPos + 6);
      
      // Invoice details content
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Invoice No:", margin + boxPadding, yPos + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(savedInvoiceNumber, margin + 26, yPos + 12);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text("Date:", margin + boxPadding, yPos + 17);
      pdf.setFont('helvetica', 'normal');
      pdf.text(currentDate.toLocaleDateString('en-IN', { 
        day: '2-digit',
        month: 'short', 
        year: 'numeric' 
      }), margin + 26, yPos + 17);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text("Time:", margin + boxPadding, yPos + 22);
      pdf.setFont('helvetica', 'normal');
      pdf.text(currentDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }), margin + 26, yPos + 22);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text("Payment:", margin + boxPadding, yPos + 27);
      pdf.setFont('helvetica', 'normal');
      pdf.text(paymentType.toUpperCase(), margin + 26, yPos + 27);
      
      // Right box - Patient details (same height and padding)
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(255, 250, 245);
      pdf.roundedRect(margin + boxWidth + 8, yPos, boxWidth, boxHeight, 1.5, 1.5, 'FD');
      
      pdf.setTextColor(21, 101, 192);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text("PATIENT INFORMATION", margin + boxWidth + 8 + boxPadding, yPos + 6);
      
      // Patient details content
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Name:", margin + boxWidth + 8 + boxPadding, yPos + 12);
      pdf.setFont('helvetica', 'normal');
      const maxNameWidth = boxWidth - 22;
      const truncatedName = patientName.length > 25 ? patientName.substring(0, 25) + '...' : patientName;
      pdf.text(truncatedName, margin + boxWidth + 8 + 22, yPos + 12);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text("Phone:", margin + boxWidth + 8 + boxPadding, yPos + 17);
      pdf.setFont('helvetica', 'normal');
      pdf.text(contactNumber, margin + boxWidth + 8 + 22, yPos + 17);
      
      if (email) {
        pdf.setFont('helvetica', 'bold');
        pdf.text("Email:", margin + boxWidth + 8 + boxPadding, yPos + 22);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        const truncatedEmail = email.length > 30 ? email.substring(0, 30) + '...' : email;
        pdf.text(truncatedEmail, margin + boxWidth + 8 + 22, yPos + 22);
      }
      
      // ==================== MEDICINES TABLE ====================
      yPos = 108; // Adjusted for new header/box heights
      
      // Define precise column positions for perfect alignment
      const col = {
        serial: margin + 2,
        medicine: margin + 10,
        hsn: margin + 88,
        qty: margin + 110,      // Center-aligned column center
        rate: margin + 138,     // Right-aligned column end
        amount: margin + contentWidth - 2  // Right-aligned column end
      };
      
      // Table header
      pdf.setFillColor(21, 101, 192);
      pdf.rect(margin, yPos, contentWidth, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text("#", col.serial, yPos + 7);
      pdf.text("Medicine Name", col.medicine, yPos + 7);
      pdf.text("HSN", col.hsn, yPos + 7);
      pdf.text("Qty", col.qty, yPos + 7, { align: 'center' });
      pdf.text("Rate (₹)", col.rate, yPos + 7, { align: 'right' });
      pdf.text("Amount (₹)", col.amount, yPos + 7, { align: 'right' });
      
      // Table rows
      yPos += 10;
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'normal');
      
      cart.forEach((item, index) => {
        // Check for page break
        if (yPos > pageHeight - 85) {
          pdf.addPage();
          yPos = 20;
          
          // Repeat table header on new page
          pdf.setFillColor(21, 101, 192);
          pdf.rect(margin, yPos, contentWidth, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text("#", col.serial, yPos + 7);
          pdf.text("Medicine Name", col.medicine, yPos + 7);
          pdf.text("HSN", col.hsn, yPos + 7);
          pdf.text("Qty", col.qty, yPos + 7, { align: 'center' });
          pdf.text("Rate (₹)", col.rate, yPos + 7, { align: 'right' });
          pdf.text("Amount (₹)", col.amount, yPos + 7, { align: 'right' });
          yPos += 10;
          pdf.setTextColor(40, 40, 40);
          pdf.setFont('helvetica', 'normal');
        }
        
        // Zebra striping
        if (index % 2 === 0) {
          pdf.setFillColor(252, 252, 252);
          pdf.rect(margin, yPos, contentWidth, 9, 'F');
        }
        
        // Row border
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.1);
        pdf.line(margin, yPos + 9, margin + contentWidth, yPos + 9);
        
        pdf.setFontSize(8.5);
        
        // Serial number
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}`, col.serial, yPos + 6.5);
        
        // Medicine name (truncate if too long)
        pdf.setFont('helvetica', 'bold');
        const maxMedNameLength = 40;
        const displayName = item.name.length > maxMedNameLength 
          ? item.name.substring(0, maxMedNameLength) + '...' 
          : item.name;
        pdf.text(displayName, col.medicine, yPos + 6.5);
        
        // HSN code
        pdf.setFont('helvetica', 'normal');
        pdf.text("30049099", col.hsn, yPos + 6.5);
        
        // Quantity (center aligned)
        pdf.text(`${item.quantity}`, col.qty, yPos + 6.5, { align: 'center' });
        
        // Rate (right aligned with proper formatting - no ₹ in table cells)
        const rate = Math.round(item.price * 100) / 100;
        pdf.text(rate.toFixed(2), col.rate, yPos + 6.5, { align: 'right' });
        
        // Amount (right aligned, bold)
        pdf.setFont('helvetica', 'bold');
        const amount = Math.round((item.price * item.quantity) * 100) / 100;
        pdf.text(amount.toFixed(2), col.amount, yPos + 6.5, { align: 'right' });
        
        yPos += 9;
      });
      
      // ==================== FINANCIAL SUMMARY ====================
      yPos += 6;
      
      // Summary box dimensions
      const summaryBoxX = margin + contentWidth - 75;
      
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(summaryBoxX, yPos, margin + contentWidth, yPos);
      
      yPos += 7;
      
      // Subtotal
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Subtotal:", summaryBoxX + 2, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(formatCurrency(calculateSubtotal()), margin + contentWidth - 2, yPos, { align: 'right' });
      
      yPos += 6;
      
      // CGST
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text("CGST @ 2.5%:", summaryBoxX + 2, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(formatCurrency(calculateCGST()), margin + contentWidth - 2, yPos, { align: 'right' });
      
      yPos += 6;
      
      // SGST
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text("SGST @ 2.5%:", summaryBoxX + 2, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(formatCurrency(calculateSGST()), margin + contentWidth - 2, yPos, { align: 'right' });
      
      yPos += 6;
      
      // Service charge
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Service Charge:", summaryBoxX + 2, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(formatCurrency(calculatePlatformFee()), margin + contentWidth - 2, yPos, { align: 'right' });
      
      yPos += 4;
      
      // Divider before grand total
      pdf.setDrawColor(21, 101, 192);
      pdf.setLineWidth(0.5);
      pdf.line(summaryBoxX, yPos, margin + contentWidth, yPos);
      
      yPos += 9;
      
      // GRAND TOTAL - Fixed overflow and improved visibility
      const totalBoxWidth = 77;
      pdf.setFillColor(21, 101, 192);
      pdf.roundedRect(summaryBoxX - 2, yPos - 7, totalBoxWidth, 12, 1.5, 1.5, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text("GRAND TOTAL:", summaryBoxX + 2, yPos);
      
      // Calculate proper position for amount to prevent overflow
      const grandTotalText = formatCurrency(calculateTotal());
      pdf.setFontSize(11.5);
      pdf.text(grandTotalText, margin + contentWidth - 4, yPos, { align: 'right' });
      
      // ==================== AMOUNT IN WORDS ====================
      yPos += 14;
      
      pdf.setDrawColor(21, 101, 192);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(240, 248, 255);
      pdf.roundedRect(margin, yPos, contentWidth, 11, 1.5, 1.5, 'FD');
      
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Amount in Words:", margin + 3, yPos + 7);
      
      // Convert to words with proper capitalization and paise handling
      const totalAmount = calculateTotal();
      const rupees = Math.floor(totalAmount);
      const paise = Math.round((totalAmount - rupees) * 100);
      
      pdf.setFont('helvetica', 'normal');
      let amountText = numberToWords(rupees);
      
      if (paise > 0) {
        amountText += ` and ${numberToWords(paise)} Paise`;
      }
      amountText += " Only";
      
      // Capitalize first letter
      amountText = amountText.charAt(0).toUpperCase() + amountText.slice(1);
      
      pdf.text(amountText, margin + 34, yPos + 7);
      
      // ==================== TERMS & CONDITIONS ====================
      yPos += 18;
      
      pdf.setTextColor(21, 101, 192);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Terms & Conditions:", margin, yPos);
      
      pdf.setTextColor(70, 70, 70);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');
      yPos += 5;
      pdf.text("• All medicines sold are subject to stock availability. Please verify items before leaving.", margin + 2, yPos);
      yPos += 4;
      pdf.text("• Store medicines in a cool, dry place. Keep out of reach of children.", margin + 2, yPos);
      yPos += 4;
      pdf.text("• Check expiry dates before consumption. Consult a physician for adverse reactions.", margin + 2, yPos);
      yPos += 4;
      pdf.text("• This is a computer-generated invoice. No signature required. Valid for GST compliance.", margin + 2, yPos);
      yPos += 4;
      
      if (backendSaved) {
        pdf.setTextColor(34, 197, 94);
        pdf.text("✓ Invoice successfully saved to database. Reference ID: " + savedInvoiceNumber, margin + 2, yPos);
      } else {
        pdf.setTextColor(234, 88, 12);
        pdf.text("⚠ Generated in offline mode. Please ensure proper record maintenance.", margin + 2, yPos);
      }
      
      // ==================== SIGNATURE SECTION ====================
      yPos = pageHeight - 40;
      
      // Signature lines
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, margin + 50, yPos);
      pdf.line(pageWidth - margin - 50, yPos, pageWidth - margin, yPos);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text("Customer Signature", margin + 25, yPos + 5, { align: 'center' });
      pdf.text("Authorized Signatory", pageWidth - margin - 25, yPos + 5, { align: 'center' });
      
      // ==================== PROFESSIONAL FOOTER ====================
      yPos = pageHeight - 25;
      
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, yPos, pageWidth, 25, 'F');
      
      pdf.setFillColor(21, 101, 192);
      pdf.rect(0, yPos, pageWidth, 1.5, 'F');
      
      pdf.setTextColor(21, 101, 192);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Thank You for Choosing MediTatva Healthcare!", pageWidth / 2, yPos + 9, { align: 'center' });
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Your Health, Our Priority  •  24/7 Service  •  Emergency Helpline: +91-9876-543-210", pageWidth / 2, yPos + 14, { align: 'center' });
      
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated on ${currentDate.toLocaleString('en-IN')}  |  Page 1 of 1`, pageWidth / 2, yPos + 19, { align: 'center' });

      
      // ==================== SAVE PDF ====================
      const fileName = `MediTatva_Invoice_${savedInvoiceNumber}_${patientName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      toast.success(`✅ Invoice ${savedInvoiceNumber} downloaded successfully!`);
      
      // Reset form
      setShowBillingModal(false);
      setCart([]);
      setPatientName("");
      setContactNumber("");
      setEmail("");
      setPaymentType("cash");
      
      // Refresh data from backend
      await fetchInvoiceHistory();
      await fetchAvailableMedicines(); // Refresh medicine list with updated stock
      
      toast.success("🔄 Inventory updated successfully!");
    } catch (error: any) {
      console.error("Invoice generation error:", error);
      toast.error(`Failed to generate invoice: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to convert number to words (lowercase for flexibility)
  const numberToWords = (num: number): string => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    
    if (num === 0) return 'zero';
    
    const numInt = Math.floor(num);
    
    if (numInt > 999999999) return 'amount too large';
    
    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    
    return convert(numInt);
  };

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EBF5FB]"
        style={{ filter: 'none', WebkitFilter: 'none' }}
      >
        {/* Full-Width Professional POS Dashboard - 2fr + 1fr Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          
          {/* LEFT COLUMN - Medicine Search & Selection (2fr / 66.67%) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Medicine Search Card */}
            <Card
              className="p-4 lg:p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(27, 108, 168, 0.12)',
                boxShadow: '0 2px 12px rgba(27, 108, 168, 0.06)',
                borderRadius: '12px',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0A2342] flex items-center gap-2">
                  <Package className="h-6 w-6 text-[#1B6CA8]" />
                  Add Medicines to Bill
                </h3>
                {cart.length > 0 && (
                  <Badge className="bg-[#1B6CA8]/10 text-[#1B6CA8] border-[#1B6CA8]/30 px-3 py-1 text-sm">
                    {cart.length} items in cart
                  </Badge>
                )}
              </div>
              
              {/* Toggle between Search and Inventory */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={showInventoryMedicines ? "default" : "outline"}
                  onClick={() => setShowInventoryMedicines(true)}
                  size="default"
                  className={showInventoryMedicines 
                    ? "bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] text-white shadow-md" 
                    : "border-[#4FC3F7]/30 text-[#1B6CA8] hover:bg-[#E8F4F8]"}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Inventory
                </Button>
                <Button
                  variant={!showInventoryMedicines ? "default" : "outline"}
                  onClick={() => setShowInventoryMedicines(false)}
                  size="default"
                  className={!showInventoryMedicines 
                    ? "bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] text-white shadow-md" 
                    : "border-[#4FC3F7]/30 text-[#1B6CA8] hover:bg-[#E8F4F8]"}
                >
                  <Search className="h-4 w-4 mr-2" />
                  API Search
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#5A6A85]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={showInventoryMedicines ? "Search inventory by name or brand..." : "Search by medicine name..."}
                    className="pl-12 h-12 text-base bg-white border-[#4FC3F7]/30 text-[#0A2342] placeholder:text-[#5A6A85] focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/20"
                  />
                </div>
              </div>

              {/* Scrollable Medicine List */}
              <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-2 custom-scrollbar">
            {showInventoryMedicines ? (
              // Show inventory medicines from backend
              <>
                {isLoadingAvailable && (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-[#1B6CA8] border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-[#5A6A85]">Loading medicines...</p>
                  </div>
                )}
                
                {!isLoadingAvailable && availableMedicines
                  .filter(med => 
                    searchQuery.length === 0 || 
                    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    med.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    med.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((medicine) => (
                    <motion.div
                      key={medicine._id}
                      className="flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md"
                      style={{
                        borderColor: medicine.inStock ? 'rgba(79, 195, 247, 0.3)' : 'rgba(231, 76, 60, 0.3)',
                        backgroundColor: medicine.inStock ? 'rgba(255, 255, 255, 1)' : 'rgba(231, 76, 60, 0.05)',
                      }}
                      whileHover={{ scale: 1.01, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex-1">
                        <p className="font-bold text-[#0A2342] text-base mb-1">{medicine.name}</p>
                        <p className="text-sm text-[#5A6A85] mb-2">
                          {medicine.brand || medicine.genericName}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-[#1B6CA8]">
                            ₹{medicine.price}
                          </span>
                          <Badge
                            className={
                              medicine.current_stock === 0
                                ? "bg-[#E74C3C]/10 text-[#E74C3C] border-[#E74C3C]/30"
                                : medicine.current_stock < 50
                                ? "bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/30"
                                : "bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/30"
                            }
                          >
                            Stock: {medicine.current_stock}
                          </Badge>
                          {medicine.requiresPrescription && (
                            <Badge className="bg-[#9B59B6]/10 text-[#9B59B6] border-[#9B59B6]/30">
                              Rx Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => addToCart(medicine)}
                        disabled={medicine.current_stock === 0}
                        size="lg"
                        className={
                          medicine.current_stock > 0
                            ? "bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white font-semibold shadow-md hover:shadow-lg transition-all px-6"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        {medicine.current_stock > 0 ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </motion.div>
                  ))}
                {!isLoadingAvailable && availableMedicines.filter(med => 
                  searchQuery.length === 0 || 
                  med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  med.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  med.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-[#5A6A85]/50 mx-auto mb-3" />
                    <p className="text-[#5A6A85] text-lg">No matching medicines in inventory</p>
                  </div>
                )}
              </>
            ) : (
              // Show API search results
              <>
            {isSearching && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[#1B6CA8] border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-[#5A6A85]">Searching medicines...</p>
              </div>
            )}
            
            {!isSearching && searchQuery.length >= 2 && medicines.length === 0 && (
              <div className="text-center py-12">
                {searchError ? (
                  <>
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 text-lg">{searchError}</p>
                  </>
                ) : (
                  <>
                    <Search className="h-16 w-16 text-[#5A6A85]/50 mx-auto mb-3" />
                    <p className="text-[#5A6A85] text-lg">No medicines found</p>
                  </>
                )}
              </div>
            )}
            
            {!isSearching && medicines.map((med) => (
              <motion.div
                key={med._id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#F7F9FC] border border-[#4FC3F7]/20 hover:shadow-md transition-all"
                whileHover={{ scale: 1.01, backgroundColor: '#E8F4F8', y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-[#0A2342] text-base">{med.name}</p>
                    {med.requiresPrescription && (
                      <Badge className="bg-red-50 text-red-700 border-red-200">Rx Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#5A6A85] mb-1">
                    <span className="font-bold text-[#1B6CA8]">₹{med.price}</span>
                    {" • "}
                    {med.current_stock > 0 ? (
                      <span className={med.current_stock <= 10 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                        In Stock: {med.current_stock}
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    )}
                  </p>
                  {med.genericName && (
                    <p className="text-xs text-[#5A6A85]">{med.genericName}</p>
                  )}
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    onClick={() => addToCart(med)}
                    disabled={med.current_stock === 0}
                    className="bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white font-semibold disabled:opacity-50 shadow-md hover:shadow-lg px-6"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                </motion.div>
              </motion.div>
            ))}
              </>
            )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - Invoice Cart (1fr / 33.33%) - Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              
              {/* Cart Card */}
              <Card
                className="p-4 lg:p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(27, 108, 168, 0.12)',
                  boxShadow: '0 2px 12px rgba(27, 108, 168, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <h3 className="text-xl font-bold text-[#0A2342] mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-[#1B6CA8]" />
                  Invoice Items
                  {cart.length > 0 && (
                    <Badge className="bg-[#1B6CA8] text-white ml-auto">{cart.length}</Badge>
                  )}
                </h3>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-[#5A6A85]/50 mx-auto mb-3" />
                    <p className="text-[#5A6A85] font-medium">Cart is empty</p>
                    <p className="text-[#5A6A85] text-sm mt-1">Add medicines to create invoice</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items - Scrollable */}
                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map((item) => (
                        <motion.div
                          key={item._id}
                          className="p-3 rounded-lg bg-gradient-to-r from-[#F7F9FC] to-[#EBF5FB] border border-[#4FC3F7]/20"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-[#0A2342] text-sm">{item.name}</p>
                              <p className="text-xs text-[#5A6A85]">
                                {formatCurrency(item.price)} × {item.quantity}
                                {item.current_stock <= 10 && (
                                  <span className="ml-2 text-orange-600 font-medium">• Low: {item.current_stock}</span>
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#E74C3C] hover:text-[#C0392B] hover:bg-[#E74C3C]/10 h-8 w-8 p-0"
                              onClick={() => removeFromCart(item._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-[#4FC3F7]/30 hover:bg-[#E8F4F8]"
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="text-[#0A2342] w-10 text-center font-bold text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-[#4FC3F7]/30 hover:bg-[#E8F4F8]"
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                disabled={item.quantity >= item.current_stock}
                              >
                                +
                              </Button>
                            </div>
                            <p className="text-[#012A4A] font-bold text-base">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Summary Section */}
                    <div className="border-t-2 border-[#4FC3F7]/20 pt-4 space-y-3">
                      <div className="flex justify-between text-[#5A6A85]">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-bold">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between text-[#5A6A85] text-sm">
                        <span>CGST (2.5%):</span>
                        <span className="font-medium">{formatCurrency(calculateCGST())}</span>
                      </div>
                      <div className="flex justify-between text-[#5A6A85] text-sm">
                        <span>SGST (2.5%):</span>
                        <span className="font-medium">{formatCurrency(calculateSGST())}</span>
                      </div>
                      <div className="flex justify-between text-[#5A6A85]">
                        <span className="font-medium">Platform Fee (2%):</span>
                        <span className="font-medium">{formatCurrency(calculatePlatformFee())}</span>
                      </div>
                      <div className="border-t-2 border-[#4FC3F7]/30 pt-3 mt-3"></div>
                      <div className="flex justify-between items-center bg-gradient-to-r from-[#1B6CA8]/10 to-[#4FC3F7]/10 p-3 rounded-lg">
                        <span className="text-lg font-bold text-[#0A2342]">Final Total:</span>
                        <span className="text-2xl font-bold text-[#1B6CA8]">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <motion.div className="mt-6" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleGenerateInvoice}
                        className="w-full bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                      >
                        <FileText className="h-6 w-6 mr-2" />
                        Generate Invoice
                      </Button>
                    </motion.div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Billing History - Full Width Below */}
        <div className="w-full px-4 lg:px-6 pb-6">
          <Card
            className="p-4 lg:p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(27, 108, 168, 0.12)',
              boxShadow: '0 2px 12px rgba(27, 108, 168, 0.06)',
              borderRadius: '12px',
            }}
          >
            <h3 className="text-xl font-bold text-[#0A2342] mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-[#1B6CA8]" />
              Billing History
            </h3>
            <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#4FC3F7]/20">
                  <th className="text-left py-2 text-[#0A2342] font-semibold">Invoice ID</th>
                  <th className="text-left py-2 text-[#0A2342] font-semibold">Patient</th>
                  <th className="text-left py-2 text-[#0A2342] font-semibold">Date</th>
                  <th className="text-left py-2 text-[#0A2342] font-semibold">Total</th>
                  <th className="text-left py-2 text-[#0A2342] font-semibold">Status</th>
                  <th className="text-left py-2 text-[#0A2342] font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceHistory.map((invoice) => (
                  <motion.tr
                    key={invoice._id}
                    className="border-b border-[#4FC3F7]/10 hover:bg-[#E8F4F8]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="py-3 text-[#0A2342] font-medium">{invoice.invoiceNumber}</td>
                    <td className="py-3 text-[#0A2342]">{invoice.patientName}</td>
                    <td className="py-3 text-[#5A6A85]">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-[#0A2342] font-semibold">₹{invoice.total.toFixed(2)}</td>
                    <td className="py-3">
                      <Badge
                        className="bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/30 font-semibold"
                      >
                        Paid
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="ghost" className="text-[#1B6CA8] hover:text-[#4FC3F7] hover:bg-[#E8F4F8]">
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card>
        </div>
      </motion.div>

      {/* Patient Billing Modal */}
      <AnimatePresence>
        {showBillingModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBillingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card
                className="overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(27, 108, 168, 0.2)',
                }}
              >
                <div
                  className="p-6 border-b relative"
                  style={{
                    background: 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="h-7 w-7" />
                      Patient Information
                    </h3>
                    <Button
                      onClick={() => setShowBillingModal(false)}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="text-[#0A2342] font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-[#1B6CA8]" />
                      Patient Name *
                    </Label>
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient name"
                      className="border-[#4FC3F7]/30 focus:border-[#1B6CA8]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="text-[#0A2342] font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#1B6CA8]" />
                      Contact Number *
                    </Label>
                    <Input
                      id="contactNumber"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Enter contact number"
                      className="border-[#4FC3F7]/30 focus:border-[#1B6CA8]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#0A2342] font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#1B6CA8]" />
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="border-[#4FC3F7]/30 focus:border-[#1B6CA8]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentType" className="text-[#0A2342] font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#1B6CA8]" />
                      Payment Method
                    </Label>
                    <select
                      id="paymentType"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full p-2 border border-[#4FC3F7]/30 rounded-md focus:border-[#1B6CA8] focus:outline-none focus:ring-1 focus:ring-[#1B6CA8]"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>

                  <div className="border-t border-[#4FC3F7]/20 pt-4 mt-6">
                    <h4 className="font-bold text-[#0A2342] mb-3">Invoice Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#5A6A85]">Subtotal:</span>
                        <span className="font-semibold text-[#0A2342]">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A6A85]">CGST (2.5%):</span>
                        <span className="font-semibold text-[#0A2342]">{formatCurrency(calculateCGST())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A6A85]">SGST (2.5%):</span>
                        <span className="font-semibold text-[#0A2342]">{formatCurrency(calculateSGST())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A6A85]">Platform Fee (2%):</span>
                        <span className="font-semibold text-[#0A2342]">{formatCurrency(calculatePlatformFee())}</span>
                      </div>
                      <div className="border-t border-[#4FC3F7]/20 pt-2 mt-2 flex justify-between">
                        <span className="text-lg font-bold text-[#0A2342]">Total Amount:</span>
                        <span className="text-lg font-bold text-[#1B6CA8]">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setShowBillingModal(false)}
                      variant="outline"
                      className="flex-1 border-[#4FC3F7]/30 text-[#1B6CA8] hover:bg-[#E8F4F8]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmInvoice}
                      className="flex-1 bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white font-semibold"
                    >
                      Confirm & Generate PDF
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

BillingTab.displayName = "BillingTab";
