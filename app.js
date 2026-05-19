// --- SELECTEREN VAN HTML ELEMENTEN ---
// We selecteren nu ALLE schilderij-kaarten (zowel beschikbaar als gereserveerd)
const schilderijKaarten = document.querySelectorAll('.schilderij-kaart'); 
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const sluitKnop = document.querySelector('.sluit-knop');
// Nieuw: we selecteren ook de drie filterknoppen
const filterKnoppen = document.querySelectorAll('.filter-knop');

// --- DEEL 1: DE LIGHTBOX (Vergroten van de foto) ---
schilderijKaarten.forEach(kaart => {
    // We willen dat ALLEEN de beschikbare schilderijen klikbaar zijn
    if (kaart.classList.contains('beschikbaar')) {
        kaart.addEventListener('click', () => {
            const fotoBron = kaart.querySelector('img').src;
            const titelTekst = kaart.querySelector('h3').innerText;

            lightboxFoto.src = fotoBron;
            lightboxTitel.innerText = titelTekst;
            lightbox.style.display = 'block';
        });
    }
});

sluitKnop.addEventListener('click', () => {
    lightbox.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === lightbox) {
        lightbox.style.display = 'none';
    }
});

// --- DEEL 2: DE FILTERKNOPPEN ---
filterKnoppen.forEach(knop => {
    knop.addEventListener('click', () => {
        
        // Stap A: Zorg dat alleen de aangeklikte knop de donkere kleur (actief) krijgt
        filterKnoppen.forEach(k => k.classList.remove('actief'));
        knop.classList.add('actief');

        // Stap B: Kijk naar de tekst op de knop (alles, beschikbaar of gereserveerd)
        const filterWaarde = knop.innerText.toLowerCase(); 

        // Stap C: Loop door alle schilderijen heen en toon of verberg ze
        schilderijKaarten.forEach(kaart => {
            if (filterWaarde === 'alles') {
                kaart.style.display = ''; // Toon alles
            } else if (filterWaarde === 'beschikbaar') {
                if (kaart.classList.contains('beschikbaar')) {
                    kaart.style.display = ''; // Toon deze
                } else {
                    kaart.style.display = 'none'; // Verberg deze
                }
            } else if (filterWaarde === 'gereserveerd') {
                if (kaart.classList.contains('gereserveerd')) {
                    kaart.style.display = ''; // Toon deze
                } else {
                    kaart.style.display = 'none'; // Verberg deze
                }
            }
        });
        
    });
});
