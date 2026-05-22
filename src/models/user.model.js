import mongoose from "mongoose";

const { Schema } = mongoose;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,40}$/;

export const USER_ROLES = ["admin", "client", "team"];
export const USER_STATUSES = ["active", "inactive", "suspended"];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
      validate: {
        validator: (value) => USERNAME_REGEX.test(value),
        message:
          "Username can contain only letters, numbers, underscore, dot, and dash.",
      },
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return EMAIL_REGEX.test(value);
        },
        message: "Invalid email format.",
      },
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
      index: true,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    hasilLocation: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
      index: true,
    },

    /**
     * Only used for clients.
     * Example:
     * totalCounters: 5
     * means this client has Counter 1 to Counter 5.
     */
    totalCounters: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Total counters must be a whole number.",
      },
    },

    /**
     * Only used for team members.
     * Which client this team member belongs to.
     */
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /**
     * Only used for team members.
     * Multiple members can use the SAME counter number
     * under the SAME client.
     *
     * Example:
     * Client A -> Counter 1 -> Team Member X, Y, Z
     */
    counterNumber: {
      type: Number,
      min: 1,
      default: null,
      index: true,
      validate: {
        validator: function (value) {
          if (value === null || value === undefined) return true;
          return Number.isInteger(value);
        },
        message: "Counter number must be a whole number.",
      },
    },

    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: true,
    versionKey: false,
  }
);

/**
 * Role-based cleanup and validation
 */
userSchema.pre("validate", function () {
  if (this.role === "admin") {
    if (!this.email) {
      throw new Error("Admin email is required.");
    }

    this.phone = "";
    this.address = "";
    this.hasilLocation = "";
    this.totalCounters = 0;
    this.client = null;
    this.counterNumber = null;
  }

  if (this.role === "client") {
    if (!this.email) {
      throw new Error("Client email is required.");
    }

    if (!this.phone) {
      throw new Error("Client phone is required.");
    }

    if (!this.address) {
      throw new Error("Client address is required.");
    }

    if (!this.hasilLocation) {
      throw new Error("Client hasil location is required.");
    }

    if (
      this.totalCounters === undefined ||
      this.totalCounters === null ||
      this.totalCounters < 0 ||
      !Number.isInteger(this.totalCounters)
    ) {
      throw new Error("Client total counters must be a whole number 0 or more.");
    }

    this.client = null;
    this.counterNumber = null;
  }

  if (this.role === "team") {
    if (!this.client) {
      throw new Error("Team member must belong to a client.");
    }

    if (
      this.counterNumber === undefined ||
      this.counterNumber === null ||
      this.counterNumber < 1 ||
      !Number.isInteger(this.counterNumber)
    ) {
      throw new Error("Team member must have a valid counter number.");
    }

    this.address = "";
    this.hasilLocation = "";
    this.totalCounters = 0;
  }
});

/**
 * Indexes
 */
userSchema.index({ username: 1 }, { unique: true });

/**
 * Important:
 * Allows many team users to have NO email,
 * while still keeping email unique when provided.
 */
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

userSchema.index({ createdAt: -1, _id: -1 });
userSchema.index({ role: 1, createdAt: -1, _id: -1 });
userSchema.index({ status: 1, createdAt: -1, _id: -1 });

/**
 * This index helps quickly find:
 * - team members under a client
 * - team members inside a specific counter
 *
 * It is NOT unique,
 * so multiple team members can be assigned to the same counter.
 */
userSchema.index({
  client: 1,
  counterNumber: 1,
  role: 1,
  createdAt: -1,
});

userSchema.index({
  role: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() || ret._id;

    delete ret._id;
    delete ret.passwordHash;

    return ret;
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;