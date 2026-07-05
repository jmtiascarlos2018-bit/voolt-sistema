import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContasPagar, getResumoContasPagar } from '../api'

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const colorText = {
  blue: 'text-blue-700',
  emerald: 'text-emerald-700',
  red: 'text-red-700',
  amber: 'text-amber-700',
}

export default function Financeiro() {
  const navigate = useNavigate()
  const [resumo, setResumo] = useState({ totalAPagar: 0, totalPago: 0, totalVencido: 0, saldo: 0 })
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([getResumoContasPagar(), getContasPagar()])
      .then(([r, c]) => {
        setResumo(r)
        setContas(c)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { queueMicrotask(load) }, [])

  const proximas = contas
    .filter(c => c.status === 'pendente' || c.status === 'vencido')
    .slice(0, 6)

  const cards = [
    { label: 'Total a pagar', value: fmtBRL(resumo.totalAPagar), color: 'blue', sub: 'Pendentes e vencidas' },
    { label: 'Total pago', value: fmtBRL(resumo.totalPago), color: 'emerald', sub: 'Despesas quitadas' },
    { label: 'Total vencido', value: fmtBRL(resumo.totalVencido), color: 'red', sub: 'Requer atenção' },
    { label: 'Saldo geral', value: fmtBRL(resumo.saldo), color: resumo.saldo >= 0 ? 'emerald' : 'amber', sub: 'Pagas menos abertas' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="card p-5 border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold">Tentar novamente</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="card p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${colorText[card.color]}`}>{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Controle de despesas</h2>
          <p className="text-sm text-slate-400 mt-1">Acompanhe vencimentos, pagamentos e prioridades em Contas a Pagar.</p>
        </div>
        <button
          onClick={() => navigate('/contas-a-pagar')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
        >
          Abrir Contas a Pagar
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Próximas contas</h2>
          <button onClick={() => navigate('/contas-a-pagar')} className="text-xs font-semibold text-blue-600 hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Descrição</th>
                <th className="table-th">Categoria</th>
                <th className="table-th">Vencimento</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map(conta => (
                <tr key={conta.id} className="hover:bg-slate-50">
                  <td className="table-td font-semibold">{conta.descricao}</td>
                  <td className="table-td text-slate-500">{conta.categoria || '-'}</td>
                  <td className="table-td">{formatDate(conta.data_vencimento)}</td>
                  <td className="table-td font-bold text-slate-800">{fmtBRL(conta.valor)}</td>
                  <td className="table-td"><StatusBadge status={conta.status} /></td>
                </tr>
              ))}
              {proximas.length === 0 && (
                <tr><td colSpan={5} className="table-td text-center py-10 text-slate-400">Nenhuma conta aberta no momento.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value + 'T12:00:00').toLocaleDateString('pt-BR')
}

function StatusBadge({ status }) {
  const map = {
    pago: 'badge-active',
    pendente: 'badge-pending',
    vencido: 'badge-inactive',
    cancelado: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500',
  }
  return <span className={map[status] || 'badge-pending'}>{status || 'pendente'}</span>
}
