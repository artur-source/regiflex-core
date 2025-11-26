import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from supabase import create_client
import os
import joblib
import json

# Configuração do Supabase
# Nota: Em um ambiente de produção, a chave deve ser lida de forma segura (e.g., variáveis de ambiente)
url: str = "https://upbsldljfejaieuveknr.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYnNsZGxqZmVqYWlldXZla25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDU5MzYsImV4cCI6MjA3NTQ4MTkzNn0.0Sw_uG6Vs-a69navV4CJ48qKAeX3qym9NLKIL7hIevk"
supabase = create_client(url, key)

# Módulo de IA
MODULE_NAME = "psicologia"

# Buscar dados das sessões
def fetch_sessoes():
    # Em um ambiente real, RLS garantiria que apenas os dados do tenant fossem retornados
    response = supabase.table("sessoes").select("*").execute()
    return response.data

# Pré-processamento e feature engineering
def preprocess_data(df):
    df["data_hora"] = pd.to_datetime(df["data_hora"])
    df["dia_da_semana"] = df["data_hora"].dt.dayofweek
    df["hora_do_dia"] = df["data_hora"].dt.hour
    df["antecedencia_agendamento"] = (df["data_hora"] - pd.to_datetime(df["created_at"])).dt.days

    # Target: 1 para 'faltou' ou 'cancelada', 0 para 'realizada'
    df["no_show"] = df["status"].apply(lambda x: 1 if x == "faltou" or x == "cancelada" else 0)

    # Selecionar features e target
    features = ["dia_da_semana", "hora_do_dia", "antecedencia_agendamento", "duracao_minutos"]
    target = "no_show"

    df = df.dropna(subset=features + [target])

    return df, features, target

# Treinar e salvar modelo
def train_and_save_model(df, features, target, model_path="no_show_model.joblib"):
    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LogisticRegression()
    model.fit(X_train, y_train)

    # Avaliar modelo
    y_pred = model.predict(X_test)
    print(f"Acurácia: {accuracy_score(y_test, y_pred)}")
    print(f"Matriz de Confusão:\n{confusion_matrix(y_test, y_pred)}")

    # 1. Salvar o modelo binário (para backup ou uso em outro ambiente Python)
    joblib.dump(model, model_path)
    print(f"Modelo binário salvo em {model_path}")

    # 2. Extrair e salvar os coeficientes no Supabase (Refatoração Crítica)
    feature_weights = {}
    for i, feature in enumerate(features):
        feature_weights[feature] = model.coef_[0][i]
    
    intercept = model.intercept_[0]

    data_to_save = {
        "module_name": MODULE_NAME,
        "feature_weights": feature_weights,
        "intercept": intercept,
        "updated_at": pd.Timestamp.now().isoformat()
    }

    # Upsert (Insere ou Atualiza) os parâmetros na tabela model_parameters
    try:
        response = supabase.table("model_parameters").upsert([data_to_save], on_conflict="module_name").execute()
        if response.data:
            print(f"Coeficientes do modelo salvos/atualizados no Supabase para o módulo '{MODULE_NAME}'.")
            print(f"Pesos: {json.dumps(feature_weights, indent=2)}")
            print(f"Intercepto: {intercept}")
        else:
            print("Erro ao salvar coeficientes no Supabase.")
    except Exception as e:
        print(f"Exceção ao salvar coeficientes no Supabase: {e}")

    return model

# Carregar modelo e fazer predição (Função mantida, mas não será usada pela Edge Function)
def predict_no_show(data_point, model_path="no_show_model.joblib", features=None):
    if features is None:
        features = ["dia_da_semana", "hora_do_dia", "antecedencia_agendamento", "duracao_minutos"]

    model = joblib.load(model_path)
    df_predict = pd.DataFrame([data_point], columns=features)
    prediction = model.predict(df_predict)
    return prediction[0]

if __name__ == "__main__":
    sessoes_data = fetch_sessoes()
    if sessoes_data:
        df = pd.DataFrame(sessoes_data)
        df_processed, features, target = preprocess_data(df)
        if not df_processed.empty:
            # O modelo binário ainda é salvo, mas o foco é salvar os coeficientes no DB
            trained_model = train_and_save_model(df_processed, features, target, "RegiFlex-teste/no_show_model.joblib")
            
            # Exemplo de predição (mantido para testes locais)
            # new_session_data = {
            #     "dia_da_semana": 2,  # Quarta-feira
            #     "hora_do_dia": 10,   # 10h da manhã
            #     "antecedencia_agendamento": 7, # Agendado com 7 dias de antecedência
            #     "duracao_minutos": 60
            # }
            # prediction = predict_no_show(new_session_data, "RegiFlex-teste/no_show_model.joblib", features)
            # print(f"Predição para a nova sessão (1=no-show, 0=compareceu): {prediction}")
        else:
            print("Não há dados suficientes para treinar o modelo após o pré-processamento.")
    else:
        print("Não foi possível buscar os dados das sessões.")
