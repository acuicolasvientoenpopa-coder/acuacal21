import { useTranslation } from "@/store/language";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>{cancelLabel || t("cancel")}</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm} style={danger ? { padding: "10px 20px" } : {}}>
            {confirmLabel || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}