import { useEffect, useState } from 'react'
import { getAlunos, getEmpresas } from '../api'

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Relatorios() {
  const [alunos, setAlunos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAlunos(), getEmpresas()])
      .then(([a, e]) => { setAlunos(a); setEmpresas(e) })
      .finally(() => setLoading(false))
  }, [])

  const totalPago = alunos.reduce((s, a) => s + (a.entrada || 0), 0)
  const totalContratado = alunos.reduce((s, a) => s + (a.valorTotal || 0), 0)
  const totalPendente = totalContratado - totalPago
  const totalEmpresas = empresas.reduce((s, e) => s + (e.valorMensal || 0), 0)

  const stats = [
    { label: 'Faturamento Pago', value: fmtBRL(totalPago), icon: '💰', color: 'emerald' },
    { label: 'Faturamento Previsto', value: fmtBRL(totalPendente), icon: '⏳', color: 'amber' },
    { label: 'Total Empresas/mês', value: fmtBRL(totalEmpresas), icon: '🏢', color: 'violet' },
    { label: 'Total Geral', value: fmtBRL(totalContratado + totalEmpresas), icon: '📊', color: 'blue' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-${s.color}-50`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-800">{loading ? '...' : s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">📜 Demonstrativo de Recebimentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Aluno / Empresa</th>
                <th className="table-th">Descrição</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Forma</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && alunos.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium">{a.nome}</td>
                  <td className="table-td text-slate-500 text-xs">{a.curso}</td>
                  <td className="table-td font-semibold text-emerald-700">{fmtBRL(a.entrada)}</td>
                  <td className="table-td text-xs">{a.formaPagamento || 'Parcelado'}</td>
                  <td className="table-td"><span className="badge-active">PAGO</span></td>
                </tr>
              ))}
              {!loading && empresas.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium">{e.nomeFantasia}</td>
                  <td className="table-td text-slate-500 text-xs">{e.plano}</td>
                  <td className="table-td font-semibold text-blue-700">{fmtBRL(e.valorMensal)}</td>
                  <td className="table-td text-xs">{e.formaPagamento || 'Boleto'}</td>
                  <td className="table-td">
                    <span className={e.statusPlano === 'ATIVO' ? 'badge-active' : 'badge-inactive'}>{e.statusPlano || 'ATIVO'}</span>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={5} className="table-td text-center py-8 text-slate-400">Carregando...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
