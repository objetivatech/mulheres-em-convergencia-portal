import { WhatsAppIcon } from '@/lib/socialIconMap';

const WhatsAppButton = () => {
  const whatsappNumber = '5551992366002';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 animate-pulse hover:animate-none group"
      aria-label="Chamar no WhatsApp"
    >
      <WhatsAppIcon size={28} />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-2 bg-card text-card-foreground text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-border">
        Fale conosco no WhatsApp
      </span>
    </a>
  );
};

export default WhatsAppButton;
