"use client";

import {useState} from "react";
import {
  AlarmClock,
  Baby,
  Banknote,
  BarChart3,
  Bath,
  BedDouble,
  Bike,
  BookOpen,
  BriefcaseBusiness,
  Bus,
  CakeSlice,
  Car,
  Cat,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Cloud,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  Ellipsis,
  FileText,
  Film,
  Fish,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  Handshake,
  HeartPulse,
  Home,
  Hospital,
  Hotel,
  House,
  Landmark,
  Laptop,
  Lightbulb,
  MapPin,
  Martini,
  Menu,
  MessageCircle,
  Monitor,
  Music,
  Package,
  Palette,
  PawPrint,
  Pencil,
  Plane,
  Pizza,
  Pill,
  Plug,
  Receipt,
  Repeat2,
  Rocket,
  Search,
  Scissors,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  Stethoscope,
  Store,
  Tag,
  Train,
  Trash2,
  TreePine,
  Trophy,
  Tv,
  Utensils,
  Wallet,
  WashingMachine,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type IconDefinition = {
  value: string;
  labelPt: string;
  labelEn: string;
  keywords: string;
  icon: LucideIcon;
};

type IconGroup = {
  value: string;
  labelPt: string;
  labelEn: string;
  icons: IconDefinition[];
};

type CategoryIconPickerProps = {
  value: string;
  onChange: (value: string) => void;
  locale: string;
  disabled?: boolean;
};

const iconGroups: IconGroup[] = [
  {
    value: "food",
    labelPt: "Alimentação",
    labelEn: "Food",
    icons: [
      {
        value: "utensils",
        labelPt: "Restaurante",
        labelEn: "Restaurant",
        keywords: "comida restaurante refeicao alimentação",
        icon: Utensils,
      },
      {
        value: "shopping-basket",
        labelPt: "Mercado",
        labelEn: "Groceries",
        keywords: "mercado supermercado compras comida",
        icon: ShoppingBasket,
      },
      {
        value: "coffee",
        labelPt: "Café",
        labelEn: "Coffee",
        keywords: "cafe cafeteria bebida",
        icon: Coffee,
      },
      {
        value: "pizza",
        labelPt: "Pizza",
        labelEn: "Pizza",
        keywords: "pizza comida fast food",
        icon: Pizza,
      },
      {
        value: "cake",
        labelPt: "Doces",
        labelEn: "Desserts",
        keywords: "doce bolo sobremesa aniversario",
        icon: CakeSlice,
      },
      {
        value: "martini",
        labelPt: "Bebidas",
        labelEn: "Drinks",
        keywords: "bebida bar alcool festa",
        icon: Martini,
      },
      {
        value: "fish",
        labelPt: "Peixaria",
        labelEn: "Fish",
        keywords: "peixe comida alimentação",
        icon: Fish,
      },
    ],
  },
  {
    value: "home",
    labelPt: "Casa",
    labelEn: "Home",
    icons: [
      {
        value: "house",
        labelPt: "Casa",
        labelEn: "House",
        keywords: "casa aluguel moradia",
        icon: House,
      },
      {
        value: "bed",
        labelPt: "Quarto",
        labelEn: "Bedroom",
        keywords: "quarto cama casa",
        icon: BedDouble,
      },
      {
        value: "lightbulb",
        labelPt: "Energia",
        labelEn: "Electricity",
        keywords: "luz energia conta",
        icon: Lightbulb,
      },
      {
        value: "plug",
        labelPt: "Eletrônicos",
        labelEn: "Electronics",
        keywords: "eletronico energia tomada",
        icon: Plug,
      },
      {
        value: "flame",
        labelPt: "Gás",
        labelEn: "Gas",
        keywords: "gas cozinha conta",
        icon: Flame,
      },
      {
        value: "bath",
        labelPt: "Água",
        labelEn: "Water",
        keywords: "agua banho conta",
        icon: Bath,
      },
      {
        value: "wifi",
        labelPt: "Internet",
        labelEn: "Internet",
        keywords: "internet wifi conta",
        icon: Wifi,
      },
      {
        value: "washing-machine",
        labelPt: "Lavanderia",
        labelEn: "Laundry",
        keywords: "lavanderia roupa casa",
        icon: WashingMachine,
      },
      {
        value: "wrench",
        labelPt: "Manutenção",
        labelEn: "Maintenance",
        keywords: "manutencao conserto reparo casa",
        icon: Wrench,
      },
    ],
  },
  {
    value: "transport",
    labelPt: "Transporte",
    labelEn: "Transport",
    icons: [
      {
        value: "car",
        labelPt: "Carro",
        labelEn: "Car",
        keywords: "carro automovel transporte",
        icon: Car,
      },
      {
        value: "bus",
        labelPt: "Ônibus",
        labelEn: "Bus",
        keywords: "onibus transporte publico",
        icon: Bus,
      },
      {
        value: "train",
        labelPt: "Trem",
        labelEn: "Train",
        keywords: "trem metrô transporte",
        icon: Train,
      },
      {
        value: "bike",
        labelPt: "Bicicleta",
        labelEn: "Bike",
        keywords: "bicicleta transporte esporte",
        icon: Bike,
      },
      {
        value: "map-pin",
        labelPt: "Estacionamento",
        labelEn: "Parking",
        keywords: "estacionamento vaga carro",
        icon: MapPin,
      },
      {
        value: "plane",
        labelPt: "Viagem",
        labelEn: "Travel",
        keywords: "viagem aviao passagem transporte",
        icon: Plane,
      },
    ],
  },
  {
    value: "health",
    labelPt: "Saúde",
    labelEn: "Health",
    icons: [
      {
        value: "heart-pulse",
        labelPt: "Saúde",
        labelEn: "Health",
        keywords: "saude medico coração",
        icon: HeartPulse,
      },
      {
        value: "pill",
        labelPt: "Farmácia",
        labelEn: "Pharmacy",
        keywords: "remedio farmacia medicamento",
        icon: Pill,
      },
      {
        value: "hospital",
        labelPt: "Hospital",
        labelEn: "Hospital",
        keywords: "hospital consulta saude",
        icon: Hospital,
      },
      {
        value: "stethoscope",
        labelPt: "Médico",
        labelEn: "Doctor",
        keywords: "medico consulta saude",
        icon: Stethoscope,
      },
      {
        value: "dumbbell",
        labelPt: "Academia",
        labelEn: "Gym",
        keywords: "academia treino esporte fitness",
        icon: Dumbbell,
      },
      {
        value: "scissors",
        labelPt: "Cuidados pessoais",
        labelEn: "Personal care",
        keywords: "salao beleza cabelo cuidado",
        icon: Scissors,
      },
    ],
  },
  {
    value: "shopping",
    labelPt: "Compras",
    labelEn: "Shopping",
    icons: [
      {
        value: "shopping-cart",
        labelPt: "Compras",
        labelEn: "Shopping",
        keywords: "compras carrinho loja",
        icon: ShoppingCart,
      },
      {
        value: "shopping-bag",
        labelPt: "Sacolas",
        labelEn: "Shopping bags",
        keywords: "compras loja sacola",
        icon: ShoppingBag,
      },
      {
        value: "shirt",
        labelPt: "Roupas",
        labelEn: "Clothing",
        keywords: "roupa vestuario moda",
        icon: Shirt,
      },
      {
        value: "smartphone",
        labelPt: "Celular",
        labelEn: "Phone",
        keywords: "celular telefone smartphone tecnologia",
        icon: Smartphone,
      },
      {
        value: "monitor",
        labelPt: "Computador",
        labelEn: "Computer",
        keywords: "computador notebook tecnologia",
        icon: Monitor,
      },
      {
        value: "package",
        labelPt: "Entregas",
        labelEn: "Deliveries",
        keywords: "entrega pacote encomenda compras",
        icon: Package,
      },
      {
        value: "gift",
        labelPt: "Presentes",
        labelEn: "Gifts",
        keywords: "presente aniversario comemoração",
        icon: Gift,
      },
    ],
  },
  {
    value: "leisure",
    labelPt: "Lazer",
    labelEn: "Leisure",
    icons: [
      {
        value: "film",
        labelPt: "Cinema",
        labelEn: "Cinema",
        keywords: "cinema filme entretenimento",
        icon: Film,
      },
      {
        value: "tv",
        labelPt: "Streaming",
        labelEn: "Streaming",
        keywords: "netflix streaming televisao serie",
        icon: Tv,
      },
      {
        value: "music",
        labelPt: "Música",
        labelEn: "Music",
        keywords: "musica show entretenimento",
        icon: Music,
      },
      {
        value: "gamepad",
        labelPt: "Jogos",
        labelEn: "Gaming",
        keywords: "jogo videogame games lazer",
        icon: Gamepad2,
      },
      {
        value: "palette",
        labelPt: "Arte",
        labelEn: "Art",
        keywords: "arte pintura desenho cultura",
        icon: Palette,
      },
      {
        value: "tree",
        labelPt: "Passeios",
        labelEn: "Outdoors",
        keywords: "passeio parque natureza lazer",
        icon: TreePine,
      },
      {
        value: "trophy",
        labelPt: "Esportes",
        labelEn: "Sports",
        keywords: "esporte futebol campeonato lazer",
        icon: Trophy,
      },
    ],
  },
  {
    value: "education",
    labelPt: "Educação",
    labelEn: "Education",
    icons: [
      {
        value: "book",
        labelPt: "Livros",
        labelEn: "Books",
        keywords: "livro leitura estudo",
        icon: BookOpen,
      },
      {
        value: "graduation",
        labelPt: "Curso",
        labelEn: "Course",
        keywords: "curso faculdade universidade estudo",
        icon: GraduationCap,
      },
      {
        value: "clipboard",
        labelPt: "Materiais",
        labelEn: "Supplies",
        keywords: "material escola papelaria estudo",
        icon: ClipboardList,
      },
      {
        value: "laptop",
        labelPt: "Curso online",
        labelEn: "Online course",
        keywords: "curso online computador estudo",
        icon: Laptop,
      },
    ],
  },
  {
    value: "finance",
    labelPt: "Finanças",
    labelEn: "Finance",
    icons: [
      {
        value: "wallet",
        labelPt: "Carteira",
        labelEn: "Wallet",
        keywords: "carteira dinheiro finanças",
        icon: Wallet,
      },
      {
        value: "credit-card",
        labelPt: "Cartão",
        labelEn: "Card",
        keywords: "cartao credito pagamento",
        icon: CreditCard,
      },
      {
        value: "banknote",
        labelPt: "Dinheiro",
        labelEn: "Cash",
        keywords: "dinheiro pagamento notas",
        icon: Banknote,
      },
      {
        value: "coins",
        labelPt: "Moedas",
        labelEn: "Coins",
        keywords: "moeda dinheiro economia",
        icon: Coins,
      },
      {
        value: "landmark",
        labelPt: "Banco",
        labelEn: "Bank",
        keywords: "banco conta instituição",
        icon: Landmark,
      },
      {
        value: "receipt",
        labelPt: "Recibo",
        labelEn: "Receipt",
        keywords: "recibo nota comprovante",
        icon: Receipt,
      },
      {
        value: "chart",
        labelPt: "Investimentos",
        labelEn: "Investments",
        keywords: "investimento ações bolsa dinheiro",
        icon: BarChart3,
      },
      {
        value: "hand-coins",
        labelPt: "Doação",
        labelEn: "Donation",
        keywords: "doacao ajuda dinheiro caridade",
        icon: HandCoins,
      },
    ],
  },
  {
    value: "family",
    labelPt: "Família e pets",
    labelEn: "Family and pets",
    icons: [
      {
        value: "baby",
        labelPt: "Bebê",
        labelEn: "Baby",
        keywords: "bebe criança familia",
        icon: Baby,
      },
      {
        value: "paw",
        labelPt: "Pets",
        labelEn: "Pets",
        keywords: "pet cachorro animal gato",
        icon: PawPrint,
      },
      {
        value: "cat",
        labelPt: "Gato",
        labelEn: "Cat",
        keywords: "gato pet animal",
        icon: Cat,
      },
      {
        value: "gift-family",
        labelPt: "Família",
        labelEn: "Family",
        keywords: "familia presente aniversario",
        icon: Gift,
      },
    ],
  },
  {
    value: "subscriptions",
    labelPt: "Assinaturas",
    labelEn: "Subscriptions",
    icons: [
      {
        value: "repeat",
        labelPt: "Assinatura",
        labelEn: "Subscription",
        keywords: "assinatura recorrente mensal",
        icon: Repeat2,
      },
      {
        value: "cloud",
        labelPt: "Nuvem",
        labelEn: "Cloud",
        keywords: "cloud armazenamento assinatura",
        icon: Cloud,
      },
      {
        value: "message",
        labelPt: "Mensagens",
        labelEn: "Messaging",
        keywords: "mensagem comunicacao assinatura",
        icon: MessageCircle,
      },
      {
        value: "alarm",
        labelPt: "Alarme",
        labelEn: "Alarm",
        keywords: "alarme lembrete assinatura",
        icon: AlarmClock,
      },
    ],
  },
  {
    value: "work",
    labelPt: "Trabalho",
    labelEn: "Work",
    icons: [
      {
        value: "briefcase",
        labelPt: "Trabalho",
        labelEn: "Work",
        keywords: "trabalho emprego empresa",
        icon: BriefcaseBusiness,
      },
      {
        value: "handshake",
        labelPt: "Serviços",
        labelEn: "Services",
        keywords: "servico contrato trabalho",
        icon: Handshake,
      },
      {
        value: "store",
        labelPt: "Negócio",
        labelEn: "Business",
        keywords: "negocio loja empresa vendas",
        icon: Store,
      },
      {
        value: "rocket",
        labelPt: "Projeto",
        labelEn: "Project",
        keywords: "projeto startup trabalho",
        icon: Rocket,
      },
    ],
  },
  {
    value: "other",
    labelPt: "Outros",
    labelEn: "Other",
    icons: [
      {
        value: "sparkles",
        labelPt: "Diversos",
        labelEn: "Miscellaneous",
        keywords: "outros diversos geral",
        icon: Sparkles,
      },
      {
        value: "tag",
        labelPt: "Etiqueta",
        labelEn: "Tag",
        keywords: "categoria geral etiqueta",
        icon: Tag,
      },
      {
        value: "pencil",
        labelPt: "Personalizado",
        labelEn: "Custom",
        keywords: "personalizado outro editar",
        icon: Pencil,
      },
      {
        value: "ellipsis",
        labelPt: "Mais",
        labelEn: "More",
        keywords: "outros mais geral",
        icon: Ellipsis,
      },
    ],
  },
];

function getAllIcons() {
  return iconGroups.flatMap((group) => group.icons);
}

export function CategoryIconPicker({
  value,
  onChange,
  locale,
  disabled = false,
}: CategoryIconPickerProps) {
  const isEnglish = locale === "en";
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("food");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredIcons = normalizedQuery
    ? getAllIcons().filter((item) =>
        `${item.labelPt} ${item.labelEn} ${item.keywords}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : iconGroups.find((group) => group.value === activeGroup)?.icons ?? [];

  const selectedIcon =
    getAllIcons().find((item) => item.value === value) ??
    getAllIcons()[0];

  return (
    <div className="space-y-4">
      <input type="hidden" name="icon" value={value} />

      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-slate-950/45 p-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-300/12 text-fuchsia-200">
          <selectedIcon.icon size={21} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Selected icon" : "Ícone selecionado"}
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-100">
            {isEnglish
              ? selectedIcon.labelEn
              : selectedIcon.labelPt}
          </p>
        </div>

        <span className="ml-auto text-xs text-slate-500">
          {getAllIcons().length} {isEnglish ? "icons" : "ícones"}
        </span>
      </div>

      <label className="relative block">
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          placeholder={
            isEnglish
              ? "Search food, car, home, Netflix..."
              : "Busque comida, carro, casa, Netflix..."
          }
          className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/[0.16] focus:border-fuchsia-300/55 focus:ring-2 focus:ring-fuchsia-300/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {!normalizedQuery ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {iconGroups.map((group) => {
            const isActive = activeGroup === group.value;

            return (
              <button
                key={group.value}
                type="button"
                disabled={disabled}
                onClick={() => setActiveGroup(group.value)}
                className={`inline-flex h-9 shrink-0 items-center rounded-xl border px-3 text-xs font-semibold transition ${
                  isActive
                    ? "border-fuchsia-300/35 bg-fuchsia-300/15 text-fuchsia-100"
                    : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
                }`}
              >
                {isEnglish ? group.labelEn : group.labelPt}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:grid-cols-7 md:grid-cols-9">
        {filteredIcons.map((item) => {
          const Icon = item.icon;
          const isSelected = item.value === value;

          return (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.value)}
              title={isEnglish ? item.labelEn : item.labelPt}
              aria-label={isEnglish ? item.labelEn : item.labelPt}
              aria-pressed={isSelected}
              className={`flex h-12 items-center justify-center rounded-xl border transition ${
                isSelected
                  ? "border-fuchsia-300/45 bg-fuchsia-300/15 text-fuchsia-100 shadow-[0_0_18px_rgba(232,121,249,0.12)]"
                  : "border-transparent text-slate-400 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Icon size={21} strokeWidth={1.8} />
            </button>
          );
        })}

        {filteredIcons.length === 0 ? (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
            {isEnglish
              ? "No icons found."
              : "Nenhum ícone encontrado."}
          </div>
        ) : null}
      </div>
    </div>
  );
}