import { useGetMyProfile, useUpdateMyProfile, useListStates, useListCities, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { User, Camera, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  role: z.enum(["customer", "driver", "rental_owner"]).optional(),
  profilePhotoUrl: z.string().optional(),
});

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useGetMyProfile();
  const { data: statesResponse } = useListStates();
  const updateProfile = useUpdateMyProfile();
  const requestUpload = useRequestUploadUrl();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "", state: "", city: "", role: "customer", profilePhotoUrl: "" },
  });

  const selectedState = form.watch("state");
  const { data: citiesResponse } = useListCities({ state: selectedState ?? "" }, { query: { enabled: !!selectedState, queryKey: ["cities", selectedState] } });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
        state: profile.state ?? "",
        city: profile.city ?? "",
        role: (profile.role as "customer" | "driver" | "rental_owner") ?? "customer",
        profilePhotoUrl: profile.profilePhotoUrl ?? "",
      });
      if (profile.profilePhotoUrl) setPhotoPreview(profile.profilePhotoUrl);
    }
  }, [profile]);

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const result = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      await fetch(result.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const objectUrl = `/api/storage/${result.objectPath}`;
      form.setValue("profilePhotoUrl", result.objectPath);
      setPhotoPreview(URL.createObjectURL(file));
      toast({ title: "Photo uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => { toast({ title: "Profile updated!" }); qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() }); },
      onError: () => toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-500 mt-1">{user?.email ?? ""}</p>
      </div>

      {/* Photo */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-100">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">{profile?.fullName?.charAt(0) ?? user?.firstName?.charAt(0) ?? <User className="w-8 h-8" />}</div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-colors"
              data-testid="button-change-photo"
            >
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} data-testid="input-photo-upload" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">{profile?.fullName ?? user?.firstName ?? "Your Name"}</p>
            <p className="text-slate-500 text-sm capitalize">{profile?.role ?? "customer"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-fullname" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g. 08012345678" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-phone" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel>
                    <Select onValueChange={v => { field.onChange(v); form.setValue("city", ""); }} value={field.value ?? ""}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-state"><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                      <SelectContent>{statesResponse?.states.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={!selectedState}>
                      <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 disabled:opacity-50" data-testid="select-city"><SelectValue placeholder="Select city" /></SelectTrigger></FormControl>
                      <SelectContent>{citiesResponse?.cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>I am a</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "customer"}>
                    <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-role"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="rental_owner">Vehicle Rental Owner</SelectItem>
                    </SelectContent>
                  </Select></FormItem>
              )} />
              <Button type="submit" disabled={updateProfile.isPending} className="w-full rounded-xl bg-primary text-white h-11" data-testid="button-save-profile">
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick links */}
      {profile?.role === "driver" && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="font-medium text-slate-900">Manage your driver profile</p>
            <Link href="/driver-dashboard"><Button className="rounded-xl bg-primary text-white" data-testid="button-driver-dashboard">Driver Dashboard</Button></Link>
          </CardContent>
        </Card>
      )}
      {profile?.role === "rental_owner" && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="font-medium text-slate-900">Manage your vehicle listings</p>
            <Link href="/dashboard"><Button className="rounded-xl bg-primary text-white" data-testid="button-my-listings">My Dashboard</Button></Link>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={() => logout()} className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-11" data-testid="button-logout">
        <LogOut className="w-4 h-4 mr-2" />Log Out
      </Button>
    </div>
  );
}
