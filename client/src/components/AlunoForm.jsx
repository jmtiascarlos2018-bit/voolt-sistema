import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAlunos, saveAluno, getCursos, uploadDocumento, getDocumentos, deleteDocumento } from '../api'

import Modal from './ui/Modal'

const CURSOS_FALLBACK = ['INFORMÁTICA BÁSICA', 'SOCIAL MEDIA', 'DESIGN GRÁFICO PROFISSIONAL', 'ANÁLISE DE DADOS']
const TURMAS = ['TURMA MANHÃ', 'TURMA TARDE', 'TURMA NOITE']
const PROFESSORES = ['João Silva', 'Maria Souza', 'Pedro Santos']
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function uid() { return 'aluno-' + Date.now() }

export default function AlunoForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [saving, setSaving] = useState(false)
  const [activeTab] = useState('dados')
  const [cursosList, setCursosList] = useState([])
  const [allCursos, setAllCursos] = useState([])
  const [loadingCursos, setLoadingCursos] = useState(true)
  const [cursosError, setCursosError] = useState(null)
  const [dbDocumentos, setDbDocumentos] = useState([])
  const [tempFiles, setTempFiles] = useState([])

  // Modais
  const [modal, setModal] = useState(null) // 'contrato' | 'pagamento' | 'certificado' | 'parcela'
  const [parcelaSelecionada, setParcelaSelecionada] = useState(null)
  const [parcelasState, setParcelasState] = useState([])
  const [pagtoForm, setPagtoForm] = useState({ parcela: '', dataPagamento: '', formaPagamento: 'Pix', observacao: '' })
  const [certConfirm, setCertConfirm] = useState(false)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    nome: '', email: '', cpf: '', rg: '', whatsapp: '', telefone: '',
    dataNasc: '', sexo: 'Masculino', estadoCivil: 'Solteiro', responsavel: '', parentesco: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    curso: '', turma: TURMAS[0], dataInicio: '', dataTermino: '',
    diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    horarioInicio: '08:00', horarioFim: '10:00', professor: PROFESSORES[0],
    modalidade: 'Presencial', cargaHoraria: 80, status: 'Ativo', observacoes: '',
    valorTotal: 500, desconto: 0, entrada: 100, formaPagamento: 'Parcelado',
    qtdeParcelas: 4, diaVencimento: 'Todo dia 10', primeiroVencimento: '',
    contratoAssinado: false, documentoAnexado: false, certificadoEmitido: false,
    documentos: [],
  })

  // Carregar cursos reais do sistema
  useEffect(() => {
    setLoadingCursos(true)
    getCursos()
      .then(list => {
        setAllCursos(list)
        const ativos = list.filter(c => c.ativo)
        setCursosList(ativos)
        // Se for cadastro novo, seleciona por padrão o primeiro curso ativo se existir
        if (!isEdit && ativos.length > 0) {
          setForm(f => ({ ...f, curso: ativos[0].id }))
        }
        setLoadingCursos(false)
      })
      .catch((err) => {
        console.error(err)
        setCursosError('Erro ao carregar os cursos do sistema.')
        setLoadingCursos(false)
      })
  }, [isEdit])

  // Normalizar curso de nome para ID caso seja registro antigo (legado)
  useEffect(() => {
    if (form.curso && cursosList.length > 0) {
      const foundById = cursosList.find(c => c.id === form.curso)
      if (!foundById) {
        const foundByName = cursosList.find(c => c.nome.toLowerCase() === form.curso.toLowerCase())
        if (foundByName) {
          setForm(f => ({ ...f, curso: foundByName.id }))
        }
      }
    }
  }, [form.curso, cursosList])

  // Load existing student for edit
  useEffect(() => {
    if (!isEdit) return
    getAlunos().then(list => {
      const a = list.find(x => x.id === id)
      if (a) {
        setForm(f => ({
          ...f, ...a,
          diasSemana: typeof a.diasSemana === 'string' ? a.diasSemana.split(',') : (a.diasSemana || []),
          documentos: typeof a.documentos === 'string' ? a.documentos.split(',').filter(Boolean) : (a.documentos || []),
          contratoAssinado: !!a.contratoAssinado,
          documentoAnexado: !!a.documentoAnexado,
          certificadoEmitido: !!a.certificadoEmitido,
        }))
        if (a.parcelas) setParcelasState(a.parcelas)
      }
    })
  }, [id])

  // Carregar documentos reais salvos do aluno
  useEffect(() => {
    if (!isEdit) return
    getDocumentos(id)
      .then(setDbDocumentos)
      .catch(err => {
        console.error("Erro ao carregar documentos:", err)
        showToast("Falha ao carregar lista de documentos anexados.", "error")
      })
  }, [id, isEdit])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const toggleDia = (dia) => {
    setForm(f => ({
      ...f,
      diasSemana: f.diasSemana.includes(dia) ? f.diasSemana.filter(d => d !== dia) : [...f.diasSemana, dia]
    }))
  }

  // Financial calculations
  const descVal = parseFloat(form.desconto) || 0
  const total = parseFloat(form.valorTotal) || 0
  const comDesconto = total - (descVal > 1 ? descVal : total * descVal / 100)
  const entrada = parseFloat(form.entrada) || 0
  const aParcelar = Math.max(0, comDesconto - entrada)
  const qtde = parseInt(form.qtdeParcelas) || 1
  const vlrParcela = qtde > 0 ? aParcelar / qtde : 0

  const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ─── Gerar lista de parcelas ────────────────────────────────────────────────
  const generateParcelas = () => {
    const list = []
    const base = form.primeiroVencimento ? new Date(form.primeiroVencimento + 'T12:00:00') : new Date()
    for (let i = 0; i < qtde; i++) {
      const d = new Date(base)
      d.setMonth(d.getMonth() + i)
      list.push({
        numero: i + 1, vencimento: d.toISOString().split('T')[0],
        valor: vlrParcela, pago: 0, status: 'PENDENTE', dataPagamento: '', formaPagamento: ''
      })
    }
    return list
  }

  // Inicializa parcelas no state quando muda qtde/valores (só se não veio do banco)
  const parcelasDisplay = parcelasState.length > 0 ? parcelasState : generateParcelas()

  // ─── ANEXOS DE DOCUMENTOS ───────────────────────────────────────────────────
  const handleAttachFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    console.log("[FRONTEND] Arquivo selecionado:", file.name, "Tamanho (bytes):", file.size, "Tipo Mime:", file.type);

    // Validação de tipo
    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    if (!allowedMimeTypes.includes(file.type)) {
      showToast("Formato inválido. Apenas PDF, PNG e JPG são permitidos.", "error")
      e.target.value = ''
      return
    }

    // Validação de tamanho (5MB)
    const maxFileSize = 5 * 1024 * 1024
    if (file.size > maxFileSize) {
      showToast("Arquivo muito grande. Limite máximo de 5MB.", "error")
      e.target.value = ''
      return
    }

    if (isEdit) {
      // Aluno existente: Upload imediato
      try {
        console.log(`[FRONTEND] Disparando upload imediato do arquivo para aluno ID: ${id}`);
        console.log("[FRONTEND] FormData sendo preparado...");
        const doc = await uploadDocumento(id, file)
        console.log("[FRONTEND] Resposta da API de upload recebida:", doc);
        setDbDocumentos(prev => [doc, ...prev])
        showToast("Documento anexado com sucesso!")
      } catch (err) {
        console.error("[FRONTEND ERROR] Falha ao enviar documento:", err)
        showToast("Falha ao enviar documento: " + err.message, "error")
      }
    } else {
      // Aluno novo: Guarda na fila temporária
      console.log(`[FRONTEND] Aluno novo: adicionando ${file.name} à fila de uploads local.`);
      setTempFiles(prev => [...prev, file])
      showToast("Documento adicionado à fila temporária.")
    }
    e.target.value = '' // Limpa o seletor
  }

  const handleRemoveFile = async (doc) => {
    if (!confirm(`Deseja realmente excluir o documento "${doc.nomeOriginal}"?`)) return
    try {
      console.log(`[FRONTEND] Solicitando remoção física do documento ID ${doc.id} para aluno ID ${id}`);
      await deleteDocumento(id, doc.id)
      console.log(`[FRONTEND] Documento ID ${doc.id} removido com sucesso.`);
      setDbDocumentos(prev => prev.filter(d => d.id !== doc.id))
      showToast("Documento removido com sucesso!")
    } catch (err) {
      console.error("[FRONTEND ERROR] Erro ao deletar documento:", err)
      showToast("Erro ao remover documento: " + err.message, "error")
    }
  }

  const handleRemoveTempFile = (index) => {
    console.log(`[FRONTEND] Removendo arquivo da fila temporária no índice ${index}`);
    setTempFiles(prev => prev.filter((_, idx) => idx !== index))
    showToast("Documento removido da fila temporária.")
  }

  // ─── SALVAR ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nome.trim()) { showToast('Nome é obrigatório', 'error'); return }
    setSaving(true)
    try {
      const alunoId = id || uid()
      const payload = {
        ...form,
        id: alunoId,
        valorDesconto: comDesconto,
        valorParcelar: aParcelar,
        valorParcela: vlrParcela,
        diasSemana: form.diasSemana,
        documentos: form.documentos,
        parcelas: parcelasDisplay,
      }
      console.log("[FRONTEND] Salvando dados textuais do aluno:", payload);
      await saveAluno(payload)

      // Se houver arquivos na fila temporária de novos alunos, fazer upload agora
      if (tempFiles.length > 0) {
        console.log(`[FRONTEND] Aluno salvo com ID ${alunoId}. Iniciando upload dos ${tempFiles.length} arquivos em fila...`);
        for (const file of tempFiles) {
          try {
            console.log(`[FRONTEND] Enviando arquivo em fila: ${file.name}`);
            const doc = await uploadDocumento(alunoId, file)
            console.log(`[FRONTEND] Arquivo ${file.name} enviado e registrado com sucesso:`, doc);
          } catch (uploadErr) {
            console.error(`[FRONTEND ERROR] Falha ao enviar arquivo temporário ${file.name}:`, uploadErr)
          }
        }
      }

      showToast('Aluno salvo com sucesso! ✅')
      setTimeout(() => navigate('/alunos'), 1200)
    } catch (e) {
      console.error("[FRONTEND ERROR] Falha ao salvar dados do aluno:", e)
      showToast('Erro ao salvar: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── CONTRATO ───────────────────────────────────────────────────────────────
  const handleImprimirContrato = () => {
    const w = window.open('', '_blank', 'width=800,height=900')
    w.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <title>Contrato de Matrícula — ${form.nome}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; color: #111; background: #fff; padding: 60px 80px; line-height: 1.7; font-size: 13px; }
          h1 { text-align:center; font-size: 20px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
          .subtitle { text-align:center; color: #555; font-size: 12px; margin-bottom: 40px; }
          h2 { font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 28px 0 12px; letter-spacing: 1px; color: #333; }
          .row { display: flex; gap: 40px; margin-bottom: 8px; }
          .field { flex: 1; }
          .field label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px; display: block; margin-bottom: 2px; }
          .field span { font-weight: 600; border-bottom: 1px solid #ddd; display: block; padding-bottom: 2px; min-height: 20px; }
          .clausula { margin-bottom: 12px; text-align: justify; }
          .clausula strong { font-weight: 700; }
          .assinatura { display: flex; justify-content: space-between; margin-top: 60px; }
          .ass-line { text-align:center; width: 45%; }
          .ass-line div { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #555; }
          .valor-destaque { font-size: 16px; font-weight: 700; color: #1a4080; }
          @media print { body { padding: 40px 60px; } }
        </style>
      </head>
      <body>
        <h1>Contrato de Prestação de Serviços Educacionais</h1>
        <p class="subtitle">VOOLT — Foco no Tráfego Pago</p>

        <h2>1. Identificação das Partes</h2>
        <div class="row">
          <div class="field"><label>Aluno(a)</label><span>${form.nome || '-'}</span></div>
          <div class="field"><label>CPF</label><span>${form.cpf || '-'}</span></div>
        </div>
        <div class="row">
          <div class="field"><label>RG</label><span>${form.rg || '-'}</span></div>
          <div class="field"><label>Data de Nasc.</label><span>${fmtDate(form.dataNasc)}</span></div>
          <div class="field"><label>WhatsApp</label><span>${form.whatsapp || '-'}</span></div>
        </div>
        <div class="row">
          <div class="field"><label>Endereço</label><span>${[form.endereco, form.numero, form.bairro].filter(Boolean).join(', ') || '-'}</span></div>
          <div class="field"><label>Cidade / UF</label><span>${form.cidade || '-'} / ${form.estado || '-'}</span></div>
        </div>
        ${form.responsavel ? `<div class="row"><div class="field"><label>Responsável</label><span>${form.responsavel} (${form.parentesco || ''})</span></div></div>` : ''}

        <h2>2. Dados do Curso Contratado</h2>
        <div class="row">
          <div class="field"><label>Curso</label><span>${form.curso}</span></div>
          <div class="field"><label>Turma</label><span>${form.turma}</span></div>
          <div class="field"><label>Modalidade</label><span>${form.modalidade}</span></div>
        </div>
        <div class="row">
          <div class="field"><label>Início</label><span>${fmtDate(form.dataInicio)}</span></div>
          <div class="field"><label>Término Previsto</label><span>${fmtDate(form.dataTermino)}</span></div>
          <div class="field"><label>Carga Horária</label><span>${form.cargaHoraria}h</span></div>
        </div>
        <div class="row">
          <div class="field"><label>Dias da Semana</label><span>${(form.diasSemana || []).join(', ')}</span></div>
          <div class="field"><label>Horário</label><span>${form.horarioInicio} às ${form.horarioFim}</span></div>
          <div class="field"><label>Instrutor</label><span>${form.professor}</span></div>
        </div>

        <h2>3. Condições de Pagamento</h2>
        <div class="row">
          <div class="field"><label>Valor Total do Curso</label><span class="valor-destaque">${fmtBRL(total)}</span></div>
          <div class="field"><label>Desconto</label><span>${fmtBRL(descVal > 1 ? descVal : total * descVal / 100)}</span></div>
          <div class="field"><label>Valor com Desconto</label><span class="valor-destaque">${fmtBRL(comDesconto)}</span></div>
        </div>
        <div class="row">
          <div class="field"><label>Entrada</label><span>${fmtBRL(entrada)}</span></div>
          <div class="field"><label>Forma de Pagamento</label><span>${form.formaPagamento}</span></div>
          <div class="field"><label>Parcelas</label><span>${qtde}x de ${fmtBRL(vlrParcela)}</span></div>
        </div>

        <h2>4. Cláusulas Contratuais</h2>
        <div class="clausula"><strong>Cláusula 1ª — Do Objeto:</strong> O presente contrato tem por objeto a prestação de serviços educacionais conforme curso identificado na Cláusula 2, pelo período e valores especificados.</div>
        <div class="clausula"><strong>Cláusula 2ª — Das Obrigações:</strong> A VOOLT se compromete a fornecer o curso contratado com profissionais capacitados. O CONTRATANTE compromete-se ao pagamento das parcelas nas datas acordadas.</div>
        <div class="clausula"><strong>Cláusula 3ª — Do Cancelamento:</strong> O cancelamento da matrícula deverá ser solicitado com antecedência mínima de 15 (quinze) dias, sujeito às políticas de reembolso vigentes.</div>
        <div class="clausula"><strong>Cláusula 4ª — Do Certificado:</strong> O certificado de conclusão será emitido após o cumprimento de no mínimo 75% da carga horária e quitação integral do contrato.</div>
        <div class="clausula"><strong>Cláusula 5ª — Do Foro:</strong> Fica eleito o foro da comarca de ${form.cidade || 'domicílio do contratante'} para dirimir quaisquer questões oriundas deste contrato.</div>

        <p style="margin-top:28px; text-align:center; color:#888; font-size:11px;">
          ${form.cidade || '___________'}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        <div class="assinatura">
          <div class="ass-line">
            <div>VOOLT<br/>CNPJ: 00.000.000/0001-00</div>
          </div>
          <div class="ass-line">
            <div>${form.nome || 'Aluno(a)'}<br/>CPF: ${form.cpf || '-'}</div>
          </div>
        </div>

        <script>window.onload = () => { window.print() }</script>
      </body>
      </html>
    `)
    w.document.close()
    set('contratoAssinado', true)
    setModal(null)
    showToast('Contrato aberto para impressão/PDF! 🖨️')
  }

  // ─── PAGAMENTO ──────────────────────────────────────────────────────────────
  const abrirModalPagamento = () => {
    const pendentes = parcelasDisplay.filter(p => !p.pago && p.status !== 'PAGO')
    setPagtoForm({
      parcela: pendentes[0]?.numero || 1,
      dataPagamento: new Date().toISOString().split('T')[0],
      formaPagamento: 'Pix',
      observacao: ''
    })
    setModal('pagamento')
  }

  const handleRegistrarPagamento = () => {
    const idx = parcelasDisplay.findIndex(p => p.numero === parseInt(pagtoForm.parcela))
    if (idx === -1) { showToast('Parcela não encontrada', 'error'); return }

    const novas = parcelasDisplay.map((p, i) =>
      i === idx
        ? { ...p, pago: 1, status: 'PAGO', dataPagamento: pagtoForm.dataPagamento, formaPagamento: pagtoForm.formaPagamento }
        : p
    )
    setParcelasState(novas)
    setModal(null)
    showToast(`Parcela ${pagtoForm.parcela}/${qtde} registrada como PAGA! 💳`)
  }

  // ─── CERTIFICADO ────────────────────────────────────────────────────────────
  const handleEmitirCertificado = () => {
    const w = window.open('', '_blank', 'width=900,height=700')
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    w.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <title>Certificado — ${form.nome}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Inter', sans-serif; background: #fff; display:flex; align-items:center; justify-content:center; min-height:100vh; }
          .cert {
            width: 800px; height: 560px;
            background: linear-gradient(135deg, #0f2044 0%, #1a3a6b 50%, #0f2044 100%);
            border-radius: 16px;
            position: relative; overflow: hidden;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 48px 72px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.4);
          }
          .cert::before {
            content:''; position:absolute; inset:12px; border:2px solid rgba(255,215,0,0.35); border-radius:8px; pointer-events:none;
          }
          .cert::after {
            content:''; position:absolute; inset:16px; border:1px solid rgba(255,215,0,0.15); border-radius:4px; pointer-events:none;
          }
          .logo { font-family:'Playfair Display',serif; font-size:13px; letter-spacing:4px; text-transform:uppercase; color:rgba(255,215,0,0.7); margin-bottom:8px; }
          .title { font-family:'Playfair Display',serif; font-size:38px; font-weight:700; color:#fff; margin-bottom:4px; letter-spacing:1px; }
          .title-sub { font-size:12px; letter-spacing:6px; text-transform:uppercase; color:rgba(255,215,0,0.6); margin-bottom:32px; }
          .certifica { font-size:12px; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.55); margin-bottom:10px; }
          .nome { font-family:'Playfair Display',serif; font-size:34px; font-style:italic; color:#FFD700; font-weight:400; margin-bottom:14px; border-bottom:1px solid rgba(255,215,0,0.3); padding-bottom:10px; }
          .texto { font-size:12px; color:rgba(255,255,255,0.7); text-align:center; line-height:1.8; max-width:580px; margin-bottom:32px; }
          .rodape { display:flex; justify-content:space-between; width:100%; margin-top:8px; }
          .ass { text-align:center; }
          .ass-line { width:180px; border-top:1px solid rgba(255,215,0,0.4); padding-top:6px; font-size:10px; color:rgba(255,215,0,0.6); letter-spacing:1px; }
          .carga { position:absolute; top:18px; right:24px; font-size:10px; color:rgba(255,215,0,0.5); letter-spacing:1px; text-transform:uppercase; }
          .num { position:absolute; bottom:14px; left:50%; transform:translateX(-50%); font-size:9px; color:rgba(255,255,255,0.2); letter-spacing:2px; }
          @media print { body { background:#fff; } }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="carga">C.H.: ${form.cargaHoraria}h</div>
          <div class="logo">✦ VOOLT ✦</div>
          <div class="title">Certificado</div>
          <div class="title-sub">de Conclusão de Curso</div>
          <div class="certifica">Certifica que</div>
          <div class="nome">${form.nome}</div>
          <div class="texto">
            concluiu com êxito o curso de <strong style="color:#FFD700">${form.curso}</strong>,
            com carga horária de <strong style="color:#FFD700">${form.cargaHoraria} horas</strong>,
            realizado na modalidade <strong style="color:#FFD700">${form.modalidade}</strong>
            no período de ${fmtDate(form.dataInicio)} a ${fmtDate(form.dataTermino)}.
          </div>
          <div class="rodape">
            <div class="ass"><div class="ass-line">${form.professor}<br/>Instrutor</div></div>
            <div class="ass"><div class="ass-line">${hoje}<br/>Data de Emissão</div></div>
            <div class="ass"><div class="ass-line">Direção Acadêmica<br/>VOOLT</div></div>
          </div>
          <div class="num">Nº ${id || 'NOVO'} · ${new Date().getFullYear()}</div>
        </div>
        <script>window.onload = () => { window.print() }</script>
      </body>
      </html>
    `)
    w.document.close()
    set('certificadoEmitido', true)
    setModal(null)
    showToast('Certificado emitido com sucesso! 🎓')
  }

  const buscarCEP = async () => {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setForm(f => ({ ...f, endereco: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }))
      }
    } catch {}
  }

  // Calcular total pago nas parcelas
  const totalPago = parcelasDisplay.filter(p => p.pago || p.status === 'PAGO').reduce((s, p) => s + p.valor, 0) + entrada
  const parcelasPagas = parcelasDisplay.filter(p => p.pago || p.status === 'PAGO').length



  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white flex items-center gap-2 transition-all
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      <div className="space-y-6">

        {/* Section 1: Dados do Aluno */}
        <div className="card p-6">
          <h2 className="section-title">
            <span>👤</span> 1. Dados do Aluno
          </h2>
          <div className="grid grid-cols-12 gap-4">
            {/* Col Esquerda */}
            <div className="col-span-12 md:col-span-8 grid grid-cols-8 gap-4">
              <div className="col-span-4">
                <label className="form-label">Nome Completo *</label>
                <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo do aluno" />
              </div>
              <div className="col-span-4">
                <label className="form-label">E-mail</label>
                <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="col-span-2">
                <label className="form-label">CPF *</label>
                <input className="form-input font-mono" value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="col-span-2">
                <label className="form-label">Tel. (WhatsApp)</label>
                <input className="form-input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="col-span-2">
                <label className="form-label">RG</label>
                <input className="form-input" value={form.rg} onChange={e => set('rg', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Tel. Residencial</label>
                <input className="form-input" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Data de Nasc.</label>
                <input type="date" className="form-input" value={form.dataNasc} onChange={e => set('dataNasc', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Estado Civil</label>
                <select className="form-select" value={form.estadoCivil} onChange={e => set('estadoCivil', e.target.value)}>
                  {['Solteiro','Casado','Divorciado','Viúvo'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Sexo</label>
                <div className="flex gap-4 mt-2">
                  {['Masculino','Feminino'].map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name="sexo" value={s} checked={form.sexo === s} onChange={() => set('sexo', s)} className="accent-blue-600" />
                      {s === 'Masculino' ? 'Masc.' : 'Fem.'}
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-4">
                <label className="form-label">Responsável (se menor)</label>
                <input className="form-input" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Parentesco</label>
                <select className="form-select" value={form.parentesco} onChange={e => set('parentesco', e.target.value)}>
                  {['','Mãe','Pai','Tio(a)','Avô(ó)','Outro'].map(o => <option key={o} value={o}>{o || '- Selecione -'}</option>)}
                </select>
              </div>
            </div>

            {/* Col Direita — Endereço */}
            <div className="col-span-12 md:col-span-4 bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Endereço</p>
              <div>
                <label className="form-label">CEP</label>
                <div className="flex gap-2">
                  <input className="form-input flex-1" value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="45000-000" />
                  <button onClick={buscarCEP} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                    Buscar CEP
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Endereço</label>
                <input className="form-input" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Número</label>
                  <input className="form-input" value={form.numero} onChange={e => set('numero', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Complem.</label>
                  <input className="form-input" value={form.complemento} onChange={e => set('complemento', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Bairro</label>
                <input className="form-input" value={form.bairro} onChange={e => set('bairro', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="form-label">Cidade</label>
                  <input className="form-input" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">UF</label>
                  <input className="form-input" maxLength={2} value={form.estado} onChange={e => set('estado', e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dados do Curso */}
        <div className="card p-6">
          <h2 className="section-title"><span>📚</span> 2. Dados do Curso</h2>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="form-label">Curso</label>
              <select className="form-select" value={form.curso} onChange={e => set('curso', e.target.value)}>
                <option value="">- Selecione um Curso -</option>
                {cursosList.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
                {form.curso && !cursosList.some(c => c.id === form.curso) && (() => {
                  const c = allCursos.find(x => x.id === form.curso)
                  return c ? (
                    <option key={c.id} value={c.id}>{c.nome} (Inativo)</option>
                  ) : null
                })()}
              </select>
              {loadingCursos && <p className="text-[10px] text-slate-400 mt-1">Carregando cursos...</p>}
              {cursosError && <p className="text-[10px] text-red-500 mt-1">{cursosError}</p>}
              {!loadingCursos && !cursosError && cursosList.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">Nenhum curso ativo cadastrado.</p>
              )}
            </div>
            <div className="col-span-3">
              <label className="form-label">Turma</label>
              <select className="form-select" value={form.turma} onChange={e => set('turma', e.target.value)}>
                {TURMAS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <label className="form-label">Data de Início</label>
              <input type="date" className="form-input" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
            </div>
            <div className="col-span-3">
              <label className="form-label">Data Término Prevista</label>
              <input type="date" className="form-input" value={form.dataTermino} onChange={e => set('dataTermino', e.target.value)} />
            </div>
            <div className="col-span-5">
              <label className="form-label">Dias da Semana</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DIAS.map(dia => (
                  <button
                    key={dia} type="button"
                    onClick={() => toggleDia(dia)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      form.diasSemana.includes(dia)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="form-label">Horário das Aulas</label>
              <div className="flex items-center gap-1">
                <input className="form-input text-center" value={form.horarioInicio} onChange={e => set('horarioInicio', e.target.value)} placeholder="08:00" />
                <span className="text-xs text-slate-400 font-bold">às</span>
                <input className="form-input text-center" value={form.horarioFim} onChange={e => set('horarioFim', e.target.value)} placeholder="10:00" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="form-label">Professor / Instrutor</label>
              <select className="form-select" value={form.professor} onChange={e => set('professor', e.target.value)}>
                {PROFESSORES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Modalidade</label>
              <select className="form-select" value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
                <option>Presencial</option>
                <option>Online</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="form-label">C.H.</label>
              <input type="number" className="form-input text-center" value={form.cargaHoraria} onChange={e => set('cargaHoraria', e.target.value)} />
            </div>
            <div className="col-span-1">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Ativo</option><option>Pendente</option><option>Cancelado</option>
              </select>
            </div>
            <div className="col-span-12">
              <label className="form-label">Observações do Curso</label>
              <textarea className="form-input h-16 resize-none" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações gerais sobre a matrícula..." />
            </div>
          </div>
        </div>

        {/* Section 3: Controle Financeiro */}
        <div className="card p-6" id="parcelas-section">
          <h2 className="section-title"><span>💵</span> 3. Controle Financeiro</h2>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-9 space-y-4">
              {/* Financial inputs */}
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="form-label">Valor Total (R$)</label>
                  <input type="number" className="form-input font-bold text-blue-700" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Desconto (R$ ou %)</label>
                  <input type="number" className="form-input" value={form.desconto} onChange={e => set('desconto', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Valor c/ Desconto</label>
                  <div className="form-input bg-slate-50 font-semibold text-slate-700">{fmtBRL(comDesconto)}</div>
                </div>
                <div>
                  <label className="form-label">Entrada (R$)</label>
                  <input type="number" className="form-input" value={form.entrada} onChange={e => set('entrada', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Valor a Parcelar</label>
                  <div className="form-input bg-slate-50 font-semibold text-red-600">{fmtBRL(aParcelar)}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="form-label">Forma de Pagamento</label>
                  <select className="form-select" value={form.formaPagamento} onChange={e => set('formaPagamento', e.target.value)}>
                    <option>Parcelado</option><option>À Vista</option><option>Pix</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Qtde de Parcelas</label>
                  <input type="number" className="form-input text-center" value={form.qtdeParcelas} onChange={e => set('qtdeParcelas', e.target.value)} min={1} max={24} />
                </div>
                <div>
                  <label className="form-label">Valor da Parcela</label>
                  <div className="form-input bg-slate-50 font-semibold text-slate-700">{fmtBRL(vlrParcela)}</div>
                </div>
                <div>
                  <label className="form-label">1º Vencimento</label>
                  <input type="date" className="form-input" value={form.primeiroVencimento} onChange={e => set('primeiroVencimento', e.target.value)} />
                </div>
              </div>

              {/* Parcelas table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="table-th text-center w-16">Parcela</th>
                      <th className="table-th">Vencimento</th>
                      <th className="table-th">Valor</th>
                      <th className="table-th text-center w-16">Pago?</th>
                      <th className="table-th">Data Pagto.</th>
                      <th className="table-th">Forma</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelasDisplay.map((p, i) => (
                      <tr key={i} className={`hover:bg-blue-50/30 transition-colors ${(p.pago || p.status === 'PAGO') ? 'bg-emerald-50/50' : ''}`}>
                        <td className="table-td text-center font-mono text-xs">{p.numero}/{qtde}</td>
                        <td className="table-td font-mono text-xs">{p.vencimento}</td>
                        <td className="table-td font-semibold text-slate-800">{fmtBRL(p.valor)}</td>
                        <td className="table-td text-center">
                          {(p.pago || p.status === 'PAGO')
                            ? <span className="text-emerald-500 text-lg">✓</span>
                            : <span className="text-slate-300 text-lg">○</span>
                          }
                        </td>
                        <td className="table-td text-xs font-mono text-slate-600">{p.dataPagamento || '-'}</td>
                        <td className="table-td text-xs text-slate-600">{p.formaPagamento || '-'}</td>
                        <td className="table-td">
                          {(p.pago || p.status === 'PAGO')
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo de Matrícula</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total do Curso</span>
                  <span className="font-bold">{fmtBRL(total)}</span>
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
                  <span className="font-bold text-red-400">{fmtBRL(Math.max(0, comDesconto - totalPago))}</span>
                </div>
                <button
                  onClick={abrirModalPagamento}
                  className="w-full mt-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <MoneyIcon /> Registrar Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Observações e Documentos */}
        <div className="card p-6">
          <h2 className="section-title"><span>📋</span> 4. Observações e Documentos</h2>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <label className="form-label">Observações Gerais</label>
              <textarea className="form-input h-20 resize-none" placeholder="Qualquer detalhe ou observação comercial..." />
            </div>
            <div className="col-span-3 space-y-3">
              {[
                { label: 'Contrato Assinado', key: 'contratoAssinado' },
                { label: 'Documento Anexado', key: 'documentoAnexado' },
                { label: 'Certificado Emitido', key: 'certificadoEmitido' },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{label}:</span>
                  <div className="flex gap-1">
                    <button onClick={() => set(key, true)}
                      className={`px-3 py-1 rounded-l-lg text-xs font-bold border transition-colors ${form[key] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      Sim
                    </button>
                    <button onClick={() => set(key, false)}
                      className={`px-3 py-1 rounded-r-lg text-xs font-bold border transition-colors ${!form[key] ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      Não
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-span-4">
              <label className="form-label">Documentos Anexados</label>
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleAttachFile}
              />
              <button
                type="button"
                onClick={() => document.getElementById('file-upload').click()}
                className="w-full py-2 mb-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                📎 + Anexar Documento
              </button>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {/* 1. Documentos salvos no banco de dados */}
                {dbDocumentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 text-xs border border-slate-100">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log("[FRONTEND] Clique no documento. URL de visualização/download acionada:", doc.caminhoUrl);
                        window.open(doc.caminhoUrl, '_blank');
                      }}
                      className="flex items-center gap-1.5 text-blue-700 hover:underline font-medium truncate max-w-[80%]"
                    >
                      <span>📄</span> {doc.nomeOriginal}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(doc)}
                      className="text-red-400 hover:text-red-600 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* 2. Documentos na fila temporária */}
                {tempFiles.map((file, idx) => (
                  <div key={`temp-${idx}`} className="flex items-center justify-between bg-amber-50/50 rounded-lg px-3 py-1.5 text-xs border border-dashed border-amber-200">
                    <span className="flex items-center gap-1.5 text-amber-800 font-medium truncate max-w-[80%]">
                      <span>⏳</span> {file.name} (Fila)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTempFile(idx)}
                      className="text-red-400 hover:text-red-600 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {dbDocumentos.length === 0 && tempFiles.length === 0 && (
                  <p className="text-center text-[11px] text-slate-400 py-3">Nenhum documento anexado.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Barra de Ações ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <SaveIcon /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => setModal('contrato')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5"
          >
            <DocIcon /> Contrato
          </button>
          <button
            onClick={abrirModalPagamento}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all hover:-translate-y-0.5"
          >
            <MoneyIcon /> Pagamento
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById('parcelas-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-900/20 transition-all hover:-translate-y-0.5"
          >
            <ListIcon /> Parcelas
          </button>
          <button
            onClick={() => setModal('certificado')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5"
          >
            <BadgeIcon /> Certificado
          </button>
          <button
            onClick={() => navigate('/alunos')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
          >
            <BackIcon /> Voltar
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL: CONTRATO
      ══════════════════════════════════════════ */}
      <Modal
        open={modal === 'contrato'}
        onClose={() => setModal(null)}
        title="Contrato de Prestação de Serviços"
        icon="📄"
        maxWidth="max-w-3xl"
      >
        <div className="p-6 space-y-5">
          {/* Preview resumido */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Prévia do Contrato</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <InfoRow label="Aluno(a)" value={form.nome || '-'} />
              <InfoRow label="CPF" value={form.cpf || '-'} />
              <InfoRow label="Curso" value={form.curso} />
              <InfoRow label="Modalidade" value={form.modalidade} />
              <InfoRow label="Turma" value={form.turma} />
              <InfoRow label="Carga Horária" value={`${form.cargaHoraria}h`} />
              <InfoRow label="Início" value={fmtDate(form.dataInicio)} />
              <InfoRow label="Término Previsto" value={fmtDate(form.dataTermino)} />
              <InfoRow label="Instrutor" value={form.professor} />
              <InfoRow label="Dias" value={(form.diasSemana || []).join(', ')} />
              <InfoRow label="Horário" value={`${form.horarioInicio} às ${form.horarioFim}`} />
              <InfoRow label="Forma de Pagamento" value={form.formaPagamento} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                <p className="text-lg font-bold text-slate-800">{fmtBRL(total)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Com Desconto</p>
                <p className="text-lg font-bold text-blue-700">{fmtBRL(comDesconto)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Parcelas</p>
                <p className="text-lg font-bold text-slate-800">{qtde}x {fmtBRL(vlrParcela)}</p>
              </div>
            </div>
          </div>

          {!form.nome && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              ⚠️ Salve o aluno antes de gerar o contrato para incluir todos os dados.
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleImprimirContrato}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20">
              🖨️ Abrir para Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: REGISTRAR PAGAMENTO
      ══════════════════════════════════════════ */}
      <Modal
        open={modal === 'pagamento'}
        onClose={() => setModal(null)}
        title="Registrar Pagamento"
        icon="💳"
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-5">
          {/* Status rápido */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Total</p>
              <p className="font-bold text-slate-800">{fmtBRL(comDesconto)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xs text-emerald-600 mb-1">Pago</p>
              <p className="font-bold text-emerald-700">{fmtBRL(totalPago)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
              <p className="text-xs text-red-500 mb-1">Pendente</p>
              <p className="font-bold text-red-700">{fmtBRL(Math.max(0, comDesconto - totalPago))}</p>
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
                {parcelasDisplay.map(p => (
                  <option key={p.numero} value={p.numero}
                    disabled={p.pago || p.status === 'PAGO'}
                  >
                    Parcela {p.numero}/{qtde} — {fmtBRL(p.valor)} — Venc: {p.vencimento}
                    {(p.pago || p.status === 'PAGO') ? ' ✓ PAGO' : ''}
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
                  <option>Pix</option>
                  <option>Cartão de Crédito</option>
                  <option>Cartão de Débito</option>
                  <option>Boleto</option>
                  <option>Dinheiro</option>
                  <option>Transferência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Observação (opcional)</label>
              <input
                className="form-input"
                placeholder="Ex: Pago via Pix pelo responsável"
                value={pagtoForm.observacao}
                onChange={e => setPagtoForm(f => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleRegistrarPagamento}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-900/20">
              ✅ Confirmar Pagamento
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: CERTIFICADO
      ══════════════════════════════════════════ */}
      <Modal
        open={modal === 'certificado'}
        onClose={() => setModal(null)}
        title="Emissão de Certificado"
        icon="🎓"
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-5">
          {/* Preview do certificado */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f2044 0%, #1a3a6b 50%, #0f2044 100%)', padding: '32px 40px' }}>
            <div className="absolute inset-3 border border-yellow-400/30 rounded-lg pointer-events-none" />
            <p className="text-center text-yellow-400/70 text-xs tracking-widest uppercase mb-2">✦ Escola Digital ✦</p>
            <p className="text-center text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Certificado</p>
            <p className="text-center text-yellow-400/60 text-xs tracking-widest uppercase mb-5">de Conclusão de Curso</p>
            <p className="text-center text-white/60 text-xs tracking-widest uppercase mb-2">Certifica que</p>
            <p className="text-center text-yellow-400 text-xl font-medium mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {form.nome || 'Nome do Aluno'}
            </p>
            <p className="text-center text-white/60 text-xs leading-relaxed">
              concluiu o curso de <strong className="text-yellow-400">{form.curso}</strong><br />
              com carga horária de <strong className="text-yellow-400">{form.cargaHoraria}h</strong>
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Requisitos para emissão</p>
            {[
              { ok: !!form.nome, label: 'Dados do aluno preenchidos' },
              { ok: !!form.dataInicio && !!form.dataTermino, label: 'Datas de início e término definidas' },
              { ok: parcelasPagas > 0 || totalPago >= comDesconto * 0.5, label: 'Pagamento iniciado (≥ 50%)' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                <span>{item.ok ? '✅' : '⬜'}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleEmitirCertificado}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20">
              🎓 Emitir Certificado (Imprimir / PDF)
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform: translateX(20px); }
          to   { opacity:1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-componente utilitário ──────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <p className="text-slate-800 font-semibold">{value}</p>
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function SaveIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}
function DocIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function MoneyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
function BadgeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
