const firebaseConfig = {
    apiKey: "AIzaSyBvA_Jck1PO6CDbI1cngZBpxO2ETAb9_GY",
    authDomain: "paintings-be46b.firebaseapp.com",
    projectId: "paintings-be46b",
    storageBucket: "paintings-be46b.firebasestorage.app",
    messagingSenderId: "176727832277",
    appId: "1:176727832277:web:aa51107213ed9d7a8b945c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const galerijContainer = document.querySelector('.galerij');
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const lightboxFormaat = document.getElementById('lightbox-formaat'); 
const sluitKnop = document.querySelector('.sluit-knop');
const filterKnoppen = document.querySelectorAll('.filter-knop');

// NIEUW: Pak de formaat dropdown
const formaatDropdown = document.getElementById('filter-formaat');

const formulierTitel = document.getElementById('formulier-titel');
const invulVelden = document.getElementById('invul-velden');
const koperNaamInput = document.getElementById('koper-naam');
const koperEmailInput = document.getElementById('koper-email');
const koperBerichtInput = document.getElementById('koper-bericht');
const bevestigKnop = document.getElementById('bevestig-reservering');

let huidigSchilderijId = null; 
let huidigeStatus = null;

// NIEUW: Sla op wat de actieve filters zijn
let huidigeStatusFilter = 'alles';
let huidigeFormaatFilter = 'Alles';

async function laadSchilderijen() {
    galerijContainer.innerHTML = ''; 
    const querySnapshot = await db.collection("schilderijen").orderBy("titel", "asc").get();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const kaart = document.createElement('div');
        
        // Zorg dat we het formaat veilig als tekst uitlezen (met een hoofdletter als basis)
        const f = data.formaat ? data.formaat.trim() : "Onbekend";
        
        // NIEUW: Zet ook het formaat als een verborgen 'dataset' op de kaart, 
        // zodat de filter er makkelijk naar kan zoeken.
        kaart.className = `schilderij-kaart ${data.status}`;
        kaart.dataset.formaat = f; 
        
        const typeTekst = data.type || "Onbekend";
        const lijstTekst = data.lijst || "Onbekend";

        let inhoud = `
            <img src="${data.afbeelding_url}" alt="${data.titel}">
            <h3>${data.titel}</h3>
            <p class="formaat-label">
                Formaat: ${f}<br>
                Type: ${typeTekst}<br>
                Lijst: ${lijstTekst}
            </p> 
        `;

        if (data.status === 'gereserveerd') {
            inhoud += `<div class="status-label">Gereserveerd</div>`;
        }
        kaart.innerHTML = inhoud;

        // Nu is ELK schilderij klikbaar, ook de gereserveerde!
        kaart.addEventListener('click', () => {
            huidigSchilderijId = doc.id; 
            huidigeStatus = data.status;
            
            lightboxFoto.src = data.afbeelding_url;
            lightboxTitel.innerText = data.titel;
            lightboxFormaat.innerHTML = `Formaat: ${f} <br> Type: ${typeTekst} <br> Lijst: ${lijstTekst}`; 
            
            koperNaamInput.value = '';
            koperEmailInput.value = '';
            koperBerichtInput.value = ''; 
            
            // Check status voor de reservelijst logica
            if (data.status === 'beschikbaar') {
                formulierTitel.innerText = "Interesse in dit schilderij?";
                bevestigKnop.innerText = "Bevestig aanvraag";
                invulVelden.style.display = 'flex';
            } else if (data.status === 'gereserveerd') {
                const reservelijst = data.reservelijst || [];
                if (reservelijst.length < 2) {
                    formulierTitel.innerText = "Schilderij is al gereserveerd. Wil je op de reservelijst?";
                    bevestigKnop.innerText = "Plaats op reservelijst";
                    invulVelden.style.display = 'flex';
                } else {
                    formulierTitel.innerText = "Dit schilderij is gereserveerd en de reservelijst zit momenteel vol.";
                    invulVelden.style.display = 'none'; // Verberg de velden
                }
            }
            
            lightbox.style.display = 'block';
        });

        galerijContainer.appendChild(kaart);
    });
    
    // Zodra alles geladen is, laat direct de actieve filters hun werk doen
    pasFiltersToe();
}

bevestigKnop.addEventListener('click', async () => {
    const naam = koperNaamInput.value.trim();
    const email = koperEmailInput.value.trim();
    const bericht = koperBerichtInput.value.trim(); 

    if (naam === '' || email === '') {
        alert('Vul alstublieft uw naam en e-mailadres in.');
        return;
    }

    try {
        const docRef = db.collection("schilderijen").doc(huidigSchilderijId);
        
        if (huidigeStatus === 'beschikbaar') {
            await docRef.update({
                status: 'gereserveerd',
                koper_naam: naam,
                koper_email: email,
                koper_bericht: bericht,
                reservelijst: [] // Start een lege reservelijst
            });
            alert("Bedankt voor je interesse! Het schilderij is voor je gereserveerd. Er wordt z.s.m. contact opgenomen.");
        } else if (huidigeStatus === 'gereserveerd') {
            // Voeg toe aan array
            await docRef.update({
                reservelijst: firebase.firestore.FieldValue.arrayUnion({
                    naam: naam,
