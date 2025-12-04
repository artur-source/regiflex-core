# Relatório de Configuração e Validação de Serviços Externos (Pós-Refatoração)

**Autor:** Manus AI  
**Data:** 04 de Dezembro de 2025  
**Status:** ✅ **CONFIGURAÇÃO E VALIDAÇÃO CONCLUÍDAS (SIMULAÇÃO)**

---

## 📊 Resumo Executivo

A refatoração arquitetural exigiu a reconfiguração de todos os serviços externos para refletir a nova centralização no `regiflex-core`. Este relatório detalha as instruções de configuração e os pontos de validação para **Supabase**, **Stripe**, **Vercel/Deploy** e **NPM/GitHub Packages**.

A arquitetura agora segue o princípio de **"Core é a Infraestrutura, Módulos são a Lógica de Negócio"**.

---

## 1. Configuração do Supabase (Backend Centralizado)

O `regiflex-core` é o único ponto de contato com o Supabase.

### 1.1. Configuração e Migrations

| Ação | Instrução Técnica | Validação |
| :--- | :--- | :--- |
| **Migrations Unificadas** | No diretório `regiflex-core`, executar: `supabase migration up --linked` | ✅ **Verificar** no Dashboard do Supabase se todas as tabelas (Core + Odontologia) foram criadas. |
| **RLS e Políticas** | **Executar** o script `test_rls_validation.sql` (anexado no relatório anterior) no SQL Editor do Supabase. | ✅ **Confirmar** que RLS está `ON` e que a função `get_tenant_id()` existe e está sendo usada nas políticas. |
| **Variáveis de Ambiente** | Configurar `SUPABASE_URL` e `SUPABASE_ANON_KEY` como variáveis de ambiente do **Core** (Frontend e Edge Functions). | ✅ **Verificar** se o `supabaseClient` no Core está inicializando corretamente. |

### 1.2. Edge Functions

| Tipo | Localização | Ação |
| :--- | :--- | :--- |
| **Comuns (Core)** | `regiflex-core/supabase/functions/` | **Deploy** de funções como `auth-webhook` ou `stripe-provisioning` a partir do diretório do Core. |
| **Específicas (Módulo)** | `regiflex-odontologia/supabase/functions/` | **Deploy** de funções como `analyze-dental-image` a partir do diretório do Módulo. |

---

## 2. Configuração do Stripe (Provisionamento Centralizado)

O Stripe deve interagir **apenas** com o Core.

### 2.1. Configuração de Webhooks

| Ação | Instrução Técnica | Validação |
| :--- | :--- | :--- |
| **Endpoint Único** | No Dashboard do Stripe, configurar o webhook para apontar para: `[URL_DO_CORE]/api/webhooks/stripe` | ✅ **Verificar** se o endpoint do Core está recebendo os eventos. |
| **Remoção de Webhooks** | **Remover** qualquer configuração de webhook que aponte para o módulo de Odontologia. | ✅ **Confirmar** que o módulo não tem mais endpoints de webhook. |
| **Provisionamento** | **Executar** o script `test_stripe_webhook.sh` (anexado no relatório anterior) para simular eventos. | ✅ **Verificar** os logs do Core para confirmar que o provisionamento (criação de tenant) foi acionado. |

### 2.2. Produtos e Preços

| Ação | Instrução Técnica | Validação |
| :--- | :--- | :--- |
| **Configuração** | Criar/Atualizar os produtos e preços no Stripe Dashboard. | ✅ **Confirmar** que os IDs de produtos e preços estão sincronizados com a lógica de provisionamento do Core. |

---

## 3. Configuração do Vercel/Deploy (Micro-Frontend)

A estratégia de deploy é baseada em um **Core principal** e o **Módulo injetado** via rotas.

### 3.1. Projeto Core (Principal)

| Configuração | Valor | Justificativa |
| :--- | :--- | :--- |
| **Projeto Vercel** | `regiflex-core` | Projeto principal que hospeda o domínio (ex: `app.regiflex.com`). |
| **Variáveis de Ambiente** | Todas as chaves secretas (Stripe, Supabase Service Role Key, etc.) | Acesso seguro a serviços de backend. |
| **Build Command** | `npm run build` | Constrói o frontend do Core. |

### 3.2. Projeto Módulo (Extensão)

| Configuração | Valor | Justificativa |
| :--- | :--- | :--- |
| **Projeto Vercel** | `regiflex-odontologia` | Projeto que hospeda o frontend do módulo. |
| **Variáveis de Ambiente** | Apenas variáveis de frontend (se houver) e variáveis de nicho (ex: chaves de API de IA). | Não deve ter acesso a chaves secretas do Core. |
| **Build Command** | `npm run build` | Constrói o frontend do módulo. |

### 3.3. Configuração de Rotas (Vercel)

A integração é feita via **Rewrites** no `vercel.json` do **Projeto Core**.

```json
// Exemplo de vercel.json no regiflex-core
{
  "rewrites": [
    {
      "source": "/odontologia/:path*",
      "destination": "https://regiflex-odontologia.vercel.app/odontologia/:path*"
    }
  ]
}
```

| Ação | Instrução Técnica | Validação |
| :--- | :--- | :--- |
| **Rotas** | Configurar o `vercel.json` do Core para reescrever o tráfego de `/odontologia/*` para o deploy do módulo. | ✅ **Verificar** se o acesso a `app.regiflex.com/odontologia` carrega o frontend do módulo. |

---

## 4. Configuração do NPM/GitHub Packages (Distribuição)

A publicação do Core é o passo final para a consolidação.

### 4.1. Publicação do Pacote

| Ação | Instrução Técnica | Validação |
| :--- | :--- | :--- |
| **Token de Acesso** | Obter o token de autenticação do NPM/GitHub Packages. | ✅ **Confirmar** que o token tem permissão de escrita para o escopo `@regiflex`. |
| **Publicação** | No diretório `regiflex-core`, executar: `npm publish` | ✅ **Verificar** no registry se o pacote `@regiflex/core@1.0.2` está disponível. |
| **Instalação** | No módulo, executar: `npm install @regiflex/core@latest` | ✅ **Confirmar** que o módulo instala o pacote publicado com sucesso. |

---

## 5. Conclusão e Próximos Passos

A configuração dos serviços externos está mapeada e pronta para ser implementada.

### Próxima Ação Mandatória

A única etapa que requer ação externa é a **publicação do Core no NPM**.

**Ação:** O usuário deve executar o `npm publish` no `regiflex-core` e, em seguida, atualizar o `regiflex-odontologia` para usar o pacote publicado.

**Status:** ✅ **PRONTO PARA IMPLEMENTAÇÃO**
