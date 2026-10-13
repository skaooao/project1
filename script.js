function initializeGame() {
  const $ = (id) => document.getElementById(id);
  const initialState = () => ({
    currentScene: "shore", radioFrequency: 70, radioReady: false,
    fragmentA: false, fragmentB: false, firstRoute: "",
    buoyPhotoIsNew: false, antennaPosition: 0, hasBuoyTime: false,
    readLog: false, readMessage: false, photoOrderStep: 0,
    photosCorrect: false, endingChoice: ""
  });
  
  let state = initialState();
  let noticeTimer;
  const arrangements = [[2, 1, 3], [3, 1, 2], [1, 2, 3]];
  const captions = {
    1: "Departure: the research vessel begins its voyage",
    2: "Dumping site: waste is discharged into the sea",
    3: "Evacuation: the researcher leaves the vessel"
  };
  const say = (id, text) => { $(id).textContent = text; };
  const on = (id, callback) => $(id).addEventListener("click", callback);

  // These controls are added here so the existing HTML needs no new markup.
  const backButton = document.createElement("button");
  backButton.id = "ending-back";
  backButton.type = "button";
  backButton.textContent = "Return to the Cabin";
  backButton.hidden = true;
  $("ending-result").after(backButton);

  const logDialog = document.createElement("dialog");
  logDialog.id = "log-dialog";
  logDialog.setAttribute("aria-labelledby", "log-title");
  logDialog.innerHTML = `
    <h3 id="log-title">Research Log</h3>
    <p>We documented illegal waste dumping near the research vessel.
    The voyage photographs show our departure, the dumping site, and evacuation.
    Before leaving, I hid the evidence inside the cabin so it could be recovered.</p>
    <form method="dialog"><button autofocus>Close Log</button></form>`;
  document.body.append(logDialog);

  function showNotice(message) {
    clearTimeout(noticeTimer);
    say("notification", message);
    if (message) noticeTimer = setTimeout(() => say("notification", ""), 5000);
  }

  function updateProgress() {
    say("fragment-count", `Fragments: ${Number(state.fragmentA) + Number(state.fragmentB)} / 2`);
    say("signal-status", state.hasBuoyTime ? "Signal: 07:14 found" :
      state.radioReady ? "Signal: Detected" : "Signal: Unknown");
  }

  function updateDepth() {
    const underwater = ["shallow-water", "signal-buoy", "shipwreck", "ship-interior"]
      .includes(state.currentScene);
    if (!underwater) return;
    const y = window.scrollY;
    $(state.currentScene).style.backgroundColor = y < 120 ? "#0b405b" : y < 300 ? "#08344f" : "#061f37";
    if (state.currentScene === "shallow-water" && !state.fragmentA) {
      say("fish-message", y < 120 ? "Look carefully at the fish." : y < 300 ?
        "A numbered tag glints beneath the fading light." :
        "The signal grows stronger. Click the marked fish to investigate.");
    }
  }

  function showScene(id) {
    document.querySelectorAll(".scene").forEach((scene) => {
      scene.classList.toggle("active", scene.id === id);
    });
    state.currentScene = id;
    window.scrollTo(0, 0);
    updateDepth();
    const heading = $(id).querySelector("h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  function updateRadio() {
    if (state.radioFrequency === 73) state.radioReady = true;
    say("radio-frequency", `${state.radioFrequency.toFixed(1)} MHz`);
    say("radio-message", state.radioFrequency === 73 ?
      'A dated voice breaks through: "Research vessel... please find what we left behind."' :
      state.radioReady ? "Static returns, but you have saved the signal's location." :
      "Static fills the speakers...");
    $("dive-button").disabled = !state.radioReady;
    updateProgress();
  }

  function tune(change) {
    const wasReady = state.radioReady;
    state.radioFrequency = Math.max(70, Math.min(76, state.radioFrequency + change));
    updateRadio();
    if (!wasReady && state.radioReady) showNotice("The distress signal is clear enough to follow.");
  }
  on("frequency-down", () => tune(-1));
  on("frequency-up", () => tune(1));
  on("dive-button", () => {
    if (state.radioReady && window.confirm("Follow the ten-year-old signal into the sea?")) {
      showScene("shallow-water");
      showNotice("Investigate the marked fish, then choose your route.");
    }
  });

 on("marked-fish", () => {
  if (!state.fragmentA) {
    state.fragmentA = true;
    say("fish-message", "Fragment 07 collected.");
    showNotice("Collected fragment 07!");
  }
  updateProgress();
});

  $("marked-fish").addEventListener("mousemove", () => {
    if (!state.fragmentA) say("fish-message", "A metal tag is marked 07. Click the fish to collect it.");
  });

  function chooseRoute(route) {
    if (!state.firstRoute) {
      state.firstRoute = route;
      showNotice(route === "buoy" ? "You follow the signal before exploring the ship." :
        "Could someone still be inside? You approach the wreck first.");
    }
    showScene(route === "buoy" ? "signal-buoy" : "shipwreck");
  }
  on("water-to-buoy", () => chooseRoute("buoy"));
  on("water-to-wreck", () => chooseRoute("wreck"));
  const routes = {
    "water-to-shore": "shore", "buoy-to-water": "shallow-water",
    "buoy-to-wreck": "shipwreck", "wreck-to-water": "shallow-water",
    "wreck-to-buoy": "signal-buoy", "interior-to-wreck": "shipwreck"
  };
  Object.entries(routes).forEach(([button, scene]) => on(button, () => showScene(scene)));

  function renderBuoyPhoto() {
    $("buoy-photo").src = state.buoyPhotoIsNew ? "images/buoy-now.jpg" : "images/buoy-old.jpg";
    $("buoy-photo").alt = state.buoyPhotoIsNew ? "The buoy after the storm" : "The buoy ten years ago";
    say("photo-message", state.buoyPhotoIsNew ?
      "The storm exposed the old transmitter, causing it to broadcast the recording again." :
      "An archive photograph shows the transmitter before it was buried beneath the sand.");
  }
  function toggleBuoyPhoto() {
    state.buoyPhotoIsNew = !state.buoyPhotoIsNew;
    renderBuoyPhoto();
  }
  on("switch-photo", toggleBuoyPhoto);
  on("buoy-photo", toggleBuoyPhoto);


function updateAntenna() {
  say("antenna-position", `Position: ${state.antennaPosition}`);
  if (state.antennaPosition === 2 && !state.hasBuoyTime) {
    state.hasBuoyTime = true;
    showNotice("New clue: the recording time is 07:14.");
  }
  say(
    "antenna-message",
    state.hasBuoyTime
      ? "Recording time decoded and saved: 07:14."
      : "The signal is too weak to decode."
  );
  updateProgress();
}

  on("antenna-left", () => { state.antennaPosition = Math.max(-2, state.antennaPosition - 1); updateAntenna(); });
  on("antenna-right", () => { state.antennaPosition = Math.min(2, state.antennaPosition + 1); updateAntenna(); });

on("debris", () => {
  if (!state.fragmentB) {
    state.fragmentB = true;
    $("debris").classList.add("collected");
    say("debris-message", "Fragment 14 collected.");
    showNotice("Collected fragment 14!");
  }

  updateProgress();
});

  function openCabin() {
    const missing = [];
    if (!state.fragmentA) missing.push("fragment 07 from the marked fish");
    if (!state.fragmentB) missing.push("fragment 14 beneath the debris");
    if (!state.hasBuoyTime) missing.push("the recording time from the buoy");
    if (missing.length) {
      say("cabin-message", `Still needed: ${missing.join("; ")}.`);
    } else if ($("cabin-code").value.trim() !== "0714") {
      say("cabin-message", "Incorrect code. Combine the fragments using the recording time.");
    } else {
      say("cabin-message", "The cabin door opens.");
      showScene("ship-interior");
      showNotice("The ship interior is unlocked.");
    }
  }
  on("open-cabin", openCabin);
  $("cabin-code").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); openCabin(); }
  });

  on("read-log", () => {
    state.readLog = true;
    say("evidence-message", "The log documents illegal dumping. The researcher hid the evidence before evacuation.");
    logDialog.showModal();
    showNotice("Evidence found: the research log.");
  });
  on("play-recording", () => {
    state.readMessage = true;
    say("evidence-message", 'Recorded message: "I made it off the ship. I hid the evidence in the cabin. Find the photographs and report what was dumped here." The storm uncovered the old transmitter, replaying this ten-year-old message.');
    showNotice("Evidence found: the recorded message.");
  });

  function renderPhotos() {
    arrangements[state.photoOrderStep].forEach((number, index) => {
      const photo = $(`voyage-photo-${index + 1}`);
      photo.src = `images/voyage-${number}.jpg`;
      photo.alt = captions[number];
      photo.title = captions[number];
    });
    $("next-photo-order").disabled = state.photosCorrect;
    say("photo-order-message", state.photosCorrect ?
      "Correct order: departure, dumping site, evacuation. The route confirms the log." :
      "The photographs are out of order. Find departure, dumping site, then evacuation.");
  }
  on("next-photo-order", () => {
    if (state.photosCorrect) return;
    state.photoOrderStep = (state.photoOrderStep + 1) % arrangements.length;
    state.photosCorrect = state.photoOrderStep === 2;
    renderPhotos();
    if (state.photosCorrect) showNotice("The full voyage route is now documented.");
  });

  function updateEndingControls() {
    const finished = state.endingChoice !== "";
    backButton.hidden = finished;
    document.querySelectorAll(".ending-choices button").forEach((button) => {
      button.disabled = finished;
    });
  }
  function showEnding() {
    let text;
    if (state.endingChoice === "leave") {
      text = state.readLog && state.readMessage ?
        "UNRESOLVED SIGNAL — You know what happened, but leave the evidence behind. The dumping remains unreported." :
        "UNRESOLVED SIGNAL — You abandon the investigation before uncovering the truth.";
    } else if (state.endingChoice === "handover") {
      text = "TRUTH DISCOVERED — You hand the researcher's evidence to a research institution. Her account of illegal dumping can finally be investigated.";
    } else if (state.endingChoice === "publish") {
      text = "FULL REPORT PUBLISHED — The log, recording, and ordered voyage photographs expose the illegal dumping route. The researcher's evidence is finally public.";
    } else {
      text = state.readLog && state.readMessage ?
        "The researcher survived. The storm reactivated her old transmitter. Decide what to do with the evidence, or return to the cabin." :
        "You have not uncovered the full story. Return to the cabin to investigate, or leave the evidence behind.";
    }
    say("ending-result", text);
    updateEndingControls();
  }
  on("leave-shore", () => { state.endingChoice = "leave"; showEnding(); showScene("ending"); });
  on("finish-investigation", () => { state.endingChoice = ""; showEnding(); showScene("ending"); });
  on("ending-back", () => { if (!state.endingChoice) showScene("ship-interior"); });
  on("ending-leave", () => {
    if (state.endingChoice) return;
    state.endingChoice = "leave";
    showEnding();
  });
  function chooseEvidenceEnding(choice) {
    if (state.endingChoice) return;
    const missing = [];
    if (!state.readLog) missing.push("read the research log");
    if (!state.readMessage) missing.push("read the recorded message");
    if (choice === "publish" && !state.photosCorrect) missing.push("put the voyage photographs in order");
    if (missing.length) {
      say("ending-result", `Return to the cabin and ${missing.join("; ")}.`);
      return;
    }
    state.endingChoice = choice;
    showEnding();
  }
  on("ending-report", () => chooseEvidenceEnding("handover"));
  on("ending-publish", () => chooseEvidenceEnding("publish"));

  function resetGame() {
    state = initialState();
    if (logDialog.open) logDialog.close();
    showNotice("");
    document.querySelectorAll(".scene").forEach((scene) => {
      scene.style.removeProperty("visibility");
      scene.style.removeProperty("background-color");
    });
    $("debris").classList.remove("collected");
    $("cabin-code").value = "";
    say("cabin-message", "");
    say("fish-message", "Look carefully at the fish.");
    say("debris-message", "Something appears to be hidden underneath.");
    say("evidence-message", "Select an item to investigate.");
    say("ending-result", "");
    renderBuoyPhoto();
    updateRadio();
    updateAntenna();
    renderPhotos();
    updateEndingControls();
    showScene("shore");
  }
  on("restart-game", resetGame);
  window.addEventListener("scroll", updateDepth, { passive: true });
  resetGame();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGame, { once: true });
} else {
  initializeGame();
}
