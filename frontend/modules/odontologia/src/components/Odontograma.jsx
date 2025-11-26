import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const Odontograma = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [teeth, setTeeth] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Carregar pacientes ao montar o componente
  useEffect(() => {
    loadPatients();
  }, [user]);

  // Carregar odontograma quando um paciente é selecionado
  useEffect(() => {
    if (selectedPatient) {
      loadOdontograma(selectedPatient);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const loadOdontograma = async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('odontograma')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      // Converter dados em um mapa de dentes
      const teethMap = {};
      data?.forEach((record) => {
        if (!teethMap[record.dente_numero]) {
          teethMap[record.dente_numero] = [];
        }
        teethMap[record.dente_numero].push(record.condicao);
      });

      setTeeth(teethMap);
    } catch (error) {
      console.error('Erro ao carregar odontograma:', error);
    }
  };

  const handleToothClick = (toothNumber) => {
    // Abre um modal ou menu para selecionar a condição do dente
    const conditions = ['saudavel', 'carie', 'obturacao', 'extraido', 'implante'];
    const currentCondition = teeth[toothNumber]?.[0] || 'saudavel';
    const nextCondition = conditions[(conditions.indexOf(currentCondition) + 1) % conditions.length];

    setTeeth({
      ...teeth,
      [toothNumber]: [nextCondition],
    });
  };

  const saveOdontograma = async () => {
    if (!selectedPatient) {
      setSaveMessage('Selecione um paciente primeiro.');
      return;
    }

    setLoading(true);
    try {
      // Deletar registros antigos
      await supabase
        .from('odontograma')
        .delete()
        .eq('patient_id', selectedPatient);

      // Inserir novos registros
      const records = [];
      Object.entries(teeth).forEach(([toothNumber, conditions]) => {
        conditions.forEach((condition) => {
          records.push({
            patient_id: selectedPatient,
            dente_numero: parseInt(toothNumber),
            condicao: condition,
          });
        });
      });

      if (records.length > 0) {
        const { error } = await supabase
          .from('odontograma')
          .insert(records);

        if (error) throw error;
      }

      setSaveMessage('Odontograma salvo com sucesso!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar odontograma:', error);
      setSaveMessage('Erro ao salvar odontograma.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar os dentes (simplificado)
  const renderTeeth = () => {
    const teethNumbers = Array.from({ length: 32 }, (_, i) => i + 1);
    const conditionColors = {
      saudavel: 'bg-green-200',
      carie: 'bg-red-200',
      obturacao: 'bg-blue-200',
      extraido: 'bg-gray-200',
      implante: 'bg-yellow-200',
    };

    return (
      <div className="grid grid-cols-8 gap-2">
        {teethNumbers.map((toothNumber) => {
          const condition = teeth[toothNumber]?.[0] || 'saudavel';
          return (
            <button
              key={toothNumber}
              onClick={() => handleToothClick(toothNumber)}
              className={`p-3 rounded border-2 border-gray-300 font-bold text-sm ${conditionColors[condition]}`}
              title={`Dente ${toothNumber}: ${condition}`}
            >
              {toothNumber}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Odontograma</CardTitle>
          <CardDescription>Registre as condições dos dentes do paciente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletor de Paciente */}
          <div>
            <label className="block text-sm font-medium mb-2">Selecione o Paciente</label>
            <Select value={selectedPatient || ''} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um paciente..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Odontograma */}
          {selectedPatient && (
            <div>
              <label className="block text-sm font-medium mb-4">Clique nos dentes para alterar sua condição</label>
              {renderTeeth()}
              <div className="mt-4 text-xs space-y-1">
                <p><span className="inline-block w-4 h-4 bg-green-200 mr-2"></span>Saudável</p>
                <p><span className="inline-block w-4 h-4 bg-red-200 mr-2"></span>Cárie</p>
                <p><span className="inline-block w-4 h-4 bg-blue-200 mr-2"></span>Obturação</p>
                <p><span className="inline-block w-4 h-4 bg-gray-200 mr-2"></span>Extraído</p>
                <p><span className="inline-block w-4 h-4 bg-yellow-200 mr-2"></span>Implante</p>
              </div>
            </div>
          )}

          {/* Botão de Salvar */}
          <Button onClick={saveOdontograma} disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Odontograma'}
          </Button>

          {/* Mensagem de Status */}
          {saveMessage && (
            <div className={`p-3 rounded text-sm ${saveMessage.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {saveMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Odontograma;
