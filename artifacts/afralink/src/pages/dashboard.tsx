import { useListBookings, useUpdateBooking, useGetMyProfile, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { CalendarDays, Car, Users, Loader2, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  const { data: profile } = useGetMyProfile();
  const { data: bookingsData, isLoading } = useListBookings({}, { query: { queryKey: getListBookingsQueryKey({}) } });
  const updateBooking = useUpdateBooking();

  const allBookings = bookingsData?.bookings ?? [];
  const filteredBookings = activeTab === "all" ? allBookings : allBookings.filter(b => b.status === activeTab);

  const cancelBooking = (id: number) => {
    updateBooking.mutate({ id, data: { status: "cancelled" } }, {
      onSuccess: () => { toast({ title: "Booking cancelled" }); qc.invalidateQueries({ queryKey: getListBookingsQueryKey({}) }); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {profile?.fullName || user?.firstName || "there"}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/drivers"><Button variant="outline" className="rounded-xl border-slate-200" data-testid="button-find-driver"><Users className="w-4 h-4 mr-2" />Find a Driver</Button></Link>
          <Link href="/rentals"><Button variant="outline" className="rounded-xl border-slate-200" data-testid="button-browse-rentals"><Car className="w-4 h-4 mr-2" />Browse Rentals</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: allBookings.length, color: "text-primary" },
          { label: "Pending", value: allBookings.filter(b => b.status === "pending").length, color: "text-amber-600" },
          { label: "Active", value: allBookings.filter(b => b.status === "accepted").length, color: "text-blue-600" },
          { label: "Completed", value: allBookings.filter(b => b.status === "completed").length, color: "text-green-600" },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader><CardTitle className="text-xl">My Bookings</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="all" className="rounded-lg" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg" data-testid="tab-pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted" className="rounded-lg" data-testid="tab-active">Active</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg" data-testid="tab-completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No {activeTab === "all" ? "" : activeTab} bookings yet.</p>
                  {activeTab === "all" && <Link href="/drivers"><Button className="mt-4 rounded-xl bg-primary text-white" data-testid="button-book-driver">Book a Driver</Button></Link>}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map(booking => (
                    <div key={booking.id} className="border border-slate-100 rounded-2xl p-4 hover:bg-slate-50 transition-colors" data-testid={`booking-card-${booking.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-slate-900">{booking.serviceType}</span>
                            <Badge className={`text-xs ${STATUS_COLORS[booking.status] ?? ""}`}>{booking.status}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                            <span className="truncate">{booking.pickupLocation}{booking.destination ? ` → ${booking.destination}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(booking.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        {booking.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => cancelBooking(booking.id)} disabled={updateBooking.isPending} className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 flex-shrink-0" data-testid={`button-cancel-booking-${booking.id}`}>
                            {updateBooking.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cancel"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* CTA for drivers */}
      {profile?.role === "customer" && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Are you a driver or vehicle owner?</h3>
              <p className="text-slate-500 text-sm mt-1">Join AfraLink and get more customers today.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/become-driver"><Button className="rounded-xl bg-primary text-white" data-testid="button-become-driver">Become a Driver</Button></Link>
              <Link href="/list-vehicle"><Button variant="outline" className="rounded-xl border-primary/30 text-primary" data-testid="button-list-vehicle">List a Vehicle</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
