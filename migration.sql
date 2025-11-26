-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de clínicas (multi-tenant)
CREATE TABLE IF NOT EXISTS clinicas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  endereco TEXT,
  telefone VARCHAR(20),
  email VARCHAR(255),
  plano VARCHAR(20) CHECK (plano IN ('individual', 'clinica')) NOT NULL DEFAULT 'individual',
  status VARCHAR(20) CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas para suporte multi-tenant nas tabelas existentes
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinicas(id) ON DELETE CASCADE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinicas(id) ON DELETE CASCADE;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinicas_updated_at ON clinicas;
CREATE TRIGGER update_clinicas_updated_at BEFORE UPDATE ON clinicas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
