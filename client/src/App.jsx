import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import AlunosList from './components/AlunosList'
import AlunoForm from './components/AlunoForm'
import EmpresasList from './components/EmpresasList'
import EmpresaForm from './components/EmpresaForm'
import Cursos from './components/Cursos'
import CursoForm from './components/CursoForm'
import Planos from './components/Planos'
import Relatorios from './components/Relatorios'
import LoginVoolt from './components/LoginVoolt'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <LoginVoolt onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 relative z-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alunos" element={<AlunosList />} />
              <Route path="/alunos/novo" element={<AlunoForm />} />
              <Route path="/alunos/:id" element={<AlunoForm />} />
              <Route path="/empresas" element={<EmpresasList />} />
              <Route path="/empresas/novo" element={<EmpresaForm />} />
              <Route path="/empresas/:id" element={<EmpresaForm />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/cursos/novo" element={<CursoForm />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
  

