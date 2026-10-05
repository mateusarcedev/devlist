import type { Suggestion, SuggestionStatus } from 'src/generated/prisma/client';

export class SuggestionEntity implements Suggestion {
  id: string;
  name: string;
  link: string;
  description: string;
  categoryId: string;
  toolId: string;
  status: SuggestionStatus;
  date: Date;

  constructor(partial: Partial<SuggestionEntity>) {
    Object.assign(this, partial);
  }
  userId: number;
}
