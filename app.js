// --- 1. FIREBASE INSTELLEN ---
const firebaseConfig = {
    apiKey: "AIzaSyBvA_Jck1PO6CDbI1cngZBpxO2ETAb9_GY",
    authDomain: "paintings-be46b.firebaseapp.com",
    projectId: "paintings-be46b",
    storageBucket: "paintings-be46b.firebasestorage.app",
    messagingSenderId: "176727832277",
    appId: "1:176727832277:web:aa51107213ed9d7a8b945c"
};

// Start Firebase op
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 2. SELECTEREN VAN HTML ELEMENTEN ---
const galerijContainer = document.querySelector('.galerij');
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const sluitKnop = document.querySelector('.sluit-knop');
const filterKnoppen = document.querySelectorAll('.filter-knop');

// --- 3. DATA OPHALEN EN OP HET SCHERM ZETTEN ---
async function laadSchilderijen() {
    // Maak de galerij leeg
    galerijContainer.innerHTML = ''; 

    // Haal alle documenten op uit de 'schilderijen' map in je database
    const querySnapshot = await db.collection("schilderijen").get();

    querySnapshot.forEach((doc) => {
        // Haal de gegevens van één schilderij op
        const data = doc.data();
        
        // Bouw een nieuw HTML-blokje voor dit schilderij
        const kaart = document.createElement('div');
        kaart.className = `schilderij-kaart ${data.status}`; // krijgt de class 'beschikbaar' of 'gereserveerd'

        let inhoud = `
            <img src="${data.afbeelding_url}" alt="${data.titel}">
            <h3>${data.titel}</h3>
        `;

        // Als het gereserveerd is, plakken we het label eroverheen
        if (data.status === 'gereserveerd') {
            inhoud += `<div class="status-label">Gereserveerd</div>`;
        }

        kaart.innerHTML = inhoud;

        // Als het beschikbaar is, mag je erop klikken om de lightbox te openen
        if (data.status === 'beschikbaar') {
            kaart.addEventListener('click', () => {
                lightboxFoto.src = data.afbeelding_url;
                lightboxTitel.innerText = data.titel;
                lightbox.style.display = 'block';
            });
        }

        // Voeg het voltooide schilderij toe aan de galerij
        galerijContainer.appendChild(kaart);
    });
}

// --- 4. DE LIGHTBOX SLUITEN ---
sluitKnop.addEventListener('click', () => {
    lightbox.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === lightbox) {
        lightbox.style.display = 'none';
    }
});

// --- 5. DE FILTERKNOPPEN ---
filterKnoppen.forEach(knop => {
    knop.addEventListener('click', () => {
        // Pas het uiterlijk van de knop aan
        filterKnoppen.forEach(k => k.classList.remove('actief'));
        knop.classList.add('actief');

        const filterWaarde = knop.innerText.toLowerCase(); 
        
        // Zoek alle schilderijen die nu vers ingeladen zijn
        const alleKaarten = document.querySelectorAll('.schilderij-kaart');

        alleKaarten.forEach(kaart => {
            if (filterWaarde === 'alles') {
                kaart.style.display = '';
            } else if (filterWaarde === 'beschikbaar') {
                if (kaart.classList.contains('beschikbaar')) {
                    kaart.style.display = '';
                } else {
                    kaart.style.display = 'none';
                }
            } else if (filterWaarde === 'gereserveerd') {
                if (kaart.classList.contains('gereserveerd')) {
                    kaart.style.display = '';
                } else {
                    kaart.style.display = 'none';
                }
            }
        });
    });
});

// --- 6. START DE MACHINE ---
// Roep de functie aan zodra het bestand geladen wordt!
laadSchilderijen();
