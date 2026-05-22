import {
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaReceipt,
} from "react-icons/fa";

const bills = [
  {
    billNo: "HSL-00125",
    client: "Gabtoli Korbanir Haat",
    counter: "Counter 03",
    animalPrice: "৳ 120,000",
    hasil: "৳ 3,600",
    total: "৳ 123,600",
    status: "Paid",
  },
  {
    billNo: "HSL-00126",
    client: "Savar Central Haat",
    counter: "Counter 01",
    animalPrice: "৳ 80,000",
    hasil: "৳ 2,400",
    total: "৳ 82,400",
    status: "Paid",
  },
  {
    billNo: "HSL-00127",
    client: "Mirpur Hasil Point",
    counter: "Counter 05",
    animalPrice: "৳ 95,000",
    hasil: "৳ 2,850",
    total: "৳ 97,850",
    status: "Pending",
  },
];

export default function BillsSection() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">
          Billing Overview
        </p>
        <h3 className="mt-1 text-3xl font-bold text-slate-900">
          Hasil Bills
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Review generated bills, hasil amounts, and final payable totals.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaReceipt className="text-3xl text-emerald-700" />
          <p className="mt-5 text-sm text-slate-500">Bills Today</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900">1,248</h4>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaMoneyBillWave className="text-3xl text-blue-700" />
          <p className="mt-5 text-sm text-slate-500">Hasil Collected</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900">
            ৳ 4,82,500
          </h4>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaFileInvoiceDollar className="text-3xl text-amber-700" />
          <p className="mt-5 text-sm text-slate-500">Pending Bills</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900">14</h4>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h4 className="text-xl font-bold text-slate-900">Recent Bills</h4>
          <p className="mt-1 text-sm text-slate-500">
            Latest hasil bills issued by counters.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Bill No</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Counter</th>
                <th className="px-5 py-4">Animal Price</th>
                <th className="px-5 py-4">Hasil</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {bills.map((bill) => (
                <tr
                  key={bill.billNo}
                  className="border-t border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {bill.billNo}
                  </td>
                  <td className="px-5 py-4">{bill.client}</td>
                  <td className="px-5 py-4">{bill.counter}</td>
                  <td className="px-5 py-4">{bill.animalPrice}</td>
                  <td className="px-5 py-4 font-semibold">{bill.hasil}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {bill.total}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        bill.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}