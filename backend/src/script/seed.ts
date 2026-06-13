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
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to Database. Starting Seeder...");

    // CLEAR OLD DATA
    await User.deleteMany({});
    await Listing.deleteMany({});
    await Review.deleteMany({});
    await HostApplication.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    console.log("Cleared old data.");

    // =====================================================
    // USERS
    // =====================================================
    const password = await bcrypt.hash("Password123!", await bcrypt.genSalt(10));

    const admin = await User.create({
      email: "admin@stayfinder.com",
      password,
      role: "admin",
      profile: { name: "Admin User" },
    });

    const createdUsers = await User.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        email: faker.internet.email().toLowerCase(),
        password,
        role: i < 3 ? "host" : "user",
        profile: {
          name: faker.person.fullName(),
        },
      })),
    );

    const hosts = createdUsers.filter((u) => u.role === "host");
    const regularUsers = createdUsers.filter((u) => u.role === "user");
    console.log(`Created ${createdUsers.length} users.`);

    // =====================================================
    // HOST APPLICATIONS
    // =====================================================
    const propertyTypes = ["Apartment", "House", "Villa", "Cabin", "Farm Stay"];
    const hostApps = Array.from({ length: 5 }, (_, i) => {
      const status = i < 2 ? "approved" : i < 4 ? "pending" : "rejected";
      return {
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
        ...(status !== "pending"
          ? { reviewedBy: admin._id, reviewedAt: new Date(), adminNote: status === "approved" ? "Welcome!" : "Incomplete documentation" }
          : {}),
      };
    });

    await HostApplication.insertMany(hostApps);
    console.log(`Created ${hostApps.length} host applications.`);

    // =====================================================
    // LISTINGS
    // =====================================================
    const amenitiesList = ["WiFi", "Pool", "AC", "Kitchen", "Parking", "Hot Tub", "Gym"];
    const categories = ["Trending", "Heritage", "Amazing Pools", "Camping", "Tropical", "Mountains", "Bed & Breakfast", "Arctic"];

    const listings = Array.from({ length: 40 }, () => ({
      title: faker.company.catchPhrase() + " Villa",
      description: faker.lorem.paragraphs(2),
      price: faker.number.int({ min: 1500, max: 15000 }),
      category: faker.helpers.arrayElement(categories),
      locationName: `${faker.location.city()}, India`,
      location: {
        type: "Point",
        coordinates: [
          Number(faker.location.longitude({ min: 75.5, max: 76.2 })),
          Number(faker.location.latitude({ min: 26.7, max: 27.2 })),
        ],
      },
      amenities: faker.helpers.arrayElements(amenitiesList, { min: 2, max: 5 }),
      images: Array.from({ length: 5 }, () => faker.image.urlPicsumPhotos()),
      host: faker.helpers.arrayElement(hosts)._id,
      rating: 0,
      numReviews: 0,
      checkInTime: faker.helpers.arrayElement(["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]),
      checkOutTime: faker.helpers.arrayElement(["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"]),
      maxGuests: faker.number.int({ min: 2, max: 16 }),
      cleaningFee: faker.helpers.arrayElement([0, 500, 1000, 1500, 2000]),
      cancellationPolicy: faker.helpers.arrayElement(["flexible", "moderate", "strict"]),
    }));

    const createdListings = await Listing.insertMany(listings);
    console.log(`Created ${createdListings.length} listings.`);

    // =====================================================
    // BOOKINGS (create before reviews so reviews can reference them)
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
    console.log(`Created ${createdBookings.length} bookings.`);

    // =====================================================
    // REVIEWS (links to real bookings for completed/confirmed stays)
    // =====================================================
    const reviewableBookings = createdBookings.filter(
      (b) => b.status === "completed" || b.status === "confirmed",
    );

    const reviews = [];
    for (let i = 0; i < Math.min(40, reviewableBookings.length * 2); i++) {
      const booking = faker.helpers.arrayElement(reviewableBookings);
      const rating = faker.number.int({ min: 3, max: 5 });

      reviews.push({
        user: booking.user,
        listing: booking.listing,
        booking: booking._id,
        rating,
        comment: faker.lorem.sentences(2),
      });
    }

    await Review.insertMany(reviews);
    console.log(`Created ${reviews.length} reviews.`);

    // Update listing ratings based on actual review data
    const listingStats = await Review.aggregate([
      { $group: { _id: "$listing", avgRating: { $avg: "$rating" }, numReviews: { $sum: 1 } } },
    ]);

    for (const stat of listingStats) {
      await Listing.findByIdAndUpdate(stat._id, {
        rating: Math.round(stat.avgRating * 10) / 10,
        numReviews: stat.numReviews,
      });
    }
    console.log("Updated listing ratings from reviews.");

    // =====================================================
    // NOTIFICATIONS
    // =====================================================
    const notifications = [];
    for (const booking of createdBookings) {
      notifications.push(
        {
          user: booking.user,
          type: booking.status === "cancelled" ? "booking_cancelled" : "booking_confirmed",
          title: booking.status === "cancelled" ? "Booking Cancelled" : "Booking Confirmed",
          message: booking.status === "cancelled" ? "Your booking has been cancelled." : "Your stay is confirmed!",
          link: "/trips",
          read: Math.random() > 0.5,
        },
        {
          user: booking.host,
          type: "new_booking",
          title: "New Booking Received",
          message: `You have a new booking!`,
          link: "/host/dashboard",
          read: Math.random() > 0.5,
        },
      );
    }
    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} notifications.`);

    console.log("Database Seeding Complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
