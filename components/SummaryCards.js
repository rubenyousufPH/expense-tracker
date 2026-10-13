function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

const cards = [
  {
    key: "income",
    label: "Total Income",
    color: "text-emerald-600"
  },
  {
    key: "expenses",
    label: "Total Expenses",
    color: "text-rose-600"
  },
  {
    key: "balance",
    label: "Balance",
    color: "text-slate-900"
  }
];

export default function SummaryCards({ totals }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="min-h-[116px] rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
        >
          <p className="mb-3 text-[15px] font-normal text-slate-500">
            {card.label}
          </p>

          <p className={`text-[25px] font-bold leading-none ${card.color}`}>
            {formatCurrency(totals[card.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
