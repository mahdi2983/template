# Handoff — Apex Mobile Detailing

## En bref

Site vitrine d'une seule page pour un service de detailing automobile à domicile à Charlotte (Caroline du Nord).
Il est pensé d'abord pour le téléphone, en mode sombre, et se manipule d'un seul pouce. Son but est de transformer
un visiteur mobile en appel ou en demande de réservation, en un minimum de gestes.

- **Stack :** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4 et `lucide-react`.
- **Aucun backend :** la page est entièrement statique, avec 119 kB de JavaScript au premier chargement. La
  réservation passe par SMS et par téléphone.
- **Langue :** le code, l'interface et la documentation technique (`README.md`) sont en anglais. Seul ce document
  est en français.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
npm run lint
npm run typecheck
```

## Contenu de la page (de haut en bas)

| Section | Fichiers | Rôle |
| --- | --- | --- |
| En-tête | `components/Header.tsx`, `components/OpenStatusPill.tsx` | Monogramme, nom, badge « Charlotte, NC » et pastille d'horaires. Le statut ouvert/fermé est calculé en direct sur le fuseau de Charlotte. |
| Hero | `components/HeroBento.tsx`, `components/LighthouseCard.tsx` | Accroche « Showroom shine in your driveway », arguments « eau et électricité embarquées », tuiles « 100 % autonome » et « 5.0 Google », carte de performance Lighthouse. |
| Avant / après | `components/BeforeAfterInteractive.tsx`, `components/PaintPanel.tsx` | Comparateur tactile qui répond au glissement horizontal, au tap et au clavier. Le défilement vertical de la page reste libre. |
| Forfaits | `components/ServiceBentoPricing.tsx`, `components/ServiceCard.tsx` | Les 3 forfaits, alimentés par des lignes au format Google Sheets. « Select » ouvre la réservation avec ce forfait déjà choisi. |
| Avis | `components/SocialProofTicker.tsx` | Note 5.0 et bandeau d'avis qui défile tout seul. Il se met en pause au toucher et devient une liste fixe si l'appareil demande moins d'animations. Chaque avis a ses miniatures avant/après. |
| FAQ | `components/QuickFaqAccordion.tsx` | Quatre questions (paiement, eau, pluie, zone desservie) en `<details>` natif, sans JavaScript. |
| Barre fixe | `components/StickyBottomBar.tsx` | Toujours visible en bas de l'écran : bouton d'appel direct avec pastille « Available Today », et bouton « Instant Estimate ». |
| Réservation | `components/BookingModal.tsx`, `components/BookingProvider.tsx` | Feuille qui monte du bas de l'écran pour faire l'estimation et envoyer la demande (détails ci-dessous). |

## Parcours de réservation

1. Le client ouvre la feuille depuis la barre fixe, où le forfait le plus populaire est présélectionné, ou depuis
   un forfait, qui est alors présélectionné.
2. Il choisit le forfait, le gabarit du véhicule, le jour souhaité et, s'il le veut, son code postal. Le gabarit
   ajuste le prix : Sedan ×1, SUV/Truck ×1,2, 3-Row ×1,4.
3. La fourchette de prix et la durée se recalculent en direct.
4. « Text my request » ouvre l'application Messages avec la demande déjà rédigée. Un bouton d'appel reste
   disponible.

Côté accessibilité :
- le focus clavier reste dans la feuille tant qu'elle est ouverte ;
- Échap ou un tap sur le fond la ferment ;
- la page derrière ne défile pas ;
- à la fermeture, le focus revient sur le bouton qui l'a ouverte.

## Où modifier quoi

| Élément | Fichier |
| --- | --- |
| Nom, téléphone, horaires, ville, rayon, note Google | `lib/site-config.ts` |
| Forfaits et tarifs | `lib/services.ts`, ou une vraie feuille Google via la variable `SERVICES_SHEET_URL` |
| Avis, FAQ, coefficients de gabarit | `lib/data.ts` |
| Couleurs et animations | `app/globals.css` |

## Images

Le projet ne contient encore aucune vraie photo. Tous les visuels sont générés en code : une peinture terne et
rayée pour « avant », une brillance céramique pour « après ». Ainsi, la page n'affiche jamais d'image cassée.

La section « Image placeholders » du `README.md` décrit, pour chaque emplacement, ce que la vraie photo doit
montrer, avec les dimensions conseillées et des noms de fichiers suggérés.

- **Slider principal :** passer `beforeSrc` et `afterSrc` au composant, dans `app/page.tsx`.
- **Miniatures d'avis :** déposer les fichiers dans `public/reviews/`, puis ajouter `beforeSrc` et `afterSrc` à
  l'avis concerné dans `lib/data.ts`. Les deux champs sont facultatifs : une miniature sans photo garde le rendu
  généré.
- **Logo :** remplacer `app/icon.svg` et le monogramme « A » dans `components/Header.tsx`.

## Vérifications effectuées

- **Qualité du code :** `tsc`, ESLint et `next build` passent sans erreur ni avertissement.
- **Affichage :** testé à 390 px (mobile) et à 1280 px (desktop). Sur desktop, le hero passe sur 4 colonnes et
  les forfaits sur 3 colonnes de même hauteur, sans défilement horizontal.
- **Slider :** le tap, les flèches du clavier et un geste annulé (défilement vertical) donnent les bonnes
  positions.
- **Réservation :**
  - le bon forfait est présélectionné ;
  - le prix se recalcule selon le gabarit ;
  - le SMS est correctement rédigé ;
  - Échap et le tap sur le fond ferment la feuille ;
  - le défilement et le focus sont restaurés à la fermeture.
- **Photos d'avis :** une image de test s'affiche bien via `next/image`, et la miniature sans photo garde le rendu
  généré.
- **Bug corrigé :** la feuille pouvait rester ouverte quand le navigateur met le rendu en pause, par exemple dans
  un onglet en arrière-plan. Une minuterie de secours garantit maintenant sa fermeture.

## Non testé

- **Glissement réel au doigt sur le slider.** Les tests ont été faits avec des événements simulés, car le panneau
  navigateur était masqué. À vérifier sur un vrai iPhone et un vrai Android.
- **Envoi réel du SMS.** Le lien `sms:` n'a pas pu être testé dans cet environnement.
- **Score Lighthouse réel.** La carte « 0.3s / 100/100 » est un texte marketing, pas une mesure.

## À faire avant la mise en ligne

1. **Numéro de téléphone.** `(704) 555-0142` est un numéro fictif réservé : le remplacer dans
   `lib/site-config.ts`.
2. **Avis.** Les 6 avis et le compteur « 127 reviews » sont des exemples. Il faut les remplacer par de vrais avis
   Google, car publier de faux avis est trompeur, et la FTC les sanctionne aux États-Unis.
3. **Performance.** Mesurer Lighthouse sur le site déployé avant de garder la carte « 0.3s / 100 ».
4. **URL de production.** Définir `NEXT_PUBLIC_SITE_URL` : elle sert aux métadonnées de partage et aux données
   structurées Google.
5. **Médias.** Fournir les photos et le logo (voir la section « Images »).
6. **Contenu.** Vérifier les horaires, le rayon d'intervention, les tarifs et les réponses de la FAQ.

## Pistes pour la suite

- Ajouter une image Open Graph pour un bel aperçu lors des partages sur les réseaux et par message.
- Brancher `SERVICES_SHEET_URL` sur la vraie feuille de tarifs.
- Déployer, par exemple sur Vercel.
- Mesurer les clics sur « Call now » et « Text my request ».
- Versionner le projet avec git : le dossier n'est pas encore un dépôt.
