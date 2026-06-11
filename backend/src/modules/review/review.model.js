"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var reviewSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    listing: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
    },
    reply: {
        text: { type: String },
        createdAt: { type: Date },
    },
}, { timestamps: true });
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
var Review = mongoose_1.default.model("Review", reviewSchema);
exports.default = Review;
