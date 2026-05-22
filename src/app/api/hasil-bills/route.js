import crypto from "crypto";
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

function toInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function generateBillNo() {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HB-${Date.now()}-${random}`;
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

function buildBillVisibilityQuery(scope) {
  const query = {
    client: scope.clientId,
    isDeleted: false,
  };

  if (scope.actorRole === "team") {
    query.createdBy = scope.createdByFilter;
  }

  return query;
}

/* ==========================================================================
   GET ALL ACCESSIBLE BILLS
   ========================================================================== */

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, toInteger(searchParams.get("page"), 1));
    const limit = Math.min(
      100,
      Math.max(1, toInteger(searchParams.get("limit"), 10))
    );
    const skip = (page - 1) * limit;

    const search = cleanString(searchParams.get("search"));
    const status = cleanLower(searchParams.get("status"));
    const animalType = cleanLower(searchParams.get("animalType"));
    const paymentMethod = cleanLower(searchParams.get("paymentMethod"));
    const counterNumber = toInteger(searchParams.get("counterNumber"), 0);

    const query = buildBillVisibilityQuery(scope);

    if (status && BILL_STATUSES.includes(status)) {
      query.status = status;
    }

    if (animalType && ANIMAL_TYPES.includes(animalType)) {
      query.animalType = animalType;
    }

    if (paymentMethod && PAYMENT_METHODS.includes(paymentMethod)) {
      query.paymentMethod = paymentMethod;
    }

    if (counterNumber > 0) {
      query.counterNumber = counterNumber;
    }

    if (search) {
      query.$or = [
        { billNo: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { buyerPhone: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      HasilBill.find(query)
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
        .sort({ issuedAt: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      HasilBill.countDocuments(query),
    ]);

    const normalizedItems = items.map((item) => ({
      ...item,
      totalAmount: Number(item.hasilAmount || 0),
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Hasil bills fetched successfully.",
        data: {
          items: normalizedItems,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch hasil bills.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/* ==========================================================================
   CREATE BILL
   ========================================================================== */

export async function POST(req) {
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

    const body = await req.json();

    const buyerName = cleanString(body?.buyerName);
    const buyerPhone = cleanString(body?.buyerPhone);

    const animalType = cleanLower(body?.animalType);
    const animalPrice = toNumber(body?.animalPrice, -1);

    const hasilCalculationType =
      cleanLower(body?.hasilCalculationType) || "percentage";

    const hasilRatePercent = toNumber(body?.hasilRatePercent, 0);
    const hasilFixedAmount = toNumber(body?.hasilFixedAmount, 0);

    const status = cleanLower(body?.status) || "paid";
    const paymentMethod = cleanLower(body?.paymentMethod) || "cash";

    if (!buyerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Buyer name is required.",
        },
        { status: 400 }
      );
    }

    if (!animalType || !ANIMAL_TYPES.includes(animalType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid animal type is required.",
        },
        { status: 400 }
      );
    }

    if (animalPrice < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Animal price must be 0 or greater.",
        },
        { status: 400 }
      );
    }

    if (!HASIL_CALCULATION_TYPES.includes(hasilCalculationType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid hasil type.",
        },
        { status: 400 }
      );
    }

    if (hasilCalculationType === "percentage") {
      if (hasilRatePercent < 0 || hasilRatePercent > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Hasil percentage must be between 0 and 100.",
          },
          { status: 400 }
        );
      }
    }

    if (hasilCalculationType === "fixed") {
      if (hasilFixedAmount < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Fixed hasil amount must be 0 or greater.",
          },
          { status: 400 }
        );
      }
    }

    if (!BILL_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bill status.",
        },
        { status: 400 }
      );
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method.",
        },
        { status: 400 }
      );
    }

    const { hasilAmount, totalAmount } = calculateBillAmounts({
      animalPrice,
      hasilCalculationType,
      hasilRatePercent,
      hasilFixedAmount,
    });

    const createdBill = await HasilBill.create({
      billNo: generateBillNo(),

      client: scope.clientId,

      counterNumber:
        scope.actorRole === "team" ? scope.counterNumber || null : null,

      buyerName,
      buyerPhone,

      animalType,
      animalPrice,

      hasilCalculationType,

      hasilRatePercent:
        hasilCalculationType === "percentage" ? hasilRatePercent : 0,

      hasilFixedAmount:
        hasilCalculationType === "fixed" ? hasilFixedAmount : 0,

      hasilAmount,
      totalAmount,

      status,
      paymentMethod,

      paidAt: status === "paid" ? new Date() : null,

      createdBy: auth.user.id,
    });

    const bill = await HasilBill.findById(createdBill._id)
      .populate({
        path: "client",
        select: "name username email phone hasilLocation",
      })
      .populate({
        path: "createdBy",
        select: "name username email role client counterNumber",
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Hasil bill created successfully.",
        data: bill,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create hasil bill.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}