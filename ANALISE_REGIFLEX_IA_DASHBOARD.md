# Análise Detalhada da Estrutura de IA e Dashboards no Repositório RegiFlex-teste

Este documento apresenta uma análise da implementação de Inteligência Artificial (IA) e da estrutura de Dashboards/Relatórios no repositório `artur-source/RegiFlex-teste`, conforme solicitado. O objetivo é detalhar a arquitetura, a implementação no código e a integração entre os componentes, servindo como base para a expansão dessas funcionalidades para outros módulos.

## 1. Estrutura da Inteligência Artificial (IA)

A funcionalidade de IA identificada no repositório é focada na **predição de risco de não comparecimento (no-show)** de sessões agendadas. A arquitetura é dividida em duas partes principais: o **Treinamento do Modelo** (em Python) e a **Inferência/Uso do Modelo** (em TypeScript/Supabase Edge Function).

### 1.1. Treinamento do Modelo (Backend - Python)

O treinamento do modelo é realizado através do script `analysis.py`.

| Componente | Localização | Tecnologia | Função |
| :--- | :--- | :--- | :--- |
| **Script de Treinamento** | `analysis.py` | Python, Pandas, Scikit-learn, Supabase-py | Busca dados, realiza pré-processamento, treina um modelo de Regressão Logística e salva o modelo. |
| **Modelo Salvo** | `no_show_model.joblib` | Joblib (binário) | Arquivo binário contendo o modelo de Regressão Logística treinado. |

**Detalhes da Implementação em `analysis.py`:**

O modelo utiliza a biblioteca `scikit-learn` para implementar uma **Regressão Logística**, um algoritmo de classificação simples e eficaz para problemas binários como a predição de no-show.

- **Busca de Dados (Linhas 15-17):** O script se conecta ao Supabase para buscar todos os registros da tabela `"sessoes"`.
- **Pré-processamento e Feature Engineering (Linhas 20-35):**
    - Converte a coluna `data_hora` para o tipo datetime.
    - Cria as *features* **dia_da_semana** (0-6), **hora_do_dia** (0-23).
    - Calcula a *feature* **antecedencia_agendamento** em dias, subtraindo `created_at` de `data_hora`.
    - Define a variável *target* **no_show** (1 se o status for 'faltou' ou 'cancelada', 0 caso contrário).
    - **Features utilizadas:** `["dia_da_semana", "hora_do_dia", "antecedencia_agendamento", "duracao_minutos"]`.
- **Treinamento e Salvamento (Linhas 38-54):** O modelo é treinado com as features selecionadas e salvo no arquivo `no_show_model.joblib` usando `joblib.dump`.

### 1.2. Inferência do Modelo (Supabase Edge Function - TypeScript)

A lógica de predição é implementada como uma **Edge Function** do Supabase, o que permite que a IA seja executada em um ambiente serverless, próximo ao banco de dados.

| Componente | Localização | Tecnologia | Função |
| :--- | :--- | :--- | :--- |
| **Função Edge** | `supabase/functions/predict-no-show/index.ts` | TypeScript, Deno, Supabase-js | Recebe um `session_id`, busca os dados da sessão, aplica a lógica de pré-processamento e simula a predição de risco. |

**Detalhes da Implementação em `predict-no-show/index.ts`:**

- **Lógica de Simulação (Linhas 63-92):** O código **não carrega o modelo binário** (`no_show_model.joblib`) treinado em Python. Em vez disso, ele **simula** a lógica de predição de risco com base em regras heurísticas simples:
    - **Risco por Antecedência:** Maior risco se agendado com pouca antecedência (`risk_score += Math.max(0, 10 - features.antecedencia_agendamento) * 0.1`).
    - **Risco por Dia da Semana:** Maior risco em finais de semana (`features.dia_da_semana === 0 || features.dia_da_semana === 6`).
    - **Risco por Horário:** Maior risco fora do horário comercial (`features.hora_do_dia < 9 || features.hora_do_dia > 18`).
- **Resultado (Linhas 93-101):** O resultado é um objeto JSON que inclui a porcentagem de risco (`risk_percentage`) e um indicador booleano (`is_high_risk`).

> **Observação Crítica:** A implementação atual da IA na Edge Function é uma **simulação heurística** e **não** o modelo de Regressão Logística treinado em Python. Para uma implementação real, o modelo Python precisaria ser reescrito em TypeScript/JavaScript (o que é viável para Regressão Logística) ou a predição deveria ser feita por um serviço externo (como um endpoint de API) que carregasse o modelo `.joblib`.

### 1.3. Integração no Frontend (React/JSX)

A interface de usuário para a IA está no componente `IA.jsx`.

| Componente | Localização | Tecnologia | Função |
| :--- | :--- | :--- | :--- |
| **Componente IA** | `frontend/src/components/IA.jsx` | React, Shadcn/ui, Recharts | Exibe alertas ativos, padrões de cancelamento e permite a análise individual de pacientes. |

- **Funcionalidades (Linhas 140-434):** O componente utiliza abas (`Tabs`) para organizar as informações:
    - **Alertas Ativos:** Exibe alertas com severidade (baixa, média, alta) e sugestões de ação.
    - **Padrões de Cancelamento:** Mostra estatísticas agregadas (total de cancelamentos, período) e padrões identificados (ex: "Cancelamentos em segundas-feiras").
    - **Análise de Paciente:** Permite selecionar um paciente para ver estatísticas individuais (taxa de comparecimento, frequência) e alertas específicos.
- **Comunicação (Linhas 43-75):** A comunicação com o backend é feita através de `apiService` (que encapsula chamadas para as Edge Functions e RPCs do Supabase), utilizando funções como `apiService.getAlertasIA()`, `apiService.getPadroesCancelamento()` e `apiService.getAnalisePaciente()`.

## 2. Estrutura de Dashboards e Relatórios

A estrutura de visualização de dados é dividida entre um **Dashboard** de visão geral e uma seção de **Relatórios** mais detalhada e filtrável.

### 2.1. Dashboard (Visão Geral)

O componente `Dashboard.jsx` fornece uma visão rápida das métricas principais.

| Componente | Localização | Tecnologia | Função |
| :--- | :--- | :--- | :--- |
| **Componente Dashboard** | `frontend/src/components/Dashboard.jsx` | React, Shadcn/ui, Recharts | Exibe estatísticas chave, alertas de IA e gráficos de resumo (sessões por status, por dia da semana). |

- **Métricas Chave (Linhas 148-218):** Exibe cartões com `Total de Pacientes`, `Sessões Hoje`, `Sessões esta Semana` e `Sessões este Mês`.
- **Gráficos (Linhas 311-378):** Utiliza a biblioteca `Recharts` para renderizar gráficos de barras:
    - `Sessões por Status (Este Mês)`
    - `Sessões por Dia da Semana`
- **Personalização (Linhas 38-52):** O dashboard permite a personalização da visibilidade dos cartões, salvando as preferências no `localStorage` do navegador.

### 2.2. Relatórios (Análise Detalhada)

O componente `Relatorios.jsx` é a seção de análise aprofundada, com foco em filtros e exportação de dados.

| Componente | Localização | Tecnologia | Função |
| :--- | :--- | :--- | :--- |
| **Componente Relatórios** | `frontend/src/components/Relatorios.jsx` | React, Shadcn/ui, Recharts | Permite filtrar dados por período, paciente e status, exibe estatísticas avançadas e gráficos, e oferece exportação. |

- **Filtros Dinâmicos (Linhas 220-284):** Implementa filtros por `Data Início`, `Data Fim`, `Paciente` e `Status`. A mudança nos filtros dispara uma nova chamada à API (`fetchData`).
- **Estatísticas Chave (Linhas 16-54):** Exibe métricas como `Taxa de Comparecimento`, `Taxa de Cancelamento` e `Pacientes Ativos`.
- **Gráficos (Linhas 297-302):**
    - `SessionTypeChart` (Gráfico de Pizza)
    - `StatusChart` (Gráfico de Barras)
- **Exportação (Linhas 180-190):** Oferece botões para `Exportar PDF` e `Exportar CSV`, chamando a Edge Function `export-relatorio`.

### 2.3. Lógica de Relatórios (Supabase SQL e Edge Function)

A inteligência por trás dos relatórios é centralizada no Supabase.

| Componente | Localização | Tecnologia | Função |
| :--- | :--- | :--- | :--- |
| **Função RPC de Agregação** | `supabase/sql/relatorio_agregado.sql` | PostgreSQL/SQL | Função de banco de dados (`get_aggregated_report`) que calcula todas as métricas e agregações de dados (taxas, contagens por tipo/status) com base nos filtros fornecidos. |
| **Função Edge de Exportação** | `supabase/functions/export-relatorio/index.ts` | TypeScript, Deno, Supabase-js | Busca os dados detalhados da sessão com base nos filtros e formata o resultado para exportação em CSV ou PDF (simulado como TXT). |

**Detalhes da Implementação em `relatorio_agregado.sql`:**

- **Função `get_aggregated_report` (Linhas 4-82):** Esta é uma **função de banco de dados (RPC)** que recebe os filtros (`start_date`, `end_date`, etc.) e retorna um objeto JSONB com todas as estatísticas pré-calculadas.
- **Cálculos (Linhas 30-74):** A função calcula:
    - `total_sessoes`, `total_realizadas`, `total_canceladas`, `total_faltas`, `active_patients`.
    - `attendance_rate` (Taxa de Comparecimento).
    - `cancellation_rate` (Taxa de Cancelamento).
    - Agregações por `session_type_data` e `status_data`.

> **Vantagem Arquitetural:** O uso da função RPC para agregação é uma **prática excelente** no Supabase, pois move a carga de processamento de dados para o banco de dados, onde é mais eficiente, e reduz a latência da API.

## 3. Conclusão e Estrutura para Expansão

A estrutura atual é **modular e bem definida**, utilizando o Supabase como espinha dorsal para o backend (banco de dados, funções serverless e lógica de agregação).

| Aspecto | Estrutura Atual | Sugestão para Expansão |
| :--- | :--- | :--- |
| **Arquitetura** | Frontend (React) + Backend (Supabase/Edge Functions) + Lógica de IA (Python/Simulação TS). | Manter a arquitetura modular. Para novos módulos, criar componentes de frontend (`IA_NovoModulo.jsx`, `Relatorios_NovoModulo.jsx`) e funções RPC/Edge Functions correspondentes. |
| **IA (Lógica)** | Modelo de Regressão Logística (Python) + Simulação Heurística (TypeScript). | **Padronizar a Inferência:** Para novos módulos, ou reescrever o modelo Python em TypeScript (se for simples) ou criar um serviço de API externo (se o modelo for complexo, ex: Deep Learning) para consumir o modelo `.joblib` de forma segura. |
| **Dashboards/Relatórios** | Componentes React reutilizáveis (`KeyStats`, `SessionTypeChart`) + Lógica de Agregação em SQL (RPC). | **Reutilização de Componentes:** Reutilizar os componentes de UI (`KeyStats`, `BarChart`, `PieChart`) e focar na criação de novas **Funções RPC** no Supabase (ex: `get_aggregated_report_odontologia`) para alimentar os novos relatórios com dados específicos do módulo. |
| **Estrutura de Código** | Frontend em `frontend/src/components/`, Lógica de IA em `analysis.py` e `supabase/functions/`, Lógica de Relatórios em `supabase/sql/`. | Manter a separação clara. Para o módulo de Odontologia, por exemplo, a lógica de IA pode estar em `supabase/functions/predict-no-show-odontologia/` e os relatórios em `supabase/sql/relatorio_odontologia.sql`. |

A implementação do dashboard e relatórios é **altamente reutilizável**. A chave para implementar isso em todos os módulos é:

1.  **Definir as Métricas:** Quais são as métricas e *features* de IA específicas para o novo módulo (ex: Odontologia, Fisioterapia).
2.  **Criar a RPC de Relatório:** Escrever uma nova função SQL (RPC) no Supabase para agregar os dados do novo módulo (similar a `relatorio_agregado.sql`).
3.  **Criar a Lógica de IA:** Treinar um novo modelo Python e/ou criar uma nova Edge Function para a inferência de IA do novo módulo.
4.  **Integrar no Frontend:** Criar novos componentes React (ou adaptar os existentes) que chamem as novas RPCs e Edge Functions.

---
**Referências**

[1] Repositório `artur-source/RegiFlex-teste`. URL: `https://github.com/artur-source/RegiFlex-teste`
[2] Arquivo `RegiFlex-teste/analysis.py`.
[3] Arquivo `RegiFlex-teste/supabase/functions/predict-no-show/index.ts`.
[4] Arquivo `RegiFlex-teste/frontend/src/components/IA.jsx`.
[5] Arquivo `RegiFlex-teste/frontend/src/components/Relatorios.jsx`.
[6] Arquivo `RegiFlex-teste/supabase/sql/relatorio_agregado.sql`.
[7] Arquivo `RegiFlex-teste/supabase/functions/export-relatorio/index.ts`.
[8] Arquivo `RegiFlex-teste/frontend/src/components/Dashboard.jsx`.
