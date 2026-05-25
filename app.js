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
const typeDropdown = document.getElementById('filter-type');
const sfeerDropdown = document.getElementById('filter-sfeer');
const kleurtintDropdown = document.getElementById('filter-kleurtint');

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
let huidigeTypeFilter = 'Alles';
let huidigeSfeerFilter = 'Alles';
let huidigeKleurtintFilter = 'Alles';

let alleSchilderijen = [];
let huidigePagina = 1;
const itemsPerPagina = 50;

async function laadSchilderijen() {
    galerijContainer.innerHTML = '<p style="text-align: center; width: 100%;">Schilderijen laden... ⏳</p>'; 
    
    try {
        const querySnapshot = await db.collection("schilderijen").get();
        alleSchilderijen = [];
        
        querySnapshot.forEach((doc) => {
            alleSchilderijen.push({ id: doc.id, ...doc.data() });
        });

        alleSchilderijen.sort((a, b) => {
            return (a.titel || "").localeCompare(b.titel || "", undefined, { numeric: true });
        });
        
        huidigePagina = 1; 
        verwerkEnToonSchilderijen();

    } catch (error) {
        console.error(error);
        galerijContainer.innerHTML = `<p style="color: red; text-align: center; width: 100%; font-weight: bold;">Fout bij inladen: ${error.message}</p>`;
    }
}

function verwerkEnToonSchilderijen() {
    galerijContainer.innerHTML = '';
    
    const gefilterdeLijst = alleSchilderijen.filter(data => {
        let matchStatus = false;
        if (huidigeStatusFilter === 'alles') matchStatus = true;
        else if (huidigeStatusFilter === 'beschikbaar' && (data.status || "beschikbaar") === 'beschikbaar') matchStatus = true;
        else if (huidigeStatusFilter === 'gereserveerd' && data.status === 'gereserveerd') matchStatus = true;
        else if (huidigeStatusFilter === 'niet meer beschikbaar' && data.status === 'niet-beschikbaar') matchStatus = true;

        let matchFormaat = (huidigeFormaatFilter === 'Alles' || (data.formaat || "Onbekend") === huidigeFormaatFilter);
        let matchType = (huidigeTypeFilter === 'Alles' || (data.type || "Onbekend") === huidigeTypeFilter);
        let matchSfeer = (huidigeSfeerFilter === 'Alles' || (data.sfeer || "Overig") === huidigeSfeerFilter);
        
        // Matcht nu strak op de nieuwe dropdown opties
        let ktData = data.kleurtint || "Overig";
        let matchKleurtint = (huidigeKleurtintFilter === 'Alles' || ktData === huidigeKleurtintFilter);

        return matchStatus && matchFormaat && matchType && matchSfeer && matchKleurtint;
    });

    const totaalItems = gefilterdeLijst.length;
    const totaalPaginas = Math.ceil(totaalItems / itemsPerPagina) || 1;
    
    if (huidigePagina > totaalPaginas) huidigePagina = totaalPaginas;
    
    const startIndex = (huidigePagina - 1) * itemsPerPagina;
    const paginaItems = gefilterdeLijst.slice(startIndex, startIndex + itemsPerPagina);

    if (paginaItems.length === 0) {
        galerijContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #666; margin-top: 20px;">Geen schilderijen gevonden met deze filtercombinatie.</p>';
        return;
    }

    paginaItems.forEach((data) => {
        const kaart = document.createElement('div');
        
        const f = data.formaat || "Onbekend";
        const veiligeStatus = data.status || "beschikbaar";
        kaart.className = `schilderij-kaart ${veiligeStatus}`;
        kaart.dataset.formaat = f; 
        
        const typeTekst = data.type || "Onbekend";
        const lijstTekst = data.lijst || "Onbekend";
        const sfeerTekst = data.sfeer || "Overig";
        const kleurtintTekst = data.kleurtint || "Overig";

        let inhoud = `
            <img src="${data.afbeelding_url}" alt="${data.titel}" loading="lazy" style="transition: opacity 0.5s ease-in-out; background-color: #f0f0f0;">
            <h3>${data.titel}</h3>
            <p class="formaat-label">
                Formaat: ${f}<br>
                Type: ${typeTekst}<br>
                Lijst: ${lijstTekst}
            </p> 
        `;

        if (veiligeStatus === 'gereserveerd') {
            inhoud += `<div class="status-label">Gereserveerd</div>`;
        } else if (veiligeStatus === 'niet-beschikbaar') {
            inhoud += `<div class="status-label" style="background-color: #555; color: #fff;">Niet meer beschikbaar</div>`;
        }
        
        kaart.innerHTML = inhoud;

        if (veiligeStatus !== 'niet-beschikbaar') {
            kaart.addEventListener('click', () => {
                huidigSchilderijId = data.id; 
                huidigeStatus = veiligeStatus;
                
                lightboxFoto.src = data.afbeelding_url;
                lightboxTitel.innerText = data.titel;
                lightboxFormaat.innerHTML = `Formaat: ${f} <br> Type: ${typeTekst} <br> Sfeer: ${sfeerTekst} <br> Kleurtint: ${kleurtintTekst} <br> Lijst: ${lijstTekst}`; 
                
                koperNaamInput.value = '';
                koperEmailInput.value = '';
                koperBerichtInput.value = ''; 
                
                if (veiligeStatus === 'beschikbaar') {
                    formulierTitel.innerText = "Interesse in dit schilderij?";
                    bevestigKnop.innerText = "Bevestig reservering";
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
        } else {
            kaart.style.cursor = 'default';
            kaart.style.opacity = '0.75';
        }

        galerijContainer.appendChild(kaart);
    });

    if (totaalPaginas > 1) {
        const paginatieDiv = document.createElement('div');
        paginatieDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 15px; margin: 30px auto; width: 100%; clear: both; font-family: sans-serif;';
        
        const knopVorige = document.createElement('button');
        knopVorige.innerText = '← Vorige';
        knopVorige.disabled = huidigePagina === 1;
        knopVorige.style.cssText = 'padding: 8px 16px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
        if (huidigePagina === 1) knopVorige.style.opacity = '0.4';
        knopVorige.onclick = () => {
            huidigePagina--;
            verwerkEnToonSchilderijen();
            window.scrollTo({ top: galerijContainer.offsetTop - 120, behavior: 'smooth' });
        };

        const indicator = document.createElement('span');
        indicator.innerText = `Pagina ${huidigePagina} van ${totaalPaginas} (${totaalItems} items)`;
        indicator.style.cssText = 'color: #495057; font-size: 0.9em; font-weight: bold;';

        const knopVolgende = document.createElement('button');
        knopVolgende.innerText = 'Volgende →';
        knopVolgende.disabled = huidigePagina === totaalPaginas;
        knopVolgende.style.cssText = 'padding: 8px 16px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
        if (huidigePagina === totaalPaginas) knopVolgende.style.opacity = '0.4';
        knopVolgende.onclick = () => {
            huidigePagina++;
            verwerkEnToonSchilderijen();
            window.scrollTo({ top: galerijContainer.offsetTop - 120, behavior: 'smooth' });
        };

        paginatieDiv.appendChild(knopVorige);
        paginatieDiv.appendChild(indicator);
        paginatieDiv.appendChild(knopVolgende);
        galerijContainer.appendChild(paginatieDiv);
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

    bevestigKnop.disabled = true;
    const origineleTekst = bevestigKnop.innerText;
    bevestigKnop.innerText = "Bezig met controleren... ⏳";

    try {
        const gereserveerdeDocs = await db.collection("schilderijen").where("status", "==", "gereserveerd").get();
        let emailTelling = 0;

        gereserveerdeDocs.forEach(doc => {
            const d = doc.data();
            if (d.koper_email && d.koper_email.toLowerCase() === email.toLowerCase()) {
                emailTelling++;
            }
            if (d.reservelijst && Array.isArray(d.reservelijst)) {
                d.reservelijst.forEach(res => {
                    if (res.email && res.email.toLowerCase() === email.toLowerCase()) {
                        emailTelling++;
                    }
                });
            }
        });

        if (emailTelling >= 2) {
            alert("Let op: Je hebt het maximum van 2 reserveringen voor dit e-mailadres bereikt. Om iedereen een eerlijke kans te geven, is het helaas niet mogelijk om er meer te reserveren.");
            bevestigKnop.disabled = false;
            bevestigKnop.innerText = origineleTekst;
            return; 
        }

        bevestigKnop.innerText = "Bezig met opslaan... ⏳";
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
    } finally {
        bevestigKnop.disabled = false;
        bevestigKnop.innerText = origineleTekst;
    }
});

sluitKnop.addEventListener('click', () => { lightbox.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.style.display = 'none'; });

filterKnoppen.forEach(knop => {
    knop.addEventListener('click', () => {
        filterKnoppen.forEach(k => k.classList.remove('actief'));
        knop.classList.add('actief');
        huidigeStatusFilter = knop.innerText.toLowerCase(); 
        huidigePagina = 1; 
        verwerkEnToonSchilderijen();
    });
});

if (formaatDropdown) {
    formaatDropdown.addEventListener('change', (e) => {
        huidigeFormaatFilter = e.target.value; 
        huidigePagina = 1;
        verwerkEnToonSchilderijen();
    });
}
if (typeDropdown) {
    typeDropdown.addEventListener('change', (e) => {
        huidigeTypeFilter = e.target.value; 
        huidigePagina = 1;
        verwerkEnToonSchilderijen();
    });
}
if (sfeerDropdown) {
    sfeerDropdown.addEventListener('change', (e) => {
        huidigeSfeerFilter = e.target.value; 
        huidigePagina = 1;
        verwerkEnToonSchilderijen();
    });
}
if (kleurtintDropdown) {
    kleurtintDropdown.addEventListener('change', (e) => {
        huidigeKleurtintFilter = e.target.value; 
        huidigePagina = 1;
        verwerkEnToonSchilderijen();
    });
}

laadSchilderijen();
