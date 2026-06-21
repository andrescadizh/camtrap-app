import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase (SIN fallback vacío, obligatorio)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // 1. Listar archivos del bucket
    const { data: files, error: listError } = await supabase.storage
      .from("prueba")
      .list("", { limit: 1000 });

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    // 2. Obtener fotos ya registradas en DB
    const { data: existing } = await supabase
      .from("photos")
      .select("storage_path");

    const existingSet = new Set(
      (existing || []).map((p) => p.storage_path)
    );

    // 3. Filtrar solo nuevas imágenes
    const newFiles = (files || []).filter(
      (f) => !existingSet.has(f.name)
    );

    // 4. Construir registros nuevos
    const rows = newFiles.map((file) => {
      const { data } = supabase.storage
        .from("prueba")
        .getPublicUrl(file.name);

      return {
        url: data.publicUrl,
        storage_path: file.name,
      };
    });

    // 5. Insertar en DB si hay nuevos
    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("photos")
        .insert(rows);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    // 6. Respuesta final
    return NextResponse.json({
      success: true,
      inserted: rows.length,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}