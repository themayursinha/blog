// Add copy buttons to all code blocks
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('pre.highlight').forEach(function(pre) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'copy';
    btn.addEventListener('click', function() {
      var code = pre.querySelector('code') || pre;
      var text = code.textContent || code.innerText;
      navigator.clipboard.writeText(text).then(function() {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.textContent = 'copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    pre.appendChild(btn);
  });
});