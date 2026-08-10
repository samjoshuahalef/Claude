"use client";

import type { VehicleCondition } from "@/lib/engine/condition";

/**
 * Condition and history.
 *
 * Ordered by how much each answer moves the number, because a trade-in happens
 * with a customer waiting: ask the question worth five per cent before the one
 * worth one. Every control defaults to "not checked" rather than to the
 * flattering answer — an unknown history is a discount, not a neutral, since
 * the buyer will price it as the worse case and so should the dealer.
 */

interface Props {
  value: VehicleCondition;
  onChange: (next: VehicleCondition) => void;
}

export function ConditionPanel({ value, onChange }: Props) {
  const set = <K extends keyof VehicleCondition>(key: K, next: VehicleCondition[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="stack-4">
      <Choice
        label="Accident damage"
        value={value.accidents}
        onChange={(v) => set("accidents", v as VehicleCondition["accidents"])}
        options={[
          ["none", "None"],
          ["minor_repaired", "Minor"],
          ["major_repaired", "Structural"],
          ["unknown", "Not checked"],
        ]}
      />

      <Choice
        label="Provenance"
        value={value.provenance}
        onChange={(v) => set("provenance", v as VehicleCondition["provenance"])}
        options={[
          ["swiss_delivery", "Swiss"],
          ["direct_import", "Import"],
          ["unknown", "Not checked"],
        ]}
      />

      <Choice
        label="Service history"
        value={value.serviceHistory}
        onChange={(v) => set("serviceHistory", v as VehicleCondition["serviceHistory"])}
        options={[
          ["complete", "Complete"],
          ["partial", "Partial"],
          ["none", "None"],
          ["unknown", "Not checked"],
        ]}
      />

      <Choice
        label="Paint and interior"
        value={value.cosmetic}
        onChange={(v) => set("cosmetic", v as VehicleCondition["cosmetic"])}
        options={[
          ["excellent", "Excellent"],
          ["good", "Good"],
          ["fair", "Fair"],
          ["poor", "Poor"],
        ]}
      />

      <Choice
        label="MFK"
        value={value.mfk}
        onChange={(v) => set("mfk", v as VehicleCondition["mfk"])}
        options={[
          ["fresh", "Fresh"],
          ["valid", "Valid"],
          ["due", "Due"],
          ["expired", "Expired"],
        ]}
      />

      <div className="field-row">
        <label className="field">
          <span className="field__label">Owners</span>
          <input
            className="input num"
            type="number"
            min={1}
            max={9}
            value={value.previousOwners ?? 1}
            onChange={(e) => set("previousOwners", Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span className="field__label">Warranty months</span>
          <input
            className="input num"
            type="number"
            min={0}
            max={60}
            value={value.warrantyMonthsRemaining}
            onChange={(e) => set("warrantyMonthsRemaining", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="stack-2">
        <Toggle
          label="Second wheel set included"
          checked={value.secondWheelSet}
          onChange={(v) => set("secondWheelSet", v)}
        />
        <Toggle
          label="Non-smoker"
          checked={value.nonSmoker}
          onChange={(v) => set("nonSmoker", v)}
        />
      </div>
    </div>
  );
}

function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="segmented">
        {options.map(([key, text]) => (
          <button
            key={key}
            className="segmented__item"
            aria-pressed={key === value}
            onClick={() => onChange(key)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
