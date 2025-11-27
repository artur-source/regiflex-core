# RegiFlex Core

Este repositório contém o **Core** da plataforma RegiFlex, que é responsável por toda a infraestrutura compartilhada, como autenticação, gerenciamento de usuários (multi-tenant), integração com Supabase e Stripe, e componentes de UI base.

## Estrutura do Projeto

- \`frontend/src/core\`: Contém o código base do frontend (React/Vite), incluindo o layout principal, componentes de UI, contextos de autenticação e serviços de API.
- \`frontend/src/modules\`: Diretório reservado para a inclusão de módulos de nicho (como Odontologia, Psicologia, etc.) como sub-módulos ou pacotes.
- \`backend\`: Contém o código de backend, incluindo funções Edge do Supabase, scripts de API e definições de banco de dados.

## Como Usar

1.  **Instalação:**
    \`\`\`bash
    cd frontend
    pnpm install
    \`\`\`
2.  **Desenvolvimento:**
    \`\`\`bash
    pnpm run dev
    \`\`\`
3.  **Integração de Módulos:**
    Os módulos devem ser desenvolvidos em seus próprios repositórios e integrados aqui, idealmente como pacotes npm ou sub-módulos git, para manter a separação de responsabilidades.
