export type Theme = "soot" | "ghost" | "sprout" | "berry" | "plum";
export const themes: Theme[] = ["soot", "ghost", "sprout", "berry", "plum"];
export function Mascot({kind="soot",className="",wave=false}:{kind?:Theme;className?:string;wave?:boolean}) {
 return <svg viewBox="0 0 80 80" role="img" aria-label={`${kind} mascot`} data-kind={kind} className={`mascot ${className}`}>
  <path className="mascot-body" d={kind === "sprout" ? "M38 19C22 5 11 17 24 28C6 44 16 68 36 66C61 74 77 47 59 29C72 12 50 4 38 19Z" : "M17 41C17 22 27 12 41 12C58 12 65 26 65 41L70 63Q63 72 56 62Q49 74 42 63Q33 76 26 64Q17 73 11 65Z"}/>
  <ellipse className="mascot-eyes" cx="32" cy="38" rx="4" ry="6"/><ellipse className="mascot-eyes" cx="49" cy="38" rx="4" ry="6"/>
  {wave && <path className="mascot-body" d="M61 38Q78 24 75 17Q72 12 69 19L61 28"/>}
 </svg>;
}