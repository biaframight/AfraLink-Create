import { useListFeatured, useListStates, useListCities } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Car, ShieldCheck, Zap, Phone, Truck, Package, Bus, Bike, Star, ArrowRight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: featured, isLoading } = useListFeatured();
  const { data: statesResponse } = useListStates();
  
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const { data: citiesResponse } = useListCities(
    { state: selectedState },
    { query: { enabled: !!selectedState, queryKey: ['cities', selectedState] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedState) params.append("state", selectedState);
    if (selectedCity) params.append("city", selectedCity);
    if (selectedType) params.append("vehicleType", selectedType);
    setLocation(`/drivers?${params.toString()}`);
  };

  const categories = [
    { name: "Taxi Ride", icon: Car },
    { name: "Keke Ride", icon: Zap },
    { name: "Motorcycle Ride", icon: Bike },
    { name: "Intercity Transport", icon: ArrowRight },
    { name: "Bus Hire", icon: Bus },
    { name: "Truck Hire", icon: Truck },
    { name: "Pickup Hire", icon: Truck },
    { name: "Van Hire", icon: Truck },
    { name: "Moving Services", icon: Package },
    { name: "Delivery Services", icon: Package },
    { name: "Logistics Services", icon: ShieldCheck },
    { name: "Car Rental", icon: Car },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-[2.5rem] bg-slate-900 text-white overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10 px-6 py-16 md:py-24 flex flex-col items-center text-center space-y-8">
          <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/30 text-sm px-4 py-1.5 rounded-full border border-primary/30">
            Southern Nigeria's #1 Transport Hub
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
            Find a Driver, Rent a Vehicle, Move Anything.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light">
            Direct connections. Verified providers. Zero hidden fees.
          </p>
          
          <form onSubmit={handleSearch} className="w-full max-w-4xl mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-3xl flex flex-col md:flex-row gap-3 shadow-2xl">
            <div className="flex-1">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full h-14 bg-white/90 border-0 rounded-2xl text-slate-900 font-medium">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {statesResponse?.states.map(s => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                <SelectTrigger className="w-full h-14 bg-white/90 border-0 rounded-2xl text-slate-900 font-medium disabled:opacity-50">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {citiesResponse?.cities.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full h-14 bg-white/90 border-0 rounded-2xl text-slate-900 font-medium">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" className="h-14 w-full md:w-auto rounded-2xl px-10 bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-lg shadow-primary/30">
              <Search className="w-5 h-5 mr-2" />
              Find Drivers
            </Button>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">What do you need?</h2>
            <p className="text-slate-500 mt-2">Browse our wide range of transportation services.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.name} href={`/drivers?vehicleType=${encodeURIComponent(cat.name)}`}>
                <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white">
                  <CardContent className="p-6 md:p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-primary/10 text-slate-600 group-hover:text-primary transition-colors flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Drivers */}
      {!isLoading && featured?.drivers && featured.drivers.length > 0 && (
        <section className="space-y-8 bg-slate-50 -mx-4 md:-mx-8 px-4 md:px-8 py-16 rounded-[3rem]">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Top Rated Drivers</h2>
              <p className="text-slate-500 mt-2">Highly recommended professionals in your area.</p>
            </div>
            <Link href="/drivers">
              <Button variant="ghost" className="text-primary font-semibold hover:bg-primary/10">View All <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.drivers.slice(0, 6).map((driver) => (
              <Card key={driver.id} className="overflow-hidden bg-white hover:shadow-xl transition-shadow border-slate-100">
                <CardContent className="p-0">
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {driver.profilePhotoUrl ? (
                        <img src={driver.profilePhotoUrl} alt={driver.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                          {driver.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-slate-900 truncate">{driver.fullName}</h3>
                        {driver.verificationStatus === 'approved' && (
                          <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <Badge variant="secondary" className="mb-2 bg-slate-100 text-slate-600">{driver.vehicleType}</Badge>
                      <div className="flex items-center text-sm text-slate-500 gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{driver.city}, {driver.state}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{driver.averageRating ? Number(driver.averageRating).toFixed(1) : "New"}</span>
                        <span className="text-slate-400 text-xs">({driver.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <a href={`tel:${driver.phone}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-slate-100 hover:text-slate-900">
                        <Phone className="w-4 h-4 mr-2" /> Call
                      </Button>
                    </a>
                    <a href={`https://wa.me/234${driver.phone.replace(/^0/, '')}?text=Hi, I found your profile on AfraLink and would like to book your services.`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white border-0">
                        WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12 tracking-tight">How AfraLink Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">1</div>
            <h3 className="text-xl font-bold text-slate-900">Find a Provider</h3>
            <p className="text-slate-500">Search for drivers or rental vehicles in your exact location.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">2</div>
            <h3 className="text-xl font-bold text-slate-900">Check their Profile</h3>
            <p className="text-slate-500">View verified profiles, real photos, and customer reviews.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">3</div>
            <h3 className="text-xl font-bold text-slate-900">Contact Directly</h3>
            <p className="text-slate-500">Call or message them on WhatsApp immediately. No middlemen.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary rounded-[3rem] p-12 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/10 blur-3xl"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold tracking-tight">Join the Network</h2>
          <p className="text-primary-foreground/80 text-lg">
            Whether you drive a keke, own a fleet of buses, or have a delivery van. List your services on AfraLink and get more customers today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/become-driver">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white text-primary hover:bg-slate-50 font-bold text-lg">
                Register as a Driver
              </Button>
            </Link>
            <Link href="/list-vehicle">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/30 text-white hover:bg-white/10 font-bold text-lg bg-transparent">
                List Your Vehicle
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
