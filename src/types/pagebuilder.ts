// Content Block Types
export type ContentBlock = TextBlock | ImageBlock | QuoteBlock | ListBlock | VideoBlock;

export interface BaseBlock {
  id: string;
  type: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  format?: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bold' | 'italic';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  author?: string;
  source?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  style: 'ordered' | 'unordered';
  items: string[];
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  src: string;
  provider: 'youtube' | 'vimeo' | 'other';
  caption?: string;
}

// Page Builder Data Interfaces
export interface Cta {
  title: string;
  description: string;
  primaryButton: string;
}

export interface FaqItem {
  question: string;
  answer: ContentBlock[];
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface Hero {
  image: string;
  stats: HeroStat[];
  title: string;
  description: ContentBlock[];
}

export interface CardItem {
  icon: string;
  color: string;
  items: string[];
  title: string;
  description: string;
}

export interface Feature {
  title: string;
  description: ContentBlock[];
  reverse?: boolean;
}

export interface PageBuilderData {
  cta: Cta;
  faq: FaqItem[];
  hero: Hero;
  cards: CardItem[];
  features: Feature[];
  subtitle: string;
  'trainer-module': boolean;
}
