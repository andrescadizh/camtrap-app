"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";

type Photo = {
  id: string;
  url: string;
  storage_path: string;
};

type Classification = {
  photo_id: string;
  has_animal: boolean;
};

export default function Page() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // =========================
  // CARGAR FOTOS PENDIENTES
  // =========================
  useEffect(() => {
    const cargar = async () => {
      const { data: photosData } = await supabase
        .from("photos")
        .select("id, url, storage_path");

      const { data: classData } = await supabase
        .from("classifications")
        .select("photo_id");

      const clasificados = new Set(
        classData?.map((c) => c.photo_id) || []
      );

      const filtradas =
        photosData?.filter((p) => !clasificados.has(p.id)) || [];

      setPhotos(filtradas);
      setIndex(0);
    };

    cargar();
  }, []);

  // =========================
  // CLASIFICAR
  // =========================
  const clasificar = async (value: boolean) => {
    const photo = photos[index];
    if (!photo) return;

    setLoading(true);

    const { error } = await supabase.from("classifications").insert([
      {
        photo_id: photo.id,
        has_animal: value,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Error guardando:", error);
      return;
    }

    setIndex((prev) => prev + 1);
  };

  // =========================
  // EXPORTAR A EXCEL
  // =========================
  const exportarExcel = async () => {
    const { data: classData } = await supabase
      .from("classifications")
      .select("*");

    const { data: photosData } = await supabase
      .from("photos")
      .select("id, url, storage_path");

    if (!classData || !photosData) return;

    const merged = classData.map((c: Classification) => {
      const photo = photosData.find((p) => p.id === c.photo_id);

      return {
        foto: photo?.storage_path || "desconocido",
        url: photo?.url || "",
        has_animal: c.has_animal,
      };
    });

    const ws = XLSX.utils.json_to_sheet(merged);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "clasificaciones");

    XLSX.writeFile(wb, "clasificaciones.xlsx");
  };

  // =========================
  // UI STATES
  // =========================
  if (!photos.length) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎉 No hay imágenes pendientes</h1>

        <button
          onClick={exportarExcel}
          style={{
            marginTop: 20,
            padding: 10,
            background: "blue",
            color: "white",
          }}
        >
          Exportar Excel
        </button>
      </div>
    );
  }

  const current = photos[index];

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Clasificación de imágenes</h1>

      <p>
        Progreso: {index + 1} / {photos.length}
      </p>

      <img
        src={current.url}
        alt="foto"
        style={{
          width: "100%",
          maxWidth: 500,
          borderRadius: 10,
          marginTop: 20,
        }}
      />

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => clasificar(true)}
          disabled={loading}
          style={{
            padding: 15,
            marginRight: 10,
            background: "green",
            color: "white",
          }}
        >
          Hay animal
        </button>

        <button
          onClick={() => clasificar(false)}
          disabled={loading}
          style={{
            padding: 15,
            background: "red",
            color: "white",
          }}
        >
          No hay animal
        </button>
      </div>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={exportarExcel}
          style={{
            padding: 10,
            background: "blue",
            color: "white",
          }}
        >
          Exportar Excel
        </button>
      </div>

      {loading && <p>Guardando...</p>}
    </div>
  );
}