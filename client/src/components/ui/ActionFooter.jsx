// Mapeamento de cores para classes Tailwind
const colorMap = {
  blue:   { bg: 'bg-blue-600',   hover: 'hover:bg-blue-700',   shadow: 'shadow-blue-900/40' },
  green:  { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', shadow: 'shadow-emerald-900/40' },
  yellow: { bg: 'bg-amber-500',  hover: 'hover:bg-amber-600',  shadow: 'shadow-amber-900/40' },
  purple: { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', shadow: 'shadow-violet-900/40' },
  red:    { bg: 'bg-red-600',    hover: 'hover:bg-red-700',    shadow: 'shadow-red-900/40' },
  gray:   { bg: 'bg-slate-600',  hover: 'hover:bg-slate-500',  shadow: 'shadow-slate-900/40' },
  wpp:    { bg: 'bg-[#25d366]',  hover: 'hover:bg-[#128c7e]',  shadow: 'shadow-green-900/40' },
}

/**
 * ActionFooter — Barra de ações fixa no rodapé dos formulários
 * Fiel ao design da imagem de referência: fundo azul-marinho escuro,
 * botões quadrados com ícone grande + texto pequeno abaixo.
 *
 * @param {Array} actions — lista de ações
 *   { label, icon, color, onClick, loading, side: 'left'|'right' }
 */
export default function ActionFooter({ actions = [] }) {
  const left  = actions.filter(a => a.side !== 'right')
  const right = actions.filter(a => a.side === 'right')

  return (
    <footer className="bg-[#0f2044] border-t border-blue-900/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left group */}
      <div className="flex items-center gap-3">
        {left.map((action, i) => (
          <ActionBtn key={i} {...action} />
        ))}
      </div>

      {/* Right group */}
      <div className="flex items-center gap-3">
        {right.map((action, i) => (
          <ActionBtn key={i} {...action} />
        ))}
      </div>
    </footer>
  )
}

function ActionBtn({ label, icon, color = 'blue', onClick, loading }) {
  const c = colorMap[color] || colorMap.blue
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        flex flex-col items-center justify-center gap-1.5
        w-16 h-16 rounded-2xl
        ${c.bg} ${c.hover}
        shadow-lg ${c.shadow}
        text-white transition-all duration-200
        hover:-translate-y-1 hover:shadow-xl
        active:translate-y-0 active:shadow-md
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-white/30
      `}
      title={label}
    >
      {loading
        ? <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        : <span className="w-7 h-7 flex items-center justify-center">{icon}</span>
      }
      <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
        {loading ? '...' : label}
      </span>
    </button>
  )
}
