import { useState } from "react";
import { useListDrivers, useListStates, useListCities, getListDriversQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Search, Star, ShieldCheck, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const VEHICLE_TYPES = [
  "Taxi Ride", "Keke Ride", "Motorcycle Ride", "Intercity Transport",
  "Bus Hire", "Truck Hire", "Pickup Hire", "Van Hire",
  "Moving Services", "Delivery Services", "Logistics Services", "Car Rental"
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DriversList() {
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedState, setSelectedState] = useState<string>(searchParams.get("state") || "");
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get("city") || "");
  const [selectedType, setSelectedType] = useState<string>(searchParams.get("vehicleType") || "");
  const [page, setPage] = useState(1);

  const { data: statesResponse } = useListStates();
  const { data: citiesResponse } = useListCities(
    { state: selectedState },
    { query: { enabled: !!selectedState, queryKey: ["cities", selectedState] } }
  );

  const queryParams = {
    ...(selectedState && { state: selectedState }),
    ...(selectedCity && { city: selectedCity }),
    ...(selectedType && { vehicleType: selectedType }),
    page,
    limit: 18,
  };

  const { data, isLoading } = useListDrivers(queryParams, {
    query: { queryKey: getListDriversQueryKey(queryParams) }
  });

  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / 18);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Find Drivers</h1>
        <p className="text-slate-500 mt-1">Connect directly with verified transport providers.</p>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setSelectedCity(""); setPage(1); }}>
            <SelectTrigger className="flex-1 bg-slate-50 border-0 rounded-xl" data-testid="select-state">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              {statesResponse?.states.map(s => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={(v) => { setSelectedCity(v); setPage(1); }} disabled={!selectedState}>
            <SelectTrigger className="flex-1 bg-slate-50 border-0 rounded-xl disabled:opacity-50" data-testid="select-city">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              {citiesResponse?.cities.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(1); }}>
            <SelectTrigger className="flex-1 bg-slate-50 border-0 rounded-xl" data-testid="select-vehicle-type">
              <SelectValue placeholder="All Vehicle Types" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedState || selectedCity || selectedType) && (
            <Button variant="outline" onClick={() => { setSelectedState(""); setSelectedCity(""); setSelectedType(""); setPage(1); }} className="rounded-xl border-slate-200" data-testid="button-clear-filters">
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-slate-500">{total} driver{total !== 1 ? "s" : ""} found</p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-slate-100">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.drivers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No drivers found</h3>
          <p className="text-slate-500 mt-2 mb-6">Try adjusting your filters or searching in a different area.</p>
          <Button onClick={() => { setSelectedState(""); setSelectedCity(""); setSelectedType(""); }} variant="outline" data-testid="button-clear-filters-empty">
            Clear All Filters
          </Button>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.drivers.map(driver => (
            <motion.div key={driver.id} variants={item}>
              <Card className="overflow-hidden bg-white hover:shadow-xl transition-shadow border-slate-100 flex flex-col h-full" data-testid={`card-driver-${driver.id}`}>
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="p-6 flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-slate-100">
                      {driver.profilePhotoUrl ? (
                        <img src={driver.profilePhotoUrl} alt={driver.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                          {driver.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-lg text-slate-900 truncate">{driver.fullName}</h3>
                        {driver.verificationStatus === "approved" && (
                          <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">{driver.vehicleType}</Badge>
                        {driver.isAvailable ? (
                          <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 text-xs">Available</Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-200 text-slate-400 text-xs">Busy</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 gap-1 mb-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{driver.city}, {driver.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(Number(driver.averageRating || 0)) ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`} />
                        ))}
                        <span className="text-xs font-medium ml-1 text-slate-700">{driver.averageRating ? Number(driver.averageRating).toFixed(1) : "New"}</span>
                        <span className="text-slate-400 text-xs">({driver.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 mt-auto">
                    {driver.phone && (
                      <a href={`tel:${driver.phone}`} className="flex-1" onClick={e => e.stopPropagation()}>
                        <Button variant="outline" className="w-full rounded-xl border-slate-200 h-10" data-testid={`button-call-${driver.id}`}>
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {driver.phone && (
                      <a href={`https://wa.me/234${driver.phone.replace(/^(\+234|0)/, "")}?text=Hi, I found your profile on AfraLink and would like to book your services.`} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white border-0 h-10 text-xs" data-testid={`button-whatsapp-${driver.id}`}>
                          WhatsApp
                        </Button>
                      </a>
                    )}
                    <Link href={`/drivers/${driver.id}`} className="flex-[2]">
                      <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white h-10 text-xs" data-testid={`button-view-driver-${driver.id}`}>
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl" data-testid="button-prev-page">Previous</Button>
          <span className="flex items-center px-4 text-sm text-slate-600">Page {page} of {pageCount}</span>
          <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)} className="rounded-xl" data-testid="button-next-page">Next</Button>
        </div>
      )}
    </div>
  );
}
