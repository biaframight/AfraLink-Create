import { useGetMyDriver, useListBookings, useUpdateBooking, useUpdateDriver, getListBookingsQueryKey, getGetMyDriverQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShieldCheck, AlertCircle, CheckCircle, Clock, MapPin, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DriverDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: driver, isLoading: driverLoading, error: driverError } = useGetMyDriver();
  const { data: bookingsData, isLoading: bookingsLoading } = useListBookings(
    { role: "driver" },
    { query: { enabled: !!driver, queryKey: getListBookingsQueryKey({ role: "driver" }) } }
  );
  const updateBooking = useUpdateBooking();
  const updateDriver = useUpdateDriver();

  const handleStatusUpdate = (id: number, status: string) => {
    updateBooking.mutate({ id, data: { status: status as any } }, {
      onSuccess: () => { toast({ title: `Request ${status}` }); qc.invalidateQueries({ queryKey: getListBookingsQueryKey({ role: "driver" }) }); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  const toggleAvailability = () => {
    if (!driver) return;
    updateDriver.mutate({ id: driver.id, data: { isAvailable: !driver.isAvailable } }, {
      onSuccess: () => { toast({ title: `You are now ${!driver.isAvailable ? "available" : "unavailable"}` }); qc.invalidateQueries({ queryKey: getGetMyDriverQueryKey() }); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  if (driverLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );

  if (driverError || !driver) return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Driver Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage your transport business on AfraLink.</p>
      </div>
      <Card className="border-dashed border-2 border-slate-200 text-center">
        <CardContent className="py-16">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No driver profile yet</h2>
          <p className="text-slate-500 mb-6">Register as a driver to start receiving booking requests from customers across Southern Nigeria.</p>
          <Link href="/become-driver"><Button className="rounded-xl bg-primary text-white px-8 h-11" data-testid="button-register-driver">Register as a Driver</Button></Link>
        </CardContent>
      </Card>
    </div>
  );

  const pendingBookings = bookingsData?.bookings.filter(b => b.status === "pending") ?? [];
  const activeBookings = bookingsData?.bookings.filter(b => b.status === "accepted") ?? [];
  const completedBookings = bookingsData?.bookings.filter(b => b.status === "completed") ?? [];

  const completeness = [
    { label: "Profile photo", done: !!driver.profilePhotoUrl },
    { label: "Vehicle photo", done: !!driver.vehiclePhotoUrl },
    { label: "NIN number", done: !!driver.ninNumber },
    { label: "NIN slip", done: !!driver.ninSlipUrl },
    { label: "Selfie", done: !!driver.selfieUrl },
    { label: "Phone number", done: !!driver.phone },
  ];
  const completenessScore = completeness.filter(c => c.done).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Driver Dashboard</h1>
          <p className="text-slate-500 mt-1">Hello, {driver.fullName}</p>
        </div>
        <Button
          onClick={toggleAvailability}
          disabled={updateDriver.isPending}
          variant={driver.isAvailable ? "default" : "outline"}
          className={`rounded-xl h-11 px-6 ${driver.isAvailable ? "bg-emerald-500 hover:bg-emerald-600 border-0 text-white" : "border-slate-200 text-slate-600"}`}
          data-testid="button-toggle-availability"
        >
          {updateDriver.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : driver.isAvailable ? <ToggleRight className="w-5 h-5 mr-2" /> : <ToggleLeft className="w-5 h-5 mr-2" />}
          {driver.isAvailable ? "Available" : "Unavailable"}
        </Button>
      </div>

      {/* Verification status banner */}
      {driver.verificationStatus === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Profile Under Review</p>
            <p className="text-amber-700 text-sm mt-0.5">Our team is reviewing your documents. This typically takes 1-2 business days.</p>
          </div>
        </div>
      )}
      {driver.verificationStatus === "approved" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="font-semibold text-green-800">Your profile is verified and live on AfraLink</p>
        </div>
      )}
      {driver.verificationStatus === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Verification Rejected</p>
            {driver.rejectionNote && <p className="text-red-600 text-sm mt-0.5">{driver.rejectionNote}</p>}
            <Link href="/become-driver"><Button variant="link" className="px-0 text-red-600 h-auto mt-1" data-testid="button-reapply">Re-apply</Button></Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Requests", value: pendingBookings.length, color: "text-amber-600" },
          { label: "Active Trips", value: activeBookings.length, color: "text-blue-600" },
          { label: "Completed", value: completedBookings.length, color: "text-green-600" },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-100 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Incoming requests */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader><CardTitle className="text-xl">Incoming Requests {pendingBookings.length > 0 && <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200">{pendingBookings.length}</Badge>}</CardTitle></CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No pending requests right now.</p>
              {!driver.isAvailable && <p className="text-sm text-slate-400 mt-1">Turn on availability to start receiving requests.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="border border-slate-100 rounded-2xl p-4" data-testid={`booking-request-${booking.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{booking.serviceType}</p>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{booking.pickupLocation}{booking.destination ? ` → ${booking.destination}` : ""}</span>
                      </div>
                      {booking.notes && <p className="text-xs text-slate-400 mt-1 italic">"{booking.notes}"</p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(booking.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => handleStatusUpdate(booking.id, "accepted")} disabled={updateBooking.isPending} className="rounded-xl bg-primary text-white h-8 px-4" data-testid={`button-accept-${booking.id}`}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking.id, "rejected")} disabled={updateBooking.isPending} className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-8 px-4" data-testid={`button-reject-${booking.id}`}>Reject</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile completeness */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Profile Completeness ({completenessScore}/{completeness.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(completenessScore / completeness.length) * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {completeness.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                <span className={item.done ? "text-slate-700" : "text-slate-400"}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
