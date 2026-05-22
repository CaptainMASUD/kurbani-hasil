import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import HasilBill from "@/models/hasil-bill.model";
import { requireAuth } from "@/lib/auth";

/* ==========================================================================
   HELPERS
   ========================================================================== */

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date = new Date()) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function normalizeId(value) {
  return value?._id?.toString?.() || value?.id || value?.toString?.() || value;
}

function safeNumber(value = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeAggregationList(rows = []) {
  return rows.map((item) => ({
    key: item._id || "unknown",
    count: item.count || 0,
    hasilAmount: safeNumber(item.hasilAmount),
    totalAmount: safeNumber(item.totalAmount || item.hasilAmount),
  }));
}

function serializeRecentBill(bill) {
  return {
    id: normalizeId(bill),
    billNo: bill.billNo || "",
    buyerName: bill.buyerName || "",
    buyerPhone: bill.buyerPhone || "",
    animalType: bill.animalType || "",
    animalPrice: safeNumber(bill.animalPrice),

    hasilCalculationType: bill.hasilCalculationType || "",
    hasilRatePercent: safeNumber(bill.hasilRatePercent),
    hasilFixedAmount: safeNumber(bill.hasilFixedAmount),
    hasilAmount: safeNumber(bill.hasilAmount),

    // In your app logic, totalAmount is same as hasilAmount.
    totalAmount: safeNumber(bill.totalAmount || bill.hasilAmount),

    status: bill.status || "",
    paymentMethod: bill.paymentMethod || "",
    counterNumber: bill.counterNumber || null,
    paidAt: bill.paidAt || null,
    issuedAt: bill.issuedAt || null,
    createdAt: bill.createdAt || null,

    client:
      typeof bill.client === "object" && bill.client
        ? {
            id: normalizeId(bill.client),
            name: bill.client.name || "",
            username: bill.client.username || "",
            email: bill.client.email || "",
            phone: bill.client.phone || "",
            hasilLocation: bill.client.hasilLocation || "",
            totalCounters: bill.client.totalCounters || 0,
          }
        : null,

    createdBy:
      typeof bill.createdBy === "object" && bill.createdBy
        ? {
            id: normalizeId(bill.createdBy),
            name: bill.createdBy.name || "",
            username: bill.createdBy.username || "",
            email: bill.createdBy.email || "",
            role: bill.createdBy.role || "",
            counterNumber: bill.createdBy.counterNumber || null,
          }
        : null,
  };
}

/* ==========================================================================
   GET ADMIN OVERVIEW
   Route: GET /api/admin/overview
   Access: admin only
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

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admin users can access dashboard overview.",
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const activeBillQuery = {
      isDeleted: false,
    };

    const [
      totalUsers,
      totalAdmins,
      totalClients,
      totalTeams,
      activeUsers,
      inactiveUsers,
      suspendedUsers,

      totalBills,
      todayBills,
      monthlyBills,
      paidBills,
      unpaidBills,
      cancelledBills,

      userRoleSummary,
      userStatusSummary,

      billStatusSummary,
      paymentMethodSummary,
      animalTypeSummary,
      counterSummary,

      topClientSummary,
      topCreatorSummary,

      totalMoneySummary,
      todayMoneySummary,
      monthlyMoneySummary,
      paidMoneySummary,
      unpaidMoneySummary,

      recentBills,
      recentClients,
      recentTeams,
    ] = await Promise.all([
      /* User counts */
      User.countDocuments({}),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "team" }),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "inactive" }),
      User.countDocuments({ status: "suspended" }),

      /* Bill counts */
      HasilBill.countDocuments(activeBillQuery),
      HasilBill.countDocuments({
        ...activeBillQuery,
        createdAt: { $gte: todayStart },
      }),
      HasilBill.countDocuments({
        ...activeBillQuery,
        createdAt: { $gte: monthStart },
      }),
      HasilBill.countDocuments({
        ...activeBillQuery,
        status: "paid",
      }),
      HasilBill.countDocuments({
        ...activeBillQuery,
        status: "unpaid",
      }),
      HasilBill.countDocuments({
        ...activeBillQuery,
        status: "cancelled",
      }),

      /* User role summary */
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* User status summary */
      User.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* Bill status summary */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* Payment method summary */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            hasilAmount: -1,
          },
        },
      ]),

      /* Animal type summary */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: "$animalType",
            count: { $sum: 1 },
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* Counter wise summary */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: "$counterNumber",
            count: { $sum: 1 },
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      /* Top clients by hasil amount */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: "$client",
            count: { $sum: 1 },
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            hasilAmount: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "client",
          },
        },
        {
          $unwind: {
            path: "$client",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            hasilAmount: 1,
            totalAmount: 1,
            client: {
              _id: "$client._id",
              name: "$client.name",
              username: "$client.username",
              email: "$client.email",
              phone: "$client.phone",
              hasilLocation: "$client.hasilLocation",
              totalCounters: "$client.totalCounters",
              status: "$client.status",
            },
          },
        },
      ]),

      /* Top creators/team members by hasil amount */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: "$createdBy",
            count: { $sum: 1 },
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            hasilAmount: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            hasilAmount: 1,
            totalAmount: 1,
            createdBy: {
              _id: "$createdBy._id",
              name: "$createdBy.name",
              username: "$createdBy.username",
              email: "$createdBy.email",
              role: "$createdBy.role",
              counterNumber: "$createdBy.counterNumber",
              status: "$createdBy.status",
            },
          },
        },
      ]),

      /* Total money summary */
      HasilBill.aggregate([
        {
          $match: activeBillQuery,
        },
        {
          $group: {
            _id: null,
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
            animalPrice: { $sum: "$animalPrice" },
          },
        },
      ]),

      /* Today money summary */
      HasilBill.aggregate([
        {
          $match: {
            ...activeBillQuery,
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
            animalPrice: { $sum: "$animalPrice" },
          },
        },
      ]),

      /* Monthly money summary */
      HasilBill.aggregate([
        {
          $match: {
            ...activeBillQuery,
            createdAt: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: null,
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
            animalPrice: { $sum: "$animalPrice" },
          },
        },
      ]),

      /* Paid money summary */
      HasilBill.aggregate([
        {
          $match: {
            ...activeBillQuery,
            status: "paid",
          },
        },
        {
          $group: {
            _id: null,
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),

      /* Unpaid money summary */
      HasilBill.aggregate([
        {
          $match: {
            ...activeBillQuery,
            status: "unpaid",
          },
        },
        {
          $group: {
            _id: null,
            hasilAmount: { $sum: "$hasilAmount" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),

      /* Recent bills */
      HasilBill.find(activeBillQuery)
        .populate({
          path: "client",
          select:
            "name username email phone hasilLocation totalCounters status",
        })
        .populate({
          path: "createdBy",
          select:
            "name username email role client counterNumber status",
        })
        .sort({
          issuedAt: -1,
          createdAt: -1,
          _id: -1,
        })
        .limit(10)
        .lean(),

      /* Recent clients */
      User.find({
        role: "client",
      })
        .select(
          "name username email phone address hasilLocation totalCounters status createdAt"
        )
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .limit(5)
        .lean(),

      /* Recent teams */
      User.find({
        role: "team",
      })
        .populate({
          path: "client",
          select: "name username phone hasilLocation totalCounters status",
        })
        .select(
          "name username email phone status client counterNumber createdAt"
        )
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .limit(5)
        .lean(),
    ]);

    const totalMoney = totalMoneySummary[0] || {};
    const todayMoney = todayMoneySummary[0] || {};
    const monthlyMoney = monthlyMoneySummary[0] || {};
    const paidMoney = paidMoneySummary[0] || {};
    const unpaidMoney = unpaidMoneySummary[0] || {};

    return NextResponse.json(
      {
        success: true,
        message: "Admin overview fetched successfully.",
        data: {
          users: {
            total: totalUsers,
            admins: totalAdmins,
            clients: totalClients,
            teams: totalTeams,
            active: activeUsers,
            inactive: inactiveUsers,
            suspended: suspendedUsers,

            byRole: userRoleSummary.map((item) => ({
              role: item._id || "unknown",
              count: item.count || 0,
            })),

            byStatus: userStatusSummary.map((item) => ({
              status: item._id || "unknown",
              count: item.count || 0,
            })),
          },

          bills: {
            total: totalBills,
            today: todayBills,
            thisMonth: monthlyBills,
            paid: paidBills,
            unpaid: unpaidBills,
            cancelled: cancelledBills,

            byStatus: normalizeAggregationList(billStatusSummary),
            byPaymentMethod: normalizeAggregationList(paymentMethodSummary),
            byAnimalType: normalizeAggregationList(animalTypeSummary),

            byCounter: counterSummary.map((item) => ({
              counterNumber: item._id || null,
              count: item.count || 0,
              hasilAmount: safeNumber(item.hasilAmount),
              totalAmount: safeNumber(item.totalAmount || item.hasilAmount),
            })),
          },

          money: {
            totalHasilAmount: safeNumber(totalMoney.hasilAmount),
            totalCollectionAmount: safeNumber(
              totalMoney.totalAmount || totalMoney.hasilAmount
            ),
            totalAnimalPrice: safeNumber(totalMoney.animalPrice),

            todayHasilAmount: safeNumber(todayMoney.hasilAmount),
            todayCollectionAmount: safeNumber(
              todayMoney.totalAmount || todayMoney.hasilAmount
            ),
            todayAnimalPrice: safeNumber(todayMoney.animalPrice),

            monthlyHasilAmount: safeNumber(monthlyMoney.hasilAmount),
            monthlyCollectionAmount: safeNumber(
              monthlyMoney.totalAmount || monthlyMoney.hasilAmount
            ),
            monthlyAnimalPrice: safeNumber(monthlyMoney.animalPrice),

            paidHasilAmount: safeNumber(paidMoney.hasilAmount),
            paidCollectionAmount: safeNumber(
              paidMoney.totalAmount || paidMoney.hasilAmount
            ),

            unpaidHasilAmount: safeNumber(unpaidMoney.hasilAmount),
            unpaidCollectionAmount: safeNumber(
              unpaidMoney.totalAmount || unpaidMoney.hasilAmount
            ),
          },

          topClients: topClientSummary.map((item) => ({
            client:
              item.client && item.client._id
                ? {
                    id: normalizeId(item.client),
                    name: item.client.name || "",
                    username: item.client.username || "",
                    email: item.client.email || "",
                    phone: item.client.phone || "",
                    hasilLocation: item.client.hasilLocation || "",
                    totalCounters: item.client.totalCounters || 0,
                    status: item.client.status || "",
                  }
                : null,
            billCount: item.count || 0,
            hasilAmount: safeNumber(item.hasilAmount),
            totalAmount: safeNumber(item.totalAmount || item.hasilAmount),
          })),

          topCreators: topCreatorSummary.map((item) => ({
            createdBy:
              item.createdBy && item.createdBy._id
                ? {
                    id: normalizeId(item.createdBy),
                    name: item.createdBy.name || "",
                    username: item.createdBy.username || "",
                    email: item.createdBy.email || "",
                    role: item.createdBy.role || "",
                    counterNumber: item.createdBy.counterNumber || null,
                    status: item.createdBy.status || "",
                  }
                : null,
            billCount: item.count || 0,
            hasilAmount: safeNumber(item.hasilAmount),
            totalAmount: safeNumber(item.totalAmount || item.hasilAmount),
          })),

          recentBills: recentBills.map(serializeRecentBill),

          recentClients: recentClients.map((client) => ({
            id: normalizeId(client),
            name: client.name || "",
            username: client.username || "",
            email: client.email || "",
            phone: client.phone || "",
            address: client.address || "",
            hasilLocation: client.hasilLocation || "",
            totalCounters: client.totalCounters || 0,
            status: client.status || "",
            createdAt: client.createdAt || null,
          })),

          recentTeams: recentTeams.map((team) => ({
            id: normalizeId(team),
            name: team.name || "",
            username: team.username || "",
            email: team.email || "",
            phone: team.phone || "",
            status: team.status || "",
            counterNumber: team.counterNumber || null,
            createdAt: team.createdAt || null,

            client:
              typeof team.client === "object" && team.client
                ? {
                    id: normalizeId(team.client),
                    name: team.client.name || "",
                    username: team.client.username || "",
                    phone: team.client.phone || "",
                    hasilLocation: team.client.hasilLocation || "",
                    totalCounters: team.client.totalCounters || 0,
                    status: team.client.status || "",
                  }
                : null,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin overview.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}