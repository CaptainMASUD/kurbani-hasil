import mongoose from "mongoose";

const { Schema } = mongoose;

export const ANIMAL_TYPES = [
  "cow",
  "goat",
  "buffalo",
  "sheep",
  "camel",
  "other",
];

export const HASIL_CALCULATION_TYPES = ["percentage", "fixed"];

export const BILL_STATUSES = ["paid", "unpaid", "cancelled"];

export const PAYMENT_METHODS = [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank",
  "card",
  "other",
];

const hasilBillSchema = new Schema(
  {
    billNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    counterNumber: {
      type: Number,
      min: 1,
      default: null,
      index: true,
    },

    buyerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    buyerPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
      index: true,
    },

    animalType: {
      type: String,
      enum: ANIMAL_TYPES,
      required: true,
      index: true,
    },

    animalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    hasilCalculationType: {
      type: String,
      enum: HASIL_CALCULATION_TYPES,
      required: true,
      default: "percentage",
    },

    hasilRatePercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    hasilFixedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    hasilAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Same as hasilAmount.
     * Total collection for this bill is the hasil only.
     * Calculated by backend.
     */
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: BILL_STATUSES,
      default: "paid",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "cash",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
      index: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedBy: {
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

hasilBillSchema.index({ billNo: 1 }, { unique: true });

hasilBillSchema.index({
  client: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  isDeleted: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  createdBy: 1,
  isDeleted: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  createdBy: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  animalType: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  createdBy: 1,
  animalType: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  paymentMethod: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  createdBy: 1,
  paymentMethod: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  client: 1,
  counterNumber: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  createdBy: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  buyerName: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.index({
  buyerPhone: 1,
  createdAt: -1,
  _id: -1,
});

hasilBillSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() || ret._id;
    delete ret._id;
    return ret;
  },
});

const HasilBill =
  mongoose.models.HasilBill ||
  mongoose.model("HasilBill", hasilBillSchema);

export default HasilBill;