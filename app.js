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
const formaatDropdown = document.getElementById('filter-formaat');

const formulierTitel = document.getElementById('formulier-titel');
const invulVelden = document.getElementById('invul-velden');
const koperNaamInput = document.getElementById('koper-naam');
const koperEmailInput = document.getElementById('koper-email');
const koperBerichtInput = document.getElementById('koper-bericht');
const bevestigKnop = document.getElementById('bevestig-reservering');

let huidigSchilderijId = null; 
let huidigeStatus = null;

let huidigeStatusFilter = 'alles';
let huidigeFormaatFilter = 'Alles';

// De debug container (Röntgen-bril)
const debugBalk = document.createElement('div');
debugBalk.style.backgroundColor = '#007bff';
debugBalk.style.color = 'white';
debugBalk.style.padding = '10px';
debugBalk.style.marginBottom = '20px';
debugBalk.style.borderRadius = '5px';
debugBalk.style.textAlign = 'center';
debugBalk.style.fontWeight = 'bold';
debugBalk.innerHTML = 'Systeem wordt gestart...';
galerijContainer.parentElement.insertBefore(debugBalk, galerijContainer); // Zet hem boven de galerij

async function laadSchilderijen() {
    galerijContainer.innerHTML = '<p style="text-align: center; width: 100%;">Schilderijen laden... ⏳</p>'; 
    
    try {
        const querySnapshot = await db.collection("schilderijen").orderBy("titel", "asc").get();
        galerijContainer.innerHTML = ''; 

        // RÖNTGEN: Hoeveel zitten er in de database?
        let totaalGevonden = querySnapshot.size;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const kaart = document.createElement('div');
            
            let f = "Onbekend";
            if (data.formaat) {
                f = String(data.formaat).trim();
            }
            
            const veiligeStatus = data.status || "beschikbaar";
            kaart.className = `schilderij-kaart ${veiligeStatus}`;
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

            if (veiligeStatus === 'gereserveerd') {
                inhoud += `<div class="status-label">Gereserveerd</div>`;
            }
            kaart.innerHTML = inhoud;

            kaart.addEventListener('click', () => {
                huidigSchilderijId = doc.id; 
                huidigeStatus = veiligeStatus;
                
                lightboxFoto.src = data.afbeelding_url;
                lightboxTitel.innerText = data.titel;
                lightboxFormaat.innerHTML = `Formaat: ${f} <br> Type: ${typeTekst} <br> Lijst: ${lijstTekst}`; 
                
                koperNaamInput.value = '';
                koperEmailInput.value = '';
                koperBerichtInput.value = ''; 
                
                if (veiligeStatus === 'beschikbaar') {
                    formulierTitel.innerText = "Interesse in dit schilderij?";
                    bevestigKnop.innerText = "Bevestig aanvraag";
                    invulVelden.style.display = 'flex';
                } else if (veiligeStatus === 'gereserveerd') {
                    const reservelijst = data.reservelijst || [];
                    if (reservelijst.length < 2) {
                        formulierTitel.innerText = "Schilderij is al gereserveerd. Wil je op de reservelijst?";
                        bevestigKnop.innerText = "Plaats op reservelijst";
                        invulVelden.style.display = 'flex';
                    } else {
                        formulierTitel.innerText = "Dit schilderij is gereserveerd en de reservelijst zit momenteel vol.";
                        invulVelden.style.display = 'none';
                    }
                }
                
                lightbox.style.display = 'block';
            });

            galerijContainer.appendChild(kaart);
        });
        
        // Stuur de gevonden data naar de filter
        pasFiltersToe(totaalGevonden);

    } catch (error) {
        console.error(error);
        galerijContainer.innerHTML = `<p style="color: red; text-align: center; width: 100%; font-weight: bold;">Fout bij inladen: ${error.message}</p>`;
        debugBalk.style.backgroundColor = 'red';
        debugBalk.innerHTML = `🚨 Fout: ${error.message}`;
    }
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
                reservelijst: [] 
            });
            alert("Bedankt voor je interesse! Het schilderij is voor je gereserveerd. Er wordt z.s.m. contact opgenomen.");
        } else if (huidigeStatus === 'gereserveerd') {
            await docRef.update({
                reservelijst: firebase.firestore.FieldValue.arrayUnion({
                    naam: naam,
                    email: email,
                    bericht: bericht
                })
            });
            alert("Je bent succesvol op de reservelijst geplaatst!");
        }
        
        lightbox.style.display = 'none';
        laadSchilderijen(); 

    } catch (error) {
        console.error("Fout: ", error);
        alert("Er ging iets mis. Probeer het later nog eens.");
    }
});

sluitKnop.addEventListener('click', () => { lightbox.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.style.display = 'none'; });

filterKnoppen.forEach(knop => {
    knop.addEventListener('click', () => {
        filterKnoppen.forEach(k => k.classList.remove('actief'));
        knop.classList.add('actief');

        huidigeStatusFilter = knop.innerText.toLowerCase(); 
        pasFiltersToe();
    });
});

if (formaatDropdown) {
    formaatDropdown.addEventListener('change', (e) => {
        huidigeFormaatFilter = e.target.value; 
        pasFiltersToe();
    });
}

function pasFiltersToe(totaalGevonden = "Onbekend") {
    const alleKaarten = document.querySelectorAll('.schilderij-kaart');
    let zichtbaarAantal = 0;

    alleKaarten.forEach(kaart => {
        let magTonenStatus = false;
        if (huidigeStatusFilter === 'alles') magTonenStatus = true;
        else if (huidigeStatusFilter === 'beschikbaar' && kaart.classList.contains('beschikbaar')) magTonenStatus = true;
        else if (huidigeStatusFilter === 'gereserveerd' && kaart.classList.contains('gereserveerd')) magTonenStatus = true;

        let magTonenFormaat = false;
        if (huidigeFormaatFilter === 'Alles') magTonenFormaat = true;
        else if (kaart.dataset.formaat === huidigeFormaatFilter) magTonenFormaat = true;

        if (magTonenStatus && magTonenFormaat) {
            kaart.style.display = '';
            zichtbaarAantal++;
        } else {
            kaart.style.display = 'none';
        }
    });
    
    // RÖNTGEN-UPDATE: Update de blauwe balk met de uitkomst!
    debugBalk.innerHTML = `🔍 Database vond: ${totaalGevonden} schilderijen | Filter staat op: '${huidigeStatusFilter}' & '${huidigeFormaatFilter}' | Zichtbaar op scherm: ${zichtbaarAantal}`;
}

laadSchilderijen();
