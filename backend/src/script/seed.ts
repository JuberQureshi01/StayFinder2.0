import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import User from "../modules/user/user.model";
import Listing from "../modules/listing/listing.model";
import Review from "../modules/review/review.model";
import HostApplication from "../modules/host-application/host-application.model";
import Booking from "../modules/booking/booking.model";
import Notification from "../modules/notification/notification.model";

dotenv.config();

const seedDatabase = async () => {
  try {
    // DATABASE CONNECTION
    await mongoose.connect(process.env.MONGO_URI as string);

    console.log("🌱 Connected to Database. Starting Seeder...");

    // CLEAR OLD DATA
    await User.deleteMany({});
    await Listing.deleteMany({});
    await Review.deleteMany({});
    await HostApplication.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});

    console.log("🧹 Cleared old data.");

    // PASSWORD HASHING
    const salt = await bcrypt.genSalt(10);

    const password = await bcrypt.hash("Password123!", salt);

    // =====================================================
    // CREATE ADMIN
    // =====================================================
    await User.create({
      email: "admin@stayfinder.com",
      password,
      role: "admin",
      profile: { name: "Admin" },
    });

    // =====================================================
    // CREATE USERS
    // =====================================================

    const users = [];

    for (let i = 0; i < 10; i++) {
      users.push({
        email: faker.internet.email().toLowerCase(),

        password,

        role: i < 3 ? "host" : "user",

        profile: {
          name: faker.person.fullName(),

          bio: faker.person.bio(),
        },
      });
    }

    const createdUsers = await User.insertMany(users);

    const hosts = createdUsers.filter((u) => u.role === "host");

    const regularUsers = createdUsers.filter((u) => u.role === "user");

    console.log("👤 Created 10 users.");

    // =====================================================
    // CREATE HOST APPLICATIONS
    // =====================================================

    const adminUser = await User.findOne({ role: "admin" });
    const propertyTypes = ["Apartment", "House", "Villa", "Cabin", "Farm Stay"];

    const hostApps = [];
    for (let i = 0; i < 5; i++) {
      const status = i < 2 ? "approved" : i < 4 ? "pending" : "rejected";
      hostApps.push({
        user: faker.helpers.arrayElement(hosts)._id,
        fullName: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: "Rajasthan",
        propertyType: faker.helpers.arrayElement(propertyTypes),
        reason: faker.lorem.paragraph(),
        status,
        ...(adminUser && status !== "pending" ? { reviewedBy: adminUser._id, reviewedAt: new Date(), adminNote: status === "approved" ? "Welcome to StayFinder!" : "Incomplete documentation" } : {}),
      });
    }
    await HostApplication.insertMany(hostApps);
    console.log("📋 Created 5 host applications.");

    // =====================================================
    // CREATE LISTINGS
    // =====================================================

    const listings = [];

    const amenitiesList = [
      "WiFi",
      "Pool",
      "AC",
      "Kitchen",
      "Parking",
      "Hot Tub",
      "Gym",
    ];

    for (let i = 0; i < 40; i++) {
      const lng = Number(
        faker.location.longitude({
          min: 75.5,
          max: 76.2,
        }),
      );

      const lat = Number(
        faker.location.latitude({
          min: 26.7,
          max: 27.2,
        }),
      );

      listings.push({
        title: faker.company.catchPhrase() + " Villa",

        description: faker.lorem.paragraphs(2),

        price: faker.number.int({
          min: 1500,
          max: 15000,
        }),
        category: faker.helpers.arrayElement([
          "Trending",
          "Heritage",
          "Amazing Pools",
          "Camping",
          "Tropical",
          "Mountains",
          "Bed & Breakfast",
          "Arctic",
        ]),
        locationName: `${faker.location.city()}, India`,
        location: {
          type: "Point",

          coordinates: [lng, lat],
        },

        amenities: faker.helpers.arrayElements(amenitiesList, {
          min: 2,
          max: 5,
        }),

        images: [
          faker.image.urlPicsumPhotos(),
          faker.image.urlPicsumPhotos(),
          faker.image.urlPicsumPhotos(),
          faker.image.urlPicsumPhotos(),
          faker.image.urlPicsumPhotos(),
        ],

        host: faker.helpers.arrayElement(hosts)._id,

        rating: 0,
        numReviews: 0,

        checkInTime: faker.helpers.arrayElement([
          "12:00 PM",
          "1:00 PM",
          "2:00 PM",
          "3:00 PM",
          "4:00 PM",
        ]),
        checkOutTime: faker.helpers.arrayElement([
          "8:00 AM",
          "9:00 AM",
          "10:00 AM",
          "11:00 AM",
          "12:00 PM",
        ]),
        maxGuests: faker.number.int({ min: 2, max: 16 }),
        cleaningFee: faker.helpers.arrayElement([0, 500, 1000, 1500, 2000]),
        cancellationPolicy: faker.helpers.arrayElement([
          "flexible",
          "moderate",
          "strict",
        ]),
      });
    }

    const createdListings = await Listing.insertMany(listings);

    console.log("🏨 Created 40 property listings.");

    // =====================================================
    // CREATE REVIEWS
    // =====================================================

    const reviews = [];

    for (let i = 0; i < 40; i++) {
      const targetListing = faker.helpers.arrayElement(createdListings);

      const rating = faker.number.int({
        min: 3,
        max: 5,
      });

      reviews.push({
        user: faker.helpers.arrayElement(regularUsers)._id,

        listing: targetListing._id,

        // REQUIRED FIELD FIX
        booking: new mongoose.Types.ObjectId(),

        rating,

        comment: faker.lorem.sentences(2),
      });

      // UPDATE RATING
      targetListing.rating =
        (targetListing.rating * targetListing.numReviews + rating) /
        (targetListing.numReviews + 1);

      targetListing.numReviews += 1;
    }

    await Review.insertMany(reviews);

    // SAVE UPDATED RATING DATA
    for (const listing of createdListings) {
      await Listing.findByIdAndUpdate(listing._id, {
        rating: listing.rating,

        numReviews: listing.numReviews,
      });
    }

    console.log("⭐ Created 40 reviews.");

    // =====================================================
    // CREATE BOOKINGS
    // =====================================================

    const bookings = [];
    for (let i = 0; i < 20; i++) {
      const listing = faker.helpers.arrayElement(createdListings);
      const guest = faker.helpers.arrayElement(regularUsers);
      const nights = faker.number.int({ min: 1, max: 7 });
      const checkIn = faker.date.between({ from: new Date("2026-05-01"), to: new Date("2026-07-30") });
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);
      const totalPrice = listing.price * nights;
      const status = i < 8 ? "confirmed" : i < 14 ? "completed" : i < 18 ? "cancelled" : "pending";

      bookings.push({
        user: guest._id,
        host: listing.host,
        listing: listing._id,
        checkIn,
        checkOut,
        totalPrice,
        status,
        ...(status !== "pending" ? { razorpayOrderId: faker.string.alphanumeric(20), razorpayPaymentId: faker.string.alphanumeric(20) } : {}),
        ...(status === "cancelled" ? { cancellationReason: "Change of plans", refunded: false } : {}),
      });
    }
    const createdBookings = await Booking.insertMany(bookings);
    console.log("📅 Created 20 bookings.");

    // =====================================================
    // CREATE NOTIFICATIONS
    // =====================================================

    const notifications = [];
    for (const booking of createdBookings) {
      notifications.push({
        user: booking.user,
        type: booking.status === "cancelled" ? "booking_cancelled" : "booking_confirmed",
        title: booking.status === "cancelled" ? "Booking Cancelled" : "Booking Confirmed",
        message: booking.status === "cancelled" ? "Your booking has been cancelled." : `Your stay is confirmed!`,
        link: "/trips",
        read: Math.random() > 0.5,
      });
      notifications.push({
        user: booking.host,
        type: "new_booking",
        title: "New Booking Received",
        message: `You have a new booking for listing ${faker.person.fullName()}`,
        link: "/host/dashboard",
        read: Math.random() > 0.5,
      });
    }
    await Notification.insertMany(notifications);
    console.log("🔔 Created notifications.");

    console.log("✅ Database Seeding Complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);

    process.exit(1);
  }
};

seedDatabase();

//   "scripts": {
//     "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
//     "build": "tsc",
//     "start": "node dist/server.js",
//     "seed": "ts-node src/script/seed.ts"
//   },
