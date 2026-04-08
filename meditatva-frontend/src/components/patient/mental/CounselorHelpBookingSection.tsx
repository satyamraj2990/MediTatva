import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserLocation = {
  latitude: number;
  longitude: number;
};

type DoctorFlashcard = {
  id: string;
  avatar: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  hospital: string;
  location: string;
  distance: string;
  experience: string;
  consultation: string;
  availabilityLabel: string;
  nextSlot: string;
  timings: string;
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getDistanceKm = (from: UserLocation, to: { latitude: number; longitude: number }) => {
  const latDiff = toRadians(to.latitude - from.latitude);
  const lonDiff = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) *
    Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);

  return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const estimateDriveEtaMinutes = (distanceKm: number) => {
  const avgCitySpeedKmph = 28;
  return Math.max(3, Math.round((distanceKm / avgCitySpeedKmph) * 60));
};

const doctorCards: DoctorFlashcard[] = [
  {
    id: "doc-1",
    avatar: "👨‍⚕️",
    name: "Dr. Rajesh Kumar",
    specialty: "Cardiologist",
    rating: 4.8,
    reviews: 342,
    hospital: "Apollo Hospital",
    location: "Chandigarh • Sector 8B, Industrial Area, Phase I",
    distance: "2.4 km away",
    experience: "15 years",
    consultation: "Rs 800",
    availabilityLabel: "Available",
    nextSlot: "Today, 3:00 PM",
    timings: "9:00 AM - 5:00 PM",
    latitude: 30.7333,
    longitude: 76.7794
  },
  {
    id: "doc-2",
    avatar: "👩‍⚕️",
    name: "Dr. Priya Sharma",
    specialty: "Dermatologist",
    rating: 4.9,
    reviews: 456,
    hospital: "Max Super Specialty Hospital",
    location: "Mohali • Phase 6, Sector 59",
    distance: "3.8 km away",
    experience: "12 years",
    consultation: "Rs 600",
    availabilityLabel: "Available",
    nextSlot: "Tomorrow, 11:00 AM",
    timings: "10:00 AM - 6:00 PM",
    latitude: 30.7046,
    longitude: 76.7179
  },
  {
    id: "doc-3",
    avatar: "👨‍⚕️",
    name: "Dr. Amit Verma",
    specialty: "General Physician",
    rating: 4.7,
    reviews: 789,
    hospital: "Fortis Hospital",
    location: "Delhi • Sector 62, Noida Link Road",
    distance: "5.2 km away",
    experience: "20 years",
    consultation: "Rs 500",
    availabilityLabel: "Available",
    nextSlot: "Today, 5:30 PM",
    timings: "8:00 AM - 8:00 PM",
    latitude: 28.6139,
    longitude: 77.391
  },
  {
    id: "doc-4",
    avatar: "👩‍⚕️",
    name: "Dr. Sneha Patel",
    specialty: "Pediatrician",
    rating: 4.9,
    reviews: 523,
    hospital: "Medanta - The Medicity",
    location: "Gurgaon • Sector 38, Golf Course Road",
    distance: "4.1 km away",
    experience: "10 years",
    consultation: "Rs 700",
    availabilityLabel: "Available",
    nextSlot: "Today, 2:00 PM",
    timings: "9:00 AM - 4:00 PM",
    latitude: 28.4595,
    longitude: 77.0266
  },
  {
    id: "doc-5",
    avatar: "👨‍⚕️",
    name: "Dr. Vikram Singh",
    specialty: "Orthopedic",
    rating: 4.6,
    reviews: 612,
    hospital: "AIIMS Delhi",
    location: "Delhi • Ansari Nagar East, Aurobindo Marg",
    distance: "6.7 km away",
    experience: "18 years",
    consultation: "Rs 900",
    availabilityLabel: "Available",
    nextSlot: "Tomorrow, 10:30 AM",
    timings: "10:00 AM - 3:00 PM",
    latitude: 28.5682,
    longitude: 77.2095
  },
  {
    id: "doc-6",
    avatar: "👩‍⚕️",
    name: "Dr. Kavita Mehta",
    specialty: "Neurologist",
    rating: 4.8,
    reviews: 445,
    hospital: "Jaypee Hospital",
    location: "Noida • Sector 128, Expressway",
    distance: "8.3 km away",
    experience: "14 years",
    consultation: "Rs 1000",
    availabilityLabel: "Available",
    nextSlot: "Today, 4:30 PM",
    timings: "11:00 AM - 5:00 PM",
    latitude: 28.5355,
    longitude: 77.391
  },
  {
    id: "doc-7",
    avatar: "👨‍⚕️",
    name: "Dr. Arjun Reddy",
    specialty: "ENT Specialist",
    rating: 4.7,
    reviews: 328,
    hospital: "Columbia Asia Hospital",
    location: "Panchkula • MDC Sector 5, Near IT Park",
    distance: "1.9 km away",
    experience: "9 years",
    consultation: "Rs 550",
    availabilityLabel: "Available",
    nextSlot: "Today, 6:00 PM",
    timings: "9:00 AM - 6:00 PM",
    latitude: 30.6942,
    longitude: 76.8606
  },
  {
    id: "doc-8",
    avatar: "👩‍⚕️",
    name: "Dr. Meera Iyer",
    specialty: "Psychiatrist",
    rating: 4.9,
    reviews: 267,
    hospital: "Nimhans Bangalore",
    location: "Bangalore • Hosur Road, Adugodi",
    distance: "12.5 km away",
    experience: "11 years",
    consultation: "Rs 1200",
    availabilityLabel: "Available",
    nextSlot: "Tomorrow, 3:00 PM",
    timings: "2:00 PM - 8:00 PM",
    latitude: 12.9401,
    longitude: 77.5946
  },
  {
    id: "doc-9",
    avatar: "👨‍⚕️",
    name: "Dr. Sanjay Joshi",
    specialty: "Dentist",
    rating: 4.8,
    reviews: 534,
    hospital: "Clove Dental",
    location: "Ludhiana • Ferozepur Road, Model Town",
    distance: "7.8 km away",
    experience: "13 years",
    consultation: "Rs 400",
    availabilityLabel: "Available",
    nextSlot: "Today, 7:30 PM",
    timings: "10:00 AM - 7:00 PM",
    latitude: 30.901,
    longitude: 75.8573
  },
  {
    id: "doc-10",
    avatar: "👩‍⚕️",
    name: "Dr. Ananya Desai",
    specialty: "Gastroenterologist",
    rating: 4.7,
    reviews: 398,
    hospital: "Lilavati Hospital",
    location: "Mumbai • Bandra Reclamation, Bandra West",
    distance: "15.2 km away",
    experience: "16 years",
    consultation: "Rs 850",
    availabilityLabel: "Available",
    nextSlot: "Tomorrow, 11:30 AM",
    timings: "9:00 AM - 4:00 PM",
    latitude: 19.049,
    longitude: 72.829
  }
];

export const CounselorHelpBookingSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState("");

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return doctorCards;

    return doctorCards.filter((doctor) => {
      return [doctor.name, doctor.specialty, doctor.location]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [searchQuery]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Live directions are unavailable because geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError("");
      },
      () => {
        setLocationError("Enable location to get real-time route and ETA to each clinic.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const openDirections = (doctor: DoctorFlashcard) => {
    const destination = `${doctor.latitude},${doctor.longitude}`;
    const url = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <Card className="border-sky-200 dark:border-sky-900/40 bg-gradient-to-r from-sky-50 via-white to-cyan-50 dark:from-sky-950/20 dark:via-slate-900 dark:to-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-xl">Find Doctors</CardTitle>
          <CardDescription>
            Book appointments with top specialists near you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationError && (
            <p className="text-xs text-amber-700 dark:text-amber-300">{locationError}</p>
          )}

          <div className="relative">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by doctor name, specialty, or city..."
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-xl leading-none">{doctor.avatar}</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{doctor.name}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{doctor.specialty}</p>

                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <p>{doctor.rating}</p>
                    <p>({doctor.reviews} reviews)</p>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-white">{doctor.hospital}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{doctor.location}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{doctor.distance}</p>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <p className="text-slate-500 dark:text-slate-400">Experience</p>
                    <p className="text-slate-900 dark:text-white">{doctor.experience}</p>
                    <p className="text-slate-500 dark:text-slate-400">Consultation</p>
                    <p className="text-slate-900 dark:text-white">{doctor.consultation}</p>
                    <p className="text-slate-500 dark:text-slate-400">{doctor.availabilityLabel}</p>
                    <p className="text-slate-900 dark:text-white">{doctor.nextSlot}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">{doctor.timings}</p>

                  {userLocation && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Live route: {getDistanceKm(userLocation, { latitude: doctor.latitude, longitude: doctor.longitude }).toFixed(1)} km • ETA ~{estimateDriveEtaMinutes(getDistanceKm(userLocation, { latitude: doctor.latitude, longitude: doctor.longitude }))} min
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button className="w-full">Book Appointment</Button>
                    <Button variant="outline" className="w-full" onClick={() => openDirections(doctor)}>
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">No doctors match your search.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
