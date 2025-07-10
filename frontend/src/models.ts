export type User = {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  is_admin: boolean;
}

export type CardSeries = {
  id: number;
  name: string;
  owner: number;
}

export type Card = {
  id: number;
  card_series: number;
  n_in_series: number;
  title: string;
  tags: Array<Tag>;
  owner: number;
  created_at: string;
  updated_at: string;
}

export type CardsPaginated = {
  count: number;
  next: number | null;
  previous: number | null;
  results: Array<Card>;
}

export type Tag = {
  id: number;
  name: string;
}

export type CardPartial = {
  id: number;
  card: number;
  is_prompt: boolean;
  content: any;
  prompt_initial_content: any;
  position: number;
}

export type CardScore = {
  id: number;
  card: number;
  owner: number;
  score: number;
  last_revised_at: string;
}