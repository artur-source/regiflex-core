// regiflex-core/index.js

// Exporta Contextos
export { AuthContext, AuthProvider, useAuth } from './frontend/src/contexts/AuthContext';

// Exporta Utilitários e Configurações
export { supabase } from './frontend/src/lib/supabaseClient';
export { cn } from './frontend/src/lib/utils';

// Exporta Componentes de UI (Exemplo: Button, Card, Input)
// Para evitar um arquivo muito grande, exportaremos apenas alguns essenciais e o restante será importado diretamente pelo módulo.
// O módulo de odontologia deve importar os componentes UI diretamente de 'regiflex-core/frontend/src/components/ui'
// Apenas os componentes de alto nível e contextos devem ser exportados aqui.

// Exemplo de exportação de um componente de UI (se necessário)
// export { Button } from './frontend/src/components/ui/button';

// Exporta Hooks (se houver)
// export { useMobile } from './frontend/src/hooks/use-mobile';

// Exporta Tipos (se houver)
// export * from './frontend/src/types';

// O restante dos componentes de UI (shadcn) e a lógica de negócio de alto nível (Login, Layout)
// serão importados pelo módulo conforme a necessidade, mas o core fornece a base.
// O módulo de odontologia deve ser o principal consumidor.
