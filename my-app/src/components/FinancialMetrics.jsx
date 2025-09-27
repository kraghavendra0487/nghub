import React from 'react'

const MetricCard = ({ name, value, color, bgColor, Icon, subtitle }) => {
  return (
    <div className={`relative p-5 rounded-xl shadow-lg bg-white transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] border border-gray-100 overflow-hidden`}>
      <svg className={`absolute top-0 right-0 h-28 w-28 opacity-10 transform translate-x-1/4 -translate-y-1/4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <Icon />
      </svg>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-full ${bgColor} ${color} shadow-md`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <Icon />
          </svg>
        </div>
      </div>
      <div className="flex flex-col mt-2">
        <p className="text-sm font-normal text-gray-500 truncate">{name}</p>
        {subtitle && <span className="text-xs text-gray-400 mt-0.5">{subtitle}</span>}
      </div>
      <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
    </div>
  )
}

export default function FinancialMetrics({ items = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {items.map((it) => (
        <MetricCard key={it.id} name={it.name} value={it.value} color={it.color} bgColor={it.bgColor} Icon={it.Icon} subtitle={it.subtitle} />
      ))}
    </div>
  )
}


