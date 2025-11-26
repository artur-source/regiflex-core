/**
 * Script para importar dados de exemplo no Supabase - RegiFlex
 * 
 * INSTRUÇÕES DE USO:
 * 1. Instale as dependências: npm install @supabase/supabase-js
 * 2. Configure as variáveis SUPABASE_URL e SUPABASE_KEY abaixo
 * 3. Execute: node import_data_supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ====== CONFIGURAÇÃO ======
const SUPABASE_URL = 'https://upbsldljfejaieuveknr.supabase.co'; // Ex: https://xxxxx.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYnNsZGxqZmVqYWlldXZla25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDU5MzYsImV4cCI6MjA3NTQ4MTkzNn0.0Sw_uG6Vs-a69navV4CJ48qKAeX3qym9NLKIL7hIevk';   // Chave anon/service_role

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ====== DADOS DE EXEMPLO ======

// Lista de nomes para pacientes (50 nomes)
const nomesPacientes = [
  'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Souza', 'Paula Costa',
  'Roberto Lima', 'Juliana Ferreira', 'Fernando Alves', 'Camila Rodrigues', 'Bruno Martins',
  'Beatriz Pereira', 'Lucas Carvalho', 'Mariana Gomes', 'Rafael Ribeiro', 'Amanda Dias',
  'Pedro Araújo', 'Gabriela Fernandes', 'Thiago Barbosa', 'Larissa Cardoso', 'Gustavo Nascimento',
  'Letícia Monteiro', 'Matheus Correia', 'Isabela Castro', 'Vinícius Rocha', 'Carolina Pinto',
  'Leonardo Teixeira', 'Natália Mendes', 'Rodrigo Moreira', 'Fernanda Freitas', 'Daniel Soares',
  'Aline Cavalcanti', 'Marcelo Batista', 'Patrícia Nunes', 'André Campos', 'Bianca Azevedo',
  'Felipe Ramos', 'Jéssica Moura', 'Diego Machado', 'Renata Borges', 'Fábio Duarte',
  'Vanessa Reis', 'Leandro Pires', 'Priscila Lopes', 'Ricardo Farias', 'Tatiana Melo',
  'Alexandre Nogueira', 'Adriana Vieira', 'Maurício Barros', 'Cristina Amaral', 'Eduardo Cunha'
];

// Lista de nomes para psicólogos (5 psicólogos)
const nomesPsicologos = [
  { nome: 'Dra. Claudia Mendes', crp: 'CRP 01/12345', especialidade: 'Terapia Cognitivo-Comportamental' },
  { nome: 'Dr. Roberto Almeida', crp: 'CRP 01/23456', especialidade: 'Psicanálise' },
  { nome: 'Dra. Fernanda Costa', crp: 'CRP 01/34567', especialidade: 'Psicologia Clínica' },
  { nome: 'Dr. Marcos Silva', crp: 'CRP 01/45678', especialidade: 'Psicoterapia Breve' },
  { nome: 'Dra. Patricia Rocha', crp: 'CRP 01/56789', especialidade: 'Psicologia Infantil' }
];

// ====== FUNÇÕES AUXILIARES ======

function gerarCPF() {
  const n = Math.floor(Math.random() * 100000000000);
  return n.toString().padStart(11, '0');
}

function gerarTelefone() {
  const ddd = Math.floor(Math.random() * 90) + 11;
  const num = Math.floor(Math.random() * 900000000) + 100000000;
  return `(${ddd}) ${num.toString().slice(0, 5)}-${num.toString().slice(5)}`;
}

function gerarEmail(nome) {
  const normalizado = nome.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.');
  return `${normalizado}@email.com`;
}

// ====== IMPORTAÇÃO DE DADOS ======

async function limparDados() {
  console.log('\n🗑️  Limpando dados existentes...');
  
  try {
    // Deletar na ordem correta (por causa das foreign keys)
    await supabase.from("sessoes").delete().neq("id", 0);
    await supabase.from("pacientes").delete().neq("id", 0);
    await supabase.from("usuarios").delete().neq("id", 0); // Alterado de 'users' para 'usuarios'
    
    console.log('✅ Dados limpos com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error.message);
  }
}

async function criarPsicologos() {
  console.log('\n👨‍⚕️  Criando psicólogos...');
  
  const psicologos = nomesPsicologos.map((psi, index) => ({
    nome_completo: psi.nome,
    email: gerarEmail(psi.nome),
    role: 'psicologo',
    username: gerarEmail(psi.nome).split('@')[0],
    password_hash: 'dummy_password_hash' // Adicionando um hash de senha padrão
  }));
  
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert(psicologos)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ ${data.length} psicólogos criados com sucesso!`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar psicólogos:', error.message);
    return [];
  }
}

async function criarPacientes() {
  console.log('\n👥 Criando pacientes...');
  
  const pacientes = nomesPacientes.map(nome => ({
    nome_completo: nome,
    cpf: gerarCPF(),
    data_nascimento: new Date(
      1970 + Math.floor(Math.random() * 40),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    ).toISOString().split('T')[0],
    telefone: gerarTelefone(),
    email: gerarEmail(nome),
    endereco: `Rua ${Math.floor(Math.random() * 1000)}, ${Math.floor(Math.random() * 500)}`,
    qr_code_data: `dummy_qr_code_${Math.random().toString(36).substring(7)}`, // Adicionando um valor padrão
    // observacoes: null - Removido pois não existe na tabela pacientes
  }));
  
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .insert(pacientes)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ ${data.length} pacientes criados com sucesso!`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar pacientes:', error.message);
    return [];
  }
}

async function importarSessoes(pacientes, psicologos) {
  console.log('\n📅 Importando sessões...');
  
  // Carregar dados do JSON gerado
  let sessoesData;
  try {
    const jsonData = fs.readFileSync('sessoes_regiflex.json', 'utf8');
    sessoesData = JSON.parse(jsonData);
  } catch (error) {
    console.error('❌ Erro ao ler arquivo sessoes_regiflex.json:', error.message);
    console.log('💡 Certifique-se de ter executado o script Python primeiro!');
    return;
  }
  
  // Mapear IDs antigos para novos
  const idsReferencia = JSON.parse(fs.readFileSync('ids_referencia.json', 'utf8'));
  
  const mapaPacientes = {};
  idsReferencia.pacientes.forEach((p, index) => {
    if (index < pacientes.length) {
      mapaPacientes[p.id] = pacientes[index].id;
    }
  });
  
  const mapaPsicologos = {};
  idsReferencia.psicologos.forEach((id, index) => {
    if (index < psicologos.length) {
      mapaPsicologos[id] = psicologos[index].id;
    }
  });
  
  // Atualizar IDs nas sessões
  const sessoesAtualizadas = sessoesData
    .filter(s => mapaPacientes[s.paciente_id] && mapaPsicologos[s.psicologo_id])
    .map(s => ({
      paciente_id: mapaPacientes[s.paciente_id],
      psicologo_id: mapaPsicologos[s.psicologo_id],
      data_hora: s.data_hora,
      duracao_minutos: s.duracao, // Alterado de 'duracao' para 'duracao_minutos'
      tipo_sessao: s.tipo, // Alterado de 'tipo' para 'tipo_sessao'
      // modalidade: s.modalidade, // Removido pois não existe na tabela sessoes
      status: s.status,
      // valor: s.valor, // Removido pois não existe na tabela sessoes
      observacoes: s.observacoes
    }));
  
  // Importar em lotes de 100
  const BATCH_SIZE = 100;
  let totalImportadas = 0;
  
  for (let i = 0; i < sessoesAtualizadas.length; i += BATCH_SIZE) {
    const batch = sessoesAtualizadas.slice(i, i + BATCH_SIZE);
    
    try {
      const { data, error } = await supabase
        .from('sessoes')
        .insert(batch)
        .select();
      
      if (error) throw error;
      
      totalImportadas += data.length;
      console.log(`   Importadas ${totalImportadas}/${sessoesAtualizadas.length} sessões...`);
    } catch (error) {
      console.error(`❌ Erro ao importar lote ${i / BATCH_SIZE + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Total de ${totalImportadas} sessões importadas com sucesso!`);
}

async function verificarDados() {
  console.log('\n📊 Verificando dados importados...');
  
  try {
    const { count: countPsicologos } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    
    const { count: countPacientes } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true });
    
    const { count: countSessoes } = await supabase
      .from('sessoes')
      .select('*', { count: 'exact', head: true });
    
    const { data: statusDist } = await supabase
      .from('sessoes')
      .select('status');
    
    const statusCount = statusDist.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 RESUMO DA IMPORTAÇÃO:');
    console.log('─────────────────────────────────');
    console.log(`Psicólogos: ${countPsicologos}`);
    console.log(`Pacientes: ${countPacientes}`);
    console.log(`Sessões: ${countSessoes}`);
    console.log('\nDistribuição por Status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      const percent = ((count / countSessoes) * 100).toFixed(1);
      console.log(`  ${status}: ${count} (${percent}%)`);
    });
    console.log('─────────────────────────────────');
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  }
}

// ====== EXECUÇÃO PRINCIPAL ======

async function main() {
  console.log('🚀 INICIANDO IMPORTAÇÃO DE DADOS - RegiFlex');
  console.log('════════════════════════════════════════════');
  
  // Perguntar se deseja limpar dados existentes
  console.log('\n⚠️  ATENÇÃO: Este script irá limpar todos os dados existentes!');
  console.log('   Pressione Ctrl+C para cancelar ou Enter para continuar...');
  
  // Aguarda o usuário pressionar Enter
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      process.stdin.pause(); // Pausa a leitura para evitar múltiplos inputs
      resolve();
    });
  });
  
  try {
    // 1. Limpar dados existentes
    await limparDados();
    
    // 2. Criar psicólogos
    const psicologos = await criarPsicologos();
    if (psicologos.length === 0) {
      console.error('\n❌ Falha ao criar psicólogos. Abortando...');
      return;
    }
    
    // 3. Criar pacientes
    const pacientes = await criarPacientes();
    if (pacientes.length === 0) {
      console.error('\n❌ Falha ao criar pacientes. Abortando...');
      return;
    }
    
    // 4. Importar sessões
    await importarSessoes(pacientes, psicologos);
    
    // 5. Verificar resultado
    await verificarDados();
    
    console.log('\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('════════════════════════════════════════════');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse o dashboard do RegiFlex');
    console.log('   2. Verifique se os dados aparecem corretamente');
    console.log('   3. Inicie o treinamento do modelo de IA');
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A IMPORTAÇÃO:', error);
  }
  
  process.exit(0);
}

// Executar
main();
