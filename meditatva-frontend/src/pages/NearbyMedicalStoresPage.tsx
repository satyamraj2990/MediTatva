import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Loader2, RefreshCw, Search, AlertCircle, Phone, ExternalLink, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OpenStreetMapComponent } from "@/components/OpenStreetMapComponent";

interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
}

interface MedicalStore {
  id: string;
  name: string;
  address: string;
  distance: number;
  lat: number;
  lon: number;
  phone?: string;
  type?: string;
}

export const NearbyMedicalStoresPage = memo(() => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [stores, setStores] = useState<MedicalStore[]>([]);
  const [filteredStores, setFilteredStores] = useState<MedicalStore[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(15000);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [manualLocationSearch, setManualLocationSearch] = useState("");
  const [searchingManualLocation, setSearchingManualLocation] = useState(false);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setPermissionDenied(false);

    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    try {
      // First, try to get the position with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            enableHighAccuracy: true,
            timeout: 20000, // Increased timeout to 20 seconds
            maximumAge: 0, // Don't use cached position
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      console.log("📍 Location obtained:", { latitude, longitude, accuracy });

      // Add a small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use Nominatim for reverse geocoding with proper headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "MediTatva/1.0", // Add user agent as required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("🌍 Reverse geocoding data:", data);
      
      const addr = data.address || {};

      // More comprehensive address parsing
      const city = addr.city || 
                   addr.town || 
                   addr.village || 
                   addr.municipality || 
                   addr.suburb ||
                   addr.county || 
                   addr.state_district ||
                   "Unknown City";
      
      const state = addr.state || addr.province || addr.region || "";
      const country = addr.country || "India"; // Default to India for this app
      const postalCode = addr.postcode || "";

      const locationData = {
        latitude,
        longitude,
        city,
        state,
        country,
        postalCode,
        formattedAddress: data.display_name || `${city}, ${state}` || `${latitude}, ${longitude}`,
      };

      console.log("✅ Location data set:", locationData);
      
      setUserLocation(locationData);
      setLocationLoading(false);
      
      toast.success(`Location detected: ${city}${state ? ', ' + state : ''}`);
    } catch (error: any) {
      console.error("❌ Location error:", error);
      
      if (error.code === 1 || error.message?.includes("denied")) {
        setPermissionDenied(true);
        toast.error("Location access denied. Please enable location permissions in your browser settings.");
      } else if (error.code === 2) {
        toast.error("Location unavailable. Please check your device's location services.");
      } else if (error.code === 3 || error.message?.includes("timeout")) {
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Failed to get location. Please try again or enter manually.");
      }
      
      setLocationLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const searchNearbyStores = async () => {
    if (!userLocation) {
      toast.error("Please enable location access first");
      return;
    }

    setLoading(true);
    const { latitude, longitude } = userLocation;
    const radiusInMeters = searchRadius;

    try {
      const overpassQuery = `
        [out:json][timeout:30];
        (
          node[amenity=pharmacy](around:${radiusInMeters},${latitude},${longitude});
          node[shop=chemist](around:${radiusInMeters},${latitude},${longitude});
          node[healthcare=pharmacy](around:${radiusInMeters},${latitude},${longitude});
          node[amenity=clinic](around:${radiusInMeters},${latitude},${longitude});
          node[amenity=hospital](around:${radiusInMeters},${latitude},${longitude});
          node[amenity=doctors](around:${radiusInMeters},${latitude},${longitude});
          node[dispensing=yes](around:${radiusInMeters},${latitude},${longitude});
          node[shop=medical](around:${radiusInMeters},${latitude},${longitude});
          node[shop=drugstore](around:${radiusInMeters},${latitude},${longitude});
        );
        out body;
      `;

      const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
      });

      const overpassData = await overpassResponse.json();
      let allStores: MedicalStore[] = [];

      if (overpassData.elements && overpassData.elements.length > 0) {
        allStores = overpassData.elements.map((element: any) => {
          const distance = calculateDistance(latitude, longitude, element.lat, element.lon);
          return {
            id: element.id.toString(),
            name: element.tags?.name || element.tags?.operator || "Medical Store",
            address: element.tags?.["addr:full"] || element.tags?.["addr:street"] || "Address not available",
            lat: element.lat,
            lon: element.lon,
            distance: parseFloat(distance.toFixed(2)),
            phone: element.tags?.phone || element.tags?.["contact:phone"],
            type: element.tags?.amenity || element.tags?.shop || "pharmacy",
          };
        });
      }

      if (allStores.length < 5) {
        const searchTerms = ["pharmacy", "chemist", "drugstore", "medical store", "apothecary"];
        
        for (const term of searchTerms) {
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${term}&viewbox=${
            longitude - 0.2
          },${latitude + 0.2},${longitude + 0.2},${latitude - 0.2}&bounded=1&limit=50`;

          const nominatimResponse = await fetch(nominatimUrl);
          const nominatimData = await nominatimResponse.json();

          const nominatimStores = nominatimData.map((place: any) => {
            const distance = calculateDistance(latitude, longitude, parseFloat(place.lat), parseFloat(place.lon));
            return {
              id: place.place_id.toString(),
              name: place.display_name.split(",")[0],
              address: place.display_name,
              lat: parseFloat(place.lat),
              lon: parseFloat(place.lon),
              distance: parseFloat(distance.toFixed(2)),
              type: "pharmacy",
            };
          }).filter((store: MedicalStore) => store.distance <= searchRadius / 1000);

          allStores = [...allStores, ...nominatimStores];
        }
      }

      const uniqueStores = allStores.filter(
        (store, index, self) =>
          index ===
          self.findIndex(
            (s) =>
              Math.abs(s.lat - store.lat) < 0.0001 && Math.abs(s.lon - store.lon) < 0.0001
          )
      );

      const sortedStores = uniqueStores
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 100);

      setStores(sortedStores);
      setFilteredStores(sortedStores);

      if (sortedStores.length === 0) {
        toast.info(`No medical stores found within ${searchRadius / 1000}km`);
      } else {
        toast.success(`Found ${sortedStores.length} medical stores nearby`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for stores. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDirections = (lat: number, lon: number) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${lat},${lon}`;
      window.open(url, "_blank");
    }
  };

  const searchLocationManually = async () => {
    if (!manualLocationSearch.trim()) {
      toast.error("Please enter a location (city, area, or PIN code)");
      return;
    }

    setSearchingManualLocation(true);
    
    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use Nominatim to search for the location
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationSearch)}&countrycodes=in&addressdetails=1&limit=1`;
      
      const response = await fetch(searchUrl, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "MediTatva/1.0",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search location");
      }

      const results = await response.json();
      
      if (results.length === 0) {
        toast.error("Location not found. Please try with a different search term.");
        setSearchingManualLocation(false);
        return;
      }

      const result = results[0];
      const addr = result.address || {};
      
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      
      const city = addr.city || 
                   addr.town || 
                   addr.village || 
                   addr.municipality || 
                   addr.suburb ||
                   addr.county || 
                   addr.state_district ||
                   result.name ||
                   "Unknown City";
      
      const state = addr.state || addr.province || addr.region || "";
      const country = addr.country || "India";
      const postalCode = addr.postcode || "";

      const locationData = {
        latitude,
        longitude,
        city,
        state,
        country,
        postalCode,
        formattedAddress: result.display_name || `${city}, ${state}`,
      };

      console.log("✅ Manual location set:", locationData);
      
      setUserLocation(locationData);
      setSearchingManualLocation(false);
      setPermissionDenied(false); // Clear permission denied state
      
      toast.success(`Location set to: ${city}${state ? ', ' + state : ''}`);
      
      // Auto-search for stores after setting location
      setTimeout(() => {
        searchNearbyStores();
      }, 500);
      
    } catch (error) {
      console.error("Manual location search error:", error);
      toast.error("Failed to find location. Please try again.");
      setSearchingManualLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation && stores.length === 0 && !loading) {
      searchNearbyStores();
    }
  }, [userLocation]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(
        (store) =>
          store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchQuery, stores]);

  const radiusOptions = [
    { value: 5000, label: "5 km" },
    { value: 10000, label: "10 km" },
    { value: 15000, label: "15 km" },
    { value: 20000, label: "20 km" },
    { value: 25000, label: "25 km" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Premium Header Card */}
      <Card className="p-8 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 dark:from-blue-500/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-600/10 dark:from-blue-600/20 to-transparent rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 flex-1">
              {/* Title with Live Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 p-3 rounded-xl shadow-lg">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Find Nearby Medical Stores
                </h1>
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Badge className="px-3 py-1 text-sm font-bold shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white border-none">
                    <span className="relative flex h-2.5 w-2.5 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    Live
                  </Badge>
                </motion.div>
              </div>

              {/* Location Display */}
              {locationLoading ? (
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">Detecting your location...</span>
                </div>
              ) : permissionDenied ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border border-yellow-300 dark:border-yellow-700">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Location access denied. Enter your location manually below.</span>
                  </div>
                  
                  {/* Manual Location Search */}
                  <div className="flex gap-2 p-4 bg-white dark:bg-gray-700 rounded-xl border-2 border-blue-200 dark:border-blue-600">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <Input
                        type="text"
                        placeholder="Enter city, area, or PIN code (e.g., Mumbai, 400001)"
                        value={manualLocationSearch}
                        onChange={(e) => setManualLocationSearch(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && searchLocationManually()}
                        className="pl-10 border-blue-200 dark:border-blue-600 focus:border-blue-600 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <Button
                      onClick={searchLocationManually}
                      disabled={searchingManualLocation || !manualLocationSearch.trim()}
                      className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white"
                    >
                      {searchingManualLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : userLocation ? (
                <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Your Current Location</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {userLocation.city !== "Unknown City"
                      ? `${userLocation.city}, ${userLocation.state}`
                      : userLocation.formattedAddress}
                  </p>
                  {userLocation.postalCode && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">📍 PIN: {userLocation.postalCode}</p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">Enable location to find nearby stores</p>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                size="lg"
                className={`gap-2 shadow-xl ${
                  locationLoading
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-blue-200 dark:border-blue-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 dark:from-blue-500 dark:to-blue-300 dark:hover:from-blue-400 dark:hover:to-blue-200 text-white border-2 border-blue-300 dark:border-blue-600'
                }`}
              >
                {locationLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                Refresh Location
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-lg">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Search Radius
              </label>
              <div className="flex gap-2 flex-wrap">
                {radiusOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setSearchRadius(option.value)}
                    variant={searchRadius === option.value ? "default" : "outline"}
                    size="sm"
                    className={searchRadius === option.value 
                      ? "min-w-[70px] bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white" 
                      : "min-w-[70px] border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={searchNearbyStores}
                disabled={!userLocation || loading}
                className="gap-2 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find Stores
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search by store name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 dark:border-blue-600 focus:border-blue-600 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Interactive Map View - Using OpenStreetMap (Free, No API Key Required) */}
      {userLocation && filteredStores.length > 0 && (
        <Card className="p-6 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Interactive Map View
            </h2>
            <Button
              onClick={() => setShowMap(!showMap)}
              variant="outline"
              size="sm"
              className="border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>
          {showMap && (
            <OpenStreetMapComponent
              userLocation={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              stores={filteredStores}
            />
          )}
        </Card>
      )}

      {filteredStores.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredStores.length} of {stores.length} stores
          </p>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery("")}
              variant="ghost"
              size="sm"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredStores.map((store, index) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                        {store.name}
                      </h3>
                      <Badge variant="secondary" className="mt-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                        {store.type || "pharmacy"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {store.distance}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">km away</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="line-clamp-2">{store.address}</p>
                  </div>

                  {store.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <a
                        href={`tel:${store.phone}`}
                        className="hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                      >
                        {store.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => getDirections(store.lat, store.lon)}
                      className="flex-1 gap-2 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white"
                      size="sm"
                    >
                      <Navigation className="h-4 w-4" />
                      Directions
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`,
                          "_blank"
                        )
                      }
                      variant="outline"
                      size="sm"
                      className="gap-2 border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && filteredStores.length === 0 && stores.length === 0 && userLocation && (
        <Card className="p-12 text-center bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-lg">
          <MapPin className="h-16 w-16 text-blue-400 dark:text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No stores found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Click "Find Stores" to search for medical stores near you
          </p>
          <Button onClick={searchNearbyStores} className="gap-2 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white">
            <Search className="h-4 w-4" />
            Search Now
          </Button>
        </Card>
      )}

      {!loading && filteredStores.length === 0 && stores.length > 0 && (
        <Card className="p-12 text-center bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-lg">
          <AlertCircle className="h-16 w-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No matching stores
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Try different search terms or clear the search filter
          </p>
          <Button onClick={() => setSearchQuery("")} variant="outline" className="border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
            Clear Search
          </Button>
        </Card>
      )}
    </div>
  );
});

NearbyMedicalStoresPage.displayName = "NearbyMedicalStoresPage";
