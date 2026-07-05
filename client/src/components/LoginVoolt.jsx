import { useEffect, useMemo, useState } from "react";
import "./LoginVoolt.css";

const palavras = [
  "META ADS",
  "GOOGLE ADS",
  "TIKTOK ADS",
  "CONVERSÕES",
  "ROAS",
  "LEADS",
  "FUNIL DE VENDAS",
  "AUTOMAÇÃO",
  "CAMPANHAS",
  "CRIATIVOS",
  "PERFORMANCE",
  "ESCALA",
  "LANDING PAGES",
  "TRÁFEGO PAGO",
  "GESTÃO",
];

const frases = [
  "Transformando cliques em resultados.",
  "Performance. Escala. Conversão.",
  "Gestão inteligente para empresas.",
  "Dados que viram crescimento.",
  "Controle, automação e resultado em um só lugar.",
];

const metricasBase = {
  investimento: 45231,
  conversoes: 1256,
  leads: 38752,
  roas: 8.61,
  ctr: 2.85,
};

export default function LoginVoolt({ onLoginSuccess }) {
  const [modoDescanso, setModoDescanso] = useState(false);
  const [hora, setHora] = useState(new Date());
  const [fraseIndex, setFraseIndex] = useState(0);
  const [contador, setContador] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para Esqueci a Senha
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify({ email: data.email, token: data.token }));
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError(data.error || "Erro de login desconhecido.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    setForgotLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiBase}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (data.success) {
        setForgotMsg("Se o e-mail existir, você receberá um link de recuperação.");
      } else {
        setForgotMsg("Ocorreu um erro, tente novamente.");
      }
    } catch {
      setForgotMsg("Erro ao conectar com o servidor.");
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const relogio = setInterval(() => setHora(new Date()), 1000);

    const frasesTimer = setInterval(() => {
      setFraseIndex((prev) => (prev + 1) % frases.length);
    }, 4200);

    const metricasTimer = setInterval(() => {
      setContador((prev) => prev + 1);
    }, 1800);

    return () => {
      clearInterval(relogio);
      clearInterval(frasesTimer);
      clearInterval(metricasTimer);
    };
  }, []);

  useEffect(() => {
    let timer;

    const resetarTimer = () => {
      setModoDescanso(false);
      clearTimeout(timer);

      timer = setTimeout(() => {
        setModoDescanso(true);
      }, 20000);
    };

    ["mousemove", "keydown", "click", "touchstart"].forEach((evento) => {
      window.addEventListener(evento, resetarTimer);
    });

    resetarTimer();

    return () => {
      clearTimeout(timer);

      ["mousemove", "keydown", "click", "touchstart"].forEach((evento) => {
        window.removeEventListener(evento, resetarTimer);
      });
    };
  }, []);

  const metricas = useMemo(() => {
    return {
      investimento: metricasBase.investimento + contador * 37,
      conversoes: metricasBase.conversoes + contador,
      leads: metricasBase.leads + contador * 4,
      roas: metricasBase.roas + (contador % 6) * 0.01,
      ctr: metricasBase.ctr + (contador % 5) * 0.01,
    };
  }, [contador]);

  const horaFormatada = hora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dataFormatada = hora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="voolt-login">
      <div className="energy-line line-1" />
      <div className="energy-line line-2" />
      <div className="energy-line line-3" />

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="particles">
        {Array.from({ length: 46 }).map((_, i) => (
          <span
            key={i}
            style={{
              "--x": `${(i * 37) % 100}%`,
              "--y": `${(i * 61) % 100}%`,
              "--delay": `${i * 0.22}s`,
            }}
          />
        ))}
      </div>

      <div className="floating-words">
        {palavras.map((palavra, index) => (
          <span
            key={palavra}
            className="floating-word"
            style={{
              "--delay": `${index * 0.8}s`,
              "--top": `${9 + ((index * 17) % 76)}%`,
              "--left": `${4 + ((index * 29) % 88)}%`,
            }}
          >
            {palavra}
          </span>
        ))}
      </div>

      <div className="chart-panel">
        <div className="panel-header">
          <div>
            <span>RESULTADOS</span>
            <strong>Desempenho geral</strong>
          </div>
          <small>ao vivo</small>
        </div>

        <div className="chart-line">
          <i style={{ height: "20%" }} />
          <i style={{ height: "36%" }} />
          <i style={{ height: "28%" }} />
          <i style={{ height: "55%" }} />
          <i style={{ height: "42%" }} />
          <i style={{ height: "64%" }} />
          <i style={{ height: "58%" }} />
          <i style={{ height: "78%" }} />
          <i style={{ height: "88%" }} />
        </div>
      </div>

      <div className="metric-card metric-1">
        <span>INVESTIMENTO</span>
        <strong>
          {metricas.investimento.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })}
        </strong>
        <small>▲ 127,6%</small>
      </div>

      <div className="metric-card metric-2">
        <span>CONVERSÕES</span>
        <strong>{metricas.conversoes.toLocaleString("pt-BR")}</strong>
        <small>▲ 158,3%</small>
      </div>

      <div className="metric-card metric-3">
        <span>ROAS</span>
        <strong>{metricas.roas.toFixed(2).replace(".", ",")}</strong>
        <small>▲ 93,8%</small>
      </div>

      <div className="metric-card metric-4">
        <span>LEADS</span>
        <strong>{metricas.leads.toLocaleString("pt-BR")}</strong>
        <small>▲ 112,4%</small>
      </div>

      <main className={`login-stage ${modoDescanso ? "descanso" : ""}`}>
        <section className="brand">
          <div className="logo-frame">
            <img src="/voolt-logo.jpeg" alt="VOOLT" className="voolt-logo" />
          </div>

          <div className="platform-tags">
            <span>Meta Ads</span>
            <span>Google Ads</span>
            <span>TikTok Ads</span>
          </div>

          <p>FOCO NO TRÁFEGO PAGO</p>

          <h3>{frases[fraseIndex]}</h3>

          {modoDescanso && (
            <div className="clock-box">
              <strong>{horaFormatada}</strong>
              <span>{dataFormatada}</span>
              <small>Mova o mouse ou pressione uma tecla para acessar</small>
            </div>
          )}
        </section>

        <section className="login-box">
          <div className="login-box-top">
            <span>Área restrita</span>
            <small>VOOLT</small>
          </div>

          <h2>Acessar sistema</h2>
          <p>Gestão, empresas, contratos e performance em um só lugar.</p>

          {error && <div className="error-message" style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: "600" }}>{error}</div>}
          <form onSubmit={handleFormSubmit}>
            <label>E-mail</label>
            <input 
              type="email" 
              placeholder="admin@voolt.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input 
              type="password" 
              placeholder="Digite sua senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button 
              type="button" 
              onClick={() => { setShowForgot(true); setForgotMsg(""); }}
              style={{ background: "transparent", color: "#3b82f6", marginTop: "1rem", fontSize: "0.875rem", boxShadow: "none", width: "auto", margin: "1rem auto 0" }}
            >
              Esqueci minha senha
            </button>
          </form>

          {showForgot && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.9)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem", borderRadius: "24px" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Recuperar Senha</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Digite seu e-mail para receber o link de recuperação.</p>
              
              {forgotMsg && <div style={{ color: "#10b981", fontSize: "0.875rem", marginBottom: "1rem" }}>{forgotMsg}</div>}
              
              <form onSubmit={handleForgotSubmit}>
                <input 
                  type="email" 
                  placeholder="Seu e-mail cadastrado" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  style={{ marginBottom: "1rem" }}
                />
                <button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? "Enviando..." : "Enviar link"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForgot(false)}
                  style={{ background: "transparent", border: "1px solid #334155", marginTop: "0.5rem" }}
                >
                  Voltar
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
