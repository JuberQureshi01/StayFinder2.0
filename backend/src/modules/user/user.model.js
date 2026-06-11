"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var mongoose_2 = require("mongoose");
var userSchema = new mongoose_2.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        name: { type: String, required: true },
        profilePicture: { type: String },
        contactNumber: { type: String },
        verified: { type: Boolean, default: false },
    },
    role: { type: String, enum: ["user", "admin", "host"], default: "user" },
    banned: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    wishlist: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Listing" }],
}, { timestamps: true });
var User = mongoose_2.default.model("User", userSchema);
exports.default = User;
