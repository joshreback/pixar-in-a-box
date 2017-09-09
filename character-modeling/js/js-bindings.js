window.onload = function() {
  document.getElementById("split").onclick = globals.splitHandler;
  document.getElementById("average").onclick = globals.averageHandler;
  globals = {
    animationSpeed: function() {
      return parseFloat(document.getElementById("animation-speed").value)
    }
  }
}