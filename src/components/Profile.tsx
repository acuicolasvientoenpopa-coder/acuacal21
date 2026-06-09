import { useState, useEffect } from "react";
import { useTranslation } from "@/store/language";

const STORAGE_KEY = "aquacalc_profile";

interface ProfileData {
  nombre: string;
}

export function getProfile(): ProfileData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"nombre":""}');
  } catch {
    return { nombre: "" };
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(getProfile);
  const saveProfile = (data: ProfileData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setProfile(data);
  };
  return { profile, saveProfile };
}

interface Props {
  open: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
}

export default function ProfileModal({ open, onClose, profile, onSave }: Props) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState(profile.nombre);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(profile.nombre);
      setChanged(false);
    }
  }, [open, profile.nombre]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ nombre });
    setChanged(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t("editProfile")}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <label>
            {t("name")}
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("namePlaceholder")} />
          </label>
          {changed && <p className="toast toast-success" style={{ margin: "12px 0 0" }}>{t("saved")}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>{t("save")}</button>
          <button className="btn" onClick={onClose}>{t("cancel")}</button>
        </div>
      </div>
    </div>
  );
}
