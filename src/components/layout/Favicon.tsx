
import { Helmet } from 'react-helmet-async';

const Favicon = () => {
  // Mantém os mesmos arquivos locais declarados no HTML para navegadores e buscadores.
  return (
    <Helmet>
      <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    </Helmet>
  );
};

export default Favicon;
