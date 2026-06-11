// src/api/index.js — Todas as chamadas REST para o backend Express

const BASE = import.meta.env.VITE_API_URL || '/api'

// ─── ALUNOS ──────────────────────────────────────────────────────────────────
export async function getAlunos() {
  const r = await fetch(`${BASE}/alunos`)
  if (!r.ok) throw new Error('Erro ao buscar alunos')
  return r.json()
}

export async function saveAluno(data) {
  const r = await fetch(`${BASE}/alunos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Erro ao salvar aluno')
  return r.json()
}

export async function deleteAluno(id) {
  const r = await fetch(`${BASE}/alunos/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Erro ao deletar aluno')
  return r.json()
}

// ─── EMPRESAS ─────────────────────────────────────────────────────────────────
export async function getEmpresas() {
  const r = await fetch(`${BASE}/empresas`)
  if (!r.ok) throw new Error('Erro ao buscar empresas')
  return r.json()
}

export async function saveEmpresa(data) {
  const r = await fetch(`${BASE}/empresas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Erro ao salvar empresa')
  return r.json()
}

export async function deleteEmpresa(id) {
  const r = await fetch(`${BASE}/empresas/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Erro ao deletar empresa')
  return r.json()
}

export async function saveCampanha(empresaId, data) {
  const r = await fetch(`${BASE}/empresas/${empresaId}/campanhas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Erro ao salvar campanha')
  return r.json()
}

export async function deleteCampanha(empresaId, campId) {
  const r = await fetch(`${BASE}/empresas/${empresaId}/campanhas/${campId}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Erro ao deletar campanha')
  return r.json()
}

// ─── CURSOS ──────────────────────────────────────────────────────────────────
export async function getCursos() {
  const r = await fetch(`${BASE}/cursos`)
  if (!r.ok) throw new Error('Erro ao buscar cursos')
  return r.json()
}

export async function saveCurso(data) {
  const r = await fetch(`${BASE}/cursos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Erro ao salvar curso')
  return r.json()
}

export async function deleteCurso(id) {
  const r = await fetch(`${BASE}/cursos/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Erro ao deletar curso')
  return r.json()
}

// ─── PLANOS ──────────────────────────────────────────────────────────────────
export async function getPlanos() {
  const r = await fetch(`${BASE}/planos`)
  if (!r.ok) throw new Error('Erro ao buscar planos')
  return r.json()
}

export async function savePlano(data) {
  const r = await fetch(`${BASE}/planos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Erro ao salvar plano')
  return r.json()
}

export async function deletePlano(id) {
  const r = await fetch(`${BASE}/planos/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Erro ao deletar plano')
  return r.json()
}

// ─── DOCUMENTOS ──────────────────────────────────────────────────────────────
export async function uploadDocumento(alunoId, file) {
  const formData = new FormData()
  formData.append('documento', file)
  const r = await fetch(`${BASE}/alunos/${alunoId}/documentos`, {
    method: 'POST',
    body: formData,
  })
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({}))
    throw new Error(errorData.error || 'Erro ao fazer upload do documento')
  }
  return r.json()
}

export async function getDocumentos(alunoId) {
  const r = await fetch(`${BASE}/alunos/${alunoId}/documentos`)
  if (!r.ok) throw new Error('Erro ao buscar documentos do aluno')
  return r.json()
}

export async function deleteDocumento(alunoId, docId) {
  const r = await fetch(`${BASE}/alunos/${alunoId}/documentos/${docId}`, {
    method: 'DELETE',
  })
  if (!r.ok) throw new Error('Erro ao deletar documento')
  return r.json()
}
