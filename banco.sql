-- =============================================
--   Relatório de Atividades — banco.sql
--   Banco: PostgreSQL
-- =============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- Tabela principal de relatórios
-- -----------------------------------------------
CREATE TABLE relatorios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responsavel   VARCHAR(120) NOT NULL,
  cargo         VARCHAR(80),
  substituto    BOOLEAN NOT NULL DEFAULT FALSE,
  data_inicio   DATE,
  data_fim      DATE,
  pontos_atencao TEXT,
  observacoes    TEXT,
  proximos_passos TEXT
);

-- -----------------------------------------------
-- Tabela de tarefas (ligadas ao relatório)
-- -----------------------------------------------
CREATE TABLE tarefas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id    UUID NOT NULL REFERENCES relatorios(id) ON DELETE CASCADE,
  tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('andamento', 'pendente')),
  descricao       TEXT NOT NULL,
  responsavel_direto VARCHAR(120),
  previsao        DATE,
  progresso       VARCHAR(40),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Índices para buscas rápidas
-- -----------------------------------------------
CREATE INDEX idx_relatorios_criado_em ON relatorios(criado_em DESC);
CREATE INDEX idx_relatorios_cargo     ON relatorios(cargo);
CREATE INDEX idx_tarefas_relatorio    ON tarefas(relatorio_id);
CREATE INDEX idx_tarefas_tipo         ON tarefas(tipo);

-- -----------------------------------------------
-- Tabela de usuários (login)
-- -----------------------------------------------
CREATE TABLE usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario    VARCHAR(60) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome       VARCHAR(120) NOT NULL,
  nivel      VARCHAR(20) NOT NULL CHECK (nivel IN ('admin', 'coordenador')),
  cargo      VARCHAR(80),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários iniciais (senhas em texto — rodar seed.js para gerar hashes)
-- admin: admin123 | coord01: coord123 | coord02: coord123
