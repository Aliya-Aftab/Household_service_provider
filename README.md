# SmartService — Full-Stack Household Services Platform

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)

An on-demand home services marketplace bridging homeowners with verified professionals using Bayesian recommendation scoring, role-based access control, and dynamic booking state management.

---

## Table of Contents
* [System Architecture](#system-architecture)
* [Key Engineering Highlights](#key-engineering-highlights)
* [Recommendation Engine](#recommendation-engine)
* [Database Schemas](#database-schemas)
* [REST API Endpoints](#rest-api-endpoints)
* [Role-Based Access Control](#role-based-access-control)
* [Environment Configuration](#environment-configuration)
* [Setup and Installation](#setup-and-installation)
* [End-to-End Testing Flow](#end-to-end-testing-flow)

---

## System Architecture

SmartService runs on a decoupled client-server architecture with live synchronization to MongoDB Atlas:

* **Client Layer (Vercel)**
  * Single Page Application built with React 18 and Vite.
  * Styled with Tailwind CSS and Lucide icons.
  * Real-time metrics visualization using Recharts.
  * Centralized Axios instance with automated Bearer token injection and 401 interceptors.

* **API Engine Layer (Render)**
  * Express.js REST API with CORS protection and JSON body parsing.
  * JWT verification and role-validation middleware guards.
  * Modular routing for users, providers, categories, and bookings.

* **Database Layer (MongoDB Atlas)**
  * Document collections for `users`, `serviceproviderprofiles`, and `bookings`.
  * Referenced models with Mongoose population for relations.

---

## Key Engineering Highlights

* **Decoupled Deployment:** Frontend and backend run independently, connected dynamically through `VITE_API_URL`.
* **State-Preserving Search:** Hero banner search queries sync directly with React Router URL search parameters (`/services?search=Electrician`), enabling shareable filtered URLs.
* **Live Admin Verification:** Provider verification updates persist atomically via `PATCH /api/providers/:id/verify`, updating badges across the app without requiring server restarts.
* **Full Booking Lifecycle:** Bookings support seamless status updates (`pending` -> `confirmed` -> `completed` / `cancelled`) with client-side optimistic UI updates.

---

## Recommendation Engine

To prevent rating manipulation (such as a provider with one 5-star review outranking an experienced technician with 150 reviews averaging 4.8), SmartService computes a Bayesian Weighted Score:
Bayesian Score = [(v * R) + (m * C)] / (v + m)
* **v**: Total number of reviews received by the provider (totalRatings).
* **m**: Minimum review threshold required for statistical confidence (m = 5).
* **R**: Provider average rating (avgRating).
* **C**: Global platform baseline average rating (C = 3.5).

Providers with a **Bayesian Score >= 4.0** are automatically awarded the **Recommended for You** badge across the marketplace.

---

## Database Schemas

### User Model (users)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "provider", "admin"], default: "customer" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}
Provider Profile Model (serviceproviderprofiles)JavaScript{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skills: [{ type: String }],
  experienceYears: { type: Number, default: 1 },
  servicesOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory" }],
  location: { city: String, pincode: String },
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  bayesianScore: { type: Number, default: 0 },
  isRecommended: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verifiedByAdmin: { type: Boolean, default: false }
}
Booking Model (bookings)JavaScript{
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory" },
  bookingDate: { type: Date, required: true },
  timeSlot: { startTime: String, endTime: String },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "completed", "cancelled"], 
    default: "pending" 
  },
  address: { street: String, city: String, pincode: String }
}
REST API EndpointsMethodEndpointAccessFunctionPOST/api/users/registerPublicRegisters a new accountPOST/api/users/loginPublicAuthenticates credentials and returns a JWTGET/api/usersAdminReturns system user recordsGET/api/providersPublicReturns providers with populated category and rating dataGET/api/providers/:idPublicReturns details for an individual providerPATCH/api/providers/:id/verifyAdminToggles provider verification flagsPOST/api/bookingsCustomerCreates a booking entry in pending statusGET/api/bookingsAuthenticatedFetches user-scoped or system-wide bookingsPATCH/api/bookings/:id/statusUser / AdminUpdates booking lifecycle statusRole-Based Access ControlSalted Passwords: Bcrypt hashes all passwords with 10 salt rounds prior to persistence.Route Guards (ProtectedRoute.jsx): Non-admin users attempting to open /admin routes are immediately redirected to /dashboard.Axios Interceptor: Automatically appends Bearer tokens from localStorage to all API requests and wipes expired credentials upon receiving 401 Unauthorized.Environment ConfigurationBackend (backend/.env)Code snippetPORT=5000
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/household_services?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
Frontend (frontend/.env)Code snippetVITE_API_URL=[https://household-service-provider.onrender.com/api](https://household-service-provider.onrender.com/api)
Setup and Installation1. Clone the RepositoryBashgit clone [https://github.com/](https://github.com/)<your-username>/smartservice.git
cd smartservice
2. Configure BackendBashcd backend
npm install
node seedAdmin.js
npm run dev
3. Configure FrontendBashcd ../frontend
npm install
npm run dev
