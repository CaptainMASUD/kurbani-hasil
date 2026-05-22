import { FaCashRegister, FaUserTie, FaUsers } from "react-icons/fa";

const counters = [
  {
    counter: "Counter 01",
    client: "Gabtoli Korbanir Haat",
    team: "Rahim Uddin",
    bills: 145,
    collection: "৳ 48,000",
    status: "Active",
  },
  {
    counter: "Counter 02",
    client: "Savar Central Haat",
    team: "Karim Mia",
    bills: 98,
    collection: "৳ 32,500",
    status: "Active",
  },
  {
    counter: "Counter 05",
    client: "Mirpur Hasil Point",
    team: "Sabbir Ahmed",
    bills: 64,
    collection: "৳ 21,700",
    status: "Inactive",
  },
];

export default function CountersSection() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">
          Counter Monitoring
        </p>
        <h3 className="mt-1 text-3xl font-bold text-slate-900">
          Counters Overview
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          See which client counters are active, who is assigned, and how much
          hasil is collected.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaCashRegister className="text-3xl text-emerald-700" />
          <p className="mt-5 text-sm text-slate-500">Total Counters</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900">142</h4>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaUserTie className="text-3xl text-blue-700" />
          <p className="mt-5 text-sm text-slate-500">Client Locations</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900">24</h4>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaUsers className="text-3xl text-amber-700" />
          <p className="mt-5 text-sm text-slate-500">Assigned Operators</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900">86</h4>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h4 className="text-xl font-bold text-slate-900">Counter List</h4>
          <p className="mt-1 text-sm text-slate-500">
            Hasil collection performance by counter.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Counter</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Assigned Team</th>
                <th className="px-5 py-4">Bills</th>
                <th className="px-5 py-4">Collection</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {counters.map((counter) => (
                <tr
                  key={`${counter.client}-${counter.counter}`}
                  className="border-t border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {counter.counter}
                  </td>
                  <td className="px-5 py-4">{counter.client}</td>
                  <td className="px-5 py-4">{counter.team}</td>
                  <td className="px-5 py-4">{counter.bills}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {counter.collection}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        counter.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {counter.status}
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