document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     AUTOMATSKI ZOOM + FLIP
  ========================== */

  const card = document.getElementById("card");
  const hero = document.querySelector(".hero");

  setTimeout(() => {
    card.classList.add("zoomed");

    setTimeout(() => {
      card.classList.add("flipped");
      hero.classList.add("sticky");
    }, 1200);

  }, 600);



  /* =========================
     OVERLAY OTVARANJE
  ========================== */

  const overlay = document.getElementById("overlay");
  const overlayImg = document.getElementById("overlayImage");
  const openOverlay = document.getElementById("openOverlay");
  const closeOverlay = document.getElementById("closeOverlay");
  const nextSide = document.getElementById("nextSide");

  let currentSide = "front";

  openOverlay?.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    overlayImg.src = "assets/invite-front.webp";
    currentSide = "front";
  });

  closeOverlay?.addEventListener("click", () => {
    overlay.classList.add("hidden");
  });

  nextSide?.addEventListener("click", () => {
    if (currentSide === "front") {
      overlayImg.src = "assets/invite-back.webp";
      currentSide = "back";
    } else {
      overlayImg.src = "assets/invite-front.webp";
      currentSide = "front";
    }
  });



  /* =========================
     SCROLL NA FORMU
  ========================== */

  const scrollBtn = document.getElementById("scrollToForm");
  const formSection = document.querySelector(".rsvp-section");

  scrollBtn?.addEventListener("click", () => {
    formSection.scrollIntoView({ behavior: "smooth" });
  });



  /* =========================
     DODAVANJE ČLANOVA
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
     SLANJE U GOOGLE SHEET
  ========================== */

  const form = document.getElementById("rsvp-form");
  const msg = document.getElementById("msg");

  const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbzjjwwSSPJryeGb1FYgdpuEdKkoGJPcba9gRonuRERc2FbuwMbdZFtolE8Ztf5mCZ4e/exec";
  const SECRET_TOKEN = "LENA2026";

  form?.addEventListener("submit", async (e) => {

    e.preventDefault();

    const submitBtn = form.querySelector(".submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Šalje se...";

    msg.textContent = "";

    const formData = new FormData(form);

    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";

    if (!email && !phone) {
      msg.textContent = "Molimo unesite e-mail ili broj mobitela.";
      msg.className = "message error";
      submitBtn.disabled = false;
      submitBtn.textContent = "Pošalji potvrdu";
      return;
    }

    const members = [];
    document.querySelectorAll('input[name="memberNames[]"]').forEach(input => {
      const val = input.value.trim();
      if (val) members.push(val);
    });

    const params = new URLSearchParams();
    params.set("familyName", formData.get("familyName"));
    params.set("email", email);
    params.set("phone", phone);
    params.set("attending", formData.get("attending"));
    params.set("members", JSON.stringify(members));
    params.set("token", SECRET_TOKEN);

    try {

      const res = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });

      const data = await res.json();

      if (!data.ok) throw new Error();

      msg.textContent = "Hvala, vaš odgovor je zaprimljen 💛";
      msg.className = "message success";

      form.reset();

    } catch (err) {
      msg.textContent = "Greška pri slanju. Pokušajte ponovno.";
      msg.className = "message error";
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Pošalji potvrdu";
  });

});
