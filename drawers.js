handlers.drawer_slide = el => {
    if (!el.dataset.open) {
        el.style.transform = "translateY(16%)";
        el.dataset.open = "yes";
    } else {
        el.style.transform = "";
        el.dataset.open = "";
    }
    document.getElementById("drawer").play();
}
