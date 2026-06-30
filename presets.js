// presets.js — Logique des presets et suggestions d'équilibrage

// ─── PRESETS PRÉDÉFINIS ───────────────────────────────────────────────────────

const PRESETS = {

  equilibre: {
    id: 'equilibre',
    name: 'Équilibré',
    description: 'Ratio loups/village classique, rôles simples. Idéal pour les groupes mixtes ou les nouveaux joueurs.',
    icon: '⚖️',
    rules: {
      wolfRatio: 0.25,          // ~1 loup pour 4 joueurs
      minVillagers: 2,          // au moins 2 villageois purs
      maxSolitaires: 1,
      preferTags: ['base', 'equilibre'],
      excludeTags: ['chaos'],
      maxCustomRoles: 2,
    },
  },

  chaos: {
    id: 'chaos',
    name: 'Chaos',
    description: 'Beaucoup de loups, de solitaires et de rôles complexes. Aucun villageois pur. Pas pour les débutants.',
    icon: '🔥',
    rules: {
      wolfRatio: 0.4,
      minVillagers: 0,          // aucun villageois pur obligatoire
      maxSolitaires: 3,
      preferTags: ['chaos', 'maison', 'puissant'],
      excludeTags: ['simple'],
      maxCustomRoles: 999,
    },
  },

  classique: {
    id: 'classique',
    name: 'Classique',
    description: 'Uniquement les rôles de la boîte de base. Nostalgique et accessible.',
    icon: '🎲',
    rules: {
      wolfRatio: 0.25,
      minVillagers: 3,
      maxSolitaires: 1,
      preferTags: ['base'],
      excludeTags: ['maison', 'extension', 'chaos'],
      maxCustomRoles: 0,
    },
  },

  social: {
    id: 'social',
    name: 'Social',
    description: 'Rôles centrés sur l\'information et la déduction. Peu de violence directe, beaucoup de débat.',
    icon: '🗣️',
    rules: {
      wolfRatio: 0.2,
      minVillagers: 2,
      maxSolitaires: 1,
      preferTags: ['information', 'equilibre'],
      excludeTags: ['chaos', 'puissant'],
      maxCustomRoles: 2,
    },
  },

  traitres: {
    id: 'traitres',
    name: 'Traîtres',
    description: 'Rôles à camp indéfini, conversions et retournements. On ne sait jamais qui est qui.',
    icon: '🎭',
    rules: {
      wolfRatio: 0.3,
      minVillagers: 1,
      maxSolitaires: 2,
      preferTags: ['traitre', 'indefini', 'conversion'],
      excludeTags: ['simple'],
      maxCustomRoles: 3,
    },
  },

  bien_contre_mal: {
    id: 'bien_contre_mal',
    name: 'Le Bien contre le Mal',
    description: 'Loups contre Village — tous les rôles des deux camps, sans solitaires ni neutres. Le bien et le mal, rien de plus.',
    icon: '⚔️',
    rules: {
      wolfRatio: 0.30,
      minVillagers: 3,
      maxSolitaires: 0,
      preferTags: ['base'],
      excludeTags: [],
      maxCustomRoles: 999,
    },
  },
};

// ─── MOTEUR DE SUGGESTION ─────────────────────────────────────────────────────

/**
 * Génère une composition de rôles en fonction du preset et du nombre de joueurs.
 * Respecte les rôles imposés par l'utilisateur.
 *
 * @param {number} playerCount - Nombre de joueurs
 * @param {string} presetId - ID du preset choisi
 * @param {string[]} forcedRoleIds - Rôles que l'utilisateur veut absolument inclure
 * @returns {{ roles: string[], warnings: string[] }}
 */
function suggestRoles(playerCount, presetId, forcedRoleIds = []) {
  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`Preset inconnu : ${presetId}`);

  const warnings = [];
  const { rules } = preset;

  // Rôles éligibles selon le preset et le nombre de joueurs
  const eligible = ROLES.filter(r => {
    if (r.minPlayers > playerCount) return false;
    if (rules.maxCustomRoles === 0 && r.custom) return false;
    if (rules.excludeTags.some(t => r.tags.includes(t))) return false;
    return true;
  });

  // Rôles forcés (vérification de compatibilité)
  const forced = forcedRoleIds.map(id => {
    const role = ROLES.find(r => r.id === id);
    if (!role) { warnings.push(`Rôle inconnu ignoré : ${id}`); return null; }
    if (role.minPlayers > playerCount) {
      warnings.push(`${role.name} recommande ${role.minPlayers} joueurs minimum — inclus quand même.`);
    }
    return role;
  }).filter(Boolean);

  // Calculer le nombre de loups cible
  const targetWolves = Math.max(1, Math.round(playerCount * rules.wolfRatio));

  // Compter les loups déjà forcés
  const forcedWolves = forced.filter(r => r.camp === 'loups').length;
  const forcedSolitaires = forced.filter(r => r.camp === 'solitaire').length;
  const forcedVillage = forced.filter(r => r.camp === 'village' && r.id !== 'villageois').length;

  const result = [...forced.map(r => r.id)];

  // Remplir les loups manquants
  const wolvesToAdd = Math.max(0, targetWolves - forcedWolves);
  const availableWolves = eligible
    .filter(r => r.camp === 'loups' && !result.includes(r.id))
    .sort((a, b) => {
      const aScore = rules.preferTags.filter(t => a.tags.includes(t)).length;
      const bScore = rules.preferTags.filter(t => b.tags.includes(t)).length;
      return bScore - aScore;
    });

  // Toujours au moins un loup-garou de base
  if (!result.includes('loup_garou') && wolvesToAdd > 0) {
    result.push('loup_garou');
    availableWolves.splice(availableWolves.findIndex(r => r.id === 'loup_garou'), 1);
  }

  let addedWolves = result.filter(id => ROLES.find(r => r.id === id)?.camp === 'loups').length - forcedWolves;
  for (const wolf of availableWolves) {
    if (addedWolves >= wolvesToAdd) break;
    if (!result.includes(wolf.id)) {
      result.push(wolf.id);
      addedWolves++;
    }
  }

  // Remplir les solitaires
  const solitairesToAdd = Math.max(0, rules.maxSolitaires - forcedSolitaires);
  const availableSolitaires = eligible
    .filter(r => (r.camp === 'solitaire' || r.camp === 'neutre') && !result.includes(r.id))
    .sort((a, b) => {
      const aScore = rules.preferTags.filter(t => a.tags.includes(t)).length;
      const bScore = rules.preferTags.filter(t => b.tags.includes(t)).length;
      return bScore - aScore;
    });

  let addedSol = 0;
  for (const sol of availableSolitaires) {
    if (addedSol >= solitairesToAdd) break;
    result.push(sol.id);
    addedSol++;
  }

  // Remplir les rôles village spéciaux
  const slotsLeft = playerCount - result.length - rules.minVillagers;
  const availableVillage = eligible
    .filter(r => r.camp === 'village' && r.id !== 'villageois' && !result.includes(r.id))
    .sort((a, b) => {
      const aScore = rules.preferTags.filter(t => a.tags.includes(t)).length;
      const bScore = rules.preferTags.filter(t => b.tags.includes(t)).length;
      return bScore - aScore;
    });

  let addedVillage = 0;
  for (const v of availableVillage) {
    if (addedVillage >= slotsLeft) break;
    result.push(v.id);
    addedVillage++;
  }

  // Compléter avec des villageois purs
  const remaining = playerCount - result.length;
  for (let i = 0; i < remaining; i++) {
    result.push('villageois');
  }

  // Limiter le nombre de rôles maison
  if (rules.maxCustomRoles < 999) {
    const customCount = result.filter(id => {
      const r = ROLES.find(ro => ro.id === id);
      return r?.custom && !forcedRoleIds.includes(id);
    }).length;
    if (customCount > rules.maxCustomRoles) {
      warnings.push(`Le preset "${preset.name}" recommande max ${rules.maxCustomRoles} rôle(s) maison — certains ont été retirés.`);
    }
  }

  return { roles: result, warnings };
}

/**
 * Évalue l'équilibre d'une composition de rôles.
 * Formule : Σ(village) + Σ(neutres × 0.5) − Σ(loups) − Σ(solitaires × 0.5)
 * Objectif : score le plus proche de 0 (positif = avantage village, négatif = avantage loups).
 */
function evaluateBalance(roleIds, playerCount) {
  const roles = roleIds.map(id => ROLES.find(r => r.id === id)).filter(Boolean);

  const wolvesRoles    = roles.filter(r => r.camp === 'loups' || r.camp === 'indefini');
  const villageRoles   = roles.filter(r => r.camp === 'village');
  const solitaireRoles = roles.filter(r => r.camp === 'solitaire');
  const neutreRoles    = roles.filter(r => r.camp === 'neutre');

  const sumVillage    = villageRoles.reduce((s, r)    => s + (r.value || 1.0), 0);
  const sumLoups      = wolvesRoles.reduce((s, r)     => s + (r.value || 4.0), 0);
  const sumSolitaires = solitaireRoles.reduce((s, r)  => s + (r.value || 2.5), 0);
  const sumNeutres    = neutreRoles.reduce((s, r)     => s + (r.value || 1.5), 0);

  // Score d'équilibre : 0 = parfait, positif = avantageux village, négatif = avantageux loups
  const balanceScore = sumVillage + sumNeutres * 0.5 - sumLoups - sumSolitaires * 0.5;

  // Limites recommandées
  const minWolves = Math.max(1, Math.floor(playerCount / 4));
  const maxWolves = Math.floor(playerCount / 3);
  const maxSolitaires = Math.floor(playerCount * 0.2);
  const minVillageois = Math.floor(playerCount * 0.15);
  const pureVillagers = roles.filter(r => r.id === 'villageois').length;

  const wolfCount = wolvesRoles.length;
  const solCount  = solitaireRoles.length;

  const remarks = [];
  // Score d'équilibre des valeurs (mis à l'échelle sur 100, centré sur 0)
  const normalizedScore = Math.max(0, Math.min(100, 50 + balanceScore * 5));

  if (wolfCount < minWolves)
    remarks.push(`Trop peu de loups — minimum recommandé : ${minWolves} pour ${playerCount} joueurs.`);
  if (wolfCount > maxWolves)
    remarks.push(`Beaucoup de loups — maximum recommandé : ${maxWolves} pour ${playerCount} joueurs.`);
  if (solCount > maxSolitaires)
    remarks.push(`Trop de solitaires (${solCount}) — maximum recommandé : ${maxSolitaires}.`);
  if (pureVillagers < minVillageois)
    remarks.push(`Peu de villageois purs (${pureVillagers}) — minimum recommandé : ${minVillageois}.`);
  if (roles.some(r => r.id === 'loup_amnesique') && pureVillagers < 2)
    remarks.push('⚠ Le Loup Amnésique doit être accompagné d\'au moins 2 Villageois purs — sans eux, il est trop facile à repérer parmi les rôles.');
  if (balanceScore < -3)
    remarks.push('Composition penchant fortement côté loups.');
  if (balanceScore > 5)
    remarks.push('Composition penchant fortement côté village.');

  const label =
    Math.abs(balanceScore) <= 1 ? 'Très équilibré' :
    Math.abs(balanceScore) <= 3 ? 'Équilibré' :
    Math.abs(balanceScore) <= 6 ? 'Déséquilibré' : 'Très déséquilibré';

  return {
    score: Math.round(normalizedScore),
    label,
    wolves: wolfCount,
    village: villageRoles.length,
    solitaires: solCount,
    ratio: Math.round((wolfCount / playerCount) * 100),
    balanceScore: Math.round(balanceScore * 10) / 10,
    remarks,
  };
}

