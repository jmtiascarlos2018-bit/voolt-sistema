// js/app.js

// Estado Global da Aplicação PWA Full-Stack
const App = {
  activeView: "dashboard",
  currentEditingStudentId: null,
  currentEditingCompanyId: null,
  activeCompanyTab: "dados",
  isDarkTheme: false,
  
  // Lista de Cursos padrão do sistema (pode ser expandida dinamicamente)
  cursos: [
    { id: "c-1", nome: "INFORMÁTICA BÁSICA", cargaHoraria: 80, professor: "João Silva", descricao: "Curso introdutório de informática focando em Windows e Office." },
    { id: "c-2", nome: "SOCIAL MEDIA", cargaHoraria: 60, professor: "João Silva", descricao: "Gestão estratégica de redes sociais e branding comercial." },
    { id: "c-3", nome: "DESIGN GRÁFICO", cargaHoraria: 60, professor: "Maria Souza", descricao: "Domínio avançado de Photoshop, Illustrator e criativos visuais." }
  ],

  // Inicializar o Sistema
  init() {
    console.log("Inicializando VOOLT PWA Full-Stack...");
    
    this.bindEvents();
    this.setupInputMasks();
    this.navigateTo("dashboard");
  },

  // Vinculação de Eventos SPA
  bindEvents() {
    // Menu lateral (Navegação SPA)
    document.querySelectorAll(".menu-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = link.getAttribute("data-view");
        if (view) {
          this.navigateTo(view);
        }
      });
    });

    // Alternador de Temas (Claro / Escuro)
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Atalhos globais do teclado
    document.addEventListener("keydown", (e) => {
      this.handleGlobalHotkeys(e);
    });
  },

  // Alternador de Temas (Light / Dark Mode)
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    const body = document.body;
    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");

    if (this.isDarkTheme) {
      body.classList.add("dark-theme");
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      body.classList.remove("dark-theme");
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  },

  // Roteamento interno da SPA
  async navigateTo(viewId) {
    this.activeView = viewId;

    // Atualizar links ativos na sidebar
    document.querySelectorAll(".menu-link").forEach(link => {
      const dataView = link.getAttribute("data-view");
      const shouldHighlight = (dataView === viewId) || 
                              (viewId === "student-form" && dataView === "alunos") ||
                              (viewId === "company-form" && dataView === "empresas");
      if (shouldHighlight) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Alternar containers das páginas
    document.querySelectorAll(".view-section").forEach(section => {
      if (section.id === `${viewId}-view`) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });

    // Ajustar títulos do header
    const titles = {
      dashboard: ["Dashboard", "Visão geral do sistema"],
      alunos: ["Alunos", "Cadastro e controle acadêmico"],
      cursos: ["Cursos", "Grade de ensino e corpo docente"],
      empresas: ["Empresas (Tráfego Pago)", "Contratos de gestão de tráfego pago"],
      planos: ["Planos de Tráfego", "Serviços e faturamento de marketing digital"],
      relatorios: ["Relatórios Financeiros", "Caixa consolidado e gráficos de faturamento"],
      "student-form": ["Ficha do Aluno", "Cadastro e matrícula acadêmica"],
      "company-form": ["Ficha da Empresa (Tráfego)", "Plano corporativo e campanhas Meta Ads"]
    };

    if (titles[viewId]) {
      document.getElementById("view-title").textContent = titles[viewId][0];
      document.getElementById("view-subtitle").textContent = titles[viewId][1];
    }

    // Ações ao carregar cada página
    if (viewId === "dashboard") {
      await this.renderDashboard();
    } else if (viewId === "alunos") {
      await this.renderAlunosList();
    } else if (viewId === "cursos") {
      await this.renderCursosPage();
    } else if (viewId === "empresas") {
      await this.renderEmpresasList();
    } else if (viewId === "relatorios") {
      await this.renderRelatoriosPage();
    }
  },

  // CONFIGURAÇÃO DE MÁSCARAS DE INPUTS EM TEMPO REAL
  setupInputMasks() {
    // Alunos
    document.getElementById("stud-cpf")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskCPF(e.target.value);
      this.validateField(e.target, e.target.value.length === 14);
    });

    document.getElementById("stud-whatsapp")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskPhone(e.target.value);
    });

    document.getElementById("stud-val-total")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskCurrency(e.target.value);
      this.triggerStudentCalculation();
    });

    document.getElementById("stud-desconto")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskCurrency(e.target.value);
      this.triggerStudentCalculation();
    });

    document.getElementById("stud-entrada")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskCurrency(e.target.value);
      this.triggerStudentCalculation();
    });

    // Empresas
    document.getElementById("comp-cnpj")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskCNPJ(e.target.value);
      this.validateField(e.target, e.target.value.length === 18);
    });

    document.getElementById("comp-whatsapp")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskPhone(e.target.value);
    });

    document.getElementById("comp-val-mensal")?.addEventListener("input", (e) => {
      e.target.value = StudentManager.maskCurrency(e.target.value);
      this.triggerCompanyCalculation();
    });
  },

  validateField(inputEl, isValid) {
    if (isValid) {
      inputEl.classList.add("input-valid");
    } else {
      inputEl.classList.remove("input-valid");
    }
  },

  // RENDERIZAÇÃO DO DASHBOARD PRINCIPAL (Chamadas Assíncronas de API)
  async renderDashboard() {
    const alunos = await StudentManager.getAlunos();
    const empresas = await CompanyManager.getEmpresas();

    // 1. Contadores do Topo
    const alunosAtivos = alunos.filter(a => a.status === "Ativo").length;
    document.getElementById("dash-counter-alunos").textContent = alunosAtivos;

    const empresasAtivas = empresas.filter(e => e.statusPlano === "ATIVO").length;
    document.getElementById("dash-counter-empresas").textContent = empresasAtivas;

    // Calcular parcelas em aberto
    let parcelasAbertoCount = 0;
    alunos.forEach(a => {
      a.parcelas.forEach(p => {
        if (!p.pago) parcelasAbertoCount++;
      });
    });
    document.getElementById("dash-counter-parcelas").textContent = parcelasAbertoCount;

    // Faturamento Consolidado Real
    let faturamentoTotal = 0;
    alunos.forEach(a => {
      a.parcelas.forEach(p => {
        if (p.pago) faturamentoTotal += p.valor;
      });
    });
    empresas.forEach(e => {
      e.parcelasContrato.forEach(p => {
        if (p.status === "PAGO") faturamentoTotal += p.total;
      });
    });

    document.getElementById("dash-counter-financeiro").textContent = `R$ ${faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 2. Alunos Recentes
    const recentStudentsBody = document.getElementById("recent-students-body");
    recentStudentsBody.innerHTML = "";
    
    alunos.slice(0, 5).forEach(aluno => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => this.openStudentModal(aluno.id));

      const statusBadge = aluno.status === "Ativo" 
        ? `<span class="badge active">Ativo</span>` 
        : `<span class="badge pending">Pendente</span>`;

      let dataFormatada = aluno.dataInicio;
      if (dataFormatada) {
        const [year, month, day] = dataFormatada.split("-");
        dataFormatada = `${day}/${month}/${year}`;
      }

      tr.innerHTML = `
        <td><strong style="color: #2563eb;">${aluno.nome}</strong></td>
        <td>${aluno.curso}</td>
        <td>${statusBadge}</td>
        <td>${dataFormatada}</td>
      `;
      recentStudentsBody.appendChild(tr);
    });

    // 3. Parcelas em Aberto
    const openInstallmentsBody = document.getElementById("open-installments-body");
    openInstallmentsBody.innerHTML = "";

    const listParcelasAberto = [];
    alunos.forEach(a => {
      a.parcelas.forEach(p => {
        if (!p.pago) {
          listParcelasAberto.push({
            alunoId: a.id,
            nome: a.nome,
            curso: a.curso,
            parcelaStr: `${p.numero}/${a.qtdeParcelas}`,
            vencimento: p.vencimento,
            valor: p.valor,
            status: p.status
          });
        }
      });
    });

    listParcelasAberto.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

    listParcelasAberto.slice(0, 5).forEach(item => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => this.openStudentModal(item.alunoId));

      const statusBadge = item.status === "ATRASADO"
        ? `<span class="badge atrasado">Atrasado</span>`
        : `<span class="badge pending">Em aberto</span>`;

      let dateStr = item.vencimento;
      if (dateStr) {
        const [year, month, day] = dateStr.split("-");
        dateStr = `${day}/${month}/${year}`;
      }

      tr.innerHTML = `
        <td><strong>${item.nome}</strong></td>
        <td>${item.curso}</td>
        <td>${item.parcelaStr}</td>
        <td>${dateStr}</td>
        <td><strong style="color: #ef4444;">R$ ${item.valor.toFixed(2)}</strong></td>
        <td>${statusBadge}</td>
      `;
      openInstallmentsBody.appendChild(tr);
    });

    // 4. Empresas ativas (Tráfego Pago)
    const activeCompaniesBody = document.getElementById("active-companies-body");
    activeCompaniesBody.innerHTML = "";

    empresas.slice(0, 5).forEach(empresa => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => this.openCompanyModal(empresa.id));

      const statusBadge = empresa.statusPlano === "ATIVO"
        ? `<span class="badge active">Ativo</span>`
        : `<span class="badge danger">Inativo</span>`;

      tr.innerHTML = `
        <td><strong style="color: #2563eb;">${empresa.nomeFantasia}</strong></td>
        <td>${empresa.cnpj}</td>
        <td>${empresa.plano}</td>
        <td>${empresa.duracaoMeses} meses</td>
        <td>${statusBadge}</td>
      `;
      activeCompaniesBody.appendChild(tr);
    });

    // 5. Gráfico Donut de recebimentos por método
    this.renderDonutChart(faturamentoTotal, alunos, empresas);
  },

  renderDonutChart(totalFaturado, alunos, empresas) {
    if (totalFaturado === 0) {
      document.getElementById("donut-total-value").textContent = "R$ 0";
      return;
    }

    // Somar métodos reais de pagamento
    let pixVal = 0, cartaoVal = 0, boletoVal = 0, debitoVal = 0;

    alunos.forEach(a => {
      a.parcelas.forEach(p => {
        if (p.pago) {
          if (p.formaPagamento === "Pix") pixVal += p.valor;
          else if (p.formaPagamento.includes("Crédito")) cartaoVal += p.valor;
          else if (p.formaPagamento.includes("Boleto")) boletoVal += p.valor;
          else debitoVal += p.valor;
        }
      });
    });

    empresas.forEach(e => {
      e.parcelasContrato.forEach(p => {
        if (p.status === "PAGO") {
          if (p.formaPagamento === "Pix") pixVal += p.total;
          else if (p.formaPagamento.includes("Crédito")) cartaoVal += p.total;
          else if (p.formaPagamento.includes("Boleto")) boletoVal += p.total;
          else debitoVal += p.total;
        }
      });
    });

    const totalCalculado = pixVal + cartaoVal + boletoVal + debitoVal || 1;

    const pPix = pixVal / totalCalculado;
    const pCartao = cartaoVal / totalCalculado;
    const pBoleto = boletoVal / totalCalculado;
    const pDebito = debitoVal / totalCalculado;

    // Atualizar legenda
    document.getElementById("legend-val-pix").innerHTML = `R$ ${pixVal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} <span>(${Math.round(pPix*100)}%)</span>`;
    document.getElementById("legend-val-cartao").innerHTML = `R$ ${cartaoVal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} <span>(${Math.round(pCartao*100)}%)</span>`;
    document.getElementById("legend-val-boleto").innerHTML = `R$ ${boletoVal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} <span>(${Math.round(pBoleto*100)}%)</span>`;
    document.getElementById("legend-val-debito").innerHTML = `R$ ${debitoVal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} <span>(${Math.round(pDebito*100)}%)</span>`;
    document.getElementById("donut-total-value").textContent = `R$ ${totalFaturado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

    const circ = 219.91;
    const strokePix = circ * pPix;
    const strokeCartao = circ * pCartao;
    const strokeBoleto = circ * pBoleto;
    const strokeDebito = circ * pDebito;

    document.getElementById("seg-pix").setAttribute("stroke-dasharray", `${strokePix} ${circ}`);
    document.getElementById("seg-pix").setAttribute("stroke-dashoffset", 0);

    document.getElementById("seg-cartao").setAttribute("stroke-dasharray", `${strokeCartao} ${circ}`);
    document.getElementById("seg-cartao").setAttribute("stroke-dashoffset", -strokePix);

    document.getElementById("seg-boleto").setAttribute("stroke-dasharray", `${strokeBoleto} ${circ}`);
    document.getElementById("seg-boleto").setAttribute("stroke-dashoffset", -(strokePix + strokeCartao));

    document.getElementById("seg-debito").setAttribute("stroke-dasharray", `${strokeDebito} ${circ}`);
    document.getElementById("seg-debito").setAttribute("stroke-dashoffset", -(strokePix + strokeCartao + strokeBoleto));
  },

  // RENDERIZAÇÃO DA PÁGINA: LISTAGEM DE ALUNOS
  async renderAlunosList() {
    const listBody = document.getElementById("alunos-list-body");
    listBody.innerHTML = "";

    const query = document.getElementById("search-alunos").value.toUpperCase();
    const alunos = await StudentManager.getAlunos();

    const filtered = alunos.filter(a => 
      a.nome.toUpperCase().includes(query) || 
      a.curso.toUpperCase().includes(query) ||
      a.cpf.includes(query)
    );

    filtered.forEach(aluno => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => this.openStudentModal(aluno.id));

      const statusBadge = aluno.status === "Ativo"
        ? `<span class="badge active">Ativo</span>`
        : `<span class="badge pending">Pendente</span>`;

      let totalPago = 0;
      let totalPendente = 0;
      aluno.parcelas.forEach(p => {
        if (p.pago) totalPago += p.valor;
        else totalPendente += p.valor;
      });

      tr.innerHTML = `
        <td><strong style="color: #2563eb;">${aluno.nome}</strong></td>
        <td>${aluno.cpf}</td>
        <td>${aluno.curso}</td>
        <td>${aluno.whatsapp}</td>
        <td><strong style="color: #059669;">R$ ${totalPago.toFixed(2)}</strong></td>
        <td><strong style="color: #f59e0b;">R$ ${totalPendente.toFixed(2)}</strong></td>
        <td>${statusBadge}</td>
      `;
      listBody.appendChild(tr);
    });
  },

  // RENDERIZAÇÃO DA PÁGINA: CURSOS (PÁGINA DINÂMICA REAL)
  async renderCursosPage() {
    const alunos = await StudentManager.getAlunos();
    
    // 1. Renderizar as estatísticas de matrículas
    const statsGrid = document.getElementById("cursos-stats-grid");
    statsGrid.innerHTML = "";

    this.cursos.forEach(curso => {
      const matriculados = alunos.filter(a => a.curso.toUpperCase() === curso.nome.toUpperCase()).length;
      
      const card = document.createElement("div");
      card.className = "stat-card";
      card.style.flexDirection = "column";
      card.style.alignItems = "flex-start";
      card.style.gap = "8px";

      card.innerHTML = `
        <h3 style="font-size: 14px; font-weight: 700; color: var(--primary);">${curso.nome}</h3>
        <div style="font-size: 24px; font-weight: 700; color: var(--text-main);">${matriculados} <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">Alunos Matriculados</span></div>
        <p style="font-size: 11px; color: var(--text-muted);">${curso.descricao}</p>
      `;
      statsGrid.appendChild(card);
    });

    // 2. Renderizar Tabela Geral de Cursos
    const listBody = document.getElementById("cursos-list-body");
    listBody.innerHTML = "";

    this.cursos.forEach((curso, idx) => {
      const countAlunos = alunos.filter(a => a.curso.toUpperCase() === curso.nome.toUpperCase()).length;
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="color: #2563eb;">${curso.nome}</strong></td>
        <td>${curso.cargaHoraria} horas</td>
        <td>${curso.professor}</td>
        <td><span class="badge active" style="font-size: 10px; padding: 2px 8px;">${countAlunos} ativos</span></td>
        <td style="color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${curso.descricao}</td>
        <td>
          <button class="btn-erp danger" onclick="window.deleteCurso(${idx});" style="height: 24px; font-size: 9px; padding: 0 8px;">Remover</button>
        </td>
      `;
      listBody.appendChild(tr);
    });

    // Atualizar dropdowns nos formulários de alunos
    const select = document.getElementById("stud-curso-select");
    if (select) {
      select.innerHTML = "";
      this.cursos.forEach(curso => {
        const opt = document.createElement("option");
        opt.value = curso.nome;
        opt.textContent = curso.nome;
        select.appendChild(opt);
      });
    }
  },

  // Salvar Novo Curso cadastrado manualmente
  saveCursoForm() {
    const nameInput = document.getElementById("course-name");
    const hoursInput = document.getElementById("course-hours");
    const profInput = document.getElementById("course-prof");
    const descInput = document.getElementById("course-desc");

    if (!nameInput.value || !hoursInput.value) return;

    this.cursos.push({
      id: "c-" + Date.now(),
      nome: nameInput.value.toUpperCase(),
      cargaHoraria: parseInt(hoursInput.value) || 60,
      professor: profInput.value,
      descricao: descInput.value
    });

    alert("Curso adicionado com sucesso na grade escolar!");
    document.getElementById("curso-creator-card").style.display = "none";
    document.getElementById("curso-creator-form").reset();
    
    this.renderCursosPage();
  },

  deleteCurso(idx) {
    if (confirm("Deseja realmente remover este curso da grade?")) {
      this.cursos.splice(idx, 1);
      this.renderCursosPage();
    }
  },

  // RENDERIZAÇÃO DA PÁGINA: LISTAGEM DE EMPRESAS
  async renderEmpresasList() {
    const listBody = document.getElementById("empresas-list-body");
    listBody.innerHTML = "";

    const query = document.getElementById("search-empresas").value.toUpperCase();
    const empresas = await CompanyManager.getEmpresas();

    const filtered = empresas.filter(e =>
      e.nomeFantasia.toUpperCase().includes(query) ||
      e.cnpj.includes(query) ||
      e.plano.toUpperCase().includes(query)
    );

    filtered.forEach(empresa => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => this.openCompanyModal(empresa.id));

      const statusBadge = empresa.statusPlano === "ATIVO"
        ? `<span class="badge active">Ativo</span>`
        : `<span class="badge danger">Inativo</span>`;

      let totalPago = 0;
      let totalPendente = 0;
      empresa.parcelasContrato.forEach(p => {
        if (p.status === "PAGO") totalPago += p.total;
        else totalPendente += p.total;
      });

      tr.innerHTML = `
        <td><strong style="color: #2563eb;">${empresa.nomeFantasia}</strong></td>
        <td>${empresa.cnpj}</td>
        <td>${empresa.plano}</td>
        <td>${empresa.duracaoMeses} meses</td>
        <td><strong style="color: #059669;">R$ ${totalPago.toFixed(2)}</strong></td>
        <td><strong style="color: #f59e0b;">R$ ${totalPendente.toFixed(2)}</strong></td>
        <td>${statusBadge}</td>
      `;
      listBody.appendChild(tr);
    });
  },

  // RENDERIZAÇÃO DA PÁGINA: RELATÓRIOS FINANCEIROS (NOVA TELA REAL)
  async renderRelatoriosPage() {
    const alunos = await StudentManager.getAlunos();
    const empresas = await CompanyManager.getEmpresas();

    let totalPago = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;

    const statementBody = document.getElementById("fin-statement-body");
    statementBody.innerHTML = "";

    // 1. Processar Alunos
    alunos.forEach(aluno => {
      aluno.parcelas.forEach(p => {
        if (p.pago) {
          totalPago += p.valor;
          // Adicionar lançamentos pagos na tabela demonstrativa
          this.appendFinancialStatementRow(statementBody, aluno.nome, `Mensalidade ${p.numero}/${aluno.qtdeParcelas} (${aluno.curso})`, p.valor, p.formaPagamento, "PAGO");
        } else {
          if (p.status === "ATRASADO") {
            totalAtrasado += p.valor;
            this.appendFinancialStatementRow(statementBody, aluno.nome, `Mensalidade atrasada ${p.numero}/${aluno.qtdeParcelas}`, p.valor, "-", "ATRASADO");
          } else {
            totalPendente += p.valor;
          }
        }
      });
    });

    // 2. Processar Empresas
    empresas.forEach(empresa => {
      empresa.parcelasContrato.forEach(p => {
        if (p.status === "PAGO") {
          totalPago += p.total;
          this.appendFinancialStatementRow(statementBody, empresa.nomeFantasia, `Parcela Contratual ${p.parcela}`, p.total, p.formaPagamento, "PAGO");
        } else {
          totalPendente += p.total;
        }
      });
    });

    const totalGeral = totalPago + totalPendente + totalAtrasado;

    // Atualizar visualizadores superiores
    document.getElementById("fin-realized-income").textContent = `R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("fin-pending-income").textContent = `R$ ${totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("fin-overdue-income").textContent = `R$ ${totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("fin-total-income").textContent = `R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  },

  appendFinancialStatementRow(bodyEl, origem, desc, total, forma, status) {
    const tr = document.createElement("tr");
    
    const badge = status === "PAGO" 
      ? `<span class="badge pago" style="font-size: 9px; padding: 2px 6px;">Pago</span>`
      : `<span class="badge atrasado" style="font-size: 9px; padding: 2px 6px;">Atrasado</span>`;

    tr.innerHTML = `
      <td><strong>${origem}</strong></td>
      <td>${desc}</td>
      <td><strong style="color: ${status === "PAGO" ? "#059669" : "#dc2626"};">R$ ${total.toFixed(2)}</strong></td>
      <td>${forma || "-"}</td>
      <td>${badge}</td>
    `;
    bodyEl.appendChild(tr);
  },

  // MODAL DE CADASTRO DE ALUNO: REGRAS E EVENTOS (Assíncrono)
  async openStudentModal(studentId = null) {
    this.currentEditingStudentId = studentId;
    this.navigateTo("student-form");

    const form = document.getElementById("student-form");
    form.reset();

    // Reset de validação de foco
    form.querySelectorAll(".form-input-erp").forEach(el => el.classList.remove("input-valid"));

    document.getElementById("student-payment-schedule-body").innerHTML = "";
    document.getElementById("student-uploaded-docs").innerHTML = "";

    // Atualizar dropdown de cursos com base nos cursos dinâmicos
    await this.renderCursosPage();

    if (studentId) {
      const aluno = await StudentManager.getAlunoById(studentId);
      if (aluno) {
        form.elements["stud-nome"].value = aluno.nome;
        form.elements["stud-email"].value = aluno.email;
        form.elements["stud-cpf"].value = aluno.cpf;
        form.elements["stud-rg"].value = aluno.rg;
        form.elements["stud-whatsapp"].value = aluno.whatsapp;
        form.elements["stud-telefone"].value = aluno.telefone;
        form.elements["stud-nasc"].value = aluno.dataNasc;
        form.elements["stud-sexo"].value = aluno.sexo;
        form.elements["stud-civil"].value = aluno.estadoCivil;
        form.elements["stud-responsavel"].value = aluno.responsavel;
        form.elements["stud-parentesco"].value = aluno.parentesco;

        form.elements["stud-cep"].value = aluno.cep;
        form.elements["stud-endereco"].value = aluno.endereco;
        form.elements["stud-numero"].value = aluno.numero;
        form.elements["stud-complemento"].value = aluno.complemento;
        form.elements["stud-bairro"].value = aluno.bairro;
        form.elements["stud-cidade"].value = aluno.cidade;
        form.elements["stud-estado"].value = aluno.estado;

        form.elements["stud-curso"].value = aluno.curso;
        form.elements["stud-turma"].value = aluno.turma;
        form.elements["stud-inicio"].value = aluno.dataInicio;
        form.elements["stud-termino"].value = aluno.dataTermino;
        form.elements["stud-professor"].value = aluno.professor;
        form.elements["stud-modalidade"].value = aluno.modalidade;
        form.elements["stud-status"].value = aluno.status;
        form.elements["stud-observacoes"].value = aluno.observacoes;
        form.elements["stud-carga"].value = aluno.cargaHoraria;

        document.querySelectorAll(".weekday-checkbox-erp input").forEach(cb => {
          cb.checked = aluno.diasSemana.includes(cb.value);
        });

        // Valores monetários formatados
        form.elements["stud-val-total"].value = aluno.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        form.elements["stud-desconto"].value = aluno.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        form.elements["stud-entrada"].value = aluno.entrada.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        
        form.elements["stud-forma-pagto"].value = aluno.formaPagamento;
        form.elements["stud-parcelas"].value = aluno.qtdeParcelas;
        form.elements["stud-dia-venc"].value = aluno.diaVencimento;
        form.elements["stud-prim-venc"].value = aluno.primeiroVencimento;

        this.setToggleValue("stud-toggle-contrato", aluno.contratoAssinado);
        this.setToggleValue("stud-toggle-documento", aluno.documentoAnexado);
        this.setToggleValue("stud-toggle-certificado", aluno.certificadoEmitido);

        this.renderStudentPaymentTable(aluno.parcelas);
        this.renderStudentUploadedDocs(aluno.documentos || []);
        this.updateStudentTotals();
      }
    } else {
      form.elements["stud-status"].value = "Ativo";
      form.elements["stud-modalidade"].value = "Presencial";
      form.elements["stud-carga"].value = "60";
      form.elements["stud-val-total"].value = "990,00";
      form.elements["stud-desconto"].value = "0,00";
      form.elements["stud-entrada"].value = "0,00";
      form.elements["stud-parcelas"].value = "3";
      form.elements["stud-dia-venc"].value = "Todo dia 10";
      form.elements["stud-forma-pagto"].value = "Parcelado";

      this.setToggleValue("stud-toggle-contrato", false);
      this.setToggleValue("stud-toggle-documento", false);
      this.setToggleValue("stud-toggle-certificado", false);

      this.triggerStudentCalculation();
    }
  },

  closeStudentModal() {
    this.currentEditingStudentId = null;
    this.navigateTo("alunos");
  },

  triggerStudentCalculation() {
    const form = document.getElementById("student-form");
    
    // Parsear valores formatados do input mask
    const total = parseFloat(form.elements["stud-val-total"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const desconto = parseFloat(form.elements["stud-desconto"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const entrada = parseFloat(form.elements["stud-entrada"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const parcelasCount = parseInt(form.elements["stud-parcelas"].value) || 1;
    const primVenc = form.elements["stud-prim-venc"].value;

    const calc = StudentManager.calculateFinancials(total, desconto, entrada, parcelasCount);
    
    document.getElementById("stud-val-desc-view").textContent = `R$ ${calc.valorComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("stud-val-parcelar-view").textContent = `R$ ${calc.valorParcelar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("stud-val-parcela-view").textContent = `R$ ${calc.valorParcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    if (primVenc) {
      const parcelas = StudentManager.generateParcelasSchedule(calc.valorParcela, parcelasCount, primVenc);
      this.renderStudentPaymentTable(parcelas);
    }
    
    this.updateStudentTotals();
  },

  renderStudentPaymentTable(parcelas) {
    const body = document.getElementById("student-payment-schedule-body");
    body.innerHTML = "";

    parcelas.forEach((p, idx) => {
      const tr = document.createElement("tr");

      let dateStr = p.vencimento;
      if (dateStr) {
        const [year, month, day] = dateStr.split("-");
        dateStr = `${day}/${month}/${year}`;
      }

      let datePagtoStr = p.dataPagamento;
      if (datePagtoStr) {
        const [year, month, day] = datePagtoStr.split("-");
        datePagtoStr = `${day}/${month}/${year}`;
      } else {
        datePagtoStr = "-";
      }

      const pagoChecked = p.pago ? "checked" : "";
      const statusBadge = p.status === "PAGO" 
        ? `<span class="badge pago">Pago</span>` 
        : p.status === "ATRASADO"
          ? `<span class="badge atrasado">Atrasado</span>`
          : `<span class="badge pending">Pendente</span>`;

      tr.innerHTML = `
        <td style="text-align: center;">${p.numero}/${parcelas.length}</td>
        <td>${dateStr}</td>
        <td><strong>R$ ${p.valor.toFixed(2)}</strong></td>
        <td style="text-align: center;">
          <input type="checkbox" class="pay-checkbox" data-idx="${idx}" ${pagoChecked} style="cursor: pointer; width: 14px; height: 14px; accent-color: var(--success);">
        </td>
        <td>${datePagtoStr}</td>
        <td>
          <select class="pay-method-select" data-idx="${idx}" style="font-size: 11px; padding: 2px 4px; height: 20px; border-radius: 3px; border: 1px solid var(--border-color); outline: none; background-color: var(--bg-card); color: var(--text-main);">
            <option value="Pix" ${p.formaPagamento === "Pix" ? "selected" : ""}>Pix</option>
            <option value="Cartão de Crédito" ${p.formaPagamento.includes("Crédito") ? "selected" : ""}>C. Crédito</option>
            <option value="Boleto" ${p.formaPagamento.includes("Boleto") ? "selected" : ""}>Boleto</option>
            <option value="" ${p.formaPagamento === "" ? "selected" : ""}>-</option>
          </select>
        </td>
        <td>${statusBadge}</td>
      `;

      tr.querySelector(".pay-checkbox").addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        const index = parseInt(e.target.getAttribute("data-idx"));
        const todayStr = new Date().toISOString().split("T")[0];

        parcelas[index].pago = isChecked;
        parcelas[index].dataPagamento = isChecked ? todayStr : "";
        parcelas[index].status = isChecked ? "PAGO" : "PENDENTE";

        const methodSelect = tr.querySelector(".pay-method-select");
        if (isChecked && !methodSelect.value) {
          methodSelect.value = "Pix";
          parcelas[index].formaPagamento = "Pix";
        } else if (!isChecked) {
          methodSelect.value = "";
          parcelas[index].formaPagamento = "";
        }

        this.renderStudentPaymentTable(parcelas);
        this.updateStudentTotals();
      });

      tr.querySelector(".pay-method-select").addEventListener("change", (e) => {
        const value = e.target.value;
        const index = parseInt(e.target.getAttribute("data-idx"));
        parcelas[index].formaPagamento = value;
        
        if (value && !parcelas[index].pago) {
          parcelas[index].pago = true;
          parcelas[index].dataPagamento = new Date().toISOString().split("T")[0];
          parcelas[index].status = "PAGO";
          this.renderStudentPaymentTable(parcelas);
        } else if (!value && parcelas[index].pago) {
          parcelas[index].pago = false;
          parcelas[index].dataPagamento = "";
          parcelas[index].status = "PENDENTE";
          this.renderStudentPaymentTable(parcelas);
        }
        
        this.updateStudentTotals();
      });

      body.appendChild(tr);
    });

    document.getElementById("student-form").dataset.parcelas = JSON.stringify(parcelas);
  },

  updateStudentTotals() {
    const form = document.getElementById("student-form");
    const total = parseFloat(form.elements["stud-val-total"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const desconto = parseFloat(form.elements["stud-desconto"].value.replace(/\./g, "").replace(",", ".")) || 0;
    
    let parcelas = [];
    try {
      parcelas = JSON.parse(form.dataset.parcelas || "[]");
    } catch(e) {}

    let totalPago = 0;
    parcelas.forEach(p => {
      if (p.pago) totalPago += p.valor;
    });

    const valorComDesconto = Math.max(0, total - desconto);
    const saldoPendente = Math.max(0, valorComDesconto - totalPago);

    document.getElementById("stud-total-curso-view").textContent = `R$ ${valorComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("stud-total-pago-view").textContent = `R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("stud-saldo-pendente-view").textContent = `R$ ${saldoPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  },

  renderStudentUploadedDocs(docs) {
    const list = document.getElementById("student-uploaded-docs");
    list.innerHTML = "";
    docs.forEach(doc => {
      const item = document.createElement("div");
      item.className = "uploaded-doc-item";
      item.innerHTML = `
        <a href="#" onclick="alert('Visualizando arquivo: ${doc}'); return false;">📁 ${doc}</a>
        <button type="button" class="del-doc-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;
      item.querySelector(".del-doc-btn").addEventListener("click", async () => {
        const student = await StudentManager.getAlunoById(this.currentEditingStudentId);
        if (student) {
          student.documentos = (student.documentos || []).filter(d => d !== doc);
          await StudentManager.saveAluno(student);
          this.renderStudentUploadedDocs(student.documentos);
        } else {
          item.remove();
        }
      });
      list.appendChild(item);
    });
  },

  async saveStudentForm() {
    const form = document.getElementById("student-form");
    if (!form.elements["stud-nome"].value || !form.elements["stud-cpf"].value) {
      alert("Por favor, preencha o Nome Completo e CPF!");
      return;
    }

    const diasSemana = [];
    document.querySelectorAll(".weekday-checkbox-erp input:checked").forEach(cb => {
      diasSemana.push(cb.value);
    });

    let parcelas = [];
    try {
      parcelas = JSON.parse(form.dataset.parcelas || "[]");
    } catch(e) {}

    const listDocs = [];
    document.querySelectorAll("#student-uploaded-docs a").forEach(link => {
      listDocs.push(link.textContent.replace("📁 ", ""));
    });

    const total = parseFloat(form.elements["stud-val-total"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const desconto = parseFloat(form.elements["stud-desconto"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const entrada = parseFloat(form.elements["stud-entrada"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const valorComDesconto = Math.max(0, total - desconto);

    const aluno = {
      id: this.currentEditingStudentId,
      nome: form.elements["stud-nome"].value.toUpperCase(),
      email: form.elements["stud-email"].value,
      cpf: form.elements["stud-cpf"].value,
      rg: form.elements["stud-rg"].value,
      whatsapp: form.elements["stud-whatsapp"].value,
      telefone: form.elements["stud-telefone"].value,
      dataNasc: form.elements["stud-nasc"].value,
      sexo: form.elements["stud-sexo"].value,
      estadoCivil: form.elements["stud-civil"].value,
      responsavel: form.elements["stud-responsavel"].value.toUpperCase(),
      parentesco: form.elements["stud-parentesco"].value,

      cep: form.elements["stud-cep"].value,
      endereco: form.elements["stud-endereco"].value.toUpperCase(),
      numero: form.elements["stud-numero"].value,
      complemento: form.elements["stud-complemento"].value.toUpperCase(),
      bairro: form.elements["stud-bairro"].value.toUpperCase(),
      cidade: form.elements["stud-cidade"].value,
      estado: form.elements["stud-estado"].value,

      curso: form.elements["stud-curso"].value.toUpperCase(),
      turma: form.elements["stud-turma"].value,
      dataInicio: form.elements["stud-inicio"].value,
      dataTermino: form.elements["stud-termino"].value,
      diasSemana: diasSemana,
      horarioInicio: form.elements["stud-inicio-aula"] ? form.elements["stud-inicio-aula"].value : "08:00",
      horarioFim: form.elements["stud-fim-aula"] ? form.elements["stud-fim-aula"].value : "10:00",
      professor: form.elements["stud-professor"].value,
      modalidade: form.elements["stud-modalidade"].value,
      cargaHoraria: parseInt(form.elements["stud-carga"].value) || 60,
      status: form.elements["stud-status"].value,
      observacoes: form.elements["stud-observacoes"].value,

      valorTotal: total,
      desconto: desconto,
      valorDesconto: valorComDesconto,
      entrada: entrada,
      valorParcelar: Math.max(0, valorComDesconto - entrada),
      formaPagamento: form.elements["stud-forma-pagto"].value,
      qtdeParcelas: parseInt(form.elements["stud-parcelas"].value) || 1,
      valorParcela: parcelas.length > 0 ? parcelas[0].valor : 0,
      diaVencimento: form.elements["stud-dia-venc"].value,
      primeiroVencimento: form.elements["stud-prim-venc"].value,
      parcelas: parcelas,

      contratoAssinado: this.getToggleValue("stud-toggle-contrato"),
      documentoAnexado: this.getToggleValue("stud-toggle-documento"),
      certificadoEmitido: this.getToggleValue("stud-toggle-certificado"),
      documentos: listDocs
    };

    await StudentManager.saveAluno(aluno);
    
    alert("Cadastro do Aluno salvo no SQLite com sucesso!");
    this.closeStudentModal();
    this.navigateTo("alunos");
  },

  // MODAL DE CADASTRO DE EMPRESA (Assíncrono)
  async openCompanyModal(companyId = null) {
    this.currentEditingCompanyId = companyId;
    this.navigateTo("company-form");

    const form = document.getElementById("company-form");
    form.reset();

    // Reset visual
    form.querySelectorAll(".form-input-erp").forEach(el => el.classList.remove("input-valid"));

    document.getElementById("company-payment-schedule-body").innerHTML = "";
    document.getElementById("company-uploaded-docs").innerHTML = "";
    document.getElementById("company-history-payments-body").innerHTML = "";

    this.switchCompanyTab("dados");

    if (companyId) {
      const empresa = await CompanyManager.getEmpresaById(companyId);
      if (empresa) {
        form.elements["comp-razao"].value = empresa.razaoSocial;
        form.elements["comp-fantasia"].value = empresa.nomeFantasia;
        form.elements["comp-cnpj"].value = empresa.cnpj;
        form.elements["comp-ie"].value = empresa.inscricaoEstadual;
        form.elements["comp-segmento"].value = empresa.segmento;
        form.elements["comp-porte"].value = empresa.porte;
        form.elements["comp-telefone"].value = empresa.telefone;
        form.elements["comp-whatsapp"].value = empresa.whatsapp;
        form.elements["comp-email"].value = empresa.email;
        form.elements["comp-site"].value = empresa.site;

        form.elements["comp-cep"].value = empresa.cep;
        form.elements["comp-endereco"].value = empresa.endereco;
        form.elements["comp-numero"].value = empresa.numero;
        form.elements["comp-complemento"].value = empresa.complemento;
        form.elements["comp-bairro"].value = empresa.bairro;
        form.elements["comp-cidade"].value = empresa.cidade;
        form.elements["comp-estado"].value = empresa.estado;

        form.elements["comp-plano"].value = empresa.plano;
        form.elements["comp-inicio"].value = empresa.dataInicio;
        form.elements["comp-termino"].value = empresa.dataTermino;
        form.elements["comp-venc-plano"].value = empresa.diaVencimento;
        form.elements["comp-status-plano"].value = empresa.statusPlano;
        form.elements["comp-usuarios"].value = empresa.usuariosContratados;
        form.elements["comp-desc-plano"].value = empresa.descricaoPlano;

        form.elements["comp-val-mensal"].value = empresa.valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        form.elements["comp-desconto"].value = empresa.desconto;
        form.elements["comp-taxas"].value = empresa.taxas.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        form.elements["comp-forma-pagto"].value = empresa.formaPagamento;
        form.elements["comp-dia-venc"].value = empresa.diaVencimento;
        form.elements["comp-prim-venc"].value = empresa.dataInicio;
        form.elements["comp-obs-fin"].value = empresa.observacoesFinanceiras;

        this.setToggleValue("comp-toggle-contrato", empresa.contratoAssinado);
        this.setToggleValue("comp-toggle-documento", empresa.documentoAnexado);
        this.setToggleValue("comp-toggle-renovacao", empresa.renovacaoAutomatica);

        this.renderCompanyPaymentTable(empresa.parcelasContrato);
        this.renderCompanyUploadedDocs(empresa.documentos || []);
        this.renderCompanyHistoryPayments(empresa.parcelasContrato);
        await this.renderCompanyMetaAdsDashboard();
        
        this.updateCompanyTotals();
      }
    } else {
      form.elements["comp-porte"].value = "Pequena";
      form.elements["comp-status-plano"].value = "ATIVO";
      form.elements["comp-plano"].value = "PLANO PROFISSIONAL";
      form.elements["comp-val-mensal"].value = "3.500,00";
      form.elements["comp-desconto"].value = "0";
      form.elements["comp-taxas"].value = "0,00";
      form.elements["comp-forma-pagto"].value = "Pix";
      form.elements["comp-dia-venc"].value = "Todo dia 10";
      form.elements["comp-venc-plano"].value = "Todo dia 10";
      form.elements["comp-usuarios"].value = "5";

      this.setToggleValue("comp-toggle-contrato", false);
      this.setToggleValue("comp-toggle-documento", false);
      this.setToggleValue("comp-toggle-renovacao", true);

      this.triggerCompanyCalculation();
    }
  },

  switchCompanyTab(tabId) {
    this.activeCompanyTab = tabId;
    document.querySelectorAll(".tab-btn-erp").forEach(btn => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    document.querySelectorAll(".tab-content-erp").forEach(content => {
      if (content.id === `comp-tab-${tabId}`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    if (tabId === "meta") {
      this.renderCompanyMetaAdsDashboard();
    }
  },

  closeCompanyModal() {
    this.currentEditingCompanyId = null;
    this.navigateTo("empresas");
  },

  triggerCompanyCalculation() {
    const form = document.getElementById("company-form");
    const valorMensal = parseFloat(form.elements["comp-val-mensal"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const descontoPercent = parseFloat(form.elements["comp-desconto"].value) || 0;
    const taxas = parseFloat(form.elements["comp-taxas"].value.replace(/\./g, "").replace(",", ".")) || 0;

    const descValor = valorMensal * (descontoPercent / 100);
    const valorComDesconto = Math.max(0, valorMensal - descValor);
    const valorTotal = valorComDesconto + taxas;

    document.getElementById("comp-val-desc-view").textContent = `R$ ${valorComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("comp-val-total-view").textContent = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    const plano = form.elements["comp-plano"].value;
    let duracao = 6;
    if (plano.includes("AVANÇADO") || plano.includes("PREMIUM")) duracao = 12;

    const dataInicio = form.elements["comp-inicio"].value;
    const diaVenc = form.elements["comp-dia-venc"].value;

    if (dataInicio) {
      const parcelas = CompanyManager.generateContractSchedule(valorMensal, duracao, dataInicio, diaVenc, descontoPercent);
      this.renderCompanyPaymentTable(parcelas);
      this.renderCompanyHistoryPayments(parcelas);
    }
    
    this.updateCompanyTotals();
  },

  renderCompanyPaymentTable(parcelas) {
    const body = document.getElementById("company-payment-schedule-body");
    body.innerHTML = "";

    parcelas.forEach((p, idx) => {
      const tr = document.createElement("tr");

      let dateStr = p.vencimento;
      if (dateStr) {
        const [year, month, day] = dateStr.split("-");
        dateStr = `${day}/${month}/${year}`;
      }

      let datePagtoStr = p.dataPagamento;
      if (datePagtoStr) {
        const [year, month, day] = datePagtoStr.split("-");
        datePagtoStr = `${day}/${month}/${year}`;
      } else {
        datePagtoStr = "-";
      }

      const isPago = p.status === "PAGO";
      const statusBadge = isPago
        ? `<span class="badge pago">Pago</span>`
        : `<span class="badge pending">Pendente</span>`;

      tr.innerHTML = `
        <td style="text-align: center;">${p.parcela}</td>
        <td style="text-align: center;">${p.competencia}</td>
        <td>${dateStr}</td>
        <td><strong>R$ ${p.valor.toFixed(2)}</strong></td>
        <td>R$ ${p.desconto.toFixed(2)}</td>
        <td>R$ ${p.acrescimos.toFixed(2)}</td>
        <td><strong style="color: #2563eb;">R$ ${p.total.toFixed(2)}</strong></td>
        <td style="text-align: center;">
          <input type="checkbox" class="comp-pay-checkbox" data-idx="${idx}" ${isPago ? "checked" : ""} style="cursor: pointer; width: 14px; height: 14px; accent-color: var(--success);">
        </td>
        <td>${statusBadge}</td>
        <td>${datePagtoStr}</td>
        <td>
          <select class="comp-pay-method-select" data-idx="${idx}" style="font-size: 11px; padding: 2px 4px; height: 20px; border-radius: 3px; border: 1px solid var(--border-color); outline: none; background-color: var(--bg-card); color: var(--text-main);">
            <option value="Pix" ${p.formaPagamento === "Pix" ? "selected" : ""}>Pix</option>
            <option value="Boleto" ${p.formaPagamento.includes("Boleto") ? "selected" : ""}>Boleto</option>
            <option value="Cartão de Crédito" ${p.formaPagamento.includes("Crédito") ? "selected" : ""}>C. Crédito</option>
            <option value="" ${p.formaPagamento === "" ? "selected" : ""}>-</option>
          </select>
        </td>
      `;

      tr.querySelector(".comp-pay-checkbox").addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        const index = parseInt(e.target.getAttribute("data-idx"));
        const todayStr = new Date().toISOString().split("T")[0];

        parcelas[index].status = isChecked ? "PAGO" : "PENDENTE";
        parcelas[index].dataPagamento = isChecked ? todayStr : "";
        
        const methodSelect = tr.querySelector(".comp-pay-method-select");
        if (isChecked && !methodSelect.value) {
          methodSelect.value = "Pix";
          parcelas[index].formaPagamento = "Pix";
        } else if (!isChecked) {
          methodSelect.value = "";
          parcelas[index].formaPagamento = "";
        }

        this.renderCompanyPaymentTable(parcelas);
        this.renderCompanyHistoryPayments(parcelas);
        this.updateCompanyTotals();
      });

      tr.querySelector(".comp-pay-method-select").addEventListener("change", (e) => {
        const value = e.target.value;
        const index = parseInt(e.target.getAttribute("data-idx"));
        parcelas[index].formaPagamento = value;

        if (value && parcelas[index].status !== "PAGO") {
          parcelas[index].status = "PAGO";
          parcelas[index].dataPagamento = new Date().toISOString().split("T")[0];
          this.renderCompanyPaymentTable(parcelas);
          this.renderCompanyHistoryPayments(parcelas);
        } else if (!value && parcelas[index].status === "PAGO") {
          parcelas[index].status = "PENDENTE";
          parcelas[index].dataPagamento = "";
          this.renderCompanyPaymentTable(parcelas);
          this.renderCompanyHistoryPayments(parcelas);
        }

        this.updateCompanyTotals();
      });

      body.appendChild(tr);
    });

    document.getElementById("company-form").dataset.parcelas = JSON.stringify(parcelas);
  },

  renderCompanyHistoryPayments(parcelas) {
    const body = document.getElementById("company-history-payments-body");
    body.innerHTML = "";

    const pagas = parcelas.filter(p => p.status === "PAGO");
    
    if (pagas.length === 0) {
      body.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum pagamento registrado no histórico.</td></tr>`;
      return;
    }

    pagas.forEach(p => {
      const tr = document.createElement("tr");

      let dateStr = p.dataPagamento || p.vencimento;
      if (dateStr) {
        const [year, month, day] = dateStr.split("-");
        dateStr = `${day}/${month}/${year}`;
      }

      tr.innerHTML = `
        <td>${dateStr}</td>
        <td>Pagamento da parcela ${p.parcela} (${p.competencia})</td>
        <td style="color: var(--success-hover);"><strong>R$ ${p.total.toFixed(2)}</strong></td>
        <td>${p.formaPagamento}</td>
        <td>Admin</td>
      `;
      body.appendChild(tr);
    });
  },

  updateCompanyTotals() {
    const form = document.getElementById("company-form");
    
    let parcelas = [];
    try {
      parcelas = JSON.parse(form.dataset.parcelas || "[]");
    } catch(e) {}

    let totalContrato = 0;
    let totalPago = 0;
    
    parcelas.forEach(p => {
      totalContrato += p.total;
      if (p.status === "PAGO") {
        totalPago += p.total;
      }
    });

    const saldoAberto = Math.max(0, totalContrato - totalPago);
    const pagasCount = parcelas.filter(p => p.status === "PAGO").length;

    document.getElementById("comp-tot-contrato-view").textContent = `R$ ${totalContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("comp-tot-pago-view").textContent = `R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("comp-saldo-aberto-view").textContent = `R$ ${saldoAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    document.getElementById("comp-resumo-plano-name").textContent = form.elements["comp-plano"].value;
    document.getElementById("comp-resumo-status").textContent = form.elements["comp-status-plano"].value;
    
    const inicioDate = form.elements["comp-inicio"].value;
    if (inicioDate) {
      const [y, m, d] = inicioDate.split("-");
      document.getElementById("comp-resumo-inicio").textContent = `${d}/${m}/${y}`;
    } else {
      document.getElementById("comp-resumo-inicio").textContent = "-";
    }

    const terminoDate = form.elements["comp-termino"].value;
    if (terminoDate) {
      const [y, m, d] = terminoDate.split("-");
      document.getElementById("comp-resumo-termino").textContent = `${d}/${m}/${y}`;
    } else {
      document.getElementById("comp-resumo-termino").textContent = "-";
    }

    document.getElementById("comp-resumo-mensal").textContent = `R$ ${parseFloat(form.elements["comp-val-mensal"].value.replace(/\./g, "").replace(",", ".") || 0).toFixed(2)}`;
  },

  renderCompanyUploadedDocs(docs) {
    const list = document.getElementById("company-uploaded-docs");
    list.innerHTML = "";
    docs.forEach(doc => {
      const item = document.createElement("div");
      item.className = "uploaded-doc-item";
      item.innerHTML = `
        <a href="#" onclick="alert('Visualizando arquivo: ${doc}'); return false;">📁 ${doc}</a>
        <button type="button" class="del-doc-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;
      item.querySelector(".del-doc-btn").addEventListener("click", async () => {
        const company = await CompanyManager.getEmpresaById(this.currentEditingCompanyId);
        if (company) {
          company.documentos = (company.documentos || []).filter(d => d !== doc);
          await CompanyManager.saveEmpresa(company);
          this.renderCompanyUploadedDocs(company.documentos);
        } else {
          item.remove();
        }
      });
      list.appendChild(item);
    });
  },

  // RENDERIZAÇÃO DO MONITOR DE CAMPANHAS DO META ADS
  async renderCompanyMetaAdsDashboard() {
    if (!this.currentEditingCompanyId) {
      document.getElementById("meta-ads-content-panel").innerHTML = `<div style="text-align: center; padding: 32px; color: var(--text-muted);">Salve a empresa primeiro para carregar o Meta Ads.</div>`;
      return;
    }

    const empresa = await CompanyManager.getEmpresaById(this.currentEditingCompanyId);
    const analytics = CompanyManager.getMetaAdsAnalytics(empresa);

    const panel = document.getElementById("meta-ads-content-panel");
    panel.innerHTML = "";

    let champHTML = "";
    if (analytics.melhorCampanha) {
      const champ = analytics.melhorCampanha;
      champHTML = `
        <div class="meta-ads-banner-champ">
          <div class="meta-ads-champ-details">
            <span class="meta-ads-champ-tag">🏆 Melhor Campanha (Maior Conversão)</span>
            <div class="meta-ads-champ-name">${champ.nome}</div>
            <div class="meta-ads-champ-metrics">
              <span>Resultados: <strong>${champ.resultados} leads</strong></span>
              <span>CPA: <strong>R$ ${champ.cpa.toFixed(2)}</strong></span>
              <span>Gasto: <strong>R$ ${champ.valorGasto.toFixed(2)}</strong></span>
            </div>
          </div>
          <div class="meta-ads-logo-group">
            <svg class="meta-ads-logo-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
            </svg>
          </div>
        </div>
      `;
    } else {
      champHTML = `<div style="padding: 12px; background-color: rgba(226, 232, 240, 0.3); border-radius: 4px; text-align: center; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 16px;">Nenhuma campanha ativa encontrada nesta conta.</div>`;
    }

    const gridHTML = `
      <div class="meta-ads-totals-grid">
        <div class="meta-ads-metric-card">
          <span class="meta-ads-metric-label">Valor Investido</span>
          <span class="meta-ads-metric-value" style="color: #2563eb;">R$ ${analytics.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="meta-ads-metric-card">
          <span class="meta-ads-metric-label">Conversões (Leads)</span>
          <span class="meta-ads-metric-value" style="color: #10b981;">${analytics.totalResultados}</span>
        </div>
        <div class="meta-ads-metric-card">
          <span class="meta-ads-metric-label">CPA Médio Geral</span>
          <span class="meta-ads-metric-value" style="color: #ef4444;">R$ ${analytics.cpaMedio.toFixed(2)}</span>
        </div>
        <div class="meta-ads-metric-card">
          <span class="meta-ads-metric-label">CTR Médio</span>
          <span class="meta-ads-metric-value" style="color: #f59e0b;">${analytics.ctrMedio.toFixed(2)}%</span>
        </div>
      </div>
    `;

    let rowsHTML = "";
    if (empresa.campanhasMeta && empresa.campanhasMeta.length > 0) {
      const sorted = [...empresa.campanhasMeta].sort((a, b) => b.resultados - a.resultados);
      
      sorted.forEach(camp => {
        const isAtiva = camp.status === "ATIVA";
        const statusBadge = isAtiva
          ? `<span class="badge active" style="font-size: 9px; padding: 2px 6px;">Ativa</span>`
          : `<span class="badge danger" style="font-size: 9px; padding: 2px 6px;">Pausada</span>`;

        rowsHTML += `
          <tr>
            <td><strong>${camp.nome}</strong></td>
            <td>${statusBadge}</td>
            <td>R$ ${camp.orcamentoDiario.toFixed(2)}/dia</td>
            <td>R$ ${camp.valorGasto.toFixed(2)}</td>
            <td>${camp.impressoes.toLocaleString("pt-BR")}</td>
            <td>${camp.cliques.toLocaleString("pt-BR")}</td>
            <td><strong style="color: #10b981;">${camp.resultados}</strong></td>
            <td><strong style="color: #ef4444;">R$ ${camp.cpa.toFixed(2)}</strong></td>
            <td>
              <div style="display: flex; gap: 4px;">
                <button type="button" class="btn-erp" onclick="window.toggleCampaignStatusManual(${camp.id}, '${camp.status}');" style="height: 22px; font-size: 9px; padding: 0 6px;">
                  ${isAtiva ? "Pausar" : "Ativar"}
                </button>
                <button type="button" class="btn-erp danger" onclick="window.deleteCampaignManual(${camp.id});" style="height: 22px; font-size: 9px; padding: 0 6px;">
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    } else {
      rowsHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 12px 0;">Nenhuma campanha criada. Use o painel acima para criar sua primeira campanha!</td></tr>`;
    }

    const tableHTML = `
      <div style="margin-top: 8px;">
        <h4 style="font-size: 11px; font-weight: 700; margin-bottom: 8px; color: var(--text-main); text-transform: uppercase;">Campanhas Monitoradas (SQLite DB)</h4>
        <div class="payments-table-container-erp" style="max-height: 180px;">
          <table class="table-payments-erp">
            <thead>
              <tr>
                <th>Nome da Campanha</th>
                <th>Status</th>
                <th>Orçamento</th>
                <th>Gasto</th>
                <th>Imp.</th>
                <th>Cliques</th>
                <th>Leads</th>
                <th>CPA</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    panel.innerHTML = champHTML + gridHTML + tableHTML;
  },

  // ADICIONAR CAMPANHA META MANUAL DIRETO NO FORMULÁRIO (VIA API)
  async saveMetaCampaignManual() {
    const nameInput = document.getElementById("meta-camp-name");
    const budgetInput = document.getElementById("meta-camp-budget");
    const spentInput = document.getElementById("meta-camp-spent");
    const leadsInput = document.getElementById("meta-camp-leads");
    const clicksInput = document.getElementById("meta-camp-clicks");
    const impInput = document.getElementById("meta-camp-impressions");

    if (!nameInput.value || !budgetInput.value) {
      alert("Por favor, preencha os campos obrigatórios da campanha!");
      return;
    }

    const budget = parseFloat(budgetInput.value) || 0;
    const spent = parseFloat(spentInput.value) || 0;
    const leads = parseInt(leadsInput.value) || 0;
    
    const camp = {
      nome: nameInput.value.toUpperCase(),
      status: "ATIVA",
      orcamentoDiario: budget,
      valorGasto: spent,
      impressoes: parseInt(impInput.value) || 0,
      cliques: parseInt(clicksInput.value) || 0,
      resultados: leads,
      cpa: leads > 0 ? (spent / leads) : 0
    };

    const success = await CompanyManager.addMetaCampaign(this.currentEditingCompanyId, camp);
    
    if (success) {
      alert("Campanha do Meta Ads salva no SQLite com sucesso!");
      nameInput.value = "";
      budgetInput.value = "";
      spentInput.value = "";
      leadsInput.value = "";
      clicksInput.value = "";
      impInput.value = "";
      
      await this.renderCompanyMetaAdsDashboard();
      this.updateCompanyTotals();
    }
  },

  async toggleCampaignStatusManual(campId, currentStatus) {
    const success = await CompanyManager.toggleCampaignStatus(this.currentEditingCompanyId, campId, currentStatus);
    if (success) {
      await this.renderCompanyMetaAdsDashboard();
    }
  },

  async deleteCampaignManual(campId) {
    if (confirm("Tem certeza que deseja excluir esta campanha da conta Meta Ads?")) {
      const success = await CompanyManager.deleteMetaCampaign(this.currentEditingCompanyId, campId);
      if (success) {
        await this.renderCompanyMetaAdsDashboard();
        this.updateCompanyTotals();
      }
    }
  },

  // Compartilhar WhatsApp Relatório
  async shareMetaReport() {
    if (!this.currentEditingCompanyId) {
      alert("Selecione e salve a empresa primeiro!");
      return;
    }
    const empresa = await CompanyManager.getEmpresaById(this.currentEditingCompanyId);
    CompanyManager.enviarRelatorioWhatsApp(empresa);
  },

  // Salvar cadastro de Empresa
  async saveCompanyForm() {
    const form = document.getElementById("company-form");
    if (!form.elements["comp-razao"].value || !form.elements["comp-cnpj"].value) {
      alert("Por favor, preencha a Razão Social e CNPJ!");
      return;
    }

    let parcelas = [];
    try {
      parcelas = JSON.parse(form.dataset.parcelas || "[]");
    } catch(e) {}

    const listDocs = [];
    document.querySelectorAll("#company-uploaded-docs a").forEach(link => {
      listDocs.push(link.textContent.replace("📁 ", ""));
    });

    const valorMensal = parseFloat(form.elements["comp-val-mensal"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const descontoPercent = parseFloat(form.elements["comp-desconto"].value) || 0;
    const taxas = parseFloat(form.elements["comp-taxas"].value.replace(/\./g, "").replace(",", ".")) || 0;
    const descValor = valorMensal * (descontoPercent / 100);
    const valorComDesconto = Math.max(0, valorMensal - descValor);

    const plano = form.elements["comp-plano"].value;
    let duracao = 6;
    if (plano.includes("AVANÇADO") || plano.includes("PREMIUM")) duracao = 12;

    // Obter as campanhas ativas para não perdê-las na submissão
    let antigasCampanhas = [];
    if (this.currentEditingCompanyId) {
      const e = await CompanyManager.getEmpresaById(this.currentEditingCompanyId);
      antigasCampanhas = e ? e.campanhasMeta : [];
    }

    const empresa = {
      id: this.currentEditingCompanyId,
      razaoSocial: form.elements["comp-razao"].value.toUpperCase(),
      nomeFantasia: form.elements["comp-fantasia"].value.toUpperCase(),
      cnpj: form.elements["comp-cnpj"].value,
      inscricaoEstadual: form.elements["comp-ie"].value,
      segmento: form.elements["comp-segmento"].value,
      porte: form.elements["comp-porte"].value,
      telefone: form.elements["comp-telefone"].value,
      whatsapp: form.elements["comp-whatsapp"].value,
      email: form.elements["comp-email"].value,
      site: form.elements["comp-site"].value,

      cep: form.elements["comp-cep"].value,
      endereco: form.elements["comp-endereco"].value.toUpperCase(),
      numero: form.elements["comp-numero"].value,
      complemento: form.elements["comp-complemento"].value.toUpperCase(),
      bairro: form.elements["comp-bairro"].value.toUpperCase(),
      cidade: form.elements["comp-cidade"].value,
      estado: form.elements["comp-estado"].value,

      plano: plano,
      dataInicio: form.elements["comp-inicio"].value,
      dataTermino: form.elements["comp-termino"].value,
      diaVencimento: form.elements["comp-dia-venc"].value,
      statusPlano: form.elements["comp-status-plano"].value,
      usuariosContratados: parseInt(form.elements["comp-usuarios"].value) || 5,
      descricaoPlano: form.elements["comp-desc-plano"].value,

      valorMensal: valorMensal,
      desconto: descontoPercent,
      valorComDesconto: valorComDesconto,
      taxas: taxas,
      valorTotal: valorComDesconto + taxas,
      formaPagamento: form.elements["comp-forma-pagto"].value,
      situacaoFinanceira: "EM DIA",
      observacoesFinanceiras: form.elements["comp-obs-fin"].value,
      duracaoMeses: duracao,
      parcelasContrato: parcelas,
      campanhasMeta: antigasCampanhas,

      contratoAssinado: this.getToggleValue("comp-toggle-contrato"),
      documentoAnexado: this.getToggleValue("comp-toggle-documento"),
      renovacaoAutomatica: this.getToggleValue("comp-toggle-renovacao"),
      documentos: listDocs
    };

    await CompanyManager.saveEmpresa(empresa);
    
    alert("Cadastro da Empresa salvo no SQLite com sucesso!");
    this.closeCompanyModal();
    this.navigateTo("empresas");
  },

  bindToggleEvents(toggleId) {
    const el = document.getElementById(toggleId);
    if (!el) return;

    el.querySelectorAll(".toggle-option-erp").forEach(opt => {
      opt.addEventListener("click", () => {
        el.querySelectorAll(".toggle-option-erp").forEach(o => {
          o.classList.remove("active-yes", "active-no");
        });

        const isYes = opt.getAttribute("data-val") === "sim";
        if (isYes) {
          opt.classList.add("active-yes");
        } else {
          opt.classList.add("active-no");
        }
        
        el.dataset.val = isYes ? "true" : "false";
      });
    });
  },

  setToggleValue(toggleId, val) {
    const el = document.getElementById(toggleId);
    if (!el) return;

    el.querySelectorAll(".toggle-option-erp").forEach(opt => {
      opt.classList.remove("active-yes", "active-no");
      
      const isYes = opt.getAttribute("data-val") === "sim";
      if (val && isYes) {
        opt.classList.add("active-yes");
      } else if (!val && !isYes) {
        opt.classList.add("active-no");
      }
    });

    el.dataset.val = val ? "true" : "false";
  },

  getToggleValue(toggleId) {
    const el = document.getElementById(toggleId);
    if (!el) return false;
    return el.dataset.val === "true";
  },

  // HOTKEYS DO ERP TECLADO
  handleGlobalHotkeys(e) {
    const isStudModalOpen = this.activeView === "student-form";
    const isCompModalOpen = this.activeView === "company-form";

    if (isStudModalOpen) {
      if (e.key === "Escape") { e.preventDefault(); this.closeStudentModal(); }
      if (e.key === "F2") { e.preventDefault(); this.saveStudentForm(); }
      if (e.key === "F3") { e.preventDefault(); alert("Minuta de Contrato de Aluno impressa!"); this.setToggleValue("stud-toggle-contrato", true); }
      if (e.key === "F4") { e.preventDefault(); alert("Matrícula quitada rápido!"); const check = document.querySelector(".pay-checkbox:not(:checked)"); if (check) check.click(); }
      if (e.key === "F5") { e.preventDefault(); document.getElementById("student-payment-schedule-body").scrollIntoView({ behavior: "smooth" }); }
      if (e.key === "F6") { e.preventDefault(); alert("Certificado de Conclusão emitido!"); this.setToggleValue("stud-toggle-certificado", true); }
    } else if (isCompModalOpen) {
      if (e.key === "Escape") { e.preventDefault(); this.closeCompanyModal(); }
      if (e.key === "F2") { e.preventDefault(); this.saveCompanyForm(); }
      if (e.key === "F3") { e.preventDefault(); this.openCompanyModal(); }
      if (e.key === "F4") { e.preventDefault(); alert("Minuta de Prestação de Serviços de Tráfego impressa!"); this.setToggleValue("comp-toggle-contrato", true); }
      if (e.key === "F5") { e.preventDefault(); alert("Cobrança contratual rápida quitada!"); const check = document.querySelector(".comp-pay-checkbox:not(:checked)"); if (check) check.click(); }
      if (e.key === "F6") { e.preventDefault(); this.switchCompanyTab("financeiro"); }
      if (e.key === "F7") { e.preventDefault(); this.switchCompanyTab("meta"); }
    }
  }
};

// AUTO INICIALIZAÇÃO DO APP NO BROWSER
document.addEventListener("DOMContentLoaded", () => {
  App.init();

  // Globais para atalhos do HTML
  window.openStudentModal = (id) => App.openStudentModal(id);
  window.closeStudentModal = () => App.closeStudentModal();
  window.saveStudentForm = () => App.saveStudentForm();
  window.triggerStudentCalculation = () => App.triggerStudentCalculation();
  window.buscarCEPAluno = async () => {
    const cepInput = document.getElementById("stud-cep");
    const loaderBtn = document.querySelector(".cep-btn-erp");
    const val = cepInput.value;
    if (!val) return;
    
    loaderBtn.textContent = "Buscando...";
    try {
      const data = await StudentManager.buscarCEP(val);
      document.getElementById("stud-endereco").value = data.logradouro.toUpperCase();
      document.getElementById("stud-bairro").value = data.bairro.toUpperCase();
      document.getElementById("stud-cidade").value = data.localidade;
      document.getElementById("stud-estado").value = data.uf;
      loaderBtn.textContent = "Buscar CEP";
      document.getElementById("stud-numero").focus();
    } catch(err) {
      alert(err.message);
      loaderBtn.textContent = "Buscar CEP";
    }
  };

  window.openCompanyModal = (id) => App.openCompanyModal(id);
  window.closeCompanyModal = () => App.closeCompanyModal();
  window.saveCompanyForm = () => App.saveCompanyForm();
  window.triggerCompanyCalculation = () => App.triggerCompanyCalculation();
  window.switchCompanyTab = (tabId) => App.switchCompanyTab(tabId);
  window.shareMetaReport = () => App.shareMetaReport();
  window.buscarCEPEmpresa = async () => {
    const cepInput = document.getElementById("comp-cep");
    const val = cepInput.value;
    if (!val) return;
    
    try {
      const data = await StudentManager.buscarCEP(val);
      document.getElementById("comp-endereco").value = data.logradouro.toUpperCase();
      document.getElementById("comp-bairro").value = data.bairro.toUpperCase();
      document.getElementById("comp-cidade").value = data.localidade;
      document.getElementById("comp-estado").value = data.uf;
      document.getElementById("comp-numero").focus();
    } catch(err) {
      alert(err.message);
    }
  };

  // Funções Globais das novas telas de Cursos e Meta Ads
  window.saveCursoForm = () => App.saveCursoForm();
  window.deleteCurso = (idx) => App.deleteCurso(idx);
  window.saveMetaCampaignManual = () => App.saveMetaCampaignManual();
  window.toggleCampaignStatusManual = (campId, currentStatus) => App.toggleCampaignStatusManual(campId, currentStatus);
  window.deleteCampaignManual = (campId) => App.deleteCampaignManual(campId);

  // Vincular eventos toggles
  App.bindToggleEvents("stud-toggle-contrato");
  App.bindToggleEvents("stud-toggle-documento");
  App.bindToggleEvents("stud-toggle-certificado");

  App.bindToggleEvents("comp-toggle-contrato");
  App.bindToggleEvents("comp-toggle-documento");
  App.bindToggleEvents("comp-toggle-renovacao");

  // Input de busca nas listagens
  document.getElementById("search-alunos")?.addEventListener("input", () => App.renderAlunosList());
  document.getElementById("search-empresas")?.addEventListener("input", () => App.renderEmpresasList());
});
