import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import ServiceCategory from "./models/ServiceCategory.js";
import ServiceProviderProfile from "./models/ServiceProvider.js";

dotenv.config();

const CATEGORIES = [
  { name: "Electrician", description: "Wiring, switchboards, fans, MCBs, and inverter repairs" },
  { name: "Plumber", description: "Pipe leaks, tap fitting, geysers, and bathroom plumbing" },
  { name: "Carpenter", description: "Door locks, modular hinges, furniture repair, and woodwork" },
  { name: "AC Repair", description: "Split/window AC servicing, gas refill, and cooling diagnostics" },
  { name: "Cleaner", description: "Deep home cleaning, sofa/carpet care, and kitchen sanitization" },
  { name: "Beautician", description: "At-home facials, waxing, manicure/pedicure, and makeup" },
  { name: "Painter", description: "Interior/exterior wall painting, putty, and damp proofing" },
  { name: "Appliance Repair", description: "Washing machine, refrigerator, microwave, and RO servicing" },
];

const DEFAULT_AVAILABILITY = [
  { day: "Monday", startTime: "09:00", endTime: "18:00" },
  { day: "Tuesday", startTime: "09:00", endTime: "18:00" },
  { day: "Wednesday", startTime: "09:00", endTime: "18:00" },
  { day: "Thursday", startTime: "09:00", endTime: "18:00" },
  { day: "Friday", startTime: "09:00", endTime: "18:00" },
  { day: "Saturday", startTime: "10:00", endTime: "16:00" },
];

// 35 distinct portrait URLs so no two providers share an image
const MALE_PORTRAITS = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1557862921-37829c790f19?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1615109398623-88346a601842?w=300&h=300&fit=crop&crop=face",
];

const FEMALE_PORTRAITS = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
];

// GeoJSON coordinates are [longitude, latitude]
// Gorakhpur center reference: [83.3732, 26.7606]
const PROVIDERS_DATA = [
  // --- Gorakhpur (~0 - 3 km) ---
  {
    name: "Ramesh Verma",
    email: "ramesh.verma.demo@smartservice.local",
    phone: "9839000101",
    gender: "M",
    category: "Electrician",
    skills: ["MCB & Fuse Repair", "Ceiling Fan Setup", "Inverter Wiring"],
    experienceYears: 9,
    locationName: "Golghar, Gorakhpur",
    coordinates: [83.3732, 26.7606],
    avgRating: 4.9,
    totalRatings: 34,
    totalBookings: 42,
    completedBookings: 40,
    bayesianScore: 4.72,
  },
  {
    name: "Suresh Prajapati",
    email: "suresh.prajapati.demo@smartservice.local",
    phone: "9839000102",
    gender: "M",
    category: "Plumber",
    skills: ["Leakage Fixing", "Tap & Mixer Fitting", "Water Tank Plumbing"],
    experienceYears: 7,
    locationName: "Civil Lines, Gorakhpur",
    coordinates: [83.3805, 26.7552],
    avgRating: 4.8,
    totalRatings: 25,
    totalBookings: 31,
    completedBookings: 29,
    bayesianScore: 4.58,
  },
  {
    name: "Neha Srivastava",
    email: "neha.srivastava.demo@smartservice.local",
    phone: "9839000103",
    gender: "F",
    category: "Beautician",
    skills: ["De-Tan & Facial", "Waxing & Threading", "Party Makeup"],
    experienceYears: 6,
    locationName: "Betiahata, Gorakhpur",
    coordinates: [83.3680, 26.7665],
    avgRating: 4.9,
    totalRatings: 41,
    totalBookings: 48,
    completedBookings: 46,
    bayesianScore: 4.75,
  },
  {
    name: "Ankit Gupta",
    email: "ankit.gupta.demo@smartservice.local",
    phone: "9839000104",
    gender: "M",
    category: "AC Repair",
    skills: ["Split AC Service", "Gas Charging", "PCB Fault Check"],
    experienceYears: 5,
    locationName: "Bank Road, Gorakhpur",
    coordinates: [83.3765, 26.7580],
    avgRating: 4.6,
    totalRatings: 16,
    totalBookings: 20,
    completedBookings: 18,
    bayesianScore: 4.34,
  },

  // --- Gorakhpur (~3 - 6 km) ---
  {
    name: "Imran Khan",
    email: "imran.khan.demo@smartservice.local",
    phone: "9839000105",
    gender: "M",
    category: "AC Repair",
    skills: ["Jet Pump Servicing", "Compressor Repair", "AC Uninstallation"],
    experienceYears: 10,
    locationName: "Mohaddipur, Gorakhpur",
    coordinates: [83.3985, 26.7510],
    avgRating: 4.8,
    totalRatings: 29,
    totalBookings: 36,
    completedBookings: 34,
    bayesianScore: 4.61,
  },
  {
    name: "Priya Mishra",
    email: "priya.mishra.demo@smartservice.local",
    phone: "9839000106",
    gender: "F",
    category: "Cleaner",
    skills: ["Home Deep Cleaning", "Kitchen Chimney Degrease", "Sofa Cleaning"],
    experienceYears: 4,
    locationName: "Rapti Nagar, Gorakhpur",
    coordinates: [83.3910, 26.7815],
    avgRating: 4.7,
    totalRatings: 18,
    totalBookings: 22,
    completedBookings: 21,
    bayesianScore: 4.44,
  },
  {
    name: "Manoj Vishwakarma",
    email: "manoj.vishwakarma.demo@smartservice.local",
    phone: "9839000107",
    gender: "M",
    category: "Carpenter",
    skills: ["Door Lock & Hinges", "Wardrobe Sliding Track", "Bed & Table Repair"],
    experienceYears: 12,
    locationName: "Gorakhnath, Gorakhpur",
    coordinates: [83.3635, 26.7945],
    avgRating: 4.7,
    totalRatings: 22,
    totalBookings: 27,
    completedBookings: 25,
    bayesianScore: 4.49,
  },
  {
    name: "Kiran Yadav",
    email: "kiran.yadav.demo@smartservice.local",
    phone: "9839000108",
    gender: "F",
    category: "Beautician",
    skills: ["Hair Spa & Blowdry", "Bridal Trial", "Manicure & Pedicure"],
    experienceYears: 5,
    locationName: "Taramandal, Gorakhpur",
    coordinates: [83.3890, 26.7240],
    avgRating: 4.8,
    totalRatings: 21,
    totalBookings: 26,
    completedBookings: 25,
    bayesianScore: 4.55,
  },

  // --- Gorakhpur (~6 - 12 km) ---
  {
    name: "Deepak Maurya",
    email: "deepak.maurya.demo@smartservice.local",
    phone: "9839000109",
    gender: "M",
    category: "Appliance Repair",
    skills: ["Washing Machine Service", "Fridge Cooling Fix", "RO Filter Change"],
    experienceYears: 8,
    locationName: "Medical College Road, Gorakhpur",
    coordinates: [83.4120, 26.8090],
    avgRating: 4.5,
    totalRatings: 14,
    totalBookings: 19,
    completedBookings: 17,
    bayesianScore: 4.24,
  },
  {
    name: "Arjun Nishad",
    email: "arjun.nishad.demo@smartservice.local",
    phone: "9839000110",
    gender: "M",
    category: "Painter",
    skills: ["Interior Emulsion", "Wall Putty & Primer", "Damp Patch Repair"],
    experienceYears: 11,
    locationName: "Khorabar, Gorakhpur",
    coordinates: [83.4480, 26.7260],
    avgRating: 4.6,
    totalRatings: 15,
    totalBookings: 18,
    completedBookings: 16,
    bayesianScore: 4.32,
  },
  {
    name: "Sunita Chauhan",
    email: "sunita.chauhan.demo@smartservice.local",
    phone: "9839000111",
    gender: "F",
    category: "Cleaner",
    skills: ["Bathroom Deep Sanitize", "Balcony & Window Wash", "Move-In Cleaning"],
    experienceYears: 3,
    locationName: "Rustampur, Gorakhpur",
    coordinates: [83.3620, 26.7180],
    avgRating: 4.4,
    totalRatings: 9,
    totalBookings: 12,
    completedBookings: 11,
    bayesianScore: 4.08,
  },
  {
    name: "Rakesh Tiwari",
    email: "rakesh.tiwari.demo@smartservice.local",
    phone: "9839000112",
    gender: "M",
    category: "Plumber",
    skills: ["Geyser Installation", "Submersible Motor Check", "Drainage Clearing"],
    experienceYears: 9,
    locationName: "Chargawan, Gorakhpur",
    coordinates: [83.3880, 26.8280],
    avgRating: 4.6,
    totalRatings: 13,
    totalBookings: 16,
    completedBookings: 15,
    bayesianScore: 4.29,
  },

  // --- Gorakhpur Outer (~15 - 22 km) ---
  {
    name: "Vikram Yadav",
    email: "vikram.yadav.demo@smartservice.local",
    phone: "9839000113",
    gender: "M",
    category: "Electrician",
    skills: ["House Rewiring", "Distribution Board", "Earthing Inspection"],
    experienceYears: 7,
    locationName: "Sahjanwa, Gorakhpur",
    coordinates: [83.2050, 26.7530],
    avgRating: 4.3,
    totalRatings: 8,
    totalBookings: 11,
    completedBookings: 10,
    bayesianScore: 3.99,
  },
  {
    name: "Dinesh Sharma",
    email: "dinesh.sharma.demo@smartservice.local",
    phone: "9839000114",
    gender: "M",
    category: "Carpenter",
    skills: ["Wooden Window Frames", "Curtain Rod Fitting", "Cabinet Alignment"],
    experienceYears: 8,
    locationName: "Pipraich, Gorakhpur",
    coordinates: [83.5350, 26.8350],
    avgRating: 4.2,
    totalRatings: 6,
    totalBookings: 8,
    completedBookings: 7,
    bayesianScore: 3.88,
  },

  // --- Lucknow ---
  {
    name: "Kavita Verma",
    email: "kavita.lko.demo@smartservice.local",
    phone: "9839000115",
    gender: "F",
    category: "Beautician",
    skills: ["Gold Facial", "Full Body Waxing", "Engagement Makeup"],
    experienceYears: 7,
    locationName: "Gomti Nagar, Lucknow",
    coordinates: [80.9960, 26.8467],
    avgRating: 4.9,
    totalRatings: 37,
    totalBookings: 44,
    completedBookings: 42,
    bayesianScore: 4.73,
  },
  {
    name: "Farhan Siddiqui",
    email: "farhan.lko.demo@smartservice.local",
    phone: "9839000116",
    gender: "M",
    category: "AC Repair",
    skills: ["Cassette & Split AC", "Gas Leak Sealing", "Seasonal Tune-Up"],
    experienceYears: 8,
    locationName: "Hazratganj, Lucknow",
    coordinates: [80.9462, 26.8467],
    avgRating: 4.7,
    totalRatings: 20,
    totalBookings: 25,
    completedBookings: 23,
    bayesianScore: 4.46,
  },
  {
    name: "Prashant Dixit",
    email: "prashant.lko.demo@smartservice.local",
    phone: "9839000117",
    gender: "M",
    category: "Electrician",
    skills: ["Smart Switchboard", "Stabilizer & UPS", "Lighting Layout"],
    experienceYears: 6,
    locationName: "Aliganj, Lucknow",
    coordinates: [80.9420, 26.8920],
    avgRating: 4.6,
    totalRatings: 15,
    totalBookings: 19,
    completedBookings: 17,
    bayesianScore: 4.32,
  },
  {
    name: "Meenakshi Joshi",
    email: "meenakshi.lko.demo@smartservice.local",
    phone: "9839000118",
    gender: "F",
    category: "Cleaner",
    skills: ["Villa Deep Cleaning", "Mattress Vacuuming", "Pantry Organization"],
    experienceYears: 5,
    locationName: "Indira Nagar, Lucknow",
    coordinates: [80.9990, 26.8780],
    avgRating: 4.8,
    totalRatings: 23,
    totalBookings: 28,
    completedBookings: 27,
    bayesianScore: 4.57,
  },

  // --- Varanasi ---
  {
    name: "Alok Dubey",
    email: "alok.vns.demo@smartservice.local",
    phone: "9839000119",
    gender: "M",
    category: "Plumber",
    skills: ["Concealed Pipework", "Solar Water Heater", "Valve Replacement"],
    experienceYears: 9,
    locationName: "Lanka, Varanasi",
    coordinates: [82.9990, 25.2820],
    avgRating: 4.8,
    totalRatings: 24,
    totalBookings: 30,
    completedBookings: 28,
    bayesianScore: 4.58,
  },
  {
    name: "Santosh Pandey",
    email: "santosh.vns.demo@smartservice.local",
    phone: "9839000120",
    gender: "M",
    category: "Painter",
    skills: ["Texture & Stencil", "Exterior Weather Coat", "Wood Polish"],
    experienceYears: 10,
    locationName: "Sigra, Varanasi",
    coordinates: [82.9890, 25.3170],
    avgRating: 4.6,
    totalRatings: 17,
    totalBookings: 21,
    completedBookings: 19,
    bayesianScore: 4.36,
  },
  {
    name: "Anjali Singh",
    email: "anjali.vns.demo@smartservice.local",
    phone: "9839000121",
    gender: "F",
    category: "Beautician",
    skills: ["Bridal Package", "Keratin Care", "Cleanup & Glow"],
    experienceYears: 6,
    locationName: "Mahmoorganj, Varanasi",
    coordinates: [82.9760, 25.3080],
    avgRating: 4.7,
    totalRatings: 19,
    totalBookings: 24,
    completedBookings: 22,
    bayesianScore: 4.45,
  },

  // --- Noida & Bengaluru ---
  {
    name: "Rohit Rathore",
    email: "rohit.noida.demo@smartservice.local",
    phone: "9839000122",
    gender: "M",
    category: "Appliance Repair",
    skills: ["Front-Load Washer", "Side-by-Side Fridge", "Microwave Magnetron"],
    experienceYears: 7,
    locationName: "Sector 62, Noida",
    coordinates: [77.3649, 28.6270],
    avgRating: 4.7,
    totalRatings: 21,
    totalBookings: 26,
    completedBookings: 24,
    bayesianScore: 4.48,
  },
  {
    name: "Gaurav Tomar",
    email: "gaurav.noida.demo@smartservice.local",
    phone: "9839000123",
    gender: "M",
    category: "Carpenter",
    skills: ["Modular Kitchen", "TV Unit Mounting", "Channel & Hinge Fix"],
    experienceYears: 8,
    locationName: "Sector 18, Noida",
    coordinates: [77.3260, 28.5708],
    avgRating: 4.6,
    totalRatings: 16,
    totalBookings: 20,
    completedBookings: 18,
    bayesianScore: 4.34,
  },
  {
    name: "Nandini Rao",
    email: "nandini.noida.demo@smartservice.local",
    phone: "9839000124",
    gender: "F",
    category: "Cleaner",
    skills: ["Apartment Deep Clean", "Steam Sofa Sanitize", "Kitchen Slab Care"],
    experienceYears: 5,
    locationName: "Indirapuram, Ghaziabad",
    coordinates: [77.3714, 28.6418],
    avgRating: 4.8,
    totalRatings: 24,
    totalBookings: 29,
    completedBookings: 28,
    bayesianScore: 4.59,
  },
  {
    name: "Karthik Nair",
    email: "karthik.blr.demo@smartservice.local",
    phone: "9839000125",
    gender: "M",
    category: "AC Repair",
    skills: ["Inverter AC Service", "Copper Pipe Weld", "Cooling Coil Clean"],
    experienceYears: 9,
    locationName: "Indiranagar, Bengaluru",
    coordinates: [77.6412, 12.9784],
    avgRating: 4.9,
    totalRatings: 38,
    totalBookings: 45,
    completedBookings: 43,
    bayesianScore: 4.74,
  },
  {
    name: "Divya Menon",
    email: "divya.blr.demo@smartservice.local",
    phone: "9839000126",
    gender: "F",
    category: "Beautician",
    skills: ["Organic Facial", "Threading & Wax", "Event Makeover"],
    experienceYears: 6,
    locationName: "Koramangala, Bengaluru",
    coordinates: [77.6245, 12.9352],
    avgRating: 4.8,
    totalRatings: 27,
    totalBookings: 33,
    completedBookings: 31,
    bayesianScore: 4.61,
  },
  {
    name: "Harish Gowda",
    email: "harish.blr.demo@smartservice.local",
    phone: "9839000127",
    gender: "M",
    category: "Plumber",
    skills: ["Pressure Pump Fix", "Bath Fitting", "Leakage Detection"],
    experienceYears: 7,
    locationName: "Whitefield, Bengaluru",
    coordinates: [77.7500, 12.9698],
    avgRating: 4.6,
    totalRatings: 15,
    totalBookings: 19,
    completedBookings: 17,
    bayesianScore: 4.32,
  },
  {
    name: "Siddharth Kulkarni",
    email: "siddharth.blr.demo@smartservice.local",
    phone: "9839000128",
    gender: "M",
    category: "Electrician",
    skills: ["EV Charger Point", "MCB Trip Fix", "Fan & Light Setup"],
    experienceYears: 8,
    locationName: "HSR Layout, Bengaluru",
    coordinates: [77.6387, 12.9116],
    avgRating: 4.7,
    totalRatings: 20,
    totalBookings: 24,
    completedBookings: 22,
    bayesianScore: 4.46,
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("Missing MONGO_URL in .env");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    const categoryMap = new Map();
    for (const cat of CATEGORIES) {
      const updated = await ServiceCategory.findOneAndUpdate(
        { name: cat.name },
        { $set: { name: cat.name, description: cat.description, isActive: true } },
        { upsert: true, new: true }
      );
      categoryMap.set(cat.name, updated._id);
    }
    console.log(`Synced ${categoryMap.size} categories.`);

    const hashedPassword = await bcrypt.hash("DemoPass@123", 10);
    let maleIdx = 0;
    let femaleIdx = 0;

    for (const p of PROVIDERS_DATA) {
      const portrait =
        p.gender === "F"
          ? FEMALE_PORTRAITS[femaleIdx++ % FEMALE_PORTRAITS.length]
          : MALE_PORTRAITS[maleIdx++ % MALE_PORTRAITS.length];

      const user = await User.findOneAndUpdate(
        { phone: p.phone },
        {
          $set: {
            name: p.name,
            email: p.email,
            phone: p.phone,
            password: hashedPassword,
            role: "provider",
            isActive: true,
            location: {
              type: "Point",
              coordinates: p.coordinates,
            },
            locationName: p.locationName,
          },
        },
        { upsert: true, new: true }
      );

      const categoryId = categoryMap.get(p.category);

      await ServiceProviderProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            aadhaarImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&fit=crop",
            profilePicture: portrait,
            certificates: [
              "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&fit=crop",
            ],
            isVerified: true,
            verifiedByAdmin: true,
            telephonicVerified: true,
            servicesOffered: [categoryId],
            availability: DEFAULT_AVAILABILITY,
            experienceYears: p.experienceYears,
            skills: p.skills,
            location: {
              type: "Point",
              coordinates: p.coordinates,
            },
            locationName: p.locationName,
            avgRating: p.avgRating,
            totalRatings: p.totalRatings,
            totalBookings: p.totalBookings,
            completedBookings: p.completedBookings,
            bayesianScore: p.bayesianScore,
            qualityScore: Number((p.avgRating * 0.2).toFixed(2)),
            recommendationScore: Number((p.bayesianScore * 20).toFixed(1)),
          },
        },
        { upsert: true, new: true }
      );
    }

    // Deduplicate profile pictures across any older pre-existing providers
    const allProfiles = await ServiceProviderProfile.find({}).populate("userId", "name");
    const seenUrls = new Set();
    let updatedOlder = 0;

    for (const prof of allProfiles) {
      const currentPic = prof.profilePicture || "";
      // Preserve custom uploaded base64 avatars (like Uditi Gupta's uploaded image)
      if (currentPic.startsWith("data:")) continue;

      const isMissingOrDefault =
        !currentPic || currentPic === "default_pic_url" || !currentPic.startsWith("http");

      if (isMissingOrDefault || seenUrls.has(currentPic)) {
        const nextUnique =
          MALE_PORTRAITS[maleIdx++ % MALE_PORTRAITS.length] ||
          FEMALE_PORTRAITS[femaleIdx++ % FEMALE_PORTRAITS.length];
        prof.profilePicture = nextUnique;
        await prof.save();
        seenUrls.add(nextUnique);
        updatedOlder += 1;
      } else {
        seenUrls.add(currentPic);
      }
    }

    console.log(
      `Seeded ${PROVIDERS_DATA.length} verified providers and refreshed ${updatedOlder} older provider images so every card has a unique photo.`
    );
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed providers:", err);
    process.exit(1);
  }
}

seed();