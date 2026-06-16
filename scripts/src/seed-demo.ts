import { db, usersTable, driversTable, rentalsTable } from "@workspace/db";

const DEMO_USER_ID = "demo-seed-user-001";

const drivers = [
  {
    fullName: "Emeka Okafor", phone: "08012345601", email: "emeka@example.com",
    state: "Lagos", city: "Ikeja", vehicleType: "Taxi Ride",
    vehicleBrand: "Toyota", vehicleModel: "Camry", vehicleColor: "Silver",
    plateNumber: "LND 234 AA", verificationStatus: "approved", isAvailable: true,
    isFeatured: true, averageRating: 4.8, reviewCount: 47,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    fullName: "Chinedu Eze", phone: "08023456702", email: "chinedu@example.com",
    state: "Rivers", city: "Port Harcourt", vehicleType: "Truck Hire",
    vehicleBrand: "Iveco", vehicleModel: "Daily", vehicleColor: "White",
    plateNumber: "Rivers 567 KK", verificationStatus: "approved", isAvailable: true,
    isFeatured: true, averageRating: 4.6, reviewCount: 29,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/44.jpg",
  },
  {
    fullName: "Adaeze Nwosu", phone: "07034567803", email: "adaeze@example.com",
    state: "Anambra", city: "Onitsha", vehicleType: "Keke Ride",
    vehicleBrand: "Bajaj", vehicleModel: "RE", vehicleColor: "Yellow",
    plateNumber: "AN 890 BJ", verificationStatus: "approved", isAvailable: true,
    isFeatured: true, averageRating: 4.9, reviewCount: 63,
    profilePhotoUrl: "https://randomuser.me/api/portraits/women/28.jpg",
  },
  {
    fullName: "Tunde Adeyemi", phone: "09045678904", email: "tunde@example.com",
    state: "Oyo", city: "Ibadan", vehicleType: "Bus Hire",
    vehicleBrand: "Coaster", vehicleModel: "Toyota", vehicleColor: "Blue",
    plateNumber: "OY 123 CD", verificationStatus: "approved", isAvailable: true,
    isFeatured: true, averageRating: 4.5, reviewCount: 18,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/55.jpg",
  },
  {
    fullName: "Blessing Okonkwo", phone: "08056789005", email: "blessing@example.com",
    state: "Delta", city: "Warri", vehicleType: "Delivery Services",
    vehicleBrand: "Yamaha", vehicleModel: "Crux", vehicleColor: "Red",
    plateNumber: "DL 456 EF", verificationStatus: "approved", isAvailable: true,
    isFeatured: false, averageRating: 4.7, reviewCount: 34,
    profilePhotoUrl: "https://randomuser.me/api/portraits/women/36.jpg",
  },
  {
    fullName: "Femi Olawale", phone: "08167890106", email: "femi@example.com",
    state: "Lagos", city: "Lekki", vehicleType: "Car Rental",
    vehicleBrand: "Honda", vehicleModel: "Accord", vehicleColor: "Black",
    plateNumber: "LND 789 GH", verificationStatus: "approved", isAvailable: true,
    isFeatured: true, averageRating: 4.4, reviewCount: 22,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
  },
  {
    fullName: "Ngozi Obiora", phone: "07078901207", email: "ngozi@example.com",
    state: "Enugu", city: "Enugu", vehicleType: "Intercity Transport",
    vehicleBrand: "Ford", vehicleModel: "Transit", vehicleColor: "White",
    plateNumber: "EN 234 IJ", verificationStatus: "approved", isAvailable: false,
    isFeatured: false, averageRating: 4.3, reviewCount: 15,
    profilePhotoUrl: "https://randomuser.me/api/portraits/women/48.jpg",
  },
  {
    fullName: "Kelechi Amadi", phone: "09089012308", email: "kelechi@example.com",
    state: "Rivers", city: "Port Harcourt", vehicleType: "Motorcycle Ride",
    vehicleBrand: "Honda", vehicleModel: "CB150", vehicleColor: "Green",
    plateNumber: "RV 567 KL", verificationStatus: "approved", isAvailable: true,
    isFeatured: false, averageRating: 4.6, reviewCount: 41,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/78.jpg",
  },
  {
    fullName: "Seun Akinola", phone: "08090123409", email: "seun@example.com",
    state: "Osun", city: "Osogbo", vehicleType: "Logistics Services",
    vehicleBrand: "Hyundai", vehicleModel: "H100", vehicleColor: "White",
    plateNumber: "OS 890 MN", verificationStatus: "approved", isAvailable: true,
    isFeatured: false, averageRating: 4.2, reviewCount: 9,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/23.jpg",
  },
  {
    fullName: "Amaka Chisom", phone: "07001234510", email: "amaka@example.com",
    state: "Imo", city: "Owerri", vehicleType: "Taxi Ride",
    vehicleBrand: "Toyota", vehicleModel: "Corolla", vehicleColor: "Gold",
    plateNumber: "IMO 123 OP", verificationStatus: "approved", isAvailable: true,
    isFeatured: true, averageRating: 4.9, reviewCount: 71,
    profilePhotoUrl: "https://randomuser.me/api/portraits/women/59.jpg",
  },
  {
    fullName: "Biodun Fashola", phone: "08112345611", email: "biodun@example.com",
    state: "Ogun", city: "Abeokuta", vehicleType: "Moving Services",
    vehicleBrand: "Mitsubishi", vehicleModel: "L300", vehicleColor: "Blue",
    plateNumber: "OG 456 QR", verificationStatus: "approved", isAvailable: true,
    isFeatured: false, averageRating: 4.5, reviewCount: 26,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/89.jpg",
  },
  {
    fullName: "Uche Onyekwere", phone: "09023456712", email: "uche@example.com",
    state: "Edo", city: "Benin City", vehicleType: "Pickup Hire",
    vehicleBrand: "Toyota", vehicleModel: "Hilux", vehicleColor: "Grey",
    plateNumber: "ED 789 ST", verificationStatus: "approved", isAvailable: true,
    isFeatured: false, averageRating: 4.1, reviewCount: 12,
    profilePhotoUrl: "https://randomuser.me/api/portraits/men/34.jpg",
  },
];

const rentals = [
  {
    ownerName: "Lagos Premium Cars", ownerPhone: "08034560101",
    vehicleName: "Toyota Camry 2021", brand: "Toyota", model: "Camry", year: 2021,
    color: "Pearl White", vehicleType: "Sedan", transmission: "Automatic", fuelType: "Petrol",
    seatingCapacity: 5, plateNumber: "LND 001 XX",
    state: "Lagos", city: "Victoria Island",
    dailyPrice: 25000, weeklyPrice: 150000, monthlyPrice: 500000,
    photoUrls: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600"],
    verificationStatus: "approved", isAvailable: true, isFeatured: true,
    averageRating: 4.7, reviewCount: 23,
  },
  {
    ownerName: "PHC Ride Fleet", ownerPhone: "07045670202",
    vehicleName: "Hyundai Elantra 2020", brand: "Hyundai", model: "Elantra", year: 2020,
    color: "Metallic Grey", vehicleType: "Sedan", transmission: "Automatic", fuelType: "Petrol",
    seatingCapacity: 5, plateNumber: "RV 002 YY",
    state: "Rivers", city: "Port Harcourt",
    dailyPrice: 18000, weeklyPrice: 110000, monthlyPrice: 380000,
    photoUrls: ["https://images.unsplash.com/photo-1619976215249-b85b5a4a2c43?w=600"],
    verificationStatus: "approved", isAvailable: true, isFeatured: true,
    averageRating: 4.5, reviewCount: 17,
  },
  {
    ownerName: "Coaster Bus Hire Ibadan", ownerPhone: "09056780303",
    vehicleName: "Toyota Coaster Bus 2019", brand: "Toyota", model: "Coaster", year: 2019,
    color: "White", vehicleType: "Bus", transmission: "Manual", fuelType: "Diesel",
    seatingCapacity: 28, plateNumber: "OY 003 ZZ",
    state: "Oyo", city: "Ibadan",
    dailyPrice: 65000, weeklyPrice: 390000, monthlyPrice: 1400000,
    photoUrls: ["https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600"],
    verificationStatus: "approved", isAvailable: true, isFeatured: false,
    averageRating: 4.3, reviewCount: 8,
  },
  {
    ownerName: "Delta Wheels", ownerPhone: "08067890404",
    vehicleName: "Ford Ranger 2022", brand: "Ford", model: "Ranger", year: 2022,
    color: "Midnight Black", vehicleType: "Pickup Truck", transmission: "Automatic", fuelType: "Diesel",
    seatingCapacity: 5, plateNumber: "DL 004 AA",
    state: "Delta", city: "Warri",
    dailyPrice: 35000, weeklyPrice: 210000, monthlyPrice: 750000,
    photoUrls: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
    verificationStatus: "approved", isAvailable: true, isFeatured: true,
    averageRating: 4.8, reviewCount: 31,
  },
  {
    ownerName: "Abuja-Enugu Logistics", ownerPhone: "07078900505",
    vehicleName: "Mercedes Sprinter Van 2020", brand: "Mercedes", model: "Sprinter", year: 2020,
    color: "White", vehicleType: "Van", transmission: "Manual", fuelType: "Diesel",
    seatingCapacity: 12, plateNumber: "EN 005 BB",
    state: "Enugu", city: "Enugu",
    dailyPrice: 45000, weeklyPrice: 270000, monthlyPrice: 950000,
    photoUrls: ["https://images.unsplash.com/photo-1567448400815-c54acdc26b42?w=600"],
    verificationStatus: "approved", isAvailable: true, isFeatured: false,
    averageRating: 4.4, reviewCount: 14,
  },
  {
    ownerName: "Anambra Premium Rides", ownerPhone: "09089010606",
    vehicleName: "Lexus RX 350 2019", brand: "Lexus", model: "RX 350", year: 2019,
    color: "Champagne Gold", vehicleType: "SUV", transmission: "Automatic", fuelType: "Petrol",
    seatingCapacity: 5, plateNumber: "AN 006 CC",
    state: "Anambra", city: "Awka",
    dailyPrice: 50000, weeklyPrice: 300000, monthlyPrice: 1100000,
    photoUrls: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600"],
    verificationStatus: "approved", isAvailable: true, isFeatured: true,
    averageRating: 4.9, reviewCount: 38,
  },
];

async function seedDemo() {
  console.log("Seeding demo user...");
  await db.insert(usersTable).values({
    id: DEMO_USER_ID,
    email: "demo@afralink.com",
    firstName: "Demo",
    lastName: "Seed",
    role: "driver",
  }).onConflictDoNothing();

  console.log(`Seeding ${drivers.length} demo drivers...`);
  for (const d of drivers) {
    await db.insert(driversTable).values({ ...d, userId: DEMO_USER_ID }).onConflictDoNothing();
  }

  console.log(`Seeding ${rentals.length} demo rentals...`);
  for (const r of rentals) {
    await db.insert(rentalsTable).values({ ...r, userId: DEMO_USER_ID }).onConflictDoNothing();
  }

  console.log("Demo seed complete.");
  process.exit(0);
}

seedDemo().catch((e) => { console.error(e); process.exit(1); });
