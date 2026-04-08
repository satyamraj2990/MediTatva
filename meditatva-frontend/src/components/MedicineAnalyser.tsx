import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Pill, 
  Search, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  X,
  Plus,
  DollarSign,
  AlertTriangle,
  Info,
  ArrowRight
} from 'lucide-react';

interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  activeIngredients: string[];
  strength: string;
  dosageForm: string;
  uses: string[];
  dosageInstructions: string;
  sideEffects: string[];
  price: number;
  manufacturer: string;
  requiresPrescription: boolean;
  therapeuticClass: string;
  costTag: 'Budget Friendly' | 'Balanced' | 'Premium';
  description?: string;
  savings?: number;
  matchType?: 'exact' | 'similar' | 'therapeutic';
  matchReason?: string;
}

interface SearchMedicine {
  id: string;
  name: string;
  genericName?: string;
  price: number;
  manufacturer?: string;
  dosage?: string;
}

interface RawComparisonRow {
  aspect?: string;
  med1?: string;
  med2?: string;
  medicine1?: string;
  medicine2?: string;
}

// Use a stable API root that always points to /api and avoids /api/api duplication.
const API_ROOT = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Unified Theme Colors - Light-first with dark mode support
const THEME_COLORS = {
  // Background colors
  bg: {
    primary: 'bg-white dark:bg-slate-950',
    secondary: 'bg-slate-50 dark:bg-slate-900',
    tertiary: 'bg-slate-100 dark:bg-slate-900/80',
    accent: 'bg-slate-100/70 dark:bg-slate-900/60',
  },
  // Text colors
  text: {
    primary: 'text-slate-900 dark:text-white',
    secondary: 'text-slate-600 dark:text-slate-300',
    tertiary: 'text-slate-700 dark:text-slate-200',
    muted: 'text-slate-500 dark:text-slate-400',
  },
  // Border colors
  border: {
    primary: 'border-slate-200 dark:border-slate-700',
    secondary: 'border-slate-200 dark:border-slate-800',
    accent: 'border-teal-500/50 dark:border-teal-400/50',
  },
  // Input colors
  input: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-300 dark:border-slate-700',
    borderHover: 'hover:border-teal-500',
    borderFocus: 'focus:border-teal-400',
    ring: 'focus:ring-2 focus:ring-teal-500/30',
  },
  // Feature gradients
  gradient: {
    primary: 'from-teal-500 to-teal-600',
    primaryHover: 'hover:from-teal-600 hover:to-teal-700',
    success: 'from-emerald-500 to-green-600',
    info: 'from-cyan-500 to-teal-600',
  },
  // Shadow colors
  shadow: {
    primary: 'shadow-sm shadow-slate-200 dark:shadow-none',
    hover: 'hover:shadow-md hover:shadow-slate-300 dark:hover:shadow-none',
  },
  // Cost tag colors
  costTag: {
    budget: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/40',
    balanced: 'bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-200 dark:border-slate-700/40',
    premium: 'bg-purple-50 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200 dark:border-purple-700/40',
  },
  // Status badge colors
  badge: {
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/70 dark:text-red-200 border border-red-200 dark:border-red-700/50',
    info: 'bg-teal-50 text-teal-700 dark:bg-teal-900/70 dark:text-teal-200 border border-teal-200 dark:border-teal-700/50',
  },
};

export const MedicineAnalyser: React.FC = () => {
  const normalizeComparisonRows = (rows: RawComparisonRow[] | undefined) => {
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      aspect: row.aspect || 'N/A',
      med1: row.med1 ?? row.medicine1 ?? 'N/A',
      med2: row.med2 ?? row.medicine2 ?? 'N/A'
    }));
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMedicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Direct input for AI comparison
  const [medicine1Name, setMedicine1Name] = useState('');
  const [medicine2Name, setMedicine2Name] = useState('');
  
  // Selected medicines for comparison
  const [selectedForComparison, setSelectedForComparison] = useState<SearchMedicine[]>([]);
  
  // Medicine for substitute finding
  const [selectedForSubstitute, setSelectedForSubstitute] = useState<SearchMedicine | null>(null);
  
  // Results
  const [comparisonResults, setComparisonResults] = useState<Medicine[] | null>(null);
  const [substituteResults, setSubstituteResults] = useState<any>(null);
  
  // Loading states
  const [isComparing, setIsComparing] = useState(false);
  const [isFindingSubstitutes, setIsFindingSubstitutes] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'compare' | 'substitute'>('compare');

  // Search medicines with debounce
  const searchMedicines = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_ROOT}/medicines/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      // Handle array response from CSV-based API
      if (Array.isArray(data)) {
        // Transform CSV data to expected format
        const medicines = data.map((med: any) => ({
          id: med.id || med._id,
          name: med.name,
          genericName: med.composition1 || med.genericName || '',
          brand: med.manufacturer || med.brand || '',
          price: med.price || 0,
          manufacturer: med.manufacturer || '',
          form: med.packSize || med.form || ''
        }));
        setSearchResults(medicines);
      } else if (data.success) {
        setSearchResults(data.medicines);
      } else {
        setError(data.error || 'Failed to search medicines');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search medicines. Please check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMedicines(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Add medicine to comparison
  const addToComparison = (medicine: SearchMedicine) => {
    if (selectedForComparison.length >= 2) {
      setError('Maximum 2 medicines can be compared at once');
      return;
    }
    
    if (!selectedForComparison.find(m => m.id === medicine.id)) {
      setSelectedForComparison([...selectedForComparison, medicine]);
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
    }
  };

  // Remove medicine from comparison
  const removeFromComparison = (medicineId: string) => {
    setSelectedForComparison(selectedForComparison.filter(m => m.id !== medicineId));
    setComparisonResults(null);
  };

  // Select medicine for substitute finding
  const selectForSubstitute = (medicine: SearchMedicine) => {
    setSelectedForSubstitute(medicine);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setSubstituteResults(null);
  };

  // Perform comparison
  const performComparison = async () => {
    if (selectedForComparison.length !== 2) {
      setError('Please select exactly 2 medicines for comparison');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      // Use AI-powered comparison endpoint
      const response = await fetch(`${API_ROOT}/medicines/compare-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine1Name: selectedForComparison[0].name,
          medicine2Name: selectedForComparison[1].name
        })
      });

      const data = await response.json();

      if (data.success && data.data) {
        const aiData = data.data;
        
        // Transform AI comparison data to expected format
        const transformedMedicines = [
          {
            id: aiData.originalData?.medicine1?.id || '1',
            brandName: aiData.medicine1.name,
            genericName: aiData.medicine1.genericName || 'N/A',
            activeIngredients: [aiData.medicine1.genericName],
            strength: aiData.medicine1.strength || 'N/A',
            dosageForm: aiData.medicine1.dosageForm || 'N/A',
            uses: aiData.medicine1.primaryUses || ['As prescribed by healthcare provider'],
            dosageInstructions: 'Follow prescription dosage',
            sideEffects: aiData.medicine1.sideEffects || ['Consult package insert'],
            price: aiData.medicine1.price || 0,
            manufacturer: aiData.medicine1.manufacturer || 'N/A',
            requiresPrescription: aiData.medicine1.prescriptionRequired !== false,
            therapeuticClass: aiData.medicine1.drugClass || 'N/A',
            costTag: aiData.medicine1.price < 50 ? 'Budget Friendly' : aiData.medicine1.price < 150 ? 'Balanced' : 'Premium',
            packSize: aiData.medicine1.packSize || 'N/A',
            discontinued: aiData.originalData?.medicine1?.discontinued || false
          },
          {
            id: aiData.originalData?.medicine2?.id || '2',
            brandName: aiData.medicine2.name,
            genericName: aiData.medicine2.genericName || 'N/A',
            activeIngredients: [aiData.medicine2.genericName],
            strength: aiData.medicine2.strength || 'N/A',
            dosageForm: aiData.medicine2.dosageForm || 'N/A',
            uses: aiData.medicine2.primaryUses || ['As prescribed by healthcare provider'],
            dosageInstructions: 'Follow prescription dosage',
            sideEffects: aiData.medicine2.sideEffects || ['Consult package insert'],
            price: aiData.medicine2.price || 0,
            manufacturer: aiData.medicine2.manufacturer || 'N/A',
            requiresPrescription: aiData.medicine2.prescriptionRequired !== false,
            therapeuticClass: aiData.medicine2.drugClass || 'N/A',
            costTag: aiData.medicine2.price < 50 ? 'Budget Friendly' : aiData.medicine2.price < 150 ? 'Balanced' : 'Premium',
            packSize: aiData.medicine2.packSize || 'N/A',
            discontinued: aiData.originalData?.medicine2?.discontinued || false
          }
        ];
        
        setComparisonResults(transformedMedicines);
      } else {
        setError(data.error || 'Failed to compare medicines');
      }
    } catch (err) {
      console.error('Comparison error:', err);
      setError('Failed to compare medicines. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  // Perform direct AI comparison using medicine names
  const performDirectAIComparison = async () => {
    const med1 = medicine1Name.trim();
    const med2 = medicine2Name.trim();

    if (!med1 || !med2) {
      setError('Please enter both medicine names');
      return;
    }

    setIsComparing(true);
    setError(null);
    setComparisonResults(null);

    const requestBody = JSON.stringify({
      medicine1Name: med1,
      medicine2Name: med2
    });

    try {
      // Use compare-ai endpoint that has backend fallback when Gemini fails.
      let response = await fetch(`${API_ROOT}/medicines/compare-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      // If env URL is stale (wrong port), retry once through Vite proxy path.
      if (!response.ok && API_ROOT !== '/api') {
        response = await fetch('/api/medicines/compare-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });
      }

      const result = await response.json();

      if (result.success && result.data) {
        const aiData = result.data;
        
        // Transform AI comparison data to expected format
        const transformedMedicines = [
          {
            id: '1',
            brandName: aiData.medicine1.name,
            genericName: aiData.medicine1.genericName || 'N/A',
            activeIngredients: [aiData.medicine1.genericName],
            strength: aiData.medicine1.strengthVariants?.join(', ') || aiData.medicine1.strength || 'N/A',
            dosageForm: aiData.medicine1.dosageForms?.join(', ') || aiData.medicine1.dosageForm || 'N/A',
            uses: aiData.medicine1.primaryUses || ['Consult healthcare provider'],
            dosageInstructions: aiData.medicine1.typicalDosage || 'Follow prescription',
            sideEffects: aiData.medicine1.sideEffects || ['Consult package insert'],
            price: aiData.medicine1.price || 0,
            manufacturer: aiData.medicine1.manufacturers?.join(', ') || aiData.medicine1.manufacturer || 'Various',
            requiresPrescription: aiData.medicine1.prescriptionRequired !== false,
            therapeuticClass: aiData.medicine1.drugClass || 'N/A',
            costTag: aiData.medicine1.priceRange || ((aiData.medicine1.price || 0) < 50 ? 'Budget Friendly' : (aiData.medicine1.price || 0) < 150 ? 'Balanced' : 'Premium'),
            packSize: aiData.medicine1.packSize || aiData.medicine1.dosageForms?.join(', ') || 'N/A',
            discontinued: false,
            composition: aiData.medicine1.composition || 'N/A'
          },
          {
            id: '2',
            brandName: aiData.medicine2.name,
            genericName: aiData.medicine2.genericName || 'N/A',
            activeIngredients: [aiData.medicine2.genericName],
            strength: aiData.medicine2.strengthVariants?.join(', ') || aiData.medicine2.strength || 'N/A',
            dosageForm: aiData.medicine2.dosageForms?.join(', ') || aiData.medicine2.dosageForm || 'N/A',
            uses: aiData.medicine2.primaryUses || ['Consult healthcare provider'],
            dosageInstructions: aiData.medicine2.typicalDosage || 'Follow prescription',
            sideEffects: aiData.medicine2.sideEffects || ['Consult package insert'],
            price: aiData.medicine2.price || 0,
            manufacturer: aiData.medicine2.manufacturers?.join(', ') || aiData.medicine2.manufacturer || 'Various',
            requiresPrescription: aiData.medicine2.prescriptionRequired !== false,
            therapeuticClass: aiData.medicine2.drugClass || 'N/A',
            costTag: aiData.medicine2.priceRange || ((aiData.medicine2.price || 0) < 50 ? 'Budget Friendly' : (aiData.medicine2.price || 0) < 150 ? 'Balanced' : 'Premium'),
            packSize: aiData.medicine2.packSize || aiData.medicine2.dosageForms?.join(', ') || 'N/A',
            discontinued: false,
            composition: aiData.medicine2.composition || 'N/A'
          }
        ];
        
        // Store comparison table data separately
        if (aiData.comparison) {
          (transformedMedicines as any).comparisonTable = normalizeComparisonRows(aiData.comparison);
        }
        if (aiData.keyDifferences) {
          (transformedMedicines as any).keyDifferences = aiData.keyDifferences;
        }
        if (aiData.clinicalRecommendations || aiData.recommendations) {
          (transformedMedicines as any).recommendations = aiData.clinicalRecommendations || aiData.recommendations;
        }
        
        setComparisonResults(transformedMedicines);
      } else {
        if (result?.details?.includes('API_KEY_INVALID') || result?.error?.includes('configured')) {
          setError('Backend Gemini API key is invalid/missing. Update GEMINI_API_KEY in meditatva-backend/.env and restart backend.');
        } else {
          setError(result.error || 'Unable to compare medicines. Please check the spelling and try again.');
        }
      }
    } catch (err) {
      console.error('AI Comparison error:', err);
      // Final retry through proxy if primary host/port is unreachable.
      try {
        const retryResponse = await fetch('/api/medicines/compare-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });

        const retryResult = await retryResponse.json();
        if (retryResult.success && retryResult.data) {
          // Trigger a clean rerun through primary flow by setting fields back and exiting catch.
          setMedicine1Name(med1);
          setMedicine2Name(med2);
          setError('Recovered backend connection. Please click "Compare with AI" once again.');
        } else if (retryResult?.details?.includes('API_KEY_INVALID') || retryResult?.error?.includes('configured')) {
          setError('Gemini key is invalid. Using fallback compare may still work, but AI insights are unavailable until key is fixed.');
        } else {
          setError(retryResult.error || 'Failed to compare medicines. Please check your connection and try again.');
        }
      } catch (retryErr) {
        console.error('AI Comparison retry error:', retryErr);
        setError('Failed to compare medicines. Backend is unreachable. Ensure backend is running and frontend is restarted.');
      }
    } finally {
      setIsComparing(false);
    }
  };

  // Find substitutes
  const findSubstitutes = async () => {
    if (!selectedForSubstitute) {
      setError('Please select a medicine first');
      return;
    }

    setIsFindingSubstitutes(true);
    setError(null);

    try {
      // Use CSV-based substitutes endpoint
      const response = await fetch(
        `${API_ROOT}/medicines/substitutes?name=${encodeURIComponent(selectedForSubstitute.name)}`
      );

      const data = await response.json();

      // Transform CSV response to expected format
      if (Array.isArray(data)) {
        const transformedResults = {
          success: true,
          baseMedicine: {
            id: selectedForSubstitute.id,
            name: selectedForSubstitute.name,
            price: selectedForSubstitute.price,
            manufacturer: selectedForSubstitute.brand || selectedForSubstitute.manufacturer,
            composition: selectedForSubstitute.genericName
          },
          substitutes: data.map((med: any) => ({
            id: med.id,
            name: med.name,
            price: med.price,
            manufacturer: med.manufacturer,
            composition: med.composition1,
            savings: med.savings || 0,
            form: med.packSize,
            discontinued: med.discontinued
          }))
        };
        setSubstituteResults(transformedResults);
      } else if (data.success) {
        setSubstituteResults(data);
      } else {
        setError(data.error || 'Failed to find substitutes');
      }
    } catch (err) {
      console.error('Substitute finding error:', err);
      setError('Failed to find substitutes. Please try again.');
    } finally {
      setIsFindingSubstitutes(false);
    }
  };

  // Reset state
  const resetComparison = () => {
    setSelectedForComparison([]);
    setComparisonResults(null);
    setError(null);
    setMedicine1Name('');
    setMedicine2Name('');
  };

  const resetSubstitute = () => {
    setSelectedForSubstitute(null);
    setSubstituteResults(null);
    setError(null);
  };

  // Render cost tag badge
  const renderCostTag = (tag: string) => {
    const colors = {
      'Budget Friendly': THEME_COLORS.costTag.budget,
      'Balanced': THEME_COLORS.costTag.balanced,
      'Premium': THEME_COLORS.costTag.premium
    };
    return (
      <Badge className={colors[tag as keyof typeof colors] || colors.Balanced}>
        {tag}
      </Badge>
    );
  };

  return (
    <div className={`min-h-screen ${THEME_COLORS.bg.primary} w-full max-w-7xl mx-auto p-6 space-y-8`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-3 bg-gradient-to-br ${THEME_COLORS.gradient.primary} rounded-xl shadow-lg`}>
          <Pill className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className={`text-3xl font-bold ${THEME_COLORS.text.primary}`}>
            Medicine Analyser
          </h2>
          <p className={`text-base ${THEME_COLORS.text.secondary} mt-1`}>
            Compare medicines side-by-side and find cost-effective substitutes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className={`grid w-full grid-cols-2 mb-8 ${THEME_COLORS.bg.secondary} ${THEME_COLORS.border.primary} p-1 rounded-xl`}>
          <TabsTrigger value="compare" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-slate-500 transition-all duration-200">
            <TrendingDown className="h-4 w-4" />
            Compare Medicines
          </TabsTrigger>
          <TabsTrigger value="substitute" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-slate-500 transition-all duration-200">
            <Pill className="h-4 w-4" />
            AI Substitute Finder
          </TabsTrigger>
        </TabsList>

        {/* Compare Medicines Tab */}
        <TabsContent value="compare" className="space-y-8">
          {/* AI-Powered Direct Comparison */}
          <Card className={`p-8 backdrop-blur-none ${THEME_COLORS.bg.secondary} border ${THEME_COLORS.border.primary} hover:border-teal-500 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 bg-gradient-to-br ${THEME_COLORS.gradient.primary} rounded-xl shadow-lg ${THEME_COLORS.shadow.primary}`}>
                <Pill className={`h-6 w-6 ${THEME_COLORS.text.primary}`} />
              </div>
              <h3 className={`text-2xl font-bold ${THEME_COLORS.text.primary}`}>
                🤖 AI-Powered Medicine Comparison
              </h3>
            </div>
            
            <p className={`text-base ${THEME_COLORS.text.tertiary} mb-6`}>
              Enter two medicine names below to get an intelligent AI-powered comparison using <span className="font-semibold text-teal-600">MediTatva AI Engine</span>
            </p>

            {/* Direct Input - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Medicine 1 Input */}
              <div>
                <label className={`block text-sm font-semibold ${THEME_COLORS.text.tertiary} mb-3`}>
                  Medicine 1
                </label>
                <div className="relative group">
                  <Pill className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${THEME_COLORS.text.secondary} group-hover:text-teal-600 transition-colors`} />
                  <Input
                    type="text"
                    placeholder="e.g., Dolo 650 Tablet"
                    value={medicine1Name}
                    onChange={(e) => setMedicine1Name(e.target.value)}
                    className={`pl-12 pr-4 py-4 text-base ${THEME_COLORS.input.bg} border-2 ${THEME_COLORS.input.border} ${THEME_COLORS.input.borderHover} ${THEME_COLORS.input.borderFocus} ${THEME_COLORS.input.ring} rounded-xl ${THEME_COLORS.text.primary} placeholder:text-slate-500 dark:placeholder:text-slate-600 transition-all duration-200`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        performDirectAIComparison();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Medicine 2 Input */}
              <div>
                <label className={`block text-sm font-semibold ${THEME_COLORS.text.tertiary} mb-3`}>
                  Medicine 2
                </label>
                <div className="relative group">
                  <Pill className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${THEME_COLORS.text.secondary} group-hover:text-teal-600 transition-colors`} />
                  <Input
                    type="text"
                    placeholder="e.g., Crocin Advance Tablet"
                    value={medicine2Name}
                    onChange={(e) => setMedicine2Name(e.target.value)}
                    className={`pl-12 pr-4 py-4 text-base ${THEME_COLORS.input.bg} border-2 ${THEME_COLORS.input.border} ${THEME_COLORS.input.borderHover} ${THEME_COLORS.input.borderFocus} ${THEME_COLORS.input.ring} rounded-xl ${THEME_COLORS.text.primary} placeholder:text-slate-500 dark:placeholder:text-slate-600 transition-all duration-200`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        performDirectAIComparison();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Compare Button */}
            <div className="flex gap-4">
              <Button
                onClick={performDirectAIComparison}
                disabled={isComparing || !medicine1Name.trim() || !medicine2Name.trim()}
                className={`flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg disabled:opacity-50 disabled:hover:scale-100`}
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Analyzing medicines with MediTatva AI Engine...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5 mr-3" />
                    Compare with AI
                  </>
                )}
              </Button>
              {(medicine1Name || medicine2Name) && (
                <Button
                  onClick={resetComparison}
                  variant="outline"
                  className={`px-8 py-4 border-2 border-white/20 hover:border-slate-400 dark:hover:border-slate-600 ${THEME_COLORS.text.primary} hover:bg-slate-100/5 dark:hover:bg-slate-800/10 rounded-xl transition-all duration-200`}
                >
                  <X className="h-5 w-5 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <div className={`p-4 ${THEME_COLORS.badge.danger} rounded-xl`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Comparison Results */}
          {comparisonResults && comparisonResults.length > 0 && (
            <Card className={`p-8 ${THEME_COLORS.bg.secondary} ${THEME_COLORS.border.primary} rounded-2xl shadow-2xl backdrop-blur-sm animate-fade-in`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className={`text-2xl font-bold ${THEME_COLORS.text.primary} mb-3`}>
                    Medicine Comparison Results
                  </h3>
                  <div className={`flex items-center gap-2 text-base ${THEME_COLORS.text.secondary}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-700 rounded-full animate-pulse"></div>
                      <span>Powered by <span className="font-semibold text-teal-600">MediTatva AI Engine</span></span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetComparison}
                  className={`${THEME_COLORS.border.primary} hover:${THEME_COLORS.border.accent} ${THEME_COLORS.text.primary} transition-all duration-200`}
                >
                  <X className="h-4 w-4 mr-2" />
                  New Comparison
                </Button>
              </div>

              {/* Medicine VS Header */}
              <div className={`mb-8 p-6 ${THEME_COLORS.bg.tertiary} rounded-xl border ${THEME_COLORS.border.primary} shadow-sm hover:scale-102 transition-transform duration-300`}>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex-1 text-center">
                    <div className={`inline-block px-6 py-3 bg-white rounded-xl shadow-sm border-2 border-teal-200 hover:border-teal-400 transition-colors`}>
                      <h4 className="text-xl font-bold text-teal-600">
                        {comparisonResults[0].brandName}
                      </h4>
                    </div>
                  </div>
                  <div className={`text-4xl font-bold ${THEME_COLORS.text.primary}`}>VS</div>
                  <div className="flex-1 text-center">
                    <div className={`inline-block px-6 py-3 bg-white rounded-xl shadow-sm border-2 border-teal-200 hover:border-teal-400 transition-colors`}>
                      <h4 className="text-xl font-bold text-teal-600">
                        {comparisonResults[1].brandName}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Comparison Table */}
              {(comparisonResults as any).comparisonTable && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-slate-900 mb-4">
                    🧠 Clinical Comparison Analysis
                  </h4>
                  <div className={`overflow-x-auto rounded-xl border ${THEME_COLORS.border.primary} shadow-sm backdrop-blur-none`}>
                    <Table>
                      <TableHeader>
                        <TableRow className={`${THEME_COLORS.bg.secondary} ${THEME_COLORS.border.secondary} border-slate-100`}>
                          <TableHead className={`font-bold ${THEME_COLORS.text.primary} w-1/4 text-base`}>Aspect</TableHead>
                          <TableHead className={`font-bold text-center text-teal-600 w-1/3 text-base`}>{comparisonResults[0].brandName}</TableHead>
                          <TableHead className={`font-bold text-center text-teal-600 w-1/3 text-base`}>{comparisonResults[1].brandName}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(comparisonResults as any).comparisonTable.map((row: any, idx: number) => (
                          <TableRow key={idx} className={`${THEME_COLORS.border.secondary} hover:${THEME_COLORS.bg.tertiary} transition-colors`}>
                            <TableCell className={`font-medium ${THEME_COLORS.text.tertiary}`}>
                              {row.aspect}
                            </TableCell>
                            <TableCell className={`text-center text-sm ${THEME_COLORS.text.tertiary}`}>
                              {row.med1}
                            </TableCell>
                            <TableCell className={`text-center text-sm ${THEME_COLORS.text.tertiary}`}>
                              {row.med2}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Key Differences */}
              {(comparisonResults as any).keyDifferences && (
                <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-blue-900/30 rounded-xl border border-teal-200 dark:border-teal-700/50 backdrop-blur-sm">
                  <h4 className="text-xl font-semibold text-teal-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    ⚡ Key Clinical Differences
                  </h4>
                  <ul className="space-y-3">
                    {(comparisonResults as any).keyDifferences.map((diff: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-base text-gray-800 dark:text-gray-100">
                        <span className="text-teal-600 dark:text-teal-400 font-bold text-xl">•</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinical Recommendations */}
              {(comparisonResults as any).recommendations && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-700/50 hover:border-teal-300 dark:hover:border-teal-600 hover:scale-102 transition-all duration-200 shadow-md">
                    <h5 className="font-bold text-teal-700 dark:text-teal-300 mb-4 text-lg">
                      ✅ {comparisonResults[0].brandName} Better For:
                    </h5>
                    <ul className="space-y-3">
                      {((comparisonResults as any).recommendations.medicine1BetterFor?.length > 0 ? (comparisonResults as any).recommendations.medicine1BetterFor : ['Acute fever management', 'General pain relief', 'Pediatric use']).map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:scale-102 transition-all duration-200 shadow-md">
                    <h5 className="font-bold text-emerald-700 dark:text-emerald-300 mb-4 text-lg">
                      ✅ {comparisonResults[1].brandName} Better For:
                    </h5>
                    <ul className="space-y-3">
                      {((comparisonResults as any).recommendations.medicine2BetterFor?.length > 0 ? (comparisonResults as any).recommendations.medicine2BetterFor : ['Extended relief', 'Severe pain', 'Antibiotic properties']).map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* General Advice */}
              {(comparisonResults as any).recommendations?.generalAdvice && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50 backdrop-blur-sm">
                  <h5 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2 text-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    👨‍⚕️ Clinical Recommendation
                  </h5>
                  <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                    {(comparisonResults as any).recommendations.generalAdvice || 'Always consult with a qualified healthcare professional before starting, stopping, or switching medications. Individual patient factors such as medical history, allergies, and current medications must be considered by your doctor.'}
                  </p>
                </div>
              )}

              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 mt-8 flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                📊 Detailed Medicine Information
              </h4>

              {/* Detailed Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-white/10">
                      <TableHead className="w-40 font-bold text-gray-900 dark:text-white text-base">Parameter</TableHead>
                      {comparisonResults.map((medicine) => (
                        <TableHead key={medicine.id} className="text-center min-w-48">
                          <div className="font-bold text-gray-900 dark:text-white text-base">
                            {medicine.brandName}
                          </div>
                          <div className="mt-2">
                            {renderCostTag(medicine.costTag)}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Generic Name */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Generic Name</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center text-gray-700 dark:text-gray-200">
                          {m.genericName}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Active Ingredients */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Active Ingredients</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center">
                          <div className="space-y-1">
                            {m.activeIngredients.map((ing, idx) => (
                              <Badge key={idx} className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs">
                                {ing}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Strength */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Strength</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center font-medium text-gray-700 dark:text-gray-200">
                          {m.strength}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Dosage Form */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Dosage Form</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center capitalize text-gray-700 dark:text-gray-200">
                          {m.dosageForm}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Uses */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Primary Uses</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center">
                          <div className="text-sm space-y-1 text-gray-700 dark:text-gray-200">
                            {m.uses.slice(0, 3).map((use, idx) => (
                              <div key={idx}>
                                • {use}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Dosage Instructions */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Dosage</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center text-sm text-gray-700 dark:text-gray-200">
                          {m.dosageInstructions}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Side Effects */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Common Side Effects</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center">
                          <div className="text-xs space-y-1 text-gray-700 dark:text-gray-200">
                            {m.sideEffects.slice(0, 3).map((effect, idx) => (
                              <div key={idx}>
                                • {effect}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Price */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 bg-teal-50 dark:bg-slate-800/50 hover:bg-teal-100 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-bold text-gray-900 dark:text-white">Price</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center">
                          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                            ₹{m.price}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Manufacturer */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Manufacturer</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center text-sm text-gray-700 dark:text-gray-200">
                          {m.manufacturer}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Prescription Required */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Prescription Required</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center">
                          {m.requiresPrescription ? (
                            <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">Yes</Badge>
                          ) : (
                            <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">No</Badge>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Therapeutic Class */}
                    <TableRow className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">Therapeutic Class</TableCell>
                      {comparisonResults.map((m) => (
                        <TableCell key={m.id} className="text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                          {m.therapeuticClass}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Safety Notice */}
              <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800 dark:text-amber-300 mb-2 text-lg">
                      ⚠️ Important Safety Information
                    </p>
                    <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                      This comparison is for educational purposes only. Always consult a qualified healthcare 
                      professional before switching or starting any medication. Individual patient factors may 
                      affect medicine selection.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* AI Substitute Finder Tab */}
        <TabsContent value="substitute" className="space-y-6">
          {/* Search and Select */}
          <Card className="p-6 bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <Pill className="h-5 w-5" />
              Select Medicine to Find Substitutes
            </h3>

            {!selectedForSubstitute ? (
              <>
                {/* Search Input */}
                <div className="relative z-10">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search medicine by name or generic name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 text-base"
                  />
                </div>

                {/* Search Results Container */}
                {(isSearching || searchResults.length > 0) && (
                  <div className="relative z-20 mt-2">
                    {isSearching && (
                      <div className="flex items-center justify-center py-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-600 dark:text-slate-500" />
                      </div>
                    )}

                    {searchResults.length > 0 && !isSearching && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-80 overflow-y-auto">
                        <div className="space-y-0">
                          {searchResults.map((medicine) => (
                            <div
                              key={medicine.id}
                              onClick={() => selectForSubstitute(medicine)}
                              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 dark:text-gray-100">{medicine.name}</p>
                                  {medicine.genericName && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Generic: {medicine.genericName}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right ml-2">
                                  <p className="font-bold text-teal-600">₹{medicine.price}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Selected Medicine */}
                <div className={`${THEME_COLORS.bg.tertiary} p-4 rounded-lg border ${THEME_COLORS.border.primary}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-800 dark:text-gray-100">
                        {selectedForSubstitute.name}
                      </p>
                      {selectedForSubstitute.genericName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Generic: {selectedForSubstitute.genericName}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-teal-600 mt-2">
                        ₹{selectedForSubstitute.price}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetSubstitute}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>

                {/* Find Substitutes Button */}
                <Button
                  onClick={findSubstitutes}
                  disabled={isFindingSubstitutes}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 hover:from-emerald-700 hover:via-teal-600 hover:to-blue-700 shadow-lg shadow-teal-700/30 hover:shadow-teal-700/50"
                >
                  {isFindingSubstitutes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Substitutes...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find AI-Powered Substitutes
                    </>
                  )}
                </Button>
              </>
            )}
          </Card>

          {/* Substitute Results */}
          {substituteResults && (
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    AI-Powered Substitute Finder Results
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Found {substituteResults.summary.totalFound} potential substitutes
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetSubstitute}>
                  <X className="h-4 w-4 mr-1" />
                  New Search
                </Button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-teal-600">
                    {substituteResults.summary.exactMatches}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Exact Matches</div>
                </div>
                <div className={`p-4 ${THEME_COLORS.bg.tertiary} rounded-lg border ${THEME_COLORS.border.primary}`}>
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {substituteResults.summary.similarMatches}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Similar Matches</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {substituteResults.summary.therapeuticMatches}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Therapeutic Class Matches</div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {substituteResults.summary.bestSavings > 0 ? `${substituteResults.summary.bestSavings}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best Savings</div>
                </div>
              </div>

              {/* Exact Matches */}
              {substituteResults.substitutes.exact.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Exact Substitutes ({substituteResults.substitutes.exact.length})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Same active ingredient - can be directly substituted
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {substituteResults.substitutes.exact.map((medicine: Medicine) => (
                      <div key={medicine.id} className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100">{medicine.brandName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{medicine.genericName}</p>
                          </div>
                          {renderCostTag(medicine.costTag)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                            <span className="font-medium">{medicine.strength}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">₹{medicine.price}</span>
                          </div>
                          {medicine.savings !== undefined && medicine.savings !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Savings:</span>
                              <span className={`font-bold ${medicine.savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {medicine.savings > 0 ? '+' : ''}{medicine.savings.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-green-200 dark:border-green-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <Info className="inline h-3 w-3 mr-1" />
                              {medicine.matchReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Matches */}
              {substituteResults.substitutes.similar.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Similar Alternatives ({substituteResults.substitutes.similar.length})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Contains some matching ingredients - consult doctor before switching
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {substituteResults.substitutes.similar.slice(0, 6).map((medicine: Medicine) => (
                      <div key={medicine.id} className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100">{medicine.brandName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{medicine.genericName}</p>
                          </div>
                          {renderCostTag(medicine.costTag)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">₹{medicine.price}</span>
                          </div>
                          {medicine.savings !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Savings:</span>
                              <span className={`font-bold ${medicine.savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {medicine.savings > 0 ? '+' : ''}{medicine.savings.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <Info className="inline h-3 w-3 mr-1" />
                              {medicine.matchReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Therapeutic Class Matches */}
              {substituteResults.substitutes.therapeutic.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-purple-500" />
                    Same Therapeutic Class ({substituteResults.substitutes.therapeutic.length})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Similar purpose but different ingredients - requires doctor consultation
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {substituteResults.substitutes.therapeutic.slice(0, 4).map((medicine: Medicine) => (
                      <div key={medicine.id} className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100">{medicine.brandName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{medicine.genericName}</p>
                          </div>
                          {renderCostTag(medicine.costTag)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">₹{medicine.price}</span>
                          </div>
                          <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <Info className="inline h-3 w-3 mr-1" />
                              {medicine.matchReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {substituteResults.substitutes.exact.length === 0 &&
               substituteResults.substitutes.similar.length === 0 &&
               substituteResults.substitutes.therapeutic.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No substitutes found. The medicine database may need more details for this product
                  </p>
                </div>
              )}

              {/* Safety Notice */}
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      Important Safety Information
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This tool provides educational information only. <strong>Always consult a qualified healthcare 
                      professional</strong> before switching medications. Medicine substitution should only be done under 
                      medical supervision. Individual patient factors, allergies, and medical conditions may affect 
                      medicine selection.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}
    </div>
  );
};
