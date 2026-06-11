// js/studentManager.js

// Objeto global de controle de alunos integrado ao Backend SQLite
const StudentManager = {
  // Obter todos os alunos via API
  async getAlunos() {
    try {
      const response = await fetch("/api/alunos");
      if (!response.ok) throw new Error("Erro ao buscar alunos do servidor");
      return await response.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  // Obter aluno por ID
  async getAlunoById(id) {
    const alunos = await this.getAlunos();
    return alunos.find(a => a.id === id);
  },

  // Salvar ou atualizar aluno via API
  async saveAluno(aluno) {
    try {
      const response = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aluno)
      });
      
      if (!response.ok) throw new Error("Erro ao salvar aluno no servidor");
      const saved = await response.json();
      
      // Atualizar interface se global App estiver carregada
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

  // Excluir aluno via API
  async deleteAluno(id) {
    try {
      const response = await fetch(`/api/alunos/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Erro ao excluir aluno no servidor");
      
      if (window.App && typeof window.App.renderDashboard === "function") {
        await window.App.renderDashboard();
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // Buscar CEP via API pública ViaCEP
  async buscarCEP(cep) {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) {
      throw new Error("CEP inválido! Deve conter 8 dígitos.");
    }
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      if (data.erro) {
        throw new Error("CEP não encontrado!");
      }
      return data;
    } catch (error) {
      console.error("Erro na busca de CEP:", error);
      throw error;
    }
  },

  // MÁSCARAS DE INPUTS EM TEMPO REAL (MÉTODOS ÚTEIS)
  maskCPF(val) {
    return val.replace(/\D/g, "")
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
              .substring(0, 14); // Limita tamanho máximo do CPF
  },

  maskCNPJ(val) {
    return val.replace(/\D/g, "")
              .replace(/(\d{2})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d)/, "$1/$2")
              .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
              .substring(0, 18); // Limita tamanho máximo do CNPJ
  },

  maskPhone(val) {
    return val.replace(/\D/g, "")
              .replace(/(\d{2})(\d)/, "($1) $2")
              .replace(/(\d{5})(\d{4})$/, "$1-$2")
              .substring(0, 15); // Limita tamanho máximo de telefone com DDD
  },

  maskCurrency(val) {
    let clean = val.replace(/\D/g, "");
    if (!clean) return "";
    let number = parseFloat(clean) / 100;
    return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Calcular valores financeiros de parcelamento
  calculateFinancials(total, desconto, entrada, parcelasCount) {
    const numTotal = parseFloat(total) || 0;
    const numDesconto = parseFloat(desconto) || 0;
    const numEntrada = parseFloat(entrada) || 0;
    const numParcelas = parseInt(parcelasCount) || 1;

    const valorComDesconto = Math.max(0, numTotal - numDesconto);
    const valorParcelar = Math.max(0, valorComDesconto - numEntrada);
    const valorParcela = numParcelas > 0 ? (valorParcelar / numParcelas) : 0;

    return {
      valorComDesconto: valorComDesconto,
      valorParcelar: valorParcelar,
      valorParcela: valorParcela
    };
  },

  // Gerar cronograma de parcelas com base em datas
  generateParcelasSchedule(valorParcela, qtdeParcelas, primeiroVencimento) {
    const parcelas = [];
    if (!primeiroVencimento || qtdeParcelas <= 0 || valorParcela <= 0) return [];

    let [year, month, day] = primeiroVencimento.split("-").map(Number);

    for (let i = 1; i <= qtdeParcelas; i++) {
      let currentMonth = month + (i - 1);
      let currentYear = year;
      
      if (currentMonth > 12) {
        currentYear += Math.floor((currentMonth - 1) / 12);
        currentMonth = ((currentMonth - 1) % 12) + 1;
      }

      const strMonth = String(currentMonth).padStart(2, "0");
      const strDay = String(day).padStart(2, "0");
      const dataVencimento = `${currentYear}-${strMonth}-${strDay}`;

      parcelas.push({
        numero: i,
        vencimento: dataVencimento,
        valor: valorParcela,
        pago: false,
        dataPagamento: "",
        formaPagamento: "",
        status: "PENDENTE"
      });
    }

    return parcelas;
  }
};
