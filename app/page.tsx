// page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import InfoModal from "../components/InfoModal";
import * as XLSX from "xlsx";

type Photo = {
  id: string;
  url: string;
  storage_path: string;
  review_count?: number;
};

export default function Home() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [logged, setLogged] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  const [animalName, setAnimalName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoImage, setInfoImage] = useState<string | null>(null);
  const [infoText, setInfoText] = useState("");

  const animalButton = {
  border: "none",
  borderRadius: "12px",
  padding: "20px",
  fontSize: "18px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  backgroundColor: "#16a34a",
  color: "white",
  minHeight: "90px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
};

  useEffect(() => {
    if (logged) loadPhotos();
  }, [logged]);

  async function loadPhotos() {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("completed", false);

    const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
    setPhotos(shuffled as Photo[]);
    setCurrentIndex(0);
  }

  async function login() {
    const { data } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", user)
      .eq("password", pass)
      .single();

    if (!data) {
      alert("Usuario o clave incorrecta");
      return;
    }

    setLogged(true);
  }

  function nextPhoto() {
    setCurrentIndex((p) => Math.min(p + 1, photos.length - 1));
    setShowInput(false);
    setAnimalName("");
  }

  function prevPhoto() {
    setCurrentIndex((p) => Math.max(p - 1, 0));
  }

  async function saveClassification(hasAnimal: boolean, species?: string) {
    const photo = photos[currentIndex];

    await supabase.from("classifications").insert({
      nombre_foto: photo.storage_path,
      has_animal: hasAnimal,
      species: species || null,
      user_name: user,
    });

    const newCount = (photo.review_count || 0) + 1;

    const { data: updateData, error: updateError } = await supabase
  .from("photos")
  .update({
    review_count: newCount,
    completed: newCount >= 3,
    status: newCount >= 3 ? "completed" : "pending",
  })
  .eq("id", photo.id)
  .select();

console.log("PHOTO ID:", photo.id);
console.log("NEW COUNT:", newCount);
console.log("UPDATE DATA:", updateData);
console.log("UPDATE ERROR:", updateError);

if (updateError) {
  console.error("Error actualizando review_count:", updateError);
}

    await loadPhotos(); 
    setShowInput(false);
    setAnimalName("");
  }

  async function exportExcel() {
    const { data } = await supabase.from("classifications").select("*");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data || []);
    XLSX.utils.book_append_sheet(wb, ws, "Clasificaciones");
    XLSX.writeFile(wb, "clasificaciones.xlsx");
  }

  async function showInfo() {
    const photo = photos[currentIndex];
    const parts = photo.storage_path.split("_");
    const code = parts.length >= 3 ? `${parts[0]}_${parts[1]}` : "";

    const { data: img } = supabase.storage
      .from("info_images")
      .getPublicUrl(`${code}.jpg`);

    setInfoImage(img.publicUrl);

    const { data } = await supabase.storage
      .from("info_text")
      .download(`${code}.txt`);

    if (data) {
      setInfoText(await data.text());
    }

    setInfoOpen(true);
  }

  if (!logged) {
    return (
      <div style={{minHeight:"100vh",display:"flex",justifyContent:"center",alignItems:"center"}}>
        <div style={{textAlign:"center"}}>
          <h2>Ingreso al sistema</h2>
          <input placeholder="Usuario" onChange={(e)=>setUser(e.target.value)} /><br/><br/>
          <input type="password" placeholder="Clave" onChange={(e)=>setPass(e.target.value)} /><br/><br/>
          <button onClick={login}>Ingresar</button>
        </div>
      </div>
    );
  }

  if (!photos.length) return <p>No hay fotos pendientes.</p>;

  const photo = photos[currentIndex];

  return (
    <div style={{textAlign:"center",padding:"20px"}}>
      {user === "admin" && (
        <button onClick={exportExcel}>📊 Descargar Excel</button>
      )}

      <div>
        <img
          src={photo.url}
          onClick={() => setZoom(!zoom)}
          style={{
            width: zoom ? "90vw" : "min(90vw,500px)",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        />
      </div>

      <div style={{marginTop:"10px"}}>
        <button onClick={prevPhoto}>⬅️</button>
        <button onClick={nextPhoto}>➡️</button>
      </div>

      <div style={{marginTop:"10px"}}>
        <button onClick={showInfo}>ℹ️ Más información</button>
      </div>

      <div
  style={{
    marginTop: "25px",
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  }}
>
  <button
    onClick={() => setShowInput(true)}
    style={{
      backgroundColor: "#16a34a",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "15px 25px",
      fontSize: "18px",
      fontWeight: "bold",
      cursor: "pointer",
      minWidth: "180px",
      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
    }}
  >
    🐾 Sí hay animal
  </button>

  <button
    onClick={() => saveClassification(false)}
    style={{
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "15px 25px",
      fontSize: "18px",
      fontWeight: "bold",
      cursor: "pointer",
      minWidth: "180px",
      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
    }}
  >
    🚫 No hay animal
  </button>
</div>

      {showInput && (
  <div
    style={{
      marginTop: "20px",
      maxWidth: "900px",
      marginLeft: "auto",
      marginRight: "auto",
    }}
  >
    <h3>¿Qué observaste?</h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
      }}
    >
      <button
        onClick={() => saveClassification(true, "Zorro")}
        style={animalButton}
      >
        🦊<br />
        Zorro
      </button>

      <button
        onClick={() => saveClassification(true, "Conejo")}
        style={animalButton}
      >
        🐇<br />
        Conejo
      </button>

      <button
        onClick={() => saveClassification(true, "Roedor")}
        style={animalButton}
      >
        🐀<br />
        Roedor
      </button>

      <button
        onClick={() => saveClassification(true, "Ave")}
        style={animalButton}
      >
        🐦<br />
        Ave
      </button>

      <button
        onClick={() => saveClassification(true, "Reptil")}
        style={animalButton}
      >
        🦎<br />
        Reptil
      </button>

      <button
        onClick={() => saveClassification(true, "Perro")}
        style={animalButton}
      >
        🐕<br />
        Perro
      </button>

      <button
        onClick={() => saveClassification(true, "Gato")}
        style={animalButton}
      >
        🐈<br />
        Gato
      </button>

      <button
        onClick={() => saveClassification(true, "Persona")}
        style={animalButton}
      >
        👤<br />
        Persona
      </button>

      <button
        onClick={() => setAnimalName("OTRO")}
        style={{
          ...animalButton,
          backgroundColor: "#f59e0b",
        }}
      >
        ❓<br />
        Otro
      </button>
    </div>

    {animalName === "OTRO" && (
      <div style={{ marginTop: "20px" }}>
        <input
          onChange={(e) => setAnimalName(e.target.value)}
          placeholder="Escriba la especie"
          style={{
            padding: "12px",
            width: "300px",
            maxWidth: "90%",
            borderRadius: "10px",
          }}
        />

        <button
          onClick={() => saveClassification(true, animalName)}
          style={{
            marginLeft: "10px",
            padding: "12px 20px",
          }}
        >
          Guardar
        </button>
      </div>
    )}
  </div>
)}

<p>Foto {currentIndex + 1} de {photos.length}</p>

<InfoModal
  open={infoOpen}
  onClose={() => setInfoOpen(false)}
  imageUrl={infoImage}
  infoText={infoText}
/>   </div>
  );
}