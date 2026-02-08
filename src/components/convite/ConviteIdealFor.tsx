interface ConviteIdealForProps {
  content: {
    title: string;
    profiles: Array<{
      emoji: string;
      text: string;
    }>;
  };
}

export const ConviteIdealFor = ({ content }: ConviteIdealForProps) => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground mb-12">
            👩‍💼 {content.title}
          </h2>

          {/* Profiles Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {content.profiles.map((profile, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">{profile.emoji}</span>
                <p className="text-foreground">{profile.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
