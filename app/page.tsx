"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Photo = {
  id: string;
  url: string;
  storage_path: string;
};

export default function Home() {
  // ======================
  // LOGIN
  // ======================
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [logged, setLogged] = useState(false);

  // ======================
  // APP STATE
  // ======================
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  const [animalName, setAnimalName] = useState("");
  const [showInput, setShowInput] = useState(false);

  // ======================
  // LOAD PHOTOS
  // ======================
  useEffect(() => {
    if (logged) loadPhotos();
  }, [logged]);

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*");

    if (error) {
      console.error("Error cargando photos:", error);
      return;
    }

    setPhotos(data || []);
    setCurrentIndex(0);
  };

  // ======================
  // LOGIN
  // ======================
  const login = async () => {
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", user)
      .eq("password", pass)
      .single();

    if (error || !data) {
      alert("Usuario o clave incorrecta");
      return;
    }

    setLogged(true);
  };

  

  // ======================
  // NAVIGATION
  // ======================
  const nextPhoto = () => {
    setCurrentIndex((prev) =>
      Math.min(prev + 1, photos.length - 1)
    );
    setZoom(false);
    setShowInput(false);
    setAnimalName("");
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) =>
      Math.max(prev - 1, 0)
    );
    setZoom(false);
    setShowInput(false);
    setAnimalName("");
  };

  // ======================
  // SAVE CLASSIFICATION
  // ======================
  const saveClassification = async (
    hasAnimal: boolean,
    species?: string
  ) => {
    const photo = photos[currentIndex];

    const { error } = await supabase
      .from("classifications")
      .insert({
        photo_id: photo.id,
        has_animal: hasAnimal,
        species: species || null,
        user_name: user, // 👈 usuario logueado
      });

    if (error) {
      console.error("Error guardando clasificación:", error);
      return;
    }

    nextPhoto();
  };

  // ======================
  // UI LOGIN
  // ======================
  if (!logged) {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>

      {/* IMAGEN LOGIN */}
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRknEEFICRLm1yhav9JEI2hOIo75gHteMRDLA&s"
        style={{
          width: "250px",
          borderRadius: "15px",
          marginBottom: "20px"
        }}
      />

      <h2>Ingreso al sistema</h2>

      <input
        placeholder="Usuario"
        onChange={(e) => setUser(e.target.value)}
        style={{ padding: "8px", margin: "5px" }}
      />
      <br />

      <input
        placeholder="Clave"
        type="password"
        onChange={(e) => setPass(e.target.value)}
        style={{ padding: "8px", margin: "5px" }}
      />
      <br />

      <button onClick={login} style={{ marginTop: "10px" }}>
        Ingresar
      </button>

      <br /><br />

      
    </div>
  );
}
  // ======================
  // EMPTY STATE
  // ======================
  if (photos.length === 0) {
    return <p>No hay fotos cargadas</p>;
  }

  // ======================
  // MAIN APP
  // ======================
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>

      {/* IMAGE */}
      <img
        src={photos[currentIndex]?.url}
        onClick={() => setZoom(!zoom)}
        style={{
          width: zoom ? "90vw" : "400px",
          borderRadius: "10px",
          cursor: "zoom-in",
        }}
      />

      {/* NAV */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={prevPhoto}>⬅️</button>
        <button onClick={nextPhoto}>➡️</button>
      </div>

      {/* CLASSIFICATION */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setShowInput(true)}
          style={{ backgroundColor: "green", color: "white" }}
        >
          🐾 Hay animal
        </button>

        <button
          onClick={() => saveClassification(false)}
          style={{ backgroundColor: "red", color: "white" }}
        >
          ❌ No hay animal
        </button>
      </div>

      {/* INPUT ESPECIE */}
      {showInput && (
        <div style={{ marginTop: "15px" }}>
          <p>¿Qué animal viste?</p>

          <input
            value={animalName}
            onChange={(e) => setAnimalName(e.target.value)}
            placeholder="Ej: zorro, ave, guanaco"
            style={{ padding: "8px", width: "250px" }}
          />

          <br />

          <button
            onClick={() =>
              saveClassification(true, animalName)
            }
            style={{
              marginTop: "10px",
              backgroundColor: "green",
              color: "white",
            }}
          >
            Guardar
          </button>
        </div>
      )}

      {/* COUNTER */}
      <p>
        Foto {currentIndex + 1} de {photos.length}
      </p>
    </div>
  );
}