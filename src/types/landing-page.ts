/**
 * Tipos para Landing Pages de Produtos
 * Estrutura reutilizável para duplicação em novos produtos
 */

export interface ProductConfig {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  paymentDescription: string;
  eventDates?: string;
  eventDuration?: string;
  eventFormat?: 'online' | 'presencial' | 'hibrido';
  eventLocation?: string;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary?: string;
}

export interface PainPoint {
  text: string;
  icon?: string;
}

export interface PainPointsContent {
  title: string;
  painPoints: PainPoint[];
  closingText: string;
  closingHighlight: string;
}

export interface MethodContent {
  title: string;
  description: string;
  benefits: string[];
  closingText: string;
}

export interface Pillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon?: string;
}

export interface PillarsContent {
  title: string;
  pillars: Pillar[];
}

export interface IncludedItem {
  text: string;
  isBonus?: boolean;
  highlight?: boolean;
}

export interface IncludedContent {
  title: string;
  items: IncludedItem[];
}

export interface TargetAudienceContent {
  title: string;
  profiles: string[];
  ctaPrimary?: string;
}

export interface Transformation {
  text: string;
}

export interface TransformationContent {
  title: string;
  transformations: Transformation[];
  ctaPrimary?: string;
}

export interface EventDetailsContent {
  title: string;
  dates: string;
  duration: string;
  format: string;
  location?: string;
}

export interface InvestmentContent {
  title: string;
  price: string;
  priceValue: number;
  description: string;
  ctaText: string;
}

// Tipos para Depoimentos
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

export interface LandingPageContent {
  product: ProductConfig;
  hero: HeroContent;
  painPoints: PainPointsContent;
  method: MethodContent;
  pillars: PillarsContent;
  included: IncludedContent;
  targetAudience: TargetAudienceContent;
  transformation: TransformationContent;
  eventDetails: EventDetailsContent;
  investment: InvestmentContent;
  testimonials?: TestimonialsContent;
}
