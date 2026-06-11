import { useLocation } from 'react-router-dom'

const titles = {
  '/': ['Dashboard', 'Visão geral do sistema'],
  '/alunos': ['Alunos', 'Cadastro e controle acadêmico'],
  '/alunos/novo': ['Novo Aluno', 'Cadastro e matrícula'],
  '/empresas': ['Empresas', 'Tráfego pago e contratos'],
  '/empresas/novo': ['Nova Empresa', 'Cadastro e gestão de contrato'],
  '/cursos': ['Cursos', 'Grade de ensino e corpo docente'],
  '/cursos/novo': ['Novo Curso', 'Cadastro de curso'],
  '/planos': ['Planos', 'Planos de tráfego disponíveis'],
  '/relatorios': ['Relatórios', 'Análise e fluxo de caixa'],
}

export default function Header() {
  const { pathname } = useLocation()
  const base = pathname.split('/').slice(0, 2).join('/') || '/'
  const [title, subtitle] = titles[pathname] || titles[base] || ['VOOLT', '']

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Bell */}
        <button className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            AD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">Administrador</p>
            <p className="text-xs text-slate-400">admin@voolt.com.br</p>
          </div>
        </div>
      </div>
    </header>
  )
}
