import type { CategoryId } from "@/lib/domain";

export const OTHER_BRAND = "Otra marca";
export const OTHER_MODEL = "No sé el modelo exacto / Otro modelo";

const GENERIC = ["Modelo reciente (últimos 2 años)", "Modelo antiguo (más de 5 años)"];

type Catalog = Record<string, string[]>;

export const BRAND_CATALOG: Partial<Record<CategoryId, Catalog>> = {
  tv: {
    Samsung: ["Serie 7 / Crystal UHD", "QLED", "OLED", "Neo QLED", "The Frame", "Tizen TV antiguo"],
    LG: ["UHD / NanoCell", "OLED (C / G / B)", "QNED", "webOS antiguo"],
    Sony: ["Bravia X (LED)", "Bravia OLED (A)", "Bravia XR", "Google TV / Android TV"],
    TCL: ["Serie P (Google TV)", "Serie C (QLED)", "Roku TV", "Android TV antiguo"],
    Hisense: ["Serie A (VIDAA)", "ULED / U-Series", "Laser TV"],
    Xiaomi: ["Mi TV P1", "Mi TV A2 / A Pro", "Mi TV Q1 / Q2"],
    Philips: ["Ambilight", "Serie PUS (Android TV)", "Saphi TV"],
    AOC: ["Roku TV", "Smart TV Linux", "Android TV"],
    RCA: ["Android TV", "Smart TV básico"],
  },
  celular: {
    Samsung: ["Galaxy S", "Galaxy A", "Galaxy Z Fold / Flip", "Galaxy Tab"],
    "Apple (iPhone/iPad)": ["iPhone 15 / 16", "iPhone 12 – 14", "iPhone 11 o anterior", "iPad / iPad Air", "iPad Pro"],
    Xiaomi: ["Redmi Note", "Redmi (serie básica)", "Xiaomi 13 / 14", "POCO", "Xiaomi Pad"],
    Motorola: ["Moto G", "Moto E", "Edge", "Razr"],
    Huawei: ["Serie P", "Serie Mate", "Nova", "MatePad"],
    Oppo: ["Reno", "Serie A", "Find X"],
    Vivo: ["Serie Y", "Serie V", "Serie X"],
    Honor: ["Serie X", "Magic", "Honor 90 / 200"],
  },
  impresora: {
    HP: ["DeskJet", "OfficeJet", "LaserJet", "Smart Tank", "Envy"],
    Epson: ["EcoTank (L)", "WorkForce", "Expression"],
    Canon: ["PIXMA", "MegaTank (G)", "imageCLASS"],
    Brother: ["Láser HL / DCP", "Tinta continua (DCP-T)", "MFC multifunción"],
    Kyocera: ["ECOSYS", "TASKalfa"],
    Xerox: ["Phaser", "WorkCentre", "VersaLink"],
  },
  pc: {
    "Equipo Armado / Genérico": ["Gamer", "Oficina / hogar", "Workstation / diseño"],
    HP: ["Pavilion", "ProDesk / EliteDesk", "All-in-One", "OMEN"],
    Dell: ["OptiPlex", "Inspiron", "XPS", "Alienware"],
    Lenovo: ["ThinkCentre", "IdeaCentre", "Legion Tower", "All-in-One"],
    Asus: ["ROG", "ExpertCenter", "Vivo AiO"],
    Acer: ["Aspire", "Veriton", "Predator"],
    "Apple (Mac Studio / Mac Mini / iMac)": ["iMac", "Mac Mini", "Mac Studio", "Mac Pro"],
  },
  notebook: {
    Lenovo: ["IdeaPad", "ThinkPad", "Yoga", "Legion", "LOQ"],
    ASUS: ["VivoBook", "ZenBook", "TUF Gaming", "ROG"],
    HP: ["Pavilion", "Victus / OMEN", "EliteBook / ProBook", "Envy", "HP 14 / 15"],
    Dell: ["Inspiron", "Latitude", "XPS", "Vostro", "Alienware"],
    Acer: ["Aspire", "Swift", "Nitro", "Predator"],
    "Apple (MacBook Air / Pro)": ["MacBook Air (M1 / M2 / M3)", "MacBook Pro (Apple Silicon)", "MacBook Intel (antiguo)"],
    MSI: ["Modern", "Katana / Cyborg", "Stealth / Raider"],
    Samsung: ["Galaxy Book", "Galaxy Book Pro / 360"],
    Huawei: ["MateBook D", "MateBook X / 14"],
  },
  casa: {
    "Amazon (Alexa / Echo)": ["Echo Dot", "Echo (4ª gen o superior)", "Echo Show", "Fire TV Cube"],
    "Google (Home / Nest)": ["Nest Mini", "Nest Audio", "Nest Hub", "Nest Wifi"],
    Xiaomi: ["Mi Smart Speaker", "Ampolletas Yeelight / Mi", "Router Mi / AX"],
    "Tuya Smart / Sonoff": ["Enchufes inteligentes", "Ampolletas / tiras LED", "Interruptores"],
    "TP-Link / Tapo": ["Router Archer", "Deco (Mesh)", "Cámaras Tapo", "Enchufes Tapo"],
    "D-Link": ["Router DIR", "Mesh COVR", "Cámaras"],
    Netgear: ["Nighthawk", "Orbi (Mesh)", "Extensor de rango"],
  },
};

export function brandsFor(cat: CategoryId): string[] {
  const c = BRAND_CATALOG[cat];
  return c ? [...Object.keys(c), OTHER_BRAND] : [];
}

export function modelsFor(cat: CategoryId, brand: string): string[] {
  const list = BRAND_CATALOG[cat]?.[brand] ?? GENERIC;
  return [...list, OTHER_MODEL];
}
