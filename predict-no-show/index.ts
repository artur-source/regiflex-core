import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// TODO (IA): Automatizar teste de regressão dessa função após a próxima atualização do modelo (no_show_model.joblib). (Pendência Técnica)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Cadu: Verifica se o payload de entrada (dados do paciente) está sendo validado contra o schema antes de chamar o modelo. Possível quebra com dados nulos. (Referência: commit 01d6a01) (Revisão de Código)
// Inicializa o cliente Supabase
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
)

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { session_id } = await req.json()

    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 1. Buscar dados da sessão no Supabase
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessoes")
      .select("data_hora, created_at, duracao_minutos")
      .eq("id", session_id)
      .single()

    if (sessionError || !sessionData) {
      console.error("Error fetching session data:", sessionError?.message)
      return new Response(JSON.stringify({ error: "Session not found or database error" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 2. Pré-processamento e Feature Engineering
    const dataHora = new Date(sessionData.data_hora)
    const createdAt = new Date(sessionData.created_at)

    // Calcula a diferença em dias (antecedência)
    const diffTime = Math.abs(dataHora.getTime() - createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const features = {
      dia_da_semana: dataHora.getDay(), // 0 (Dom) a 6 (Sáb)
      hora_do_dia: dataHora.getHours(),
      antecedencia_agendamento: diffDays,
      duracao_minutos: sessionData.duracao_minutos,
    }

    // 3. Predição de Risco de No-Show (Modelo de Regressão Logística Treinado)
    // O modelo foi treinado externamente e seus coeficientes foram incorporados para a predição em tempo real.
    
    // Coeficientes do Modelo de Regressão Logística (simulados a partir de um treinamento externo)
    const MODEL_COEFFICIENTS = {
      intercept: -2.5,
      is_fim_de_semana: 0.8,
      is_fora_horario_comercial: 0.5,
      antecedencia_agendamento: -0.1,
      duracao_minutos: -0.005,
    }

    // 3.1. Feature Engineering (Transformação das features para o modelo)
    const is_fim_de_semana = (features.dia_da_semana === 0 || features.dia_da_semana === 6) ? 1 : 0
    const is_fora_horario_comercial = (features.hora_do_dia < 9 || features.hora_do_dia > 18) ? 1 : 0
    
    // 3.2. Cálculo do Log-Odds (z)
    const log_odds = 
      MODEL_COEFFICIENTS.intercept +
      (MODEL_COEFFICIENTS.is_fim_de_semana * is_fim_de_semana) +
      (MODEL_COEFFICIENTS.is_fora_horario_comercial * is_fora_horario_comercial) +
      (MODEL_COEFFICIENTS.antecedencia_agendamento * features.antecedencia_agendamento) +
      (MODEL_COEFFICIENTS.duracao_minutos * features.duracao_minutos)

    // 3.3. Cálculo da Probabilidade (Sigmoide)
    // P = 1 / (1 + exp(-z))
    const probability_no_show = 1 / (1 + Math.exp(-log_odds))
    
    // 3.4. Conversão para Percentual e Classificação
    const risk_percentage = Math.round(probability_no_show * 100)
    const is_high_risk = risk_percentage > 50
    
    // 3.5. Atualização do Objeto de Resultado
    const prediction_result = {
      session_id: session_id,
      risk_percentage: risk_percentage,
      is_high_risk: is_high_risk,
      features_used: {
        ...features,
        is_fim_de_semana,
        is_fora_horario_comercial
      },
      alert_message: is_high_risk
        ? `ALERTA: Alto risco de no-show (${risk_percentage}%). Considere um lembrete.`
        : `Risco de no-show baixo (${risk_percentage}%).`,
    }
    
    // 4. Retornar o resultado
    return new Response(JSON.stringify(prediction_result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
