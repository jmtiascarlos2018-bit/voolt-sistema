import { useEffect, useMemo, useState } from 'react'
import { deleteContaPagar, getContasPagar, marcarContaPaga, saveContaPagar } from '../api'

const EMPTY_FORM = {
  descricao: '',
  categoria: '',
  valor: '',
  data_vencimento: '',
  data_pagamento: '',
  forma_pagamento: '',
  recorrencia: 'Única',
  prioridade: 'Média',
  observacoes: '',
  status: 'pendente',
}

const STATUS = ['Todos', 'pendente', 'pago', 'vencido', 'cancelado']
const RECORRENCIAS = ['Única', 'Mensal', 'Trimestral', 'Semestral', 'Anual']
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente']

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ContasPagar() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = () => {
    setLoading(true)
    setError('')
    getContasPagar()
      .then(setContas)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { queueMicrotask(load) }, [])

  const filtered = useMemo(() => {
    if (filterStatus === 'Todos') return contas
    return contas.filter(conta => conta.status === filterStatus)
  }, [contas, filterStatus])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (conta) => {
    setForm({ ...EMPTY_FORM, ...conta, valor: String(conta.valor || '') })
    setEditingId(conta.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.descricao.trim()) return alert('Descrição é obrigatória')
    if (!form.data_vencimento) return alert('Data de vencimento é obrigatória')
    setSaving(true)
    try {
      await saveContaPagar({ ...form, id: editingId || undefined, valor: Number(form.valor || 0) })
      closeForm()
      load()
    } catch (err) {
      alert('Erro ao salvar despesa: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePay = async (conta) => {
    try {
      await marcarContaPaga(conta.id, {
        data_pagamento: new Date().toISOString().slice(0, 10),
        forma_pagamento: conta.forma_pagamento,
      })
      load()
    } catch (err) {
      alert('Erro ao marcar como paga: ' + err.message)
    }
  }

  const handleDelete = async (conta) => {
    if (!confirm(`Excluir a despesa "${conta.descricao}"?`)) return
    try {
      await deleteContaPagar(conta.id)
      load()
    } catch (err) {
      alert('Erro ao excluir despesa: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select className="form-select w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {STATUS.map(status => <option key={status}>{status}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} despesa(s)</span>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md">
          Nova Despesa
        </button>
      </div>

      {error && (
        <div className="card p-5 border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold">Tentar novamente</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Descrição</th>
                <th className="table-th">Categoria</th>
                <th className="table-th">Vencimento</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Prioridade</th>
                <th className="table-th">Status</th>
                <th className="table-th w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="table-td text-center py-12 text-slate-400">Carregando...</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-12 text-slate-400">Nenhuma despesa encontrada</td></tr>
              )}
              {!loading && filtered.map(conta => (
                <tr key={conta.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <p className="font-semibold text-slate-800">{conta.descricao}</p>
                    {conta.observacoes && <p className="text-xs text-slate-400 mt-0.5">{conta.observacoes}</p>}
                  </td>
                  <td className="table-td">{conta.categoria || '-'}</td>
                  <td className="table-td">{formatDate(conta.data_vencimento)}</td>
                  <td className="table-td font-bold text-slate-800">{fmtBRL(conta.valor)}</td>
                  <td className="table-td"><PriorityBadge value={conta.prioridade} /></td>
                  <td className="table-td"><StatusBadge status={conta.status} /></td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                        <button onClick={() => handlePay(conta)} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold">
                          Pagar
                        </button>
                      )}
                      <button onClick={() => openEdit(conta)} className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(conta)} className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="bg-blue-700 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold">{editingId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button onClick={closeForm} className="text-white font-bold">X</button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-6">
                <label className="form-label">Descrição *</label>
                <input className="form-input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} required />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Categoria</label>
                <input type="text" className="form-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Digite a categoria..." />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Valor *</label>
                <input type="number" min="0" step="0.01" className="form-input font-bold" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Vencimento *</label>
                <input type="date" className="form-input" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })} required />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Pagamento</label>
                <input type="date" className="form-input" value={form.data_pagamento || ''} onChange={e => setForm({ ...form, data_pagamento: e.target.value })} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Forma de pagamento</label>
                <input className="form-input" value={form.forma_pagamento || ''} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })} placeholder="Pix, boleto, cartão..." />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Recorrência</label>
                <select className="form-select" value={form.recorrencia} onChange={e => setForm({ ...form, recorrencia: e.target.value })}>
                  {RECORRENCIAS.map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Prioridade</label>
                <select className="form-select" value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
                  {PRIORIDADES.map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUS.filter(item => item !== 'Todos').map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="col-span-12">
                <label className="form-label">Observações</label>
                <textarea className="form-input resize-none h-20" value={form.observacoes || ''} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <div className="col-span-12 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

function PriorityBadge({ value }) {
  const map = {
    Baixa: 'bg-slate-100 text-slate-600',
    Média: 'bg-blue-100 text-blue-700',
    Alta: 'bg-amber-100 text-amber-700',
    Urgente: 'bg-red-100 text-red-600',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[value] || map.Média}`}>{value || 'Média'}</span>
}
