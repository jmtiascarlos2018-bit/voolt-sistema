import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEmpresas, saveEmpresa, saveCampanha, getPlanos } from '../api'

function uid() { return 'emp-' + Date.now() }

export default function EmpresaForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [tab, setTab] = useState('dados')
  const [saving, setSaving] = useState(false)

  const [planosList, setPlanosList] = useState([])
  const [allPlanos, setAllPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [planosError, setPlanosError] = useState(null)

  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
    segmento: 'Marketing Digital', porte: 'Pequena', telefone: '', whatsapp: '', email: '', site: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    plano: '', dataInicio: '', dataTermino: '', diaVencimento: 'Todo dia 10',
    statusPlano: 'ATIVO', usuariosContratados: 5, descricaoPlano: '',
    valorMensal: 0, desconto: 0, taxas: 0, formaPagamento: 'Boleto Bancário',
    primeiroVencimento: '', observacoesFinanceiras: '',
    contratoAssinado: false, documentoAnexado: false, renovacaoAutomatica: true,
    documentos: [], campanhas: [],
  })

  // Carregar planos dinamicamente
  useEffect(() => {
    setLoadingPlanos(true)
    const url = '/api/planos'
    console.log(`[FRONTEND EmpresaForm] Solicitando planos via GET de: ${url}`)
    getPlanos()
      .then(list => {
        console.log(`[FRONTEND SUCCESS EmpresaForm] Planos carregados com sucesso:`, list)
        setAllPlanos(list)
        const ativos = list.filter(p => p.ativo)
        setPlanosList(ativos)
        if (!isEdit && ativos.length > 0) {
          setForm(f => ({ ...f, plano: ativos[0].id, valorMensal: ativos[0].valor }))
        }
        setLoadingPlanos(false)
      })
      .catch(err => {
        console.error(`[FRONTEND ERROR EmpresaForm] Erro ao carregar planos de ${url}:`, err)
        setPlanosError(`Erro ao carregar planos: ${err.message}`)
        setLoadingPlanos(false)
      })
  }, [isEdit])

  // Normalizar plano de nome para ID caso seja registro antigo (legado)
  useEffect(() => {
    if (form.plano && allPlanos.length > 0) {
      const foundById = allPlanos.find(p => p.id === form.plano)
      if (!foundById) {
        const foundByName = allPlanos.find(p => p.nome.toLowerCase() === form.plano.toLowerCase())
        if (foundByName) {
          setForm(f => ({ ...f, plano: foundByName.id }))
        }
      }
    }
  }, [form.plano, allPlanos])

  useEffect(() => {
    if (!isEdit) return
    getEmpresas().then(list => {
      const e = list.find(x => x.id === id)
      if (e) setForm(f => ({
        ...f, ...e,
        documentos: typeof e.documentos === 'string' ? e.documentos.split(',').filter(Boolean) : (e.documentos || []),
        campanhas: e.campanhas || [],
        contratoAssinado: !!e.contratoAssinado,
        documentoAnexado: !!e.documentoAnexado,
        renovacaoAutomatica: e.renovacaoAutomatica !== 0,
      }))
    })
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const comDesconto = (parseFloat(form.valorMensal) || 0) * (1 - (parseFloat(form.desconto) || 0) / 100)
  const valorTotal = comDesconto + (parseFloat(form.taxas) || 0)
  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleSave = async () => {
    if (!form.nomeFantasia.trim()) { alert('Nome Fantasia é obrigatório'); return }
    setSaving(true)
    try {
      await saveEmpresa({ ...form, id: id || uid(), valorComDesconto: comDesconto, valorTotal })
      alert('Empresa salva com sucesso!')
      navigate('/empresas')
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  const buscarCEP = async () => {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (!d.erro) setForm(f => ({ ...f, endereco: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }))
    } catch {}
  }



  const tabs = [
    { key: 'dados', label: '📋 1. Dados da Empresa' },
    { key: 'contrato', label: '📄 2. Plano & Contrato' },
    { key: 'financeiro', label: '💰 3. Financeiro' },
    { key: 'meta', label: '🚀 4. Meta Ads' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs header */}
      <div className="bg-white border-b border-slate-100 px-6 flex gap-1 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {tab === 'dados' && (
          <div className="card p-6">
            <h2 className="section-title"><span>🏢</span> Cadastro da Empresa</h2>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4"><label className="form-label">Razão Social *</label><input className="form-input" value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} /></div>
              <div className="col-span-4"><label className="form-label">Nome Fantasia *</label><input className="form-input" value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} /></div>
              <div className="col-span-4 row-span-4 bg-blue-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Endereço Corporativo</p>
                <div><label className="form-label">CEP</label>
                  <div className="flex gap-2">
                    <input className="form-input flex-1" value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="45000-000" />
                    <button onClick={buscarCEP} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">Buscar CEP</button>
                  </div>
                </div>
                <div><label className="form-label">Endereço</label><input className="form-input" value={form.endereco} onChange={e => set('endereco', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="form-label">Número</label><input className="form-input" value={form.numero} onChange={e => set('numero', e.target.value)} /></div>
                  <div><label className="form-label">Sala/Conj.</label><input className="form-input" value={form.complemento} onChange={e => set('complemento', e.target.value)} /></div>
                </div>
                <div><label className="form-label">Bairro</label><input className="form-input" value={form.bairro} onChange={e => set('bairro', e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2"><label className="form-label">Cidade</label><input className="form-input" value={form.cidade} onChange={e => set('cidade', e.target.value)} /></div>
                  <div><label className="form-label">UF</label><input className="form-input" maxLength={2} value={form.estado} onChange={e => set('estado', e.target.value.toUpperCase())} /></div>
                </div>
              </div>
              <div className="col-span-4"><label className="form-label">CNPJ *</label><input className="form-input font-mono" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" /></div>
              <div className="col-span-4"><label className="form-label">Inscrição Estadual</label><input className="form-input" value={form.inscricaoEstadual} onChange={e => set('inscricaoEstadual', e.target.value)} /></div>
              <div className="col-span-4"><label className="form-label">Segmento</label>
                <input className="form-input" value={form.segmento} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Tecnologia, Estética, Varejo" />
              </div>
              <div className="col-span-4"><label className="form-label">Porte</label>
                <select className="form-select" value={form.porte} onChange={e => set('porte', e.target.value)}>
                  {['Pequena','Média','Grande'].map(o => <option key={o}>{o} Empresa</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="form-label">Telefone</label><input className="form-input" value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div>
              <div className="col-span-2"><label className="form-label">WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></div>
              <div className="col-span-2"><label className="form-label">E-mail</label><input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div className="col-span-2"><label className="form-label">Site</label><input className="form-input" value={form.site} onChange={e => set('site', e.target.value)} /></div>
            </div>
          </div>
        )}

        {tab === 'contrato' && (
          <div className="card p-6 space-y-5">
            <h2 className="section-title"><span>📋</span> Plano Contratado</h2>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <label className="form-label">Plano Contratado</label>
                <select className="form-select" value={form.plano} onChange={e => {
                  const selectedId = e.target.value
                  const p = allPlanos.find(x => x.id === selectedId)
                  setForm(f => ({
                    ...f,
                    plano: selectedId,
                    valorMensal: p ? p.valor : f.valorMensal
                  }))
                }}>
                  <option value="">- Selecione um Plano -</option>
                  {planosList.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                  {form.plano && !planosList.some(p => p.id === form.plano) && (() => {
                    const p = allPlanos.find(x => x.id === form.plano)
                    return p ? (
                      <option key={p.id} value={p.id}>{p.nome} (Inativo)</option>
                    ) : null
                  })()}
                </select>
                {loadingPlanos && <p className="text-[10px] text-slate-400 mt-1">Carregando planos...</p>}
                {planosError && <p className="text-[10px] text-red-500 mt-1">{planosError}</p>}
                {!loadingPlanos && !planosError && planosList.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">Nenhum plano ativo cadastrado.</p>
                )}
              </div>
              <div className="col-span-2"><label className="form-label">Data Inicial</label><input type="date" className="form-input" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} /></div>
              <div className="col-span-2"><label className="form-label">Data Término</label><input type="date" className="form-input" value={form.dataTermino} onChange={e => set('dataTermino', e.target.value)} /></div>
              <div className="col-span-2"><label className="form-label">Vencimento</label>
                <select className="form-select" value={form.diaVencimento} onChange={e => set('diaVencimento', e.target.value)}>
                  {['Todo dia 05','Todo dia 10','Todo dia 15','Todo dia 20'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="form-label">Status</label>
                <select className="form-select" value={form.statusPlano} onChange={e => set('statusPlano', e.target.value)}>
                  <option>ATIVO</option><option>INATIVO</option>
                </select>
              </div>
              <div className="col-span-12 flex items-center gap-8">
                {[{label:'Contrato Assinado',key:'contratoAssinado'},{label:'Documento Anexado',key:'documentoAnexado'},{label:'Renovação Automática',key:'renovacaoAutomatica'}].map(({label,key}) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{label}:</span>
                    <button onClick={() => set(key,true)} className={`px-3 py-1 rounded-l-lg text-xs font-bold border ${form[key] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200'}`}>Sim</button>
                    <button onClick={() => set(key,false)} className={`px-3 py-1 rounded-r-lg text-xs font-bold border ${!form[key] ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'}`}>Não</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'financeiro' && (
          <div className="card p-6">
            <h2 className="section-title"><span>💰</span> Controle Financeiro</h2>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div><label className="form-label">Valor Mensal (R$)</label><input type="number" className="form-input font-bold text-blue-700" value={form.valorMensal} onChange={e => set('valorMensal', e.target.value)} /></div>
              <div><label className="form-label">Desconto (%)</label><input type="number" className="form-input" value={form.desconto} onChange={e => set('desconto', e.target.value)} /></div>
              <div><label className="form-label">c/ Desconto</label><div className="form-input bg-slate-50 font-semibold text-slate-700">{fmtBRL(comDesconto)}</div></div>
              <div><label className="form-label">Taxas (R$)</label><input type="number" className="form-input" value={form.taxas} onChange={e => set('taxas', e.target.value)} /></div>
              <div><label className="form-label">Valor Total</label><div className="form-input bg-slate-50 font-semibold text-emerald-700">{fmtBRL(valorTotal)}</div></div>
            </div>
            <p className="text-sm text-slate-400 text-center py-8">Configure o início do contrato na aba Plano & Contrato para gerar as parcelas mensais automaticamente.</p>
          </div>
        )}

        {tab === 'meta' && (
          <div className="card p-6">
            <h2 className="section-title" style={{color:'#2563eb'}}><span>🚀</span> Campanhas Meta Ads</h2>
            <div className="bg-blue-50 border border-dashed border-blue-200 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">➕ Adicionar Campanha</h4>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-2"><label className="form-label">Nome da Campanha</label><input id="camp-nome" className="form-input" placeholder="[Conversão] Vendas..." /></div>
                <div><label className="form-label">Orçamento/dia (R$)</label><input id="camp-budget" type="number" className="form-input" placeholder="50" /></div>
                <div><label className="form-label">Total Investido (R$)</label><input id="camp-spent" type="number" className="form-input" placeholder="1000" /></div>
                <div><label className="form-label">Leads</label><input id="camp-leads" type="number" className="form-input" placeholder="80" /></div>
                <div><label className="form-label">Cliques</label><input id="camp-clicks" type="number" className="form-input" placeholder="1000" /></div>
              </div>
              <div className="flex justify-end mt-3 gap-2">
                <button onClick={() => {
                  const nome = document.getElementById('camp-nome').value.trim()
                  if (!nome) return
                  set('campanhas', [...form.campanhas, {
                    id: Date.now(), nome,
                    orcamentoDiario: parseFloat(document.getElementById('camp-budget').value) || 0,
                    valorGasto: parseFloat(document.getElementById('camp-spent').value) || 0,
                    resultados: parseInt(document.getElementById('camp-leads').value) || 0,
                    cliques: parseInt(document.getElementById('camp-clicks').value) || 0,
                    status: 'ATIVO',
                  }])
                }} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">Salvar Campanha</button>
              </div>
            </div>
            <div className="space-y-3">
              {form.campanhas.map((c, i) => (
                <div key={i} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Meta Ads</span>
                    <p className="font-bold text-base">{c.nome}</p>
                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                      <span>Orçamento/dia: <strong className="text-white">{fmtBRL(c.orcamentoDiario)}</strong></span>
                      <span>Investido: <strong className="text-white">{fmtBRL(c.valorGasto)}</strong></span>
                      <span>Leads: <strong className="text-white">{c.resultados}</strong></span>
                      <span>Cliques: <strong className="text-white">{c.cliques}</strong></span>
                    </div>
                  </div>
                  <button onClick={() => set('campanhas', form.campanhas.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs">✕ Remover</button>
                </div>
              ))}
              {form.campanhas.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Nenhuma campanha adicionada</p>}
            </div>
          </div>
        )}
      </div>

      {/* ── Barra de Ações ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            <SaveIcon /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/empresas/novo')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all hover:-translate-y-0.5"
          >
            <PlusIcon /> Nova Empresa
          </button>
          <button
            onClick={() => { alert('Contrato gerado!'); set('contratoAssinado', true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5"
          >
            <DocIcon /> Contrato
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Registrar pagamento')}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all hover:-translate-y-0.5"
          >
            <MoneyIcon /> Pagamento
          </button>
          <button
            onClick={() => setTab('financeiro')}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-900/20 transition-all hover:-translate-y-0.5"
          >
            <ListIcon /> Parcelas
          </button>
          <button
            onClick={() => alert('Compartilhar relatório no WhatsApp')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#25d366] hover:bg-[#128c7e] text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
          >
            <WppIcon /> WhatsApp
          </button>
          <button
            onClick={() => navigate('/empresas')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
          >
            <BackIcon /> Voltar
          </button>
        </div>
      </div>
    </div>
  )
}

function SaveIcon()  { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> }
function PlusIcon()  { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> }
function DocIcon()   { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
function MoneyIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function ListIcon()  { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> }
function WppIcon()   { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.449 5.474 0 9.938-4.43 9.94-9.885.002-2.643-1.019-5.127-2.877-6.986C16.48 1.875 14.004.855 11.37.855c-5.48 0-9.94 4.433-9.942 9.886-.002 1.957.514 3.87 1.492 5.56l-.973 3.55 3.65-.951z"/></svg> }
function BackIcon()  { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }
