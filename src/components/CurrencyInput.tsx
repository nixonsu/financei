import Input from "./Input";

type CurrencyInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  max?: number;
  className?: string;
};

const CurrencyInput = ({
  value,
  onChange,
  autoFocus = false,
  max = 1000000,
  className,
}: CurrencyInputProps) => {
  const handleChange = (rawValue: string) => {
    // Allow empty, lone decimal, or digits with up to 2 decimal places
    if (!/^\d*\.?\d{0,2}$/.test(rawValue)) return;

    if (rawValue === "" || rawValue === ".") {
      onChange(rawValue);
      return;
    }

    const num = parseFloat(rawValue);
    if (num >= 0 && num <= max) {
      onChange(rawValue);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      <span className="text-lg font-bold">$</span>
      <Input
        autoFocus={autoFocus}
        value={value}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        onChange={handleChange}
        className={className}
      />
    </div>
  );
};

export default CurrencyInput;
