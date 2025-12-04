-- Script de Verificação da Configuração do Supabase
-- Executar no SQL Editor do Supabase para validar a configuração pós-refatoração

-- 1. Verificar se a função get_tenant_id() existe
SELECT EXISTS(
  SELECT 1 FROM pg_proc 
  WHERE proname = 'get_tenant_id'
) AS "get_tenant_id_exists";

-- 2. Listar todas as tabelas de Odontologia criadas
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name LIKE 'odontologia_%'
ORDER BY table_name;

-- 3. Verificar RLS habilitado nas tabelas de Odontologia
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename LIKE 'odontologia_%'
ORDER BY tablename;

-- 4. Listar todas as políticas de RLS nas tabelas de Odontologia
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE 'odontologia_%'
ORDER BY tablename, policyname;

-- 5. Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename LIKE 'odontologia_%'
ORDER BY tablename, indexname;

-- 6. Verificar a estrutura das tabelas de Odontologia (colunas)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'odontologia_%'
ORDER BY table_name, ordinal_position;

-- 7. Verificar se a tabela 'tenants' existe (referenciada pelas tabelas de Odontologia)
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'tenants'
) AS "tenants_table_exists";

-- 8. Verificar se a tabela 'auth.users' está acessível
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'auth' AND table_name = 'users'
) AS "auth_users_table_exists";

-- 9. Contar registros em cada tabela de Odontologia (para validação de dados)
SELECT 
  'odontologia_pacientes' AS table_name,
  COUNT(*) AS record_count
FROM odontologia_pacientes
UNION ALL
SELECT 'odontologia_odontograma', COUNT(*) FROM odontologia_odontograma
UNION ALL
SELECT 'odontologia_procedimentos', COUNT(*) FROM odontologia_procedimentos
UNION ALL
SELECT 'odontologia_imagens', COUNT(*) FROM odontologia_imagens
UNION ALL
SELECT 'odontologia_agendamentos', COUNT(*) FROM odontologia_agendamentos
UNION ALL
SELECT 'odontologia_faturamento', COUNT(*) FROM odontologia_faturamento
ORDER BY table_name;

-- 10. Resumo de Conformidade
SELECT 
  'RLS Status' AS check_item,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE tablename LIKE 'odontologia_%' AND rowsecurity = true) = 6 
    THEN '✅ CONFORMIDADE: RLS habilitado em todas as 6 tabelas'
    ELSE '❌ NÃO CONFORME: RLS não habilitado em todas as tabelas'
  END AS status
UNION ALL
SELECT 
  'Políticas RLS',
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE 'odontologia_%') >= 24
    THEN '✅ CONFORMIDADE: Políticas RLS configuradas'
    ELSE '❌ NÃO CONFORME: Políticas RLS incompletas'
  END
UNION ALL
SELECT 
  'Função get_tenant_id()',
  CASE 
    WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_tenant_id')
    THEN '✅ CONFORMIDADE: Função get_tenant_id() existe'
    ELSE '❌ NÃO CONFORME: Função get_tenant_id() não encontrada'
  END
UNION ALL
SELECT 
  'Tabela tenants',
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
    THEN '✅ CONFORMIDADE: Tabela tenants existe'
    ELSE '❌ NÃO CONFORME: Tabela tenants não encontrada'
  END;
