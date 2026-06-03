import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateDriver, useListStates, useListCities, useRequestUploadUrl } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const VEHICLE_TYPES = ["Private Car", "Taxi", "Keke (Tricycle)", "Motorcycle", "Bus", "Mini-Bus", "Van", "Pickup", "Truck", "Lorry", "Delivery Van", "Logistics"];

const step1Schema = z.object({
  fullName: z.string().min(2, "Full name required"),
  phone: z.string().min(7, "Valid phone required"),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.string().optional(),
  state: z.string().min(1, "Select a state"),
  city: z.string().min(1, "Select a city"),
  address: z.string().optional(),
});

const step2Schema = z.object({
  vehicleType: z.string().min(1, "Select vehicle type"),
  vehicleBrand: z.string().min(1, "Brand required"),
  vehicleModel: z.string().optional(),
  vehicleColor: z.string().optional(),
  plateNumber: z.string().min(1, "Plate number required"),
});

const step3Schema = z.object({
  ninNumber: z.string().min(11, "NIN must be at least 11 digits").optional().or(z.literal("")),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

type UploadedFile = { objectPath: string; preview: string };

const STEPS = ["Personal Info", "Vehicle Info", "Documents"];

async function uploadFile(file: File, requestUpload: any): Promise<string> {
  const result = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
  await fetch(result.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return result.objectPath;
}

function FileUploadField({ label, onChange, preview, loading }: { label: string; onChange: (f: File) => void; preview: string | null; loading: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <label className="block cursor-pointer">
        <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${preview ? "border-primary/30 bg-primary/5" : "border-slate-200 hover:border-slate-300 bg-slate-50"}`}>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          ) : preview ? (
            <div className="space-y-2">
              <img src={preview} alt="" className="h-24 w-full object-cover rounded-xl mx-auto" />
              <p className="text-xs text-green-600 flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Uploaded</p>
            </div>
          ) : (
            <div className="space-y-2 text-slate-400">
              <Upload className="w-6 h-6 mx-auto" />
              <p className="text-sm">Click to upload</p>
            </div>
          )}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      </label>
    </div>
  );
}

export default function BecomeDriver() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [step2Data, setStep2Data] = useState<Step2 | null>(null);

  const [uploads, setUploads] = useState<Record<string, UploadedFile | null>>({
    ninSlip: null, selfie: null, vehiclePhoto: null, profilePhoto: null
  });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const requestUpload = useRequestUploadUrl();
  const createDriver = useCreateDriver();

  const step1Form = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { fullName: "", phone: "", email: "", gender: "", state: "", city: "", address: "" } });
  const step2Form = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { vehicleType: "", vehicleBrand: "", vehicleModel: "", vehicleColor: "", plateNumber: "" } });
  const step3Form = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { ninNumber: "" } });

  const selectedState = step1Form.watch("state");
  const { data: statesResponse } = useListStates();
  const { data: citiesResponse } = useListCities({ state: selectedState }, { query: { enabled: !!selectedState, queryKey: ["cities", selectedState] } });

  const handleFileUpload = async (field: string, file: File) => {
    setUploadingField(field);
    try {
      const objectPath = await uploadFile(file, requestUpload);
      setUploads(prev => ({ ...prev, [field]: { objectPath, preview: URL.createObjectURL(file) } }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingField(null);
    }
  };

  const onStep1Submit = (data: Step1) => { setStep1Data(data); setCurrentStep(1); };
  const onStep2Submit = (data: Step2) => { setStep2Data(data); setCurrentStep(2); };

  const onStep3Submit = async (data: Step3) => {
    if (!step1Data || !step2Data) return;

    const allData = {
      ...step1Data,
      ...step2Data,
      ninNumber: data.ninNumber || undefined,
      ninSlipUrl: uploads.ninSlip?.objectPath,
      selfieUrl: uploads.selfie?.objectPath,
      vehiclePhotoUrl: uploads.vehiclePhoto?.objectPath,
      profilePhotoUrl: uploads.profilePhoto?.objectPath,
    };

    createDriver.mutate({ data: allData }, {
      onSuccess: () => {
        toast({ title: "Application submitted!", description: "We'll review your documents and get back to you within 1-2 business days." });
        navigate("/driver-dashboard");
      },
      onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Failed to submit.", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Become a Driver</h1>
        <p className="text-slate-500 mt-1">Register to start earning on AfraLink. Takes about 5 minutes.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${i < currentStep ? "bg-green-500 text-white" : i === currentStep ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
              {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden md:block ${i === currentStep ? "font-semibold text-slate-900" : "text-slate-400"}`}>{step}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? "bg-green-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {currentStep === 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={step1Form.control} name="fullName" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Full Name *</FormLabel><FormControl><Input placeholder="e.g. Chukwuemeka Obi" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-fullname" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={step1Form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input placeholder="08012345678" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-phone" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={step1Form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email (optional)</FormLabel><FormControl><Input placeholder="you@email.com" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-email" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={step1Form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-gender"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                  <FormField control={step1Form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State *</FormLabel>
                      <Select onValueChange={v => { field.onChange(v); step1Form.setValue("city", ""); }} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-state"><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                        <SelectContent>{statesResponse?.states.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={step1Form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                        <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-city"><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                        <SelectContent>{citiesResponse?.cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={step1Form.control} name="address" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Address (optional)</FormLabel><FormControl><Input placeholder="Street address" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-address" /></FormControl></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full rounded-xl bg-primary text-white h-11" data-testid="button-step1-next">
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Vehicle Info */}
      {currentStep === 1 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle>Vehicle Information</CardTitle></CardHeader>
          <CardContent>
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={step2Form.control} name="vehicleType" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Vehicle Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-vehicle-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={step2Form.control} name="vehicleBrand" render={({ field }) => (
                    <FormItem><FormLabel>Brand *</FormLabel><FormControl><Input placeholder="e.g. Toyota" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-brand" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={step2Form.control} name="vehicleModel" render={({ field }) => (
                    <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. Camry" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-model" /></FormControl></FormItem>
                  )} />
                  <FormField control={step2Form.control} name="vehicleColor" render={({ field }) => (
                    <FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="e.g. Silver" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-color" /></FormControl></FormItem>
                  )} />
                  <FormField control={step2Form.control} name="plateNumber" render={({ field }) => (
                    <FormItem><FormLabel>Plate Number *</FormLabel><FormControl><Input placeholder="e.g. LND 123 AA" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-plate" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} className="flex-1 rounded-xl border-slate-200" data-testid="button-step2-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />Back
                  </Button>
                  <Button type="submit" className="flex-[2] rounded-xl bg-primary text-white h-11" data-testid="button-step2-next">
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Documents */}
      {currentStep === 2 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <p className="text-sm text-slate-500">Your documents are stored securely and only used for verification.</p>
          </CardHeader>
          <CardContent>
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-6">
                <FormField control={step3Form.control} name="ninNumber" render={({ field }) => (
                  <FormItem><FormLabel>NIN Number (National Identification Number)</FormLabel><FormControl><Input placeholder="11-digit NIN" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-nin" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FileUploadField label="Profile Photo *" onChange={f => handleFileUpload("profilePhoto", f)} preview={uploads.profilePhoto?.preview ?? null} loading={uploadingField === "profilePhoto"} />
                  <FileUploadField label="Selfie (holding NIN card)" onChange={f => handleFileUpload("selfie", f)} preview={uploads.selfie?.preview ?? null} loading={uploadingField === "selfie"} />
                  <FileUploadField label="NIN Slip" onChange={f => handleFileUpload("ninSlip", f)} preview={uploads.ninSlip?.preview ?? null} loading={uploadingField === "ninSlip"} />
                  <FileUploadField label="Vehicle Photo" onChange={f => handleFileUpload("vehiclePhoto", f)} preview={uploads.vehiclePhoto?.preview ?? null} loading={uploadingField === "vehiclePhoto"} />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 rounded-xl border-slate-200" data-testid="button-step3-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />Back
                  </Button>
                  <Button type="submit" disabled={createDriver.isPending || uploadingField !== null} className="flex-[2] rounded-xl bg-primary text-white h-11" data-testid="button-submit-application">
                    {createDriver.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Submit Application
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
