"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var dotenv_1 = require("dotenv");
var faker_1 = require("@faker-js/faker");
var bcryptjs_1 = require("bcryptjs");
var user_model_1 = require("../modules/user/user.model");
var listing_model_1 = require("../modules/listing/listing.model");
var review_model_1 = require("../modules/review/review.model");
dotenv_1.default.config();
var seedDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var salt, password, users, i, createdUsers, hosts, regularUsers, listings, amenitiesList, i, lng, lat, createdListings, reviews, i, targetListing, rating, _i, createdListings_1, listing, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 15, , 16]);
                // DATABASE CONNECTION
                return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGO_URI)];
            case 1:
                // DATABASE CONNECTION
                _a.sent();
                console.log("🌱 Connected to Database. Starting Seeder...");
                // CLEAR OLD DATA
                return [4 /*yield*/, user_model_1.default.deleteMany({})];
            case 2:
                // CLEAR OLD DATA
                _a.sent();
                return [4 /*yield*/, listing_model_1.default.deleteMany({})];
            case 3:
                _a.sent();
                return [4 /*yield*/, review_model_1.default.deleteMany({})];
            case 4:
                _a.sent();
                console.log("🧹 Cleared old data.");
                return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
            case 5:
                salt = _a.sent();
                return [4 /*yield*/, bcryptjs_1.default.hash("Password123!", salt)];
            case 6:
                password = _a.sent();
                // =====================================================
                // CREATE ADMIN
                // =====================================================
                return [4 /*yield*/, user_model_1.default.create({
                        email: "admin@stayfinder.com",
                        password: password,
                        role: "admin",
                        profile: { name: "Admin" },
                    })];
            case 7:
                // =====================================================
                // CREATE ADMIN
                // =====================================================
                _a.sent();
                users = [];
                for (i = 0; i < 10; i++) {
                    users.push({
                        email: faker_1.faker.internet.email().toLowerCase(),
                        password: password,
                        role: i < 3 ? "host" : "user",
                        profile: {
                            name: faker_1.faker.person.fullName(),
                            bio: faker_1.faker.person.bio(),
                        },
                    });
                }
                return [4 /*yield*/, user_model_1.default.insertMany(users)];
            case 8:
                createdUsers = _a.sent();
                hosts = createdUsers.filter(function (u) { return u.role === "host"; });
                regularUsers = createdUsers.filter(function (u) { return u.role === "user"; });
                console.log("👤 Created 10 users.");
                listings = [];
                amenitiesList = [
                    "WiFi",
                    "Pool",
                    "AC",
                    "Kitchen",
                    "Parking",
                    "Hot Tub",
                    "Gym",
                ];
                for (i = 0; i < 40; i++) {
                    lng = Number(faker_1.faker.location.longitude({
                        min: 75.5,
                        max: 76.2,
                    }));
                    lat = Number(faker_1.faker.location.latitude({
                        min: 26.7,
                        max: 27.2,
                    }));
                    listings.push({
                        title: faker_1.faker.company.catchPhrase() + " Villa",
                        description: faker_1.faker.lorem.paragraphs(2),
                        price: faker_1.faker.number.int({
                            min: 1500,
                            max: 15000,
                        }),
                        category: faker_1.faker.helpers.arrayElement([
                            "Trending",
                            "Heritage",
                            "Amazing Pools",
                            "Camping",
                            "Tropical",
                            "Mountains",
                            "Bed & Breakfast",
                            "Arctic",
                        ]),
                        locationName: "".concat(faker_1.faker.location.city(), ", India"),
                        location: {
                            type: "Point",
                            coordinates: [lng, lat],
                        },
                        amenities: faker_1.faker.helpers.arrayElements(amenitiesList, {
                            min: 2,
                            max: 5,
                        }),
                        images: [
                            faker_1.faker.image.urlPicsumPhotos(),
                            faker_1.faker.image.urlPicsumPhotos(),
                            faker_1.faker.image.urlPicsumPhotos(),
                            faker_1.faker.image.urlPicsumPhotos(),
                            faker_1.faker.image.urlPicsumPhotos(),
                        ],
                        host: faker_1.faker.helpers.arrayElement(hosts)._id,
                        rating: 0,
                        numReviews: 0,
                    });
                }
                return [4 /*yield*/, listing_model_1.default.insertMany(listings)];
            case 9:
                createdListings = _a.sent();
                console.log("🏨 Created 40 property listings.");
                reviews = [];
                for (i = 0; i < 40; i++) {
                    targetListing = faker_1.faker.helpers.arrayElement(createdListings);
                    rating = faker_1.faker.number.int({
                        min: 3,
                        max: 5,
                    });
                    reviews.push({
                        user: faker_1.faker.helpers.arrayElement(regularUsers)._id,
                        listing: targetListing._id,
                        // REQUIRED FIELD FIX
                        booking: new mongoose_1.default.Types.ObjectId(),
                        rating: rating,
                        comment: faker_1.faker.lorem.sentences(2),
                    });
                    // UPDATE RATING
                    targetListing.rating =
                        (targetListing.rating * targetListing.numReviews + rating) /
                            (targetListing.numReviews + 1);
                    targetListing.numReviews += 1;
                }
                return [4 /*yield*/, review_model_1.default.insertMany(reviews)];
            case 10:
                _a.sent();
                _i = 0, createdListings_1 = createdListings;
                _a.label = 11;
            case 11:
                if (!(_i < createdListings_1.length)) return [3 /*break*/, 14];
                listing = createdListings_1[_i];
                return [4 /*yield*/, listing_model_1.default.findByIdAndUpdate(listing._id, {
                        rating: listing.rating,
                        numReviews: listing.numReviews,
                    })];
            case 12:
                _a.sent();
                _a.label = 13;
            case 13:
                _i++;
                return [3 /*break*/, 11];
            case 14:
                console.log("⭐ Created 40 reviews.");
                console.log("✅ Database Seeding Complete!");
                process.exit(0);
                return [3 /*break*/, 16];
            case 15:
                error_1 = _a.sent();
                console.error("❌ Seeding failed:", error_1);
                process.exit(1);
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); };
seedDatabase();
//   "scripts": {
//     "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
//     "build": "tsc",
//     "start": "node dist/server.js",
//     "seed": "ts-node src/script/seed.ts"
//   },
