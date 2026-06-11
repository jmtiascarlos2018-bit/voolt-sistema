import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAlunos, getEmpresas } from '../api'

export default function Dashboard() {
  const [alunos, setAlunos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getAlunos(), getEmpresas()])
      .then(([a, e]) => { setAlunos(a); setEmpresas(e) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalRecebido = alunos.reduce((s, a) => s + (a.entrada || 0), 0)
  const parcelasAbertas = alunos.reduce((s, a) => {
    const p = a.parcelas || []
    return s + p.filter(x => x.status !== 'PAGO').length
  }, 0)

  const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const stats = [
    { label: 'Alunos Matriculados', value: alunos.length, sub: 'Ativos', color: 'blue', icon: <UsersIcon />, onClick: () => navigate('/alunos') },
    { label: 'Recebido (mês)', value: fmtBRL(totalRecebido), sub: 'Financeiro', color: 'emerald', icon: <MoneyIcon />, onClick: () => navigate('/relatorios') },
    { label: 'Parcelas em aberto', value: parcelasAbertas, sub: 'Alunos', color: 'amber', icon: <DocIcon /> },
    { label: 'Empresas ativas', value: empresas.length, sub: 'Tráfego pago', color: 'violet', icon: <BuildingIcon />, onClick: () => navigate('/empresas') },
  ]

  if (loading) return <LoadingState />

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            onClick={s.onClick}
            className={`card p-5 flex items-center gap-4 ${s.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-${s.color}-600 bg-${s.color}-50 flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm font-medium text-slate-600">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Alunos recentes</h2>
            <button onClick={() => navigate('/alunos')} className="text-xs font-semibold text-blue-600 hover:underline">Ver todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Nome</th>
                  <th className="table-th">Curso</th>
                  <th className="table-th">Situação</th>
                </tr>
              </thead>
              <tbody>
                {alunos.slice(0, 5).map(a => (
                  <tr key={a.id} onClick={() => navigate(`/alunos/${a.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="table-td font-medium">{a.nome}</td>
                    <td className="table-td text-slate-500">{a.curso}</td>
                    <td className="table-td">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
                {alunos.length === 0 && (
                  <tr><td colSpan={3} className="table-td text-center text-slate-400 py-8">Nenhum aluno cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Companies */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Empresas ativas</h2>
            <button onClick={() => navigate('/empresas')} className="text-xs font-semibold text-blue-600 hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Empresa</th>
                  <th className="table-th">Plano</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {empresas.slice(0, 5).map(e => (
                  <tr key={e.id} onClick={() => navigate(`/empresas/${e.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="table-td font-medium">{e.nomeFantasia}</td>
                    <td className="table-td text-slate-500 text-xs">{e.plano}</td>
                    <td className="table-td">
                      <span className={e.statusPlano === 'ATIVO' ? 'badge-active' : 'badge-inactive'}>
                        {e.statusPlano || 'ATIVO'}
                      </span>
                    </td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr><td colSpan={3} className="table-td text-center text-slate-400 py-8">Nenhuma empresa cadastrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    'Ativo': 'badge-active',
    'Pendente': 'badge-pending',
    'Cancelado': 'badge-inactive',
  }
  return <span className={map[status] || 'badge-pending'}>{status || 'Pendente'}</span>
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-xl" />)}
      </div>
    </div>
  )
}

function UsersIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function MoneyIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function DocIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> }
function BuildingIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> }
