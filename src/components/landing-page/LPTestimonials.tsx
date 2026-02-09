import { useState } from 'react';
import { Quote, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VideoTestimonial {
  type: 'video';
  youtubeUrl: string;
  name?: string;
  role?: string;
}

export interface TextTestimonial {
  type: 'text';
  quote: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

export type Testimonial = VideoTestimonial | TextTestimonial;

export interface TestimonialsContent {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

interface LPTestimonialsProps {
  content: TestimonialsContent;
}

function extractYouTubeId(url: string): string | null {
  // Suporta: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // ID direto
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function VideoPlayer({ url, isShort = true }: { url: string; isShort?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    return (
      <div className="aspect-[9/16] bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Vídeo não encontrado</p>
      </div>
    );
  }
  
  if (!isPlaying) {
    return (
      <div 
        className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl relative overflow-hidden cursor-pointer group"
        onClick={() => setIsPlaying(true)}
      >
        <img 
          src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
          alt="Thumbnail do vídeo"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="aspect-[9/16] rounded-xl overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title="Depoimento em vídeo"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function TextCard({ testimonial }: { testimonial: TextTestimonial }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col">
      <Quote className="w-8 h-8 text-primary/40 mb-4" />
      <p className="text-foreground/90 italic flex-1 text-base leading-relaxed">
        "{testimonial.quote}"
      </p>
      <div className="mt-6 flex items-center gap-3">
        {testimonial.avatarUrl ? (
          <img 
            src={testimonial.avatarUrl} 
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-lg">
              {testimonial.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{testimonial.name}</p>
          {testimonial.role && (
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LPTestimonials({ content }: LPTestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const videoTestimonials = content.testimonials.filter(t => t.type === 'video') as VideoTestimonial[];
  const textTestimonials = content.testimonials.filter(t => t.type === 'text') as TextTestimonial[];
  
  const hasVideos = videoTestimonials.length > 0;
  const hasTexts = textTestimonials.length > 0;
  
  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videoTestimonials.length);
  };
  
  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videoTestimonials.length) % videoTestimonials.length);
  };
  
  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {content.title}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>
        
        {/* Vídeos em destaque - Carousel horizontal com vídeos verticais */}
        {hasVideos && (
          <div className="mb-16">
            <div className="flex items-center justify-center gap-4">
              {videoTestimonials.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevVideo}
                  className="rounded-full shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              
              <div className="flex gap-4 justify-center overflow-hidden max-w-full">
                {videoTestimonials.length === 1 ? (
                  <div className="w-64 md:w-72">
                    <VideoPlayer url={videoTestimonials[0].youtubeUrl} />
                    {videoTestimonials[0].name && (
                      <p className="text-center mt-3 font-medium text-foreground">
                        {videoTestimonials[0].name}
                        {videoTestimonials[0].role && (
                          <span className="text-muted-foreground font-normal"> - {videoTestimonials[0].role}</span>
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop: mostrar 3 vídeos */}
                    <div className="hidden md:flex gap-4">
                      {[...Array(Math.min(3, videoTestimonials.length))].map((_, offset) => {
                        const index = (currentIndex + offset) % videoTestimonials.length;
                        const video = videoTestimonials[index];
                        return (
                          <div 
                            key={index} 
                            className={cn(
                              "w-56 transition-all duration-300",
                              offset === 0 ? "scale-100 opacity-100" : "scale-95 opacity-70"
                            )}
                          >
                            <VideoPlayer url={video.youtubeUrl} />
                            {video.name && (
                              <p className="text-center mt-3 font-medium text-foreground text-sm">
                                {video.name}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Mobile: mostrar 1 vídeo */}
                    <div className="md:hidden w-64">
                      <VideoPlayer url={videoTestimonials[currentIndex].youtubeUrl} />
                      {videoTestimonials[currentIndex].name && (
                        <p className="text-center mt-3 font-medium text-foreground">
                          {videoTestimonials[currentIndex].name}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {videoTestimonials.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextVideo}
                  className="rounded-full shrink-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </div>
            
            {/* Dots indicator */}
            {videoTestimonials.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {videoTestimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex 
                        ? "bg-primary w-6" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Depoimentos em texto - Grid */}
        {hasTexts && (
          <div className={cn(
            "grid gap-6",
            textTestimonials.length === 1 
              ? "max-w-xl mx-auto" 
              : textTestimonials.length === 2 
                ? "md:grid-cols-2 max-w-3xl mx-auto"
                : "md:grid-cols-2 lg:grid-cols-3"
          )}>
            {textTestimonials.map((testimonial, index) => (
              <TextCard key={index} testimonial={testimonial} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
