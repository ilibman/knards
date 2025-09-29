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
  card_series: number | null;
  n_in_series: number;
  title: string;
  tags: Array<number>;
  owner: number;
  created_at: string;
  updated_at: string;
}

export type CardForRevision = {
  id: number;
  title: string;
  series_id: number;
  series_name: string;
  n_in_series: number;
  tags_ids: Array<number>;
  tags_names: Array<string>;
  created_at: string;
  owner_id: number;
  owner_name: string;
  revised: boolean;
  score_id: number;
  score: number;
  weight: number;
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
  id?: number;
  card: number;
  is_prompt?: boolean;
  content: any;
  prompt_initial_content: any;
  position?: number;
}

export type CardScore = {
  id: number;
  card: number;
  owner: number;
  score: number;
  last_revised_at: string;
}