import { CaretDownIcon } from "@phosphor-icons/react";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

interface SelectProps {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const Select = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange?.(option);
    setOpen(false);
  };

  return (
    <div className={classNames("relative text-left", className)} ref={ref}>
      <button
        type="button"
        className="flex w-full justify-between items-center bg-white px-4 py-3 border-black border-2 focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span
          className={classNames("flex-1 text-center text-lg", {
            "text-gray-400": !value,
          })}
        >
          {value || placeholder}
        </span>
        <CaretDownIcon
          size={20}
          weight="bold"
          className={classNames("transition-transform", {
            "rotate-180": open,
          })}
        />
      </button>

      {open && (
        <div
          className="w-full absolute left-0 z-10 mt-2 origin-top-left bg-white focus:outline-none shadow-[2px_2px_0px_rgba(0,0,0,1)] border-black border-2"
          role="menu"
          aria-orientation="vertical"
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              className={classNames(
                "block w-full px-4 py-3 text-center text-base hover:bg-[#B8FF9F] hover:font-medium",
                { "border-black border-b-2": index < options.length - 1 },
                { "bg-[#e0ffcf] font-medium": value === option },
              )}
              role="menuitem"
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
