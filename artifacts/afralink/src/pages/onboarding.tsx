import {
  useGetMyProfile,
  useUpdateMyProfile,
  useListStates,
  useListCities,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle, Car, Users, Package } from "lucide-react";

const onboardSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  role: z.enum(["customer", "driver", "rental_owner"]),
  state: z.string().optional(),
  city: z.string().optional(),
});

const ROLES = [
  {
    value: "customer",
    label: "Find transport",
    desc: "I need drivers, rentals or logistics",
    icon: Users,
  },
  {
    value: "driver",
    label: "Offer transport",
    desc: "I'm a driver looking for passengers",
    icon: Car,
  },
  {
    value: "rental_owner",
    label: "Rent my vehicle",
    desc: "I own a car / vehicle for rent",
    icon: Package,
  },
];

export default function Onboarding() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();
  const { data: statesResponse } = useListStates();

  const form = useForm<z.infer<typeof onboardSchema>>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      role: "customer",
      state: "",
      city: "",
    },
  });

  const selectedState = form.watch("state");
  const { data: citiesResponse } = useListCities(
    { state: selectedState ?? "" },
    {
      query: {
        enabled: !!selectedState,
        queryKey: ["cities", selectedState],
      },
    }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  useEffect(() => {
    if (profile) {
      if (profile.phone) {
        setLocation("/");
        return;
      }
      if (profile.fullName) {
        form.setValue("fullName", profile.fullName);
      }
    }
  }, [profile, form, setLocation]);

  const onSubmit = (values: z.infer<typeof onboardSchema>) => {
    updateProfile.mutate(
      { data: values },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          toast({ title: "Welcome to AfraLink!" });
          const role = form.getValues("role");
          if (role === "driver") setLocation("/driver-dashboard");
          else if (role === "rental_owner") setLocation("/list-vehicle");
          else setLocation("/");
        },
        onError: () =>
          toast({ title: "Could not save profile", variant: "destructive" }),
      }
    );
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-primary text-white px-6 pt-14 pb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white">
            A
          </div>
          <span className="font-bold text-lg">AfraLink</span>
        </div>
        <h1 className="text-2xl font-bold">Welcome! 🎉</h1>
        <p className="text-white/70 mt-1 text-sm">
          Let's complete your profile to get started
        </p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Emeka Okafor"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 08012345678"
                      type="tel"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    How will you use AfraLink?
                  </FormLabel>
                  <div className="grid gap-3">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const selected = field.value === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => field.onChange(r.value)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selected
                                ? "bg-primary text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {r.label}
                            </div>
                            <div className="text-slate-500 text-xs">{r.desc}</div>
                          </div>
                          {selected && (
                            <CheckCircle className="w-5 h-5 text-primary ml-auto flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Your State{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statesResponse?.states?.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {selectedState && (
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">City</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select your city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {citiesResponse?.cities?.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full h-13 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
              disabled={updateProfile.isPending}
              style={{ height: "52px" }}
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Complete Setup
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
