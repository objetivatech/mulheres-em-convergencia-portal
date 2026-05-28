// Page Builder foi removido. Este arquivo existe apenas para evitar erros de import residuais.
// A rota /pagina/:slug redireciona para / no App.tsx.
import { Navigate } from 'react-router-dom';
export default function PublicPage() {
  return <Navigate to="/" replace />;
}
