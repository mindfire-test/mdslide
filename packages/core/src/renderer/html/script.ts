import { presentorWindow } from './presentorWindow.js';
export const script = `

<script>

(function () {
  const slides = document.querySelectorAll('.slide');

  // Adjust font color for slides with background images
  slides.forEach(function (s) {
    const bgUrl = s.getAttribute('data-background-image');
    if (!bgUrl) return;

    const isDarkOverridden = bgUrl.toLowerCase().includes(' dark');
    const isLightOverridden = bgUrl.toLowerCase().includes(' light');

    if (isDarkOverridden) {
      s.classList.add('bgImageDark');
      return;
    }
    if (isLightOverridden) {
      s.classList.add('bgImageLight');
      return;
    }

    const cleanUrl = bgUrl.replace(/\s+(dark|light)$/i, '').trim();

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = cleanUrl;
    img.onload = function () {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const r = data[0];
        const g = data[1];
        const b = data[2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luminance < 140) {
          s.classList.add('bgImageDark');
        } else {
          s.classList.add('bgImageLight');
        }
      } catch (e) {
        s.classList.add('bgImageDark');
      }
    };
    img.onerror = function () {
      s.classList.add('bgImageDark');
    };
  });

  const deck = document.querySelector('.deck');

  function resizeDeck() {
    if (!deck) return;
    
    if (window.matchMedia('print').matches) {
      deck.style.transform = 'none';
      deck.style.position = 'relative';
      deck.style.left = 'auto';
      deck.style.top = 'auto';
      deck.style.marginLeft = '0';
      deck.style.marginTop = '0';
      return;
    }

    const width = 1920;
    const height = 1080;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    const scale = Math.min(windowWidth / width, windowHeight / height);

    deck.style.transform = 'scale(' + scale + ')';
    deck.style.position = 'absolute';
    deck.style.left = '50%';
    deck.style.top = '50%';
    deck.style.marginLeft = '-' + (width / 2) + 'px';
    deck.style.marginTop = '-' + (height / 2) + 'px';
  }

  window.addEventListener('resize', resizeDeck);
  window.addEventListener('load', resizeDeck);
  document.addEventListener('DOMContentLoaded', resizeDeck);
  resizeDeck();

  const progressBar = document.getElementById('progressBar');
  const hudCounter = document.getElementById('dokCounter');
  const btnPrev = document.getElementById('dokPrev');
  const btnNext = document.getElementById('dokNext');
  const btnFullscreen = document.getElementById('dokFullscreen');
  const btnPresenter = document.getElementById('dokPresenter');
  const helpModal = document.getElementById('helpModal');
  const btnCloseHelp = document.getElementById('closeHelpModal');

  let current = 0;
  let presenterWindow = null;
  let activeFragments = [];
  let currentFragmentIndex = -1;

  function show(index, direction) {
    slides.forEach(function (s, i) {
      const isCurrent = i === index;
      if (isCurrent) {
        s.classList.add('active');
        s.classList.remove('past');
      } else {
        s.classList.remove('active');
        if (i < index) {
          s.classList.add('past');
        } else {
          s.classList.remove('past');
        }
      }

      // Render time visual scaling calculation
      const content = s.querySelector('.slideContent');
      if (content && isCurrent) {
        content.style.transform = 'none';
        content.style.width = '100%';
        content.style.transformOrigin = 'top left';

        const slideHeight = s.clientHeight;
        const contentHeight = content.scrollHeight;
        const title = s.querySelector('.slideTitle');
        const titleHeight = title ? title.clientHeight : 0;
        const availableHeight = slideHeight - titleHeight - 160;

        if (contentHeight > availableHeight && availableHeight > 0) {
          const scale = availableHeight / contentHeight;
          if (scale >= 0.7) {
            content.style.transform = 'scale(' + scale + ')';
            content.style.width = 100 / scale + '%';
          }
        }
      }
    });

    // Update activeFragments for the current slide
    const currentSlide = slides[index];
    if (currentSlide) {
      // Sync body background image with current slide for seamless fullscreen coverage
      const bgImg = currentSlide.style.backgroundImage;
      if (bgImg) {
        document.body.style.backgroundImage = bgImg;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
      } else {
        document.body.style.backgroundImage = '';
      }

      activeFragments = Array.from(currentSlide.querySelectorAll('.fragment'));
      if (direction === 'forward') {
        activeFragments.forEach(function (f) { f.classList.remove('visible'); });
        currentFragmentIndex = -1;
      } else if (direction === 'backward') {
        activeFragments.forEach(function (f) { f.classList.add('visible'); });
        currentFragmentIndex = activeFragments.length - 1;
      } else {
        activeFragments.forEach(function (f) { f.classList.remove('visible'); });
        currentFragmentIndex = -1;
      }
    }

    // Update progress bar width
    if (progressBar && slides.length > 0) {
      const progress = ((index + 1) / slides.length) * 100;
      progressBar.style.width = progress + '%';
    }

    // Update DOK text counter
    if (hudCounter) {
      hudCounter.textContent = index + 1 + ' / ' + slides.length;
    }

    // Update presenter view if open
    updatePresenterContent();
  }

  // Hndler of next slide
  function nextSlide() {
    if (current < slides.length - 1) {
      current++;
      show(current, 'forward');
    }
  }

  // Hndler of previous slide
  function prevSlide() {
    if (current > 0) {
      current--;
      show(current, 'backward');
    }
  }

  function triggerNext() {
    if (currentFragmentIndex < activeFragments.length - 1) {
      currentFragmentIndex++;
      activeFragments[currentFragmentIndex].classList.add('visible');
      updatePresenterContent();
    } else {
      nextSlide();
    }
  }

  function triggerPrev() {
    if (currentFragmentIndex >= 0) {
      activeFragments[currentFragmentIndex].classList.remove('visible');
      currentFragmentIndex--;
      updatePresenterContent();
    } else {
      prevSlide();
    }
  }

  // Hndler of the full screen toggle
  function toggleFullscreen() {
    const docEl = document.documentElement;
    const requestFs = docEl.requestFullscreen || 
                      docEl.webkitRequestFullscreen || 
                      docEl.mozRequestFullScreen || 
                      docEl.msRequestFullscreen;
                      
    const exitFs = document.exitFullscreen || 
                   document.webkitExitFullscreen || 
                   document.mozCancelFullScreen || 
                   document.msExitFullscreen;
                   
    const fsElement = document.fullscreenElement || 
                      document.webkitFullscreenElement || 
                      document.mozFullScreenElement || 
                      document.msFullscreenElement;

    if (!fsElement) {
      if (requestFs) {
        try {
          const promise = requestFs.call(docEl);
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function (err) {
              console.error('Error enabling fullscreen:', err);
            });
          }
        } catch (err) {
          console.error('Error enabling fullscreen:', err);
        }
      }
    } else {
      if (exitFs) {
        exitFs.call(document);
      }
    }
  }

  function onFullscreenChange() {
    const fsElement = document.fullscreenElement || 
                      document.webkitFullscreenElement || 
                      document.mozFullScreenElement || 
                      document.msFullscreenElement;
    if (fsElement) {
      document.body.classList.add('mdslide-fullscreen');
    } else {
      document.body.classList.remove('mdslide-fullscreen');
      document.body.style.backgroundImage = '';
    }
    resizeDeck();
    
    // Multiple timeouts to handle animated fullscreen transitions (especially on macOS)
    setTimeout(resizeDeck, 100);
    setTimeout(resizeDeck, 300);
    setTimeout(resizeDeck, 600);
    setTimeout(resizeDeck, 1000);
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('mozfullscreenchange', onFullscreenChange);
  document.addEventListener('MSFullscreenChange', onFullscreenChange);

  // Handler of presenter window toggling
  function togglePresenterWindow() {
    if (presenterWindow && !presenterWindow.closed) {
      presenterWindow.close();
      presenterWindow = null;
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(function(el) { return el.outerHTML; })
      .join('\\n');

    const theme = document.documentElement.getAttribute('data-theme') || '';

    presenterWindow = window.open('', 'mdslide-presenter-' + Date.now(), 'width=1700,height=800');
    if (!presenterWindow) {
      alert('Pop-up blocked! Please allow pop-ups to open the Presenter View.');
      return;
    }

    const presenterHtml = \`${presentorWindow}\`
      .replace('<html>', '<html data-theme="' + theme + '">')
      .replace('$' + '{styles}', styles);

    presenterWindow.document.write(presenterHtml);
    presenterWindow.document.close();

    // Call update on open
    updatePresenterContent();
  }

  function updatePresenterContent() {
    if (!presenterWindow || presenterWindow.closed) return;

    const currentSlide = slides[current];
    const nextSlide = slides[current + 1];

    const currentPreview = presenterWindow.document.getElementById('current-preview');
    const nextPreview = presenterWindow.document.getElementById('next-preview');
    const notesContent = presenterWindow.document.getElementById('notes-content');

    if (currentPreview && currentSlide) {
      const clone = currentSlide.cloneNode(true);
      clone.classList.add('active');
      clone.classList.remove('past');
      clone.style.transform = 'none';
      clone.style.opacity = '1';
      clone.style.position = 'relative';

      // Cloned .slide is normally position:absolute inside .deck.
      // Force the wrapper to a known 1920x1080 box so it doesn't
      // collapse to 0 height, and so scalePreviews() has something
      // real to measure/scale.
      currentPreview.style.position = 'absolute';
      currentPreview.style.width = '1920px';
      currentPreview.style.height = '1080px';
      currentPreview.style.overflow = 'hidden';

      currentPreview.innerHTML = '';
      currentPreview.appendChild(clone);
    }

    if (nextPreview) {
      nextPreview.style.position = 'absolute';
      nextPreview.style.width = '1920px';
      nextPreview.style.height = '1080px';
      nextPreview.style.overflow = 'hidden';

      if (nextSlide) {
        const clone = nextSlide.cloneNode(true);
        clone.classList.add('active');
        clone.classList.remove('past');
        clone.style.transform = 'none';
        clone.style.opacity = '1';
        clone.style.position = 'relative';
        nextPreview.innerHTML = '';
        nextPreview.appendChild(clone);

        // Calculate and apply scaling to cloneContent
        const cloneContent = clone.querySelector('.slideContent');
        if (cloneContent) {
          cloneContent.style.transform = 'none';
          cloneContent.style.width = '100%';
          cloneContent.style.transformOrigin = 'top left';

          const slideHeight = clone.clientHeight || 1080;
          const contentHeight = cloneContent.scrollHeight;
          const title = clone.querySelector('.slideTitle');
          const titleHeight = title ? title.clientHeight : 0;
          const availableHeight = slideHeight - titleHeight - 160;

          if (contentHeight > availableHeight && availableHeight > 0) {
            const scale = availableHeight / contentHeight;
            if (scale >= 0.7) {
              cloneContent.style.transform = 'scale(' + scale + ')';
              cloneContent.style.width = 100 / scale + '%';
            }
          }
        }
      } else {
        nextPreview.innerHTML = '<div class="no-next">End of Presentation</div>';
      }
    }

    if (notesContent) {
      const notesElement = currentSlide.querySelector('.notes');
      if (notesElement && notesElement.textContent.trim()) {
        notesContent.innerHTML = notesElement.innerHTML;
      } else {
        notesContent.innerHTML = '<em style="color: #666;">No speaker notes for this slide.</em>';
      }
    }

    if (presenterWindow.scalePreviews) {
      presenterWindow.scalePreviews();
    }
  }

  // Handle messages from presenter window
  window.addEventListener('message', function (e) {
    if (e.data === 'next') {
      triggerNext();
    } else if (e.data === 'prev') {
      triggerPrev();
    } else if (e.data === 'togglePresenter') {
      togglePresenterWindow();
    }
  });

  // Navigation of keyBoard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      triggerNext();
    } else if (e.key === 'ArrowLeft') {
      triggerPrev();
    } else if (e.key === 'f') {
      toggleFullscreen();
    } else if (e.key === 'p' || e.key === 'P') {
      togglePresenterWindow();
    } else if (e.key === '?') {
      toggleHelp();
    }
  });

  function toggleHelp() {
    if (helpModal) {
      helpModal.classList.toggle('visible');
    }
  }

  // Floating DOK Display Vislibility on Mouse Move
  if (btnPrev) btnPrev.addEventListener('click', triggerPrev);
  if (btnNext) btnNext.addEventListener('click', triggerNext);
  if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);
  if (btnPresenter) btnPresenter.addEventListener('click', togglePresenterWindow);
  if (btnCloseHelp) btnCloseHelp.addEventListener('click', toggleHelp);
  if (helpModal) {
    helpModal.addEventListener('click', function (e) {
      if (e.target === helpModal) toggleHelp();
    });
  }

  // Floating DOK Display Visibility on Mouse Move
  let hudTimeout;
  document.body.classList.add('showDok');
  document.addEventListener('mousemove', function () {
    document.body.classList.add('showDok');
    clearTimeout(hudTimeout);
    hudTimeout = setTimeout(function () {
      document.body.classList.remove('showDok');
    }, 2500);
  });

  show(0);
})();

</script>

`;
