# RegiFlex - Sistema de Gestão para Clínicas de Psicologia

[![GitHub Pages Status](https://github.com/artur-source/RegiFlex-teste/actions/workflows/pages/pages-build-deployment/badge.svg)](https://artur-source.github.io/RegiFlex-teste/)

O RegiFlex é um sistema de gestão SaaS (Software as a Service) para clínicas e psicólogos autônomos, desenvolvido como um projeto de extensão acadêmica. Ele utiliza uma arquitetura moderna e escalável baseada no Supabase.

## Status Atual do Projeto

O projeto está **funcional** e as principais funcionalidades (Gestão de Pacientes, Agendamento, Relatórios e a Edge Function de IA) foram implementadas e sincronizadas.

| Funcionalidade | Status | Observação |
| :--- | :--- | :--- |
| **Instalação** | **Funcional** | O processo de setup foi corrigido com scripts SQL para inicialização do banco de dados. |
| **IA Integrada** | **Funcional** | Edge Function de previsão de *no-show* implantada e conectada ao frontend. (Modelo de simulação). |
| **Relatórios** | **Funcional** | Módulo de relatórios avançados (gráficos e estatísticas) implementado. |
| **Multi-Tenancy** | **Funcional** | Infraestrutura de banco de dados (tabela `clinicas` e RLS) e código de provisionamento automático (Edge Function) implementados. |

## 1. Tecnologias

- **Frontend:** React.js, Vite, Tailwind CSS, Shadcn/ui, Recharts
- **Backend/Database:** Supabase (PostgreSQL, Auth, Edge Functions)

## 2. Instalação e Setup (Ambiente de Desenvolvimento)

Siga os passos abaixo para configurar o projeto localmente:

### 2.1. Clone o Repositório

```bash
git clone https://github.com/artur-source/RegiFlex-teste.git
cd RegiFlex-teste
```

### 2.2. Configure o Supabase CLI

Certifique-se de ter a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada e logada.

```bash
# Instalar a CLI (se necessário)
# curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz && sudo mv supabase /usr/local/bin
# supabase login
```

### 2.3. Vincule ao Projeto Remoto (Removido)

Vincule seu ambiente local ao projeto Supabase remoto.

Para vincular, você precisará do **Project Ref** do seu projeto Supabase.

```bash
# Substitua SEU_PROJECT_REF pelo ID do seu projeto Supabase
supabase link --project-ref SEU_PROJECT_REF
```

### 2.4. Inicialize o Banco de Dados

Execute os scripts SQL para criar o schema e popular com dados de teste.

```bash
# Cria as tabelas e políticas de segurança (RLS)
supabase db reset --local
# O script `schema.sql` e `seed.sql` serão aplicados automaticamente.
```
**Nota:** O comando `supabase db reset --local` é usado para desenvolvimento local. Para aplicar o schema no projeto remoto, use o Dashboard ou o comando `supabase migration up`.

### 2.5. Instale as Dependências do Frontend e Inicie

```bash
cd frontend
npm install
npm run dev
```

O frontend estará acessível em `http://localhost:5173` (ou porta similar).

### 2.6. Credenciais de Teste

Use as seguintes credenciais para acessar o sistema após a inicialização do banco de dados:

| Campo | Valor |
| :--- | :--- |
| **Email** | `admin@regiflex.com` |
| **Senha** | `password` |

## 3. Edge Functions

As Edge Functions foram implantadas no projeto remoto.

| Função | Descrição | Status |
| :--- | :--- | :--- |
| `predict-no-show` | Previsão de risco de *no-show* em sessões agendadas. | **Deploy Feito** |
| `provision-new-tenant` | Lógica de provisionamento automático de novos clientes. | **Deploy Feito** |

## 4. Próximos Passos Críticos

Os próximos passos para a viabilidade comercial do RegiFlex são:

1.  **Refinamento da IA:** Substituir o modelo de simulação (`predict-no-show/index.ts`) por um modelo treinado com dados reais.
2.  **Conclusão dos Relatórios Avançados:** Implementar a funcionalidade de exportação de dados (CSV/PDF) no módulo de relatórios.

## 5. FAQ de Instalação e Produção

Para instruções detalhadas sobre a instalação em ambiente de produção (com domínio próprio e configurações de segurança), consulte o guia completo:

[Guia Hiper-Detalhado de Instalação de Produção](/docs/Guia_Hiper-Detalhado_de_Instalacao_de_Producao.md)



## 6. Problemas Comuns e Solução de Erros

Para um guia completo de mensagens de erro, cenários de falha e possíveis soluções, consulte a documentação detalhada:

[Documentação Completa de Mensagens de Erro](/docs/ERROR_MESSAGES.md)

### Dicas de Prevenção e Troubleshooting Rápido

| Erro Comum | Causa Provável | Solução Rápida |
| :--- | :--- | :--- |
| **Credenciais Inválidas** (`ERR-AUTH-001`) | Email ou senha incorretos. | Verifique as credenciais de teste na seção 2.6. |
| **Erro ao Carregar Dados** (`ERR-FRONT-001`) | Falha de conexão com o Supabase ou RLS bloqueando o acesso. | Verifique se o Supabase está rodando localmente (`supabase start`) e se as variáveis de ambiente estão corretas. |
| **Token Inválido** (`ERR-AUTH-002`) | Sessão expirada ou token JWT corrompido. | Faça logout e login novamente. |
| **Dados Incompletos** (`ERR-PROV-001`) | Campos obrigatórios não preenchidos (ex: provisionamento). | Verifique se todos os campos obrigatórios (nome, email) foram fornecidos na requisição. |
| **Webhook Verification Failed** (`ERR-WEBHOOK-001`) | Chave secreta do Webhook Stripe incorreta. | Verifique se a variável de ambiente `STRIPE_WEBHOOK_SECRET` está configurada corretamente. |
| **`relation does not exist`** | Tabelas do banco de dados não criadas. | Execute `supabase db reset --local` para aplicar o schema. |
| **`Email inválido`** (`ERR-PROV-002`) | Formato de email incorreto na requisição de provisionamento. | Verifique se o formato do email segue o padrão `usuario@dominio.com`. |

Para erros específicos de integração Stripe, como falha na criação de cliente ou assinatura, consulte a seção **3. Erros de Integração Stripe** na documentação de erros.
