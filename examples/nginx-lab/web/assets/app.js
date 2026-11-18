// nginx-lab — script statis kecil (dijamin cache 30 hari oleh location regex)
document.addEventListener("DOMContentLoaded", function () {
  var footer = document.querySelector("footer p");
  if (footer) {
    footer.textContent +=
      " · Dimuat pada " + new Date().toLocaleString("id-ID");
  }
});
