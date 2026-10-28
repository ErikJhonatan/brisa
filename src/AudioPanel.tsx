import { Switch } from "@heroui/react";
import { Headphones, Pause, Play, Volume2, Wind } from "lucide-react";
import { tracks, type AudioSettings } from "./audio";
type Props = {
  value: AudioSettings;
  onChange: (value: AudioSettings) => void;
  preview: boolean;
  onPreview: () => void;
};
export default function AudioPanel({
  value,
  onChange,
  preview,
  onPreview,
}: Props) {
  return (
    <section className="audio-panel" aria-label="Sonido y música">
      <div className="panel-section-title">
        <Headphones size={19} />
        <h3>Tu ambiente</h3>
      </div>
      <p>
        Grabaciones de bibliotecas con licencia CC0. Descargadas en la app, sin
        anuncios.
      </p>
      <div className="track-list" role="group" aria-label="Elegir música">
        {tracks.map((track) => (
          <button
            key={track.id}
            className={value.track === track.id ? "selected" : ""}
            aria-pressed={value.track === track.id}
            onClick={() => onChange({ ...value, track: track.id })}
          >
            <span className="track-cover" aria-hidden="true">
              {track.id === "off" ? (
                <Volume2 size={18} />
              ) : (
                <Headphones size={18} />
              )}
            </span>
            <span>
              <strong>{track.name}</strong>
              <small>{track.style}</small>
            </span>
            <span className="radio-dot" />
          </button>
        ))}
      </div>
      {value.track !== "off" && (
        <>
          <button className="preview-button" onClick={onPreview}>
            {preview ? <Pause size={16} /> : <Play size={16} />}{" "}
            {preview ? "Detener muestra" : "Escuchar muestra"}
          </button>
          <label className="volume-label">
            Volumen de música{" "}
            <output>{Math.round(value.musicVolume * 100)}%</output>
            <input
              aria-label="Volumen de música"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={value.musicVolume}
              onChange={(e) =>
                onChange({ ...value, musicVolume: Number(e.target.value) })
              }
            />
          </label>
        </>
      )}
      <div className="preference-row">
        <div>
          <strong>
            <Wind size={16} /> Sonido de respiración
          </strong>
          <span>Aire suave al inhalar y al exhalar</span>
        </div>
        <Switch
          aria-label="Sonido de respiración"
          isSelected={value.breath}
          onValueChange={(breath) => onChange({ ...value, breath })}
        />
      </div>
      {value.breath && (
        <label className="volume-label">
          Volumen de respiración{" "}
          <output>{Math.round(value.breathVolume * 100)}%</output>
          <input
            aria-label="Volumen de respiración"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={value.breathVolume}
            onChange={(e) =>
              onChange({ ...value, breathVolume: Number(e.target.value) })
            }
          />
        </label>
      )}
      {value.track !== "off" && (
        <p className="small-copy">
          {tracks.find((t) => t.id === value.track)?.author} ·{" "}
          <a
            href={tracks.find((t) => t.id === value.track)?.source}
            target="_blank"
            rel="noreferrer"
          >
            Fuente y licencia CC0
          </a>
        </p>
      )}
      <p className="small-copy">
        La música acompaña la práctica; también puedes meditar en silencio.
        Empieza a volumen bajo.
      </p>
    </section>
  );
}
