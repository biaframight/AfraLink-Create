import { useLocation } from "wouter";
import { useCreateRental, useListStates, useListCities, useRequestUploadUrl } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, Upload, CheckCircle, X, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const VEHICLE_TYPES = ["Sedan", "SUV", "Hatchback", "Minivan", "Van", "Bus", "Pickup Truck", "Truck", "Other"];
const TRANSMISSIONS = ["Manual", "Automatic"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"];

const schema = z.object({
  vehicleName: z.string().min(2, "Vehicle name required"),
  brand: z.string().min(1, "Brand required"),
  model: z.string().min(1, "Model required"),
  year: z.number({ coerce: true }).int().min(1990).max(2030).optional(),
  color: z.string().optional(),
  vehicleType: z.string().min(1, "Select vehicle type"),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  seatingCapacity: z.number({ coerce: true }).int().min(1).max(100).optional(),
  plateNumber: z.string().optional(),
  state: z.string().min(1, "Select a state"),
  city: z.string().min(1, "Select a city"),
  dailyPrice: z.number({ coerce: true }).positive("Enter a valid daily price"),
  weeklyPrice: z.number({ coerce: true }).optional(),
  monthlyPrice: z.number({ coerce: true }).optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().min(7, "Valid phone required"),
});

type FormValues = z.infer<typeof schema>;

export default function ListVehicle() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<{ objectPath: string; preview: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const requestUpload = useRequestUploadUrl();
  const createRental = useCreateRental();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleName: "", brand: "", model: "", color: "", vehicleType: "", transmission: "", fuelType: "",
      plateNumber: "", state: "", city: "", ownerName: "", ownerPhone: "",
    },
  });

  const selectedState = form.watch("state");
  const { data: statesResponse } = useListStates();
  const { data: citiesResponse } = useListCities({ state: selectedState }, { query: { enabled: !!selectedState, queryKey: ["cities", selectedState] } });

  const handlePhotoUpload = async (file: File) => {
    if (photos.length >= 5) { toast({ title: "Maximum 5 photos allowed" }); return; }
    setUploadingPhoto(true);
    try {
      const result = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      await fetch(result.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setPhotos(prev => [...prev, { objectPath: result.objectPath, preview: URL.createObjectURL(file) }]);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const onSubmit = (values: FormValues) => {
    createRental.mutate(
      { data: { ...values, photoUrls: photos.map(p => p.objectPath) } },
      {
        onSuccess: () => {
          toast({ title: "Listing submitted!", description: "Your vehicle will appear once verified by our team." });
          navigate("/dashboard");
        },
        onError: () => toast({ title: "Error", description: "Failed to submit listing.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">List Your Vehicle</h1>
        <p className="text-slate-500 mt-1">Get your vehicle in front of thousands of customers across Southern Nigeria.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vehicle Details */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vehicleName" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Listing Title *</FormLabel><FormControl><Input placeholder="e.g. Toyota Camry 2020 - Lagos" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-vehicle-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem><FormLabel>Brand *</FormLabel><FormControl><Input placeholder="e.g. Toyota" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-brand" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Model *</FormLabel><FormControl><Input placeholder="e.g. Camry" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-model" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="e.g. 2020" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-year" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="e.g. Silver" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-color" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="vehicleType" render={({ field }) => (
                  <FormItem><FormLabel>Vehicle Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-vehicle-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem><FormLabel>Transmission</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-transmission"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="fuelType" render={({ field }) => (
                  <FormItem><FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-fuel"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="seatingCapacity" render={({ field }) => (
                  <FormItem><FormLabel>Seating Capacity</FormLabel><FormControl><Input type="number" placeholder="e.g. 5" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-seating" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="plateNumber" render={({ field }) => (
                  <FormItem><FormLabel>Plate Number</FormLabel><FormControl><Input placeholder="e.g. LND 123 AA" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-plate" /></FormControl></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State *</FormLabel>
                    <Select onValueChange={v => { field.onChange(v); form.setValue("city", ""); }} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-state"><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                      <SelectContent>{statesResponse?.states.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-city"><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                      <SelectContent>{citiesResponse?.cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle>Pricing (NGN)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="dailyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Daily Rate *</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-daily-price" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="weeklyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Weekly Rate</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-weekly-price" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="monthlyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Monthly Rate</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-monthly-price" /></FormControl></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Owner Contact */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="ownerName" render={({ field }) => (
                <FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-owner-name" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="ownerPhone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input placeholder="08012345678" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-owner-phone" /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>Vehicle Photos</CardTitle>
              <p className="text-sm text-slate-500">Upload up to 5 photos. Clear photos get more bookings.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                    <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80" data-testid={`button-remove-photo-${idx}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Main</span>}
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors">
                    {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-400">{photos.length === 0 ? "Add Photos" : "Add More"}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} data-testid="input-photo-upload" />
                  </label>
                )}
                {photos.length === 0 && (
                  <div className="col-span-2 aspect-video rounded-xl bg-slate-50 flex items-center justify-center">
                    <Car className="w-12 h-12 text-slate-200" />
                  </div>
                )}
              </div>
              {photos.length > 0 && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />{photos.length} photo{photos.length !== 1 ? "s" : ""} ready</p>}
            </CardContent>
          </Card>

          <Button type="submit" disabled={createRental.isPending || uploadingPhoto} className="w-full rounded-xl bg-primary text-white h-12 text-base font-semibold" data-testid="button-submit-listing">
            {createRental.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>
          <p className="text-center text-xs text-slate-400">Your listing will be live after our team verifies the details (usually within 24 hours).</p>
        </form>
      </Form>
    </div>
  );
}
