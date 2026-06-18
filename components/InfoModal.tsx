"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  infoText: string;
};

export default function InfoModal({
  open,
  onClose,
  imageUrl,
  infoText,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h3>Información del sitio</h3>

        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "10px",
            }}
          />
        )}

        <pre
          style={{
            whiteSpace: "pre-wrap",
            textAlign: "left",
            marginTop: "15px",
          }}
        >
          {infoText}
        </pre>

        <button
          onClick={onClose}
          style={{
            marginTop: "15px",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}