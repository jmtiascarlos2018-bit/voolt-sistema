import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCursos, saveCurso } from '../api'

const CATEGORIAS = ['Tecnologia', 'Design', 'Marketing', 'Gestão', 'Idiomas', 'Outro']
const NIVEIS     = ['Básico', 'Intermediário', 'Avançado']
const MODALIDADES = ['Presencial', 'Online', 'Híbrido']
const PROFESSORES = ['João Silva', 'Maria Souza', 'Pedro Santos']

const EMPTY = {
  nome: '', categoria: 'Tecnologia', descricao: '', cargaHoraria: 40,
  duracao: '', modalidade: 'Presencial', nivel: 'Básico',
  valor: 0, desconto: 0, ativo: true, vagas: 20,
  professor: PROFESSORES[0], requisitos: '', objetivos: '', certificado: true,
}

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function uid() { return 'curso-' + Date.now() }

export default function CursoForm() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id

  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState(null)

  // Carregar curso existente
  useEffect(() => {
    if (!isEdit) return
    getCursos().then(list => {
      const c = list.find(x => x.id === id)
      if (c) setForm({ ...EMPTY, ...c })
    })
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const valFinal = Number(form.valor || 0) - Number(form.desconto || 0)

  const handleSave = async () => {
    if (!form.nome.trim()) { showToast('Nome do curso é obrigatório', 'error'); return }
    setSaving(true)
    try {
      await saveCurso({ ...form, id: id || uid() })
      showToast(isEdit ? 'Curso atualizado! ✅' : 'Curso criado com sucesso! ✅')
      setTimeout(() => navigate('/cursos'), 1200)
    } catch (e) {
      showToast('Erro: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }



  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white flex items-center gap-2
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          style={{ animation: 'slideIn 0.3s ease-out' }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      <div className="space-y-6">

        {/* ── Seção 1: Identificação ─────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="section-title"><span>📚</span> 1. Identificação do Curso</h2>

          <div className="grid grid-cols-12 gap-4">
            {/* Nome */}
            <div className="col-span-8">
              <label className="form-label">Nome do Curso *</label>
              <input
                className="form-input text-lg font-semibold"
                placeholder="Ex: Marketing Digital Avançado"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
              />
            </div>

            {/* Categoria */}
            <div className="col-span-4">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Descrição */}
            <div className="col-span-12">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-input h-24 resize-none"
                placeholder="Descreva o conteúdo, abordagem e público-alvo do curso..."
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
              />
            </div>

            {/* Objetivos */}
            <div className="col-span-6">
              <label className="form-label">Objetivos do Curso</label>
              <textarea
                className="form-input h-20 resize-none"
                placeholder="Ao concluir, o aluno será capaz de..."
                value={form.objetivos}
                onChange={e => set('objetivos', e.target.value)}
              />
            </div>

            {/* Pré-requisitos */}
            <div className="col-span-6">
              <label className="form-label">Pré-requisitos</label>
              <textarea
                className="form-input h-20 resize-none"
                placeholder="Ex: Noções básicas de informática, acesso à internet..."
                value={form.requisitos}
                onChange={e => set('requisitos', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Seção 2: Estrutura ─────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="section-title"><span>⚙️</span> 2. Estrutura e Configurações</h2>

          <div className="grid grid-cols-12 gap-4">
            {/* Carga Horária */}
            <div className="col-span-2">
              <label className="form-label">Carga Horária (h)</label>
              <input
                type="number" min={1}
                className="form-input text-center font-bold"
                value={form.cargaHoraria}
                onChange={e => set('cargaHoraria', e.target.value)}
              />
            </div>

            {/* Duração */}
            <div className="col-span-3">
              <label className="form-label">Duração</label>
              <input
                className="form-input"
                placeholder="Ex: 3 meses / 12 semanas"
                value={form.duracao}
                onChange={e => set('duracao', e.target.value)}
              />
            </div>

            {/* Vagas */}
            <div className="col-span-2">
              <label className="form-label">Nº de Vagas</label>
              <input
                type="number" min={1}
                className="form-input text-center"
                value={form.vagas}
                onChange={e => set('vagas', e.target.value)}
              />
            </div>

            {/* Nível */}
            <div className="col-span-2">
              <label className="form-label">Nível</label>
              <select className="form-select" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
                {NIVEIS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>

            {/* Modalidade */}
            <div className="col-span-3">
              <label className="form-label">Modalidade</label>
              <select className="form-select" value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
                {MODALIDADES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Professor */}
            <div className="col-span-4">
              <label className="form-label">Professor / Instrutor</label>
              <select className="form-select" value={form.professor} onChange={e => set('professor', e.target.value)}>
                {PROFESSORES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Status / Certificado */}
            <div className="col-span-8 flex items-end gap-8 pb-1">
              <Toggle
                label="Curso Ativo"
                checked={form.ativo}
                onChange={v => set('ativo', v)}
                colorOn="emerald"
              />
              <Toggle
                label="Emite Certificado"
                checked={form.certificado}
                onChange={v => set('certificado', v)}
                colorOn="blue"
              />
            </div>
          </div>
        </div>

        {/* ── Seção 3: Financeiro ────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="section-title"><span>💰</span> 3. Valores e Preços</h2>

          <div className="grid grid-cols-12 gap-6">
            {/* Inputs */}
            <div className="col-span-8 grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Valor do Curso (R$)</label>
                <input
                  type="number" min={0} step="0.01"
                  className="form-input font-bold text-blue-700 text-lg"
                  value={form.valor}
                  onChange={e => set('valor', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Desconto (R$)</label>
                <input
                  type="number" min={0} step="0.01"
                  className="form-input"
                  value={form.desconto}
                  onChange={e => set('desconto', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Valor Final</label>
                <div className="form-input bg-slate-50 font-bold text-emerald-700 text-lg">
                  {fmtBRL(valFinal)}
                </div>
              </div>
            </div>

            {/* Card resumo */}
            <div className="col-span-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-5 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo do Curso</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Valor bruto</span>
                  <span className="font-bold">{fmtBRL(form.valor)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Desconto</span>
                  <span className="font-bold text-red-400">- {fmtBRL(form.desconto)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-slate-300 text-sm">Valor final</span>
                  <span className="font-bold text-emerald-400 text-lg">{fmtBRL(valFinal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ── Barra de Ações ─────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving
              ? <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Salvando...</>
              : <><SaveIcon /> {isEdit ? 'Salvar Alterações' : 'Criar Curso'}</>
            }
          </button>
          <button
            onClick={() => set('ativo', !form.ativo)}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg ${
              form.ativo
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
            }`}
          >
            {form.ativo ? <PauseIcon /> : <PlayIcon />}
            {form.ativo ? 'Inativar' : 'Ativar'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cursos')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
          >
            <BackIcon /> Voltar
          </button>
        </div>
      </div>

      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform: translateX(20px); }
          to   { opacity:1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange, colorOn = 'blue' }) {
  const onClass = colorOn === 'emerald' ? 'bg-emerald-500' : 'bg-blue-600'
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? onClass : 'bg-slate-200'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function SaveIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}
function BackIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
