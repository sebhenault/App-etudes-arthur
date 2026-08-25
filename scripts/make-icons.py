#!/usr/bin/env python3
"""Génère les icônes de l'application (PWA + natif).

Motif : une cible sur un dégradé bleu — la « Révision du jour » est l'action
principale de l'app, et une cible reste lisible à 60 px sur un écran d'accueil.

    pip install Pillow
    python3 scripts/make-icons.py

Produit dans public/icons/ : 192, 512, maskable-512, apple-touch-icon (180),
et assets/icon.png (1024, sans transparence) pour les builds natifs.
"""
import os
from PIL import Image, ImageDraw

HAUT = (108, 139, 255)   # dégradé : haut
BAS = (58, 86, 196)      # dégradé : bas
BLANC = (255, 255, 255)
ORANGE = (242, 153, 74)

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def degrade(taille: int) -> Image.Image:
    image = Image.new("RGB", (taille, taille), HAUT)
    dessin = ImageDraw.Draw(image)
    for y in range(taille):
        ratio = y / max(1, taille - 1)
        dessin.line(
            [(0, y), (taille, y)],
            fill=tuple(round(HAUT[i] + (BAS[i] - HAUT[i]) * ratio) for i in range(3)),
        )
    return image


def cible(taille: int, echelle: float = 1.0) -> Image.Image:
    """`echelle` < 1 réduit le motif : indispensable pour l'icône « maskable »,
    dont les bords peuvent être rognés par le système."""
    image = degrade(taille)
    dessin = ImageDraw.Draw(image)
    centre = taille / 2
    rayon = taille * 0.34 * echelle

    anneaux = [(rayon, BLANC), (rayon * 0.72, None), (rayon * 0.44, BLANC), (rayon * 0.18, ORANGE)]
    for r, couleur in anneaux:
        boite = [centre - r, centre - r, centre + r, centre + r]
        if couleur is None:
            # Anneau « creux » : on repeint le dégradé pour laisser voir le fond.
            fond = degrade(taille).crop([round(v) for v in boite])
            masque = Image.new("L", fond.size, 0)
            ImageDraw.Draw(masque).ellipse([0, 0, fond.size[0] - 1, fond.size[1] - 1], fill=255)
            image.paste(fond, (round(boite[0]), round(boite[1])), masque)
        else:
            dessin.ellipse(boite, fill=couleur)
    return image


def coins_arrondis(image: Image.Image, rayon_ratio: float = 0.22) -> Image.Image:
    taille = image.size[0]
    masque = Image.new("L", image.size, 0)
    ImageDraw.Draw(masque).rounded_rectangle(
        [0, 0, taille - 1, taille - 1], radius=round(taille * rayon_ratio), fill=255
    )
    arrondie = Image.new("RGBA", image.size, (0, 0, 0, 0))
    arrondie.paste(image, (0, 0), masque)
    return arrondie


def ecrire(image: Image.Image, chemin: str) -> None:
    complet = os.path.join(RACINE, chemin)
    os.makedirs(os.path.dirname(complet), exist_ok=True)
    image.save(complet)
    print(f"✓ {chemin} ({image.size[0]}×{image.size[1]})")


if __name__ == "__main__":
    # PWA : coins arrondis, transparence autorisée.
    ecrire(coins_arrondis(cible(192)), "public/icons/icon-192.png")
    ecrire(coins_arrondis(cible(512)), "public/icons/icon-512.png")
    # Maskable : fond plein bord à bord, motif réduit pour survivre au rognage.
    ecrire(cible(512, echelle=0.62), "public/icons/icon-maskable-512.png")
    # iOS applique lui-même le masque arrondi et refuse la transparence.
    ecrire(cible(180), "public/icons/apple-touch-icon.png")
    ecrire(cible(32), "public/icons/favicon-32.png")
    # Icône native (App Store / Android) : 1024, sans canal alpha.
    ecrire(cible(1024), "assets/icon.png")
    ecrire(coins_arrondis(cible(1024)), "assets/adaptive-icon.png")
