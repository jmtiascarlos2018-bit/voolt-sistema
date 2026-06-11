// js/companyManager.js

// Objeto global de controle de empresas (Tráfego Pago) integrado ao SQLite
const CompanyManager = {
  // Obter todas as empresas via API
  async getEmpresas() {
    try {
      const response = await fetch("/api/empresas");
      if (!response.ok) throw new Error("Erro ao buscar empresas do servidor");
      return await response.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  // Obter empresa por ID
  async getEmpresaById(id) {
    const empresas = await this.getEmpresas();
    return empresas.find(e => e.id === id);
  },

  // Salvar ou atualizar empresa via API
  async saveEmpresa(empresa) {
    try {
      const response = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa)
      });
      
      if (!response.ok) throw new Error("Erro ao salvar empresa no servidor");
      const saved = await response.json();
      
      if (window.App && typeof window.App.renderDashboard === "function") {
        await window.App.renderDashboard();
      }
      return saved;
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar no banco de dados SQLite local!");
      throw err;
    }
  },

  // Excluir empresa via API
  async deleteEmpresa(id) {
    try {
      const response = await fetch(`/api/empresas/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Erro ao excluir empresa no servidor");
      
      if (window.App && typeof window.App.renderDashboard === "function") {
        await window.App.renderDashboard();
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // Gerar plano de parcelas do contrato (Ex: 12 meses)
  generateContractSchedule(valorMensal, duracaoMeses, dataInicio, diaVencimento, descontoPercent) {
    const parcelas = [];
    if (!dataInicio || duracaoMeses <= 0 || valorMensal <= 0) return [];

    let [year, month, day] = dataInicio.split("-").map(Number);
    const descPercent = parseFloat(descontoPercent) || 0;
    const descValor = valorMensal * (descPercent / 100);
    const totalParcela = valorMensal - descValor;

    let vencimentoDay = day;
    const matchDay = diaVencimento.match(/\d+/);
    if (matchDay) {
      vencimentoDay = parseInt(matchDay[0]);
    }

    for (let i = 1; i <= duracaoMeses; i++) {
      let currentMonth = month + (i - 1);
      let currentYear = year;

      if (currentMonth > 12) {
        currentYear += Math.floor((currentMonth - 1) / 12);
        currentMonth = ((currentMonth - 1) % 12) + 1;
      }

      const strMonth = String(currentMonth).padStart(2, "0");
      const strDay = String(vencimentoDay).padStart(2, "0");
      const dataVencimento = `${currentYear}-${strMonth}-${strDay}`;
      const competencia = `${strMonth}/${currentYear}`;

      parcelas.push({
        parcela: `${i}/${duracaoMeses}`,
        competencia: competencia,
        vencimento: dataVencimento,
        valor: valorMensal,
        desconto: descValor,
        acrescimos: 0,
        total: totalParcela,
        status: "PENDENTE",
        dataPagamento: "",
        formaPagamento: ""
      });
    }

    return parcelas;
  },

  // Agregar métricas do Meta Ads para uma empresa
  getMetaAdsAnalytics(empresa) {
    if (!empresa || !empresa.campanhasMeta || empresa.campanhasMeta.length === 0) {
      return {
        totalGasto: 0,
        totalImpressoes: 0,
        totalCliques: 0,
        totalResultados: 0,
        cpaMedio: 0,
        ctrMedio: 0,
        cpcMedio: 0,
        melhorCampanha: null
      };
    }

    let totalGasto = 0;
    let totalImpressoes = 0;
    let totalCliques = 0;
    let totalResultados = 0;
    let melhorCampanha = null;
    let maxResultados = -1;

    empresa.campanhasMeta.forEach(camp => {
      totalGasto += camp.valorGasto;
      totalImpressoes += camp.impressoes;
      totalCliques += camp.cliques;
      totalResultados += camp.resultados;

      if (camp.resultados > maxResultados) {
        maxResultados = camp.resultados;
        melhorCampanha = camp;
      }
    });

    const cpaMedio = totalResultados > 0 ? (totalGasto / totalResultados) : 0;
    const ctrMedio = totalImpressoes > 0 ? ((totalCliques / totalImpressoes) * 100) : 0;
    const cpcMedio = totalCliques > 0 ? (totalGasto / totalCliques) : 0;

    return {
      totalGasto,
      totalImpressoes,
      totalCliques,
      totalResultados,
      cpaMedio,
      ctrMedio,
      cpcMedio,
      melhorCampanha
    };
  },

  // ADICIONAR CAMPANHA META VIA API NO BACKEND
  async addMetaCampaign(empresaId, campanha) {
    try {
      const response = await fetch(`/api/empresas/${empresaId}/campanhas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campanha)
      });
      return response.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // EXCLUIR CAMPANHA META VIA API NO BACKEND
  async deleteMetaCampaign(empresaId, campId) {
    try {
      const response = await fetch(`/api/empresas/${empresaId}/campanhas/${campId}`, {
        method: "DELETE"
      });
      return response.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // ALTERAR STATUS DE CAMPANHA (ATIVAR/PAUSAR) VIA API
  async toggleCampaignStatus(empresaId, campId, currentStatus) {
    try {
      const newStatus = currentStatus === "ATIVA" ? "PAUSADA" : "ATIVA";
      const response = await fetch(`/api/empresas/${empresaId}/campanhas/${campId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      return response.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // Gerar relatório em formato texto amigável para enviar por WhatsApp
  generateWhatsAppReportText(empresa) {
    if (!empresa) return null;

    const analytics = this.getMetaAdsAnalytics(empresa);
    const dataAtual = new Date();
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const competenciaAtual = `${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`;

    let report = `Olá, somos da VOOLT.\n\n📊 *RELATÓRIO DE DESEMPENHO - META ADS*\n`;
    report += `🏢 *Cliente:* ${empresa.nomeFantasia}\n`;
    report += `📅 *Competência:* ${competenciaAtual}\n`;
    report += `==================================\n\n`;
    
    report += `📈 *MÉTRICAS GERAIS DA CONTA:*\n`;
    report += `💰 *Total Investido:* R$ ${analytics.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    report += `🎯 *Total de Conversões (Leads):* ${analytics.totalResultados} resultados\n`;
    report += `💸 *CPA Médio (Custo por Lead):* R$ ${analytics.cpaMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    report += `🖱️ *Cliques em Links:* ${analytics.totalCliques.toLocaleString("pt-BR")}\n`;
    report += `👀 *Impressões (Visualizações):* ${analytics.totalImpressoes.toLocaleString("pt-BR")}\n`;
    report += `📊 *Taxa de Clique (CTR):* ${analytics.ctrMedio.toFixed(2)}%\n`;
    report += `💵 *Custo por Clique (CPC):* R$ ${analytics.cpcMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;

    if (analytics.melhorCampanha) {
      const champ = analytics.melhorCampanha;
      report += `🏆 *CAMPANHA DESTAQUE (MELHOR RESULTADO):*\n`;
      report += `🚀 *Campanha:* _${champ.nome}_\n`;
      report += `✅ *Resultados:* ${champ.resultados} leads gerados\n`;
      report += `💵 *Custo por Lead da Campanha:* R$ ${champ.cpa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      report += `💰 *Gasto na Campanha:* R$ ${champ.valorGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    }

    report += `💬 _Este é um relatório gerado automaticamente pela nossa agência. Se tiver qualquer dúvida sobre as métricas ou estratégias para o próximo mês, conte conosco!_`;

    return {
      text: report,
      whatsapp: empresa.whatsapp
    };
  },

  // Abrir o WhatsApp para enviar o relatório
  enviarRelatorioWhatsApp(empresa) {
    const reportData = this.generateWhatsAppReportText(empresa);
    if (!reportData) {
      alert("Empresa não encontrada!");
      return;
    }

    let cleanPhone = reportData.whatsapp.replace(/\D/g, "");
    
    if (cleanPhone.length === 11 || cleanPhone.length === 10) {
      cleanPhone = "55" + cleanPhone;
    }

    const encodedText = encodeURIComponent(reportData.text);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    
    window.open(url, "_blank");
  }
};
