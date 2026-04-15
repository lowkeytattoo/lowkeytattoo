import { cn } from "@shared/lib/utils";

interface Country {
  dial: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { dial: "+34",  flag: "🇪🇸", name: "España"          },
  { dial: "+44",  flag: "🇬🇧", name: "Reino Unido"     },
  { dial: "+49",  flag: "🇩🇪", name: "Alemania"        },
  { dial: "+33",  flag: "🇫🇷", name: "Francia"         },
  { dial: "+39",  flag: "🇮🇹", name: "Italia"          },
  { dial: "+31",  flag: "🇳🇱", name: "Países Bajos"    },
  { dial: "+32",  flag: "🇧🇪", name: "Bélgica"         },
  { dial: "+351", flag: "🇵🇹", name: "Portugal"        },
  { dial: "+353", flag: "🇮🇪", name: "Irlanda"         },
  { dial: "+46",  flag: "🇸🇪", name: "Suecia"          },
  { dial: "+47",  flag: "🇳🇴", name: "Noruega"         },
  { dial: "+45",  flag: "🇩🇰", name: "Dinamarca"       },
  { dial: "+41",  flag: "🇨🇭", name: "Suiza"           },
  { dial: "+43",  flag: "🇦🇹", name: "Austria"         },
  { dial: "+1",   flag: "🇺🇸", name: "EE.UU. / Canadá" },
  { dial: "+52",  flag: "🇲🇽", name: "México"          },
  { dial: "+54",  flag: "🇦🇷", name: "Argentina"       },
  { dial: "+57",  flag: "🇨🇴", name: "Colombia"        },
  { dial: "+58",  flag: "🇻🇪", name: "Venezuela"       },
  { dial: "+53",  flag: "🇨🇺", name: "Cuba"            },
  { dial: "+56",  flag: "🇨🇱", name: "Chile"           },
];

// Longest dial codes first so "+353" matches before "+35"
const SORTED = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

function parse(value: string): { dial: string; number: string } {
  if (!value) return { dial: "+34", number: "" };
  if (value.startsWith("+")) {
    const match = SORTED.find((c) => value.startsWith(c.dial));
    if (match) return { dial: match.dial, number: value.slice(match.dial.length).trimStart() };
    return { dial: "+34", number: value };
  }
  return { dial: "+34", number: value };
}

export function formatPhone(value: string): string {
  if (!value) return "";
  const { dial, number } = parse(value);
  const country = COUNTRIES.find((c) => c.dial === dial);
  const flag = country?.flag ?? "";
  return `${flag} ${dial} ${number}`.trim();
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, className, placeholder = "000 000 000" }: PhoneInputProps) {
  const { dial, number } = parse(value ?? "");

  const handleDial = (newDial: string) => onChange(number ? `${newDial}${number}` : newDial);
  const handleNumber = (num: string) => onChange(num ? `${dial}${num}` : "");

  return (
    <div
      className={cn(
        "flex h-9 w-full overflow-hidden rounded-md border border-border bg-background text-sm",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors",
        className
      )}
    >
      {/* Country selector */}
      <select
        value={dial}
        onChange={(e) => handleDial(e.target.value)}
        className="shrink-0 border-r border-border bg-transparent pl-2 pr-1 text-sm focus:outline-none cursor-pointer font-['IBM_Plex_Mono'] text-foreground"
        style={{ width: "5.5rem" }}
        aria-label="Prefijo de país"
      >
        {COUNTRIES.map((c) => (
          <option key={c.dial + c.name} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>

      {/* Number */}
      <input
        type="tel"
        value={number}
        onChange={(e) => handleNumber(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 focus:outline-none text-foreground placeholder:text-muted-foreground font-['IBM_Plex_Mono']"
      />
    </div>
  );
}
