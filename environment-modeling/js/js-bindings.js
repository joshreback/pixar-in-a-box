window.onload = function() {
  document.getElementById("midpoint").onclick = globals.generateMidpoint,
  document.getElementById("draw").onclick = globals.drawParabola,
  document.getElementById("toggle-string-art").onclick = globals.toggleStringArt,
  document.getElementById("skeleton").onclick = globals.generateSkeleton
}