// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-voolt-2026";

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;

// Criar pasta de uploads se não existir (usando DATA_DIR para persistência)
const uploadsDir = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de arquivo inválido. Apenas PDF, PNG, JPG e JPEG são permitidos."));
    }
  }
});

app.use(bodyParser.json());

// Middleware de CORS para desenvolvimento local e ambiente do Netlify
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Permite localhost e qualquer domínio contendo netlify.app
  if (origin && (origin.startsWith("http://localhost:") || origin.endsWith("netlify.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[BACKEND REQUEST] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", database: "connected", timestamp: new Date() });
});

// Servir arquivos estáticos do uploads
app.use("/uploads", express.static(uploadsDir));

// Servir frontend compilado (React/Vite) em produção
const clientBuildPath = path.join(__dirname, "client", "dist");
app.use(express.static(clientBuildPath));

// Conexão com o banco de dados SQLite local ou no Volume Persistente
const dbPath = path.join(DATA_DIR, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar no SQLite:", err.message);
  } else {
    console.log("Banco de dados SQLite conectado com sucesso!");
    initDatabaseSchema();
  }
});

// Inicialização das Tabelas do SQLite
function initDatabaseSchema() {
  db.serialize(() => {
    // 1. Tabela de Alunos
    db.run(`
      CREATE TABLE IF NOT EXISTS alunos (
        id TEXT PRIMARY KEY,
        nome TEXT,
        email TEXT,
        cpf TEXT,
        rg TEXT,
        whatsapp TEXT,
        telefone TEXT,
        dataNasc TEXT,
        sexo TEXT,
        estadoCivil TEXT,
        responsavel TEXT,
        parentesco TEXT,
        cep TEXT,
        endereco TEXT,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        estado TEXT,
        curso TEXT,
        turma TEXT,
        dataInicio TEXT,
        dataTermino TEXT,
        diasSemana TEXT,
        horarioInicio TEXT,
        horarioFim TEXT,
        professor TEXT,
        modalidade TEXT,
        cargaHoraria INTEGER,
        status TEXT,
        observacoes TEXT,
        valorTotal REAL,
        desconto REAL,
        valorDesconto REAL,
        entrada REAL,
        valorParcelar REAL,
        formaPagamento TEXT,
        qtdeParcelas INTEGER,
        valorParcela REAL,
        diaVencimento TEXT,
        primeiroVencimento TEXT,
        contratoAssinado INTEGER,
        documentoAnexado INTEGER,
        certificadoEmitido INTEGER,
        documentos TEXT
      )
    `);

    // 2. Tabela de Cursos
    db.run(`
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria TEXT,
        descricao TEXT,
        cargaHoraria INTEGER,
        duracao TEXT,
        modalidade TEXT,
        nivel TEXT,
        valor REAL,
        desconto REAL,
        ativo INTEGER DEFAULT 1,
        vagas INTEGER,
        professor TEXT,
        requisitos TEXT,
        objetivos TEXT,
        certificado INTEGER DEFAULT 1,
        createdAt TEXT
      )
    `);

    // 3. Tabela de Parcelas de Alunos
    db.run(`
      CREATE TABLE IF NOT EXISTS parcelas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alunoId TEXT,
        numero INTEGER,
        vencimento TEXT,
        valor REAL,
        pago INTEGER,
        dataPagamento TEXT,
        formaPagamento TEXT,
        status TEXT,
        FOREIGN KEY(alunoId) REFERENCES alunos(id) ON DELETE CASCADE
      )
    `);

    // 3. Tabela de Empresas (Tráfego Pago)
    db.run(`
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY,
        razaoSocial TEXT,
        nomeFantasia TEXT,
        cnpj TEXT,
        inscricaoEstadual TEXT,
        segmento TEXT,
        porte TEXT,
        telefone TEXT,
        whatsapp TEXT,
        email TEXT,
        site TEXT,
        cep TEXT,
        endereco TEXT,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        estado TEXT,
        plano TEXT,
        dataInicio TEXT,
        dataTermino TEXT,
        diaVencimento TEXT,
        statusPlano TEXT,
        usuariosContratados INTEGER,
        descricaoPlano TEXT,
        valorMensal REAL,
        desconto REAL,
        valorComDesconto REAL,
        taxas REAL,
        valorTotal REAL,
        formaPagamento TEXT,
        situacaoFinanceira TEXT,
        observacoesFinanceiras TEXT,
        duracaoMeses INTEGER,
        contratoAssinado INTEGER,
        documentoAnexado INTEGER,
        renovacaoAutomatica INTEGER,
        documentos TEXT
      )
    `);

    // 4. Tabela de Parcelas de Contrato de Empresas
    db.run(`
      CREATE TABLE IF NOT EXISTS parcelas_contrato (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresaId TEXT,
        parcela TEXT,
        competencia TEXT,
        vencimento TEXT,
        valor REAL,
        desconto REAL,
        acrescimos REAL,
        total REAL,
        status TEXT,
        dataPagamento TEXT,
        formaPagamento TEXT,
        FOREIGN KEY(empresaId) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // 5. Tabela de Campanhas Meta Ads
    db.run(`
      CREATE TABLE IF NOT EXISTS campanhas_meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresaId TEXT,
        nome TEXT,
        status TEXT,
        orcamentoDiario REAL,
        valorGasto REAL,
        impressoes INTEGER,
        cliques INTEGER,
        resultados INTEGER,
        cpa REAL,
        FOREIGN KEY(empresaId) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // 6. Tabela de Planos
    db.run(`
      CREATE TABLE IF NOT EXISTS planos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        valor REAL,
        descricao TEXT,
        beneficios TEXT,
        limiteUsuarios INTEGER,
        ativo INTEGER DEFAULT 1,
        createdAt TEXT
      )
    `);

    // 7. Tabela de Documentos de Alunos
    db.run(`
      CREATE TABLE IF NOT EXISTS aluno_documentos (
        id TEXT PRIMARY KEY,
        alunoId TEXT NOT NULL,
        nomeOriginal TEXT NOT NULL,
        nomeArquivoSalvo TEXT NOT NULL,
        tipoMime TEXT NOT NULL,
        tamanho INTEGER NOT NULL,
        caminhoUrl TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // 8. Tabela de Usuários
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        senha TEXT,
        resetToken TEXT,
        resetExpires INTEGER
      )
    `);

    // 9. Tabela de Serviços Extras de Empresas
    db.run(`
      CREATE TABLE IF NOT EXISTS servicos_extras (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        data TEXT,
        tipo TEXT,
        descricao TEXT,
        quantidade INTEGER DEFAULT 1,
        valorUnitario REAL DEFAULT 0,
        valorTotal REAL DEFAULT 0,
        status TEXT DEFAULT 'Pendente',
        aprovadoCliente INTEGER DEFAULT 0,
        formaAprovacao TEXT,
        mesCobranca TEXT,
        observacao TEXT,
        createdAt TEXT,
        FOREIGN KEY(empresaId) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // Alimentar dados iniciais padrão se estiver vazio
    // 10. Tabela de Contas a Pagar
    db.run(`
      CREATE TABLE IF NOT EXISTS contas_pagar (
        id TEXT PRIMARY KEY,
        descricao TEXT NOT NULL,
        categoria TEXT,
        valor REAL DEFAULT 0,
        data_vencimento TEXT,
        data_pagamento TEXT,
        forma_pagamento TEXT,
        recorrencia TEXT,
        prioridade TEXT,
        observacoes TEXT,
        status TEXT DEFAULT 'pendente',
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    seedInitialData();
  });
}

// Massa de dados inicial (Seeds)
function seedInitialData() {
  db.get("SELECT COUNT(*) as count FROM alunos", (err, row) => {
    if (err) return;
    if (row.count === 0) {
      console.log("Banco de dados vazio! Rodando as sementes (seeds)...");
      const { initialAlunos, initialEmpresas } = require("./js/mockDataSeed.js");

      // Inserir Alunos e Parcelas
      initialAlunos.forEach(aluno => {
        db.run(`
          INSERT INTO alunos (
            id, nome, email, cpf, rg, whatsapp, telefone, dataNasc, sexo, estadoCivil, responsavel, parentesco,
            cep, endereco, numero, complemento, bairro, cidade, estado,
            curso, turma, dataInicio, dataTermino, diasSemana, horarioInicio, horarioFim, professor, modalidade, cargaHoraria, status, observacoes,
            valorTotal, desconto, valorDesconto, entrada, valorParcelar, formaPagamento, qtdeParcelas, valorParcela, diaVencimento, primeiroVencimento,
            contratoAssinado, documentoAnexado, certificadoEmitido, documentos
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          aluno.id, aluno.nome, aluno.email, aluno.cpf, aluno.rg, aluno.whatsapp, aluno.telefone, aluno.dataNasc, aluno.sexo, aluno.estadoCivil, aluno.responsavel, aluno.parentesco,
          aluno.cep, aluno.endereco, aluno.numero, aluno.complemento, aluno.bairro, aluno.cidade, aluno.estado,
          aluno.curso, aluno.turma, aluno.dataInicio, aluno.dataTermino, aluno.diasSemana.join(","), aluno.horarioInicio, aluno.horarioFim, aluno.professor, aluno.modalidade, aluno.cargaHoraria, aluno.status, aluno.observacoes,
          aluno.valorTotal, aluno.desconto, aluno.valorDesconto, aluno.entrada, aluno.valorParcelar, aluno.formaPagamento, aluno.qtdeParcelas, aluno.valorParcela, aluno.diaVencimento, aluno.primeiroVencimento,
          aluno.contratoAssinado ? 1 : 0, aluno.documentoAnexado ? 1 : 0, aluno.certificadoEmitido ? 1 : 0, aluno.documentos.join(",")
        ], function(err) {
          if (err) return console.error(err);
          // Inserir parcelas dele
          aluno.parcelas.forEach(p => {
            db.run(`
              INSERT INTO parcelas (alunoId, numero, vencimento, valor, pago, dataPagamento, formaPagamento, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [aluno.id, p.numero, p.vencimento, p.valor, p.pago ? 1 : 0, p.dataPagamento, p.formaPagamento, p.status]);
          });
        });
      });

      // Inserir Empresas, Parcelas de Contrato e Campanhas Meta
      initialEmpresas.forEach(empresa => {
        db.run(`
          INSERT INTO empresas (
            id, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, segmento, porte, telefone, whatsapp, email, site,
            cep, endereco, numero, complemento, bairro, cidade, estado,
            plano, dataInicio, dataTermino, diaVencimento, statusPlano, usuariosContratados, descricaoPlano,
            valorMensal, desconto, valorComDesconto, taxas, valorTotal, formaPagamento, situacaoFinanceira, observacoesFinanceiras, duracaoMeses,
            contratoAssinado, documentoAnexado, renovacaoAutomatica, documentos
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          empresa.id, empresa.razaoSocial, empresa.nomeFantasia, empresa.cnpj, empresa.inscricaoEstadual, empresa.segmento, empresa.porte, empresa.telefone, empresa.whatsapp, empresa.email, empresa.site,
          empresa.cep, empresa.endereco, empresa.numero, empresa.complemento, empresa.bairro, empresa.cidade, empresa.estado,
          empresa.plano, empresa.dataInicio, empresa.dataTermino, empresa.diaVencimento, empresa.statusPlano, empresa.usuariosContratados, empresa.descricaoPlano,
          empresa.valorMensal, empresa.desconto, empresa.valorComDesconto, empresa.taxas, empresa.valorTotal, empresa.formaPagamento, empresa.situacaoFinanceira, empresa.observacoesFinanceiras, empresa.duracaoMeses,
          empresa.contratoAssinado ? 1 : 0, empresa.documentoAnexado ? 1 : 0, empresa.renovacaoAutomatica ? 1 : 0, empresa.documentos.join(",")
        ], function(err) {
          if (err) return console.error(err);

          // Inserir parcelas de contrato
          empresa.parcelasContrato.forEach(p => {
            db.run(`
              INSERT INTO parcelas_contrato (empresaId, parcela, competencia, vencimento, valor, desconto, acrescimos, total, status, dataPagamento, formaPagamento)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [empresa.id, p.parcela, p.competencia, p.vencimento, p.valor, p.desconto, p.acrescimos, p.total, p.status, p.dataPagamento, p.formaPagamento]);
          });

          // Inserir campanhas meta
          empresa.campanhasMeta.forEach(camp => {
            db.run(`
              INSERT INTO campanhas_meta (empresaId, nome, status, orcamentoDiario, valorGasto, impressoes, cliques, resultados, cpa)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [empresa.id, camp.nome, camp.status, camp.orcamentoDiario, camp.valorGasto, camp.impressoes, camp.cliques, camp.resultados, camp.cpa]);
          });
        });
      });
      console.log("Seeds do SQLite inseridas com total sucesso!");
    }
  });

  // Seeder de Planos
  db.get("SELECT COUNT(*) as count FROM planos", (err, row) => {
    if (err) return;
    if (row.count === 0) {
      console.log("Seeding inicial de planos...");
      const initialPlanos = [
        {
          id: 'plano-profissional',
          nome: 'PLANO PROFISSIONAL',
          valor: 3500,
          descricao: 'Gestão de tráfego profissional para empresas em crescimento.',
          beneficios: 'Gestão Meta Ads & Google Ads,Criação de Criativos de Vídeo,Limite: até 5 Usuários,Relatórios quinzenais no WhatsApp',
          limiteUsuarios: 5,
          ativo: 1
        },
        {
          id: 'plano-avancado',
          nome: 'PLANO AVANÇADO',
          valor: 4800,
          descricao: 'Estrutura multicanal e funis de remarketing avançados.',
          beneficios: 'Estrutura Multicanal Meta/Google/TikTok,Funis de Remarketing Avançados,Limite: até 8 Usuários,Dashboards integrados em tempo real',
          limiteUsuarios: 8,
          ativo: 1
        },
        {
          id: 'plano-premium',
          nome: 'EMPRESARIAL PREMIUM',
          valor: 499.9,
          descricao: 'Acesso completo ao ERP VOOLT com suporte prioritário.',
          beneficios: 'Acesso Completo ao ERP VOOLT,Integração com Meta Ads API,Limite: até 10 Usuários,Suporte prioritário 24/7',
          limiteUsuarios: 10,
          ativo: 1
        }
      ];

      initialPlanos.forEach(p => {
        db.run(`
          INSERT INTO planos (id, nome, valor, descricao, beneficios, limiteUsuarios, ativo, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [p.id, p.nome, p.valor, p.descricao, p.beneficios, p.limiteUsuarios, p.ativo, new Date().toISOString()]);
      });
    }
  });

    // Seeding inicial de Usuários com bcrypt
    db.get("SELECT COUNT(*) AS count FROM usuarios", async (err, row) => {
      if (err) return;
      if (row.count === 0) {
        const hash = await bcrypt.hash("123456", 10);
        db.run("INSERT INTO usuarios (email, senha) VALUES ('admin@voolt.com', ?)", [hash]);
        console.log("Seeding do usuario admin padrão concluído com senha hash!");
      }
    });
}

// ==========================================
// ============= API ENDPOINTS ==============
// ==========================================

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }
  db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, row) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados." });
    
    // Fallback pra login em plain text caso a senha ainda não tenha sido convertida (sistema antigo)
    if (row && (await bcrypt.compare(password, row.senha) || row.senha === password)) {
      if (row.senha === password) {
        // Migra automaticamente para bcrypt
        const hash = await bcrypt.hash(password, 10);
        db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [hash, row.id]);
      }
      const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ email: row.email, token, success: true });
    } else {
      res.status(401).json({ error: "E-mail ou senha inválidos." });
    }
  });
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, row) => {
    if (err || !row) {
      // Não revela se o usuário existe, mas diz que enviou
      return res.json({ success: true, message: "Se o e-mail existir, você receberá um link de recuperação." });
    }
    
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hora
    
    db.run("UPDATE usuarios SET resetToken = ?, resetExpires = ? WHERE id = ?", [resetToken, resetExpires, row.id], async (err) => {
      if (err) return res.status(500).json({ error: "Erro interno." });
      
      // Cria conta de teste no Ethereal
      let testAccount = await nodemailer.createTestAccount();
      let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user, 
          pass: testAccount.pass, 
        },
      });

      const resetLink = `http://localhost:5173/resetar-senha?token=${resetToken}`;
      const prodLink = `https://${req.headers.host}/resetar-senha?token=${resetToken}`;
      const linkToUse = req.headers.host.includes('localhost') ? resetLink : prodLink;

      let info = await transporter.sendMail({
        from: '"Suporte Voolt" <suporte@voolt.com>',
        to: email,
        subject: "Recuperação de Senha - Voolt",
        text: `Você solicitou a recuperação de senha. Clique no link para redefinir: ${linkToUse}`,
        html: `<p>Você solicitou a recuperação de senha.</p><p>Clique no link para redefinir:</p><a href="${linkToUse}">${linkToUse}</a>`
      });

      console.log("=========================================");
      console.log("URL DO E-MAIL DE RECUPERAÇÃO DE SENHA:");
      console.log(nodemailer.getTestMessageUrl(info));
      console.log("=========================================");

      res.json({ success: true, message: "Se o e-mail existir, você receberá um link de recuperação." });
    });
  });
});

app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  db.get("SELECT * FROM usuarios WHERE resetToken = ? AND resetExpires > ?", [token, Date.now()], async (err, row) => {
    if (err || !row) return res.status(400).json({ error: "Token inválido ou expirado." });
    
    const hash = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE usuarios SET senha = ?, resetToken = NULL, resetExpires = NULL WHERE id = ?", [hash, row.id], (err) => {
      if (err) return res.status(500).json({ error: "Erro ao atualizar senha." });
      res.json({ success: true, message: "Senha atualizada com sucesso!" });
    });
  });
});

// 1. ENDPOINTS: ALUNOS
app.get("/api/alunos", (req, res) => {
  const query = `
    SELECT alunos.*, cursos.nome AS cursoNome 
    FROM alunos 
    LEFT JOIN cursos ON alunos.curso = cursos.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Obter parcelas de cada aluno
    const count = rows.length;
    if (count === 0) return res.json([]);
    
    let processed = 0;
    const resultList = [];

    rows.forEach(aluno => {
      // Ajustar formatos dos dados serializados
      aluno.diasSemana = aluno.diasSemana ? aluno.diasSemana.split(",") : [];
      aluno.documentos = aluno.documentos ? aluno.documentos.split(",") : [];
      aluno.contratoAssinado = aluno.contratoAssinado === 1;
      aluno.documentoAnexado = aluno.documentoAnexado === 1;
      aluno.certificadoEmitido = aluno.certificadoEmitido === 1;

      db.all("SELECT * FROM parcelas WHERE alunoId = ?", [aluno.id], (err, parcelas) => {
        if (err) return res.status(500).json({ error: err.message });
        
        parcelas.forEach(p => { p.pago = p.pago === 1; });
        aluno.parcelas = parcelas;
        resultList.push(aluno);
        processed++;

        if (processed === count) {
          res.json(resultList);
        }
      });
    });
  });
});

app.post("/api/alunos", (req, res) => {
  const aluno = req.body;
  if (!aluno.id) aluno.id = "aluno-" + Date.now();

  db.run(`
    INSERT OR REPLACE INTO alunos (
      id, nome, email, cpf, rg, whatsapp, telefone, dataNasc, sexo, estadoCivil, responsavel, parentesco,
      cep, endereco, numero, complemento, bairro, cidade, estado,
      curso, turma, dataInicio, dataTermino, diasSemana, horarioInicio, horarioFim, professor, modalidade, cargaHoraria, status, observacoes,
      valorTotal, desconto, valorDesconto, entrada, valorParcelar, formaPagamento, qtdeParcelas, valorParcela, diaVencimento, primeiroVencimento,
      contratoAssinado, documentoAnexado, certificadoEmitido, documentos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    aluno.id, aluno.nome, aluno.email, aluno.cpf, aluno.rg, aluno.whatsapp, aluno.telefone, aluno.dataNasc, aluno.sexo, aluno.estadoCivil, aluno.responsavel, aluno.parentesco,
    aluno.cep, aluno.endereco, aluno.numero, aluno.complemento, aluno.bairro, aluno.cidade, aluno.estado,
    aluno.curso, aluno.turma, aluno.dataInicio, aluno.dataTermino, aluno.diasSemana.join(","), aluno.horarioInicio, aluno.horarioFim, aluno.professor, aluno.modalidade, aluno.cargaHoraria, aluno.status, aluno.observacoes,
    aluno.valorTotal, aluno.desconto, aluno.valorDesconto, aluno.entrada, aluno.valorParcelar, aluno.formaPagamento, aluno.qtdeParcelas, aluno.valorParcela, aluno.diaVencimento, aluno.primeiroVencimento,
    aluno.contratoAssinado ? 1 : 0, aluno.documentoAnexado ? 1 : 0, aluno.certificadoEmitido ? 1 : 0, aluno.documentos.join(",")
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Deletar antigas parcelas se houver
    db.run("DELETE FROM parcelas WHERE alunoId = ?", [aluno.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Inserir novas parcelas
      let insCount = 0;
      if (aluno.parcelas.length === 0) return res.json(aluno);

      aluno.parcelas.forEach(p => {
        db.run(`
          INSERT INTO parcelas (alunoId, numero, vencimento, valor, pago, dataPagamento, formaPagamento, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [aluno.id, p.numero, p.vencimento, p.valor, p.pago ? 1 : 0, p.dataPagamento, p.formaPagamento, p.status], (err) => {
          insCount++;
          if (insCount === aluno.parcelas.length) {
            res.json(aluno);
          }
        });
      });
    });
  });
});

app.delete("/api/alunos/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM alunos WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run("DELETE FROM parcelas WHERE alunoId = ?", [id], (err) => {
      res.json({ success: true, changes: this.changes });
    });
  });
});

// 2. ENDPOINTS: EMPRESAS
app.get("/api/empresas", (req, res) => {
  const query = `
    SELECT empresas.*, planos.nome AS planoNome 
    FROM empresas 
    LEFT JOIN planos ON empresas.plano = planos.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const count = rows.length;
    if (count === 0) return res.json([]);
    
    let processed = 0;
    const resultList = [];

    rows.forEach(empresa => {
      empresa.documentos = empresa.documentos ? empresa.documentos.split(",") : [];
      empresa.contratoAssinado = empresa.contratoAssinado === 1;
      empresa.documentoAnexado = empresa.documentoAnexado === 1;
      empresa.renovacaoAutomatica = empresa.renovacaoAutomatica === 1;

      // Pegar parcelas
      db.all("SELECT * FROM parcelas_contrato WHERE empresaId = ?", [empresa.id], (err, parcelas) => {
        if (err) return res.status(500).json({ error: err.message });
        
        empresa.parcelasContrato = parcelas;

        // Pegar campanhas do Meta Ads
        db.all("SELECT * FROM campanhas_meta WHERE empresaId = ?", [empresa.id], (err, campanhas) => {
          if (err) return res.status(500).json({ error: err.message });
          
          empresa.campanhasMeta = campanhas;
          resultList.push(empresa);
          processed++;

          if (processed === count) {
            res.json(resultList);
          }
        });
      });
    });
  });
});

app.post("/api/empresas", (req, res) => {
  const empresa = req.body;
  if (!empresa.id) empresa.id = "empresa-" + Date.now();

  db.run(`
    INSERT OR REPLACE INTO empresas (
      id, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, segmento, porte, telefone, whatsapp, email, site,
      cep, endereco, numero, complemento, bairro, cidade, estado,
      plano, dataInicio, dataTermino, diaVencimento, statusPlano, usuariosContratados, descricaoPlano,
      valorMensal, desconto, valorComDesconto, taxas, valorTotal, formaPagamento, situacaoFinanceira, observacoesFinanceiras, duracaoMeses,
      contratoAssinado, documentoAnexado, renovacaoAutomatica, documentos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    empresa.id, empresa.razaoSocial, empresa.nomeFantasia, empresa.cnpj, empresa.inscricaoEstadual, empresa.segmento, empresa.porte, empresa.telefone, empresa.whatsapp, empresa.email, empresa.site,
    empresa.cep, empresa.endereco, empresa.numero, empresa.complemento, empresa.bairro, empresa.cidade, empresa.estado,
    empresa.plano, empresa.dataInicio, empresa.dataTermino, empresa.diaVencimento, empresa.statusPlano, empresa.usuariosContratados, empresa.descricaoPlano,
    empresa.valorMensal, empresa.desconto, empresa.valorComDesconto, empresa.taxas, empresa.valorTotal, empresa.formaPagamento, empresa.situacaoFinanceira, empresa.observacoesFinanceiras, empresa.duracaoMeses,
    empresa.contratoAssinado ? 1 : 0, empresa.documentoAnexado ? 1 : 0, empresa.renovacaoAutomatica ? 1 : 0, empresa.documentos.join(",")
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Salvar parcelas de contrato
    db.run("DELETE FROM parcelas_contrato WHERE empresaId = ?", [empresa.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      let insCount = 0;
      if (empresa.parcelasContrato.length === 0) {
        return saveMetaCampaigns(empresa, res);
      }

      empresa.parcelasContrato.forEach(p => {
        db.run(`
          INSERT INTO parcelas_contrato (empresaId, parcela, competencia, vencimento, valor, desconto, acrescimos, total, status, dataPagamento, formaPagamento)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [empresa.id, p.parcela, p.competencia, p.vencimento, p.valor, p.desconto, p.acrescimos, p.total, p.status, p.dataPagamento, p.formaPagamento], (err) => {
          insCount++;
          if (insCount === empresa.parcelasContrato.length) {
            saveMetaCampaigns(empresa, res);
          }
        });
      });
    });
  });
});

function saveMetaCampaigns(empresa, res) {
  db.run("DELETE FROM campanhas_meta WHERE empresaId = ?", [empresa.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!empresa.campanhasMeta || empresa.campanhasMeta.length === 0) {
      return res.json(empresa);
    }

    let insCount = 0;
    empresa.campanhasMeta.forEach(camp => {
      db.run(`
        INSERT INTO campanhas_meta (empresaId, nome, status, orcamentoDiario, valorGasto, impressoes, cliques, resultados, cpa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [empresa.id, camp.nome, camp.status, camp.orcamentoDiario, camp.valorGasto, camp.impressoes, camp.cliques, camp.resultados, camp.cpa], (err) => {
        insCount++;
        if (insCount === empresa.campanhasMeta.length) {
          res.json(empresa);
        }
      });
    });
  });
}

app.delete("/api/empresas/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM empresas WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run("DELETE FROM parcelas_contrato WHERE empresaId = ?", [id], () => {
      db.run("DELETE FROM campanhas_meta WHERE empresaId = ?", [id], () => {
        res.json({ success: true });
      });
    });
  });
});

// 3. ADICIONAR CAMPANHA META DIRETAMENTE PELO CLIENT
app.post("/api/empresas/:id/campanhas", (req, res) => {
  const empId = req.params.id;
  const camp = req.body;
  
  db.run(`
    INSERT INTO campanhas_meta (empresaId, nome, status, orcamentoDiario, valorGasto, impressoes, cliques, resultados, cpa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [empId, camp.nome, camp.status, camp.orcamentoDiario, camp.valorGasto, camp.impressoes, camp.cliques, camp.resultados, camp.cpa], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, campaignId: this.lastID });
  });
});

app.delete("/api/empresas/:id/campanhas/:campId", (req, res) => {
  const campId = req.params.campId;
  db.run("DELETE FROM campanhas_meta WHERE id = ?", [campId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 4. ATUALIZAR STATUS DE CAMPANHA META (ATIVAR/PAUSAR)
app.put("/api/empresas/:id/campanhas/:campId", (req, res) => {
  const campId = req.params.campId;
  const { status } = req.body;
  
  db.run("UPDATE campanhas_meta SET status = ? WHERE id = ?", [status, campId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 5. ENDPOINTS: CURSOS
app.get("/api/cursos", (req, res) => {
  db.all("SELECT * FROM cursos ORDER BY nome ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(c => {
      c.ativo = c.ativo === 1;
      c.certificado = c.certificado === 1;
    });
    res.json(rows);
  });
});

app.post("/api/cursos", (req, res) => {
  const c = req.body;
  if (!c.id) c.id = "curso-" + Date.now();
  if (!c.createdAt) c.createdAt = new Date().toISOString();
  db.run(`
    INSERT OR REPLACE INTO cursos
      (id, nome, categoria, descricao, cargaHoraria, duracao, modalidade, nivel,
       valor, desconto, ativo, vagas, professor, requisitos, objetivos, certificado, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    c.id, c.nome, c.categoria, c.descricao, c.cargaHoraria, c.duracao, c.modalidade, c.nivel,
    c.valor, c.desconto, c.ativo ? 1 : 0, c.vagas, c.professor, c.requisitos, c.objetivos,
    c.certificado ? 1 : 0, c.createdAt
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ...c, id: c.id });
  });
});

app.delete("/api/cursos/:id", (req, res) => {
  db.run("DELETE FROM cursos WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 6. ENDPOINTS: PLANOS
app.get("/api/planos", (req, res) => {
  console.log("[BACKEND] Rota GET /api/planos chamada!");
  db.all("SELECT * FROM planos ORDER BY nome ASC", [], (err, rows) => {
    if (err) {
      console.error("[BACKEND ERROR] Erro na query SELECT * FROM planos:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[BACKEND] Sucesso ao buscar planos. Total retornado: ${rows.length}`);
    rows.forEach(p => {
      p.ativo = p.ativo === 1;
    });
    res.json(rows);
  });
});

app.post("/api/planos", (req, res) => {
  const p = req.body;
  console.log("[BACKEND] Rota POST /api/planos chamada com corpo:", p);
  if (!p.id) p.id = "plano-" + Date.now();
  if (!p.createdAt) p.createdAt = new Date().toISOString();
  db.run(`
    INSERT OR REPLACE INTO planos
      (id, nome, valor, descricao, beneficios, limiteUsuarios, ativo, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    p.id, p.nome, p.valor, p.descricao, p.beneficios, p.limiteUsuarios, p.ativo ? 1 : 0, p.createdAt
  ], function(err) {
    if (err) {
      console.error("[BACKEND ERROR] Erro ao salvar/inserir plano:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log("[BACKEND] Plano salvo com sucesso no SQLite! ID:", p.id);
    res.json({ ...p, id: p.id });
  });
});

app.delete("/api/planos/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[BACKEND] Rota DELETE /api/planos/${id} chamada!`);
  db.run("DELETE FROM planos WHERE id = ?", [id], function(err) {
    if (err) {
      console.error(`[BACKEND ERROR] Erro ao deletar plano ${id}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[BACKEND] Plano ${id} deletado com sucesso do SQLite.`);
    res.json({ success: true });
  });
});

// 7. ENDPOINTS: DOCUMENTOS DE ALUNOS
app.get("/api/alunos/:alunoId/documentos", (req, res) => {
  const { alunoId } = req.params;
  console.log(`[BACKEND] GET /api/alunos/${alunoId}/documentos chamada!`);
  db.all("SELECT * FROM aluno_documentos WHERE alunoId = ? ORDER BY createdAt DESC", [alunoId], (err, rows) => {
    if (err) {
      console.error(`[BACKEND ERROR] Erro ao buscar documentos do aluno ${alunoId}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post("/api/alunos/:alunoId/documentos", (req, res) => {
  const { alunoId } = req.params;
  console.log(`[BACKEND] POST /api/alunos/${alunoId}/documentos chamada!`);
  
  upload.single("documento")(req, res, (err) => {
    if (err) {
      console.error("[BACKEND ERROR] Erro no upload de arquivo pelo Multer:", err.message);
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      console.error("[BACKEND ERROR] Nenhum arquivo enviado.");
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }
    
    const docId = "doc-" + Date.now();
    const nomeOriginal = req.file.originalname;
    const nomeArquivoSalvo = req.file.filename;
    const tipoMime = req.file.mimetype;
    const tamanho = req.file.size;
    const caminhoUrl = `/api/alunos/${alunoId}/documentos/${docId}/arquivo`;
    const createdAt = new Date().toISOString();
    
    console.log(`[BACKEND] Multer salvou o arquivo fisicamente em: ${req.file.path}`);
    console.log(`[BACKEND] Detalhes do arquivo enviado:`, { nomeOriginal, nomeArquivoSalvo, tipoMime, tamanho });
    
    db.run(`
      INSERT INTO aluno_documentos (id, alunoId, nomeOriginal, nomeArquivoSalvo, tipoMime, tamanho, caminhoUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [docId, alunoId, nomeOriginal, nomeArquivoSalvo, tipoMime, tamanho, caminhoUrl, createdAt], function(err) {
      if (err) {
        console.error("[BACKEND ERROR] Erro ao registrar documento no SQLite:", err.message);
        try {
          fs.unlinkSync(req.file.path);
          console.log(`[BACKEND] Rolled back: Arquivo físico ${req.file.path} removido devido a erro no banco.`);
        } catch(e) {
          console.error("[BACKEND WARNING] Falha no rollback do arquivo físico:", e.message);
        }
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`[BACKEND] Registro de documento criado com sucesso! ID: ${docId}, Aluno: ${alunoId}, URL gerada: ${caminhoUrl}`);
      res.json({
        id: docId,
        alunoId,
        nomeOriginal,
        nomeArquivoSalvo,
        tipoMime,
        tamanho,
        caminhoUrl,
        createdAt
      });
    });
  });
});

app.get("/api/alunos/:alunoId/documentos/:documentoId/arquivo", (req, res) => {
  const { alunoId, documentoId } = req.params;
  console.log(`[BACKEND] GET /api/alunos/${alunoId}/documentos/${documentoId}/arquivo chamada!`);
  
  db.get("SELECT * FROM aluno_documentos WHERE id = ? AND alunoId = ?", [documentoId, alunoId], (err, doc) => {
    if (err) {
      console.error(`[BACKEND ERROR] Erro ao buscar documento ${documentoId} no SQLite:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    
    if (!doc) {
      console.error(`[BACKEND ERROR] Documento com ID ${documentoId} para o aluno ${alunoId} não existe no banco.`);
      return res.status(404).json({ error: "Documento não encontrado." });
    }
    
    const filePath = path.join(uploadsDir, doc.nomeArquivoSalvo);
    console.log(`[BACKEND] Rota download. Caminho físico do arquivo: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`[BACKEND ERROR] Arquivo físico não encontrado em disco: ${filePath}`);
      return res.status(404).json({ error: "Arquivo físico não encontrado no servidor." });
    }
    
    res.setHeader("Content-Type", doc.tipoMime);
    
    const allowedInline = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    const disposition = allowedInline.includes(doc.tipoMime) ? "inline" : "attachment";
    
    res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(doc.nomeOriginal)}"`);
    res.sendFile(filePath);
  });
});

app.delete("/api/alunos/:alunoId/documentos/:documentoId", (req, res) => {
  const { alunoId, documentoId } = req.params;
  console.log(`[BACKEND] DELETE /api/alunos/${alunoId}/documentos/${documentoId} chamada!`);
  
  db.get("SELECT * FROM aluno_documentos WHERE id = ? AND alunoId = ?", [documentoId, alunoId], (err, doc) => {
    if (err) {
      console.error(`[BACKEND ERROR] Erro ao buscar documento ${documentoId} para deleção:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    
    if (!doc) {
      console.error(`[BACKEND ERROR] Documento com ID ${documentoId} para deleção não encontrado.`);
      return res.status(404).json({ error: "Documento não encontrado." });
    }
    
    db.run("DELETE FROM aluno_documentos WHERE id = ?", [documentoId], function(err) {
      if (err) {
        console.error(`[BACKEND ERROR] Erro ao deletar documento ${documentoId} do SQLite:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      
      const filePath = path.join(uploadsDir, doc.nomeArquivoSalvo);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`[BACKEND WARNING] Falha ao excluir arquivo físico ${filePath} do disco:`, err.message);
        } else {
          console.log(`[BACKEND] Arquivo físico ${doc.nomeArquivoSalvo} deletado com sucesso do disco.`);
        }
      });
      
      console.log(`[BACKEND] Registro de documento ${documentoId} removido com sucesso do SQLite.`);
      res.json({ success: true });
    });
  });
});

// 8. ENDPOINTS: SERVIÇOS EXTRAS DE EMPRESAS
app.get("/api/empresas/:empresaId/servicos-extras", (req, res) => {
  const { empresaId } = req.params;
  db.all("SELECT * FROM servicos_extras WHERE empresaId = ? ORDER BY data DESC", [empresaId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(r => { r.aprovadoCliente = r.aprovadoCliente === 1; });
    res.json(rows);
  });
});

app.post("/api/empresas/:empresaId/servicos-extras", (req, res) => {
  const { empresaId } = req.params;
  const s = req.body;
  const id = s.id || ("extra-" + Date.now());
  const createdAt = s.createdAt || new Date().toISOString();
  db.run(`
    INSERT OR REPLACE INTO servicos_extras
      (id, empresaId, data, tipo, descricao, quantidade, valorUnitario, valorTotal,
       status, aprovadoCliente, formaAprovacao, mesCobranca, observacao, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    id, empresaId, s.data, s.tipo, s.descricao,
    s.quantidade, s.valorUnitario, s.valorTotal,
    s.status, s.aprovadoCliente ? 1 : 0,
    s.formaAprovacao, s.mesCobranca, s.observacao, createdAt
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ...s, id, empresaId, createdAt });
  });
});

app.put("/api/empresas/:empresaId/servicos-extras/:extraId", (req, res) => {
  const { extraId } = req.params;
  const s = req.body;
  db.run(`
    UPDATE servicos_extras SET
      data=?, tipo=?, descricao=?, quantidade=?, valorUnitario=?, valorTotal=?,
      status=?, aprovadoCliente=?, formaAprovacao=?, mesCobranca=?, observacao=?
    WHERE id=?
  `, [
    s.data, s.tipo, s.descricao, s.quantidade, s.valorUnitario, s.valorTotal,
    s.status, s.aprovadoCliente ? 1 : 0, s.formaAprovacao, s.mesCobranca, s.observacao,
    extraId
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, ...s, id: extraId });
  });
});

app.delete("/api/empresas/:empresaId/servicos-extras/:extraId", (req, res) => {
  const { extraId } = req.params;
  db.run("DELETE FROM servicos_extras WHERE id = ?", [extraId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Fallback: Redirecionar todas as outras requisições para o Frontend
function normalizeContaStatus(conta) {
  if (conta.status === "pago" || conta.status === "cancelado") return conta.status;
  const hoje = new Date().toISOString().slice(0, 10);
  if (conta.data_vencimento && conta.data_vencimento < hoje) return "vencido";
  return conta.status || "pendente";
}

function mapConta(row) {
  return {
    ...row,
    valor: Number(row.valor || 0),
    status: normalizeContaStatus(row)
  };
}

// 9. ENDPOINTS: CONTAS A PAGAR
app.get("/api/contas-pagar", (req, res) => {
  db.all("SELECT * FROM contas_pagar ORDER BY data_vencimento ASC, createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(mapConta));
  });
});

app.get("/api/contas-pagar/resumo", (req, res) => {
  db.all("SELECT * FROM contas_pagar", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const resumo = rows.map(mapConta).reduce((acc, conta) => {
      if (conta.status !== "cancelado") acc.totalGeral += conta.valor;
      if (conta.status === "pago") acc.totalPago += conta.valor;
      if (conta.status === "vencido") acc.totalVencido += conta.valor;
      if (conta.status === "pendente" || conta.status === "vencido") acc.totalAPagar += conta.valor;
      return acc;
    }, { totalAPagar: 0, totalPago: 0, totalVencido: 0, totalGeral: 0 });
    resumo.saldo = resumo.totalPago - resumo.totalAPagar;
    res.json(resumo);
  });
});

app.post("/api/contas-pagar", (req, res) => {
  const conta = req.body;
  const id = conta.id || ("conta-" + Date.now());
  const createdAt = conta.createdAt || new Date().toISOString();
  const updatedAt = new Date().toISOString();
  db.run(`
    INSERT OR REPLACE INTO contas_pagar
      (id, descricao, categoria, valor, data_vencimento, data_pagamento,
       forma_pagamento, recorrencia, prioridade, observacoes, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, conta.descricao, conta.categoria, conta.valor || 0, conta.data_vencimento,
    conta.data_pagamento || "", conta.forma_pagamento, conta.recorrencia, conta.prioridade,
    conta.observacoes, conta.status || "pendente", createdAt, updatedAt
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json(mapConta({ ...conta, id, createdAt, updatedAt }));
  });
});

app.put("/api/contas-pagar/:id", (req, res) => {
  const { id } = req.params;
  const conta = req.body;
  const updatedAt = new Date().toISOString();
  db.run(`
    UPDATE contas_pagar SET
      descricao=?, categoria=?, valor=?, data_vencimento=?, data_pagamento=?,
      forma_pagamento=?, recorrencia=?, prioridade=?, observacoes=?, status=?, updatedAt=?
    WHERE id=?
  `, [
    conta.descricao, conta.categoria, conta.valor || 0, conta.data_vencimento,
    conta.data_pagamento || "", conta.forma_pagamento, conta.recorrencia,
    conta.prioridade, conta.observacoes, conta.status || "pendente", updatedAt, id
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Conta nao encontrada." });
    res.json(mapConta({ ...conta, id, updatedAt }));
  });
});

app.delete("/api/contas-pagar/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM contas_pagar WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Conta nao encontrada." });
    res.json({ success: true });
  });
});

app.patch("/api/contas-pagar/:id/pagar", (req, res) => {
  const { id } = req.params;
  const dataPagamento = req.body.data_pagamento || new Date().toISOString().slice(0, 10);
  const formaPagamento = req.body.forma_pagamento || "";
  const updatedAt = new Date().toISOString();
  db.run(`
    UPDATE contas_pagar
    SET status='pago', data_pagamento=?, forma_pagamento=?, updatedAt=?
    WHERE id=?
  `, [dataPagamento, formaPagamento, updatedAt, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Conta nao encontrada." });
    res.json({ success: true, id, status: "pago", data_pagamento: dataPagamento, forma_pagamento: formaPagamento });
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Inicialização e Inicialização do Host do Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando no endereço: http://localhost:${PORT}`);
  console.log(`Banco e Arquivos salvos em: ${DATA_DIR}`);
});
