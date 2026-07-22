// server/models/user.model.js
// ------------------------------------------------------------------
// Supports THREE sign-in methods on one account model:
//   1. Email + password (register/login)
//   2. Google (Google Identity Services idToken)
//   3. X / Twitter (OAuth2 + PKCE)
//
// All identity fields (email, googleId, xId, username) are optional +
// sparse unique, so a user created via one method doesn't need the
// fields used by the others.
//
// FIX (Jul 22): `username` previously had no index defined in the
// schema at all, but an old unique (non-sparse) index on `username`
// was still sitting in MongoDB from an earlier version of this
// schema. That made every second Google/email signup fail with
// "E11000 duplicate key error ... username_1 dup key: { username:
// null }", because non-sparse unique indexes treat `null`/missing as
// a real value that can only appear once. Declaring the index here
// as sparse keeps it correct going forward — but the OLD index in the
// database still needs to be dropped manually once, since Mongoose
// does not alter existing indexes on its own. Run this one-off script
// (or drop it via your DB provider's UI) before relying on this file:
//
//   import mongoose from "mongoose";
//   await mongoose.connect(process.env.MONGO_URI);
//   await mongoose.connection.collection("users").dropIndex("username_1");
//   process.exit(0);
//
// ------------------------------------------------------------------
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Shared / display fields
    name: { type: String, trim: true },
    avatar: { type: String },

    // Email + password auth
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows many docs with no email (X-only users)
    },
    password: { type: String, select: false }, // bcrypt hash, never returned by default

    // Google auth
    googleId: { type: String, unique: true, sparse: true },

    // X / Twitter auth
    xId: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true }, // X handle
    displayName: { type: String }, // X display name

    // App-specific stats
    totalXP: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password automatically whenever it's set/changed.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// Safe JSON shape for sending to the frontend (never leaks password hash).
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name || this.displayName || this.username || "User",
    email: this.email || null,
    avatar: this.avatar || null,
    username: this.username || null,
    totalXP: this.totalXP,
    wins: this.wins,
    losses: this.losses,
  };
};

export default mongoose.model("User", userSchema);
