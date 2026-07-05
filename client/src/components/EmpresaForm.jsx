import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEmpresas, saveEmpresa, getPlanos, getServicosExtras, createServicoExtra, updateServicoExtra, deleteServicoExtra } from '../api'
import Modal from './ui/Modal'

function uid() { return 'emp-' + Date.now() }

export default function EmpresaForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [tab, setTab] = useState('dados')
  const [saving, setSaving] = useState(false)

  // ── Serviços Extras ──────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const getMesAtual = () => {
    const d = new Date()
    return `${String(d.getMonth() + 1).padStart(2,'0')}/${d.getFullYear()}`
  }
  const EMPTY_EXTRA = {
    data: today, tipo: 'Criativo extra', descricao: '', quantidade: 1,
    valorUnitario: 0, valorTotal: 0, status: 'Pendente',
    aprovadoCliente: true, formaAprovacao: 'WhatsApp',
    mesCobranca: getMesAtual(), observacao: ''
  }

  const FORMAS_APROV = ['WhatsApp','E-mail','Reunião','Verbal']
  const STATUS_EXTRAS = ['Pendente','Aprovado','Entregue','Cobrado']

  const [extras, setExtras] = useState([])
  const [extraForm, setExtraForm] = useState(EMPTY_EXTRA)
  const [editingExtraId, setEditingExtraId] = useState(null)
  const [savingExtra, setSavingExtra] = useState(false)
  const [extraToast, setExtraToast] = useState(null)
  const [filterMes, setFilterMes] = useState(getMesAtual())

  const setEF = (k, v) => setExtraForm(f => ({ ...f, [k]: v,
    ...(k === 'quantidade' || k === 'valorUnitario'
      ? { valorTotal: (k === 'quantidade' ? v : f.quantidade) * (k === 'valorUnitario' ? v : f.valorUnitario) }
      : {})
  }))

  const showExtraToast = (msg, type = 'success') => {
    setExtraToast({ msg, type })
    setTimeout(() => setExtraToast(null), 3000)
  }

  const loadExtras = useCallback(() => {
    if (!id) return
    getServicosExtras(id).then(setExtras).catch(console.error)
  }, [id])

  const handleSaveExtra = async () => {
    if (!extraForm.descricao.trim()) { showExtraToast('Descrição é obrigatória', 'error'); return }
    setSavingExtra(true)
    try {
      if (editingExtraId) {
        await updateServicoExtra(id, editingExtraId, extraForm)
        showExtraToast('Serviço atualizado! ✅')
      } else {
        await createServicoExtra(id, extraForm)
        showExtraToast('Serviço salvo! ✅')
      }
      setExtraForm(EMPTY_EXTRA)
      setEditingExtraId(null)
      loadExtras()
    } catch (e) {
      showExtraToast('Erro: ' + e.message, 'error')
    } finally { setSavingExtra(false) }
  }

  const handleEditExtra = (ex) => {
    setExtraForm({ ...ex })
    setEditingExtraId(ex.id)
    setFilterMes(ex.mesCobranca)
  }

  const handleDeleteExtra = async (exId) => {
    if (!confirm('Remover este serviço extra?')) return
    try {
      await deleteServicoExtra(id, exId)
      loadExtras()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const [planosList, setPlanosList] = useState([])
  const [allPlanos, setAllPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [planosError, setPlanosError] = useState(null)

  // Estados do Controle Financeiro replicados do Aluno
  const [parcelasContratoState, setParcelasContratoState] = useState([])
  const [modal, setModal] = useState(null) // 'pagamento'
  const [pagtoForm, setPagtoForm] = useState({
    parcela: '',
    dataPagamento: '',
    formaPagamento: 'Boleto Bancário',
    observacao: ''
  })

  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
    segmento: 'Marketing Digital', porte: 'Pequena', telefone: '', whatsapp: '', email: '', site: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    plano: '', dataInicio: '', dataTermino: '', diaVencimento: 'Todo dia 10',
    statusPlano: 'ATIVO', usuariosContratados: 5, descricaoPlano: '',
    valorMensal: 0, desconto: 0, taxas: 0, formaPagamento: 'Boleto Bancário',
    entrada: 0, qtdeParcelas: 12, primeiroVencimento: '', observacoesFinanceiras: '',
    contratoAssinado: false, documentoAnexado: false, renovacaoAutomatica: true,
    documentos: [], campanhas: [],
  })

  // Carregar planos dinamicamente
  useEffect(() => {
    queueMicrotask(() => {
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
    })
  }, [isEdit])

  // Normalizar plano de nome para ID caso seja registro antigo (legado)
  useEffect(() => {
    if (form.plano && allPlanos.length > 0) {
      const foundById = allPlanos.find(p => p.id === form.plano)
      if (!foundById) {
        const foundByName = allPlanos.find(p => p.nome.toLowerCase() === form.plano.toLowerCase())
        if (foundByName) {
          queueMicrotask(() => setForm(f => ({ ...f, plano: foundByName.id })))
        }
      }
    }
  }, [form.plano, allPlanos])

  useEffect(() => {
    if (!isEdit) return
    getEmpresas().then(list => {
      const e = list.find(x => x.id === id)
      if (e) {
        const getMesesDiff = () => {
          if (!e.dataInicio || !e.dataTermino) return 12
          const d1 = new Date(e.dataInicio + 'T12:00:00')
          const d2 = new Date(e.dataTermino + 'T12:00:00')
          const diff = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth()
          return Math.max(1, diff)
        }
        
        const parcelasCount = (e.parcelasContrato && e.parcelasContrato.length > 0) ? e.parcelasContrato.length : 0
        const q = parcelasCount || parseInt(e.qtdeParcelas) || getMesesDiff()

        const totalM = parseFloat(e.valorMensal) || 0
        const dVal = parseFloat(e.desconto) || 0
        const comDesc = Math.max(0, totalM - dVal)
        const tx = parseFloat(e.taxas) || 0
        const ent = parseFloat(e.entrada) || 0
        const totalCont = comDesc + tx
        const aParc = Math.max(0, totalCont - ent)
        const calculatedVlrParcela = q > 0 ? aParc / q : 0

        setForm(f => ({
          ...f, ...e,
          qtdeParcelas: q,
          documentos: typeof e.documentos === 'string' ? e.documentos.split(',').filter(Boolean) : (e.documentos || []),
          campanhas: e.campanhas || [],
          contratoAssinado: !!e.contratoAssinado,
          documentoAnexado: !!e.documentoAnexado,
          renovacaoAutomatica: e.renovacaoAutomatica !== 0,
        }))

        if (e.parcelasContrato && e.parcelasContrato.length > 0) {
          const novas = e.parcelasContrato.map(p => ({
            ...p,
            valor: calculatedVlrParcela,
            total: calculatedVlrParcela
          }))
          setParcelasContratoState(novas)
        }
      }
    })
    loadExtras()
  }, [id, isEdit, loadExtras])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Cálculos Financeiros replicados do Aluno
  const totalMensal = parseFloat(form.valorMensal) || 0
  const descVal = parseFloat(form.desconto) || 0
  const comDesconto = Math.max(0, totalMensal - descVal)
  const taxas = parseFloat(form.taxas) || 0
  const entrada = parseFloat(form.entrada) || 0

  const getMesesDiferenca = () => {
    if (!form.dataInicio || !form.dataTermino) return 12
    const d1 = new Date(form.dataInicio + 'T12:00:00')
    const d2 = new Date(form.dataTermino + 'T12:00:00')
    const diff = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth()
    return Math.max(1, diff)
  }

  const qtde = parseInt(form.qtdeParcelas) || getMesesDiferenca()
  const totalContrato = comDesconto + taxas
  const aParcelar = Math.max(0, totalContrato - entrada)
  const vlrParcela = qtde > 0 ? aParcelar / qtde : 0
  const valorTotal = comDesconto + taxas // Mantido para compatibilidade com o banco (mensalidade líquida)

  const generateParcelasContrato = () => {
    const list = []
    const base = form.primeiroVencimento 
      ? new Date(form.primeiroVencimento + 'T12:00:00') 
      : (form.dataInicio ? new Date(form.dataInicio + 'T12:00:00') : new Date())
    for (let i = 0; i < qtde; i++) {
      const d = new Date(base)
      d.setMonth(d.getMonth() + i)
      const MM = String(d.getMonth() + 1).padStart(2, '0')
      const YYYY = d.getFullYear()
      const competencia = `${MM}/${YYYY}`
      list.push({
        parcela: `${i + 1}/${qtde}`,
        competencia,
        vencimento: d.toISOString().split('T')[0],
        valor: vlrParcela,
        desconto: 0,
        acrescimos: 0,
        total: vlrParcela,
        status: 'PENDENTE',
        dataPagamento: '',
        formaPagamento: ''
      })
    }
    return list
  }

  const parcelasContratoDisplay = parcelasContratoState.length > 0 ? parcelasContratoState : generateParcelasContrato()

  const totalPago = parcelasContratoDisplay.filter(p => p.status === 'PAGO').reduce((s, p) => s + p.valor, 0) + entrada
  const parcelasPagas = parcelasContratoDisplay.filter(p => p.status === 'PAGO').length

  // Função síncrona para atualizar campos financeiros e atualizar a lista de parcelas sem renderização em cascata
  const updateFinance = (key, val) => {
    setForm(f => {
      const nextForm = { ...f, [key]: val }
      
      const totalM = parseFloat(nextForm.valorMensal) || 0
      const dVal = parseFloat(nextForm.desconto) || 0
      const comDesc = Math.max(0, totalM - dVal)
      const tx = parseFloat(nextForm.taxas) || 0
      const ent = parseFloat(nextForm.entrada) || 0
      
      const getMesesDiff = () => {
        if (!nextForm.dataInicio || !nextForm.dataTermino) return 12
        const d1 = new Date(nextForm.dataInicio + 'T12:00:00')
        const d2 = new Date(nextForm.dataTermino + 'T12:00:00')
        const diff = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth()
        return Math.max(1, diff)
      }
      const q = parseInt(nextForm.qtdeParcelas) || getMesesDiff()
      const totalCont = comDesc + tx
      const aParc = Math.max(0, totalCont - ent)
      const vParc = q > 0 ? aParc / q : 0

      const temPago = parcelasContratoState.some(p => p.status === 'PAGO')
      if (!temPago && parcelasContratoState.length > 0) {
        const list = []
        const base = nextForm.primeiroVencimento 
          ? new Date(nextForm.primeiroVencimento + 'T12:00:00') 
          : (nextForm.dataInicio ? new Date(nextForm.dataInicio + 'T12:00:00') : new Date())
        for (let i = 0; i < q; i++) {
          const d = new Date(base)
          d.setMonth(d.getMonth() + i)
          const MM = String(d.getMonth() + 1).padStart(2, '0')
          const YYYY = d.getFullYear()
          const competencia = `${MM}/${YYYY}`
          list.push({
            parcela: `${i + 1}/${q}`,
            competencia,
            vencimento: d.toISOString().split('T')[0],
            valor: vParc,
            desconto: 0,
            acrescimos: 0,
            total: vParc,
            status: 'PENDENTE',
            dataPagamento: '',
            formaPagamento: ''
          })
        }
        setParcelasContratoState(list)
      } else if (parcelasContratoState.length > 0) {
        const novas = parcelasContratoState.map(p => {
          if (p.status !== 'PAGO') {
            return { ...p, valor: vParc, total: vParc }
          }
          return p
        })
        setParcelasContratoState(novas)
      }

      return nextForm
    })
  }

  // Lógica de Registro de Pagamento
  const abrirModalPagamento = () => {
    const pendentes = parcelasContratoDisplay.filter(p => p.status !== 'PAGO')
    setPagtoForm({
      parcela: pendentes[0]?.parcela || '1/' + qtde,
      dataPagamento: new Date().toISOString().split('T')[0],
      formaPagamento: 'Boleto Bancário',
      observacao: ''
    })
    setModal('pagamento')
  }

  const handleRegistrarPagamento = () => {
    const idx = parcelasContratoDisplay.findIndex(p => p.parcela === pagtoForm.parcela)
    if (idx === -1) { alert('Parcela não encontrada'); return }

    const novas = parcelasContratoDisplay.map((p, i) =>
      i === idx
        ? { ...p, status: 'PAGO', dataPagamento: pagtoForm.dataPagamento, formaPagamento: pagtoForm.formaPagamento }
        : p
    )
    setParcelasContratoState(novas)
    setModal(null)
  }

  const handleSave = async () => {
    if (!form.nomeFantasia.trim()) { alert('Nome Fantasia é obrigatório'); return }
    setSaving(true)
    try {
      await saveEmpresa({ 
        ...form, 
        id: id || uid(), 
        valorComDesconto: comDesconto, 
        valorTotal,
        parcelasContrato: parcelasContratoDisplay 
      })
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
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    }
  }



  const tabs = [
    { key: 'dados',     label: '📋 1. Dados da Empresa' },
    { key: 'contrato',  label: '📄 2. Plano & Contrato' },
    { key: 'financeiro',label: '💰 3. Financeiro' },
    { key: 'meta',      label: '🚀 4. Meta Ads' },
    { key: 'extras',    label: '⚡ 5. Serviços Extras' },
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
              <div className="col-span-2"><label className="form-label">Data Inicial</label><input type="date" className="form-input" value={form.dataInicio} onChange={e => updateFinance('dataInicio', e.target.value)} /></div>
              <div className="col-span-2"><label className="form-label">Data Término</label><input type="date" className="form-input" value={form.dataTermino} onChange={e => updateFinance('dataTermino', e.target.value)} /></div>
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
          <div className="card p-6" id="parcelas-section">
            <h2 className="section-title"><span>💰</span> Controle Financeiro</h2>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-9 space-y-4">
                {/* Financial inputs */}
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="form-label">Valor Mensal (R$)</label>
                    <input type="number" className="form-input font-bold text-blue-700" value={form.valorMensal} onChange={e => updateFinance('valorMensal', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Desconto (R$)</label>
                    <input type="number" className="form-input" value={form.desconto} onChange={e => updateFinance('desconto', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Valor c/ Desconto</label>
                    <div className="form-input bg-slate-50 font-semibold text-slate-700">{fmtBRL(comDesconto)}</div>
                  </div>
                  <div>
                    <label className="form-label">Taxas (R$)</label>
                    <input type="number" className="form-input" value={form.taxas} onChange={e => updateFinance('taxas', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Mensalidade Total</label>
                    <div className="form-input bg-slate-50 font-semibold text-emerald-700">{fmtBRL(valorTotal)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="form-label">Entrada (R$)</label>
                    <input type="number" className="form-input" value={form.entrada} onChange={e => updateFinance('entrada', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Valor a Parcelar</label>
                    <div className="form-input bg-slate-50 font-semibold text-red-600">{fmtBRL(aParcelar)}</div>
                  </div>
                  <div>
                    <label className="form-label">Forma de Pagamento</label>
                    <select className="form-select" value={form.formaPagamento} onChange={e => updateFinance('formaPagamento', e.target.value)}>
                      <option>Boleto Bancário</option>
                      <option>Pix</option>
                      <option>Cartão de Crédito</option>
                      <option>Transferência</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Qtde de Parcelas</label>
                    <input type="number" className="form-input text-center" value={form.qtdeParcelas} onChange={e => updateFinance('qtdeParcelas', e.target.value)} min={1} max={48} />
                  </div>
                  <div>
                    <label className="form-label">Valor da Parcela</label>
                    <div className="form-input bg-slate-50 font-semibold text-slate-700">{fmtBRL(vlrParcela)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">1º Vencimento</label>
                    <input type="date" className="form-input" value={form.primeiroVencimento} onChange={e => updateFinance('primeiroVencimento', e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setParcelasContratoState([])}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      🔄 Recalcular / Gerar Parcelas
                    </button>
                  </div>
                </div>

                {/* Parcelas table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="table-th text-center w-16">Parcela</th>
                        <th className="table-th">Competência</th>
                        <th className="table-th">Vencimento</th>
                        <th className="table-th">Valor</th>
                        <th className="table-th text-center w-16">Pago?</th>
                        <th className="table-th">Data Pagto.</th>
                        <th className="table-th">Forma</th>
                        <th className="table-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelasContratoDisplay.map((p, i) => (
                        <tr key={i} className={`hover:bg-blue-50/30 transition-colors ${(p.status === 'PAGO') ? 'bg-emerald-50/50' : ''}`}>
                          <td className="table-td text-center font-mono text-xs">{p.parcela}</td>
                          <td className="table-td text-xs font-mono text-slate-600">{p.competencia}</td>
                          <td className="table-td font-mono text-xs">{p.vencimento}</td>
                          <td className="table-td font-semibold text-slate-800">{fmtBRL(p.valor)}</td>
                          <td className="table-td text-center">
                            {(p.status === 'PAGO')
                              ? <span className="text-emerald-500 text-lg">✓</span>
                              : <span className="text-slate-300 text-lg">○</span>
                            }
                          </td>
                          <td className="table-td text-xs font-mono text-slate-600">{p.dataPagamento || '-'}</td>
                          <td className="table-td text-xs text-slate-600">{p.formaPagamento || '-'}</td>
                          <td className="table-td">
                            {(p.status === 'PAGO')
                              ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">PAGO</span>
                              : <span className="badge-pending">PENDENTE</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Card */}
              <div className="col-span-3">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-5 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo do Contrato</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total do Contrato</span>
                    <span className="font-bold">{fmtBRL(totalContrato)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Parcelas pagas</span>
                    <span className="font-bold text-emerald-400">{parcelasPagas}/{qtde}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Recebido</span>
                    <span className="font-bold text-emerald-400">{fmtBRL(totalPago)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                    <span className="text-slate-300">Saldo Pendente</span>
                    <span className="font-bold text-red-400">{fmtBRL(Math.max(0, totalContrato - totalPago))}</span>
                  </div>
                  <button
                    type="button"
                    onClick={abrirModalPagamento}
                    className="w-full mt-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <MoneyIcon /> Registrar Pagamento
                  </button>
                </div>
              </div>
            </div>
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

        {tab === 'extras' && (
          <div className="space-y-5">

            {/* Toast */}
            {extraToast && (
              <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white flex items-center gap-2
                ${extraToast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                {extraToast.type === 'error' ? '❌' : '✅'} {extraToast.msg}
              </div>
            )}

            {/* Aviso se empresa ainda não foi salva */}
            {!isEdit && (
              <div className="card p-6 text-center">
                <div className="text-4xl mb-3">💾</div>
                <p className="text-slate-500 font-medium">Salve a empresa primeiro para gerenciar os Serviços Extras.</p>
              </div>
            )}

            {isEdit && (() => {
              const extrasMes = filterMes === 'Todos' ? extras : extras.filter(e => e.mesCobranca === filterMes)
              const totalExtrasMes = extrasMes.reduce((s, e) => s + (e.valorTotal || 0), 0)
              const totalPlano = parseFloat(form.valorMensal) || 0
              const totalCobrar = totalPlano + totalExtrasMes

              return (
                <>
                  {/* ── Resumo Financeiro ── */}
                  <div className="card p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">📊 Resumo Financeiro</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                        <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Plano Mensal</p>
                        <p className="text-xl font-bold text-blue-700">{fmtBRL(totalPlano)}</p>
                      </div>
                      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
                        <p className="text-xs font-semibold text-amber-500 uppercase mb-1">Extras do Mês</p>
                        <p className="text-xl font-bold text-amber-700">{fmtBRL(totalExtrasMes)}</p>
                      </div>
                      <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center">
                        <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Total a Cobrar</p>
                        <p className="text-2xl font-bold text-emerald-700">{fmtBRL(totalCobrar)}</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Formulário de Novo Extra ── */}
                  <div className="card p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                      {editingExtraId ? '✏️ Editando Serviço Extra' : '➕ Lançar Novo Serviço Extra'}
                    </h3>
                    <div className="grid grid-cols-12 gap-3">

                      {/* Linha 1 */}
                      <div className="col-span-2">
                        <label className="form-label">Data do serviço</label>
                        <input type="date" className="form-input" value={extraForm.data} onChange={e => setEF('data', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="form-label">Tipo de serviço</label>
                        <input
                          className="form-input"
                          value={extraForm.tipo}
                          onChange={e => setEF('tipo', e.target.value)}
                          placeholder="Ex: Criativo extra, Reels, Google Ads..."
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="form-label">Descrição</label>
                        <input className="form-input" value={extraForm.descricao} onChange={e => setEF('descricao', e.target.value)} placeholder="Descreva o serviço..." />
                      </div>
                      <div className="col-span-1">
                        <label className="form-label">Quantidade</label>
                        <input type="number" min="1" className="form-input" value={extraForm.quantidade}
                          onChange={e => setEF('quantidade', parseFloat(e.target.value) || 1)} />
                      </div>
                      <div className="col-span-2">
                        <label className="form-label">Valor unitário (R$)</label>
                        <input type="number" min="0" step="0.01" className="form-input" value={extraForm.valorUnitario}
                          onChange={e => setEF('valorUnitario', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-1">
                        <label className="form-label">Valor total</label>
                        <div className="form-input bg-slate-50 font-bold text-emerald-700 text-sm">{fmtBRL(extraForm.valorTotal)}</div>
                      </div>

                      {/* Linha 2 */}
                      <div className="col-span-2">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={extraForm.status} onChange={e => setEF('status', e.target.value)}>
                          {STATUS_EXTRAS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="form-label">Aprovado pelo cliente?</label>
                        <div className="flex gap-2 mt-1">
                          <button type="button"
                            onClick={() => setEF('aprovadoCliente', true)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                              extraForm.aprovadoCliente ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200'
                            }`}>Sim</button>
                          <button type="button"
                            onClick={() => setEF('aprovadoCliente', false)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                              !extraForm.aprovadoCliente ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'
                            }`}>Não</button>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="form-label">Forma de aprovação</label>
                        <select className="form-select" value={extraForm.formaAprovacao} onChange={e => setEF('formaAprovacao', e.target.value)}>
                          {FORMAS_APROV.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="form-label">Mês de cobrança</label>
                        <input
                          className="form-input"
                          value={extraForm.mesCobranca}
                          onChange={e => setEF('mesCobranca', e.target.value)}
                          placeholder="Ex: 06/2026"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="form-label">Observação</label>
                        <textarea className="form-input resize-none" rows={2} value={extraForm.observacao}
                          onChange={e => setEF('observacao', e.target.value)} placeholder="Observações adicionais..."/>
                      </div>

                      {/* Botões */}
                      <div className="col-span-12 flex justify-end gap-2">
                        {editingExtraId && (
                          <button type="button" onClick={() => { setExtraForm(EMPTY_EXTRA); setEditingExtraId(null) }}
                            className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-50">
                            ✕ Cancelar edição
                          </button>
                        )}
                        <button type="button" onClick={handleSaveExtra} disabled={savingExtra}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all disabled:opacity-60">
                          {savingExtra ? 'Salvando...' : (editingExtraId ? '💾 Atualizar Serviço' : '💾 Salvar Serviço Extra')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Lista de Extras ── */}
                  <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">📋 Extras lançados</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 font-semibold">Filtrar mês:</label>
                        <select className="form-select text-xs py-1" value={filterMes} onChange={e => setFilterMes(e.target.value)}>
                          <option value="Todos">Todos</option>
                          {[...new Set(extras.map(e => e.mesCobranca))].sort().map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {extrasMes.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="text-3xl mb-2">⚡</div>
                        <p className="text-slate-400 text-sm">Nenhum serviço extra lançado em {filterMes}.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th className="table-th">Data</th>
                                <th className="table-th">Serviço</th>
                                <th className="table-th">Descrição</th>
                                <th className="table-th">Qtd</th>
                                <th className="table-th">Valor</th>
                                <th className="table-th">Status</th>
                                <th className="table-th">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {extrasMes.map(ex => {
                                const [y, m, d] = (ex.data || '').split('-')
                                const dataFmt = d ? `${d}/${m}/${String(y).slice(2)}` : ex.data
                                const statusColors = {
                                  'Pendente':  'bg-amber-100 text-amber-700',
                                  'Aprovado':  'bg-blue-100 text-blue-700',
                                  'Entregue':  'bg-violet-100 text-violet-700',
                                  'Cobrado':   'bg-emerald-100 text-emerald-700',
                                }
                                return (
                                  <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="table-td text-xs text-slate-500">{dataFmt}</td>
                                    <td className="table-td text-xs font-semibold">{ex.tipo}</td>
                                    <td className="table-td text-xs text-slate-600">{ex.descricao}</td>
                                    <td className="table-td text-xs text-center">{ex.quantidade}</td>
                                    <td className="table-td text-sm font-bold text-emerald-700">{fmtBRL(ex.valorTotal)}</td>
                                    <td className="table-td">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[ex.status] || 'bg-slate-100 text-slate-600'}`}>
                                        {ex.status}
                                      </span>
                                    </td>
                                    <td className="table-td">
                                      <div className="flex gap-1">
                                        <button onClick={() => handleEditExtra(ex)}
                                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs" title="Editar">✏️</button>
                                        <button onClick={() => handleDeleteExtra(ex.id)}
                                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs" title="Excluir">🗑️</button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <span className="text-sm font-bold text-slate-700">
                            Total de extras em {filterMes}: <span className="text-emerald-700">{fmtBRL(totalExtrasMes)}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          MODAL: REGISTRAR PAGAMENTO (CONTRATO)
      ══════════════════════════════════════════ */}
      <Modal
        open={modal === 'pagamento'}
        onClose={() => setModal(null)}
        title="Registrar Pagamento de Contrato"
        icon="💳"
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-5">
          {/* Status rápido */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Total</p>
              <p className="font-bold text-slate-800">{fmtBRL(totalContrato)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xs text-emerald-600 mb-1">Recebido</p>
              <p className="font-bold text-emerald-700">{fmtBRL(totalPago)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
              <p className="text-xs text-red-500 mb-1">Pendente</p>
              <p className="font-bold text-red-700">{fmtBRL(Math.max(0, totalContrato - totalPago))}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Parcela a Pagar</label>
              <select
                className="form-select"
                value={pagtoForm.parcela}
                onChange={e => setPagtoForm(f => ({ ...f, parcela: e.target.value }))}
              >
                {parcelasContratoDisplay.map(p => (
                  <option key={p.parcela} value={p.parcela}
                    disabled={p.status === 'PAGO'}
                  >
                    Parcela {p.parcela} — {fmtBRL(p.valor)} — Venc: {p.vencimento}
                    {(p.status === 'PAGO') ? ' ✓ PAGO' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Data do Pagamento</label>
                <input
                  type="date"
                  className="form-input"
                  value={pagtoForm.dataPagamento}
                  onChange={e => setPagtoForm(f => ({ ...f, dataPagamento: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Forma de Pagamento</label>
                <select
                  className="form-select"
                  value={pagtoForm.formaPagamento}
                  onChange={e => setPagtoForm(f => ({ ...f, formaPagamento: e.target.value }))}
                >
                  <option>Boleto Bancário</option>
                  <option>Pix</option>
                  <option>Cartão de Crédito</option>
                  <option>Transferência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Observação (opcional)</label>
              <input
                className="form-input"
                placeholder="Ex: Pago via Pix corporativo"
                value={pagtoForm.observacao}
                onChange={e => setPagtoForm(f => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleRegistrarPagamento}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-900/20">
              ✅ Confirmar Pagamento
            </button>
          </div>
        </div>
      </Modal>

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
            onClick={() => {
              const html = `
                <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333;">
                  <h1 style="text-align: center; margin-bottom: 40px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
                  <p>Pelo presente instrumento particular, de um lado a CONTRATADA Voolt, e de outro lado a CONTRATANTE:</p>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                     <p><strong>Razão Social:</strong> ${form.razaoSocial || '-'}</p>
                     <p><strong>CNPJ:</strong> ${form.cnpj || '-'}</p>
                     <p><strong>Endereço:</strong> ${form.endereco || '-'}, ${form.numero || '-'} - ${form.cidade || '-'}/${form.estado || '-'}</p>
                  </div>
                  <h3>1. DO OBJETO</h3>
                  <p>O presente contrato tem como objeto a prestação de serviços referentes ao plano contratado: <strong>${allPlanos.find(p => p.id === form.plano)?.nome || form.plano || '-'}</strong>, pelo valor mensal de <strong>${fmtBRL(form.valorMensal)}</strong>.</p>
                  <br><br><br><br>
                  <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 50px;">
                    <div style="width: 45%; border-top: 1px solid #000; padding-top: 10px;">CONTRATADA (Voolt)</div>
                    <div style="width: 45%; border-top: 1px solid #000; padding-top: 10px;">CONTRATANTE (${form.nomeFantasia || '-'})</div>
                  </div>
                </div>
              `
              const win = window.open('', '_blank')
              win.document.write(html)
              win.document.title = 'Contrato - ' + (form.nomeFantasia || 'Empresa')
              win.setTimeout(() => win.print(), 500)
              set('contratoAssinado', true)
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5"
          >
            <DocIcon /> Contrato
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={abrirModalPagamento}
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
            onClick={() => {
              if (!form.whatsapp) {
                alert('Preencha o número do WhatsApp da empresa primeiro!')
                return
              }
              const fone = form.whatsapp.replace(/\D/g, '')
              const url = `https://wa.me/55${fone}?text=Olá! Segue a atualização da ${form.nomeFantasia || 'sua empresa'}.`
              window.open(url, '_blank')
            }}
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
