/**
 * Файловое JSON-хранилище лидов.
 *
 * Реализует:
 *  - конкурентно-безопасную запись (in-memory async-mutex + атомарный rename);
 *  - защиту от дублей: повторная заявка с того же номера в течение
 *    {@link DEDUP_WINDOW_MS} не создаёт новую запись.
 *
 * Телефон в записи всегда хранится в нормализованном виде `375XXXXXXXXX`
 * (E.164 без "+"), поэтому дедупликация — это точное сравнение строк.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { LeadRecord } from "@/types/lead";

/**
 * Путь к JSON-файлу хранилища.
 * По умолчанию — `<cwd>/src/lib/db/leads.json`.
 * Может быть переопределён переменной окружения `LEADS_DB_PATH`
 * (полезно для серверless-окружений с записываемой ФС, напр. `/tmp`).
 */
const DB_PATH =
  process.env.LEADS_DB_PATH ??
  path.join(process.cwd(), "src", "lib", "db", "leads.json");

/** Окно дедупликации: 10 минут (в миллисекундах). */
export const DEDUP_WINDOW_MS = 10 * 60 * 1000;

/**
 * Простейший async-mutex на цепочке промисов.
 * Гарантирует, что операции read-modify-write выполняются строго
 * последовательно в пределах одного процесса (нет гонок между await).
 */
let writeLock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeLock.then(() => fn());
  // Не даём цепочке "залипнуть" в состоянии rejected из-за ошибки внутри fn.
  writeLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Читает все записи. Если файла нет или он битый — возвращает пустой массив. */
export async function readLeads(): Promise<LeadRecord[]> {
  try {
    const raw = await fs.readFile(
      /* turbopackIgnore: true */ DB_PATH,
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LeadRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    // Битый JSON не должен ронять приложение — трактуем как пустое хранилище.
    if (error instanceof SyntaxError) return [];
    throw error;
  }
}

/**
 * Атомарно перезаписывает файл хранилища.
 * Пишем во временный файл и делаем rename — на одной ФС это атомарная
 * операция, поэтому читатель никогда не увидит "полузаписанный" JSON.
 */
async function writeLeads(leads: LeadRecord[]): Promise<void> {
  await fs.mkdir(/* turbopackIgnore: true */ path.dirname(DB_PATH), {
    recursive: true,
  });
  const tmpPath = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  const data = JSON.stringify(leads, null, 2);
  await fs.writeFile(/* turbopackIgnore: true */ tmpPath, data, "utf8");
  await fs.rename(/* turbopackIgnore: true */ tmpPath, DB_PATH);
}

export interface SaveLeadResult {
  /** Сохранённая (или уже существующая при дедупликации) запись. */
  record: LeadRecord;
  /** `true`, если заявка распознана как дубль и новая запись НЕ создавалась. */
  deduplicated: boolean;
}

/**
 * Сохраняет заявку с защитой от дублей.
 *
 * @param input Данные формы без служебных полей `id`/`createdAt`
 *              (они генерируются здесь). Поле `phone` должно быть уже
 *              нормализовано (см. {@link validateBelarusPhone}).
 */
export async function saveLead(
  input: Omit<LeadRecord, "id" | "createdAt">,
): Promise<SaveLeadResult> {
  return withLock(async () => {
    const leads = await readLeads();
    const now = Date.now();

    // Ищем самую свежую запись с тем же номером в окне дедупликации.
    const duplicate = [...leads]
      .reverse()
      .find((lead) => {
        if (lead.phone !== input.phone) return false;
        const created = Date.parse(lead.createdAt);
        return Number.isFinite(created) && now - created < DEDUP_WINDOW_MS;
      });

    if (duplicate) {
      return { record: duplicate, deduplicated: true };
    }

    const record: LeadRecord = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(now).toISOString(),
    };
    leads.push(record);
    await writeLeads(leads);
    return { record, deduplicated: false };
  });
}
