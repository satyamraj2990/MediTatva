import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, ShoppingCart, Trash2, FileText, Clock,
  Download, X, User, Phone, Mail, CreditCard, AlertTriangle, Package
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

// Local inventory medicines (same as InventoryTab)
const inventoryMedicines: Medicine[] = [
  {
    _id: "1",
    name: "Paracetamol 500mg",
    brand: "PharmaCo Ltd",
    price: 2.50,
    current_stock: 450,
    inStock: true,
    requiresPrescription: false,
  },
  {
    _id: "2",
    name: "Cetirizine 10mg",
    brand: "AllergyMed",
    price: 4.75,
    current_stock: 28,
    inStock: true,
    requiresPrescription: false,
  },
  {
    _id: "3",
    name: "Ibuprofen 400mg",
    brand: "PainFree Corp",
    price: 3.20,
    current_stock: 185,
    inStock: true,
    requiresPrescription: false,
  },
  {
    _id: "4",
    name: "Amoxicillin 500mg",
    brand: "AntiBio Pharma",
    price: 8.50,
    current_stock: 0,
    inStock: false,
    requiresPrescription: true,
  },
  {
    _id: "5",
    name: "Omeprazole 20mg",
    brand: "DigestiCare",
    price: 5.25,
    current_stock: 320,
    inStock: true,
    requiresPrescription: false,
  },
  {
    _id: "6",
    name: "Metformin 500mg",
    brand: "DiabetesControl",
    price: 6.90,
    current_stock: 140,
    inStock: true,
    requiresPrescription: true,
  },
  {
    _id: "7",
    name: "Aspirin 75mg",
    brand: "CardioHealth",
    price: 1.80,
    current_stock: 95,
    inStock: true,
    requiresPrescription: false,
  },
  {
    _id: "8",
    name: "Atorvastatin 10mg",
    brand: "CardioMed",
    price: 9.80,
    current_stock: 210,
    inStock: true,
    requiresPrescription: true,
  },
];

export const BillingTab = memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // Search medicines from API
  useEffect(() => {
    const searchMedicines = async () => {
      if (searchQuery.length < 2) {
        setMedicines([]);
        return;
      }

      setIsSearching(true);
      try {
        setSearchError(null);
        const response = await fetch(`${API_URL}/medicines/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success) {
          setMedicines(data.data || []);
        } else {
          setMedicines([]);
          setSearchError(data.message || 'Failed to search medicines');
          toast.error(data.message || 'Failed to search medicines');
        }
      } catch (error: any) {
        console.error('Search error:', error);
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
    try {
      const response = await fetch(`${API_URL}/invoices`);
      const data = await response.json();
      
      if (data.success) {
        setInvoiceHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch invoice history:', error);
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

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05; // 5% GST
  };

  const calculatePlatformFee = () => {
    return calculateSubtotal() * 0.02; // 2% platform fee
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculatePlatformFee();
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
          toast.success("✅ Invoice saved to database!");
        }
      } catch (error) {
        console.log("Backend not available, generating invoice locally");
        toast.info("📄 Generating invoice locally");
      }

      // Generate PDF Invoice (works with or without backend)
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Modern gradient header
      pdf.setFillColor(27, 108, 168);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Add decorative accent
      pdf.setFillColor(79, 195, 247);
      pdf.rect(0, 0, pageWidth, 5, 'F');
      
      // Company name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont(undefined, 'bold');
      pdf.text("MediTatva", pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'normal');
      pdf.text("PHARMACY & HEALTHCARE", pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.text("📍 123 Health Street, Medical City | 📞 +91-9876543210 | 📧 info@meditatva.com", pageWidth / 2, 40, { align: 'center' });

      // Invoice title
      pdf.setFillColor(232, 244, 248);
      pdf.rect(0, 52, pageWidth, 15, 'F');
      pdf.setTextColor(27, 108, 168);
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text("TAX INVOICE", pageWidth / 2, 62, { align: 'center' });

      // Invoice metadata
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      // Left side
      pdf.setFont(undefined, 'bold');
      pdf.text("Invoice Number:", 20, 80);
      pdf.setFont(undefined, 'normal');
      pdf.text(invoiceNumber, 65, 80);
      
      pdf.setFont(undefined, 'bold');
      pdf.text("Invoice Date:", 20, 87);
      pdf.setFont(undefined, 'normal');
      pdf.text(currentDate.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), 65, 87);
      
      pdf.setFont(undefined, 'bold');
      pdf.text("Payment Method:", 20, 94);
      pdf.setFont(undefined, 'normal');
      pdf.text(paymentType.toUpperCase(), 65, 94);

      // Right side - Due status
      pdf.setFillColor(46, 204, 113);
      pdf.rect(pageWidth - 60, 75, 40, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("PAID", pageWidth - 40, 82, { align: 'center' });

      // Patient details box
      pdf.setDrawColor(79, 195, 247);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, 105, pageWidth - 40, 35, 3, 3, 'S');
      
      pdf.setTextColor(27, 108, 168);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text("BILL TO:", 25, 113);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Name: ${patientName}`, 25, 121);
      pdf.text(`Contact: ${contactNumber}`, 25, 128);
      if (email) {
        pdf.text(`Email: ${email}`, 25, 135);
      }

      // Table header
      let yPos = 155;
      pdf.setFillColor(27, 108, 168);
      pdf.rect(20, yPos - 8, pageWidth - 40, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text("#", 25, yPos - 2);
      pdf.text("Medicine Name", 35, yPos - 2);
      pdf.text("Qty", 115, yPos - 2, { align: 'center' });
      pdf.text("Unit Price", 140, yPos - 2, { align: 'right' });
      pdf.text("Amount", 180, yPos - 2, { align: 'right' });

      // Table rows
      yPos += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      
      cart.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
        }
        
        pdf.text(`${index + 1}`, 25, yPos);
        pdf.text(item.name, 35, yPos);
        pdf.text(item.quantity.toString(), 115, yPos, { align: 'center' });
        pdf.text(`₹${item.price.toFixed(2)}`, 140, yPos, { align: 'right' });
        pdf.text(`₹${(item.price * item.quantity).toFixed(2)}`, 180, yPos, { align: 'right' });
        yPos += 8;
      });

      // Totals section
      yPos += 5;
      const totalsStartY = yPos;
      pdf.setDrawColor(79, 195, 247);
      pdf.setLineWidth(0.3);
      pdf.line(20, yPos - 3, pageWidth - 20, yPos - 3);

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      // Subtotal
      pdf.text("Subtotal:", 120, yPos);
      pdf.text(`₹${calculateSubtotal().toFixed(2)}`, 180, yPos, { align: 'right' });
      yPos += 7;
      
      // GST
      pdf.text("GST (5%):", 120, yPos);
      pdf.text(`₹${calculateTax().toFixed(2)}`, 180, yPos, { align: 'right' });
      yPos += 7;
      
      // Platform Fee
      pdf.text("Platform Fee (2%):", 120, yPos);
      pdf.text(`₹${calculatePlatformFee().toFixed(2)}`, 180, yPos, { align: 'right' });
      yPos += 10;

      // Grand Total box
      pdf.setFillColor(27, 108, 168);
      pdf.rect(115, yPos - 6, 70, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text("GRAND TOTAL:", 120, yPos);
      pdf.text(`₹${calculateTotal().toFixed(2)}`, 180, yPos, { align: 'right' });

      // Amount in words
      yPos += 15;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'italic');
      const amountInWords = numberToWords(calculateTotal());
      pdf.text(`Amount in words: ${amountInWords} Rupees Only`, 20, yPos);

      // Terms & Conditions
      yPos += 15;
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("Terms & Conditions:", 20, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      yPos += 5;
      pdf.text("• All medicines are subject to availability and stock verification.", 20, yPos);
      yPos += 4;
      pdf.text("• This is a computer-generated invoice and does not require a signature.", 20, yPos);
      yPos += 4;
      pdf.text("• Please check all items before leaving the pharmacy.", 20, yPos);
      yPos += 4;
      if (backendSaved) {
        pdf.text("✓ This invoice has been saved to the database for your records.", 20, yPos);
      } else {
        pdf.text("⚠ This invoice was generated offline. Please ensure proper record keeping.", 20, yPos);
      }

      // Footer
      pdf.setFillColor(232, 244, 248);
      pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
      pdf.setTextColor(27, 108, 168);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text("Thank you for choosing MediTatva!", pageWidth / 2, pageHeight - 15, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text("Your health is our priority | Available 24/7", pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Save PDF
      const fileName = `MediTatva_Invoice_${invoiceNumber}_${patientName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      toast.success(`✅ Invoice ${invoiceNumber} downloaded successfully!`);
      
      // Store invoice in history
      const newInvoice = {
        _id: invoiceNumber,
        invoiceNumber,
        patientName,
        createdAt: currentDate.toISOString(),
        total: calculateTotal(),
        paymentMethod: paymentType
      };
      setInvoiceHistory([newInvoice, ...invoiceHistory]);
      
      // Reset form
      setShowBillingModal(false);
      setCart([]);
      setPatientName("");
      setContactNumber("");
      setEmail("");
      setPaymentType("cash");
      
      // Refresh invoice history
      await fetchInvoiceHistory();
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to convert number to words
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    const numStr = Math.floor(num).toString();
    const length = numStr.length;
    
    if (length > 9) return 'Amount too large';
    
    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    
    return convert(Math.floor(num));
  };

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-3 sm:space-y-4"
        style={{ filter: 'none', WebkitFilter: 'none' }}
      >
        {/* Search and Add to Cart */}
        <Card
          className="p-3 sm:p-4"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(27, 108, 168, 0.15)',
            boxShadow: '0 4px 20px rgba(27, 108, 168, 0.08)',
          }}
        >
          <h3 className="text-base sm:text-lg font-bold text-[#0A2342] mb-2 sm:mb-3">Add Medicines to Bill</h3>
          
          {/* Toggle between Search and Inventory */}
          <div className="flex gap-2 mb-3">
            <Button
              variant={showInventoryMedicines ? "default" : "outline"}
              onClick={() => setShowInventoryMedicines(true)}
              size="sm"
              className={showInventoryMedicines 
                ? "bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] text-white" 
                : "border-[#4FC3F7]/30 text-[#1B6CA8]"}
            >
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Button>
            <Button
              variant={!showInventoryMedicines ? "default" : "outline"}
              onClick={() => setShowInventoryMedicines(false)}
              size="sm"
              className={!showInventoryMedicines 
                ? "bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] text-white" 
                : "border-[#4FC3F7]/30 text-[#1B6CA8]"}
            >
              <Search className="h-4 w-4 mr-2" />
              API Search
            </Button>
          </div>

          <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#5A6A85]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={showInventoryMedicines ? "Search inventory..." : "Search by medicine name..."}
                className="pl-8 sm:pl-10 text-sm sm:text-base bg-white border-[#4FC3F7]/30 text-[#0A2342] placeholder:text-[#5A6A85] focus:border-[#1B6CA8] focus:ring-[#1B6CA8]"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {showInventoryMedicines ? (
              // Show inventory medicines
              <>
                {inventoryMedicines
                  .filter(med => 
                    searchQuery.length === 0 || 
                    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    med.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((medicine) => (
                    <motion.div
                      key={medicine._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 rounded-lg border hover:shadow-md transition-all"
                      style={{
                        borderColor: medicine.inStock ? 'rgba(79, 195, 247, 0.3)' : 'rgba(231, 76, 60, 0.3)',
                        backgroundColor: medicine.inStock ? 'rgba(255, 255, 255, 1)' : 'rgba(231, 76, 60, 0.05)',
                      }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex-1 mb-2 sm:mb-0">
                        <p className="font-semibold text-[#0A2342] text-sm sm:text-base">{medicine.name}</p>
                        <p className="text-xs sm:text-sm text-[#5A6A85]">
                          {medicine.brand}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm font-bold text-[#1B6CA8]">
                            ₹{medicine.price}
                          </span>
                          <Badge
                            className={
                              medicine.current_stock === 0
                                ? "bg-[#E74C3C]/10 text-[#E74C3C] border-[#E74C3C]/30 text-xs"
                                : medicine.current_stock < 50
                                ? "bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/30 text-xs"
                                : "bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/30 text-xs"
                            }
                          >
                            Stock: {medicine.current_stock}
                          </Badge>
                          {medicine.requiresPrescription && (
                            <Badge className="bg-[#9B59B6]/10 text-[#9B59B6] border-[#9B59B6]/30 text-xs">
                              Rx
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => addToCart(medicine)}
                        disabled={!medicine.inStock}
                        size="sm"
                        className={
                          medicine.inStock
                            ? "bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white text-xs sm:text-sm"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed text-xs sm:text-sm"
                        }
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {medicine.inStock ? "Add" : "Out of Stock"}
                      </Button>
                    </motion.div>
                  ))}
                {inventoryMedicines.filter(med => 
                  searchQuery.length === 0 || 
                  med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  med.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-[#5A6A85] mx-auto mb-2" />
                    <p className="text-[#5A6A85]">No matching medicines in inventory</p>
                  </div>
                )}
              </>
            ) : (
              // Show API search results
              <>
            {isSearching && (
              <div className="text-center py-4">
                <p className="text-[#5A6A85]">Searching...</p>
              </div>
            )}
            
            {!isSearching && searchQuery.length >= 2 && medicines.length === 0 && (
              <div className="text-center py-4">
                {searchError ? (
                  <p className="text-red-600">{searchError}</p>
                ) : (
                  <p className="text-[#5A6A85]">No medicines found</p>
                )}
              </div>
            )}
            
            {!isSearching && medicines.map((med) => (
              <motion.div
                key={med._id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#F7F9FC] border border-[#4FC3F7]/20"
                whileHover={{ scale: 1.01, backgroundColor: '#E8F4F8' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#0A2342]">{med.name}</p>
                    {med.requiresPrescription && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rx</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#5A6A85]">
                    ₹{med.price} • 
                    {med.current_stock > 0 ? (
                      <span className={med.current_stock <= 10 ? "text-orange-600 font-medium" : "text-green-600"}>
                        {" "}In Stock: {med.current_stock}
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium"> Out of Stock</span>
                    )}
                  </p>
                  {med.genericName && (
                    <p className="text-xs text-[#5A6A85]">{med.genericName}</p>
                  )}
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    onClick={() => addToCart(med)}
                    disabled={med.current_stock === 0}
                    className="bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white font-semibold disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </motion.div>
              </motion.div>
            ))}
              </>
            )}
          </div>
        </Card>

        {/* Cart and Invoice */}
        <Card
          className="p-4"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(27, 108, 168, 0.15)',
            boxShadow: '0 4px 20px rgba(27, 108, 168, 0.08)',
          }}
        >
          <h3 className="text-lg font-bold text-[#0A2342] mb-3 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#1B6CA8]" />
            Invoice Items
          </h3>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-[#5A6A85] mx-auto mb-3" />
              <p className="text-[#5A6A85]">Cart is empty. Add medicines to create invoice.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <motion.div
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#F7F9FC] border border-[#4FC3F7]/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-[#0A2342]">{item.name}</p>
                      <p className="text-sm text-[#5A6A85]">
                        ₹{item.price} × {item.quantity}
                        {item.current_stock <= 10 && (
                          <span className="ml-2 text-orange-600">• Low stock: {item.current_stock}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-[#4FC3F7]/30 hover:bg-[#E8F4F8]"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="text-[#0A2342] w-8 text-center font-semibold">{item.quantity}</span>
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
                      <p className="text-[#012A4A] font-bold w-20 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#E74C3C] hover:text-[#C0392B] hover:bg-[#E74C3C]/10"
                        onClick={() => removeFromCart(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-[#4FC3F7]/20 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-[#5A6A85]">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5A6A85]">
                  <span>GST (5%):</span>
                  <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5A6A85]">
                  <span>Platform Fee (2%):</span>
                  <span className="font-medium">₹{calculatePlatformFee().toFixed(2)}</span>
                </div>
                <div className="border-t border-[#4FC3F7]/30 pt-2 mt-2"></div>
                <div className="flex justify-between text-xl font-bold text-[#0A2342]">
                  <span>Final Total:</span>
                  <span className="text-[#1B6CA8]">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleGenerateInvoice}
                  className="w-full bg-gradient-to-r from-[#1B6CA8] to-[#4FC3F7] hover:from-[#4FC3F7] hover:to-[#1B6CA8] text-white font-semibold text-lg py-6 shadow-lg"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Generate Invoice
                </Button>
              </motion.div>
            </>
          )}
        </Card>

        {/* Billing History */}
        <Card
          className="p-4"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(27, 108, 168, 0.15)',
            boxShadow: '0 4px 20px rgba(27, 108, 168, 0.08)',
          }}
        >
          <h3 className="text-lg font-bold text-[#0A2342] mb-3 flex items-center gap-2">
            <Clock className="h-6 w-6 text-[#1B6CA8]" />
            Billing History
          </h3>
          <div className="overflow-x-auto">
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
                        <span className="font-semibold text-[#0A2342]">₹{calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A6A85]">GST (5%):</span>
                        <span className="font-semibold text-[#0A2342]">₹{calculateTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A6A85]">Platform Fee (2%):</span>
                        <span className="font-semibold text-[#0A2342]">₹{calculatePlatformFee().toFixed(2)}</span>
                      </div>
                      <div className="border-t border-[#4FC3F7]/20 pt-2 mt-2 flex justify-between">
                        <span className="text-lg font-bold text-[#0A2342]">Total Amount:</span>
                        <span className="text-lg font-bold text-[#1B6CA8]">₹{calculateTotal().toFixed(2)}</span>
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
