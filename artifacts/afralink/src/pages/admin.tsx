import { useGetAdminStats, useListPendingDrivers, useListPendingRentals, useApproveDriver, useRejectDriver, useApproveRental, useRejectRental, getGetAdminStatsQueryKey, getListPendingDriversQueryKey, getListPendingRentalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Car, Clock, FileText, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectDriverId, setRejectDriverId] = useState<number | null>(null);
  const [rejectRentalId, setRejectRentalId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: pendingDrivers, isLoading: driversLoading } = useListPendingDrivers();
  const { data: pendingRentals, isLoading: rentalsLoading } = useListPendingRentals();

  const approveDriver = useApproveDriver();
  const rejectDriver = useRejectDriver();
  const approveRental = useApproveRental();
  const rejectRental = useRejectRental();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    qc.invalidateQueries({ queryKey: getListPendingDriversQueryKey() });
    qc.invalidateQueries({ queryKey: getListPendingRentalsQueryKey() });
  };

  const handleApproveDriver = (id: number) => {
    approveDriver.mutate({ id }, {
      onSuccess: () => { toast({ title: "Driver approved" }); invalidateAll(); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  const handleRejectDriver = () => {
    if (!rejectDriverId) return;
    rejectDriver.mutate({ id: rejectDriverId, data: { note: rejectNote } }, {
      onSuccess: () => { toast({ title: "Driver rejected" }); invalidateAll(); setRejectDriverId(null); setRejectNote(""); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  const handleApproveRental = (id: number) => {
    approveRental.mutate({ id }, {
      onSuccess: () => { toast({ title: "Rental approved" }); invalidateAll(); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  const handleRejectRental = () => {
    if (!rejectRentalId) return;
    rejectRental.mutate({ id: rejectRentalId }, {
      onSuccess: () => { toast({ title: "Rental rejected" }); invalidateAll(); setRejectRentalId(null); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  const statCards = [
    { label: "Customers", value: stats?.totalCustomers, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Active Drivers", value: stats?.totalDrivers, icon: ShieldCheck, color: "text-green-600 bg-green-50" },
    { label: "Active Rentals", value: stats?.totalRentals, icon: Car, color: "text-primary bg-primary/10" },
    { label: "Pending Drivers", value: stats?.pendingDrivers, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Pending Rentals", value: stats?.pendingRentals, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { label: "Total Bookings", value: stats?.totalBookings, icon: FileText, color: "text-purple-600 bg-purple-50" },
    { label: "Open Reports", value: stats?.totalReports, icon: AlertCircle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor and manage the AfraLink platform.</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-slate-100 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
                <div><p className="text-2xl font-extrabold text-slate-900">{value ?? 0}</p><p className="text-xs text-slate-500">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Top states chart */}
      {stats?.topStates && stats.topStates.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Top States by Driver Count</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topStates.map(s => ({ name: s.state, count: s.count }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending tables */}
      <Tabs defaultValue="drivers">
        <TabsList className="bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="drivers" className="rounded-lg" data-testid="tab-pending-drivers">
            Pending Drivers {pendingDrivers && pendingDrivers.total > 0 && <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200 text-xs">{pendingDrivers.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="rentals" className="rounded-lg" data-testid="tab-pending-rentals">
            Pending Rentals {pendingRentals && pendingRentals.total > 0 && <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200 text-xs">{pendingRentals.total}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-6">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-0">
              {driversLoading ? <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div> : pendingDrivers?.drivers.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><ShieldCheck className="w-10 h-10 mx-auto mb-3" /><p>No pending driver applications.</p></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingDrivers?.drivers.map(driver => (
                    <div key={driver.id} className="p-4 flex items-start justify-between gap-3" data-testid={`pending-driver-${driver.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{driver.fullName}</p>
                        <p className="text-sm text-slate-500">{driver.vehicleType} • {driver.city}, {driver.state}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Phone: {driver.phone} • {driver.plateNumber && `Plate: ${driver.plateNumber}`}</p>
                        <p className="text-xs text-slate-400">{new Date(driver.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleApproveDriver(driver.id)} disabled={approveDriver.isPending} className="rounded-xl bg-green-500 hover:bg-green-600 text-white border-0 h-8" data-testid={`button-approve-driver-${driver.id}`}>
                          {approveDriver.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRejectDriverId(driver.id); setRejectNote(""); }} className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-8" data-testid={`button-reject-driver-${driver.id}`}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rentals" className="mt-6">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-0">
              {rentalsLoading ? <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div> : pendingRentals?.rentals.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><Car className="w-10 h-10 mx-auto mb-3" /><p>No pending rental listings.</p></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingRentals?.rentals.map(rental => (
                    <div key={rental.id} className="p-4 flex items-start justify-between gap-3" data-testid={`pending-rental-${rental.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{rental.vehicleName}</p>
                        <p className="text-sm text-slate-500">{rental.brand} {rental.model} • {rental.city}, {rental.state}</p>
                        <p className="text-xs text-slate-400 mt-0.5">₦{Number(rental.dailyPrice).toLocaleString()}/day • {rental.ownerPhone}</p>
                        <p className="text-xs text-slate-400">{new Date(rental.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleApproveRental(rental.id)} disabled={approveRental.isPending} className="rounded-xl bg-green-500 hover:bg-green-600 text-white border-0 h-8" data-testid={`button-approve-rental-${rental.id}`}>
                          {approveRental.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectRentalId(rental.id)} className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-8" data-testid={`button-reject-rental-${rental.id}`}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject driver dialog */}
      <Dialog open={rejectDriverId !== null} onOpenChange={(open) => !open && setRejectDriverId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Reject Driver Application</DialogTitle></DialogHeader>
          <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason for rejection (optional)..." className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={4} data-testid="textarea-reject-note" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDriverId(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRejectDriver} disabled={rejectDriver.isPending} className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0" data-testid="button-confirm-reject">
              {rejectDriver.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject rental dialog */}
      <Dialog open={rejectRentalId !== null} onOpenChange={(open) => !open && setRejectRentalId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Reject Rental Listing</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">Are you sure you want to reject this rental listing?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectRentalId(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRejectRental} disabled={rejectRental.isPending} className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0" data-testid="button-confirm-reject-rental">
              {rejectRental.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
