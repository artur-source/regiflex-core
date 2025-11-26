# Documentação de Mensagens de Erro - RegiFlex

Este documento cataloga as principais mensagens de erro e exceções encontradas no código-fonte do projeto RegiFlex, fornecendo contexto, localização e sugestões de solução.

## Sugestão de Padronização

Para melhorar a rastreabilidade e o tratamento de erros, sugere-se a padronização das mensagens de erro com códigos únicos no formato `ERR-XXX`.

| Código Sugerido | Nome do Erro | Categoria |
| :--- | :--- | :--- |
| `ERR-AUTH-001` | CREDENCIAIS_INVALIDAS | Autenticação |
| `ERR-AUTH-002` | TOKEN_INVALIDO | Autenticação |
| `ERR-AUTH-003` | ACESSO_NEGADO | Autorização |
| `ERR-PROV-001` | DADOS_INCOMPLETOS | Provisionamento/Validação |
| `ERR-PROV-002` | EMAIL_INVALIDO | Provisionamento/Validação |
| `ERR-SUPA-001` | ERRO_DB_OPERACAO | Supabase/Banco de Dados |
| `ERR-SUPA-002` | FALHA_PROVISIONAMENTO | Supabase/Provisionamento |
| `ERR-STRIPE-001` | REQUISICAO_INVALIDA | Stripe/API |
| `ERR-STRIPE-002` | CLIENTE_NAO_ENCONTRADO | Stripe/API |
| `ERR-STRIPE-003` | ASSINATURA_NAO_ENCONTRADA | Stripe/API |
| `ERR-WEBHOOK-001` | FALHA_VERIFICACAO_WEBHOOK | Stripe/Webhook |
| `ERR-WEBHOOK-002` | ERRO_PROCESSAMENTO_WEBHOOK | Stripe/Webhook |
| `ERR-FRONT-001` | ERRO_CARREGAR_DADOS | Frontend/Geral |
| `ERR-FRONT-002` | ERRO_SALVAR_DADOS | Frontend/Geral |
| `ERR-FRONT-003` | QRCODE_INVALIDO | Frontend/QR Code |

---

## Mensagens de Erro Detalhadas

### 1. Erros de Autenticação e Autorização

#### Erro: `Token de acesso necessário` (`ERR-AUTH-002`)
- **Descrição**: Ocorre quando uma requisição a um endpoint protegido (ex: Stripe API) não inclui o token de autenticação (JWT).
- **Solução**: Certifique-se de que o usuário está logado e que o token JWT está sendo enviado no cabeçalho `Authorization` da requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 41)

#### Erro: `Token inválido` (`ERR-AUTH-002`)
- **Descrição**: Ocorre quando o token JWT fornecido na requisição é inválido, expirado ou não corresponde a um usuário ativo no Supabase Auth.
- **Solução**: O usuário deve fazer login novamente para obter um novo token válido.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 47), `RegiFlex-teste/docs/SISTEMA_SUPORTE_SUPER_ADMIN.md` (linha 154)

#### Erro: `Erro na autenticação` (`ERR-AUTH-002`)
- **Descrição**: Erro genérico de servidor durante o processo de autenticação (ex: falha na comunicação com o Supabase Auth).
- **Solução**: Verificar logs do servidor para detalhes. Pode indicar um problema de configuração do Supabase ou de rede.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 53), `RegiFlex-teste/docs/SISTEMA_SUPORTE_SUPER_ADMIN.md` (linha 175)

#### Erro: `Acesso negado: não é super admin` (`ERR-AUTH-003`)
- **Descrição**: Ocorre quando um usuário tenta acessar um endpoint restrito a Super Administradores, mas não possui o perfil necessário.
- **Solução**: Acesso restrito. O usuário deve ser cadastrado na tabela `super_admins`.
- **Arquivo**: `RegiFlex-teste/docs/SISTEMA_SUPORTE_SUPER_ADMIN.md` (linha 166)

#### Erro: `Permissão insuficiente` (`ERR-AUTH-003`)
- **Descrição**: Ocorre quando o usuário (Super Admin ou usuário de clínica) não possui a permissão específica (`required`) para executar a ação solicitada.
- **Solução**: Revisar a lógica de permissões e a função `requireSuperAdminPermission` ou `requirePermission`.
- **Arquivo**: `RegiFlex-teste/docs/SISTEMA_SUPORTE_SUPER_ADMIN.md` (linha 186), `RegiFlex-teste/docs/GERENCIAMENTO_USUARIOS_MULTI_TENANT.md` (linha 496)

#### Erro: `Credenciais inválidas` (`ERR-AUTH-001`)
- **Descrição**: Mensagem exibida no frontend quando o login falha.
- **Solução**: O usuário deve verificar o email e a senha.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/Login.jsx` (linha 26)

### 2. Erros de Provisionamento e Validação

#### Erro: `Method not allowed`
- **Descrição**: O endpoint `/api/provision-client` foi acessado com um método HTTP diferente de `POST`.
- **Solução**: O cliente deve usar o método `POST` para iniciar o provisionamento.
- **Arquivo**: `RegiFlex-teste/api/provision-client.js` (linha 30)

#### Erro: `Dados incompletos` (`ERR-PROV-001`)
- **Descrição**: Ocorre quando os dados da clínica e/ou do administrador não são fornecidos na requisição de provisionamento.
- **Solução**: O corpo da requisição deve incluir os objetos `clinic` e `admin`.
- **Arquivo**: `RegiFlex-teste/api/provision-client.js` (linha 41)

#### Erro: `Erro no provisionamento` (`ERR-SUPA-002`)
- **Descrição**: Erro genérico de servidor durante o processo de provisionamento, capturado no bloco `catch` principal.
- **Solução**: Verificar os `details` (se em ambiente de desenvolvimento) ou logs do servidor para identificar a falha específica (ex: falha ao criar usuário no Supabase Auth, falha ao inserir clínica).
- **Arquivo**: `RegiFlex-teste/api/provision-client.js` (linha 86)

#### Erro: `Falha no provisionamento: ${error.message}` (`ERR-SUPA-002`)
- **Descrição**: Exceção lançada internamente na função `provisionNewClinic` após uma falha em uma sub-operação (ex: falha ao criar clínica, usuário ou perfil).
- **Solução**: A mensagem de erro interna (`error.message`) deve indicar a causa raiz (ex: erro de banco de dados, erro de autenticação).
- **Arquivo**: `RegiFlex-teste/api/provisioning.js` (linha 69)

#### Erros de Validação (Retornados como Array) (`ERR-PROV-001`, `ERR-PROV-002`)
- **Descrição**: Erros de validação de campos obrigatórios ou formato de email.
- **Solução**: Corrigir os dados de entrada antes de enviar a requisição de provisionamento.
- **Arquivos**: `RegiFlex-teste/api/provisioning.js` (linhas 334-348), `RegiFlex-teste/test-provisioning.js` (linhas 17-31)
  - `Nome da clínica é obrigatório`
  - `Email da clínica é obrigatório`
  - `Nome completo do administrador é obrigatório`
  - `Email do administrador é obrigatório`
  - `Email da clínica inválido`
  - `Email do administrador inválido`

### 3. Erros de Integração Stripe

#### Erro: `Nome e email são obrigatórios` (`ERR-STRIPE-001`)
- **Descrição**: Ocorre ao tentar criar um cliente Stripe sem fornecer `name` e `email`.
- **Solução**: Incluir os campos obrigatórios na requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 86)

#### Erro: `customer_id e price_id são obrigatórios` (`ERR-STRIPE-001`)
- **Descrição**: Ocorre ao tentar criar uma assinatura Stripe sem fornecer os IDs necessários.
- **Solução**: Incluir os campos obrigatórios na requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 187)

#### Erro: `subscription_id é obrigatório` (`ERR-STRIPE-001`)
- **Descrição**: Ocorre ao tentar cancelar uma assinatura Stripe sem fornecer o ID da assinatura.
- **Solução**: Incluir o ID da assinatura na requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 268)

#### Erro: `price_id, success_url e cancel_url são obrigatórios` (`ERR-STRIPE-001`)
- **Descrição**: Ocorre ao tentar criar uma sessão de checkout Stripe sem fornecer os parâmetros necessários.
- **Solução**: Incluir os campos obrigatórios na requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 365)

#### Erro: `invoice_id é obrigatório` (`ERR-STRIPE-001`)
- **Descrição**: Ocorre ao tentar retentar o pagamento de uma fatura sem fornecer o ID da fatura.
- **Solução**: Incluir o ID da fatura na requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 483)

#### Erro: `start_date e end_date são obrigatórios` (`ERR-STRIPE-001`)
- **Descrição**: Ocorre ao tentar gerar um relatório de receita sem fornecer o período.
- **Solução**: Incluir as datas de início e fim na requisição.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 560)

#### Erro: `Cliente não encontrado` (`ERR-STRIPE-002`)
- **Descrição**: Ocorre ao tentar buscar um cliente Stripe que não existe.
- **Solução**: Verificar se o `customer_id` está correto.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 158)

#### Erro: `Assinatura não encontrada` (`ERR-STRIPE-003`)
- **Descrição**: Ocorre ao tentar buscar uma assinatura Stripe que não existe.
- **Solução**: Verificar se o `subscription_id` está correto.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 248)

#### Erro: `Webhook verification failed` (`ERR-WEBHOOK-001`)
- **Descrição**: Falha na verificação da assinatura do webhook Stripe, indicando que a requisição pode não ser legítima ou que a chave secreta está incorreta.
- **Solução**: Verificar se a chave secreta do webhook (`STRIPE_WEBHOOK_SECRET`) está configurada corretamente no ambiente.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 612), `RegiFlex-teste/api/webhooks/stripe.js` (linha 30)

#### Erro: `Webhook processing error` (`ERR-WEBHOOK-002`)
- **Descrição**: Erro interno durante o processamento do evento de webhook Stripe.
- **Solução**: Verificar logs do servidor para identificar a falha específica no `processStripeWebhook`.
- **Arquivo**: `RegiFlex-teste/api/stripe-integration.js` (linha 625)

### 4. Erros de Frontend (React/Supabase)

#### Erro: `Erro ao carregar dados do dashboard` (`ERR-FRONT-001`)
- **Descrição**: Falha na requisição para obter dados do dashboard.
- **Solução**: Verificar a conectividade com a API e os logs do backend.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/Dashboard.jsx` (linha 80)

#### Erro: `Erro ao carregar pacientes` (`ERR-FRONT-001`)
- **Descrição**: Falha na requisição para obter a lista de pacientes.
- **Solução**: Verificar a conectividade com a API e as permissões de RLS no Supabase.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/Pacientes.jsx` (linha 63), `RegiFlex-teste/frontend/src/components/QRCode.jsx` (linha 46)

#### Erro: `Erro ao salvar paciente` (`ERR-FRONT-002`)
- **Descrição**: Falha na requisição de criação ou edição de paciente.
- **Solução**: Verificar a validação de dados e a operação de `insert`/`update` no backend/Supabase.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/Pacientes.jsx` (linha 107)

#### Erro: `Erro ao salvar sessão` (`ERR-FRONT-002`)
- **Descrição**: Falha na requisição de agendamento ou edição de sessão.
- **Solução**: Verificar a validação de dados e a operação de `insert`/`update` no backend/Supabase.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/Sessoes.jsx` (linha 139)

#### Erro: `Erro ao gerar QR Code` (`ERR-FRONT-003`)
- **Descrição**: Falha na requisição para gerar o QR Code.
- **Solução**: Verificar a lógica de geração de QR Code na API.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/QRCode.jsx` (linha 60)

#### Erro: `QR Code inválido` (`ERR-FRONT-003`)
- **Descrição**: Ocorre ao tentar ler um QR Code que não corresponde a um paciente válido.
- **Solução**: O usuário deve verificar se o QR Code lido está correto.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/QRCode.jsx` (linha 93)

#### Erro: `Stripe não foi carregado corretamente`
- **Descrição**: Ocorre no componente `CheckoutForm` se os objetos `stripe` ou `elements` não estiverem disponíveis.
- **Solução**: Verificar se o `StripeCheckout` está envolvido corretamente pelo `Elements` provider e se as chaves públicas do Stripe estão corretas.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/StripeCheckout.jsx` (linha 92)

#### Erro: `Erro ao carregar dados para o relatório.` (`ERR-FRONT-001`)
- **Descrição**: Falha na requisição para a RPC de relatório de sessões.
- **Solução**: Verificar a função `getRelatorioSessoes` na API e a RPC `export-relatorio` no Supabase.
- **Arquivo**: `RegiFlex-teste/frontend/src/components/Relatorios.jsx` (linha 136)

---

## Referências Cruzadas (Testes e Documentação)

| Erro | Arquivo de Teste/Documentação | Contexto |
| :--- | :--- | :--- |
| `ERR-PROV-001` / `ERR-PROV-002` | `RegiFlex-teste/test-provisioning.js` | Teste 2: Validação de dados inválidos (linhas 128-148) |
| `ERR-AUTH-002` | `RegiFlex-teste/docs/SISTEMA_SUPORTE_SUPER_ADMIN.md` | Middleware `requireSuperAdmin` (linhas 152-177) |
| `ERR-SUPA-001` | `RegiFlex-teste/import_data_supabase.js` | Tratamento de erro ao limpar, criar psicólogos/pacientes e importar sessões (linhas 77, 104, 138, 206) |
| `ERR-AUTH-003` | `RegiFlex-teste/docs/GERENCIAMENTO_USUARIOS_MULTI_TENANT.md` | Exemplo de validação de `clinic_id` e permissões (linhas 337, 496) |
| `ERR-WEBHOOK-001` | `RegiFlex-teste/api/webhooks/stripe.js` | Bloco `try...catch` da verificação de assinatura do webhook (linhas 28-31) |
| `ERR-FRONT-001` | `RegiFlex-teste/frontend/src/components/Dashboard.jsx` | Alerta de erro exibido no JSX (linhas 129-137) |
| `ERR-FRONT-002` | `RegiFlex-teste/frontend/src/components/UserManagement.jsx` | Tratamento de erro ao salvar usuário (linha 120) |
