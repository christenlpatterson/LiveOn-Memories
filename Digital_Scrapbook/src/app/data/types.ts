export interface Annotation {
  id: string;
  x: number; // percentage
  y: number; // percentage
  text: string;
  author: string;
  date: string;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  annotations: Annotation[];
}

export interface Comment {
  id: string;
  author: string;
  date: string;
  text: string;
}

export interface AudioClip {
  id: string;
  url: string;
  date: string;
  label?: string;
}

export interface Milestone {
  id: string;
  year: number;
  title: string;
  date: string;
  description: string;
  story: string;
  photos?: Photo[];
  videoUrl?: string;
  comments: Comment[];
  audioClips?: AudioClip[];
}
