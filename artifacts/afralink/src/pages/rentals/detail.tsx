import { useParams, Link } from "wouter";
import { useGetRental, useListReviews, useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, MapPin, ShieldCheck, Star, Car, AlertCircle, Loader2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const reviewSchema = z.object({ rating: z.number().min(1).max(5), comment: z.string().optional() });

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onRate(s)} data-testid={`star-rate-${s}`}>
          <Star className={`w-7 h-7 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200 hover:fill-yellow-200"}`} />
        </button>
      ))}
    </div>
  );
}

export default function RentalDetail() {
  const { id } = useParams();
  const rentalId = Number(id);
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [photoIdx, setPhotoIdx] = useState(0);

  const { data: rental, isLoading, error } = useGetRental(rentalId);
  const { data: reviewsData } = useListReviews({ rentalId }, { query: { queryKey: getListReviewsQueryKey({ rentalId }) } });
  const createReview = useCreateReview();

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const onReviewSubmit = (values: z.infer<typeof reviewSchema>) => {
    if (!isAuthenticated) { login(); return; }
    createReview.mutate({ data: { rentalId, rating: values.rating, comment: values.comment } }, {
      onSuccess: () => { toast({ title: "Review submitted!" }); reviewForm.reset({ rating: 0, comment: "" }); qc.invalidateQueries({ queryKey: getListReviewsQueryKey({ rentalId }) }); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <div className="space-y-6"><Skeleton className="h-72 w-full rounded-3xl" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-4"><Skeleton className="h-48 w-full rounded-2xl" /></div><Skeleton className="h-64 w-full rounded-2xl" /></div></div>
  );
  if (error || !rental) return (
    <div className="text-center py-20"><AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" /><h2 className="text-xl font-bold">Rental not found</h2></div>
  );

  const photos = rental.photoUrls ?? [];
  const waLink = rental.ownerPhone ? `https://wa.me/234${rental.ownerPhone.replace(/^(\+234|0)/, "")}?text=Hi, I found ${encodeURIComponent(rental.vehicleName)} on AfraLink and I would like to rent it.` : null;

  return (
    <div className="space-y-8">
      <Link href="/rentals">
        <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to Rentals
        </Button>
      </Link>
      {/* Photo gallery */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-100 h-72 md:h-96">
        {photos.length > 0 ? (
          <>
            <img src={photos[photoIdx]} alt={rental.vehicleName} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors" data-testid="button-photo-prev"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors" data-testid="button-photo-next"><ChevronRight className="w-5 h-5" /></button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {photos.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/50"}`} />)}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><Car className="w-24 h-24" /></div>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          {rental.verificationStatus === "approved" && <Badge className="bg-green-500 text-white border-0 gap-1"><ShieldCheck className="w-3.5 h-3.5" />Verified</Badge>}
          {rental.isAvailable ? <Badge className="bg-emerald-500 text-white border-0">Available</Badge> : <Badge className="bg-slate-500 text-white border-0">Unavailable</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-extrabold">{rental.vehicleName}</CardTitle>
                  <p className="text-slate-500 mt-1">{rental.brand} {rental.model} {rental.year ? `• ${rental.year}` : ""}</p>
                </div>
                {rental.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{Number(rental.averageRating).toFixed(1)}</span>
                    <span className="text-slate-400 text-sm">({rental.reviewCount})</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-2"><MapPin className="w-4 h-4 text-primary" />{rental.city}, {rental.state}</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {([["Transmission", rental.transmission], ["Fuel Type", rental.fuelType], ["Seating", rental.seatingCapacity ? `${rental.seatingCapacity} seats` : null], ["Color", rental.color], ["Plate Number", rental.plateNumber], ["Vehicle Type", rental.vehicleType]] as [string, string | number | null | undefined][]).filter(([, v]) => v != null && v !== "").map(([label, value]) => (
                  <div key={label}><p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{label}</p><p className="font-semibold text-slate-900">{value}</p></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Reviews ({reviewsData?.reviews.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {reviewsData?.reviews.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No reviews yet.</p> : reviewsData?.reviews.map(review => (
                <div key={review.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{review.reviewerName ?? "Anonymous"}</span>
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
                <div className="text-center py-4"><p className="text-slate-500 mb-3">Log in to leave a review.</p><Button onClick={() => login()} className="rounded-xl bg-primary text-white" data-testid="button-login-review">Log In</Button></div>
              ) : (
                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                    <FormField control={reviewForm.control} name="rating" render={({ field }) => (
                      <FormItem><FormLabel>Rating</FormLabel><FormControl><StarRating rating={field.value} onRate={field.onChange} /></FormControl></FormItem>
                    )} />
                    <FormField control={reviewForm.control} name="comment" render={({ field }) => (
                      <FormItem><FormLabel>Comment (optional)</FormLabel><FormControl><Textarea placeholder="Share your experience..." {...field} className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={3} data-testid="textarea-review" /></FormControl></FormItem>
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
            <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center"><span className="text-slate-600">Daily</span><span className="font-bold text-xl text-primary">₦{Number(rental.dailyPrice).toLocaleString()}</span></div>
                {rental.weeklyPrice && <div className="flex justify-between items-center"><span className="text-slate-600">Weekly</span><span className="font-semibold">₦{Number(rental.weeklyPrice).toLocaleString()}</span></div>}
                {rental.monthlyPrice && <div className="flex justify-between items-center"><span className="text-slate-600">Monthly</span><span className="font-semibold">₦{Number(rental.monthlyPrice).toLocaleString()}</span></div>}
              </div>
              {rental.ownerName && <p className="text-sm text-slate-600"><span className="font-medium">Owner:</span> {rental.ownerName}</p>}
              <div className="flex flex-col gap-3">
                {rental.ownerPhone && (
                  <>
                    <a href={`tel:${rental.ownerPhone}`}><Button variant="outline" className="w-full rounded-xl border-slate-200" data-testid="button-call-owner"><Phone className="w-4 h-4 mr-2" />{rental.ownerPhone}</Button></a>
                    {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer"><Button className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white border-0" data-testid="button-whatsapp-owner">WhatsApp Owner</Button></a>}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
