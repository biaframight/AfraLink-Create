import { useState } from "react";
import { useListRentals, useListStates, useListCities, getListRentalsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Phone, Star, ShieldCheck, Search, Car } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const VEHICLE_TYPES = ["Private Car", "SUV", "Minivan", "Bus", "Pickup", "Truck", "Van"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function RentalsList() {
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedState, setSelectedState] = useState(searchParams.get("state") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("vehicleType") || "");
  const [page, setPage] = useState(1);

  const { data: statesResponse } = useListStates();
  const { data: citiesResponse } = useListCities({ state: selectedState }, { query: { enabled: !!selectedState, queryKey: ["cities", selectedState] } });

  const queryParams = {
    ...(selectedState && { state: selectedState }),
    ...(selectedCity && { city: selectedCity }),
    ...(selectedType && { vehicleType: selectedType }),
    page, limit: 18,
  };
  const { data, isLoading } = useListRentals(queryParams, { query: { queryKey: getListRentalsQueryKey(queryParams) } });
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / 18);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Car Rentals</h1>
        <p className="text-slate-500 mt-1">Browse verified vehicles available for rent across Southern Nigeria.</p>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setSelectedCity(""); setPage(1); }}>
            <SelectTrigger className="flex-1 bg-slate-50 border-0 rounded-xl" data-testid="select-state"><SelectValue placeholder="All States" /></SelectTrigger>
            <SelectContent>{statesResponse?.states.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedCity} onValueChange={(v) => { setSelectedCity(v); setPage(1); }} disabled={!selectedState}>
            <SelectTrigger className="flex-1 bg-slate-50 border-0 rounded-xl" data-testid="select-city"><SelectValue placeholder="All Cities" /></SelectTrigger>
            <SelectContent>{citiesResponse?.cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(1); }}>
            <SelectTrigger className="flex-1 bg-slate-50 border-0 rounded-xl" data-testid="select-type"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          {(selectedState || selectedCity || selectedType) && (
            <Button variant="outline" onClick={() => { setSelectedState(""); setSelectedCity(""); setSelectedType(""); setPage(1); }} className="rounded-xl border-slate-200" data-testid="button-clear">Clear</Button>
          )}
        </CardContent>
      </Card>

      {!isLoading && <p className="text-sm text-slate-500">{total} vehicle{total !== 1 ? "s" : ""} available</p>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-slate-100">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.rentals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No vehicles found</h3>
          <p className="text-slate-500 mt-2 mb-6">Try different filters or a different location.</p>
          <Button variant="outline" onClick={() => { setSelectedState(""); setSelectedCity(""); setSelectedType(""); }} data-testid="button-clear-empty">Clear Filters</Button>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.rentals.map(rental => (
            <motion.div key={rental.id} variants={item}>
              <Card className="overflow-hidden bg-white hover:shadow-xl transition-shadow border-slate-100 flex flex-col h-full" data-testid={`card-rental-${rental.id}`}>
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                  {rental.photoUrls?.[0] ? (
                    <img src={rental.photoUrls[0]} alt={rental.vehicleName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Car className="w-16 h-16" />
                    </div>
                  )}
                  {rental.isFeatured && <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">Featured</Badge>}
                  {rental.isAvailable ? <Badge className="absolute top-3 right-3 bg-green-500 text-white text-xs border-0">Available</Badge> : <Badge className="absolute top-3 right-3 bg-slate-500 text-white text-xs border-0">Unavailable</Badge>}
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 truncate">{rental.vehicleName}</h3>
                      <p className="text-sm text-slate-500">{rental.brand} {rental.model} {rental.year ? `(${rental.year})` : ""}</p>
                    </div>
                    {rental.verificationStatus === "approved" && <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3 text-xs text-slate-600">
                    {rental.transmission && <span className="bg-slate-100 px-2 py-1 rounded-full">{rental.transmission}</span>}
                    {rental.seatingCapacity && <span className="bg-slate-100 px-2 py-1 rounded-full">{rental.seatingCapacity} seats</span>}
                    {rental.fuelType && <span className="bg-slate-100 px-2 py-1 rounded-full">{rental.fuelType}</span>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" />{rental.city}, {rental.state}
                  </div>
                  {rental.averageRating && (
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(Number(rental.averageRating)) ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`} />)}
                      <span className="text-xs text-slate-500 ml-1">({rental.reviewCount})</span>
                    </div>
                  )}
                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <p className="text-primary font-bold text-lg">₦{Number(rental.dailyPrice).toLocaleString()}<span className="text-sm font-normal text-slate-500">/day</span></p>
                    {rental.weeklyPrice && <p className="text-slate-500 text-xs">₦{Number(rental.weeklyPrice).toLocaleString()}/week</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {rental.ownerPhone && (
                      <>
                        <a href={`tel:${rental.ownerPhone}`} className="flex-1">
                          <Button variant="outline" className="w-full rounded-xl h-9 border-slate-200" data-testid={`button-call-rental-${rental.id}`}><Phone className="w-4 h-4" /></Button>
                        </a>
                        <a href={`https://wa.me/234${rental.ownerPhone.replace(/^(\+234|0)/, "")}?text=Hi, I found your vehicle on AfraLink and I'm interested in renting it.`} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white border-0 h-9 text-xs" data-testid={`button-whatsapp-rental-${rental.id}`}>WhatsApp</Button>
                        </a>
                      </>
                    )}
                    <Link href={`/rentals/${rental.id}`} className="flex-[2]">
                      <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white h-9 text-xs" data-testid={`button-view-rental-${rental.id}`}>View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {pageCount > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl" data-testid="button-prev">Previous</Button>
          <span className="flex items-center px-4 text-sm text-slate-600">Page {page} of {pageCount}</span>
          <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)} className="rounded-xl" data-testid="button-next">Next</Button>
        </div>
      )}
    </div>
  );
}
