
import { Helmet } from 'react-helmet-async';
import logoCircular from '@/assets/logo-circular.png';

const Favicon = () => {
  // Usa o logo circular como favicon (png 32x32). O Vite servirá o asset corretamente.
  return (
    <Helmet>
      <link rel="icon" type="image/png" href={logoCircular} />
      <link rel="apple-touch-icon" href={logoCircular} />
    </Helmet>
  );
};

export default Favicon;
