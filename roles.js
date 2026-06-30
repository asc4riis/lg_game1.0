// roles.js — Base de données des rôles
// camp: 'village' | 'loups' | 'solitaire' | 'neutre' | 'indefini'
// value: puissance du rôle (Villageois = 1.0 référence absolue)
// custom: true = rôle maison

const ROLES = [
  // ─── VILLAGE ────────────────────────────────────────────────────────────────

  {
    id: 'villageois',
    name: 'Villageois',
    camp: 'village',
    nightOrder: null,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Aucun pouvoir particulier. Doit identifier et éliminer les loups par le vote.',
    attackType: null,
    custom: false,
    minPlayers: 6,
    value: 1.0,
    tags: ['base', 'simple', 'equilibre'],
    notes: null,
  },
  {
    id: 'voyante',
    name: 'Voyante',
    camp: 'village',
    nightOrder: 6,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque nuit, découvre le rôle exact d\'un joueur de son choix.',
    attackType: null,
    custom: false,
    minPlayers: 6,
    value: 3.5,
    tags: ['base', 'information', 'equilibre'],
    notes: 'Voit le vrai rôle — le Loup Amnésique apparaît comme Villageois.',
  },
  {
    id: 'sorciere',
    name: 'Sorcière',
    camp: 'village',
    nightOrder: 13,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Possède une potion de vie (sauve la victime des loups) et une potion de mort (empoisonne un joueur). Une utilisation chacune par partie.',
    attackType: 'physical',
    custom: false,
    minPlayers: 7,
    value: 3.0,
    tags: ['base', 'polyvalent', 'equilibre'],
    notes: 'Apprend l\'identité de la victime des loups avant de décider. La potion de mort est une attaque physique — bloquée par Protecteur et Garde du Corps.',
  },
  {
    id: 'chasseur',
    name: 'Chasseur',
    camp: 'village',
    nightOrder: null,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Quand il meurt (quelle qu\'en soit la cause), il peut immédiatement abattre un joueur de son choix.',
    attackType: 'physical',
    custom: false,
    minPlayers: 7,
    value: 2.5,
    tags: ['base', 'riposte', 'equilibre'],
    notes: 'Son tir est une attaque physique — se déclenche immédiatement à sa mort, y compris si tué par les loups.',
  },
  {
    id: 'petite_fille',
    name: 'Petite Fille',
    camp: 'village',
    nightOrder: 14,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Peut entrouvrir les yeux pendant le réveil des loups pour tenter d\'identifier un loup. Si elle est surprise par un loup, elle est dévorée à sa place.',
    attackType: null,
    custom: false,
    minPlayers: 7,
    value: 1.5,
    tags: ['base', 'risque', 'information'],
    notes: 'Pouvoir entièrement géré par le narrateur — indiquer discrètement si elle a été vue.',
  },
  {
    id: 'ancien',
    name: 'Ancien',
    camp: 'village',
    nightOrder: null,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Survit à la première attaque des loups. Si éliminé ensuite par le village (vote), tous les villageois perdent leurs pouvoirs définitivement.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 2.0,
    tags: ['extension', 'resilience', 'chaos'],
    notes: 'Pas de réveil nocturne. Effet passif à sa mort par vote.',
  },
  {
    id: 'soeurs',
    name: 'Sœurs',
    camp: 'village',
    nightOrder: 4,
    nightOnly_n1: true,
    nightCondition: null,
    power: 'Se reconnaissent mutuellement la première nuit. Savent donc que l\'autre est du village.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 1.25,
    tags: ['extension', 'information', 'equilibre'],
    notes: 'Nécessite exactement 2 cartes Sœurs. Réveil uniquement nuit 1. Valeur par carte : 1.25 (bloc = 2.5).',
  },
  {
    id: 'chevalier',
    name: 'Chevalier à l\'épée rouillée',
    camp: 'village',
    nightOrder: null,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Si les loups le dévorent, le premier loup assis à sa gauche est infecté et mourra à la fin de la prochaine nuit.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 1.8,
    tags: ['extension', 'riposte', 'equilibre'],
    notes: 'Effet passif à sa mort. Le loup infecté meurt discrètement à la fin de la nuit suivante — le narrateur gère seul.',
  },
  {
    id: 'montreur_ours',
    name: 'Montreur d\'Ours',
    camp: 'neutre',
    nightOrder: null,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque matin, l\'ours grogne si l\'un de ses voisins immédiats est un loup (ou a rejoint les loups). Sinon, il reste silencieux.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 2.0,
    tags: ['extension', 'information', 'equilibre'],
    notes: 'Réveil au matin, pas la nuit. Effet passif — non redirigé. L\'information est publique.',
  },
  {
    id: 'pharmacien',
    name: 'Pharmacien',
    camp: 'village',
    nightOrder: 2,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque nuit, administre un somnifère à un joueur. Ce joueur ne se réveille pas et ne peut pas utiliser son pouvoir nocturne.',
    attackType: 'physical',
    custom: true,
    minPlayers: 8,
    value: 3.0,
    tags: ['maison', 'controle', 'chaos'],
    notes: 'Attaque physique — redirigée par le Garde du Corps, bloquée par le Protecteur.',
  },
  {
    id: 'hypnotiseur',
    name: 'Hypnotiseur',
    camp: 'village',
    nightOrder: 6,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Désigne un joueur. Le lendemain, ce joueur ne peut ni parler ni voter. Maximum 2 utilisations. Ne peut pas cibler la même personne deux nuits de suite, ni lui-même.',
    attackType: 'psychic',
    custom: true,
    minPlayers: 8,
    value: 2.5,
    tags: ['maison', 'controle', 'chaos'],
    notes: 'Attaque psychique — redirigée par le Garde du Corps uniquement (pas le Protecteur). Jeu après la Voyante dans le même créneau.',
  },
  {
    id: 'evaluateur',
    name: 'Évaluateur',
    camp: 'village',
    nightOrder: 7,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque nuit, choisit deux joueurs. Le narrateur répond uniquement "même camp" ou "camps différents".',
    attackType: null,
    custom: true,
    minPlayers: 8,
    value: 2.5,
    tags: ['maison', 'information', 'equilibre'],
    notes: 'Village = même camp entre eux. Loups = même camp. Chaque solitaire = camp distinct. Deux amoureux = même camp. Pouvoir informatif — non redirigé.',
  },
  {
    id: 'protecteur',
    name: 'Protecteur',
    camp: 'village',
    nightOrder: 8,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque nuit, protège un joueur contre les attaques physiques. Ne peut pas protéger la même personne deux nuits de suite. Peut se protéger lui-même.',
    attackType: null,
    custom: true,
    minPlayers: 8,
    value: 2.5,
    tags: ['maison', 'protection', 'equilibre'],
    notes: 'Bloque : loups, Grand Méchant Loup, Sorcière (mort), Pharmacien. Ne bloque PAS : Hypnotiseur, effets passifs.',
  },
  {
    id: 'garde_du_corps',
    name: 'Garde du Corps',
    camp: 'village',
    nightOrder: 9,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Carte révélée dès le début. Chaque nuit, protège un joueur en déviant vers lui toutes les attaques (physiques et psychiques). Ne peut pas se protéger lui-même ni protéger la même personne deux nuits de suite. Ne peut mourir que par interception.',
    attackType: null,
    custom: true,
    minPlayers: 9,
    value: 4.0,
    tags: ['maison', 'protection', 'equilibre'],
    notes: 'Bloque tout sauf les effets passifs. Révélé publiquement. Ne peut pas être voté.',
  },

  // ─── LOUPS ──────────────────────────────────────────────────────────────────

  {
    id: 'loup_garou',
    name: 'Loup-Garou',
    camp: 'loups',
    nightOrder: 11,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Se réveille avec les autres loups chaque nuit pour désigner une victime à dévorer.',
    attackType: 'physical',
    custom: false,
    minPlayers: 6,
    value: 4.0,
    tags: ['base', 'simple', 'equilibre'],
    notes: null,
  },
  {
    id: 'loup_noir',
    name: 'Infect Père des Loups',
    camp: 'loups',
    nightOrder: 12,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Joue avec les loups. Une fois par partie, peut choisir d\'infecter la victime plutôt que de la dévorer — elle conserve son rôle mais joue désormais pour les loups.',
    attackType: 'physical',
    custom: false,
    minPlayers: 9,
    value: 6,
    tags: ['extension', 'chaos', 'conversion'],
    notes: 'Se lève juste après les loups pour confirmer ou modifier l\'action. Le joueur transformé apprend son nouveau rôle discrètement.',
  },
  {
    id: 'grand_mechant_loup',
    name: 'Grand Méchant Loup',
    camp: 'loups',
    nightOrder: 13,
    nightOnly_n1: false,
    nightCondition: 'all_wolves_alive',
    power: 'Joue avec les loups. Tant que tous ses compères sont encore en vie, dévore une seconde victime supplémentaire chaque nuit.',
    attackType: 'physical',
    custom: false,
    minPlayers: 10,
    value: 5.5,
    tags: ['extension', 'puissant', 'chaos'],
    notes: 'Se lève après le Loup Noir. Si un seul compère est mort, le pouvoir disparaît définitivement.',
  },
  {
    id: 'loup_blanc',
    name: 'Loup Blanc',
    camp: 'loups',
    nightOrder: 14,
    nightOnly_n1: false,
    nightCondition: 'even_night',
    power: 'Se lève une nuit sur deux (à partir de la nuit 2) après les autres loups, et peut dévorer un loup de son choix. Objectif : être le dernier survivant.',
    attackType: 'physical',
    custom: false,
    minPlayers: 10,
    value: 3.5,
    tags: ['extension', 'traitre', 'chaos'],
    notes: 'Joue avec les loups normalement. Son action solitaire a lieu après tous les autres loups.',
  },
  {
    id: 'infect_pere',
    name: 'Grand Méchant Loup / Infect Père des Loups',
    camp: 'loups',
    nightOrder: 11,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Variante du loup de base avec capacités étendues selon la version jouée.',
    attackType: 'physical',
    custom: false,
    minPlayers: 8,
    value: 4.5,
    tags: ['extension', 'variante'],
    notes: 'À préciser selon la version locale. Peut être remplacé par Grand Méchant Loup.',
  },
  {
    id: 'chien_loup',
    name: 'Chien-Loup',
    camp: 'indefini',
    nightOrder: 3,
    nightOnly_n1: true,
    nightCondition: null,
    power: 'La nuit 1, choisit secrètement son camp : Village ou Loups. Rejoint ensuite ce camp définitivement.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 4.0,
    tags: ['extension', 'indefini', 'chaos'],
    notes: 'Comptabilisé côté loup par défaut (pire cas village). Recalcul possible après choix en nuit 1.',
  },
  {
    id: 'enfant_sauvage',
    name: 'Enfant Sauvage',
    camp: 'indefini',
    nightOrder: 2,
    nightOnly_n1: true,
    nightCondition: null,
    power: 'La nuit 1, choisit un joueur comme modèle. Si ce joueur meurt, l\'Enfant Sauvage devient loup-garou.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 4.0,
    tags: ['extension', 'indefini', 'conditonnel'],
    notes: 'Comptabilisé côté loup par défaut (pire cas village). Recalcul possible après choix en nuit 1.',
  },
  {
    id: 'ancien_loup',
    name: 'Ancien Loup',
    camp: 'loups',
    nightOrder: 1,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Une fois par partie, se lève en premier et active sa magie ancestrale : tous les non-loups ne peuvent pas utiliser leurs pouvoirs cette nuit.',
    attackType: null,
    custom: true,
    minPlayers: 9,
    value: 5.0,
    tags: ['maison', 'controle', 'chaos'],
    notes: 'Si non utilisé, il se lève quand même pour ne pas révéler quand il agit.',
  },
  {
    id: 'loup_amnesique',
    name: 'Loup Amnésique',
    camp: 'loups',
    nightOrder: 11,
    nightOnly_n1: false,
    nightCondition: 'amnesia_revealed',
    power: 'Distribué comme Villageois. Invisible à la Voyante (apparaît villageois). Redevient Loup dès que tous les autres loups sont morts.',
    attackType: 'physical',
    custom: true,
    minPlayers: 9,
    value: 3.0,
    tags: ['maison', 'tromperie', 'chaos'],
    notes: [
      'Si les loups le dévorent par mégarde : réveil immédiat, il joue dans le même tour.',
      'Si dernier loup mort en journée : annonce publique le matin, joue la nuit suivante.',
    ].join(' | '),
  },

  // ─── NEUTRES ────────────────────────────────────────────────────────────────

  {
    id: 'cupidon',
    name: 'Cupidon',
    camp: 'neutre',
    nightOrder: 1,
    nightOnly_n1: true,
    nightCondition: null,
    power: 'La nuit 1, désigne deux joueurs qui tombent amoureux. Si l\'un meurt, l\'autre meurt de chagrin. Les amoureux forment un camp à part — ils gagnent ensemble.',
    attackType: null,
    custom: false,
    minPlayers: 7,
    value: 1.0,
    tags: ['base', 'amoureux', 'chaos'],
    notes: 'Cupidon lui-même peut être l\'un des amoureux. Les amoureux sont prioritaires sur tous les autres camps pour la victoire.',
  },
  {
    id: 'renard',
    name: 'Renard',
    camp: 'neutre',
    nightOrder: 5,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque nuit, désigne un groupe de 3 joueurs adjacents. Le narrateur indique si au moins un est un loup. Si aucun n\'est loup, perd son pouvoir définitivement.',
    attackType: null,
    custom: false,
    minPlayers: 8,
    value: 1.5,
    tags: ['extension', 'information', 'equilibre'],
    notes: 'Pouvoir informatif — non redirigé. Peut continuer à jouer même sans pouvoir.',
  },

  // ─── SOLITAIRES ─────────────────────────────────────────────────────────────

  {
    id: 'ange',
    name: 'Ange',
    camp: 'solitaire',
    nightOrder: null,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Gagne immédiatement si éliminé par le vote lors du premier jour. Sinon, devient un Villageois ordinaire.',
    attackType: null,
    custom: false,
    minPlayers: 7,
    value: 2.0,
    tags: ['base', 'solitaire', 'chaos'],
    notes: 'Priorité de victoire maximale. Si non éliminé au vote du jour 1, perd son statut solitaire.',
  },
  {
    id: 'joueur_flute',
    name: 'Joueur de Flûte',
    camp: 'solitaire',
    nightOrder: 10,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Chaque nuit, envoûte deux joueurs. Gagne si tous les survivants sont envoûtés.',
    attackType: null,
    custom: false,
    minPlayers: 9,
    value: 4.5,
    tags: ['extension', 'solitaire', 'chaos'],
    notes: 'Les envoûtés ne le savent pas. Le Joueur de Flûte connaît ses envoûtés.',
  },
  {
    id: 'parieur',
    name: 'Parieur',
    camp: 'solitaire',
    nightOrder: 10,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Commence avec 2 jetons. Chaque nuit, mise des jetons sur un joueur — si ce joueur meurt cette nuit, récupère le double. Reçoit +1 jeton automatiquement chaque nuit. Peut survivre à une attaque en dépensant 2 jetons (identité révélée). Gagne s\'il atteint 8 jetons.',
    attackType: null,
    custom: true,
    minPlayers: 8,
    value: 2.5,
    tags: ['maison', 'solitaire', 'chaos'],
    notes: 'Défense passive (dépense jetons) — non redirigée. Victoire immédiate à 8 jetons.',
  },

  // ─── FAUCHEUSE ──────────────────────────────────────────────────────────────
  {
    id: 'faucheuse',
    name: 'Faucheuse',
    camp: 'village',
    nightOrder: 99,
    nightOnly_n1: false,
    nightCondition: null,
    power: 'Gagne avec le village, mais uniquement si elle est en vie à la fin. Dispose d\'une élimination nocturne unique, utilisable quand elle le souhaite. Perd ce pouvoir définitivement si elle vote un jour avec la majorité.',
    attackType: 'physical',
    custom: true,
    minPlayers: 7,
    value: 2.5,
    tags: ['maison', 'village', 'riposte'],
    notes: 'Convoquée chaque nuit sans révéler si son pouvoir est actif ou non. Se lève en dernier pour l\'effet dramatique.',
  },
];

// ─── ORDRE DES NUITS ──────────────────────────────────────────────────────────

const NIGHT_ORDER_N1 = [
  'cupidon',        // 1
  'enfant_sauvage', // 2
  'chien_loup',     // 3
  'soeurs',         // 4
  'ancien_loup',    // 5
  'pharmacien',     // 6
  'voyante',        // 7
  'hypnotiseur',    // 8
  'renard',         // 9
  'evaluateur',     // 10
  'protecteur',     // 11
  'garde_du_corps', // 12
  'parieur',        // 13
  'joueur_flute',   // 14
  'loup_garou',     // 15
  'loup_noir',      // 16
  'grand_mechant_loup', // 17
  'loup_blanc',     // 18 (skip nuit 1)
  'loup_amnesique', // 19 (conditionnel)
  'sorciere',       // 20
  'petite_fille',   // 21
  'faucheuse',      // 22 (toujours en dernier)
];

const NIGHT_ORDER_CLASSIC = [
  'ancien_loup',        // 1
  'pharmacien',         // 2
  'voyante',            // 3
  'hypnotiseur',        // 4
  'renard',             // 5
  'evaluateur',         // 6
  'protecteur',         // 7
  'garde_du_corps',     // 8
  'parieur',            // 9
  'joueur_flute',       // 10
  'loup_garou',         // 11
  'loup_noir',          // 12
  'grand_mechant_loup', // 13
  'loup_blanc',         // 14 (nuits paires)
  'loup_amnesique',     // 15 (conditionnel)
  'sorciere',           // 16
  'petite_fille',       // 17
  'faucheuse',          // 18 (toujours en dernier)
];

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

function getRoleById(id) {
  return ROLES.find(r => r.id === id) || null;
}

function getRolesByCamp(camp) {
  return ROLES.filter(r => r.camp === camp);
}

function getRolesByTag(tag) {
  return ROLES.filter(r => r.tags.includes(tag));
}

function getNightOrder(activeRoleIds, nightNumber) {
  const order = nightNumber === 1 ? NIGHT_ORDER_N1 : NIGHT_ORDER_CLASSIC;
  return order.filter(id => activeRoleIds.includes(id));
}
