import { flattenError, ZodSchema } from "zod";

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

export async function parseRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = flattenError(result.error);

    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error:
            Object.values(errors.fieldErrors).flat().join("; ") +
            Object.values(errors.formErrors).flat().join("; "),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  return { success: true, data: result.data };
}
