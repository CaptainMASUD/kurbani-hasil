import {
  FaChartLine,
  FaFileInvoiceDollar,
  FaUserTie,
  FaCashRegister,
} from "react-icons/fa";

const reportCards = [
  {
    title: "Daily Collection",
    value: "৳ 4,82,500",
    description: "Total hasil collected today",
    icon: FaFileInvoiceDollar,
  },
  {
    title: "Top Client",
    value: "Gabtoli Haat",
    description: "Highest collection location",
    icon: FaUserTie,
  },
  {
    title: "Busiest Counter",
    value: "Counter 03",
    description: "Most bills issued today",
    icon: FaCashRegister,
  },
];

export default function ReportsSection() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">
          Analytics Center
        </p>
        <h3 className="mt-1 text-3xl font-bold text-slate-900">
          Reports & Analytics
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This area will show collection reports, counter performance, client
          totals, and date-wise hasil analytics.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
                <Icon />
              </div>

              <p className="mt-5 text-sm text-slate-500">{card.title}</p>
              <h4 className="mt-2 text-2xl font-bold text-slate-900">
                {card.value}
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
            <FaChartLine />
          </div>

          <div>
            <h4 className="text-xl font-bold text-slate-900">
              Analytics Chart Placeholder
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Later we can connect this section with real collection charts and
              filters.
            </p>
          </div>
        </div>

        <div className="mt-6 flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <div>
            <FaChartLine className="mx-auto text-5xl text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Reports visualization will appear here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}