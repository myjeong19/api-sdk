export const themeScript = `
<script id="notionpresso-tweet-theme-script">
  if (!window.notionpressoTweetThemeInitialized) {
    window.notionpressoTweetThemeInitialized = true;
    
    function updateTwitterEmbedThemes() {
      const theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.querySelectorAll('.notionpresso-tweet-iframe').forEach(iframe => {
        let src = iframe.getAttribute('src');
        if (src) {
          if (src.includes('theme=')) {
            src = src.replace(/theme=(dark|light)/, 'theme=' + theme);
          } else {
            src += '&theme=' + theme;
          }
          iframe.setAttribute('src', src);
          iframe.parentElement?.setAttribute('data-theme', theme);
        }
      });
    }
    
    updateTwitterEmbedThemes();
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTwitterEmbedThemes);
  }
</script>
`;
