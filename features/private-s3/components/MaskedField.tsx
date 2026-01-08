import { Input } from "@/components/ui/input";

interface MaskedFieldProps {
    label: string;
    value?: string;
}

export const MaskedField = ({ label, value = "••••••••••••" }: MaskedFieldProps) => {
    return (
        <div className="shad-form-item">
            <label className="shad-form-label">{label}</label>
            <Input disabled value={value} className="shad-input" />
        </div>
    );
};
