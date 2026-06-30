// app.js — Logique principale de l'application
import ROLES, { getRoleById, getNightOrder, NIGHT_ORDER_N1, NIGHT_ORDER_CLASSIC } from './roles.js';
import { PRESETS, suggestRoles, evaluateBalance } from './presets.js';

// ─── ÉTAT GLOBAL ──────────────────────────────────────────────────────────────

const state = {
  phase: 'setup',         // 'setup' | 'roles' | 'attribution' | 'game'
  players: [],            // [{ id, name, role, alive, effects, tokens }]
  activeRoleIds: [],      // rôles sélectionnés pour la partie
  nightNumber: 0,
  currentNightStep: 0,    // index dans l'ordre de nuit
  nightSteps: [],         // ordre calculé pour la nuit en cours
  nightLog: [],           // journal des actions nocturnes
  gameLog: [],            // journal global de la partie
  amoureux: [],           // [playerId, playerId]
  loupAmnesiaqueId: null, // id du joueur Loup Amnésique
  loupAmnesiaqueRevealed: false,
  loupNoirUsed: false,    // pouvoir du Loup Noir déjà utilisé
  grandMechantActif: true,// GML peut encore dévorer en double
  hypnoUsages: 0,         // utilisations restantes Hypnotiseur
  envoutes: [],           // joueurs envoûtés par le Joueur de Flûte
  parieurTokens: 2,
  gardeCorpsProtecting: null,   // id du joueur protégé cette nuit
  gardeCorpsLastProtected: null,
  protecteurProtecting: null,
  protecteurLastProtected: null,
  preset: null,
};

// ─── GESTION DES JOUEURS ──────────────────────────────────────────────────────

export function addPlayer(name) {
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  state.players.push({
    id,
    name: name.trim(),
    role: null,
    alive: true,
    effects: [],   // ['endormi', 'hypnotise', 'protege_physique', 'protege_total', 'envoute']
    tokens: 0,
  });
  return id;
}

export function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
}

export function getPlayers() { return state.players; }
export function getAlivePlayers() { return state.players.filter(p => p.alive); }

// ─── ATTRIBUTION DES RÔLES ────────────────────────────────────────────────────

/**
 * Attribue aléatoirement les rôles aux joueurs.
 * Le Loup Amnésique reçoit une carte "Villageois" visible.
 */
export function assignRoles(roleIds) {
  const shuffled = [...roleIds].sort(() => Math.random() - 0.5);
  const players = state.players;

  if (shuffled.length !== players.length) {
    throw new Error(`Nombre de rôles (${shuffled.length}) ≠ nombre de joueurs (${players.length})`);
  }

  players.forEach((p, i) => {
    const roleId = shuffled[i];
    p.role = roleId;

    // Le Loup Amnésique se voit attribuer une fausse carte villageois
    if (roleId === 'loup_amnesique') {
      state.loupAmnesiaqueId = p.id;
      p.visibleRole = 'villageois'; // ce que les autres voient
    } else {
      p.visibleRole = roleId;
    }
  });

  // Initialiser les tokens du Parieur
  const parieur = players.find(p => p.role === 'parieur');
  if (parieur) parieur.tokens = 2;

  state.activeRoleIds = roleIds;
  state.gameLog.push({ type: 'attribution', message: 'Rôles attribués aléatoirement.' });
}

// ─── NUIT ─────────────────────────────────────────────────────────────────────

export function startNight() {
  state.nightNumber++;
  state.nightLog = [];
  state.currentNightStep = 0;

  // Réinitialiser les effets nocturnes
  state.players.forEach(p => {
    p.effects = p.effects.filter(e => !['endormi', 'hypnotise'].includes(e));
  });
  state.gardeCorpsProtecting = null;
  state.protecteurProtecting = null;

  // Calculer l'ordre de nuit
  const order = state.nightNumber === 1 ? NIGHT_ORDER_N1 : NIGHT_ORDER_CLASSIC;
  state.nightSteps = buildNightSteps(order);

  state.gameLog.push({ type: 'nuit_debut', message: `Nuit ${state.nightNumber} commence.` });
  return state.nightSteps;
}

/**
 * Filtre et enrichit l'ordre de nuit selon les conditions actuelles.
 */
function buildNightSteps(order) {
  const aliveRoles = state.players.filter(p => p.alive).map(p => p.role);
  const steps = [];

  for (const roleId of order) {
    // Le rôle est-il présent et vivant ?
    if (!aliveRoles.includes(roleId) && roleId !== 'villageois') {
      // Exception : loup_amnesique peut ne pas être encore révélé
      if (roleId === 'loup_amnesique' && !state.loupAmnesiaqueRevealed) continue;
      if (roleId !== 'loup_amnesique') continue;
    }

    // Conditions spéciales
    if (roleId === 'loup_blanc' && state.nightNumber % 2 !== 0) continue; // nuits paires uniquement, et pas nuit 1
    if (roleId === 'loup_blanc' && state.nightNumber === 1) continue;
    if (roleId === 'grand_mechant_loup' && !state.grandMechantActif) continue;
    if (roleId === 'loup_noir' && state.loupNoirUsed) continue;
    if (roleId === 'hypnotiseur' && state.hypnoUsages >= 2) continue;
    if (roleId === 'loup_amnesique' && !state.loupAmnesiaqueRevealed) continue;

    // Instruction narrateur pour ce rôle
    const role = getRoleById(roleId);
    steps.push({
      roleId,
      roleName: role?.name || roleId,
      camp: role?.camp,
      instruction: getNarratorInstruction(roleId),
      conditional: getConditionLabel(roleId),
    });
  }

  return steps;
}

function getConditionLabel(roleId) {
  switch (roleId) {
    case 'loup_blanc': return 'Nuit paire uniquement';
    case 'grand_mechant_loup': return 'Seulement si tous ses compères sont vivants';
    case 'loup_noir': return 'Seulement s\'il n\'a pas encore utilisé son pouvoir';
    case 'hypnotiseur': return `Utilisations restantes : ${2 - state.hypnoUsages}`;
    case 'ancien_loup': return 'Seulement s\'il n\'a pas encore utilisé son pouvoir';
    default: return null;
  }
}

function getNarratorInstruction(roleId) {
  const instructions = {
    cupidon: 'Cupidon, ouvre les yeux. Désigne deux joueurs qui s\'aiment. Referme les yeux.',
    enfant_sauvage: 'Enfant Sauvage, ouvre les yeux. Désigne ton modèle. Referme les yeux.',
    chien_loup: 'Chien-Loup, ouvre les yeux. Montre-moi ton choix : Village ou Loups ? Referme les yeux.',
    soeurs: 'Les Sœurs s\'ouvrent les yeux, se reconnaissent, et referment les yeux.',
    ancien_loup: 'Ancien Loup, ouvre les yeux. Utilises-tu ta magie ancestrale cette nuit ? Referme les yeux.',
    pharmacien: 'Pharmacien, ouvre les yeux. Désigne un joueur à endormir. Referme les yeux.',
    voyante: 'Voyante, ouvre les yeux. Désigne un joueur dont tu veux connaître le rôle. (Montre-lui sa carte.) Referme les yeux.',
    hypnotiseur: 'Hypnotiseur, ouvre les yeux. Désigne un joueur à hypnotiser. Referme les yeux.',
    renard: 'Renard, ouvre les yeux. Désigne un groupe de 3 joueurs adjacents. (Indique-lui si l\'un est un loup.) Referme les yeux.',
    evaluateur: 'Évaluateur, ouvre les yeux. Désigne deux joueurs. (Indique-lui "même camp" ou "camps différents".) Referme les yeux.',
    protecteur: 'Protecteur, ouvre les yeux. Désigne un joueur à protéger des attaques physiques. Referme les yeux.',
    garde_du_corps: 'Garde du Corps, ouvre les yeux. Désigne un joueur à protéger de toutes les attaques. Referme les yeux.',
    parieur: 'Parieur, ouvre les yeux. Montre-moi ta mise en jetons et le joueur visé. Referme les yeux.',
    joueur_flute: 'Joueur de Flûte, ouvre les yeux. Désigne deux joueurs à envoûter. Referme les yeux.',
    loup_garou: 'Les Loups-Garous ouvrent les yeux. Désignez votre victime ensemble. Refermez les yeux.',
    loup_noir: 'Loup Noir, ouvre les yeux. Transformes-tu la victime en loup plutôt que de la dévorer ? Referme les yeux.',
    grand_mechant_loup: 'Grand Méchant Loup, ouvre les yeux. Désigne ta seconde victime. Referme les yeux.',
    loup_blanc: 'Loup Blanc, ouvre les yeux. Désigne un loup à dévorer, ou passe. Referme les yeux.',
    loup_amnesique: 'Loup Amnésique, tu t\'éveilles. Ouvre les yeux. Tu rejoins les loups. Désigne ta victime. Referme les yeux.',
    sorciere: 'Sorcière, ouvre les yeux. (Montre-lui la victime des loups.) Utilises-tu une potion ? Referme les yeux.',
    petite_fille: '(Petite Fille : a-t-elle espionné ? Si oui et repérée, elle est dévorée à la place.)',
  };
  return instructions[roleId] || `${roleId} : agis.`;
}

// ─── ACTIONS NOCTURNES ────────────────────────────────────────────────────────

export function getCurrentStep() {
  return state.nightSteps[state.currentNightStep] || null;
}

export function advanceNightStep() {
  state.currentNightStep++;
  return getCurrentStep();
}

export function recordNightAction(roleId, action) {
  state.nightLog.push({ roleId, action, night: state.nightNumber });
}

/**
 * Applique les résultats de la nuit et retourne la liste des morts.
 */
export function resolveNight(nightActions) {
  const deaths = [];
  const alive = getAlivePlayers();

  // 1. Appliquer l'Ancien Loup (blocage des pouvoirs)
  const ancienLoupAction = nightActions.find(a => a.roleId === 'ancien_loup');
  const pouvoirs_bloques = ancienLoupAction?.action?.block === true;

  // 2. Effets de protection
  const gardeTarget = nightActions.find(a => a.roleId === 'garde_du_corps')?.action?.target;
  const protectTarget = nightActions.find(a => a.roleId === 'protecteur')?.action?.target;
  if (gardeTarget) {
    const p = state.players.find(pl => pl.id === gardeTarget);
    if (p) p.effects.push('protege_total');
    state.gardeCorpsLastProtected = gardeTarget;
  }
  if (protectTarget) {
    const p = state.players.find(pl => pl.id === protectTarget);
    if (p) p.effects.push('protege_physique');
    state.protecteurLastProtected = protectTarget;
  }

  // 3. Pharmacien (endort)
  const pharmacienAction = nightActions.find(a => a.roleId === 'pharmacien');
  if (pharmacienAction && !pouvoirs_bloques) {
    const target = state.players.find(p => p.id === pharmacienAction.action?.target);
    if (target) {
      const isProtected = target.effects.includes('protege_total') || target.effects.includes('protege_physique');
      if (!isProtected) target.effects.push('endormi');
    }
  }

  // 4. Attaques des loups
  const loupVictim = nightActions.find(a => a.roleId === 'loup_garou')?.action?.target;
  const loupNoirConvert = nightActions.find(a => a.roleId === 'loup_noir')?.action?.convert;
  const gmlVictim = nightActions.find(a => a.roleId === 'grand_mechant_loup')?.action?.target;
  const loupBlancVictim = nightActions.find(a => a.roleId === 'loup_blanc')?.action?.target;

  // Résoudre la victime principale des loups
  if (loupVictim) {
    if (loupNoirConvert && !state.loupNoirUsed) {
      // Conversion au lieu de mort
      const target = state.players.find(p => p.id === loupVictim);
      if (target) {
        target.role = 'loup_garou';
        target.visibleRole = 'loup_garou';
        state.loupNoirUsed = true;
        state.nightLog.push({ type: 'conversion', playerId: loupVictim });
      }
    } else {
      deaths.push(...applyPhysicalAttack(loupVictim, 'loups'));
    }
  }

  // Victime supplémentaire du Grand Méchant Loup
  if (gmlVictim && state.grandMechantActif) {
    deaths.push(...applyPhysicalAttack(gmlVictim, 'grand_mechant_loup'));
  }

  // Victime du Loup Blanc
  if (loupBlancVictim) {
    const target = state.players.find(p => p.id === loupBlancVictim);
    if (target && target.alive) {
      target.alive = false;
      deaths.push({ playerId: loupBlancVictim, cause: 'loup_blanc' });
    }
  }

  // Sorcière
  const sorciereAction = nightActions.find(a => a.roleId === 'sorciere');
  if (sorciereAction && !pouvoirs_bloques) {
    if (sorciereAction.action?.save) {
      // Ressusciter la victime principale
      const saved = state.players.find(p => p.id === loupVictim);
      if (saved) {
        saved.alive = true;
        const idx = deaths.findIndex(d => d.playerId === loupVictim);
        if (idx > -1) deaths.splice(idx, 1);
      }
    }
    if (sorciereAction.action?.kill) {
      deaths.push(...applyPhysicalAttack(sorciereAction.action.kill, 'sorciere'));
    }
  }

  // Hypnotiseur (effet le lendemain, pas de mort)
  const hypnoAction = nightActions.find(a => a.roleId === 'hypnotiseur');
  if (hypnoAction && !pouvoirs_bloques) {
    const target = state.players.find(p => p.id === hypnoAction.action?.target);
    if (target && !target.effects.includes('protege_total')) {
      target.effects.push('hypnotise');
      state.hypnoUsages++;
    }
  }

  // Parieur : gain sur morts
  const parieurPlayer = state.players.find(p => p.role === 'parieur' && p.alive);
  const parieurAction = nightActions.find(a => a.roleId === 'parieur');
  if (parieurPlayer && parieurAction) {
    parieurPlayer.tokens += 1; // revenu passif
    const betTarget = parieurAction.action?.target;
    const betAmount = parieurAction.action?.amount || 0;
    if (betTarget && deaths.some(d => d.playerId === betTarget)) {
      parieurPlayer.tokens += betAmount * 2;
    }
    if (parieurPlayer.tokens >= 8) {
      state.gameLog.push({ type: 'victoire', camp: 'parieur', playerId: parieurPlayer.id });
    }
  }

  // Envoûtement (Joueur de Flûte)
  const fluteAction = nightActions.find(a => a.roleId === 'joueur_flute');
  if (fluteAction && !pouvoirs_bloques) {
    const targets = fluteAction.action?.targets || [];
    targets.forEach(id => {
      if (!state.envoutes.includes(id)) state.envoutes.push(id);
    });
  }

  // Vérifier la victoire par envoûtement
  const aliveAfter = getAlivePlayers();
  if (aliveAfter.length > 0 && aliveAfter.every(p => state.envoutes.includes(p.id))) {
    state.gameLog.push({ type: 'victoire', camp: 'joueur_flute' });
  }

  // Mettre à jour Grand Méchant Loup (un compère mort → pouvoir désactivé)
  const aliveWolves = aliveAfter.filter(p => ['loup_garou', 'loup_noir', 'grand_mechant_loup', 'loup_amnesique'].includes(p.role));
  const gml = state.players.find(p => p.role === 'grand_mechant_loup' && p.alive);
  if (gml && aliveWolves.length < state.players.filter(p => ['loup_garou', 'loup_noir', 'grand_mechant_loup', 'loup_amnesique'].includes(p.role)).length) {
    state.grandMechantActif = false;
  }

  // Effets des amoureux
  if (state.amoureux.length === 2) {
    const [a1id, a2id] = state.amoureux;
    const a1 = state.players.find(p => p.id === a1id);
    const a2 = state.players.find(p => p.id === a2id);
    if (a1 && a2) {
      if (!a1.alive && a2.alive) { a2.alive = false; deaths.push({ playerId: a2id, cause: 'chagrin' }); }
      if (!a2.alive && a1.alive) { a1.alive = false; deaths.push({ playerId: a1id, cause: 'chagrin' }); }
    }
  }

  // Chasseur : si mort, il tire
  deaths.forEach(d => {
    const dead = state.players.find(p => p.id === d.playerId);
    if (dead?.role === 'chasseur') {
      d.chasseurShot = true; // le narrateur devra demander sa cible
    }
  });

  state.gameLog.push({
    type: 'nuit_fin',
    night: state.nightNumber,
    deaths: deaths.map(d => d.playerId),
  });

  return { deaths, conversions: state.nightLog.filter(l => l.type === 'conversion') };
}

function applyPhysicalAttack(targetId, source) {
  const target = state.players.find(p => p.id === targetId);
  if (!target || !target.alive) return [];

  // Garde du Corps intercepte tout
  if (target.effects.includes('protege_total')) {
    const gdb = state.players.find(p => p.role === 'garde_du_corps' && p.alive);
    if (gdb) {
      gdb.alive = false;
      return [{ playerId: gdb.id, cause: 'garde_du_corps_interception', originalTarget: targetId }];
    }
  }

  // Protecteur intercepte les attaques physiques
  if (target.effects.includes('protege_physique')) {
    return []; // attaque absorbée
  }

  // Parieur peut survivre en dépensant 2 jetons
  if (target.role === 'parieur' && target.tokens >= 2) {
    target.tokens -= 2;
    // révélation publique gérée côté UI
    return [{ playerId: targetId, cause: source, survived: true, revealed: true }];
  }

  // Ancien : survit à la première attaque des loups
  if (target.role === 'ancien' && !target.ancienFirstHit) {
    target.ancienFirstHit = true;
    return [];
  }

  target.alive = false;
  return [{ playerId: targetId, cause: source }];
}

// ─── VOTE ET JOURNÉE ──────────────────────────────────────────────────────────

export function eliminateByVote(playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player || !player.alive) return null;

  player.alive = false;
  const role = getRoleById(player.role);

  // Effet Ancien : tous les villageois perdent leurs pouvoirs
  if (player.role === 'ancien' && player.ancienFirstHit) {
    state.gameLog.push({ type: 'ancien_malus', message: 'L\'Ancien a été éliminé au vote après avoir survécu — tous les villageois perdent leurs pouvoirs.' });
  }

  // Réveil Loup Amnésique si dernier loup éliminé au vote
  if (['loup_garou', 'loup_noir', 'grand_mechant_loup', 'loup_blanc'].includes(player.role)) {
    checkLoupAmnesique();
  }

  state.gameLog.push({ type: 'vote', playerId, role: player.role });
  return { player, role, chasseurShot: player.role === 'chasseur' };
}

function checkLoupAmnesique() {
  if (!state.loupAmnesiaqueId || state.loupAmnesiaqueRevealed) return;
  const otherWolvesAlive = state.players.some(p =>
    p.alive &&
    p.id !== state.loupAmnesiaqueId &&
    ['loup_garou', 'loup_noir', 'grand_mechant_loup', 'loup_blanc'].includes(p.role)
  );
  if (!otherWolvesAlive) {
    state.loupAmnesiaqueRevealed = true;
    state.gameLog.push({
      type: 'loup_amnesique_eveil',
      message: 'Le Loup Amnésique s\'éveille — annonce publique. Il jouera cette nuit.',
    });
  }
}

// ─── VICTOIRE ─────────────────────────────────────────────────────────────────

export function checkVictory() {
  const alive = getAlivePlayers();
  if (alive.length === 0) return { winner: 'personne', message: 'Tout le monde est mort.' };

  const wolves = alive.filter(p => ['loup_garou', 'loup_noir', 'grand_mechant_loup', 'loup_blanc', 'loup_amnesique'].includes(p.role));
  const village = alive.filter(p => p.camp === 'village' || p.role === 'villageois');

  // Amoureux
  if (state.amoureux.length === 2) {
    const [a1, a2] = state.amoureux.map(id => state.players.find(p => p.id === id));
    if (a1?.alive && a2?.alive && alive.length === 2) {
      return { winner: 'amoureux', message: `Les amoureux ${a1.name} & ${a2.name} gagnent !` };
    }
  }

  // Joueur de Flûte
  if (alive.every(p => state.envoutes.includes(p.id))) {
    return { winner: 'joueur_flute', message: 'Le Joueur de Flûte a envoûté tous les survivants !' };
  }

  // Parieur
  const parieur = alive.find(p => p.role === 'parieur');
  if (parieur?.tokens >= 8) {
    return { winner: 'parieur', message: `${parieur.name} le Parieur atteint 8 jetons — il gagne !` };
  }

  // Loup Blanc seul
  if (wolves.length === 1 && wolves[0].role === 'loup_blanc' && village.length === 0) {
    return { winner: 'loup_blanc', message: 'Le Loup Blanc est le dernier survivant !' };
  }

  // Loups gagnent si au moins autant que les non-loups
  if (wolves.length >= alive.filter(p => !wolves.includes(p)).length && wolves.length > 0) {
    return { winner: 'loups', message: 'Les Loups-Garous ont pris le contrôle du village !' };
  }

  // Village gagne si plus aucun loup
  if (wolves.length === 0) {
    return { winner: 'village', message: 'Le Village a éliminé tous les loups !' };
  }

  return null; // partie continue
}

// ─── ACCESSEURS D'ÉTAT ────────────────────────────────────────────────────────

export function getState() { return state; }
export function setPreset(presetId) { state.preset = presetId; }
export function setAmoureux(id1, id2) { state.amoureux = [id1, id2]; }
export function getGameLog() { return state.gameLog; }
export function getNightLog() { return state.nightLog; }

export default state;
