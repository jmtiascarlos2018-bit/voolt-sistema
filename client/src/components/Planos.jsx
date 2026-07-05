import { useCallback, useEffect, useState } from 'react'
import { getPlanos, savePlano, deletePlano } from '../api'

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const colors = {
  blue:   { border: 'border-blue-500', badge: 'bg-blue-100 text-blue-700', title: 'text-blue-600' },
  violet: { border: 'border-violet-500', badge: 'bg-violet-100 text-violet-700', title: 'text-violet-600' },
  emerald:{ border: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-600' },
  slate:  { border: 'border-slate-500', badge: 'bg-slate-100 text-slate-700', title: 'text-slate-600' },
}

export default function Planos() {
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form edit/new state
  const [showForm, setShowForm] = useState(false)
  const [editingPlano, setEditingPlano] = useState(null)
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    descricao: '',
    beneficios: '',
    limiteUsuarios: '',
    ativo: true
  })

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const targetUrl = '/api/planos'
    console.log(`[FRONTEND] Efetuando requisição GET para a URL: ${targetUrl}`)
    getPlanos()
      .then(data => {
        console.log(`[FRONTEND SUCCESS] Dados retornados com sucesso para ${targetUrl}:`, data)
        setPlanos(data)
      })
      .catch(err => {
        console.error(`[FRONTEND ERROR] Erro ao buscar planos de ${targetUrl}:`, err)
        if (err.response) {
          console.error(`[FRONTEND ERROR] Status HTTP: ${err.response.status}. Corpo da resposta:`, err.response.data)
        }
        setError(`Erro ao carregar os planos. Erro: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  const handleEdit = (p) => {
    setEditingPlano(p)
    setForm({
      nome: p.nome,
      valor: p.valor,
      descricao: p.descricao || '',
      beneficios: p.beneficios || '',
      limiteUsuarios: p.limiteUsuarios || '',
      ativo: !!p.ativo
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingPlano(null)
    setForm({
      nome: '',
      valor: '',
      descricao: '',
      beneficios: '',
      limiteUsuarios: '',
      ativo: true
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return alert('Nome do plano é obrigatório')
    if (form.valor === '') return alert('Valor mensal é obrigatório')

    try {
      const data = {
        ...form,
        id: editingPlano ? editingPlano.id : undefined,
        valor: parseFloat(form.valor) || 0,
        limiteUsuarios: parseInt(form.limiteUsuarios) || 5,
        ativo: form.ativo ? 1 : 0
      }
      await savePlano(data)
      setShowForm(false)
      load()
    } catch (err) {
      alert('Erro ao salvar plano: ' + err.message)
    }
  }

  const handleDelete = async (id, nome) => {
    if (!confirm(`Deseja remover o plano "${nome}"?`)) return
    try {
      await deletePlano(id)
      load()
    } catch (err) {
      alert('Erro ao deletar plano: ' + err.message)
    }
  }

  const handleToggleAtivo = async (p) => {
    try {
      await savePlano({ ...p, ativo: !p.ativo })
      load()
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message)
    }
  }

  // Determine colors based on order or name
  const getColors = (nome, index) => {
    const clean = (nome || '').toLowerCase()
    if (clean.includes('profissional')) return colors.blue
    if (clean.includes('avançado') || clean.includes('avancado')) return colors.violet
    if (clean.includes('premium') || clean.includes('empresarial')) return colors.emerald
    const keys = Object.keys(colors)
    return colors[keys[index % keys.length]]
  }

  const activePlanos = planos.filter(p => p.ativo)

  return (
    <div className="space-y-6">
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-6 text-center border-red-200 bg-red-50 text-red-700">
          <p className="font-semibold">{error}</p>
          <button onClick={load} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Plans List Cards (Only active) */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Planos de Tráfego Disponíveis</h2>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
            >
              + Novo Plano
            </button>
          </div>

          {activePlanos.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <span className="text-4xl block mb-2">📄</span>
              Nenhum plano ativo cadastrado no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activePlanos.map((p, idx) => {
                const c = getColors(p.nome, idx)
                const items = p.beneficios ? p.beneficios.split(',') : []
                return (
                  <div key={p.id} className={`card p-6 border-t-4 ${c.border} flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-md`}>
                    <div className="flex items-start justify-between">
                      <h3 className={`font-bold text-sm ${c.title}`}>{p.nome}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                        Usuários: {p.limiteUsuarios || 'N/A'}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">
                      {fmtBRL(p.valor)} <span className="text-sm font-normal text-slate-400">/ mês</span>
                    </div>
                    {p.descricao && <p className="text-xs text-slate-500 leading-relaxed">{p.descricao}</p>}
                    {items.length > 0 && (
                      <ul className="space-y-2 mt-2">
                        {items.map(i => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">✔</span>
                            {i}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Management list section */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>⚙️</span> Painel de Gerenciamento de Planos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="table-th text-left">Nome do Plano</th>
                    <th className="table-th text-left">Valor Mensal</th>
                    <th className="table-th text-center">Usuários</th>
                    <th className="table-th text-center">Status</th>
                    <th className="table-th w-24 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {planos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <td className="table-td font-semibold text-slate-800">
                        {p.nome}
                        {p.descricao && <p className="text-[10px] text-slate-400 font-normal">{p.descricao}</p>}
                      </td>
                      <td className="table-td font-bold text-emerald-700">{fmtBRL(p.valor)}</td>
                      <td className="table-td text-center text-slate-600">{p.limiteUsuarios}</td>
                      <td className="table-td text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${p.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(p)} className="p-1 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 transition-colors" title="Editar">
                            ✏️
                          </button>
                          <button onClick={() => handleToggleAtivo(p)} className={`p-1 rounded transition-colors ${p.ativo ? 'bg-amber-50 hover:bg-amber-100 text-amber-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'}`} title={p.ativo ? 'Inativar' : 'Ativar'}>
                            {p.ativo ? '⏸' : '▶'}
                          </button>
                          <button onClick={() => handleDelete(p.id, p.nome)} className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Excluir">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {planos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-td text-center text-slate-400 py-6">Nenhum plano cadastrado. Clique em "+ Novo Plano" para começar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit/New Form View Modal/Panel */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ animation: 'slideIn 0.2s ease-out' }}>
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base">{editingPlano ? '✏️ Editar Plano' : '➕ Novo Plano'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white hover:text-slate-200 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="form-label">Nome do Plano *</label>
                <input
                  className="form-input"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value.toUpperCase() })}
                  placeholder="Ex: PLANO ULTRA"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Valor Mensal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-bold"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                    placeholder="Ex: 3500"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Limite de Usuários</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.limiteUsuarios}
                    onChange={e => setForm({ ...form, limiteUsuarios: e.target.value })}
                    placeholder="Ex: 5"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Descrição Breve</label>
                <input
                  className="form-input"
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Gestão avançada de tráfego pago para e-commerce."
                />
              </div>

              <div>
                <label className="form-label">Benefícios (separe por vírgulas)</label>
                <textarea
                  className="form-input h-20 resize-none text-xs"
                  value={form.beneficios}
                  onChange={e => setForm({ ...form, beneficios: e.target.value })}
                  placeholder="Ex: Criação de anúncios,Suporte 24/7,Gestão de orçamentos"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo-chk"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={form.ativo}
                  onChange={e => setForm({ ...form, ativo: e.target.checked })}
                />
                <label htmlFor="ativo-chk" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  Plano Ativo (aparece no cadastro da empresa)
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
