import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './LoginVoolt.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      return setError('As senhas não coincidem.')
    }
    if (newPassword.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres.')
    }

    setLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api"
      const response = await fetch(`${apiBase}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setMessage('Senha atualizada com sucesso! Redirecionando para o login...')
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        setError(data.error || 'Erro ao redefinir a senha.')
      }
    } catch {
      setError('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="voolt-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '16px', color: '#fff', textAlign: 'center' }}>
          <h2>Token inválido</h2>
          <p>O link de recuperação parece estar quebrado ou já expirou.</p>
          <button onClick={() => window.location.href='/'} style={{ marginTop: '1rem', padding: '10px 20px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Voltar ao Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="voolt-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section className="login-box" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
        <h2>Nova Senha</h2>
        <p>Crie uma nova senha de acesso.</p>

        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        {message && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>Nova Senha</label>
          <input 
            type="password" 
            placeholder="Mínimo 6 caracteres" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />

          <label>Confirmar Senha</label>
          <input 
            type="password" 
            placeholder="Repita a nova senha" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ marginBottom: '1.5rem' }}
          />

          <button type="submit" disabled={loading || !!message}>
            {loading ? "Salvando..." : "Redefinir Senha"}
          </button>
        </form>
      </section>
    </div>
  )
}
