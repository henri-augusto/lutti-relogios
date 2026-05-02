import { NextResponse } from "next/server";
import { OlistSyncError, syncOlistProductsToLocal } from "@/lib/olist-sync";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const result = await syncOlistProductsToLocal({
      maxPagesPerRun: body?.maxPagesPerRun,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OlistSyncError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao sincronizar produtos Olist:", error);
    return NextResponse.json({ error: "Nao foi possivel sincronizar produtos." }, { status: 500 });
  }
}
