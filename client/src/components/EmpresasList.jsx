import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmpresas, deleteEmpresa } from '../api'

export default function EmpresasList() {
  const [empresas, setEmpresas] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    getEmpresas().then(setEmpresas).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = empresas.filter(e =>
    [e.nomeFantasia, e.cnpj, e.planoNome || e.plano].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id, nome) => {
    if (!confirm(`Deseja remover a empresa "${nome}"?`)) return
    await deleteEmpresa(id)
    load()
  }

  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Buscar por fantasia, CNPJ ou plano..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" />
        </div>
        <button onClick={() => navigate('/empresas/novo')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nova Empresa
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Nome Fantasia</th>
                <th className="table-th">CNPJ</th>
                <th className="table-th">Plano</th>
                <th className="table-th">Valor Mensal</th>
                <th className="table-th">Status</th>
                <th className="table-th w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="table-td text-center py-12 text-slate-400">Carregando...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="table-td text-center py-12 text-slate-400">Nenhuma empresa encontrada</td></tr>}
              {!loading && filtered.map(e => (
                <tr key={e.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="table-td font-semibold text-slate-800">{e.nomeFantasia}</td>
                  <td className="table-td font-mono text-xs">{e.cnpj}</td>
                  <td className="table-td text-xs text-slate-500">{e.planoNome || e.plano}</td>
                  <td className="table-td font-semibold text-blue-700">{fmtBRL(e.valorMensal)}</td>
                  <td className="table-td">
                    <span className={e.statusPlano === 'ATIVO' ? 'badge-active' : 'badge-inactive'}>{e.statusPlano || 'ATIVO'}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/empresas/${e.id}`)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(e.id, e.nomeFantasia)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">{filtered.length} empresa(s) encontrada(s)</div>
      </div>
    </div>
  )
}
