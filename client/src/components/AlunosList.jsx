import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAlunos, deleteAluno } from '../api'

export default function AlunosList() {
  const [alunos, setAlunos] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    getAlunos().then(setAlunos).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { queueMicrotask(load) }, [load])

  const filtered = alunos.filter(a =>
    [a.nome, a.cpf, a.cursoNome || a.curso].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id, nome) => {
    if (!confirm(`Deseja remover o aluno "${nome}"?`)) return
    await deleteAluno(id)
    load()
  }

  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou curso..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button
          onClick={() => navigate('/alunos/novo')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Aluno
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Nome Completo</th>
                <th className="table-th">CPF</th>
                <th className="table-th">Curso</th>
                <th className="table-th">WhatsApp</th>
                <th className="table-th">Total Pago</th>
                <th className="table-th">Situação</th>
                <th className="table-th w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="table-td text-center py-12 text-slate-400">Carregando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-12 text-slate-400">Nenhum aluno encontrado</td></tr>
              )}
              {!loading && filtered.map(a => (
                <tr key={a.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="table-td font-semibold text-slate-800">{a.nome}</td>
                  <td className="table-td font-mono text-xs">{a.cpf}</td>
                  <td className="table-td text-slate-600">{a.cursoNome || a.curso}</td>
                  <td className="table-td text-slate-500">{a.whatsapp}</td>
                  <td className="table-td text-emerald-700 font-semibold">{fmtBRL(a.entrada)}</td>
                  <td className="table-td">
                    <StatusBadge s={a.status} />
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/alunos/${a.id}`)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(a.id, a.nome)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Excluir">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          {filtered.length} aluno(s) encontrado(s)
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ s }) {
  const map = { Ativo: 'badge-active', Pendente: 'badge-pending', Cancelado: 'badge-inactive' }
  return <span className={map[s] || 'badge-pending'}>{s || 'Pendente'}</span>
}
