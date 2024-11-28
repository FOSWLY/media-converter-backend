import { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

import { ConvertStatus, MediaDirection } from "@/types/convert";

export interface ConvertTable {
  id: Generated<number>;
  direction: MediaDirection;
  status: ConvertStatus;
  file_hash: string;
  message: string | null;
  download_url: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Convert = Selectable<ConvertTable>;
export type NewConvert = Insertable<ConvertTable>;
export type ConvertUpdate = Updateable<ConvertTable>;

export type GetConvertOpts = Pick<Convert, "direction" | "file_hash">;
