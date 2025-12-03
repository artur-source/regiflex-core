-- Script de Verificação: Função get_tenant_id()
-- Objetivo: Validar a existência e funcionamento da função get_tenant_id()
-- Autor: Manus AI
-- Data: 2025-12-03

-- 1. Verificar se a função existe
SELECT 
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_tenant_id'
  ) AS "Função get_tenant_id() existe?";

-- 2. Obter detalhes da função
SELECT 
  p.proname AS "Nome da Função",
  pg_get_functiondef(p.oid) AS "Definição",
  obj_description(p.oid, 'pg_proc') AS "Descrição"
FROM pg_proc p
WHERE p.proname = 'get_tenant_id';

-- 3. Testar a função com contexto vazio (deve retornar NULL)
SELECT get_tenant_id() AS "tenant_id (sem contexto)";

-- 4. Testar a função com contexto definido (simulando um usuário autenticado)
-- Nota: Executar como superuser ou com permissões apropriadas
-- SET app.tenant_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
-- SELECT get_tenant_id() AS "tenant_id (com contexto)";

-- 5. Verificar políticas de RLS que usam get_tenant_id()
SELECT 
  schemaname,
  tablename,
  policyname,
  qual AS "Condição da Política"
FROM pg_policies
WHERE qual LIKE '%get_tenant_id%'
ORDER BY tablename, policyname;

-- 6. Verificar se RLS está habilitado nas tabelas de odontologia
SELECT 
  tablename,
  rowsecurity AS "RLS Habilitado?"
FROM pg_tables
WHERE tablename LIKE 'odontologia_%'
ORDER BY tablename;
