import { useEffect, useState, useMemo } from 'react'
import { getAlunos, getEmpresas } from '../api'

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Relatorios() {
  const [alunos, setAlunos]   = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [filterTipo, setFilterTipo] = useState('Todos')       // Todos | Aluno | Empresa
  const [filterForma, setFilterForma] = useState('Todos')     // Todos | Parcelado | Boleto | Pix | Cartão
  const [filterStatus, setFilterStatus] = useState('Todos')   // Todos | PAGO | ATIVO | INATIVO
  const [filterMes, setFilterMes] = useState('Todos')         // Todos | 06/2026 ...

  useEffect(() => {
    Promise.all([getAlunos(), getEmpresas()])
      .then(([a, e]) => { setAlunos(a); setEmpresas(e) })
      .finally(() => setLoading(false))
  }, [])

  // ── Montar linhas unificadas ─────────────────────────────────────────────────
  const allRows = useMemo(() => {
    const extractMes = (str) => {
      if (!str) return 'Sem data'
      const match = str.match(/^(\d{4})-(\d{2})/)
      if (match) return `${match[2]}/${match[1]}`
      return 'Sem data'
    }

    const rowsAlunos = alunos.map(a => ({
      id:     a.id,
      nome:   a.nome,
      desc:   a.curso,
      valor:  a.entrada || 0,
      valorTotalContrato: a.valorTotal || 0,
      forma:  a.formaPagamento || 'Parcelado',
      status: 'PAGO',
      tipo:   'Aluno',
      mes:    extractMes(a.dataInicio || a.createdAt),
    }))
    const rowsEmpresas = empresas.map(e => ({
      id:     e.id,
      nome:   e.nomeFantasia || e.razaoSocial,
      desc:   e.plano,
      valor:  e.valorMensal || 0,
      valorTotalContrato: e.valorMensal || 0,
      forma:  e.formaPagamento || 'Boleto',
      status: e.statusPlano || 'ATIVO',
      tipo:   'Empresa',
      mes:    extractMes(e.dataInicio || e.createdAt),
    }))
    return [...rowsAlunos, ...rowsEmpresas]
  }, [alunos, empresas])

  // ── Opções dinâmicas para selects ────────────────────────────────────────────
  const formasDisponiveis = useMemo(() => {
    const s = new Set(allRows.map(r => r.forma).filter(Boolean))
    return ['Todos', ...Array.from(s).sort()]
  }, [allRows])

  const statusDisponiveis = useMemo(() => {
    const s = new Set(allRows.map(r => r.status).filter(Boolean))
    return ['Todos', ...Array.from(s).sort()]
  }, [allRows])

  const mesesDisponiveis = useMemo(() => {
    const s = new Set(allRows.map(r => r.mes).filter(m => m !== 'Sem data'))
    // Ordena do mais recente para o mais antigo, simples fallback alfabético inverso
    return ['Todos', ...Array.from(s).sort().reverse()]
  }, [allRows])

  // ── Aplicar filtros ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allRows.filter(r => {
      const matchSearch = !search.trim() ||
        r.nome?.toLowerCase().includes(search.toLowerCase()) ||
        r.desc?.toLowerCase().includes(search.toLowerCase())
      const matchTipo   = filterTipo   === 'Todos' || r.tipo   === filterTipo
      const matchForma  = filterForma  === 'Todos' || r.forma  === filterForma
      const matchStatus = filterStatus === 'Todos' || r.status === filterStatus
      const matchMes    = filterMes    === 'Todos' || r.mes    === filterMes
      return matchSearch && matchTipo && matchForma && matchStatus && matchMes
    })
  }, [allRows, search, filterTipo, filterForma, filterStatus, filterMes])

  // ── Totalizadores dos filtrados ───────────────────────────────────────────────
  const { totalPago, totalContratado, totalEmpresas, totalFiltrado } = useMemo(() => {
    let pago = 0, contratado = 0, emp = 0, filtrado = 0
    filtered.forEach(r => {
      filtrado += r.valor || 0
      if (r.tipo === 'Aluno') {
        pago += r.valor || 0
        contratado += r.valorTotalContrato || 0
      } else {
        emp += r.valor || 0
      }
    })
    return { totalPago: pago, totalContratado: contratado, totalEmpresas: emp, totalFiltrado: filtrado }
  }, [filtered])
  
  const totalPendente = totalContratado - totalPago

  const stats = [
    { label: 'Faturamento Pago',    value: fmtBRL(totalPago),                  icon: '💰', color: 'emerald' },
    { label: 'Faturamento Previsto', value: fmtBRL(totalPendente),             icon: '⏳', color: 'amber'   },
    { label: 'Total Empresas/mês',  value: fmtBRL(totalEmpresas),              icon: '🏢', color: 'violet'  },
    { label: 'Total Geral',         value: fmtBRL(totalContratado + totalEmpresas), icon: '📊', color: 'blue' },
  ]

  const hasActiveFilter = search || filterTipo !== 'Todos' || filterForma !== 'Todos' || filterStatus !== 'Todos' || filterMes !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setFilterTipo('Todos')
    setFilterForma('Todos')
    setFilterStatus('Todos')
    setFilterMes('Todos')
  }

  return (
    <div className="space-y-6">

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
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

      {/* ── Painel de Filtros ─────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Busca por nome */}
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="form-input pl-9"
              placeholder="Buscar por nome ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Mês */}
          <div className="flex flex-col gap-1 min-w-36">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mês</label>
            <select className="form-select" value={filterMes} onChange={e => setFilterMes(e.target.value)}>
              {mesesDisponiveis.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Tipo: Aluno / Empresa */}
          <div className="flex flex-col gap-1 min-w-36">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</label>
            <select className="form-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
              <option>Todos</option>
              <option>Aluno</option>
              <option>Empresa</option>
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div className="flex flex-col gap-1 min-w-44">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Forma de Pagamento</label>
            <select className="form-select" value={filterForma} onChange={e => setFilterForma(e.target.value)}>
              {formasDisponiveis.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 min-w-36">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {statusDisponiveis.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Limpar Filtros */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span>
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilter && ` de ${allRows.length} total`}
          </span>
          {hasActiveFilter && (
            <span className="font-semibold text-blue-600">
              Total filtrado: {fmtBRL(totalFiltrado)}
            </span>
          )}
        </div>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">📜 Demonstrativo de Recebimentos</h2>
          {hasActiveFilter && (
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              Filtrado
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Mês</th>
                <th className="table-th">Aluno / Empresa</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Descrição</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Forma</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="table-td text-center py-8 text-slate-400">Carregando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center py-10">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-slate-400 text-sm">Nenhum registro encontrado com esses filtros.</p>
                    <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:underline">
                      Limpar filtros
                    </button>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(r => (
                <tr key={r.id + r.tipo} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td text-xs font-medium text-slate-400">{r.mes}</td>
                  <td className="table-td font-medium">{r.nome}</td>
                  <td className="table-td">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.tipo === 'Aluno'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}>
                      {r.tipo}
                    </span>
                  </td>
                  <td className="table-td text-slate-500 text-xs">{r.desc}</td>
                  <td className={`table-td font-semibold ${r.tipo === 'Aluno' ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {fmtBRL(r.valor)}
                  </td>
                  <td className="table-td text-xs">{r.forma}</td>
                  <td className="table-td">
                    <span className={
                      r.status === 'PAGO' || r.status === 'ATIVO'
                        ? 'badge-active'
                        : 'badge-inactive'
                    }>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
