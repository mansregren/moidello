/**
 * Hand-curated stilguider. Strukturerat som data så HowTo-schema och
 * sid-rendering delar samma källa. Per moidello-brand-namedropping:
 * inga märken nämns vid namn i texten utan formellt partnerskap, så
 * stegen håller sig till plagg-typer, material och proportioner.
 */

export interface Guide {
  slug: string;
  title: string;
  intro: string;
  metaDescription: string;
  totalTime?: string;
  steps: { name: string; text: string }[];
  /** Relaterade outfit-kategorier för cross-link på sidan. */
  related?: {
    styles?: string[];
    garments?: { gender: "dam" | "herr"; garment: string }[];
    colors?: string[];
  };
}

export const GUIDES: Guide[] = [
  {
    slug: "skandinavisk-minimalism",
    title: "Skandinavisk minimalism — guide till stilen",
    intro:
      "Skandinavisk minimalism är en av de mest distinkta nordiska stilarna och bygger på neutrala färgpaletter, rena silhuetter och plagg av hög materialkvalitet. Stilen prioriterar passform och hållbarhet framför trender, och fungerar i alla åldrar.",
    metaDescription:
      "Guide till skandinavisk minimalism inom mode. Lär dig grunderna i den nordiska stilen — färgpalett, plagg, material och proportioner.",
    totalTime: "PT15M",
    steps: [
      {
        name: "Bygg en neutral basgarderob",
        text: "Börja med plagg i svart, vit, beige, grå och marinblå. Dessa fem färger kombineras fritt och ger en lugn helhet. Undvik intensiva mönster i baslagret — det är ett medvetet val, inte tristess.",
      },
      {
        name: "Välj naturmaterial",
        text: "Skandinavisk minimalism vilar på material som åldras snyggt — ull, linne, bomull, läder, mocka och kashmir. Material syns i alla led: i fall, i hur en stickad tröja sitter, i hur skinnet på en sko bryts.",
      },
      {
        name: "Prioritera passform över storlek",
        text: "Plaggen ska vara väl skurna men inte tighta. Lite extra material i ärm och längd ger den oansträngda volymen som definierar stilen. Helt oversize eller helt åtsittande hör inte hemma här.",
      },
      {
        name: "Lägg till en accent per outfit",
        text: "En enda accent håller helheten lugn. Det kan vara en mörk röd skjorta, en kamel-färgad jacka eller en kontrasterande väska. Två accenter blir för mycket.",
      },
      {
        name: "Håll accessoarerna minimala",
        text: "En klocka, en tunn halskedja, en mindre väska. Smycken är dämpade — guld eller silver, sällan båda, aldrig statement. Mindre är inte fattigare, det är medvetet.",
      },
      {
        name: "Behåll plaggen länge",
        text: "Skandinavisk minimalism är anti-fast-fashion i sin natur. Plaggen är tänkta att bäras i flera år. Investera i högre kvalitet på basen (ytterkläder, skor, jeans) och håll i resten.",
      },
    ],
    related: {
      styles: ["minimalism", "casual"],
      colors: ["beige", "svart", "vit"],
    },
  },
  {
    slug: "bygg-en-grundgarderob",
    title: "Bygg en grundgarderob — capsule wardrobe på svenska",
    intro:
      "En grundgarderob, eller capsule wardrobe, är en kärngarderob där varje plagg går att kombinera med varje annat. För svenskt klimat behövs lager för fyra säsonger. Räkna med 30–40 plagg om man undantar underkläder och sportkläder.",
    metaDescription:
      "Guide till capsule wardrobe på svenska — så bygger du en grundgarderob med 30–40 plagg som täcker hela året.",
    totalTime: "PT30M",
    steps: [
      {
        name: "Definiera din färgpalett",
        text: "Välj tre baskärnfärger (t.ex. svart, vit, beige) och två accent-färger (t.ex. mörkgrönt, kamel). Varje nytt plagg måste passa minst en bas- och en accent-färg. Detta är vad som låter alla plagg kombineras.",
      },
      {
        name: "Skapa lager 1 — basplagg",
        text: "T-shirts (3–5), långärmad bas-topp (2–3), strumpor och underkläder. Detta är bas under allt annat och slits snabbast. Köp bra kvalitet men inte premium — de behöver ändå bytas ut.",
      },
      {
        name: "Skapa lager 2 — mellanlager",
        text: "Stickade tröjor (3–4), skjortor eller blusar (3–4), eventuellt en blazer. Detta är plagget som syns mest i en outfit och tål mer investering. Tänk material före färg.",
      },
      {
        name: "Skapa lager 3 — ytterplagg",
        text: "En vinterkappa, en regn- eller höstkappa, en lättare jacka för vår. Tre ytterplagg täcker alla temperaturer. Investera mest här — en bra kappa håller tio år.",
      },
      {
        name: "Skapa lager 4 — byxor och kjolar",
        text: "Två par jeans (en mörk, en ljus), ett par chinos, en mer formell byxa eller en kjol. Fyra underdelar räcker längre än de flesta tror om passformen är rätt.",
      },
      {
        name: "Skapa skofloran",
        text: "Vita sneakers, läderboots, en mer formell sko (loafers, derbys, klacksko), regnboots eller -skor. Fyra par täcker alla situationer; fler är trevligt men inte nödvändigt.",
      },
      {
        name: "Audit:a en gång om året",
        text: "Vid ett tillfälle per säsong: gå igenom garderoben och ta ut vad du inte burit på 12 månader. Sälj eller skänk. En capsule wardrobe är inte statisk — den växer långsamt och rensas medvetet.",
      },
    ],
    related: {
      styles: ["minimalism", "casual"],
    },
  },
  {
    slug: "smart-casual-jobb",
    title: "Smart casual för jobb — så stylar du det",
    intro:
      "Smart casual är den mest använda dresscoden för moderna kontorsmiljöer. Den balanserar mellan formellt och avslappnat och kräver att man förstår vad som signalerar respekt utan att vara stelt.",
    metaDescription:
      "Guide till smart casual för jobbet. Så bygger du outfits som signalerar professionellt utan att vara stelt — för dam och herr.",
    totalTime: "PT10M",
    steps: [
      {
        name: "Välj underdel",
        text: "Mörka jeans utan slitningar, chinos i beige eller mörkgrön ton, eller en mörk mid-rise byxa eller kjol. Joggers, shorts eller jeans med hål hör inte hit. Längden ska vara klar — antingen klippt vid ankel eller på fotled.",
      },
      {
        name: "Bygg överdelen i lager",
        text: "Ett t-shirts-lager är för informellt; en blus eller skjorta är basen. Lägg en stickad tröja, en blazer eller en cardigan över. Två lager är minimum för att inte se underklädd ut.",
      },
      {
        name: "Välj skor som binder samman",
        text: "Läderskor eller minimalistiska sneakers (vita, beige eller svarta). Inga löparskor, inga klackar över 5 cm. Skon ska sitta rent under byxan och inte distrahera från resten.",
      },
      {
        name: "Håll accessoarerna kontrollerade",
        text: "Klocka, ett par diskreta örhängen eller en tunn kedja, en väska i läder eller canvas. Inga statement-smycken, inga synliga logotyper. Bältet matchas mot skon i ton.",
      },
      {
        name: "Justera efter företagskulturen",
        text: "På en advokatbyrå är smart casual närmare formellt; på ett techbolag närmare casual. Titta på chefen — kläd dig en nivå mer än kollegan, en nivå mindre än chefen. Det är säker zon.",
      },
    ],
    related: {
      styles: ["formal", "preppy"],
    },
  },
  {
    slug: "hostgarderob-sverige",
    title: "Höstgarderob för svenskt klimat",
    intro:
      "Svensk höst innebär plusgrader på dagen och nära nollan på kvällen, regn flera gånger i veckan, och stark variation mellan augusti och november. Garderoben måste tåla alla dessa på samma dag.",
    metaDescription:
      "Guide till svensk höstgarderob — plagg, material och lager som klarar regn, vind och temperaturskiften under hela hösten.",
    totalTime: "PT15M",
    steps: [
      {
        name: "Investera i en bra trenchcoat eller läderjacka",
        text: "Mellansäsongs-kappan är hösten viktigaste plagg. En trenchcoat i bomull eller gabardin tar regn och vind utan att bli för varm. Läderjacka funkar för torrare dagar och tål väder bättre än ull.",
      },
      {
        name: "Stickade plagg som mellanlager",
        text: "Två till tre stickade tröjor i olika tjocklek — en tunn (merinoull) som basplagg, en medium som ensamt överdel, en tjockare som ytterplagg under kappan. Mohair och kashmir är värmare men ömtåligare.",
      },
      {
        name: "Boots med ordentlig sula",
        text: "Läder- eller mocka-boots med gummisula tar både regn och friska promenader. Skinnet behandlas före säsongen med vax eller impregnering. Två par roteras för att hinna torka ut mellan användningar.",
      },
      {
        name: "Jeans och chinos i tjockare material",
        text: "Tunnare sommar-byxor byts mot 14oz+ denim eller chinos i kraftig bomull. Mörkare toner är hostsäsongens grundton. Veck och stryk hålls löst — höst är inte sommarens skarpa silhuett.",
      },
      {
        name: "Skydda mot regn",
        text: "Antingen en regnkappa över den vanliga kappan, eller ett paraply som ryms i väskan. Vid kraftigt regn (vanligt i oktober/november) är vattentät jacka ett måste. Vanliga ytterkläder klarar inte mer än duggregn.",
      },
      {
        name: "Halsduk och mössa när det krävs",
        text: "Från oktober blir halsduken obligatorisk. Tunn ylle är mångsidigast — funkar som accessoar tidigt i säsongen och som värme när det krävs. Mössa läggs till runt 5°C och under.",
      },
    ],
    related: {
      styles: ["minimalism", "casual"],
      colors: ["beige", "brun"],
    },
  },
  {
    slug: "stylar-baggy-jeans",
    title: "Hur stylar man baggy jeans",
    intro:
      "Baggy jeans har gått från statement till mainstream. Stilen kräver mer balansering än skinny jeans gjorde — när underdelen är voluminös måste resten av outfiten kompensera.",
    metaDescription:
      "Guide till baggy jeans — så balanserar du proportioner, skor, midja och överdel för en outfit som ser medveten ut snarare än stor.",
    totalTime: "PT8M",
    steps: [
      {
        name: "Balansera med ett fitted ovandel",
        text: "Volym i båda ändar gör hela outfiten amorf. En figursydd skjorta, en stickad tröja som sitter nära kroppen eller en vältuckad t-shirt skapar visuell motvikt. Oversize topp + baggy jeans funkar bara om ena är drastiskt kortare.",
      },
      {
        name: "Hantera midjan medvetet",
        text: "Baggy jeans sitter ofta lågt eller mid-rise. Tuckas överdelen in syns midjan — det smalar av hela siluetten. Bälte i kontrasterande färg drar ögat och definierar punkten där proportionerna skiftar.",
      },
      {
        name: "Välj sko med rätt profil",
        text: "Skon ska ta plats utan att slukas av jeansen. Sneakers med tjockare sula, loafers, eller chunky boots fungerar bäst. Tunna lågsneakers eller spetsiga finsko ser fel ut — de försvinner under tyget.",
      },
      {
        name: "Justera längden",
        text: "Baggy jeans ska antingen sluta strax över skon eller vika ner en gång ovanpå. Stack:ade (för långa, samlas vid foten) ger en specifik 90-tals-look. Avgör i förväg — mellanlägena ser ostädade ut.",
      },
      {
        name: "Lägg till en jacka som följer voluymen",
        text: "Bomberjacka, kort skinnjacka eller croppad trenchcoat. Långa raka kappor fungerar också om kappan har egen volym. Smala figursydda kappor krockar med jeansens silhuett.",
      },
    ],
    related: {
      styles: ["streetwear", "casual"],
      garments: [
        { gender: "dam", garment: "Jeans" },
        { gender: "herr", garment: "Jeans" },
      ],
    },
  },
];

export function findGuide(slug: string): Guide | null {
  const normalized = slug.toLowerCase();
  return GUIDES.find((g) => g.slug === normalized) ?? null;
}
