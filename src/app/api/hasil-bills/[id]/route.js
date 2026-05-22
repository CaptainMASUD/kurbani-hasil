import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import HasilBill, {
  ANIMAL_TYPES,
  HASIL_CALCULATION_TYPES,
  BILL_STATUSES,
  PAYMENT_METHODS,
} from "@/models/hasil-bill.model";
import User from "@/models/user.model";
import { requireAuth } from "@/lib/auth";

/* ==========================================================================
   HELPERS
   ========================================================================== */

function cleanString(value = "") {
  return String(value || "").trim();
}

function cleanLower(value = "") {
  return cleanString(value).toLowerCase();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function calculateBillAmounts({
  animalPrice,
  hasilCalculationType,
  hasilRatePercent,
  hasilFixedAmount,
}) {
  const safeAnimalPrice = Math.max(0, Number(animalPrice || 0));
  const safeRate = Math.max(0, Number(hasilRatePercent || 0));
  const safeFixed = Math.max(0, Number(hasilFixedAmount || 0));

  let hasilAmount = 0;

  if (hasilCalculationType === "percentage") {
    hasilAmount = (safeAnimalPrice * safeRate) / 100;
  }

  if (hasilCalculationType === "fixed") {
    hasilAmount = safeFixed;
  }

  hasilAmount = Number(hasilAmount.toFixed(2));

  const totalAmount = hasilAmount;

  return {
    hasilAmount,
    totalAmount,
  };
}

async function getBillingScope(authUser) {
  if (!authUser?.id || !authUser?.role) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized.",
    };
  }

  if (authUser.role === "client") {
    return {
      ok: true,
      actorRole: "client",
      clientId: authUser.id,
      createdByFilter: null,
      counterNumber: null,
    };
  }

  if (authUser.role === "team") {
    const teamUser = await User.findOne({
      _id: authUser.id,
      role: "team",
    })
      .select("client counterNumber status")
      .lean();

    if (!teamUser) {
      return {
        ok: false,
        status: 404,
        message: "Team member account not found.",
      };
    }

    if (teamUser.status !== "active") {
      return {
        ok: false,
        status: 403,
        message: "Inactive or suspended team members cannot access billing.",
      };
    }

    if (!teamUser.client) {
      return {
        ok: false,
        status: 403,
        message: "Team member is not assigned to any client.",
      };
    }

    return {
      ok: true,
      actorRole: "team",
      clientId: teamUser.client.toString(),
      createdByFilter: authUser.id,
      counterNumber: teamUser.counterNumber || null,
    };
  }

  return {
    ok: false,
    status: 403,
    message: "Only client and team users can access hasil billing.",
  };
}

function buildBillVisibilityQuery(scope, billId = null) {
  const query = {
    client: scope.clientId,
    isDeleted: false,
  };

  if (billId) {
    query._id = billId;
  }

  if (scope.actorRole === "team") {
    query.createdBy = scope.createdByFilter;
  }

  return query;
}

/* ==========================================================================
   GET SINGLE BILL
   ========================================================================== */

export async function GET(req, { params }) {
  try {
    await connectDB();

    const auth = await requireAuth(req);

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const scope = await getBillingScope(auth.user);

    if (!scope.ok) {
      return NextResponse.json(
        {
          success: false,
          message: scope.message,
        },
        { status: scope.status }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bill ID.",
        },
        { status: 400 }
      );
    }

    const bill = await HasilBill.findOne(
      buildBillVisibilityQuery(scope, id)
    )
      .populate({
        path: "client",
        select: "name username email phone hasilLocation",
      })
      .populate({
        path: "createdBy",
        select: "name username email role client counterNumber",
      })
      .populate({
        path: "updatedBy",
        select: "name username email role",
      })
      .lean();

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: "Hasil bill not found.",
        },
        { status: 404 }
      );
    }

    const normalizedBill = {
      ...bill,
      totalAmount: Number(bill.hasilAmount || 0),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Hasil bill fetched successfully.",
        data: normalizedBill,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch hasil bill.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/* ==========================================================================
   UPDATE BILL
   ========================================================================== */

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const auth = await requireAuth(req);

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const scope = await getBillingScope(auth.user);

    if (!scope.ok) {
      return NextResponse.json(
        {
          success: false,
          message: scope.message,
        },
        { status: scope.status }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bill ID.",
        },
        { status: 400 }
      );
    }

    const bill = await HasilBill.findOne(
      buildBillVisibilityQuery(scope, id)
    );

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: "Hasil bill not found.",
        },
        { status: 404 }
      );
    }

    const body = await req.json();

    if (body?.buyerName !== undefined) {
      const buyerName = cleanString(body.buyerName);

      if (!buyerName) {
        return NextResponse.json(
          {
            success: false,
            message: "Buyer name cannot be empty.",
          },
          { status: 400 }
        );
      }

      bill.buyerName = buyerName;
    }

    if (body?.buyerPhone !== undefined) {
      bill.buyerPhone = cleanString(body.buyerPhone);
    }

    if (body?.animalType !== undefined) {
      const animalType = cleanLower(body.animalType);

      if (!ANIMAL_TYPES.includes(animalType)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid animal type.",
          },
          { status: 400 }
        );
      }

      bill.animalType = animalType;
    }

    if (body?.animalPrice !== undefined) {
      const animalPrice = toNumber(body.animalPrice, -1);

      if (animalPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Animal price must be 0 or greater.",
          },
          { status: 400 }
        );
      }

      bill.animalPrice = animalPrice;
    }

    if (body?.hasilCalculationType !== undefined) {
      const hasilCalculationType = cleanLower(body.hasilCalculationType);

      if (!HASIL_CALCULATION_TYPES.includes(hasilCalculationType)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid hasil type.",
          },
          { status: 400 }
        );
      }

      bill.hasilCalculationType = hasilCalculationType;
    }

    if (body?.hasilRatePercent !== undefined) {
      const hasilRatePercent = toNumber(body.hasilRatePercent, -1);

      if (hasilRatePercent < 0 || hasilRatePercent > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Hasil percentage must be between 0 and 100.",
          },
          { status: 400 }
        );
      }

      bill.hasilRatePercent = hasilRatePercent;
    }

    if (body?.hasilFixedAmount !== undefined) {
      const hasilFixedAmount = toNumber(body.hasilFixedAmount, -1);

      if (hasilFixedAmount < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Fixed hasil amount must be 0 or greater.",
          },
          { status: 400 }
        );
      }

      bill.hasilFixedAmount = hasilFixedAmount;
    }

    if (body?.status !== undefined) {
      const status = cleanLower(body.status);

      if (!BILL_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid bill status.",
          },
          { status: 400 }
        );
      }

      bill.status = status;

      if (status === "paid") {
        bill.paidAt = bill.paidAt || new Date();
      } else {
        bill.paidAt = null;
      }
    }

    if (body?.paymentMethod !== undefined) {
      const paymentMethod = cleanLower(body.paymentMethod);

      if (!PAYMENT_METHODS.includes(paymentMethod)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment method.",
          },
          { status: 400 }
        );
      }

      bill.paymentMethod = paymentMethod;
    }

    const { hasilAmount, totalAmount } = calculateBillAmounts({
      animalPrice: bill.animalPrice,
      hasilCalculationType: bill.hasilCalculationType,
      hasilRatePercent: bill.hasilRatePercent,
      hasilFixedAmount: bill.hasilFixedAmount,
    });

    bill.hasilAmount = hasilAmount;
    bill.totalAmount = totalAmount;

    if (bill.hasilCalculationType === "percentage") {
      bill.hasilFixedAmount = 0;
    }

    if (bill.hasilCalculationType === "fixed") {
      bill.hasilRatePercent = 0;
    }

    bill.updatedBy = auth.user.id;

    await bill.save();

    const updatedBill = await HasilBill.findById(bill._id)
      .populate({
        path: "client",
        select: "name username email phone hasilLocation",
      })
      .populate({
        path: "createdBy",
        select: "name username email role client counterNumber",
      })
      .populate({
        path: "updatedBy",
        select: "name username email role",
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Hasil bill updated successfully.",
        data: updatedBill,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update hasil bill.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/* ==========================================================================
   SOFT DELETE BILL
   ========================================================================== */

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const auth = await requireAuth(req);

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const scope = await getBillingScope(auth.user);

    if (!scope.ok) {
      return NextResponse.json(
        {
          success: false,
          message: scope.message,
        },
        { status: scope.status }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bill ID.",
        },
        { status: 400 }
      );
    }

    const bill = await HasilBill.findOne(
      buildBillVisibilityQuery(scope, id)
    );

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: "Hasil bill not found.",
        },
        { status: 404 }
      );
    }

    bill.isDeleted = true;
    bill.deletedAt = new Date();
    bill.deletedBy = auth.user.id;

    await bill.save();

    return NextResponse.json(
      {
        success: true,
        message: "Hasil bill deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete hasil bill.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}