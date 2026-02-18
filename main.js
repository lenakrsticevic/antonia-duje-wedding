document.addEventListener("DOMContentLoaded", () => {

    window.scrollTo(0, 0);

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);


    /* =========================
       1️⃣ AUTOMATSKI INTRO
    ========================== */

    const card = document.getElementById("card");
    const hero = document.querySelector(".hero");

    setTimeout(() => {
        card?.classList.add("flipped");
    }, 1600);

    setTimeout(() => {
        hero?.classList.add("sticky");
    }, 2800);


    /* =========================
       2️⃣ FULLSCREEN VIEWER
    ========================== */

    const openBtn = document.getElementById("openBtn");
    const viewer = document.getElementById("viewer");
    const viewerImg = document.getElementById("viewer-img");
    const closeViewer = document.getElementById("closeViewer");
    const nextSlide = document.getElementById("nextSlide");

    const slides = [
        "assets/invite-front.webp",
        "assets/invite-back.webp"
    ];

    let current = 0;

    function openViewer() {
        current = 0;
        viewerImg.src = slides[current];
        viewer.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        viewer.classList.remove("active");
        document.body.style.overflow = "";
    }

    function next() {
        current = (current + 1) % slides.length;
        viewerImg.src = slides[current];
    }

    openBtn?.addEventListener("click", openViewer);
    closeViewer?.addEventListener("click", closeModal);
    nextSlide?.addEventListener("click", next);


    /* =========================
       3️⃣ SCROLL NA FORMU
    ========================== */

    const rsvpBtn = document.getElementById("rsvpBtn");
    const formSection = document.getElementById("formSection");

    rsvpBtn?.addEventListener("click", () => {
        formSection.scrollIntoView({
            behavior: "smooth"
        });
    });


    /* =========================
       4️⃣ DODAVANJE ČLANOVA
    ========================== */

    const membersContainer = document.getElementById("members-container");
    const addMemberBtn = document.getElementById("add-member");

    addMemberBtn?.addEventListener("click", () => {

        const row = document.createElement("div");
        row.className = "member-row";

        row.innerHTML = `
            <input type="text" name="memberNames[]" placeholder="Ime i prezime dodatnog člana" />
        `;

        membersContainer.appendChild(row);
    });

/* =========================
   5️⃣ SLANJE U GOOGLE SHEET
========================= */

const form = document.getElementById("rsvp-form");
const msg = document.getElementById("msg");

const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbzjjwwSSPJryeGb1FYgdpuEdKkoGJPcba9gRonuRERc2FbuwMbdZFtolE8Ztf5mCZ4e/exec";
const SECRET_TOKEN = "LENA2026";

form?.addEventListener("submit", async (e) => {

    e.preventDefault();

    msg.textContent = "Slanje u tijeku...";
    msg.className = "";

    const formData = new FormData(form);

    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const primaryName = formData.get("primaryName")?.toString().trim() || "";

    if (!email && !phone) {
        msg.textContent = "Molimo unesite e-mail ili broj mobitela.";
        msg.className = "message message--error";
        return;
    }

    if (!primaryName) {
        msg.textContent = "Molimo unesite barem jedno ime i prezime.";
        msg.className = "message message--error";
        return;
    }

    const members = [];

    // PRVI član (obavezni)
    members.push(primaryName);

    // Dodatni članovi
    document.querySelectorAll('input[name="memberNames[]"]').forEach(input => {
        const val = input.value.trim();
        if (val) members.push(val);
    });

    const payload = {
        familyName: formData.get("familyName") || "",
        email,
        phone,
        attending: formData.get("attending") || "",
        members,
        token: SECRET_TOKEN
    };

    try {

        const params = new URLSearchParams();

        Object.keys(payload).forEach(key => {
            if (key === "members") {
                params.set("members", JSON.stringify(payload.members));
            } else {
                params.set(key, payload[key]);
            }
        });

        const res = await fetch(ENDPOINT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString()
        });

        const data = await res.json();

        if (!data.ok) {
            msg.textContent = data.message || "Greška pri slanju.";
            msg.className = "message message--error";
            return;
        }

        msg.textContent = "Hvala! Vaš odgovor je zaprimljen.";
        msg.className = "message message--success";

        form.reset();

    } catch (err) {
        msg.textContent = "Greška pri slanju. Pokušajte ponovno.";
        msg.className = "message message--error";
    }

});


});
