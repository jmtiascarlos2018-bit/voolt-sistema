import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCursos, deleteCurso, saveCurso } from '../api'

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CATEGORY_COLORS = {
  'Tecnologia':  'bg-blue-100 text-blue-700',
  'Design':      'bg-violet-100 text-violet-700',
  'Marketing':   'bg-orange-100 text-orange-700',
  'Gestão':      'bg-emerald-100 text-emerald-700',
  'Idiomas':     'bg-pink-100 text-pink-700',
  'Outro':       'bg-slate-100 text-slate-600',
}

export default function Cursos() {
  const navigate = useNavigate()
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todos')

  const load = () => {
    setLoading(true)
    getCursos().then(setCursos).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, nome) => {
    if (!confirm(`Deseja remover o curso "${nome}"?`)) return
    await deleteCurso(id)
    load()
  }

  const handleToggleAtivo = async (curso) => {
    await saveCurso({ ...curso, ativo: !curso.ativo })
    load()
  }

  const categorias = [...new Set(cursos.map(c => c.categoria).filter(Boolean))]

  const filtered = cursos.filter(c => {
    const matchSearch = (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.descricao || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'Todos' || c.categoria === filterCat
    return matchSearch && matchCat
  })

  const totalAtivos    = cursos.filter(c => c.ativo).length
  const totalInativos  = cursos.filter(c => !c.ativo).length
  const receitaPot     = cursos.filter(c => c.ativo)
    .reduce((s, c) => s + (Number(c.valor || 0) - Number(c.desconto || 0)), 0)

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => navigate('/cursos/novo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Curso
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total de Cursos', value: cursos.length,       icon: '📚', from: 'from-blue-500',    to: 'to-blue-600' },
          { label: 'Cursos Ativos',   value: totalAtivos,         icon: '✅', from: 'from-emerald-500', to: 'to-emerald-600' },
          { label: 'Cursos Inativos', value: totalInativos,       icon: '⏸️', from: 'from-slate-500',   to: 'to-slate-600' },
          { label: 'Receita Potencial', value: fmtBRL(receitaPot), icon: '💰', from: 'from-amber-500',  to: 'to-amber-600', small: true },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className={`font-bold text-slate-800 ${s.small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ────────────────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
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
        <div className="flex gap-2 flex-wrap">
          {['Todos', ...categorias].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterCat === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-slate-500 font-medium">
            {search || filterCat !== 'Todos' ? 'Nenhum curso encontrado com esse filtro.' : 'Nenhum curso cadastrado ainda.'}
          </p>
          {!search && filterCat === 'Todos' && (
            <button onClick={() => navigate('/cursos/novo')}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              + Criar primeiro curso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(curso => (
            <CursoCard
              key={curso.id}
              curso={curso}
              onEdit={() => navigate(`/cursos/${curso.id}`)}
              onDelete={() => handleDelete(curso.id, curso.nome)}
              onToggle={() => handleToggleAtivo(curso)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CursoCard({ curso, onEdit, onDelete, onToggle }) {
  const valFinal = Number(curso.valor || 0) - Number(curso.desconto || 0)
  const catColor = CATEGORY_COLORS[curso.categoria] || 'bg-slate-100 text-slate-600'

  return (
    <div className={`card overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${!curso.ativo ? 'opacity-60' : ''}`}>
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-violet-500" />
      <div className="p-5 flex flex-col flex-1">

        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColor}`}>{curso.categoria}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${curso.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {curso.ativo ? '● Ativo' : '● Inativo'}
          </span>
          {curso.certificado && (
            <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">🎓</span>
          )}
        </div>

        {/* Nome */}
        <h3 className="font-bold text-slate-800 text-base leading-tight mb-2">{curso.nome}</h3>

        {/* Descrição */}
        <p className="text-slate-500 text-xs leading-relaxed mb-4 flex-1 line-clamp-2">
          {curso.descricao || 'Sem descrição.'}
        </p>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: '⏱️', label: 'C.H.',      val: `${curso.cargaHoraria}h` },
            { icon: '🎯', label: 'Nível',     val: curso.nivel },
            { icon: '💻', label: 'Modo',      val: curso.modalidade },
          ].map(i => (
            <div key={i.label} className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">{i.icon} {i.label}</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{i.val}</p>
            </div>
          ))}
        </div>

        {/* Professor */}
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
            {(curso.professor || '?')[0]}
          </span>
          <span className="truncate">{curso.professor}</span>
          {curso.vagas && <span className="ml-auto text-slate-400 flex-shrink-0">{curso.vagas} vagas</span>}
        </div>

        {/* Valor */}
        <div className="flex items-end justify-between mb-4">
          <div>
            {Number(curso.desconto) > 0 && (
              <p className="text-xs text-slate-400 line-through">{fmtBRL(curso.valor)}</p>
            )}
            <p className="text-xl font-bold text-emerald-700">{fmtBRL(valFinal)}</p>
          </div>
          {curso.duracao && <span className="text-xs text-slate-400">{curso.duracao}</span>}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button onClick={onEdit}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
            ✏️ Editar
          </button>
          <button onClick={onToggle}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors border ${
              curso.ativo
                ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={curso.ativo ? 'Inativar' : 'Ativar'}
          >
            {curso.ativo ? '⏸' : '▶'}
          </button>
          <button onClick={onDelete}
            className="py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors border border-red-100"
            title="Excluir">
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
