import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import uuid

# Configurações
np.random.seed(42)
START_DATE = datetime(2024, 4, 1)
END_DATE = datetime(2024, 10, 21)
NUM_PACIENTES = 50
NUM_PSICOLOGOS = 5

# Gerar IDs (UUID simulados)
pacientes_ids = [str(uuid.uuid4()) for _ in range(NUM_PACIENTES)]
psicologos_ids = [str(uuid.uuid4()) for _ in range(NUM_PSICOLOGOS)]

# Perfis de pacientes (para criar padrões realistas)
perfis_pacientes = {
    'pontual': 0.3,      # 30% são muito pontuais
    'regular': 0.45,      # 45% são regulares
    'irregular': 0.15,    # 15% faltam às vezes
    'problematico': 0.10  # 10% faltam muito
}

def atribuir_perfil():
    rand = np.random.random()
    if rand < 0.30:
        return 'pontual'
    elif rand < 0.75:
        return 'regular'
    elif rand < 0.90:
        return 'irregular'
    else:
        return 'problematico'

pacientes_perfis = {pid: atribuir_perfil() for pid in pacientes_ids}

# Probabilidades de no-show por perfil
prob_noshow = {
    'pontual': 0.02,
    'regular': 0.12,
    'irregular': 0.35,
    'problematico': 0.65
}

# Probabilidades de cancelamento por perfil
prob_cancelamento = {
    'pontual': 0.05,
    'regular': 0.15,
    'irregular': 0.25,
    'problematico': 0.20
}

# Função para gerar horários de trabalho (8h às 18h)
def gerar_horario_sessao(data_base):
    # Horários possíveis: 8h, 9h, 10h, 11h, 13h, 14h, 15h, 16h, 17h
    horas_possiveis = [8, 9, 10, 11, 13, 14, 15, 16, 17]
    hora = np.random.choice(horas_possiveis)
    minuto = np.random.choice([0, 30])  # Sessões a cada 30 minutos
    return data_base.replace(hour=hora, minute=minuto, second=0, microsecond=0)

# Gerar sessões
sessoes = []
sessao_id = 1

for paciente_id in pacientes_ids:
    perfil = pacientes_perfis[paciente_id]
    psicologo_id = np.random.choice(psicologos_ids)
    
    # Número de sessões por paciente (varia entre 8 e 30)
    if perfil == 'pontual':
        num_sessoes = np.random.randint(20, 31)
    elif perfil == 'regular':
        num_sessoes = np.random.randint(15, 25)
    elif perfil == 'irregular':
        num_sessoes = np.random.randint(10, 18)
    else:  # problematico
        num_sessoes = np.random.randint(8, 15)
    
    # Data da primeira sessão (distribuída ao longo do período)
    dias_desde_inicio = np.random.randint(0, 90)
    data_primeira = START_DATE + timedelta(days=dias_desde_inicio)
    
    # Frequência semanal (1x ou 2x por semana)
    frequencia = np.random.choice([7, 3.5], p=[0.6, 0.4])  # dias entre sessões
    
    data_atual = data_primeira
    faltas_consecutivas = 0
    
    for i in range(num_sessoes):
        if data_atual > END_DATE:
            break
        
        # Pular finais de semana
        while data_atual.weekday() >= 5:
            data_atual += timedelta(days=1)
        
        data_hora = gerar_horario_sessao(data_atual)
        
        # Determinar status da sessão
        # Aumentar probabilidade de no-show após faltas consecutivas
        prob_noshow_ajustada = min(prob_noshow[perfil] * (1 + faltas_consecutivas * 0.3), 0.8)
        prob_cancelamento_ajustada = prob_cancelamento[perfil]
        
        # Fatores que aumentam no-show
        # 1. Segunda-feira de manhã (+20%)
        if data_hora.weekday() == 0 and data_hora.hour <= 9:
            prob_noshow_ajustada *= 1.2
        
        # 2. Sexta à tarde (+15%)
        if data_hora.weekday() == 4 and data_hora.hour >= 16:
            prob_noshow_ajustada *= 1.15
        
        # 3. Primeira ou última hora do dia (+10%)
        if data_hora.hour in [8, 17]:
            prob_noshow_ajustada *= 1.1
        
        # 4. Inverno (junho-agosto no Brasil) - menos faltas
        if data_hora.month in [6, 7, 8]:
            prob_noshow_ajustada *= 0.8
        
        # Determinar status
        rand = np.random.random()
        
        if data_hora > datetime.now():
            status = 'agendada'
            faltas_consecutivas = 0
        elif rand < prob_cancelamento_ajustada:
            status = 'cancelada'
            faltas_consecutivas = 0
        elif rand < prob_cancelamento_ajustada + prob_noshow_ajustada:
            status = 'faltou'
            faltas_consecutivas += 1
        else:
            status = 'realizada'
            faltas_consecutivas = 0
        
        # Tipo de sessão
        if i == 0:
            tipo = 'avaliacao'
        elif i % 10 == 0 and i > 0:
            tipo = 'reavaliacao'
        else:
            tipo = np.random.choice(['individual', 'grupo'], p=[0.9, 0.1])
        
        # Modalidade (presencial vs online)
        # Online tem menos no-shows
        if perfil == 'problematico':
            modalidade = np.random.choice(['presencial', 'online'], p=[0.6, 0.4])
        else:
            modalidade = np.random.choice(['presencial', 'online'], p=[0.75, 0.25])
        
        if modalidade == 'online' and status == 'faltou':
            # Online tem 40% menos faltas
            if np.random.random() < 0.4:
                status = 'realizada'
                faltas_consecutivas = 0
        
        # Valor da sessão
        if tipo == 'avaliacao':
            valor = np.random.choice([180, 200, 220])
        elif tipo == 'grupo':
            valor = np.random.choice([80, 100, 120])
        else:
            valor = np.random.choice([150, 180, 200])
        
        # Observações (apenas para alguns casos)
        observacoes = None
        if status == 'cancelada':
            motivos = [
                'Paciente cancelou com 24h de antecedência',
                'Cancelamento por motivo de saúde',
                'Conflito de agenda - trabalho',
                'Paciente reagendou',
                'Emergência familiar'
            ]
            observacoes = np.random.choice(motivos)
        elif status == 'faltou':
            motivos = [
                'Paciente não compareceu',
                'Não atendeu confirmação',
                'Esqueceu da sessão',
                None
            ]
            observacoes = np.random.choice(motivos, p=[0.3, 0.3, 0.2, 0.2])
        
        # Criar registro
        sessao = {
            'id': str(uuid.uuid4()),
            'paciente_id': paciente_id,
            'psicologo_id': psicologo_id,
            'data_hora': data_hora.isoformat(),
            'duracao': 50 if tipo != 'avaliacao' else 90,
            'tipo': tipo,
            'modalidade': modalidade,
            'status': status,
            'valor': valor,
            'observacoes': observacoes,
            'created_at': data_hora.isoformat(),
            'updated_at': data_hora.isoformat()
        }
        
        sessoes.append(sessao)
        
        # Próxima sessão
        dias_ate_proxima = int(frequencia + np.random.randint(-1, 2))
        data_atual += timedelta(days=dias_ate_proxima)

# Criar DataFrame
df_sessoes = pd.DataFrame(sessoes)

# Estatísticas
print("=" * 60)
print("ESTATÍSTICAS DOS DADOS GERADOS")
print("=" * 60)
print(f"\nTotal de sessões: {len(df_sessoes)}")
print(f"Período: {df_sessoes['data_hora'].min()} a {df_sessoes['data_hora'].max()}")
print(f"\nPacientes únicos: {df_sessoes['paciente_id'].nunique()}")
print(f"Psicólogos únicos: {df_sessoes['psicologo_id'].nunique()}")

print("\n--- Distribuição por Status ---")
print(df_sessoes['status'].value_counts())
print("\nPercentuais:")
print(df_sessoes['status'].value_counts(normalize=True) * 100)

print("\n--- Distribuição por Tipo ---")
print(df_sessoes['tipo'].value_counts())

print("\n--- Distribuição por Modalidade ---")
print(df_sessoes['modalidade'].value_counts())

print("\n--- No-shows por Dia da Semana ---")
df_sessoes['dia_semana'] = pd.to_datetime(df_sessoes['data_hora']).dt.day_name()
noshow_df = df_sessoes[df_sessoes['status'] == 'faltou']
print(noshow_df['dia_semana'].value_counts())

print("\n--- Estatísticas de Valores ---")
print(df_sessoes['valor'].describe())

print("\n--- Taxa de No-show por Modalidade ---")
for modalidade in df_sessoes['modalidade'].unique():
    df_mod = df_sessoes[df_sessoes['modalidade'] == modalidade]
    total = len(df_mod)
    noshows = len(df_mod[df_mod['status'] == 'faltou'])
    taxa = (noshows / total * 100) if total > 0 else 0
    print(f"{modalidade}: {taxa:.2f}%")

# Salvar em diferentes formatos
print("\n" + "=" * 60)
print("SALVANDO ARQUIVOS...")
print("=" * 60)

# 1. CSV
csv_filename = 'sessoes_regiflex.csv'
df_sessoes.to_csv(csv_filename, index=False, encoding='utf-8')
print(f"✓ CSV salvo: {csv_filename}")

# 2. JSON (formato para importação direta)
json_filename = 'sessoes_regiflex.json'
df_sessoes.to_json(json_filename, orient='records', date_format='iso', indent=2)
print(f"✓ JSON salvo: {json_filename}")

# 3. SQL Insert Statements
sql_filename = 'sessoes_regiflex.sql'
with open(sql_filename, 'w', encoding='utf-8') as f:
    f.write("-- Inserir sessões de exemplo no RegiFlex\n")
    f.write("-- Gerado automaticamente\n\n")
    
    for _, row in df_sessoes.iterrows():
        obs = f"'{row['observacoes']}'" if row['observacoes'] else 'NULL'
        sql = f"""INSERT INTO sessoes (id, paciente_id, psicologo_id, data_hora, duracao, tipo, modalidade, status, valor, observacoes, created_at, updated_at)
VALUES ('{row['id']}', '{row['paciente_id']}', '{row['psicologo_id']}', '{row['data_hora']}', {row['duracao']}, '{row['tipo']}', '{row['modalidade']}', '{row['status']}', {row['valor']}, {obs}, '{row['created_at']}','{row['updated_at']}');\n\n"""
        f.write(sql)

print(f"✓ SQL salvo: {sql_filename}")

# 4. Criar arquivo com IDs de pacientes e psicólogos
ids_filename = 'ids_referencia.json'
ids_data = {
    'pacientes': [
        {'id': pid, 'perfil': pacientes_perfis[pid]} 
        for pid in pacientes_ids
    ],
    'psicologos': psicologos_ids,
    'info': {
        'total_pacientes': len(pacientes_ids),
        'total_psicologos': len(psicologos_ids),
        'perfis_distribuicao': {
            perfil: sum(1 for p in pacientes_perfis.values() if p == perfil)
            for perfil in perfis_pacientes.keys()
        }
    }
}

with open(ids_filename, 'w', encoding='utf-8') as f:
    json.dump(ids_data, f, indent=2, ensure_ascii=False)

print(f"✓ IDs de referência salvos: {ids_filename}")

print("\n" + "=" * 60)
print("CONCLUÍDO!")
print("=" * 60)
print("\nArquivos gerados:")
print(f"  1. {csv_filename} - Para análise em Excel/Sheets")
print(f"  2. {json_filename} - Para importação via API")
print(f"  3. {sql_filename} - Para importação direta no Supabase")
print(f"  4. {ids_filename} - IDs para criar pacientes e psicólogos")
print("\nPróximos passos:")
print("  1. Criar registros de pacientes e psicólogos no Supabase")
print("  2. Importar as sessões usando um dos arquivos acima")
print("  3. Validar a integridade dos dados")
print("  4. Treinar o modelo de IA com esses dados")
