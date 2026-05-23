import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny } from "zod";

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function parseRequestBody<T extends ZodTypeAny>(
  request: Request,
  schema: T
) {
  const body = await request.json();
  return schema.parse(body) as ReturnType<T["parse"]>;
}

export function formatError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: "Invalid request payload",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    };
  }

  if (error instanceof Error && "status" in error) {
    const typedError = error as Error & { status?: number; code?: string };
    return {
      status: typedError.status ?? 500,
      body: {
        error: typedError.message,
        code: typedError.code
      }
    };
  }

  return {
    status: 500,
    body: {
      error: "Unexpected server error"
    }
  };
}
