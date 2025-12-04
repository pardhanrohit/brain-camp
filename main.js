// ---------- Scroll reveal for cards ----------
const cards = document.querySelectorAll(".card");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);
cards.forEach((card) => observer.observe(card));

// ---------- Background music play / stop ----------
const bgMusic = document.getElementById("bg-music");
const audioToggle = document.querySelector(".audio-toggle");
const audioIcon = document.getElementById("audio-icon");
const audioLabel = document.getElementById("audio-label");

function updateAudioUI() {
  if (!bgMusic || !audioToggle) return;
  if (bgMusic.paused) {
    audioIcon.textContent = "▶";
    audioLabel.textContent = "Play Ambient";
    audioToggle.setAttribute("aria-pressed", "false");
  } else {
    audioIcon.textContent = "⏸";
    audioLabel.textContent = "Pause Ambient";
    audioToggle.setAttribute("aria-pressed", "true");
  }
}

if (audioToggle) {
  audioToggle.addEventListener("click", async () => {
    if (!bgMusic) return;

    if (bgMusic.paused) {
      try {
        await bgMusic.play();
      } catch (err) {
        console.error("Error playing audio:", err);
        audioLabel.textContent = "Audio unavailable";
        audioIcon.textContent = "⛔";
        audioToggle.disabled = true;
      }
    } else {
      bgMusic.pause();
    }
  });
}

if (bgMusic) {
  bgMusic.addEventListener("play", updateAudioUI);
  bgMusic.addEventListener("pause", updateAudioUI);
  bgMusic.addEventListener("ended", updateAudioUI);
  bgMusic.addEventListener("error", (e) => {
    console.error("Audio error event:", e);
    audioLabel.textContent = "Audio unavailable";
    audioIcon.textContent = "⛔";
    if (audioToggle) audioToggle.disabled = true;
  });
}
updateAudioUI();

// ---------- Countdown timer ----------
const targetDate = new Date("2025-12-20T10:00:00");

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minutesEl = document.getElementById("cd-minutes");
  const secondsEl = document.getElementById("cd-seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  if (diff <= 0) {
    daysEl.textContent = "0";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;

  daysEl.textContent = days;
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(secs).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ---------- API base URL ----------
const API_BASE = "http://localhost:4000";

// Helper to show status messages
function showStatus(el, msg, isError = false) {
  el.textContent = msg;
  el.hidden = false;
  el.classList.toggle("error", isError);
}

// ---------- CONTACT FORM ----------
const contactForm = document.getElementById("contact-form");
const contactMsg = document.getElementById("contact-message");

if (contactForm && contactMsg) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("c-name").value.trim();
    const email = document.getElementById("c-email").value.trim();
    const school = document.getElementById("c-school").value.trim();
    const message = document.getElementById("c-message").value.trim();

    if (!name || !email || !message) {
      showStatus(
        contactMsg,
        "Please fill in at least name, email, and message.",
        true
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, school, message }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      showStatus(
        contactMsg,
        `Thanks, ${name}! Your message has been sent.`,
        false
      );
      contactForm.reset();
    } catch (err) {
      console.error(err);
      showStatus(
        contactMsg,
        "Something went wrong. Please try again later.",
        true
      );
    }
  });
}

// ---------- TICKET FORM ----------
const ticketForm = document.getElementById("ticket-form");
const ticketMsg = document.getElementById("ticket-status");

if (ticketForm && ticketMsg) {
  ticketForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("ticket-name").value.trim();
    const email = document.getElementById("ticket-email").value.trim();
    const type = document.getElementById("ticket-type").value;
    const quantity = parseInt(
      document.getElementById("ticket-quantity").value,
      10
    );

    if (!name || !email || !type || !quantity || quantity <= 0) {
      showStatus(ticketMsg, "Please fill all fields with valid values.", true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type, quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        showStatus(ticketMsg, data.error || "Registration failed.", true);
        return;
      }

      showStatus(
        ticketMsg,
        "Registration received! Check your email for confirmation (when configured).",
        false
      );
      ticketForm.reset();
      fetchCapacity(); // refresh capacity bar
    } catch (err) {
      console.error(err);
      showStatus(
        ticketMsg,
        "Something went wrong. Please try again later.",
        true
      );
    }
  });
}

// ---------- CAPACITY BAR ----------
const capacityFill = document.getElementById("capacity-fill");
const capacityLabel = document.getElementById("capacity-label");

async function fetchCapacity() {
  if (!capacityFill || !capacityLabel) return;
  try {
    const res = await fetch(`${API_BASE}/api/tickets/stats`);
    if (!res.ok) throw new Error("Failed to load stats");
    const data = await res.json();
    const { totalCapacity, usedSeats } = data;
    const percent = Math.min(
      100,
      Math.round((usedSeats / totalCapacity) * 100)
    );
    capacityFill.style.width = `${percent}%`;
    capacityLabel.textContent = `${usedSeats}/${totalCapacity} seats taken (${percent}%)`;
  } catch (err) {
    console.error(err);
    capacityLabel.textContent = "Unable to load capacity";
  }
}
fetchCapacity();
