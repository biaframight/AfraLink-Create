import { useParams, Link } from "wouter";
import { useGetDriver, useListReviews, useCreateBooking, useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, MapPin, ShieldCheck, Star, Car, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const SERVICE_TYPES = ["Taxi Ride", "Keke Ride", "Motorcycle Ride", "Intercity Transport", "Bus Hire", "Truck Hire", "Pickup Hire", "Van Hire", "Moving Services", "Delivery Services", "Logistics Services"];

const bookingSchema = z.object({
  serviceType: z.string().min(1, "Select a service type"),
  pickupLocation: z.string().min(3, "Enter pickup location"),
  destination: z.string().optional(),
  notes: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onRate(s)} data-testid={`star-rate-${s}`}>
          <Star className={`w-7 h-7 transition-colors ${s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200 hover:fill-yellow-200"}`} />
        </button>
      ))}
    </div>
  );
}

export default function DriverDetail() {
  const { id } = useParams();
  const driverId = Number(id);
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: driver, isLoading, error } = useGetDriver(driverId);
  const { data: reviewsData } = useListReviews({ driverId }, { query: { queryKey: getListReviewsQueryKey({ driverId }) } });

  const createBooking = useCreateBooking();
  const createReview = useCreateReview();

  const bookingForm = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { serviceType: "", pickupLocation: "", destination: "", notes: "" },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const onBookingSubmit = (values: z.infer<typeof bookingSchema>) => {
    if (!isAuthenticated) { login(); return; }
    createBooking.mutate({ data: { ...values, driverId } }, {
      onSuccess: () => { toast({ title: "Request sent!", description: "Your booking request has been submitted." }); bookingForm.reset(); },
      onError: () => toast({ title: "Error", description: "Failed to send request.", variant: "destructive" }),
    });
  };

  const onReviewSubmit = (values: z.infer<typeof reviewSchema>) => {
    if (!isAuthenticated) { login(); return; }
    createReview.mutate({ data: { driverId, rating: values.rating, comment: values.comment } }, {
      onSuccess: () => { toast({ title: "Review submitted!" }); reviewForm.reset({ rating: 0, comment: "" }); qc.invalidateQueries({ queryKey: getListReviewsQueryKey({ driverId }) }); },
      onError: () => toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4"><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /></div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );

  if (error || !driver) return (
    <div className="text-center py-20">
      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Driver not found</h2>
    </div>
  );

  const waLink = driver.phone ? `https://wa.me/234${driver.phone.replace(/^(\+234|0)/, "")}?text=Hi ${encodeURIComponent(driver.fullName)}, I found your profile on AfraLink and would like to book your services.` : null;

  return (
    <div className="space-y-8">
      <Link href="/drivers">
        <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to Drivers
        </Button>
      </Link>
      <Card className="overflow-hidden border-0 shadow-lg bg-white">
        <CardContent className="p-0">
          <div className="h-28 bg-gradient-to-r from-slate-800 to-slate-700" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-md flex-shrink-0">
                {driver.profilePhotoUrl ? (
                  <img src={driver.profilePhotoUrl} alt={driver.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">{driver.fullName.charAt(0)}</div>
                )}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 truncate">{driver.fullName}</h1>
                  {driver.verificationStatus === "approved" && <Badge className="bg-green-50 text-green-700 border-green-200 gap-1"><ShieldCheck className="w-3.5 h-3.5" />Verified</Badge>}
                  {driver.verificationStatus === "pending" && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>}
                  {driver.isAvailable ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Available Now</Badge> : <Badge variant="secondary">Currently Busy</Badge>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
              <span className="flex items-center gap-1.5"><Car className="w-4 h-4 text-primary" />{driver.vehicleType}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{driver.city}, {driver.state}</span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {driver.averageRating ? Number(driver.averageRating).toFixed(1) : "New"} ({driver.reviewCount} reviews)
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {driver.phone && <a href={`tel:${driver.phone}`}><Button variant="outline" className="rounded-xl border-slate-200" data-testid="button-call-driver"><Phone className="w-4 h-4 mr-2" />{driver.phone}</Button></a>}
              {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer"><Button className="rounded-xl bg-green-500 hover:bg-green-600 text-white border-0" data-testid="button-whatsapp-driver">WhatsApp</Button></a>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Vehicle Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              {([["Vehicle Type", driver.vehicleType], ["Brand", driver.vehicleBrand], ["Model", driver.vehicleModel], ["Color", driver.vehicleColor], ["Plate Number", driver.plateNumber]] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label}><p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{label}</p><p className="font-semibold text-slate-900">{value}</p></div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Reviews ({reviewsData?.reviews.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {reviewsData?.reviews.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No reviews yet.</p>
              ) : reviewsData?.reviews.map(review => (
                <div key={review.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 text-sm">{review.reviewerName ?? "Anonymous"}</span>
                    <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex mb-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`} />)}</div>
                  {review.comment && <p className="text-slate-600 text-sm">{review.comment}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Write a Review</CardTitle></CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 mb-3">Log in to leave a review.</p>
                  <Button onClick={() => login()} className="rounded-xl bg-primary text-white" data-testid="button-login-review">Log In</Button>
                </div>
              ) : (
                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                    <FormField control={reviewForm.control} name="rating" render={({ field }) => (
                      <FormItem><FormLabel>Rating</FormLabel><FormControl><StarRating rating={field.value} onRate={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={reviewForm.control} name="comment" render={({ field }) => (
                      <FormItem><FormLabel>Comment (optional)</FormLabel><FormControl><Textarea placeholder="Share your experience..." {...field} className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={3} data-testid="textarea-review-comment" /></FormControl></FormItem>
                    )} />
                    <Button type="submit" disabled={createReview.isPending} className="rounded-xl bg-primary text-white" data-testid="button-submit-review">
                      {createReview.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Submit Review
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-slate-100 shadow-sm sticky top-6">
            <CardHeader><CardTitle className="text-lg">Send a Booking Request</CardTitle></CardHeader>
            <CardContent>
              <Form {...bookingForm}>
                <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-4">
                  <FormField control={bookingForm.control} name="serviceType" render={({ field }) => (
                    <FormItem><FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-slate-200" data-testid="select-service-type"><SelectValue placeholder="Select service..." /></SelectTrigger></FormControl>
                        <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={bookingForm.control} name="pickupLocation" render={({ field }) => (
                    <FormItem><FormLabel>Pickup Location</FormLabel><FormControl><Input placeholder="e.g. Ikeja" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-pickup" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={bookingForm.control} name="destination" render={({ field }) => (
                    <FormItem><FormLabel>Destination (optional)</FormLabel><FormControl><Input placeholder="e.g. Lekki" {...field} className="rounded-xl bg-slate-50 border-slate-200" data-testid="input-destination" /></FormControl></FormItem>
                  )} />
                  <FormField control={bookingForm.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes (optional)</FormLabel><FormControl><Textarea placeholder="Any details..." {...field} className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={3} data-testid="textarea-notes" /></FormControl></FormItem>
                  )} />
                  <Button type="submit" disabled={createBooking.isPending} className="w-full rounded-xl bg-primary text-white h-11" data-testid="button-send-request">
                    {createBooking.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {isAuthenticated ? "Send Request" : "Log In to Book"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
